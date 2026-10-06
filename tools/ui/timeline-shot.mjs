import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
const [base, email, password, url] = process.argv.slice(2)
await mkdir('screens/removals', { recursive: true })
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1500, height: 1050 } })
await p.goto(base + '/login', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000)
await p.fill('#email', email); await p.fill('#password', password)
await p.click('button[type=submit]'); await p.waitForTimeout(15000)
await p.goto(base + url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(7000)
const tl = p.locator('main section', { hasText: /Timeline/ }).first()
await tl.screenshot({ path: 'screens/removals/timeline.png' })
// does any marker still overlap its own text?
const overlap = await p.evaluate(() => {
  const bad = []
  document.querySelectorAll('main ol > li').forEach((li) => {
    const badge = li.querySelector('span.absolute')
    const title = li.querySelector('p')
    if (!badge || !title) return
    const b = badge.getBoundingClientRect(), t = title.getBoundingClientRect()
    if (b.right > t.left) bad.push(`${title.innerText.slice(0,18)} (badge ends ${Math.round(b.right)}, text starts ${Math.round(t.left)})`)
  })
  return bad
})
console.log(overlap.length ? 'OVERLAP: ' + overlap.join(' | ') : 'ok — no marker overlaps its text')
await b.close()
