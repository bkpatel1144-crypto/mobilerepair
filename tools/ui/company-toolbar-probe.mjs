/**
 * Phase 16 — Company Management's toolbar, against the deployed site.
 *
 *   node tools/ui/company-toolbar-probe.mjs <base> [email] [password]
 *
 * `SCREENS_NOTES.md` records the reference's own row as "Search … + Filters button (funnel icon)
 * + ⋮ More Actions". Two buttons that merely *render* would satisfy a screenshot and nothing
 * else, so what is checked is that the filter actually filters and the menu actually does
 * something: a registration that matches keeps the row, one that does not empties the table, and
 * Clear brings it back.
 */
import { chromium } from 'playwright'

const [base, emailArg, passwordArg] = process.argv.slice(2)
if (!base) {
  console.error('usage: node tools/ui/company-toolbar-probe.mjs <base> [email] [password]')
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
const stamp = Date.now()
const email = emailArg ?? `coy-${stamp}@aim-probe.test`
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
  await page.fill('#companyName', `ZZ COY ${stamp}`)
  await page.fill('#fullName', 'Company Probe')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(26_000)
}

const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon/i.test(m.text())) errors.push(m.text().slice(0, 160))
})

await page.goto(`${base}/app/settings/company`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5500)

let body = await page.locator('main').innerText()
check('the page loaded', /Company Management/i.test(body), body.slice(0, 50))
check('the Filters button is there', /Filters/i.test(body))

const moreActions = page.locator('main button[aria-label="More actions"]').first()
check('the More Actions button is there', (await moreActions.count()) > 0)

const rowsBefore = await page.locator('tbody tr').count()
check('the company is listed', rowsBefore >= 1, `${rowsBefore} rows`)

// ---- Filters actually filters ---------------------------------------------
await page.locator('main button', { hasText: /^Filters/ }).first().click()
await page.waitForTimeout(900)
body = await page.locator('main').innerText()
check('Filters opens a filter row', /GST registration/i.test(body))

const gstSelect = page.locator('main [data-slot=select-trigger]').first()
await gstSelect.click()
await page.waitForTimeout(700)
const listId = await gstSelect.getAttribute('aria-controls')
// A brand-new company signs up Unregistered, so filtering to Regular must empty the table.
await page.locator(`[id="${listId}"] [role=option]`, { hasText: /^Regular$/ }).first().click()
await page.waitForTimeout(1500)
const rowsFiltered = await page.locator('tbody tr').count()
check(
  'filtering to a registration it does not have empties the list',
  rowsFiltered === 0,
  `${rowsFiltered} rows`
)
body = await page.locator('main').innerText()
check('and the button shows a count of active filters', /Filters\s*1/i.test(body.replace(/\s+/g, ' ')))

await page.locator('main button', { hasText: /Clear filters/i }).first().click()
await page.waitForTimeout(1200)
const rowsCleared = await page.locator('tbody tr').count()
check('Clear filters brings the row back', rowsCleared === rowsBefore, `${rowsCleared} rows`)

// ---- the "default company only" tick works too -----------------------------
await page.locator('main label', { hasText: /Default company only/i }).first().click()
await page.waitForTimeout(1200)
const rowsDefault = await page.locator('tbody tr').count()
check('and the default-only tick keeps the default company', rowsDefault === 1, `${rowsDefault} rows`)
await page.locator('main button', { hasText: /Clear filters/i }).first().click()
await page.waitForTimeout(900)

// ---- More Actions does something ------------------------------------------
await moreActions.click()
await page.waitForTimeout(900)
const menu = await page.locator('[role=menu]').last().innerText()
check('More Actions offers Export CSV', /Export CSV/i.test(menu), menu.replace(/\s+/g, ' ').slice(0, 60))
check('and Refresh', /Refresh/i.test(menu))

const download = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null)
await page.locator('[role=menu] [role=menuitem]', { hasText: /Export CSV/i }).first().click()
const file = await download
check('Export CSV downloads a file', !!file, file ? await file.suggestedFilename() : 'no download')

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '))

console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : 'all checks passed'}`)
await browser.close()
process.exit(failures.length ? 1 : 0)
