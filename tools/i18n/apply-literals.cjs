/**
 * Places the strings the attribute/prop/JSX-text patterns never saw — the ones inside JSX
 * expressions and call arguments: `x ? 'Active' : 'Inactive'`, `setError('Enter an amount')`,
 * `confirmLabel={isNew ? 'Add' : 'Save'}`.
 *
 * Detection comes from audit.cjs, which walks every string literal and excludes code contexts,
 * so this covers whatever that reports rather than a fixed list of shapes. Replacement is a
 * straight literal -> `t('key')` swap at the exact offset: these already sit in an expression
 * position, so no surrounding syntax has to change.
 *
 *   node tools/i18n/apply-literals.cjs --map        # write literal-map.json for translation
 *   node tools/i18n/apply-literals.cjs <prefix>...  # rewrite sources for translated keys
 */
const fs = require('fs')
const path = require('path')
const { isDisplayString, topLevelFunctions } = require('./codemod.cjs')

const ROOT = path.resolve(__dirname, '../..')
const LOCALES = path.join(ROOT, 'src/locales')

const CODE_ATTR =
  /\b(className|class|type|variant|size|key|value|name|id|htmlFor|to|href|src|path|align|side|role|slug|mode|direction|accept|autoComplete|inputMode|pattern|data-\w+)=\s*$/

function isCodeContext(before, after, text) {
  if (CODE_ATTR.test(before)) return true
  if (/\bt\(\s*$/.test(before)) return true
  if (/\bdefaultValue:\s*$/.test(before)) return true
  if (/\b(from|import|require\()\s*$/.test(before)) return true
  if (/^\s*:/.test(after)) return true
  if (/\b(queryKey|collection|doc|orderBy|where|field|fieldKey|eventKey|statusKey)\b[^=]*$/.test(before))
    return true
  if (/[=!]==?\s*$/.test(before)) return true
  if (/^\s*[=!]==?/.test(after)) return true
  if (/^[A-Za-z0-9:_-]+(\/[A-Za-z0-9:_-]+)+$/.test(text)) return true
  // A literal in a *type* position is a discriminant, not copy: `useState<'Raw Material' |
  // 'Service'>` and `'Service' as const` both slipped through, and translating a discriminant
  // changes what the code does rather than what it says. A single `|` before the literal is a
  // union member; `||` is a display fallback and must still be translated, hence the lookbehind.
  if (/^\s*(\||>|as\s+const)/.test(after)) return true
  if (/(?<!\|)\|\s*$/.test(before)) return true
  if (/<\s*$/.test(before)) return true
  if (
    /\.(includes|startsWith|endsWith|split|join|replace|replaceAll|match|test|indexOf|localeCompare)\(\s*$/.test(
      before
    )
  )
    return true
  return false
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'ui' ? [] : walk(full)
    return /\.tsx$/.test(e.name) && !/\.test\.tsx$/.test(e.name) ? [full] : []
  })
}

/** Blanks out comments while preserving offsets, so prose in a doc comment is never matched. */
function blankComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
}

function camel(s) {
  return s.replace(/[-_ ]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (c) => c.toLowerCase())
}

function namespaceFor(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  const parts = rel.replace(/\.tsx$/, '').split('/')
  const base = parts[parts.length - 1].replace(/-page$/, '')
  const dir = parts.includes('components')
    ? `components.${camel(parts[parts.length - 2])}`
    : `pages.${camel(parts[3] ?? parts[2]).replace(/Page$/, '')}`
  return `${dir}.${camel(base)}`
}

function slug(text) {
  const words = text
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
  return camel(words.join(' ').toLowerCase().replace(/ /g, '-')) || 'text'
}

/** Every literal worth translating, with the offsets needed to replace it. */
function findLiterals(file) {
  const src = fs.readFileSync(file, 'utf8')
  const stripped = blankComments(src)
  const ranges = topLevelFunctions(src)
  const out = []
  for (const m of stripped.matchAll(/'([^'\\\n]{2,120})'|"([^"\\\n]{2,120})"/g)) {
    const text = m[1] ?? m[2] ?? ''
    if (!isDisplayString(text)) continue
    const before = stripped.slice(Math.max(0, m.index - 120), m.index)
    const after = stripped.slice(m.index + m[0].length, m.index + m[0].length + 20)
    if (isCodeContext(before, after, text)) continue
    // Same scope rule as the main codemod: `t()` must actually exist here.
    let fn = null
    for (const r of ranges) if (r.start <= m.index && (!fn || r.start > fn.start)) fn = r
    // A literal that *is* a JSX attribute value needs braces around the call — `status="System"`
    // must become `status={t(...)}`, not `status=t(...)`, which is a syntax error. Everything else
    // is already inside an expression and takes the bare call.
    const isJsxAttr = /[A-Za-z-]+=\s*$/.test(before)
    out.push({ text, start: m.index, length: m[0].length, fn: fn?.name ?? null, isJsxAttr })
  }
  return { src, literals: out }
}

