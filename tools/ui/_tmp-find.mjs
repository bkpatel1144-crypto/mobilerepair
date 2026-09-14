import { chromium } from 'playwright'
const [base, email, password] = process.argv.slice(2)
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
await page.setViewportSize({ width: 1200, height: 900 })
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.fill('#email', email); await page.fill('#password', password)
await page.click('button[type=submit]'); await page.waitForTimeout(14000)
await page.setViewportSize({ width: 390, height: 844 })
for (const url of ['/app/service/job-cards/create', '/app/administration/users/create', '/app/service/options', '/app/service/items']) {
  await page.goto(base + url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4500)
  const found = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('main button, main a[href], main [role=button]').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) return
      if (r.height >= 32 && r.width >= 32) return
      out.push({
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        tag: el.tagName.toLowerCase(),
        display: getComputedStyle(el).display,
        cls: (el.className || '').toString().slice(0, 70),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 24),
        parent: el.parentElement?.tagName.toLowerCase(),
      })
    })
    return out
  })
  console.log('==', url)
  for (const f of found.slice(0, 6)) console.log('  ', JSON.stringify(f))
}
await browser.close()
