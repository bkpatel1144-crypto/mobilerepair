/**
 * Extracts the remaining page-specific display strings and assigns each a key.
 *
 * Keys are namespaced by the file the string lives in (`pages.service.jobCards.<slug>`), not
 * pooled into one flat bundle, because a page's own copy is not reusable: "Add New Role" belongs
 * to one screen, and a translator needs to see it next to the rest of that screen's text to get
 * the tone right. Only genuinely shared terms live in `common.*`, and those are already done.
 *
 * A string that appears in more than one file is promoted to `shared.<slug>` instead, so it
 * cannot be translated two different ways.
 *
 * Run with `--write` to rewrite sources and emit the key map; without it, prints the strings for
 * translation.
 */
const fs = require('fs')
const path = require('path')
const { isDisplayString } = require('./codemod.cjs')

const ROOT = path.resolve(__dirname, '../..')
const ATTRS = [
  'title',
  'subtitle',
  'label',
  'placeholder',
  'description',
  'message',
  'confirmLabel',
  'aria-label',
]
const PROPS = ['header', 'label', 'title', 'description']

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'ui' ? [] : walk(full)
    return /\.tsx$/.test(e.name) && !/\.test\.tsx$/.test(e.name) ? [full] : []
  })
}

/** `src/pages/app/service/job-cards-page.tsx` -> `pages.service.jobCards` */
function namespaceFor(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  const parts = rel.replace(/\.tsx$/, '').split('/')
  const base = parts[parts.length - 1].replace(/-page$/, '')
  // camelCase every segment: keys are permanent once translated, and `second-hand-device` or
  // `dashboard-page` as a path segment reads as a leaked filename rather than a namespace.
  const dir = parts.includes('components')
    ? `components.${camel(parts[parts.length - 2])}`
    : `pages.${camel(parts[3] ?? parts[2]).replace(/Page$/, '')}`
  return `${dir}.${camel(base)}`
}

function camel(s) {
  return s.replace(/[-_ ]+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (c) => c.toLowerCase())
}

/** A short, stable, readable key from the English text. */
function slug(text) {
  const words = text
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
  const s = camel(words.join(' ').toLowerCase().replace(/ /g, '-'))
  return s || 'text'
}

const occurrences = new Map() // english -> Set(namespace)
const perFile = new Map() // file -> [{english, kind, attr}]

for (const file of [
  ...walk(path.join(ROOT, 'src/pages')),
  ...walk(path.join(ROOT, 'src/components')),
]) {
  const src = fs.readFileSync(file, 'utf8')
  const hits = []
  const push = (english) => {
    const s = english.trim()
    if (!isDisplayString(s)) return
    hits.push(s)
    if (!occurrences.has(s)) occurrences.set(s, new Set())
    occurrences.get(s).add(namespaceFor(file))
  }
  for (const m of src.matchAll(new RegExp(`\\b(${ATTRS.join('|')})=("([^"\\n]*)"|'([^'\\n]*)')`, 'g')))
    push(m[3] ?? m[4] ?? '')
  for (const m of src.matchAll(new RegExp(`\\b(${PROPS.join('|')}):\\s*'([^'\\n]*)'`, 'g'))) push(m[2])
  for (const m of src.matchAll(/>([^<>{}\n]{2,80})</g)) push(m[1])
  if (hits.length) perFile.set(file, hits)
}

// Assign keys: multi-file strings become shared.*, single-file ones live under their page.
const keyFor = new Map()
const usedKeys = new Set()
for (const [english, namespaces] of occurrences) {
  const base = namespaces.size > 1 ? 'shared' : [...namespaces][0]
  let key = `${base}.${slug(english)}`
  let n = 2
  while (usedKeys.has(key) && keyFor.get(english) !== key) key = `${base}.${slug(english)}${n++}`
  usedKeys.add(key)
  keyFor.set(english, key)
}

if (!process.argv.includes('--write')) {
  const rows = [...keyFor.entries()].sort(([, a], [, b]) => a.localeCompare(b))
  console.log(JSON.stringify(Object.fromEntries(rows.map(([e, k]) => [k, e])), null, 2))
  process.exit(0)
}

fs.writeFileSync(
  path.join(__dirname, 'key-map.json'),
  JSON.stringify(Object.fromEntries([...keyFor.entries()].map(([e, k]) => [k, e])), null, 2) + '\n'
)
console.log(`${keyFor.size} unique strings, key map written to tools/i18n/key-map.json`)
