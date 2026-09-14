/**
 * Phase 15b — proves a job card can actually be taken in with no connection, and that the tax
 * invoice series stays consecutive.
 *
 *   node tools/ui/offline-intake-probe.mjs <base> [email] [password]
 *
 * The one thing that would make this worthless is a probe that "creates" a job card offline and
 * never checks it reached Firestore. So the card is created with the line cut, the line is
 * restored, the page is **fully reloaded** (which empties every in-memory cache), and the job is
 * looked for again. A number that only ever existed in local storage does not survive that.
 *
 * Navigation while offline is done by clicking — a URL navigation is a full document load that
 * fails in the browser before the app is involved.
 */
import { chromium } from 'playwright'

const [base, emailArg, passwordArg, billableJobId] = process.argv.slice(2)
if (!base) {
  console.error(
    'usage: node tools/ui/offline-intake-probe.mjs <base> [email] [password] [billableJobId]'
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
const context = await browser.newContext({ viewport: { width: 1500, height: 1100 } })
const page = await context.newPage()
const stamp = Date.now()
const email = emailArg ?? `intake-${stamp}@aim-probe.test`
const password = passwordArg ?? 'ProbeOnly!2345'

if (emailArg) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(14_000)
} else {
  await page.goto(`${base}/signup`, { waitUntil: 'domcontentloaded' })
  await page.fill('#companyName', `ZZ INTAKE ${stamp}`)
  await page.fill('#fullName', 'Intake Probe')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(26_000)
}

const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))

/** The sidebar is an accordion, so clicking an already-open section *closes* it. Only click the
 *  section header when its leaf is not already on screen. */
async function navigateTo(section, leaf) {
  const link = page.locator('nav a', { hasText: leaf }).first()
  if (!(await link.isVisible().catch(() => false))) {
    await page.locator('nav button', { hasText: new RegExp(`^${section}$`) }).first().click()
    await page.waitForTimeout(1200)
  }
  await link.click()
  await page.waitForTimeout(4500)
  return page.url()
}

const cdp = await context.newCDPSession(page)
const setOffline = async (offline) => {
  await cdp.send('Network.emulateNetworkConditions', {
    offline,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  })
  await page.evaluate((o) => window.dispatchEvent(new Event(o ? 'offline' : 'online')), offline)
  await page.waitForTimeout(1500)
}

// ---- one job card online, which also reserves this device's block ----------
await navigateTo('Service', /Job Cards/i)
await page.locator('button', { hasText: /^Create Job Card$/ }).first().click()
await page.waitForTimeout(4500)

/** Picks the first option in a `SearchSelect` by clicking its trigger and the first row. */
async function pick(triggerText) {
  const trigger = page.locator('button', { hasText: triggerText }).first()
  if ((await trigger.count()) === 0) return false
  await trigger.click()
  await page.waitForTimeout(1000)
  const option = page.locator('[data-slot=popover-content]:visible [role=option]').first()
  if ((await option.count()) === 0) {
    await page.keyboard.press('Escape')
    return false
  }
  await option.click()
  await page.waitForTimeout(900)
  return true
}

/**
 * Fills the minimum intake validation insists on, picking seeded masters throughout.
 *
 * Nothing here quick-adds anything: `seed-intake-masters.mjs` has already put a customer, a
 * device type, a brand, a model and a problem in place. Driving four different create-new
 * footers would be a test of the pickers, not of whether a job card can be created offline.
 */
async function fillIntake() {
  await pick(/Search customer by name or mobile/i)
  await pick(/Search device type/i)
  await pick(/Select brand/i)
  await pick(/Enter model name/i)

  // Problems is a multi-select popover whose rows are plain buttons drawing their own tick.
  await page.locator('button', { hasText: /Select problems/i }).first().click()
  await page.waitForTimeout(1200)
  const popover = page.locator('[data-slot=popover-content]:visible').last()
  const row = popover.locator('button', { hasText: /Screen not working/i }).first()
  if ((await row.count()) > 0) {
    await row.click()
    await page.waitForTimeout(700)
  }
  const done = popover.locator('button', { hasText: /^Done$/ }).first()
  if ((await done.count()) > 0) await done.click()
  else await page.keyboard.press('Escape')
  await page.waitForTimeout(900)
}

await fillIntake()
await page.locator('main button', { hasText: /^Create Job Card$/ }).last().click()
await page.waitForTimeout(10_000)
const firstUrl = page.url()
const alerts = page.locator('main [role=alert]')
const firstAttempt =
  (await alerts.count()) > 0 ? await alerts.first().innerText() : await page.locator('main').innerText()
check(
  'an online job card was created',
  !firstUrl.includes('/create'),
  firstUrl.includes('/create')
    ? firstAttempt.replace(/\s+/g, ' ').slice(0, 120)
    : firstUrl
)
const firstBody = await page.locator('main').innerText()
const firstNumber = (firstBody.match(/JC-[\d-]+/) || [null])[0]
check('and it has a job number', !!firstNumber, firstNumber ?? 'none')

