/**
 * The client's own example: adding a customer from inside a job card.
 *
 *   node tools/ui/add-party-from-picker-probe.mjs <base> <email> <password>
 *
 * "If they create a new job card and in party add name and this nothing" — the old inline
 * quick-add created a party with a name and nothing else. Pressing Add in a picker now opens the
 * real Add Party form, and what matters is that it is *the same* form Masters > Parties opens,
 * not a cut-down copy: so this checks the fields only the real form has (category, GST, credit),
 * saves through it, and then confirms the new party is selected in the picker it was opened from
 * *and* present in the Parties master with the details that were typed.
 *
 * A probe that only checked "a dialog appeared" would pass on a second quick-add box.
 */
import { chromium } from 'playwright'

const [base, email, password] = process.argv.slice(2)
if (!base || !email || !password) {
  console.error('usage: node tools/ui/add-party-from-picker-probe.mjs <base> <email> <password>')
  process.exit(1)
}

const failures = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } })
const stamp = Date.now()
const customerName = `ZZ Picker Customer ${stamp}`
const mobile = `97${String(stamp).slice(-8)}`

await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(14_000)

const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon/i.test(m.text())) errors.push(m.text().slice(0, 160))
})

// ---- open the picker and type a name that does not exist -------------------
await page.goto(`${base}/app/service/job-cards/create`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)

await page.locator('button', { hasText: /Search customer by name or mobile/i }).first().click()
await page.waitForTimeout(800)
const search = page.locator('input[placeholder*="Type to search" i]').first()
await search.fill(customerName)
await page.waitForTimeout(900)

const popover = page.locator('[data-slot=popover-content]:visible').last()
const addButton = popover.locator('button', { hasText: /^Add ".*"…$/ }).first()
check('the footer offers to add what was typed', (await addButton.count()) > 0, await addButton.innerText().catch(() => 'not found'))
check(
  'and there is no second "Add New" text box',
  (await popover.locator('input[placeholder="Add New..."]').count()) === 0
)

await addButton.click()
await page.waitForTimeout(1800)

// ---- it is the real form, not a cut-down one -------------------------------
const dialog = page.locator('[role=dialog]').last()
const dialogText = await dialog.innerText()
check('the real Add Party form opened', /Create Party|Party Name/i.test(dialogText), dialogText.replace(/\s+/g, ' ').slice(0, 60))
for (const field of ['Mobile', 'Category', 'Customer', 'Supplier']) {
  check(`the form has ${field}`, dialogText.includes(field))
}
// The fields the old quick-add could never collect.
await dialog.locator('button', { hasText: /extra details|optional/i }).first().click().catch(() => {})
await page.waitForTimeout(700)
const expanded = await dialog.innerText()
check(
  'and the full party fields, not just name and mobile',
  /GST Number/i.test(expanded) && /Pincode/i.test(expanded),
  expanded.replace(/\s+/g, ' ').slice(0, 70)
)

check(
  'the typed name carried into the form',
  (await dialog.locator('input').first().inputValue()) === customerName
)

// ---- fill it properly and save ---------------------------------------------
await dialog.locator('input[placeholder*="9876543210" i], input[placeholder*="mobile" i]').first().fill(mobile)
await page.waitForTimeout(400)
await dialog.locator('button[type=submit]').first().click()
await page.waitForTimeout(8000)

// ---- the picker now has it selected ----------------------------------------
const formBody = await page.locator('main').innerText()
check('the new customer is selected in the picker', formBody.includes(customerName), formBody.replace(/\s+/g, ' ').slice(0, 80))
check('and the form closed', (await page.locator('[role=dialog]').count()) === 0)

// ---- and it is a real party in the master, with the mobile ------------------
await page.goto(`${base}/app/masters/parties`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
const listSearch = page.locator('main input[placeholder*="Search" i]').first()
if (await listSearch.count()) {
  await listSearch.fill(customerName)
  await page.waitForTimeout(1500)
}
const row = page.locator('tbody tr', { hasText: customerName }).first()
check('it is in Masters > Parties', (await row.count()) > 0)
if (await row.count()) {
  const rowText = await row.innerText()
  check('with the mobile number that was entered', rowText.includes(mobile), rowText.replace(/\s+/g, ' ').slice(0, 60))
}

check('no console errors', errors.length === 0, errors.slice(0, 2).join(' | '))

console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : 'all checks passed'}`)
await browser.close()
process.exit(failures.length ? 1 : 0)
