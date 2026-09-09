/**
 * Measures the two long data-entry forms for horizontal clipping, and exercises the device
 * unlock field.
 *
 *   node tools/ui/form-check.mjs http://localhost:5173 375
 *   node tools/ui/form-check.mjs https://aimenterprise.web.app 1440
 *
 * Written because Create Job Card and Buy Mobile were rebuilt on one shared section/grid layout,
 * and the failure that layout exists to prevent is invisible in source: a grid item's automatic
 * minimum size is its min-content width, so a column silently refuses to shrink and pushes its
 * trailing button — add customer, scan IMEI, Draw — past the card's own border. This has now
 * happened twice in this project, both times found only by measuring.
 *
 * Two things are checked, and both report how much they examined, because a check that quietly
 * looked at nothing is worse than no check at all (this repo has been bitten by exactly that
 * twice: `tsc --noEmit` against a solution-only tsconfig, and an overflow check comparing two
 * values that a clipping ancestor kept equal):
 *
 *  1. **Clipping.** Every element's right edge against its offset parent's content box, plus the
 *     document's own scrollWidth against the viewport. `scrollWidth` alone is not enough — an
 *     `overflow-hidden` ancestor keeps it equal to `clientWidth` while happily cutting a button
 *     in half — so the per-element comparison is the real check and the document one is a
 *     backstop.
 *  2. **The unlock field.** Types a PIN and reads it back. Buy Mobile's field shipped with only a
 *     pattern grid: the label said "Device PIN / Pattern" and there was nowhere to type 1234.
 *
 * Signs up a throwaway tenant, since both screens are behind a login. Leaves a company named
 * "ZZ FORM <timestamp>" to delete from the console.
 */
import { chromium } from 'playwright'

const base = process.argv[2] ?? 'http://localhost:5173'
const width = Number(process.argv[3] ?? 375)

const SCREENS = [
  ['create job card', '/app/service/job-cards/create'],
  ['buy mobile', '/app/second-hand-device/purchase/create'],
]

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width, height: width < 768 ? 844 : 900 },
  isMobile: width < 768,
  hasTouch: width < 768,
})

const stamp = Date.now()
await page.goto(`${base}/signup`, { waitUntil: 'domcontentloaded' })
await page.fill('#companyName', `ZZ FORM ${stamp}`)
await page.fill('#fullName', 'Form Probe')
await page.fill('#email', `form-${stamp}@aim-probe.test`)
await page.fill('#password', 'ProbeOnly!2345')
await page.click('button[type=submit]')
await page.waitForTimeout(22_000)

console.log(`\n=== ${width}px ===`)
let failures = 0

for (const [name, route] of SCREENS) {
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)

  const report = await page.evaluate(() => {
    const overflows = []
    let examined = 0
    let widest = { tag: '', width: 0 }

    for (const el of document.querySelectorAll('main *')) {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      examined += 1
      if (rect.width > widest.width) {
        widest = { tag: describe(el), width: Math.round(rect.width) }
      }
      const parent = el.parentElement
      if (!parent) continue
      const pRect = parent.getBoundingClientRect()
      const style = getComputedStyle(parent)
      // A scroll container is *supposed* to hold content wider than itself.
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') continue
      const spill = Math.round(rect.right - pRect.right)
      if (spill > 1) {
        overflows.push({ el: describe(el), parent: describe(parent), spill })
      }
    }

    function describe(el) {
      const cls = (el.className?.baseVal ?? el.className ?? '').toString().split(/\s+/)
      return `${el.tagName.toLowerCase()}${cls[0] ? '.' + cls[0] : ''}`
    }

    return {
      examined,
      widest,
      overflows: overflows.slice(0, 8),
      overflowCount: overflows.length,
      documentWidth: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
      sections: document.querySelectorAll('main section').length,
    }
  })

  const doc =
    report.documentWidth > report.viewport
      ? ` DOCUMENT SCROLLS: ${report.documentWidth} > ${report.viewport}`
      : ''
  console.log(
    `\n${name}: examined ${report.examined} elements, ${report.sections} section cards, ` +
      `widest ${report.widest.width}px (${report.widest.tag})${doc}`
  )
  if (report.overflowCount) {
    failures += 1
    console.log(`  ${report.overflowCount} element(s) spill past their parent:`)
    for (const o of report.overflows) {
      console.log(`    ${o.el} spills ${o.spill}px out of ${o.parent}`)
    }
  } else if (report.examined === 0) {
    failures += 1
    console.log('  examined nothing — the page did not render, so this says nothing')
  } else {
    console.log('  no clipping')
  }

  // The unlock field: type a PIN and read it back.
  const pin = page.locator('input[placeholder*="1234" i]').first()
  if (await pin.count()) {
    await pin.fill('4821')
    const readBack = await pin.inputValue()
    console.log(`  device PIN input accepts typing: ${readBack === '4821' ? 'yes' : 'NO'}`)
    if (readBack !== '4821') failures += 1
  } else {
    failures += 1
    console.log('  NO device PIN text input on this screen')
  }
  const draw = page.getByRole('button', { name: /draw/i }).first()
  console.log(`  Draw button present: ${(await draw.count()) ? 'yes' : 'NO'}`)
  if (!(await draw.count())) failures += 1
}

await browser.close()
console.log(failures ? `\n${failures} problem(s)\n` : '\nall clear\n')
process.exit(failures ? 1 : 0)
