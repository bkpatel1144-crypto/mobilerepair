/**
 * Records a second-hand sale and reverses it, checking the device comes back into stock.
 *
 *   node tools/ui/void-sale-probe.mjs <base> <email> <password>
 *
 * The stock half is the whole reason this exists. Creating a sale flips its purchase to
 * `sold`, so a void that marks the sale and forgets the device leaves a real handset
 * unsellable for ever — and nothing on screen would say so. Device Stock before and after is
 * the only honest check.
 */
import { chromium } from 'playwright'
const [base, email, password] = process.argv.slice(2)
const fails = []
const check = (l, ok, d = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${l}${d ? `  — ${d}` : ''}`)
  if (!ok) fails.push(l)
}
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1600, height: 1050 } })
await page.goto(base + '/login', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email); await page.fill('#password', password)
await page.click('button[type=submit]'); await page.waitForTimeout(15000)

const stockCount = async () => {
  await page.goto(base + '/app/second-hand-device/stock', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(6500)
  return page.locator('tbody tr').count()
}

/** Picks the first option in a SearchSelect, creating one through the Add footer if empty. */
async function pick(re, createName) {
  const trigger = page.locator('button', { hasText: re }).first()
  if ((await trigger.count()) === 0) return false
  await trigger.click()
  await page.waitForTimeout(1200)
  const pop = page.locator('[data-slot=popover-content]:visible').last()
  const opt = pop.locator('[role=option]').first()
  if (await opt.count()) { await opt.click(); await page.waitForTimeout(700); return true }
  if (!createName) { await page.keyboard.press('Escape'); return false }
  const search = pop.locator('input').first()
  if (await search.count()) { await search.fill(createName); await page.waitForTimeout(600) }
  await pop.locator('button', { hasText: /^Add/i }).last().click()
  await page.waitForTimeout(2200)
  const d = page.locator('[role=dialog]').last()
  const mobile = d.locator('input[placeholder*="9876543210" i], input[placeholder*="mobile" i]').first()
  if (await mobile.count()) await mobile.fill('96' + String(Date.now()).slice(-8))
  await d.locator('button[type=submit]').first().click()
  await page.locator('[role=dialog]').last().waitFor({ state: 'detached', timeout: 25000 }).catch(() => {})
  await page.waitForTimeout(1500)
  return true
}

let before = await stockCount()
if (before === 0) {
  // Nothing in stock on this tenant, so buy one — the probe has to create the state it needs
  // rather than skip and report a pass it did not earn.
  console.log('      no stock; buying a device first')
  await page.goto(base + '/app/second-hand-device/purchase/create', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(6500)
  const stamp = Date.now()
  await pick(/Search device type/i)
  await pick(/Pick a device type first|Select brand|Search brand/i)
  await pick(/Pick a brand first|Enter model name/i, `ZZ Model ${stamp}`)
  await pick(/Search seller by name or mobile/i, `ZZ Seller ${stamp}`)
  const priceLabel = page.locator('main label', { hasText: /Purchase Price/i }).first()
  await priceLabel.locator('xpath=following::input[1]').first().fill('4000')
  await page.waitForTimeout(700)
  await page.locator('main button', { hasText: /^(Save|Create|Buy|Record)/i }).last().click()
  await page.waitForTimeout(12000)
  before = await stockCount()
}
check('there is a device in stock to sell', before > 0, `${before} in stock`)
if (before === 0) { await b.close(); process.exit(1) }

// ---- sell one ---------------------------------------------------------------
await page.goto(base + '/app/second-hand-device/sale', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6500)
const sellBtn = page.locator('tbody tr button').first()
check('a device can be sold from the list', (await sellBtn.count()) > 0)
await sellBtn.click()
await page.waitForTimeout(2500)
const dialog = page.locator('[role=dialog]').last()
// buyer picker, then price
const trigger = dialog.locator('button', { hasText: /Search|Select/i }).first()
if (await trigger.count()) {
  await trigger.click()
  await page.waitForTimeout(1200)
  const opt = page.locator('[role=option]:visible').first()
  if (await opt.count()) await opt.click()
  else await page.keyboard.press('Escape')
  await page.waitForTimeout(700)
}
const price = dialog.locator('input[type=number]').first()
if (await price.count()) await price.fill('7000')
await page.waitForTimeout(600)
// This dialog is a raw `<Dialog>`, not `FormModal`, so its confirm is a plain button.
const submit = dialog.locator('button', { hasText: /Confirm Sale/i }).first()
await submit.click()
await page.waitForTimeout(10000)
check('the sale was recorded', (await page.locator('[role=dialog]').count()) === 0)

const afterSale = await stockCount()
check('the device left stock', afterSale === before - 1, `${before} -> ${afterSale}`)

// ---- reverse it ---------------------------------------------------------------
await page.goto(base + '/app/second-hand-device/sale-register', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6500)

/** The register's headline total sales figure. */
const totalSales = async () => {
  const txt = await page.locator('main').innerText()
  // The stat label renders uppercase, and the match has to be case-*sensitive*: the subtitle
  // "All device sales — profit, margin and export" sits above it and a case-insensitive
  // search found that instead, then gave up looking for a ₹ that was 40 characters away.
  const m = txt.match(/SALES\s*₹([\d,]+)/)
  return m ? Number(m[1].replace(/,/g, '')) : null
}
const salesBefore = await totalSales()
const voidBtn = page.locator('tbody tr button[aria-label*="oid"]').first()
check('the new sale has a Void control', (await voidBtn.count()) > 0)
await voidBtn.click()
await page.waitForTimeout(2500)
const vd = page.locator('[role=dialog]').last()
check('the confirm names the stock consequence', /Device Stock/i.test(await vd.innerText()))
await vd.locator('textarea').first().fill('ZZ probe — reversing a test sale')
await page.waitForTimeout(500)
const vsubmit = vd.locator('button[type=submit]').first()
console.log('      submit disabled?', await vsubmit.isDisabled().catch(() => 'n/a'))
await vsubmit.click()
await page.waitForTimeout(10000)
const stillOpen = (await page.locator('[role=dialog]').count()) > 0
if (stillOpen) {
  console.log('      dialog says:', (await page.locator('[role=dialog]').last().innerText())
    .replace(/\s+/g, ' ').slice(0, 220))
}
check('the void went through', !stillOpen)

const afterVoid = await stockCount()
check('the device came back into stock', afterVoid === before, `${afterSale} -> ${afterVoid}`)

await page.goto(base + '/app/second-hand-device/sale-register', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6500)
const body = await page.locator('main').innerText()
check('the sale is still listed, marked voided', /Voided/i.test(body))

// The money half. A void that leaves the row out of the list but inside the totals is the
// same class of bug as removing a part without taking its cost off a job.
const salesAfter = await totalSales()
check(
  'the voided sale stopped counting towards total sales',
  salesBefore !== null && salesAfter !== null && salesBefore - salesAfter === 7000,
  `₹${salesBefore} -> ₹${salesAfter} (expected -₹7000)`
)

console.log(`\n${fails.length ? fails.length + ' FAILED' : 'all checks passed'}`)
await b.close()
process.exit(fails.length ? 1 : 0)
