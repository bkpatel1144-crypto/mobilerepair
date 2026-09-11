/**
 * Drives Masters > Attributes end to end: add, edit, delete, and confirm each write survived a
 * reload.
 *
 *   node tools/ui/attributes-check.mjs <base> [email] [password]
 *
 * Reloading between steps is the point. A create that only updated the local cache looks
 * identical to one that reached Firestore until the page is fetched again, and this app writes
 * through a `writeBatch` with an audit-log entry beside it — either both land or neither does.
 */
import { chromium } from 'playwright'

const [base, emailArg, passwordArg] = process.argv.slice(2)
if (!base) {
  console.error('usage: node tools/ui/attributes-check.mjs <base> [email] [password]')
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
const email = emailArg ?? `attr-${stamp}@aim-probe.test`
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
  await page.fill('#companyName', `ZZ ATTR ${stamp}`)
  await page.fill('#fullName', 'Attr Probe')
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

const open = async () => {
  await page.goto(`${base}/app/masters/attributes`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4500)
  return page.locator('main').innerText()
}

let body = await open()
check('the page is real, not a placeholder', !/is built in Phase/i.test(body))
check('it has its own heading', /attributes/i.test(body))
check('it starts empty with a prompt', /no attributes yet/i.test(body), 'fresh company')

// ---- create -------------------------------------------------------------------------
await page.getByRole('button', { name: /add attribute/i }).first().click()
await page.waitForTimeout(1500)
await page.fill('#attrName', 'Colour')
await page.fill('#attrValues', 'Black, White, Blue')
await page.getByRole('button', { name: /^save$/i }).first().click()
await page.waitForTimeout(4000)

body = await open()
check('the new attribute survives a reload', /Colour/.test(body), 'written to Firestore')
for (const v of ['Black', 'White', 'Blue']) check(`its value "${v}" is listed`, body.includes(v))
check('the counters moved', /\b3\b/.test(body), '3 values')

// ---- edit ---------------------------------------------------------------------------
await page.locator('button[aria-label="Edit Colour"]').first().click()
await page.waitForTimeout(1500)
const nameField = page.locator('#attrName')
check('edit opens with the existing name', (await nameField.inputValue()) === 'Colour')
await page.fill('#attrValues', 'Black, White, Blue, Gold')
await page.getByRole('button', { name: /^save$/i }).first().click()
await page.waitForTimeout(4000)

body = await open()
check('the edit survives a reload', body.includes('Gold'))

// ---- a second attribute, to prove the list is a list ---------------------------------
await page.getByRole('button', { name: /add attribute/i }).first().click()
await page.waitForTimeout(1500)
await page.fill('#attrName', 'Capacity')
await page.fill('#attrValues', '64 GB, 128 GB')
await page.getByRole('button', { name: /^save$/i }).first().click()
await page.waitForTimeout(4000)
body = await open()
check('a second attribute lists alongside the first', /Capacity/.test(body) && /Colour/.test(body))

// ---- validation ---------------------------------------------------------------------
await page.getByRole('button', { name: /add attribute/i }).first().click()
await page.waitForTimeout(1500)
await page.getByRole('button', { name: /^save$/i }).first().click()
await page.waitForTimeout(1500)
const dialogText = await page.locator('[role=dialog]').first().innerText().catch(() => '')
check('an empty name is refused', /name is required/i.test(dialogText))
await page.keyboard.press('Escape')
await page.waitForTimeout(800)

// ---- delete -------------------------------------------------------------------------
await page.locator('button[aria-label="Delete Capacity"]').first().click()
await page.waitForTimeout(1500)
const confirmText = await page.locator('[role=dialog], [role=alertdialog]').first().innerText().catch(() => '')
check('deleting warns before it does it', /permanently|cannot be undone/i.test(confirmText))
await page.getByRole('button', { name: /^delete$/i }).last().click()
await page.waitForTimeout(4000)

body = await open()
check('the delete survives a reload', !/Capacity/.test(body))
check('and left the other one alone', /Colour/.test(body))

check('no console errors on any of that', errors.length === 0, errors[0] ?? '')

await browser.close()
console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(' | ')}` : 'all checks passed'}\n`)
process.exit(failures.length ? 1 : 0)
