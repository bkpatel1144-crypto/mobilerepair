/**
 * Phase 14 — proves warranty is answerable and a returning device can be reopened.
 *
 *   node tools/ui/warranty-rework-probe.mjs <base> <email> <password> <jobId> <jobNumber> <mobile>
 *
 * Run `tools/ui/seed-warranty-job.mjs` first; it prints everything to pass in.
 *
 * The seeded job was delivered three months ago with a six-month bill warranty and a one-year
 * part warranty, so the dates are real rather than starting today — a window beginning today
 * would read as live even if the arithmetic were wrong.
 */
import { chromium } from 'playwright'

const [base, email, password, jobId, jobNumber, mobile] = process.argv.slice(2)
if (!base || !email || !password || !jobId || !jobNumber || !mobile) {
  console.error(
    'usage: node tools/ui/warranty-rework-probe.mjs <base> <email> <password> <jobId> <jobNumber> <mobile>'
  )
  process.exit(1)
}

const failures = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures.push(label)
  return ok
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } })

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

// ---- the lookup is reachable without a new menu ---------------------------
await page.goto(`${base}/app/service/job-cards`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
const listBody = await page.locator('main').innerText()
check('Job Cards offers Warranty Lookup', /Warranty Lookup/i.test(listBody))

const sidebar = await page.locator('nav').first().innerText()
check(
  'and it did not become a 58th menu item',
  !/Warranty/i.test(sidebar),
  sidebar.replace(/\s+/g, ' ').slice(0, 60)
)

await page.locator('button', { hasText: /Warranty Lookup/i }).first().click()
await page.waitForTimeout(3500)
check('the lookup screen opens', page.url().includes('/job-cards/warranty'), page.url())

// ---- searching by phone number finds it -----------------------------------
const box = page.locator('main input').first()
await box.fill(mobile)
await page.waitForTimeout(2000)
let body = await page.locator('main').innerText()
check('searching by phone number finds the job', body.includes(jobNumber))
check('it reads as under warranty', /Under warranty/i.test(body))
check(
  'the bill warranty is listed with its expiry',
  /Whole bill/i.test(body) && /until \d{4}-\d{2}-\d{2}/i.test(body),
  (body.replace(/\s+/g, ' ').match(/Whole bill until [\d-]+ \d+ days left/) || ['not shown'])[0]
)
check('the part warranty is listed too', /Display Replacement/i.test(body))
check(
  'days left is a real countdown, not zero',
  /(\d+) days left/.test(body) && Number(body.match(/(\d+) days left/)[1]) > 30,
  (body.match(/(\d+) days left/) || ['none'])[0]
)

// ---- a wrong number finds nothing -----------------------------------------
await box.fill('1112223333')
await page.waitForTimeout(1500)
body = await page.locator('main').innerText()
check('an unrelated number matches nothing', /Nothing matched/i.test(body))

// ---- the job card itself says so ------------------------------------------
await page.goto(`${base}/app/service/job-cards/${jobId}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5500)
body = await page.locator('main').innerText()
check('the job card shows the warranty state', /Under warranty/i.test(body))
check('and offers Reopen for Rework', /Reopen for Rework/i.test(body))

// ---- reopen it ------------------------------------------------------------
await page.locator('button', { hasText: /Reopen for Rework/i }).first().click()
await page.waitForTimeout(1500)
const dialog = page.locator('[role=dialog]').last()
const dialogText = await dialog.innerText()
check(
  'the dialog defaults to no charge while covered',
  /Under warranty — no charge/i.test(dialogText) && /still under warranty/i.test(dialogText)
)

const box2 = dialog.locator('textarea').first()
await box2.fill('Screen flickering again after 10 days')
await page.waitForTimeout(400)
await dialog.locator('button[type=submit]').first().click()
await page.waitForTimeout(9000)

const newUrl = page.url()
check('it lands on the new rework card', /\/app\/service\/job-cards\/[A-Za-z0-9]{15,}/.test(newUrl) && !newUrl.includes(jobId), newUrl)

body = await page.locator('main').innerText()
check('the new card links back to the original', body.includes(`Rework of ${jobNumber}`))
check('and is marked a warranty job', /Warranty job/i.test(body))
check('the reason carried over', /flickering again/i.test(body))
check('it starts unbilled and unpaid', /Pending/i.test(body))

// ---- and the original knows it came back ----------------------------------
await page.goto(`${base}/app/service/job-cards/${jobId}`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5500)
body = await page.locator('main').innerText()
check('the original links forward to the rework', /Came back as JC-/i.test(body))
check('and its timeline records the return', /Device Returned/i.test(body))
check(
  'the original bill is untouched',
  /2,?000/.test(body),
  (body.replace(/\s+/g, ' ').match(/₹\s?2,?000/) || ['not shown'])[0]
)

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '))

console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : 'all checks passed'}`)
await browser.close()
process.exit(failures.length ? 1 : 0)
