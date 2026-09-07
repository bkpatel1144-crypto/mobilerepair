/**
 * Replaces user-visible English strings with `t()` calls.
 *
 * Deliberately not an AST transform. A full codemod over 130 files would reprint every file
 * through a formatter's idea of the code, producing a diff nobody can review; these targeted
 * patterns leave every other byte of the file untouched, so the diff shows exactly the strings
 * that changed and nothing else.
 *
 * The safety rules that matter:
 *
 * 1. **Scope.** `t()` only exists inside a component that called `useTranslation()`. Every match
 *    is mapped to its enclosing top-level function by brace depth; a match at module scope (a
 *    `const columns = [...]` outside any component, say) is *skipped and reported*, never
 *    rewritten into a reference that doesn't exist.
 * 2. **Exact match only.** A string is replaced only if it matches a dictionary entry exactly,
 *    after trimming. No fuzzy matching, no partial substitution inside a longer sentence.
 * 3. **Never touches non-display strings.** Skips anything that looks like a class name, a route,
 *    an id, a Firestore field, or a `type`/`variant`/`key`/`value`/`name` attribute — those are
 *    code, and translating one silently breaks behaviour rather than appearance.
 */

const ATTR_DISPLAY = [
  'title',
  'subtitle',
  'label',
  'placeholder',
  'description',
  'message',
  'confirmLabel',
  'cancelLabel',
  'aria-label',
  'emptyTitle',
  'heading',
]

/** Attributes whose values are code, not copy. Translating one is a functional bug. */
const ATTR_FORBIDDEN = new Set([
  'className',
  'class',
  'type',
  'variant',
  'size',
  'key',
  'value',
  'name',
  'id',
  'htmlFor',
  'to',
  'href',
  'src',
  'align',
  'side',
  'role',
  'slug',
  'mode',
  'direction',
  'accept',
  'autoComplete',
  'inputMode',
  'data-testid',
])

/** Object-literal properties that hold display text in this codebase's table/column configs. */
const PROP_DISPLAY = ['header', 'label', 'title', 'description'];

/**
 * Top-level function bodies, as [start, end) character ranges keyed by name. Used to answer
 * "is this match inside a component, and which one?".
 */
function topLevelFunctions(src) {
  const ranges = []
  const decl =
    /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*(?:<[^>]*>)?\s*\(|^(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*(?::[^=]+)?=>/gm
  let m
  while ((m = decl.exec(src))) {
    const name = m[1] ?? m[2]
    // Walk forward to the first `{` that opens the body, then match braces to find its end.
    let i = src.indexOf('{', m.index + m[0].length - 1)
    if (i === -1) continue
    let depth = 0
    let end = -1
    let inStr = null
    for (let j = i; j < src.length; j++) {
      const c = src[j]
      const prev = src[j - 1]
      if (inStr) {
        if (c === inStr && prev !== '\\') inStr = null
        continue
      }
      if (c === '"' || c === "'" || c === '`') {
        inStr = c
        continue
      }
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) {
          end = j + 1
          break
        }
      }
    }
    if (end > i) ranges.push({ name, start: i, end })
  }
  return ranges
}

/**
 * The function a match belongs to: the nearest top-level declaration *before* it.
 *
 * Not "the range whose braces enclose it", which is what this did first and got wrong. Brace
 * matching needs to know where strings are, and apostrophes in ordinary JSX text — "can't",
 * "doesn't" — read as an opening quote, so a range would end early and everything after it
 * looked like module scope. That mislabelled 138 strings that were in fact inside components.
 *
 * Sequential attribution has its own failure mode — a genuine module-scope constant declared
 * *after* the last component would be attributed to that component — but it fails loudly:
 * `t()` is then referenced where it doesn't exist and tsc says so. An early-ending range failed
 * silently, by skipping work.
 */
function enclosing(ranges, index) {
  let best = null
  for (const r of ranges) {
    if (r.start <= index && (!best || r.start > best.start)) best = r
  }
  return best
}

/** A string worth translating: has a letter, isn't a route/class/identifier. */
function isDisplayString(s) {
  const t = s.trim()
  if (t.length < 2) return false
  if (!/[A-Za-z]/.test(t)) return false
  if (/^[a-z0-9-]+$/.test(t) && !t.includes(' ')) return false // slug/identifier
  if (t.startsWith('/') || t.startsWith('#') || t.startsWith('http')) return false
  if (/^[a-z]+[A-Z]/.test(t) && !t.includes(' ')) return false // camelCase identifier
  if (/(^|\s)(bg|text|flex|grid|border|rounded|size|p|px|py|m|mx|my|w|h)-/.test(t)) return false
  return true
}

/**
 * Rewrites `src`, replacing dictionary hits with `t(...)`.
 *
 * `dict` maps an exact English string to the full i18n key. Returns the new source, the set of
 * keys used, and every match that had to be skipped along with the reason — the skip list is the
 * point, not an afterthought: it is the list of strings a human still has to place.
 */
