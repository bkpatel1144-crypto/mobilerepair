/**
 * The job card detail, in the two places it is shown.
 *
 *   node --env-file=.env.local tools/ui/job-card-detail-shots.mjs <base> [email] [password]
 *
 * One component renders both the full page and the drawer, which is exactly why it was wrong:
 * its column count keyed off the browser window, so the drawer laid out three columns inside a
 * sheet and wrapped "RCP-1509-00001" over three lines. Source reading cannot catch that — the
 * markup is identical in both — so this takes both shots and measures the two things that were
 * actually broken: how many columns the body chose, and whether any short label wrapped.
 *
 * With no email it signs up a fresh tenant, seeds the masters an intake needs, and creates a job
 * card with an advance, so the Payment panel has a balance to show rather than four zeroes.
 * Reports what it examined, so a run that found no job card cannot read as a pass.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const [base, emailArg, passwordArg, outDirArg] = process.argv.slice(2)
if (!base) {
  console.error('usage: node tools/ui/job-card-detail-shots.mjs <base> [email] [password] [outDir]')
  process.exit(1)
}
const outDir = outDirArg ?? 'screens/job-card-detail'
await mkdir(outDir, { recursive: true })

const stamp = Date.now()
const email = emailArg ?? `jcui-${stamp}@aim-probe.test`
const password = passwordArg ?? 'ProbeOnly!2345'

const failures = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

/** How many columns a grid actually resolved to, and whether anything short inside it wrapped. */
const measure = (scope) => {
  const root = document.querySelector(scope)
  if (!root) return { cols: 0, wrapped: ['no root'] }
  // The *body* grid — the one laying out the panels. Picking "the first grid with more than one
  // column" found the Device card's own two-column `<dl>` instead, and reported two columns on a
  // phone where the body had correctly collapsed to one.
  const grid = [...root.querySelectorAll('.grid')].find((el) =>
    [...el.children].some((child) => child.querySelector(':scope > section, section'))
  )
  const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0
  // A short label broken over lines is the symptom that started this.
  const wrapped = []
  root.querySelectorAll('span, p, dd, dt, h3').forEach((el) => {
    if (el.children.length) return
    const text = (el.textContent ?? '').trim()
    if (!text || text.length > 24 || text.includes('\n')) return
    if (el.getClientRects().length > 1) wrapped.push(`"${text}" over ${el.getClientRects().length}`)
  })
  return { cols, wrapped: [...new Set(wrapped)].slice(0, 5) }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } })

const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon/i.test(m.text())) errors.push(m.text().slice(0, 160))
})

if (emailArg) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(14_000)
} else {
  await page.goto(`${base}/signup`, { waitUntil: 'domcontentloaded' })
  await page.fill('#companyName', `ZZ JCUI ${stamp}`)
  await page.fill('#fullName', 'Detail Probe')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(26_000)
  console.log(`  seeding masters for ${email}`)
  execFileSync('node', ['--env-file=.env.local', 'tools/ui/seed-intake-masters.mjs', email, password], {
    stdio: 'inherit',
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(8000)
}

// ---- a job card to look at --------------------------------------------------
await page.goto(`${base}/app/service/job-cards`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)

if ((await page.locator('tbody tr').count()) === 0) {
  await page.goto(`${base}/app/service/job-cards/create`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)

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

  await pick(/Search customer by name or mobile/i)
  await pick(/Search device type/i)
  await pick(/Select brand/i)
  await pick(/Enter model name/i)
  await page.locator('button', { hasText: /Select problems/i }).first().click()
  await page.waitForTimeout(1200)
  const popover = page.locator('[data-slot=popover-content]:visible').last()
  const row = popover.locator('button', { hasText: /Screen not working/i }).first()
  if ((await row.count()) > 0) await row.click()
  await page.waitForTimeout(600)
  const done = popover.locator('button', { hasText: /^Done$/ }).first()
  if ((await done.count()) > 0) await done.click()
  else await page.keyboard.press('Escape')
  await page.waitForTimeout(900)

  // An estimate and an advance, so Payment has a real balance rather than four zeroes.
  const numbers = page.locator('main input[type=number]')
  if ((await numbers.count()) >= 2) {
    await numbers.nth(0).fill('1500')
    await numbers.last().fill('500')
    await page.waitForTimeout(800)
  }

  await page.locator('main button', { hasText: /^Create Job Card$/ }).last().click()
  await page.waitForTimeout(12_000)

  await page.goto(`${base}/app/service/job-cards`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(7000)
}

const rows = page.locator('tbody tr')
const rowCount = await rows.count()
check('there is a job card to open', rowCount > 0, `${rowCount} rows`)
if (rowCount === 0) {
  await browser.close()
  process.exit(1)
}

// ---- the drawer -------------------------------------------------------------
await rows.first().click()
await page.waitForTimeout(5000)
const drawer = page.locator('[role=dialog]').last()
check('the drawer opened', await drawer.isVisible().catch(() => false))
await page.screenshot({ path: path.join(outDir, 'drawer.png') })

const inDrawer = await page.evaluate(measure, '[role=dialog]')
check(
  'the drawer lays out two columns, not three squeezed ones',
  inDrawer.cols === 2,
  `${inDrawer.cols} column(s)`
)
check('and nothing short wrapped mid-label', inDrawer.wrapped.length === 0, inDrawer.wrapped.join('; '))

// ---- the full page ----------------------------------------------------------
const expand = drawer.locator('button').filter({ has: page.locator('svg') })
await expand.first().click().catch(() => {})
await page.waitForTimeout(1000)
if (!/job-cards\/[A-Za-z0-9]/.test(page.url())) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  const href = await rows.first().evaluate((tr) => tr.querySelector('a[href]')?.getAttribute('href'))
  if (href) await page.goto(base + href, { waitUntil: 'domcontentloaded' })
}
await page.waitForTimeout(7000)
check('the full page opened', /job-cards\/[A-Za-z0-9]/.test(page.url()), page.url())
await page.screenshot({ path: path.join(outDir, 'page.png'), fullPage: true })

const onPage = await page.evaluate(measure, 'main')
check('the full page uses all three columns', onPage.cols === 3, `${onPage.cols} column(s)`)
check('and nothing short wrapped there either', onPage.wrapped.length === 0, onPage.wrapped.join('; '))

// ---- phone ------------------------------------------------------------------
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(3000)
await page.screenshot({ path: path.join(outDir, 'page-phone.png'), fullPage: true })
const onPhone = await page.evaluate((scope) => {
  const root = document.querySelector(scope)
  const grid = [...root.querySelectorAll('.grid')].find((el) =>
    [...el.children].some((child) => child.querySelector(':scope > section, section'))
  )
  return {
    cols: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
    overflows: document.documentElement.scrollWidth > window.innerWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
  }
}, 'main')
check('one column on a phone', onPhone.cols === 1, `${onPhone.cols} column(s)`)
check('and the page does not scroll sideways', !onPhone.overflows, `${onPhone.scrollWidth}px in 390px`)

check('no console errors', errors.length === 0, errors.slice(0, 2).join(' | '))

console.log(`\nsigned in as ${email}`)
console.log(`screenshots in ${outDir}/`)
console.log(failures.length ? `${failures.length} FAILED: ${failures.join(', ')}` : 'all checks passed')
await browser.close()
process.exit(failures.length ? 1 : 0)
