/**
 * Drives Settings > Company > Preferences against the deployed site.
 *
 *   node tools/ui/preferences-check.mjs <base> [email] [password]
 *
 * The part worth proving is the *consequence*: switching a module off has to remove it from the
 * sidebar and refuse its URL, for real, after a reload — not merely grey out a checkbox. So this
 * turns Reports off, reloads, checks the sidebar and the route, then turns it back on and checks
 * it comes back. Anything less would pass on a page that stores the setting and ignores it.
 */
import { chromium } from 'playwright'

const [base, emailArg, passwordArg] = process.argv.slice(2)
if (!base) {
  console.error('usage: node tools/ui/preferences-check.mjs <base> [email] [password]')
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
const email = emailArg ?? `pref-${stamp}@aim-probe.test`
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
  await page.fill('#companyName', `ZZ PREF ${stamp}`)
  await page.fill('#fullName', 'Pref Probe')
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

const openPrefs = async () => {
  await page.goto(`${base}/app/settings/company/preferences`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4500)
  return page.locator('main').innerText()
}

// ---- the page renders ------------------------------------------------------
let body = await openPrefs()
check('page loads (not Access Denied)', !/don.t have access/i.test(body), body.slice(0, 80))
check('heading', /Company Preferences/i.test(body))
for (const section of ['Enabled Modules', 'Branding', 'WhatsApp Provider']) {
  check(`section: ${section}`, body.includes(section))
}

const boxes = page.locator('main section').first().locator('label')
const labelCount = await boxes.count()
check('ten module rows', labelCount === 10, `found ${labelCount}`)

const lockedDisabled = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('main section:first-of-type label')]
  const find = (name) => rows.find((r) => r.innerText.trim().toLowerCase().startsWith(name))
  const state = (r) => {
    const box = r.querySelector('[data-slot=checkbox]')
    return box ? { checked: box.getAttribute('aria-checked'), disabled: box.disabled === true || box.getAttribute('aria-disabled') === 'true' } : null
  }
  return {
    administration: state(find('administration') ?? document.createElement('div')),
    settings: state(find('settings') ?? document.createElement('div')),
  }
})
check(
  'Administration locked on',
  lockedDisabled.administration?.checked === 'true' && lockedDisabled.administration?.disabled,
  JSON.stringify(lockedDisabled.administration)
)
check(
  'Settings locked on',
  lockedDisabled.settings?.checked === 'true' && lockedDisabled.settings?.disabled,
  JSON.stringify(lockedDisabled.settings)
)

// ---- switch Reports off ----------------------------------------------------
const reportsRow = page.locator('main section').first().locator('label', { hasText: 'Reports' }).first()
await reportsRow.locator('[data-slot=checkbox]').click()
await page.waitForTimeout(400)
const saveButton = page.locator('main button', { hasText: /Save Changes/i }).first()
check('Save enabled once something changed', await saveButton.isEnabled())
await saveButton.click()
await page.waitForTimeout(6000)

body = await openPrefs()
const reportsOff = await page.evaluate(() => {
  const row = [...document.querySelectorAll('main section:first-of-type label')].find((r) =>
    r.innerText.trim().toLowerCase().startsWith('reports')
  )
  return row?.querySelector('[data-slot=checkbox]')?.getAttribute('aria-checked')
})
check('Reports stays off after reload', reportsOff === 'false', String(reportsOff))

const sidebarAfterOff = await page.locator('nav').first().innerText()
check('Reports gone from the sidebar', !/\bReports\b/i.test(sidebarAfterOff))

await page.goto(`${base}/app/reports/service`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4000)
const blocked = await page.locator('main').innerText()
check('a disabled module refuses its own URL', /don.t have access|access denied/i.test(blocked), blocked.slice(0, 70))

// ---- switch it back on -----------------------------------------------------
await openPrefs()
await page
  .locator('main section')
  .first()
  .locator('label', { hasText: 'Reports' })
  .first()
  .locator('[data-slot=checkbox]')
  .click()
await page.waitForTimeout(400)
await page.locator('main button', { hasText: /Save Changes/i }).first().click()
await page.waitForTimeout(6000)
await openPrefs()
const sidebarAfterOn = await page.locator('nav').first().innerText()
check('Reports comes back', /\bReports\b/i.test(sidebarAfterOn))

// ---- the logo actually reaches Storage ------------------------------------
// A one-pixel PNG. The point is the round trip: Storage rules, the download URL, and the
// company document all have to agree, and a rules mistake is invisible until someone tries.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)
await openPrefs()
await page.locator('input[type=file]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG })
await page.waitForTimeout(9000)
await openPrefs()
const logo = page.locator('main img[alt*="logo" i]').first()
check('logo survives a reload', (await logo.count()) > 0)
if (await logo.count()) {
  const src = await logo.getAttribute('src')
  check('logo is served from Storage', /firebasestorage/.test(src ?? ''), (src ?? '').slice(0, 60))
  check('logo renders (non-zero width)', (await logo.boundingBox())?.width > 0)
  await page.locator('main button', { hasText: /^Remove$/i }).first().click()
  await page.waitForTimeout(6000)
  await openPrefs()
  check('Remove clears it', (await page.locator('main img[alt*="logo" i]').count()) === 0)
}

// ---- the link from Company Management --------------------------------------
await page.goto(`${base}/app/settings/company`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4000)
const link = page.locator('main a', { hasText: /Company Preferences/i }).first()
check('Company Management links here', (await link.count()) > 0)
if (await link.count()) {
  await link.click()
  await page.waitForTimeout(3000)
  check('the link lands on Preferences', /settings\/company\/preferences/.test(page.url()), page.url())
}

check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '))

console.log(`\n${failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : 'all checks passed'}`)
await browser.close()
process.exit(failures.length ? 1 : 0)
