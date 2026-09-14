/**
 * Wraps bare JSX text nodes in `t()`, one file at a time, from an explicit literal -> key map.
 *
 *   node tools/i18n/replace-text.cjs <file> <map.json>
 *
 * Line-based and exact-match-only, for the same reason `codemod.cjs` is: an AST transform would
 * reprint the whole file and bury the change in a diff nobody can review. A line is rewritten
 * only when, once trimmed, it is *exactly* the literal — so "Model" never matches "Model Name",
 * and a word appearing inside a longer sentence is left alone.
 *
 * Two shapes beyond a bare text node, because between them they account for most of what is
 * left in the backlog:
 *
 *   - a trailing `{' '}`, where the label is followed by an "(optional)" hint span;
 *   - a required-field label, `Amount <span className="text-red-600">*</span>`, where the
 *     asterisk sits on the same line as the text.
 *
 * Reports anything it could not place rather than reporting success, so a literal that moved
 * shows up instead of being silently skipped.
 */
const fs = require('node:fs')

const [file, mapFile] = process.argv.slice(2)
if (!file || !mapFile) {
  console.error('usage: node tools/i18n/replace-text.cjs <file> <map.json>')
  process.exit(1)
}
const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'))
const lines = fs.readFileSync(file, 'utf8').split('\n')
const placed = new Set()

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i]
  const trimmed = line.trim()
  const indent = line.slice(0, line.length - line.trimStart().length)

  const required = trimmed.match(/^(.+?)\s*(<span className="text-red-600">\*<\/span>)$/)
  if (required && map[required[1].trim()]) {
    const literal = required[1].trim()
    lines[i] = `${indent}{t('${map[literal]}')} ${required[2]}`
    placed.add(literal)
    continue
  }

  const trailing = trimmed.endsWith("{' '}")
  const literal = trailing ? trimmed.slice(0, -"{' '}".length).trim() : trimmed
  const key = map[literal]
  if (!key) continue
  lines[i] = `${indent}{t('${key}')}${trailing ? "{' '}" : ''}`
  placed.add(literal)
}

fs.writeFileSync(file, lines.join('\n'), 'utf8')
const missing = Object.keys(map).filter((k) => !placed.has(k))
console.log(`placed ${placed.size}/${Object.keys(map).length}`)
if (missing.length) console.log('NOT FOUND:', missing.map((m) => JSON.stringify(m)).join(', '))
