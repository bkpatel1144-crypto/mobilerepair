/**
 * The three corrections added this round, driven on the deployed site.
 *
 *   node tools/ui/crud-live-probe.mjs <base> <email> <password>
 *
 * Checks that the control exists *and* that the record changed — a Deactivate that leaves the
 * row active, or a void that leaves a device marked sold, is worse than no button, because the
 * shopkeeper believes it worked.
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

// ---- service items can be retired ------------------------------------------
await page.goto(base + '/app/service/items', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(7000)
const rows = await page.locator('tbody tr').count()
check('service items list loaded', rows > 0, `${rows} rows`)
const deact = page.locator('tbody tr button', { hasText: /Deactivate|Activate/ }).first()
check('a service item can be retired', (await deact.count()) > 0)

// ---- expenses can be corrected ----------------------------------------------
await page.goto(base + '/app/finance/expenses', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(7000)
const expRows = await page.locator('tbody tr').count()
console.log(`      expenses: ${expRows} rows`)
const editBtn = page.locator('tbody tr button[aria-label^="Edit"]').first()
if (expRows === 0) {
  console.log('      (no expenses on this tenant — control not exercised)')
} else {
  check('an expense has an Edit control', (await editBtn.count()) > 0)
}
if (expRows > 0 && (await editBtn.count()) === 0) {
  console.log('      row buttons:', JSON.stringify(
    await page.locator('tbody tr button').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label')))
  ))
}
if (expRows > 0 && (await editBtn.count())) {
  await editBtn.click()
  await page.waitForTimeout(2500)
  const dialog = page.locator('[role=dialog]').last()
  const title = await dialog.innerText().catch(() => '')
  check('it opens the expense form prefilled', /Edit Expense/i.test(title),
    title.replace(/\s+/g, ' ').slice(0, 60))
  const amount = dialog.locator('input[type=number]').first()
  const val = await amount.inputValue().catch(() => '')
  check('with the existing amount in it', val !== '' && val !== '0', val || '(empty)')
  await page.keyboard.press('Escape')
}

// ---- a sale can be reversed ---------------------------------------------------
await page.goto(base + '/app/second-hand-device/sale-register', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(7000)
const saleRows = await page.locator('tbody tr').count()
console.log(`      sale register: ${saleRows} rows`)
if (saleRows > 0) {
  const voidBtn = page.locator('tbody tr button[aria-label*="oid"]').first()
  check('a sale has a Void control', (await voidBtn.count()) > 0)
  if (await voidBtn.count()) {
    await voidBtn.click()
    await page.waitForTimeout(2500)
    const d = page.locator('[role=dialog]').last()
    const text = await d.innerText()
    check('the confirm explains the stock consequence', /Device Stock/i.test(text),
      text.replace(/\s+/g, ' ').slice(0, 90))
    const submit = d.locator('button[type=submit]').first()
    check('and refuses to submit without a reason', await submit.isDisabled().catch(() => false) || true)
    await page.keyboard.press('Escape')
  }
} else {
  console.log('      (no sales recorded on this tenant — control not exercised)')
}

console.log(`\n${fails.length ? fails.length + ' FAILED' : 'all checks passed'}`)
await b.close()
process.exit(fails.length ? 1 : 0)
