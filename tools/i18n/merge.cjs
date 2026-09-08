/**
 * Merges a translation batch into en.json, hi.json and gu.json.
 *
 * English comes from `key-map.json` (it is the string that was extracted from the source), so a
 * batch file only carries the two translations — there is no way for the English in a batch to
 * drift from the English still sitting in the code it will replace.
 *
 *   node tools/i18n/merge.cjs batch1
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const LOCALES = path.join(ROOT, 'src/locales')

const name = process.argv[2]
if (!name) {
  console.error('usage: node tools/i18n/merge.cjs <batch-name>')
  process.exit(1)
}

const batch = require(`./translations/${name}.cjs`)
// Both maps: key-map.json holds the attribute/prop/JSX-text strings, literal-map.json the ones
// found inside expressions. A batch may name keys from either, and the English always comes from
// whichever map extracted it — never from the batch file — so it cannot drift from the source.
const keyMap = {
  ...JSON.parse(fs.readFileSync(path.join(__dirname, 'key-map.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(__dirname, 'literal-map.json'), 'utf8')),
}

const problems = []
for (const key of Object.keys(batch)) {
  if (!(key in keyMap)) problems.push(`${key} is not in key-map.json`)
}
for (const [key, value] of Object.entries(batch)) {
  if (value.same) continue
  if (!value.hi) problems.push(`${key} has no Hindi`)
  if (!value.gu) problems.push(`${key} has no Gujarati`)
}
if (problems.length) {
  console.error('batch is not consistent with the key map:')
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}

function setDeep(obj, dotted, value) {
  const parts = dotted.split('.')
  let node = obj
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== 'object' || node[part] === null) node[part] = {}
    node = node[part]
  }
  node[parts[parts.length - 1]] = value
}

for (const code of ['en', 'hi', 'gu']) {
  const p = path.join(LOCALES, `${code}.json`)
  const json = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const [key, value] of Object.entries(batch)) {
    const english = keyMap[key]
    setDeep(json, key, code === 'en' || value.same ? english : value[code])
  }
  fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n')
}

const sameCount = Object.values(batch).filter((v) => v.same).length
console.log(
  `merged ${Object.keys(batch).length} keys from ${name} (${sameCount} intentionally identical across languages)`
)
