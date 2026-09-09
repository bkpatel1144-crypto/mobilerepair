/**
 * Deep-merges a batch of new keys into en.json, hi.json and gu.json at once.
 *
 * The earlier translation passes edited the three locale files separately, which is how they
 * drifted: `locales.test.ts` exists because a key added to English and forgotten in Gujarati
 * shows up as a raw `marketing.home.hero.title` on a real user's screen. Writing all three from
 * one source makes that particular mistake impossible rather than merely detected.
 *
 *   node tools/i18n/add-keys.cjs tools/i18n/translations/<batch>.cjs
 *
 * The batch module exports a nested object whose leaves are `{ en, hi, gu }`. Existing keys are
 * left alone and reported, so re-running a batch is safe and never silently overwrites a
 * translation someone has since corrected by hand.
 */
const fs = require('node:fs')
const path = require('node:path')

const LOCALES = ['en', 'hi', 'gu']
const batchPath = process.argv[2]
if (!batchPath) {
  console.error('usage: node tools/i18n/add-keys.cjs <batch.cjs>')
  process.exit(1)
}

const batch = require(path.resolve(batchPath))

/** Walks the batch, producing `['a.b.c', {en, hi, gu}]` pairs. A leaf is an object that has an
 *  `en` string — anything else is another level of nesting. */
function flatten(node, prefix = [], out = []) {
  for (const [key, value] of Object.entries(node)) {
    const trail = [...prefix, key]
    if (value && typeof value === 'object' && typeof value.en === 'string') {
      out.push([trail.join('.'), value])
    } else if (value && typeof value === 'object') {
      flatten(value, trail, out)
    } else {
      throw new Error(`${trail.join('.')} is not a {en, hi, gu} leaf`)
    }
  }
  return out
}

const entries = flatten(batch)
for (const [key, leaf] of entries) {
  const missing = LOCALES.filter((l) => typeof leaf[l] !== 'string' || !leaf[l].trim())
  if (missing.length) throw new Error(`${key} is missing: ${missing.join(', ')}`)
}

let added = 0
let skipped = 0

for (const locale of LOCALES) {
  const file = path.join('src', 'locales', `${locale}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))

  for (const [key, leaf] of entries) {
    const trail = key.split('.')
    const last = trail.pop()
    let node = json
    for (const segment of trail) {
      // A key whose parent is currently a string cannot be nested under without destroying it.
      if (typeof node[segment] === 'string') {
        throw new Error(`cannot nest ${key}: "${segment}" is already a string in ${locale}`)
      }
      node[segment] ??= {}
      node = node[segment]
    }
    if (typeof node[last] === 'string') {
      if (locale === 'en') skipped++
      continue
    }
    node[last] = leaf[locale]
    if (locale === 'en') added++
  }

  // Trailing newline to match what Prettier writes, so this never shows up as a diff on its own.
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`)
}

console.log(`${added} keys added, ${skipped} already present (x${LOCALES.length} locales)`)
