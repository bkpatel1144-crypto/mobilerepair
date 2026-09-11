/**
 * Drives Purchase > General Purchase end to end: create an entry, read it back, view it, cancel
 * it, and check what each step does to the four summary cards.
 *
 *   node tools/ui/purchase-check.mjs <base> [screenshotDir]
 *
 * Text comparisons are case-insensitive on purpose: the stat card labels are upper-cased in CSS,
 * not in the string, and a case-sensitive check reported four working cards as missing.
 *
 * The cancel step is the one worth having. A cancelled entry has to keep its lines and its total
 * on screen while dropping out of "This list value" and "Owed to suppliers" — the shop neither
 * holds those parts nor owes for them — and that is two behaviours that can disagree.
 */
import { chromium } from 'playwright'

const [base, out] = process.argv.slice(2)
if (!base) {
  console.error('usage: node tools/ui/purchase-check.mjs <base> [screenshotDir]')
  process.exit(1)
}

const failures = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures.push(label)
  return ok
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon/i.test(m.text())) errors.push(m.text().slice(0, 160))
})

const stamp = Date.now()
await page.goto(`${base}/signup`, { waitUntil: 'domcontentloaded' })
await page.fill('#companyName', `ZZ PUR ${stamp}`)
await page.fill('#fullName', 'Purchase Probe')
await page.fill('#email', `pur-${stamp}@aim-probe.test`)
await page.fill('#password', 'ProbeOnly!2345')
await page.click('button[type=submit]')
await page.waitForTimeout(26_000)

const open = async () => {
  await page.goto(`${base}/app/purchase/general`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4500)
  return (await page.locator('main').innerText()).toLowerCase()
}

let body = await open()
check('a real page, not a placeholder', !/is built in phase/.test(body))
for (const s of ['general purchase', 'total entries', 'active', 'this list value', 'owed to suppliers'])
  check(`shows "${s}"`, body.includes(s))
check('starts empty', /no purchases yet/.test(body))

// ---- create -------------------------------------------------------------------------
await page.getByRole('button', { name: /new purchase/i }).first().click()
await page.waitForTimeout(2000)

const dialog = page.locator('[role=dialog]').first()
const combos = dialog.locator('[data-slot=popover-trigger]')
check('the entry form has a supplier and an item picker', (await combos.count()) >= 2)

// supplier — create one on the spot
await combos.nth(0).click()
await page.waitForTimeout(900)
const addNew = page.locator('[data-slot=popover-content] input[placeholder*="Add New" i]').first()
if (check('supplier picker can add a new supplier', (await addNew.count()) > 0)) {
  await addNew.fill('Ganesh Mobiles')
  await page.locator('[data-slot=popover-content] button').last().click()
  await page.waitForTimeout(4000)
}

// item — pick the first seeded one
await combos.nth(1).click()
await page.waitForTimeout(900)
const firstItem = page.locator('[data-slot=popover-content] button').first()
check('item picker lists the seeded items', (await firstItem.count()) > 0)
await firstItem.click()
await page.waitForTimeout(900)

const qty = dialog.locator('input[aria-label]').first()
const rate = dialog.locator('input[aria-label]').nth(1)
await qty.fill('2')
await rate.fill('1500')
await page.waitForTimeout(700)
const dialogText = await dialog.innerText()
check('the row total is computed', /3,?000/.test(dialogText), '2 × 1500')

if (out) await page.screenshot({ path: `${out}/purchase-new-entry.png` })
await page.getByRole('button', { name: /save purchase/i }).first().click()
await page.waitForTimeout(6000)

body = await open()
check('the entry survives a reload', /pur-\d{4}-\d{2}-\d{5}/.test(body), body.match(/pur-[\d-]+/)?.[0] ?? '')
check('it shows the supplier', body.includes('ganesh mobiles'))
check('it shows the amount', /3,?000/.test(body))
check('it counts as active', /active/.test(body))
check('the list value picked it up', /₹3,?000/.test(body), 'credit purchase')
check('and so did owed to suppliers', (body.match(/₹3,?000/g) ?? []).length >= 2, 'unpaid on credit')
if (out) await page.screenshot({ path: `${out}/purchase-list.png` })

// ---- view ---------------------------------------------------------------------------
await page.locator('button[aria-label^="Actions for"]').first().click()
await page.waitForTimeout(900)
await page.getByRole('menuitem', { name: /view/i }).first().click()
await page.waitForTimeout(2000)
const view = (await page.locator('[role=dialog]').first().innerText()).toLowerCase()
for (const s of ['supplier', 'invoice #', 'purchase terms', 'on credit', 'total', 'print receipt'])
  check(`the view shows "${s}"`, view.includes(s))
check('the view lists the line', /2 × ₹1500/.test(view))
if (out) await page.screenshot({ path: `${out}/purchase-view.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(900)

// ---- cancel -------------------------------------------------------------------------
await page.locator('button[aria-label^="Actions for"]').first().click()
await page.waitForTimeout(900)
await page.getByRole('menuitem', { name: /cancel entry/i }).first().click()
await page.waitForTimeout(1500)
await page.getByRole('button', { name: /^cancel entry$/i }).last().click()
await page.waitForTimeout(5000)

body = await open()
check('the entry now reads cancelled', /cancelled/.test(body))
check('but its amount is still on the row', /3,?000/.test(body), 'the record is kept')
check('list value drops to zero', /₹0/.test(body), 'a cancelled entry is not stock you hold')
check('owed to suppliers drops to zero', (body.match(/₹0/g) ?? []).length >= 2)

await page.locator('button[aria-label^="Actions for"]').first().click()
await page.waitForTimeout(900)
await page.getByRole('menuitem', { name: /view/i }).first().click()
await page.waitForTimeout(2000)
const after = (await page.locator('[role=dialog]').first().innerText()).toLowerCase()
check('the view explains the cancellation', /cancelled:/.test(after))
check('and records it in Edit history', /edit history/.test(after))
check('naming what it did to the money', /₹3,?000\s*→\s*₹0/.test(after))
if (out) await page.screenshot({ path: `${out}/purchase-cancelled.png` })

check('no console errors throughout', errors.length === 0, errors[0] ?? '')
await browser.close()
console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(' | ')}` : 'all checks passed'}\n`)
process.exit(failures.length ? 1 : 0)
