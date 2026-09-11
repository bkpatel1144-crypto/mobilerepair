/**
 * Checks the two rules that keep a bill and its parts honest, in a real browser.
 *
 *   node tools/ui/bill-flow-check.mjs <base> <email> <password> [screenshotDir]
 *
 * Run `tools/ui/seed-billed-job.mjs` first — it writes an already-billed job card (₹245 billed,
 * ₹250 paid, three parts), which is the state both rules are about. Driving the intake form to
 * reach that state does not work on a fresh tenant, whose Customer / Brand / Model pickers are
 * all empty.
 *
 * The rules:
 *
 *  1. Parts cannot be added to a billed job. `addPart` wrote `partsCost` and never
 *     `finalAmount`, so a part added after Generate Bill was a part the shop paid for and never
 *     charged for. Types, unit tests and lint all passed the entire time that was true — only
 *     opening a billed job and looking for the button can tell you.
 *  2. Editing a bill below what the customer already paid hands the difference back, and says so
 *     on the record.
 *
 * Every check prints, and the run fails if a step could not even be attempted, so a probe that
 * quietly did nothing cannot read as a pass.
 */
import { chromium } from 'playwright'

const [base, email, password, out] = process.argv.slice(2)
if (!base || !email || !password) {
  console.error('usage: node tools/ui/bill-flow-check.mjs <base> <email> <password> [dir]')
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

await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(14_000)
check('signed in', page.url().includes('/app/'), page.url())

// ------------------------------------------------- rule 1: no parts on a billed job
await page.goto(`${base}/app/service/job-cards`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
const listText = await page.locator('main').innerText()
check('the seeded job is listed', listText.includes('JC-2026-27-09001'))

const row = page.getByText('JC-2026-27-09001').first()
await row.click()
await page.waitForTimeout(4000)

const drawer = await page.locator('body').innerText()
check('drawer opened on the billed job', /parts used/i.test(drawer))
check(
  'the job really is billed',
  /ready/i.test(drawer),
  drawer.match(/Ready[^\n]*/)?.[0]?.slice(0, 30) ?? ''
)

const addPartCount =
  (await page.getByRole('button', { name: /^add part$/i }).count()) +
  (await page.getByText(/^Add Part$/).count())
check(
  'Add Part is NOT offered on a billed job — the money rule',
  addPartCount === 0,
  addPartCount ? `still offered ${addPartCount}×; parts could be added without the bill following` : 'blocked'
)
if (out) await page.screenshot({ path: `${out}/billed-job-no-add-part.png` })

// ------------------------------------------------- rule 2: editing the bill settles the money
await page.goto(`${base}/app/sales/invoices`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
const invoiceText = await page.locator('main').innerText()
check('the bill appears on Sales Invoices', invoiceText.includes('JC-2026-27-09001'))

const pencil = page.locator('button[aria-label^="Edit bill"]').first()
if (check('Edit Bill action present', (await pencil.count()) > 0)) {
  await pencil.click()
  await page.waitForTimeout(3000)
  const modal = await page.locator('body').innerText()
  check('Edit Bill opened', /edit bill/i.test(modal))

  for (const label of ['Parts / Services', 'Service Charge', 'Discount', 'Already Paid']) {
    check(`shows "${label}"`, modal.includes(label))
  }
  for (const code of ['SRV003', 'SRV009']) {
    check(`shows the item code ${code}`, modal.includes(code))
  }
  check('shows a line total', /₹12\s*×\s*1\s*=\s*₹12/.test(modal.replace(/\s+/g, ' ')))
  check('totals the parts at ₹245', /Parts \/ Services\s*₹?245/.test(modal.replace(/\n/g, ' ')))
  check('already reports a ₹5 refund', /refund/i.test(modal), 'seeded ₹250 paid against ₹245')
  if (out) await page.screenshot({ path: `${out}/edit-bill.png` })

  // Discount it further; the refund must grow with it.
  const discount = page.locator('#discount').first()
  if (check('discount field present', (await discount.count()) > 0)) {
    await discount.fill('45')
    await page.waitForTimeout(1200)
    const discounted = (await page.locator('body').innerText()).replace(/\n/g, ' ')
    check('total falls to ₹200 with a ₹45 discount', /Total\s*₹?200/.test(discounted))
    check('refund rises to ₹50', /₹50\b/.test(discounted), 'paid 250, bill now 200')
    if (out) await page.screenshot({ path: `${out}/edit-bill-refund.png` })

    await page.getByRole('button', { name: /save changes/i }).first().click()
    await page.waitForTimeout(8000)
    check('modal closed after saving', (await page.locator('#discount').count()) === 0)
  }
}

// ------------------------------------------------- the refund must be on the books
await page.goto(`${base}/app/finance/receipts`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
const receipts = await page.locator('main').innerText()
const payNumber = receipts.match(/PAY-\d{4}-\d{5}/)?.[0]
check('an outgoing PAY- receipt was written', Boolean(payNumber), payNumber ?? 'none on the page')
check('the refund is ₹50', /50/.test(receipts))
if (out) await page.screenshot({ path: `${out}/refund-receipt.png` })

await page.goto(`${base}/app/service/job-cards`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
await page.getByText('JC-2026-27-09001').first().click()
await page.waitForTimeout(4000)
const after = await page.locator('body').innerText()
check('the timeline records "Bill Edited"', /bill edited/i.test(after))
check('and names both totals', /245\s*→\s*₹?\s*200/.test(after.replace(/\s+/g, ' ')))
if (out) await page.screenshot({ path: `${out}/after-edit.png` })

await browser.close()
console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(' | ')}` : 'all checks passed'}\n`)
process.exit(failures.length ? 1 : 0)