function transform(src, dict) {
  const ranges = topLevelFunctions(src)
  const used = new Set()
  const skipped = []
  const componentsTouched = new Set()

  // Collect edits first, apply right-to-left, so earlier offsets stay valid.
  const edits = []

  const consider = (matchIndex, full, english, replacement, context) => {
    const key = dict[english.trim()]
    if (!key) return
    if (!isDisplayString(english)) {
      skipped.push({ english, reason: 'not display text', context })
      return
    }
    const fn = enclosing(ranges, matchIndex)
    if (!fn) {
      skipped.push({ english, reason: 'module scope — t() not in scope', context })
      return
    }
    if (!/^[A-Z]/.test(fn.name)) {
      skipped.push({ english, reason: `inside non-component ${fn.name}()`, context })
      return
    }
    componentsTouched.add(fn.name)
    used.add(key)
    edits.push({ start: matchIndex, length: full.length, text: replacement(key) })
  }

  // 1. JSX attributes: title="Job Cards"  ->  title={t('key')}
  const attrRe = /\b([A-Za-z-]+)=("([^"\n]*)"|'([^'\n]*)')/g
  let m
  while ((m = attrRe.exec(src))) {
    const attr = m[1]
    if (ATTR_FORBIDDEN.has(attr)) continue
    if (!ATTR_DISPLAY.includes(attr)) continue
    const english = m[3] ?? m[4] ?? ''
    consider(m.index, m[0], english, (key) => `${attr}={t('${key}')}`, attr)
  }

  // 2. Object literal properties: header: 'Status'  ->  header: t('key')
  const propRe = new RegExp(`\\b(${PROP_DISPLAY.join('|')}):\\s*'([^'\\n]*)'`, 'g')
  while ((m = propRe.exec(src))) {
    consider(m.index, m[0], m[2], (key) => `${m[1]}: t('${key}')`, m[1])
  }

  // 3. Bare JSX text nodes: >Status<  ->  >{t('key')}<
  //    Restricted to a single line with no braces or tags inside, so nothing structural moves.
  const textRe = />([^<>{}\n]{2,80})</g
  while ((m = textRe.exec(src))) {
    const english = m[1]
    if (english.trim() !== english && english.trim().length === 0) continue
    consider(m.index, m[0], english, (key) => `>{t('${key}')}<`, 'jsx text')
  }

  edits.sort((a, b) => b.start - a.start)
  // Overlapping matches can happen where patterns meet; keep the first (right-most) and drop
  // any edit that would land inside one already applied.
  let out = src
  let lastStart = Infinity
  const applied = []
  for (const e of edits) {
    if (e.start + e.length > lastStart) continue
    out = out.slice(0, e.start) + e.text + out.slice(e.start + e.length)
    lastStart = e.start
    applied.push(e)
  }

  return { src: out, used, skipped, componentsTouched, appliedCount: applied.length }
}

/**
 * Adds `useTranslation` and a `const { t } = useTranslation()` line to each named component that
 * now needs one. Inserted immediately after the component's opening brace, which is always a
 * valid statement position and keeps the hook first — before any early return that might
 * otherwise skip it and break the rules of hooks.
 */
function ensureHook(src, componentNames) {
  let out = src

  for (const name of componentNames) {
    // Already has it?
    const fnRe = new RegExp(
      `((?:export\\s+)?function\\s+${name}\\s*(?:<[^>]*>)?\\s*\\([\\s\\S]*?\\)\\s*(?::[^{]+)?\\{)`
    )
    const m = fnRe.exec(out)
    if (!m) continue
    const bodyStart = m.index + m[1].length
    const bodyPreview = out.slice(bodyStart, bodyStart + 400)
    if (/const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation\(\)/.test(bodyPreview)) continue
    out = out.slice(0, bodyStart) + `\n  const { t } = useTranslation()` + out.slice(bodyStart)
  }

  if (/useTranslation/.test(out) && !/from 'react-i18next'/.test(out)) {
    // After the last *complete* import statement. Matching `^import .*$` line by line is wrong:
    // a multi-line `import {\n  a,\n} from 'x'` matches only its opening line, and inserting
    // there drops the new import inside the braces and breaks the file — which is exactly what
    // happened on the first run across src/. So match the whole statement, brace block included,
    // through its closing quote.
    const importStmt = /^import\s+[\s\S]*?from\s+['"][^'"]+['"];?$/gm
    const imports = [...out.matchAll(importStmt)]
    if (imports.length) {
      const last = imports[imports.length - 1]
      const at = last.index + last[0].length
      out = out.slice(0, at) + `\nimport { useTranslation } from 'react-i18next'` + out.slice(at)
    } else {
      out = `import { useTranslation } from 'react-i18next'\n` + out
    }
  }
  return out
}

module.exports = { transform, ensureHook, topLevelFunctions, isDisplayString }
