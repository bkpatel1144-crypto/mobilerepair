/**
 * Rewrites sources to use the page-specific keys from `key-map.json`, for one batch of key
 * prefixes at a time.
 *
 * Batching by prefix is what keeps every commit self-consistent: a source file referencing
 * `t('pages.finance.cashBook.x')` before that key exists in en.json would fail the
 * keys-used-in-source test, and a key present in en.json but not hi/gu fails the parity test. So
 * a batch means: translate the strings, add all three locale files, rewrite the sources that use
 * them — together, verified together.
 *
 *   node tools/i18n/apply.cjs shared. pages.dashboard.       # rewrite just those
 *   node tools/i18n/apply.cjs --dry shared.
 */
const fs = require('fs')
const path = require('path')
const { transform, ensureHook } = require('./codemod.cjs')

const ROOT = path.resolve(__dirname, '../..')
const keyMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'key-map.json'), 'utf8'))

const args = process.argv.slice(2)
const dryRun = args.includes('--dry')
const prefixes = args.filter((a) => !a.startsWith('--'))
if (!prefixes.length) {
  console.error('usage: node tools/i18n/apply.cjs [--dry] <key-prefix>...')
  process.exit(1)
}

/** english -> key, restricted to the requested prefixes. */
const dict = {}
for (const [key, english] of Object.entries(keyMap)) {
  if (prefixes.some((p) => key.startsWith(p))) dict[english] = key
}
console.log(`${Object.keys(dict).length} strings in scope for [${prefixes.join(' ')}]`)

/** Only rewrite a string if its key is actually present in en.json — otherwise the app would
 * render the dotted key. This makes running apply.cjs before translating a no-op rather than a
 * regression. */
const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/locales/en.json'), 'utf8'))
const has = (key) =>
  key.split('.').reduce((acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined), en) !==
  undefined

const missing = Object.values(dict).filter((k) => !has(k))
if (missing.length) {
  console.error(`\n${missing.length} of those keys are not in en.json yet — translate first:`)
  for (const k of missing.slice(0, 15)) console.error(`  ${k}`)
  if (missing.length > 15) console.error(`  … and ${missing.length - 15} more`)
  process.exit(1)
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'ui' ? [] : walk(full)
    return /\.tsx$/.test(e.name) && !/\.test\.tsx$/.test(e.name) ? [full] : []
  })
}

let total = 0
const changed = []
for (const file of [
  ...walk(path.join(ROOT, 'src/pages')),
  ...walk(path.join(ROOT, 'src/components')),
]) {
  const before = fs.readFileSync(file, 'utf8')
  const { src, componentsTouched, appliedCount } = transform(before, dict)
  if (!appliedCount) continue
  const out = ensureHook(src, componentsTouched)
  if (!dryRun) fs.writeFileSync(file, out)
  total += appliedCount
  changed.push({ file: path.relative(ROOT, file), appliedCount })
}

console.log(`${dryRun ? '[dry run] ' : ''}${total} replacements in ${changed.length} files`)
for (const c of changed) console.log(`  ${String(c.appliedCount).padStart(3)}  ${c.file}`)
