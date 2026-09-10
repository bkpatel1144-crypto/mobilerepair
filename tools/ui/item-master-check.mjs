/**
 * Signs up a throwaway tenant and checks the Item Master actually received the seeded items with
 * every field, then opens Create Item and counts its sections.
 *
 * The check that matters is the first one: `SEED_ITEMS` was generated and then imported by
 * nothing, so every tenant started with an empty Item Master. A unit test could not see that —
 * the seed data was correct, it simply was not written.
 */
import { chromium } from 'playwright'

const base = process.argv[2] ?? 'http://localhost:5199'
const width = Number(process.argv[3] ?? 1280)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))

const stamp = Date.now()
await page.goto(`${base}/signup`, { waitUntil: 'domcontentloaded' })
await page.fill('#companyName', `ZZ ITEM ${stamp}`)
await page.fill('#fullName', 'Item Probe')
await page.fill('#email', `item-${stamp}@aim-probe.test`)
await page.fill('#password', 'ProbeOnly!2345')
await page.click('button[type=submit]')
await page.waitForTimeout(26_000)

let failures = 0

// 1. Are the seeded items there? ------------------------------------------------------------
await page.goto(`${base}/app/masters/items`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
const rows = await page.evaluate(() => document.querySelectorAll('tbody tr').length)
const totalTile = await page
  .locator('[class*="tabular-nums"]')
  .first()
  .textContent()
  .catch(() => null)
console.log(`\nitem master: ${rows} rows, first stat tile "${(totalTile ?? '').trim()}"`)
if (rows < 10) {
  failures += 1
  console.log(`  expected the 10 seeded items — the seed was previously written by nothing`)
} else {
  console.log('  seeded items are present')
}

// 2. Does a row carry the new fields? ---------------------------------------------------------
await page.locator('tbody tr').first().click()
await page.waitForTimeout(1500)
const drawer = (await page.locator('[role=dialog]').first().textContent()) ?? ''
const expected = ['Tax Category', 'CGST', 'Units of Measure', 'Lines of Business', 'Inventory']
for (const label of expected) {
  // Case-insensitive: several of these section headings render upper-cased ("INVENTORY"), which
  // a case-sensitive check reported as missing when it was on the screen all along.
  const present = drawer.toLowerCase().includes(label.toLowerCase())
  console.log(`  detail shows "${label}": ${present ? 'yes' : 'NO'}`)
  if (!present) failures += 1
}
await page.keyboard.press('Escape')
await page.waitForTimeout(800)

// 3. Create Item ------------------------------------------------------------------------------
await page.goto(`${base}/app/masters/items/create`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4000)
const form = await page.evaluate(() => ({
  sections: [...document.querySelectorAll('main section h2')].map((h) => h.textContent?.trim()),
  inputs: document.querySelectorAll('main input, main textarea, main [role=combobox]').length,
  spills: (() => {
    let n = 0
    for (const el of document.querySelectorAll('main *')) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const p = el.parentElement
      if (!p) continue
      const ps = getComputedStyle(p)
      if (ps.overflowX === 'auto' || ps.overflowX === 'scroll') continue
      if (Math.round(r.right - p.getBoundingClientRect().right) > 1) n += 1
    }
    return n
  })(),
}))
console.log(`\ncreate item: ${form.sections.length} sections, ${form.inputs} controls`)
console.log(`  ${form.sections.join(' | ')}`)
if (form.sections.length !== 7) {
  failures += 1
  console.log(`  expected 7 sections`)
}
console.log(`  clipping: ${form.spills ? `${form.spills} elements spill` : 'none'}`)
if (form.spills) failures += 1

if (errors.length) {
  failures += 1
  console.log(`\npage errors: ${errors.slice(0, 3).join(' | ')}`)
}

await browser.close()
console.log(failures ? `\n${failures} problem(s)\n` : '\nall clear\n')
process.exit(failures ? 1 : 0)
