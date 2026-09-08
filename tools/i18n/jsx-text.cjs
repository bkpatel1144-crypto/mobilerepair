/**
 * Handles the last shape: JSX text spanning more than one line.
 *
 *   <p>
 *     Contact your Owner or Administrator if you believe this is a mistake.
 *   </p>
 *
 * Every earlier pattern matched within a single line, so a sentence Prettier wrapped was
 * invisible to all of them — and these are whole sentences, the most visible copy in the app.
 *
 * Only pure text nodes are touched: the match must contain no tags and no `{expression}`, so a
 * sentence with an interpolated value in the middle is left alone rather than being cut in half.
 * Those need a human to decide where the placeholder goes.
 *
 *   node tools/i18n/jsx-text.cjs --map        # write jsx-text-map.json for translation
 *   node tools/i18n/jsx-text.cjs <prefix>...  # rewrite sources for translated keys
 */
const fs = require('fs')
const path = require('path')
const { topLevelFunctions } = require('./codemod.cjs')

const ROOT = path.resolve(__dirname, '../..')
const LOCALES = path.join(ROOT, 'src/locales')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'ui' ? [] : walk(full)
    return /\.tsx$/.test(e.name) && !/\.test\.tsx$/.test(e.name) ? [full] : []
  })
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

/**
 * A multi-line JSX text node worth translating.
 *
 * The `[^<>{}]` class is what keeps this safe: it refuses any match containing a tag or an
 * expression, so only self-contained prose is ever rewritten.
 */
const TEXT_NODE = />(\s*\n\s*)([A-Z][^<>{}]{10,300}?)(\s*\n\s*)</g

function findTextNodes(file) {
  const src = fs.readFileSync(file, 'utf8')
  const ranges = topLevelFunctions(src)
  const out = []
  for (const m of src.matchAll(TEXT_NODE)) {
    const raw = m[2]
    const text = raw.replace(/\s+/g, ' ').trim()
    // Needs a lowercase letter somewhere — an all-caps run is a heading handled elsewhere or an
    // acronym, and `&amp;`-style entities are left for a human.
    if (!/[a-z]/.test(text)) continue
    if (text.includes('&') && /&[a-z]+;/.test(text)) continue
    let fn = null
    for (const r of ranges) if (r.start <= m.index && (!fn || r.start > fn.start)) fn = r
    out.push({
      text,
      // Replace only the inner text, keeping the surrounding whitespace exactly as Prettier left
      // it — otherwise every one of these becomes a formatting diff too.
      start: m.index + 1 + m[1].length,
      length: raw.length,
      fn: fn?.name ?? null,
    })
  }
  return { src, nodes: out }
}

// ---- --map ----------------------------------------------------------------------------------
if (process.argv.includes('--map')) {
  const occurrences = new Map()
  for (const file of walk(path.join(ROOT, 'src'))) {
    for (const n of findTextNodes(file).nodes) {
      if (!occurrences.has(n.text)) occurrences.set(n.text, new Set())
      occurrences.get(n.text).add(namespaceFor(file))
    }
  }
  const existing = {
    ...JSON.parse(fs.readFileSync(path.join(__dirname, 'key-map.json'), 'utf8')),
    ...JSON.parse(fs.readFileSync(path.join(__dirname, 'literal-map.json'), 'utf8')),
  }
  const englishToKey = new Map(Object.entries(existing).map(([k, v]) => [v, k]))
  const enBundle = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'))
  for (const [k, v] of Object.entries(enBundle.common ?? {})) {
    if (typeof v === 'string' && !v.includes('{{') && !englishToKey.has(v))
      englishToKey.set(v, `common.${k}`)
  }

  const map = {}
  const used = new Set(Object.keys(existing))
  for (const [text, namespaces] of occurrences) {
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
  fs.writeFileSync(path.join(__dirname, 'jsx-text-map.json'), JSON.stringify(map, null, 2) + '\n')
  console.log(`${Object.keys(map).length} multi-line text nodes`)
  process.exit(0)
}

// ---- apply ----------------------------------------------------------------------------------
const prefixes = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const dryRun = process.argv.includes('--dry')
if (!prefixes.length) {
  console.error('usage: node tools/i18n/jsx-text.cjs [--map] [--dry] <key-prefix>...')
  process.exit(1)
}

const textMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'jsx-text-map.json'), 'utf8'))
const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'))
const has = (key) =>
  key.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), en) !== undefined

const dict = {}
for (const [key, text] of Object.entries(textMap)) {
  if (!prefixes.some((p) => key.startsWith(p))) continue
  if (!has(key)) continue
  dict[text] = key
}
console.log(`${Object.keys(dict).length} translated text nodes in scope`)

const { ensureHook } = require('./codemod.cjs')
let total = 0
const changed = []
const skipped = []

for (const file of walk(path.join(ROOT, 'src'))) {
  const { src, nodes } = findTextNodes(file)
  const edits = []
  const components = new Set()
  for (const n of nodes) {
    const key = dict[n.text]
    if (!key) continue
    if (!n.fn || !/^[A-Z]/.test(n.fn)) {
      skipped.push(`${path.relative(ROOT, file)}: "${n.text.slice(0, 50)}"`)
      continue
    }
    components.add(n.fn)
    edits.push({ ...n, key })
  }
  if (!edits.length) continue

  let out = src
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + `{t('${e.key}')}` + out.slice(e.start + e.length)
  }
  out = ensureHook(out, components)
  if (!dryRun) fs.writeFileSync(file, out)
  total += edits.length
  changed.push({ file: path.relative(ROOT, file), n: edits.length })
}

console.log(`${dryRun ? '[dry run] ' : ''}${total} replacements in ${changed.length} files`)
for (const c of changed) console.log(`  ${String(c.n).padStart(3)}  ${c.file}`)
if (skipped.length) console.log(`\n${skipped.length} skipped (not in a component)`)
