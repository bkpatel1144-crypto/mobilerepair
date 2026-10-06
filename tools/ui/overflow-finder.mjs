import { chromium } from 'playwright'
const [base, email, password, path] = process.argv.slice(2)
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1500, height: 900 } })
await page.goto(base + '/login', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email); await page.fill('#password', password)
await page.click('button[type=submit]'); await page.waitForTimeout(15000)
await page.goto(base + path, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(7000)
console.log(await page.evaluate(() => {
  const de = document.documentElement
  // An element only contributes to the document's scroll height if nothing between it and the
  // root clips it. A clipped child still reports its full rect, which is why "the lowest
  // bottom" was a red herring the first time.
  const clipped = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p)
      if (s.overflow !== 'visible' || s.overflowY !== 'visible') return true
    }
    return false
  }
  const found = []
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return
    if (r.bottom <= de.clientHeight + 1) return
    if (clipped(el)) return
    const cs = getComputedStyle(el)
    found.push({
      el: `${el.tagName}.${(el.className || '').toString().slice(0, 55)}`,
      bottom: Math.round(r.bottom),
      h: Math.round(r.height),
      pos: cs.position,
      parent: el.parentElement
        ? `${el.parentElement.tagName}.${(el.parentElement.className || '').toString().slice(0, 45)}`
        : '',
    })
  })
  found.sort((a, b) => b.bottom - a.bottom)
  return JSON.stringify(
    { docScrollH: de.scrollHeight, clientH: de.clientHeight, unclippedPastViewport: found.slice(0, 6) },
    null, 1
  )
}))
await b.close()
