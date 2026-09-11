/**
 * Phase 12 — proves Masters > Attributes actually drives the forms it claims to apply to.
 *
 *   node tools/ui/attribute-wiring-check.mjs <base> [email] [password]
 *
 * The screen stored a data type and a Mandatory flag that nothing read, so a probe that merely
 * checked the fields *render* would have passed against the old build too. What is checked here
 * is the consequence: a mandatory attribute refuses the save, a filled one survives a reload and
 * shows in the detail drawer, and the variant picker offers the master's own names instead of a
 * free-text box.
 */
import { chromium } from 'playwright'

const [base, emailArg, passwordArg] = process.argv.slice(2)
if (!base) {
  console.error('usage: node tools/ui/attribute-wiring-check.mjs <base> [email] [password]')
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
const email = emailArg ?? `attrwire-${stamp}@aim-probe.test`
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
  await page.fill('#companyName', `ZZ ATTRWIRE ${stamp}`)
  await page.fill('#fullName', 'Attr Wire Probe')
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

// ---- define two attributes ------------------------------------------------
async function addAttribute({ name, dataType, mandatory, values, appliesTo }) {
  await page.goto(`${base}/app/masters/attributes`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)
  await page.locator('button', { hasText: /Add Attribute|New Attribute/i }).first().click()
  await page.waitForTimeout(1200)
  const dialog = page.locator('[role=dialog]').last()
  await dialog.locator('input').first().fill(name)
  // Applies To is the first select in the modal, Data Type the second.
  const selects = dialog.locator('button[role=combobox], [data-slot=select-trigger]')
  if (appliesTo) {
    const entitySelect = selects.nth(0)
    await entitySelect.click()
    await page.waitForTimeout(600)
    const entityList = await entitySelect.getAttribute('aria-controls')
    await page
      .locator(`[id="${entityList}"] [role=option]`, { hasText: new RegExp(appliesTo, 'i') })
      .first()
      .click()
    await page.waitForTimeout(500)
  }
  const typeSelect = selects.nth(1)
  await typeSelect.click()
  await page.waitForTimeout(600)
  const listId = await typeSelect.getAttribute('aria-controls')
  await page.locator(`[id="${listId}"] [role=option]`, { hasText: new RegExp(`^${dataType}$`, 'i') })
    .first()
    .click()
  await page.waitForTimeout(500)
  if (values) await dialog.locator('#attrValues').fill(values)
  if (mandatory) await dialog.locator('[data-slot=checkbox]').first().click()
  await page.waitForTimeout(300)
  await dialog.locator('button[type=submit]').first().click()
  await page.waitForTimeout(5000)
  const body = await page.locator('main').innerText()
  return body.includes(name)
}

check('created a mandatory text attribute', await addAttribute({ name: 'Warranty Vendor', dataType: 'Text', mandatory: true }))
check(
  'created an optional dropdown attribute',
  await addAttribute({ name: 'Shade', dataType: 'Dropdown', values: 'Black, Gold' })
)

// ---- Create Item now refuses to save without the mandatory one -------------
await page.goto(`${base}/app/masters/items/create`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4500)
let body = await page.locator('main').innerText()
check('Create Item shows an Additional Details section', /Additional Details/i.test(body))
check('the mandatory attribute is on the form', /Warranty Vendor/i.test(body))
check('the optional attribute is on the form', /Shade/i.test(body))

// By placeholder, not `input` first — the first input on the page is the sidebar search, and
// filling that left the name blank, which made "An item name is required." look like the
// attribute error this check is about.
const nameField = page.locator('main input[placeholder*="Display Replacement" i]').first()
await nameField.fill(`ZZ Probe Item ${stamp}`)
await page.waitForTimeout(400)
await page.locator('button', { hasText: /^Create Item$|^Save/i }).last().click()
await page.waitForTimeout(3500)
body = await page.locator('main').innerText()
const stillOnForm = page.url().includes('/create')
check(
  'a blank mandatory attribute blocks the save',
  stillOnForm && /Additional Details/i.test(body) && /Fill in the required fields/i.test(body),
  body.replace(/\s+/g, ' ').slice(0, 120)
)

// ---- fill it and save -----------------------------------------------------
// `input[...]`, not `[id^=attr-]`: the dropdown attribute sorts first and its trigger is a
// button, which cannot be filled.
const vendorField = page.locator('input[id^="attr-"]').first()
await vendorField.fill('Shree Mobile Parts')
await page.waitForTimeout(400)
await page.locator('button', { hasText: /^Create Item$|^Save/i }).last().click()
await page.waitForTimeout(7000)
const afterSave = await page.locator('main').innerText()
check(
  'it saves once the mandatory attribute is filled',
  !page.url().includes('/create'),
  `${page.url()} :: ${afterSave.replace(/\s+/g, ' ').slice(0, 200)}`
)

// ---- the value survives, and is shown ------------------------------------
await page.goto(`${base}/app/masters/items`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4500)
// Searched, not scrolled — the catalog is paginated and a fresh item sorts to the end.
const listSearch = page.locator('main input[type=search], main input[placeholder*="Search" i]').first()
if (await listSearch.count()) {
  await listSearch.fill(`ZZ Probe Item ${stamp}`)
  await page.waitForTimeout(1500)
}
const row = page.locator('tbody tr', { hasText: `ZZ Probe Item ${stamp}` }).first()
check('the item is in the list after a reload', (await row.count()) > 0)
if (await row.count()) {
  await row.click()
  await page.waitForTimeout(2500)
  const drawer = await page.locator('[role=dialog], aside').last().innerText()
  check('the drawer shows the attribute value', /Shree Mobile Parts/.test(drawer))
  check('labelled by the attribute name', /Warranty Vendor/i.test(drawer))
}

// ---- variant attributes are picked, not typed -----------------------------
await page.goto(`${base}/app/masters/items/create`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4500)
const variantToggle = page.locator('label', { hasText: /has variants/i }).first()
if (await variantToggle.count()) {
  await variantToggle.locator('[data-slot=checkbox]').click()
  await page.waitForTimeout(800)
  const picker = page.locator('button', { hasText: /Choose which attributes/i }).first()
  check('variant attributes use a picker, not a text box', (await picker.count()) > 0)
  if (await picker.count()) {
    await picker.click()
    await page.waitForTimeout(900)
    const popover = await page.locator('[role=dialog], [data-slot=popover-content]').last().innerText()
    check('the picker offers the master\'s own attributes', /Warranty Vendor|Shade/.test(popover), popover.slice(0, 60))
  }
}

// ---- the same master drives Party and Job Card forms ----------------------
check(
  'created a party attribute',
  await addAttribute({ name: 'Referred By', dataType: 'Text', appliesTo: 'Party' })
)
check(
  'created a job card attribute',
  await addAttribute({ name: 'Pickup Location', dataType: 'Text', appliesTo: 'Job Card' })
)

await page.goto(`${base}/app/masters/parties`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4500)
await page.locator('button', { hasText: /Add Party|New Party/i }).first().click()
await page.waitForTimeout(1500)
const partyDialog = await page.locator('[role=dialog]').last().innerText()
check('the party form shows its own attribute', /Referred By/i.test(partyDialog))
check('and not the item-only ones', !/Warranty Vendor/i.test(partyDialog))

await page.goto(`${base}/app/service/job-cards/create`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5000)
const jobBody = await page.locator('main').innerText()
check('the job card form shows its own attribute', /Pickup Location/i.test(jobBody))
check('and not the party-only ones', !/Referred By/i.test(jobBody))

// ---- the master counts it as in use ---------------------------------------
await page.goto(`${base}/app/masters/attributes`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4500)
const masterBody = await page.locator('main').innerText()
check('the master reports the attribute as in use', /1 item/i.test(masterBody), masterBody.slice(0, 60))

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '))

console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : 'all checks passed'}`)
await browser.close()
process.exit(failures.length ? 1 : 0)
