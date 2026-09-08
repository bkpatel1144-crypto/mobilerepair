/**
 * Finds display text still hardcoded in the source, by a rule broader than the extractor's.
 *
 * The extractor matched three shapes — JSX attributes, object-literal props, and bare JSX text.
 * That missed anything inside a JSX *expression*: `status={x ? 'Active' : 'Inactive'}`,
 * `title={isNew ? 'Add IP' : 'Edit Entry'}`, `toast('Saved')`. Those render to the user exactly
 * like the shapes it did catch, so they have to be found too.
 *
 * This walks every string literal instead, skips the ones already inside a `t(...)` call, and
 * applies the same display-text filter plus a few extra exclusions for strings that are clearly
 * code (import paths, query keys, Firestore field names, tailwind classes).
 *
 * Run: node tools/i18n/audit.cjs [--json]
 */
const fs = require('fs')
const path = require('path')
const { isDisplayString } = require('./codemod.cjs')

const ROOT = path.resolve(__dirname, '../..')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'ui' ? [] : walk(full)
    return /\.tsx$/.test(e.name) && !/\.test\.tsx$/.test(e.name) ? [full] : []
  })
}

/** Attribute names whose value is code; a literal there is not display text. */
const CODE_ATTR =
  /\b(className|class|type|variant|size|key|value|name|id|htmlFor|to|href|src|align|side|role|slug|mode|direction|accept|autoComplete|inputMode|data-\w+)=\s*$/

/** Contexts that make a literal code rather than copy. */
function isCodeContext(before, after, text) {
  // A quoted phrase inside JSX prose, not a string literal. `pick "Unregistered" if this` uses
  // real quotation marks as *punctuation*, and rewriting one produced a page that rendered
  // `pick t('pages.settings.companyForm.unregistered') if this` to the user. The tell is what
  // follows: prose continues with a lowercase word, whereas a real literal is followed by `)`,
  // `,`, `}`, `;` or end of line. Attribute values are exempt — those legitimately continue with
  // another lowercase attribute name.
  if (!/[A-Za-z0-9_-]=\s*$/.test(before) && /^\s+[a-z]/.test(after)) return true
  // An apostrophe inside JSX text, not a string delimiter. `Here's what's happening` made the
  // scanner see a "literal" of `s what`. A real string literal is never preceded directly by an
  // identifier character — `foo'bar'` is not valid JS — so that is the tell.
  if (/[A-Za-z0-9_]$/.test(before)) return true
  if (CODE_ATTR.test(before)) return true
  // Already translated, or being passed to a translation call.
  if (/\bt\(\s*$/.test(before)) return true
  if (/\bdefaultValue:\s*$/.test(before)) return true
  // Import/require specifiers.
  if (/\b(from|import|require\()\s*$/.test(before)) return true
  // Object *keys*, not values: `'some key':`
  if (/^\s*:/.test(after)) return true
  // Query keys and Firestore paths are arrays/props of identifiers.
  if (
    /\b(queryKey|collection|doc|orderBy|where|field|fieldKey|eventKey|statusKey)\b[^=]*$/.test(
      before
    )
  )
    return true
  // A comparison against a literal is logic, not display.
  if (/[=!]==?\s*$/.test(before)) return true
  if (/^\s*[=!]==?/.test(after)) return true
  // A route or path segment: slash-joined identifiers with no spaces.
  if (/^[A-Za-z0-9:_-]+(\/[A-Za-z0-9:_-]+)+$/.test(text)) return true
  // A literal in a *type* position is a discriminant, not copy: `useState<'Raw Material' |
  // 'Service'>` and `'Service' as const` both slipped through, and translating a discriminant
  // changes what the code does rather than what it says. A single `|` before the literal is a
  // union member; `||` is a display fallback and must still be translated, hence the lookbehind.
  if (/^\s*(\||>|as\s+const)/.test(after)) return true
  if (/(?<!\|)\|\s*$/.test(before)) return true
  if (/<\s*$/.test(before)) return true
  // `includes('x')`, `startsWith('x')`, `split('x')` etc.
  if (
    /\.(includes|startsWith|endsWith|split|join|replace|replaceAll|match|test|indexOf|localeCompare)\(\s*$/.test(
      before
    )
  )
    return true
  return false
}

const findings = []

for (const file of walk(path.join(ROOT, 'src'))) {
  const src = fs.readFileSync(file, 'utf8')
  // Strip comments so prose in a doc comment isn't reported.
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))

  for (const m of stripped.matchAll(/'([^'\\\n]{2,120})'|"([^"\\\n]{2,120})"/g)) {
    const text = m[1] ?? m[2] ?? ''
    if (!isDisplayString(text)) continue
    const before = stripped.slice(Math.max(0, m.index - 120), m.index)
    const after = stripped.slice(m.index + m[0].length, m.index + m[0].length + 20)
    if (isCodeContext(before, after, text)) continue
    const line = stripped.slice(0, m.index).split('\n').length
    findings.push({ file: path.relative(ROOT, file).replace(/\\/g, '/'), line, text })
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(findings, null, 2))
} else {
  const byFile = new Map()
  for (const f of findings) byFile.set(f.file, (byFile.get(f.file) ?? 0) + 1)
  console.log(`${findings.length} hardcoded display strings in ${byFile.size} files\n`)
  for (const [file, n] of [...byFile].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(n).padStart(3)}  ${file}`)
}
