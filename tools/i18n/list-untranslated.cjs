/**
 * The untranslated JSX text nodes left in one file, with line numbers.
 *
 *   node tools/i18n/list-untranslated.cjs <file>
 *
 * Same pattern `no-hardcoded-strings.test.ts` uses, so what this prints is exactly what the test
 * counts — working from a different regex is how a "fixed" string stays in the baseline.
 */
const fs = require('node:fs')

const file = process.argv[2]
if (!file) {
  console.error('usage: node tools/i18n/list-untranslated.cjs <file>')
  process.exit(1)
}
const raw = fs.readFileSync(file, 'utf8')
let count = 0
for (const m of raw.matchAll(/>\s*\n\s*([A-Z][^<>{}\n]{3,300}?)\s*(?:<|\{)/g)) {
  const text = m[1].replace(/\s+/g, ' ').trim()
  if (!/[a-z]/.test(text)) continue
  if (text.includes('&') && /&[a-z]+;/.test(text)) continue
  count += 1
  console.log(String(raw.slice(0, m.index).split('\n').length).padStart(5), JSON.stringify(text))
}
console.log(count === 0 ? 'clean' : `${count} left`)
