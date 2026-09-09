/**
 * Regenerates `src/locales/hardcoded-baseline.json` — the list of untranslated JSX text nodes
 * that `no-hardcoded-strings.test.ts` tolerates.
 *
 * Run this after wrapping strings in `t()`, so the baseline shrinks to match. The test fails on
 * stale entries as well as new ones, which is what stops the list quietly drifting out of date.
 *
 *   node tools/i18n/baseline.cjs
 */
const fs = require('node:fs')
const path = require('node:path')

// Kept in step with the regex in no-hardcoded-strings.test.ts by hand. A shared module would be
// better, but the test reads sources through `import.meta.glob`, which this script cannot use.
const PATTERN = />\s*\n\s*([A-Z][^<>{}\n]{3,300}?)\s*(?:<|\{)/g

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (entry.name.endsWith('.tsx')) out.push(full)
  }
  return out
}

const found = []
for (const file of walk('src')) {
  const raw = fs.readFileSync(file, 'utf8')
  // The test's own paths are relative to src/locales/, so match that shape exactly.
  const rel = `../${path.relative('src', file).split(path.sep).join('/')}`
  for (const m of raw.matchAll(PATTERN)) {
    const text = m[1].replace(/\s+/g, ' ').trim()
    if (!/[a-z]/.test(text)) continue
    if (text.includes('&') && /&[a-z]+;/.test(text)) continue
    found.push(`${rel}: ${JSON.stringify(text.slice(0, 60))}`)
  }
}

found.sort()
fs.writeFileSync('src/locales/hardcoded-baseline.json', `${JSON.stringify(found, null, 2)}\n`)
console.log(`${found.length} entries written to src/locales/hardcoded-baseline.json`)
