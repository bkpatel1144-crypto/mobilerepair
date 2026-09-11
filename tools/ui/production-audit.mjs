/**
 * Walks every screen the sidebar offers and reports what is actually wrong with each.
 *
 *   node tools/ui/production-audit.mjs <base> [email] [password]
 *
 * With no credentials it signs up a fresh tenant, which is the harshest case: a brand-new
 * company has only what the seed writes, so anything that assumes data exists shows up here.
 * Pass an existing login to audit a tenant with real records in it instead.
 *
 * Per screen it records:
 *
 *   - uncaught page errors (a crash the error boundary swallowed still counts)
 *   - console errors and warnings, with React key/prop warnings called out separately
 *   - failed network requests
 *   - whether the screen is a `<PlaceholderPage>` ("… is built in Phase N")
 *   - whether it rendered a heading and any content at all
 *   - whether it is sitting on an error state or an empty state
 *
 * Counts are printed for everything, because a sweep that quietly visited nothing must not read
 * as a clean bill of health — this repo has been bitten by exactly that twice.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const [base, emailArg, passwordArg] = process.argv.slice(2)
if (!base) {
  console.error('usage: node tools/ui/production-audit.mjs <base> [email] [password]')
  process.exit(1)
}

const structure = JSON.parse(readFileSync('data/menu-structure.json', 'utf8')).menus
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })

let current = { errors: [], warnings: [], pageErrors: [], netFails: [] }
page.on('console', (m) => {
  const t = m.type()
  if (t === 'error') current.errors.push(m.text().slice(0, 200))
  else if (t === 'warning') current.warnings.push(m.text().slice(0, 200))
})
page.on('pageerror', (e) => current.pageErrors.push(String(e).slice(0, 200)))
page.on('requestfailed', (r) => {
  const u = r.url()
  // Firestore keeps a long-poll open; its cancellation on navigation is not a defect.
  if (/firestore|googleapis|google-analytics|gstatic/.test(u)) return
  current.netFails.push(`${r.failure()?.errorText ?? 'failed'} ${u.slice(0, 120)}`)
})

const stamp = Date.now()
const email = emailArg ?? `audit-${stamp}@aim-probe.test`
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
  await page.fill('#companyName', `ZZ AUDIT ${stamp}`)
  await page.fill('#fullName', 'Audit Probe')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(26_000)
}
console.log(`signed in as ${email} -> ${page.url()}\n`)

// Collect every sidebar link, opening each module in turn.
await page.goto(`${base}/app/dashboard`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
const nav = page.locator('nav').first()
const screens = [['dashboard', '/app/dashboard']]
for (const m of structure) {
  const head = nav.getByText(m.label, { exact: true }).first()
  if (!(await head.count())) {
    console.log(`MODULE MISSING FROM SIDEBAR: ${m.label}`)
    continue
  }
  await head.click({ timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(500)
  const links = await nav
    .locator('a[href*="/app/"]')
    .evaluateAll((els) => els.map((e) => [e.textContent.trim(), e.getAttribute('href')]))
  for (const [label, href] of links) {
    if (!screens.some((s) => s[1] === href)) screens.push([label, href])
  }
}
console.log(`sidebar offers ${screens.length} screens\n`)

const report = []
for (const [label, href] of screens) {
  current = { errors: [], warnings: [], pageErrors: [], netFails: [] }
  const ok = await page
    .goto(base + href, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    .then(() => true)
    .catch(() => false)
  await page.waitForTimeout(3800)

  const main = await page.locator('main').innerText().catch(() => '')
  const h1 = await page.locator('main h1').first().textContent().catch(() => null)
  const controls = await page.locator('main button, main a, main input, main table').count()

  report.push({
    label,
    href,
    navigated: ok,
    h1: h1?.trim() ?? null,
    controls,
    placeholder: /is built in Phase/i.test(main),
    notFound: /page not found|404/i.test(main),
    errorState: /something went wrong|could ?n.t load|failed to load/i.test(main),
    empty: main.trim().length < 120,
    pageErrors: current.pageErrors,
    errors: current.errors.filter((e) => !/favicon|manifest/i.test(e)),
    keyWarnings: current.warnings.filter((w) => /unique "key"|key prop|validateDOMNesting|cannot appear as a descendant/i.test(w)),
    netFails: current.netFails,
  })
}
await browser.close()

const bad = (r) =>
  !r.navigated || r.notFound || r.placeholder || r.errorState || !r.h1 || r.controls < 2 ||
  r.pageErrors.length || r.errors.length || r.keyWarnings.length || r.netFails.length

console.log('='.repeat(78))
console.log(`AUDITED ${report.length} SCREENS — ${report.filter(bad).length} with something to fix`)
console.log('='.repeat(78))

for (const r of report.filter(bad)) {
  const flags = []
  if (!r.navigated) flags.push('NAVIGATION FAILED')
  if (r.notFound) flags.push('NOT FOUND')
  if (r.placeholder) flags.push('PLACEHOLDER — "coming soon"')
  if (r.errorState) flags.push('ERROR STATE')
  if (!r.h1) flags.push('no heading')
  if (r.controls < 2) flags.push(`almost nothing rendered (${r.controls} controls)`)
  console.log(`\n${r.label}  (${r.href})`)
  if (flags.length) console.log(`  ${flags.join(' · ')}`)
  for (const e of r.pageErrors) console.log(`  CRASH: ${e}`)
  for (const e of r.errors.slice(0, 3)) console.log(`  console error: ${e}`)
  for (const w of r.keyWarnings.slice(0, 2)) console.log(`  react warning: ${w}`)
  for (const n of r.netFails.slice(0, 2)) console.log(`  network: ${n}`)
}

const clean = report.filter((r) => !bad(r))
console.log(`\n${clean.length} screens clean: ${clean.map((r) => r.label).join(', ')}`)
console.log(`\nplaceholders: ${report.filter((r) => r.placeholder).map((r) => r.label).join(', ') || 'none'}`)
console.log(`crashes: ${report.filter((r) => r.pageErrors.length).map((r) => r.label).join(', ') || 'none'}`)
console.log(`console errors: ${report.filter((r) => r.errors.length).map((r) => r.label).join(', ') || 'none'}`)
process.exit(report.filter(bad).length ? 1 : 0)