// ---- now cut the line and take in another device --------------------------
await navigateTo('Service', /Job Cards/i)
await setOffline(true)

await page.locator('button', { hasText: /^Create Job Card$/ }).first().click()
await page.waitForTimeout(4000)
check('the intake form opens offline', page.url().includes('/create'), page.url())

let formBody = await page.locator('main').innerText()
check(
  'it says how many job cards this device can still create',
  /this device can still create \d+ job cards/i.test(formBody),
  (formBody.replace(/\s+/g, ' ').match(/Offline — this device[^.]*\./) || ['not shown'])[0]
)

await fillIntake()

const createOffline = page.locator('main button', { hasText: /^Create Job Card$/ }).last()
check('Create is enabled offline', await createOffline.isEnabled())
await createOffline.click()
await page.waitForTimeout(9000)

const offlineUrl = page.url()
const offlineAlerts = page.locator('main [role=alert]')
check(
  'the job card was created with no connection',
  !offlineUrl.includes('/create'),
  (await offlineAlerts.count()) > 0
    ? (await offlineAlerts.first().innerText()).replace(/\s+/g, ' ').slice(0, 120)
    : offlineUrl
)
// The number is deliberately not read off the detail page here. What matters is not what the
// screen says the moment after the write — it is what is in Firestore once the connection is
// back and every local cache has been thrown away. That is checked below, by reload.

// ---- an advance is still refused, and says why -----------------------------
await navigateTo('Service', /Job Cards/i)
await page.locator('button', { hasText: /^Create Job Card$/ }).first().click()
await page.waitForTimeout(4000)
const advanceBox = page.locator('main input[type=number]').last()
if (await advanceBox.count()) {
  await advanceBox.fill('500')
  await page.waitForTimeout(1200)
  formBody = await page.locator('main').innerText()
  check('an advance offline is refused with a reason', /advance cannot be taken/i.test(formBody))
  const blocked = page.locator('main button', { hasText: /^Create Job Card$/ }).last()
  check('and Create is disabled while an advance is entered', !(await blocked.isEnabled()))
}

// ---- back online, and a full reload proves it really reached Firestore -----
// A full reload, not a re-render: it drops every in-memory cache and re-reads. A number that
// only ever existed in this device's local storage does not survive it.
await setOffline(false)
await page.goto(`${base}/app/service/job-cards`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(10_000)
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(10_000)
const listBody = await page.locator('main').innerText()
const numbers = [...new Set(listBody.match(/JC-2026-27-\d{5}/g) ?? [])].sort()
check('the online job card is there', numbers.includes(firstNumber ?? ' '), numbers.join(', '))
check(
  'and so is the one created offline',
  numbers.length >= 2,
  `${numbers.length} job cards: ${numbers.join(', ')}`
)
// Issued from the same reserved block, one after the other — proof the block, not a second
// transaction, is what numbered it.
check(
  'the offline card took the next number in the block',
  numbers.includes('JC-2026-27-00002'),
  numbers.join(', ')
)

// ---- the invoice series is separate, and gapless -------------------------
// Billing is what mints an invoice number, so the list has to have something in it before the
// column exists at all — an empty Sales Invoices renders an empty state, not headers.
if (billableJobId) {
  await page.goto(`${base}/app/service/job-cards/${billableJobId}`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(6000)
  const bill = page.locator('main button', { hasText: /Generate Bill/i }).first()
  check('a finished job offers Generate Bill', (await bill.count()) > 0)
  if ((await bill.count()) > 0) {
    await bill.click()
    await page.waitForTimeout(1800)
    const dialog = page.locator('[role=dialog]').last()
    const confirm = dialog.locator('button', { hasText: /Generate Bill|Confirm|Yes/i }).last()
    if ((await confirm.count()) > 0) await confirm.click()
    await page.waitForTimeout(9000)
  }

  await navigateTo('Sales', /Sales Invoices/i)
  await page.waitForTimeout(3000)
  const salesBody = await page.locator('main').innerText()
  check('Sales Invoices has an Invoice No. column', /Invoice No/i.test(salesBody))
  const invoiceNumber = (salesBody.match(/INV-[\d-]+/) || [null])[0]
  check('the bill got a number from the invoice series', !!invoiceNumber, invoiceNumber ?? 'none')
  // The point of the whole design: the invoice series starts at 1 and is incremented one at a
  // time, while job numbers came out of a block and are already past 20.
  check(
    'and that series starts at 1, not at a block boundary',
    invoiceNumber?.endsWith('00001') === true,
    invoiceNumber ?? 'none'
  )
}

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '))

console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : 'all checks passed'}`)
await browser.close()
process.exit(failures.length ? 1 : 0)