// ---- --map: build the key map for translation ------------------------------------------------
if (process.argv.includes('--map')) {
  const occurrences = new Map()
  for (const file of walk(path.join(ROOT, 'src'))) {
    const { literals } = findLiterals(file)
    for (const l of literals) {
      if (!occurrences.has(l.text)) occurrences.set(l.text, new Set())
      occurrences.get(l.text).add(namespaceFor(file))
    }
  }
  const existing = JSON.parse(fs.readFileSync(path.join(__dirname, 'key-map.json'), 'utf8'))
  const englishToKey = new Map(Object.entries(existing).map(([k, v]) => [v, k]))

  // Also reuse anything already sitting in the shared `common.*` bundle. Without this, "Cancel"
  // appearing inside a ternary would get its own `shared.cancel` key and a second, independent
  // translation — and the two could drift, so the same button would read differently on two
  // screens. The shared bundle is the whole point: one term, one translation.
  const enBundle = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'))
  for (const [k, v] of Object.entries(enBundle.common ?? {})) {
    if (typeof v === 'string' && !v.includes('{{') && !englishToKey.has(v)) {
      englishToKey.set(v, `common.${k}`)
    }
  }

  const map = {}
  const used = new Set(Object.keys(existing))
  for (const [text, namespaces] of occurrences) {
    // Reuse the key this exact string already has, so one string never gets two keys.
    const known = englishToKey.get(text)
    if (known) {
      map[known] = text
      continue
    }
    const base = namespaces.size > 1 ? 'shared' : [...namespaces][0]
    let key = `${base}.${slug(text)}`
    let n = 2
    while (used.has(key)) key = `${base}.${slug(text)}${n++}`
    used.add(key)
    map[key] = text
  }
  fs.writeFileSync(
    path.join(__dirname, 'literal-map.json'),
    JSON.stringify(map, null, 2) + '\n'
  )
  const fresh = Object.keys(map).filter((k) => !(k in existing)).length
  console.log(
    `${Object.keys(map).length} literals, ${fresh} needing new keys (the rest reuse an existing key)`
  )
  process.exit(0)
}

// ---- default: rewrite sources ---------------------------------------------------------------
const prefixes = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const dryRun = process.argv.includes('--dry')
if (!prefixes.length) {
  console.error('usage: node tools/i18n/apply-literals.cjs [--map] [--dry] <key-prefix>...')
  process.exit(1)
}

const literalMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'literal-map.json'), 'utf8'))
const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'))
const has = (key) =>
  key.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), en) !== undefined

/** english -> key, only where the key is in scope *and* already translated. */
const dict = {}
for (const [key, text] of Object.entries(literalMap)) {
  if (!prefixes.some((p) => key.startsWith(p))) continue
  if (!has(key)) continue
  dict[text] = key
}
console.log(`${Object.keys(dict).length} translated literals in scope`)

let total = 0
const changed = []
const skipped = []

for (const file of walk(path.join(ROOT, 'src'))) {
  const { src, literals } = findLiterals(file)
  const edits = []
  const components = new Set()
  for (const l of literals) {
    const key = dict[l.text]
    if (!key) continue
    if (!l.fn || !/^[A-Z]/.test(l.fn)) {
      skipped.push(`${path.relative(ROOT, file)}: "${l.text}" (${l.fn ? l.fn + '()' : 'module scope'})`)
      continue
    }
    components.add(l.fn)
    edits.push({ ...l, key })
  }
  if (!edits.length) continue

  let out = src
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    // Decided here, from the character immediately before the literal in the real source, rather
    // than from a flag computed during detection — detection runs against a comment-blanked copy
    // and the flag was silently coming through false. A literal that is a JSX attribute value
    // (`status="System"`) needs braces: `status={t(...)}`. `status=t(...)` is a syntax error.
    const precedingEquals = /[A-Za-z0-9_-]=\s*$/.test(out.slice(Math.max(0, e.start - 40), e.start))
    const call = precedingEquals ? `{t('${e.key}')}` : `t('${e.key}')`
    out = out.slice(0, e.start) + call + out.slice(e.start + e.length)
  }
  const { ensureHook } = require('./codemod.cjs')
  out = ensureHook(out, components)
  if (!dryRun) fs.writeFileSync(file, out)
  total += edits.length
  changed.push({ file: path.relative(ROOT, file), n: edits.length })
}

console.log(`${dryRun ? '[dry run] ' : ''}${total} replacements in ${changed.length} files`)
for (const c of changed) console.log(`  ${String(c.n).padStart(3)}  ${c.file}`)
if (skipped.length) {
  console.log(`\n${skipped.length} skipped — not inside a component, so t() is unavailable:`)
  for (const s of skipped.slice(0, 30)) console.log('  ' + s)
  if (skipped.length > 30) console.log(`  … and ${skipped.length - 30} more`)
}
