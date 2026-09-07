const fs = require('fs'), path = require('path')
const { transform, isDisplayString } = require('./codemod.cjs')
const ROOT = path.resolve(__dirname, '../..')

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === 'ui' ? [] : walk(full)
    return /\.tsx$/.test(e.name) && !/\.test\.tsx$/.test(e.name) ? [full] : []
  })
}

const ATTRS = ['title','subtitle','label','placeholder','description','message','confirmLabel','aria-label']
const PROPS = ['header','label','title','description']
const counts = new Map()
const perFile = new Map()

for (const file of [...walk(path.join(ROOT,'src/pages')), ...walk(path.join(ROOT,'src/components'))]) {
  const src = fs.readFileSync(file, 'utf8')
  const found = []
  for (const m of src.matchAll(new RegExp(`\b(${ATTRS.join('|')})=("([^"\n]*)"|'([^'\n]*)')`,'g'))) {
    const s = m[3] ?? m[4] ?? ''
    if (isDisplayString(s)) found.push(s)
  }
  for (const m of src.matchAll(new RegExp(`\b(${PROPS.join('|')}):\s*'([^'\n]*)'`,'g'))) {
    if (isDisplayString(m[2])) found.push(m[2])
  }
  for (const m of src.matchAll(/>([^<>{}\n]{2,80})</g)) {
    if (isDisplayString(m[1])) found.push(m[1].trim())
  }
  if (found.length) perFile.set(path.relative(ROOT,file), found.length)
  for (const s of found) counts.set(s, (counts.get(s) ?? 0) + 1)
}

const total = [...counts.values()].reduce((a,b)=>a+b,0)
console.log(`${total} untranslated display strings remain, ${counts.size} unique`)
console.log('\nBy file (top 25):')
for (const [f,n] of [...perFile].sort((a,b)=>b[1]-a[1]).slice(0,25)) console.log(`  ${String(n).padStart(3)}  ${f}`)
