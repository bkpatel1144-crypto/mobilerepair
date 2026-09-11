/**
 * Phase 15a — proves the app tells the truth when the connection goes.
 *
 *   node tools/ui/offline-probe.mjs <base> [email] [password]
 *
 * The bar is not "a warning renders". It is that reading still works from cache, that a save
 * which cannot succeed is refused *before* the form is filled in, and that everything comes back
 * when the network does. Chromium's CDP offline flag is used rather than a mocked route, so the
 * browser's own `navigator.onLine` and Firestore's own connection handling both react for real.
 *
 * Navigation offline is done by *clicking*, never by `page.goto`. A URL navigation is a full
 * document load, which with no connection fails in the browser before the app is involved at
 * all — and because `goto` was caught and ignored, the checks that followed were silently
 * running against the previous page. A user on a dropped connection clicks links; so does this.
 */
import { chromium } from 'playwright'

const [base, emailArg, passwordArg] = process.argv.slice(2)
if (!base) {
  console.error('usage: node tools/ui/offline-probe.mjs <base> [email] [password]')
  process.exit(1)
}

const failures = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures.push(label)
  return ok
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
const page = await context.newPage()
const stamp = Date.now()
const email = emailArg ?? `offline-${stamp}@aim-probe.test`
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
  await page.fill('#companyName', `ZZ OFFLINE ${stamp}`)
  await page.fill('#fullName', 'Offline Probe')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(26_000)
}

/** Clicks a sidebar section open, then its leaf. Reports where it actually landed, so a nav
 *  click that silently missed cannot be mistaken for the screen under test behaving well. */
async function navigateTo(section, leaf) {
  await page.locator('nav button', { hasText: new RegExp(`^${section}$`) }).first().click()
  await page.waitForTimeout(1200)
  await page.locator('nav a', { hasText: leaf }).first().click()
  await page.waitForTimeout(4500)
  return page.url()
}

// Warm the cache: these are the screens that must still open with no connection. Routes are
// lazily code-split, so a screen never opened while online has no code downloaded — that case is
// checked separately further down.
await page.goto(`${base}/app/service/job-cards`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
await page.goto(`${base}/app/service/job-cards/create`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
await page.goto(`${base}/app/masters/parties`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4000)

let body = await page.locator('main').innerText()
check('online: no offline banner', !/You're offline/i.test(body))

// ---- cut the line ---------------------------------------------------------
const cdp = await context.newCDPSession(page)
await cdp.send('Network.emulateNetworkConditions', {
  offline: true,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1,
})
await page.evaluate(() => window.dispatchEvent(new Event('offline')))
await page.waitForTimeout(1500)

body = await page.locator('body').innerText()
check('offline: the banner appears', /You're offline/i.test(body))
check(
  'and it says what still works',
  /still open and read/i.test(body),
  (body.replace(/\s+/g, ' ').match(/You're offline[^.]*\./) || ['not shown'])[0].slice(0, 70)
)

// ---- reading still works from cache ---------------------------------------
const jobsUrl = await navigateTo('Service', /Job Cards/i)
check('navigated to Job Cards by clicking', jobsUrl.includes('/service/job-cards'), jobsUrl)
const listBody = await page.locator('body').innerText()
check(
  'a cached screen still opens with no connection',
  /Job Cards|Jobs/i.test(listBody) && !/ERR_INTERNET|can.t be reached/i.test(listBody),
  listBody.replace(/\s+/g, ' ').slice(0, 60)
)

// ---- a save that cannot work says so, before the form is filled ------------
await page.locator('button', { hasText: /^Create Job Card$/ }).first().click()
await page.waitForTimeout(4000)
check('the create form opened by clicking, offline', page.url().includes('/create'), page.url())
const formBody = await page.locator('main').innerText()
check(
  'Create Job Card explains it needs a connection',
  /needs a connection/i.test(formBody),
  (formBody.replace(/\s+/g, ' ').match(/You're offline\. This needs[^.]*\./) || ['not shown'])[0].slice(0, 80)
)
check('and says nothing has been saved', /Nothing has been saved/i.test(formBody))

const createButton = page.locator('main button', { hasText: /^Create Job Card$/ }).last()
check(
  'and the Create button is disabled rather than failing silently',
  (await createButton.count()) > 0 && !(await createButton.isEnabled())
)

// ---- a modal that mints a number does the same ----------------------------
// `^Parties$`, not `Part(y|ies)` — the looser pattern matched "Party Categories" first.
const partiesUrl = await navigateTo('Masters', /^Parties$/)
check('navigated to Parties by clicking', partiesUrl.includes('/masters/parties'), partiesUrl)
const addParty = page.locator('button', { hasText: /Add Party|New Party/i }).first()
if ((await addParty.count()) > 0) {
  await addParty.click()
  await page.waitForTimeout(1500)
  const dialog = page.locator('[role=dialog]').last()
  const dialogText = await dialog.innerText()
  check('Create Party explains itself too', /needs a connection/i.test(dialogText))
  const submit = dialog.locator('button[type=submit]').first()
  check('with its save disabled', !(await submit.isEnabled()))
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
}

// ---- a screen whose code was never downloaded says so honestly -------------
const expensesUrl = await navigateTo('Finance', /Expenses/i)
check('navigated to a never-opened screen', expensesUrl.includes('/finance/expenses'), expensesUrl)
const coldBody = await page.locator('body').innerText()
// Either outcome is acceptable and both are honest: the chunk may already be in the browser's
// cache (this build groups several small pages together), in which case the screen simply opens.
// What must never happen is the generic "Something went wrong — Reload" crash screen, which is
// wrong twice over offline: nothing went wrong, and reloading with no connection makes it worse.
check(
  'a never-opened screen either opens or explains itself',
  /Expenses/i.test(coldBody) || /hasn.t been downloaded/i.test(coldBody),
  coldBody.replace(/\s+/g, ' ').slice(0, 70)
)
check(
  'and never shows the generic crash screen',
  !/Something went wrong/i.test(coldBody)
)

// ---- and it all comes back ------------------------------------------------
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1,
})
await page.evaluate(() => window.dispatchEvent(new Event('online')))
await page.waitForTimeout(2000)
body = await page.locator('body').innerText()
check('back online: the banner clears', !/You're offline/i.test(body))

await page.goto(`${base}/app/service/job-cards/create`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4500)
const backOn = page.locator('main button', { hasText: /^Create Job Card$/ }).last()
check('and Create is usable again', await backOn.isEnabled())

console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : 'all checks passed'}`)
await browser.close()
process.exit(failures.length ? 1 : 0)
