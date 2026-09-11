/**
 * Phase 13 — proves fitting a part is checked against stock, on the deployed site.
 *
 *   node tools/ui/stock-check-probe.mjs <base> <email> <password> <jobId> <partName>
 *
 * Run `tools/ui/seed-stock-job.mjs` first; it prints the job id and part name to pass in.
 *
 * The sequence is the whole test: one purchased, fit one (allowed), try a second (blocked with
 * the shortfall named), override as owner (allowed, and the timeline says so). A probe that only
 * checked the warning renders would have passed against a build that still let the part through.
 */
import { chromium } from 'playwright'

const [base, email, password, jobId, partName] = process.argv.slice(2)
if (!base || !email || !password || !jobId || !partName) {
  console.error(
    'usage: node tools/ui/stock-check-probe.mjs <base> <email> <password> <jobId> <partName>'
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

const openJob = async () => {
  await page.goto(`${base}/app/service/job-cards/${jobId}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  return page.locator('main').innerText()
}

/** Opens the Add Part panel and picks the seeded part. */
async function openAddPart() {
  // The panel's opener is the inline "Add Part" link inside the Parts Used card.
  await page.locator('button', { hasText: /^Add Part$/ }).last().click()
  await page.waitForTimeout(900)
  await pickPart()
}

/** SearchSelect is a trigger button that opens a popover holding the real search input. */
async function pickPart() {
  await page.locator('button', { hasText: /Search part/i }).first().click()
  await page.waitForTimeout(700)
  await page.locator('input[placeholder*="Type to search" i]').first().fill(partName.slice(0, 20))
  await page.waitForTimeout(1200)
  const listing = await page.locator('body').innerText()
  await page.locator('[role=option]', { hasText: partName }).first().click()
  await page.waitForTimeout(800)
  return listing
}

// ---- stock is visible while choosing --------------------------------------
let body = await openJob()
check('the seeded job opened', /Parts Used/i.test(body), body.slice(0, 60))

await page.locator('button', { hasText: /^Add Part$/ }).last().click()
await page.waitForTimeout(900)
const listText = await pickPart()
check(
  'the picker shows on-hand beside the part',
  /1 in stock|Only 1 left|Out of stock/i.test(listText),
  (listText.match(/(1 in stock|Only 1 left|Out of stock)/i) || ['none'])[0]
)

// ---- fitting the one in stock is allowed ----------------------------------
let panel = await page.locator('main').innerText()
check('one is fittable without a warning', !/short/i.test(panel))
await page.locator('button', { hasText: /^Add$/ }).first().click()
await page.waitForTimeout(7000)
body = await openJob()
check('the part is on the job card', body.includes(partName))

// ---- the second is blocked ------------------------------------------------
await openAddPart()
panel = await page.locator('main').innerText()
check(
  'a second one is refused, with the shortfall named',
  /0 on hand.*fitting 1.*1 short|Only 0 on hand/i.test(panel.replace(/\s+/g, ' ')),
  panel.replace(/\s+/g, ' ').match(/Only \d+ on hand[^.]*\./)?.[0] ?? 'no message'
)

const addButton = page.locator('button', { hasText: /^Add$/ }).first()
check('and the Add button is disabled', !(await addButton.isEnabled()))

// ---- the owner can override, and it is recorded ---------------------------
const override = page.locator('label', { hasText: /Fit it anyway/i }).first()
check('an owner is offered an override', (await override.count()) > 0)
if (await override.count()) {
  await override.locator('[data-slot=checkbox]').click()
  await page.waitForTimeout(500)
  check('the override enables Add', await addButton.isEnabled())
  await addButton.click()
  await page.waitForTimeout(7000)

  body = await openJob()
  const twice = (body.match(new RegExp(partName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || [])
    .length
  check('the overridden part is on the job card too', twice >= 2, `found ${twice}`)
  check('the timeline records it as a stock override', /stock override/i.test(body))
  check('and names what was short', /0 on hand, 1 short/i.test(body.replace(/\s+/g, ' ')))
}

// ---- the Stock page agrees -------------------------------------------------
await page.goto(`${base}/app/inventory/stock`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
const stockBody = await page.locator('main').innerText()
check('the Stock page lists the part', stockBody.includes(partName))
check('and shows it out of stock after two were fitted', /Out of stock|OUT/i.test(stockBody))

// ---- the Dashboard alert reads real stock ---------------------------------
await page.goto(`${base}/app/dashboard`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
const dash = await page.locator('main').innerText()
check(
  'the Dashboard reports items out of stock',
  /out of stock/i.test(dash),
  (dash.match(/\d+ items out of stock/i) || ['not shown'])[0]
)

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '))

console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : 'all checks passed'}`)
await browser.close()
process.exit(failures.length ? 1 : 0)
