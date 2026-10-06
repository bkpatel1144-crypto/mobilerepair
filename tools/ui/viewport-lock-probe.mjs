/**
 * The window must not scroll inside the app, and must scroll on the marketing site.
 *
 *   node tools/ui/viewport-lock-probe.mjs <base> <email> <password>
 *
 * The app shell is `h-dvh overflow-hidden` and owns the viewport: scrolling happens inside the
 * content pane. When the document scrolled too, you could push the whole application off the
 * top of the screen and land on blank page — a sidebar cut off partway down with white below.
 *
 * Checks both directions, because the fix is a root-level overflow lock and the obvious way to
 * get it wrong is to leave it on and freeze the public pages.
 */
import { chromium } from 'playwright'
const [base, email, password] = process.argv.slice(2)
const fails = []
const check = (l, ok, d = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${l}${d ? `  — ${d}` : ''}`)
  if (!ok) fails.push(l)
}
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1500, height: 900 } })

/**
 * Scrolls the way a person does — a real wheel event over the page.
 *
 * `window.scrollTo()` is the wrong instrument here: `overflow: hidden` on the root blocks
 * *user* scrolling but a programmatic scroll still moves the document, so the first version of
 * this probe reported the bug as unfixed on the one page it had just been fixed on.
 */
const scrolledBy = async () => {
  await page.mouse.move(750, 450)
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 600)
  await page.waitForTimeout(700)
  return page.evaluate(() => Math.round(window.scrollY))
}

// ---- the public site must still scroll -------------------------------------
await page.goto(base + '/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
check('the marketing home page still scrolls', (await scrolledBy()) > 100, `scrollY ${await page.evaluate(() => Math.round(window.scrollY))}`)

await page.goto(base + '/login', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email); await page.fill('#password', password)
await page.click('button[type=submit]'); await page.waitForTimeout(15000)

// ---- no app screen may scroll the window ------------------------------------
const SCREENS = [
  '/app/dashboard',
  '/app/service/job-cards',
  '/app/masters/items',
  '/app/sales/invoices',
  '/app/finance/expenses',
  '/app/settings/company',
]
for (const path of SCREENS) {
  await page.goto(base + path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5500)
  const y = await scrolledBy()
  check(`${path} does not scroll the window`, y === 0, `scrollY ${y}`)
}

// the long one from the bug report, and at phone size too
for (const [w, h] of [[1500, 900], [390, 844]]) {
  await page.setViewportSize({ width: w, height: h })
  await page.goto(base + '/app/service/job-cards/Q3jHfq1x62kdovnB5K7Z', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(6500)
  // Wheel over the sidebar, which is outside the scrolling pane — wheeling over `main` would
  // be absorbed by the pane and prove nothing about the window.
  await page.mouse.move(w > 800 ? 120 : w / 2, h - 40)
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 600)
  await page.waitForTimeout(700)
  const y = await page.evaluate(() => Math.round(window.scrollY))
  check(`the long job card does not scroll the window at ${w}x${h}`, y === 0, `scrollY ${y}`)
  // and the content pane itself must still scroll, or the fix traded one bug for a worse one
  const inner = await page.evaluate(() => {
    const m = document.querySelector('main')
    m.scrollTop = 99999
    return Math.round(m.scrollTop)
  })
  check(`and the content pane still scrolls at ${w}x${h}`, inner > 0, `main scrollTop ${inner}`)
}

// ---- leaving the app restores normal scrolling -------------------------------
await page.setViewportSize({ width: 1500, height: 900 })
await page.goto(base + '/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
check('the public site still scrolls after leaving the app', (await scrolledBy()) > 100)

console.log(`\n${fails.length ? fails.length + ' FAILED' : 'all checks passed'}`)
await b.close()
process.exit(fails.length ? 1 : 0)
