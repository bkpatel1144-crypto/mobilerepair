const fs = require('fs')
const path = require('path')
const { transform, ensureHook } = require('./codemod.cjs')
const DOMAIN = require('./domain-terms.cjs')

const ROOT = path.resolve(__dirname, '../..')
const LOCALES = path.join(ROOT, 'src/locales')

/** English string -> full i18n key, built from the existing common.* bundle plus domain terms. */
function buildDictionary() {
  const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'))
  const dict = {}

  // Everything already in common.* is fair game, matched on its English value.
  for (const [k, v] of Object.entries(en.common)) {
    if (typeof v !== 'string') continue
    if (v.includes('{{')) continue // interpolated strings need their variables passed
    if (!dict[v]) dict[v] = `common.${k}`
  }
  for (const [english, entry] of Object.entries(DOMAIN)) {
    dict[english] = `common.${entry.key}`
  }
  return dict
}

/** Adds the domain terms to all three locale files, in place, keeping key order stable. */
function writeDomainTerms() {
  for (const code of ['en', 'hi', 'gu']) {
    const p = path.join(LOCALES, `${code}.json`)
    const json = JSON.parse(fs.readFileSync(p, 'utf8'))
    for (const [english, entry] of Object.entries(DOMAIN)) {
      json.common[entry.key] = code === 'en' ? english : entry[code]
    }
    fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n')
  }
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'ui' ? [] : walk(full)
    return /\.tsx$/.test(e.name) && !/\.test\.tsx$/.test(e.name) ? [full] : []
  })
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry')
const targets = args.filter((a) => !a.startsWith('--'))

if (!targets.length) {
  console.error('usage: node tools/i18n/run.cjs [--dry] <file-or-dir>...')
  process.exit(1)
}

if (!dryRun) writeDomainTerms()
const dict = buildDictionary()

const files = targets.flatMap((t) => {
  const full = path.resolve(ROOT, t)
  return fs.statSync(full).isDirectory() ? walk(full) : [full]
})

let totalApplied = 0
const allSkipped = []
const changedFiles = []

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8')
  const { src, skipped, componentsTouched, appliedCount } = transform(before, dict)
  if (appliedCount === 0) {
    if (skipped.length) allSkipped.push({ file, skipped })
    continue
  }
  const withHook = ensureHook(src, componentsTouched)
  if (!dryRun) fs.writeFileSync(file, withHook)
  totalApplied += appliedCount
  changedFiles.push({ file: path.relative(ROOT, file), appliedCount })
  if (skipped.length) allSkipped.push({ file, skipped })
}

console.log(
  `${dryRun ? '[dry run] ' : ''}${totalApplied} replacements in ${changedFiles.length} files`
)
for (const c of changedFiles) console.log(`  ${c.appliedCount.toString().padStart(3)}  ${c.file}`)

// The skip list is the handover: these are strings a person still has to place, with the reason
// the codemod refused to touch them.
const moduleScope = allSkipped.flatMap(({ file, skipped }) =>
  skipped
    .filter((s) => s.reason.startsWith('module scope'))
    .map((s) => `${path.relative(ROOT, file)}: "${s.english}"`)
)
if (moduleScope.length) {
  console.log(`\n${moduleScope.length} skipped at module scope (need manual handling):`)
  for (const s of moduleScope.slice(0, 40)) console.log('  ' + s)
  if (moduleScope.length > 40) console.log(`  … and ${moduleScope.length - 40} more`)
}
