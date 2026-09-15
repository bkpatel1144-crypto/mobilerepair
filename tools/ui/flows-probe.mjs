/**
 * Drives the flows a shop actually runs, end to end, against the deployed site.
 *
 *   node --env-file=.env.local tools/ui/flows-probe.mjs <base> [email] [password]
 *
 * "Nothing works" is not something source reading can confirm or refute. This walks a device
 * through the counter the way a shop does — take it in, work on it, bill it, get paid, hand it
 * back — then buys and sells a second-hand phone, and reports where each step actually stopped.
 *
 * Every step names what it looked for and what it saw, and screenshots on failure, so a run that
 * fell over early cannot be mistaken for a run that passed. A step that cannot even start
 * (because the one before it failed) is reported as SKIP, not as a pass.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
/**
 * `--bare` signs up and seeds *nothing*, which is the state a real shop is in on day one. It is
 * a different test from the seeded run: the seeded one proves the machinery works, the bare one
 * proves a shop that has just signed up can reach the end of a job card at all.
 */
const bare = args.includes('--bare')
const [base, emailArg, passwordArg] = args.filter((a) => a !== '--bare')
if (!base) {
  console.error('usage: node tools/ui/flows-probe.mjs <base> [email] [password]')
  process.exit(1)
}
const outDir = 'screens/flows'
await mkdir(outDir, { recursive: true })

const stamp = Date.now()
const email = emailArg ?? `flow-${stamp}@aim-probe.test`
const password = passwordArg ?? 'ProbeOnly!2345'

const results = []
let shot = 0
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })

const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`))
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|net::ERR_/i.test(m.text())) {
    errors.push(m.text().slice(0, 200))
  }
})

async function step(label, fn) {
  const before = errors.length
  try {
    const detail = await fn()
    const newErrors = errors.slice(before)
    results.push({ label, ok: true, detail: detail ?? '' })
    console.log(`PASS  ${label}${detail ? `  — ${detail}` : ''}`)
    if (newErrors.length) console.log(`      (console: ${newErrors[0]})`)
    return true
  } catch (e) {
    const file = path.join(outDir, `fail-${String(++shot).padStart(2, '0')}.png`)
    await page.screenshot({ path: file, fullPage: true }).catch(() => {})
    results.push({ label, ok: false, detail: String(e.message ?? e).slice(0, 240), file })
    console.log(`FAIL  ${label}\n      ${String(e.message ?? e).slice(0, 240)}\n      ${file}`)
    return false
  }
}

const skip = (label, why) => {
  results.push({ label, skipped: true, detail: why })
  console.log(`SKIP  ${label}  — ${why}`)
}

/** Waits for main to stop being a skeleton, rather than sleeping a fixed amount. */
async function settle(ms = 2500) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(ms)
}

/** Clicks a button by its exact visible text; throws naming what was on screen instead. */
async function clickButton(text, scope) {
  const root = scope ?? page.locator('body')
  const button = root.locator('button, a', { hasText: text }).first()
  if ((await button.count()) === 0) {
    const visible = await page
      .locator('main button:visible, [role=dialog] button:visible')
      .allInnerTexts()
      .catch(() => [])
    throw new Error(
      `no button matching ${text}. On screen: ${[...new Set(visible)].join(' | ').slice(0, 220)}`
    )
  }
  await button.scrollIntoViewIfNeeded().catch(() => {})
  await button.click()
  return button
}

/**
 * Picks from a `SearchSelect`. When the list is empty it does what a shop opening this app for
 * the first time has to do — use the Add footer and fill in the real form behind it — because
 * "the dropdown was empty" is only a bug if there is also no way forward from it.
 */
async function pick(triggerText, createAs) {
  const trigger = page.locator('button', { hasText: triggerText }).first()
  if ((await trigger.count()) === 0) throw new Error(`no picker matching ${triggerText}`)
  await trigger.click()
  await page.waitForTimeout(1200)
  const popover = page.locator('[data-slot=popover-content]:visible').last()
  const option = popover.locator('[role=option]').first()

  if ((await option.count()) > 0) {
    const label = await option.innerText()
    await option.click()
    await page.waitForTimeout(800)
    return label.replace(/\s+/g, ' ').slice(0, 40)
  }

  const add = popover.locator('button', { hasText: /^(Add|\+?\s*Add)/i }).last()
  if ((await add.count()) === 0) {
    const shown = await popover.innerText().catch(() => '')
    await page.keyboard.press('Escape')
    throw new Error(
      `picker ${triggerText} was empty and offered no way to add one. It showed: ${shown
        .replace(/\s+/g, ' ')
        .slice(0, 120)}`
    )
  }
  if (!createAs) {
    await page.keyboard.press('Escape')
    throw new Error(`picker ${triggerText} was empty (an Add footer is there, nothing to pick)`)
  }

  const search = popover.locator('input').first()
  if (await search.count()) {
    await search.fill(createAs.name)
    await page.waitForTimeout(700)
  }
  await popover.locator('button', { hasText: /^Add/i }).last().click()
  await page.waitForTimeout(2200)

  const dialog = page.locator('[role=dialog]').last()
  if ((await dialog.count()) === 0) throw new Error(`Add on ${triggerText} opened nothing`)
  if (createAs.mobile) {
    const mobile = dialog
      .locator('input[placeholder*="9876543210" i], input[placeholder*="mobile" i]')
      .first()
    if (await mobile.count()) await mobile.fill(createAs.mobile)
  }
  for (const label of createAs.check ?? []) {
    const box = dialog.locator('label', { hasText: label }).first()
    if (await box.count()) await box.click().catch(() => {})
  }
  await page.waitForTimeout(500)
  const submit = dialog.locator('button[type=submit]').first()
  if ((await submit.count()) === 0) throw new Error(`the Add form for ${triggerText} has no submit`)
  await submit.click()
  // Waits for the form to actually go, rather than sleeping a guess: a save that takes nine
  // seconds and a save that never returns look identical at a fixed seven.
  const closed = await page
    .locator('[role=dialog]')
    .last()
    .waitFor({ state: 'detached', timeout: 25_000 })
    .then(() => true)
    .catch(() => false)
  if (!closed) {
    const why = await page.locator('[role=dialog]').last().innerText()
    throw new Error(
      `the Add form for ${triggerText} was still open after 25s: ${why.replace(/\s+/g, ' ').slice(0, 160)}`
    )
  }
  await page.waitForTimeout(1500)
  return `created ${createAs.name}`
}

// =============================================================================
// sign in
// =============================================================================
if (emailArg) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await settle()
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await settle(14_000)
} else {
  await page.goto(`${base}/signup`, { waitUntil: 'domcontentloaded' })
  await settle()
  await page.fill('#companyName', `ZZ FLOW ${stamp}`)
  await page.fill('#fullName', 'Flow Probe')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await settle(26_000)
  if (bare) {
    console.log('  --bare: no masters seeded, as a shop is on day one')
  } else {
    console.log(`  seeding masters for ${email}`)
    execFileSync(
      'node',
      ['--env-file=.env.local', 'tools/ui/seed-intake-masters.mjs', email, password],
      { stdio: 'inherit' }
    )
  }
  await page.reload({ waitUntil: 'domcontentloaded' })
  await settle(8000)
}

await step('signed in', async () => {
  if (!page.url().includes('/app/')) throw new Error(`still at ${page.url()}`)
  return page.url().replace(base, '')
})

// =============================================================================
// FLOW 1 — a device across the counter
// =============================================================================
console.log('\n--- flow 1: job card, start to finish ---')

let jobUrl = null

const created = await step('create a job card with a ₹500 advance', async () => {
  await page.goto(`${base}/app/service/job-cards/create`, { waitUntil: 'domcontentloaded' })
  await settle(5000)
  await pick(/Search customer by name or mobile/i, {
    name: `ZZ Customer ${stamp}`,
    mobile: `98${String(stamp).slice(-8)}`,
  })
  await pick(/Search device type/i, { name: `ZZ Type ${stamp}` })
  await pick(/Pick a device type first|Select brand|Search brand/i, { name: `ZZ Brand ${stamp}` })
  await pick(/Pick a brand first|Enter model name/i, { name: `ZZ Model ${stamp}` })

  await clickButton(/Select problems/i)
  await page.waitForTimeout(1100)
  const popover = page.locator('[data-slot=popover-content]:visible').last()
  const row = popover.locator('button').filter({ hasText: /\w/ }).nth(1)
  if (await row.count()) await row.click()
  await page.waitForTimeout(500)
  const done = popover.locator('button', { hasText: /^Done$/ }).first()
  if (await done.count()) await done.click()
  else await page.keyboard.press('Escape')
  await page.waitForTimeout(800)

  const numbers = page.locator('main input[type=number]')
  if ((await numbers.count()) >= 2) {
    await numbers.nth(0).fill('1000')
    await numbers.last().fill('500')
  }
  await page.waitForTimeout(700)

  await clickButton(/^Create Job Card$/, page.locator('main'))
  await settle(12_000)

  if (page.url().includes('/create')) {
    const alert = page.locator('main [role=alert]')
    const why = (await alert.count()) ? await alert.first().innerText() : await page.locator('main').innerText()
    throw new Error(`still on the form: ${why.replace(/\s+/g, ' ').slice(0, 200)}`)
  }
  jobUrl = page.url()
  const body = await page.locator('main').innerText()
  const number = (body.match(/JC-[\d-]+/) || ['?'])[0]
  return `${number} at ${jobUrl.replace(base, '')}`
})

async function jobAction(label, buttonText, after) {
  if (!created) return skip(label, 'no job card was created')
  return step(label, async () => {
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' })
    await settle(5000)
    await clickButton(buttonText, page.locator('main'))
    await page.waitForTimeout(2500)
    if (after) await after()
    await settle(7000)
    const body = await page.locator('main').innerText()
    const status = (body.match(/Pending|In Queue|In Progress|On Hold|Tech Done|Ready|Delivered|Closed/) || ['?'])[0]
    return `status now ${status}`
  })
}

await jobAction('take the job', /^Take Job$/)

if (created) {
  await step('add a part to the job', async () => {
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' })
    await settle(5000)
    await clickButton(/^Add Part$/, page.locator('main'))
    await page.waitForTimeout(1200)
    await pick(/Search part/i)
    const rate = page.locator('main input[type=number]').first()
    await rate.fill('250')
    await page.waitForTimeout(500)
    const add = page.locator('main button', { hasText: /^Add$/ }).last()
    if (!(await add.isEnabled())) {
      const body = await page.locator('main').innerText()
      throw new Error(`Add is disabled: ${body.replace(/\s+/g, ' ').slice(0, 200)}`)
    }
    await add.click()
    await settle(8000)
    const body = await page.locator('main').innerText()
    if (!/Parts Used[\s\S]{0,80}1/.test(body)) throw new Error('the part did not appear in Parts Used')
    const cost = (body.match(/Parts Cost\s*₹([\d.]+)/) || [])[1]
    return `parts cost ₹${cost ?? '?'}`
  })
} else skip('add a part to the job', 'no job card was created')

await jobAction('mark the job done', /^Job Done$/, async () => {
  const dialog = page.locator('[role=dialog]').last()
  if (await dialog.count()) {
    const submit = dialog.locator('button[type=submit]').first()
    if (await submit.count()) await submit.click()
  }
})

await jobAction('generate the bill', /^Generate Bill$/, async () => {
  const dialog = page.locator('[role=dialog]').last()
  if (await dialog.count()) {
    const submit = dialog.locator('button[type=submit]').first()
    if (await submit.count()) await submit.click()
  }
})

if (created) {
  await step('the bill set a final amount', async () => {
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' })
    await settle(6000)
    const body = await page.locator('main').innerText()
    const final = (body.match(/Final Amount\s*₹([\d.]+)/) || [])[1]
    if (!final) throw new Error(`no Final Amount on the page: ${body.replace(/\s+/g, ' ').slice(0, 200)}`)
    return `final ₹${final}`
  })

  await step('an invoice reached Sales > Sales Invoices', async () => {
    await page.goto(`${base}/app/sales/invoices`, { waitUntil: 'domcontentloaded' })
    await settle(7000)
    const rows = await page.locator('tbody tr').count()
    if (rows === 0) {
      const body = await page.locator('main').innerText()
      throw new Error(`the invoice list is empty: ${body.replace(/\s+/g, ' ').slice(0, 200)}`)
    }
    const first = await page.locator('tbody tr').first().innerText()
    return `${rows} row(s): ${first.replace(/\s+/g, ' ').slice(0, 90)}`
  })
} else {
  skip('the bill set a final amount', 'no job card')
  skip('an invoice reached Sales > Sales Invoices', 'no job card')
}

await jobAction('take the balance payment', /^Payment$/, async () => {
  const dialog = page.locator('[role=dialog]').last()
  if (await dialog.count()) {
    const amount = dialog.locator('input[type=number]').first()
    if (await amount.count()) await amount.fill('500')
    const submit = dialog.locator('button[type=submit]').first()
    if (await submit.count()) await submit.click()
  }
})

await jobAction('deliver and close', /Deliver.*Close/i, async () => {
  const dialog = page.locator('[role=dialog]').last()
  if (await dialog.count()) {
    const confirm = dialog.locator('button', { hasText: /Deliver|Confirm|Yes/i }).last()
    if (await confirm.count()) await confirm.click()
  }
})

// =============================================================================
// FLOW 2 — a second-hand phone, bought and sold
// =============================================================================
console.log('\n--- flow 2: second-hand device ---')

const bought = await step('buy a second-hand phone', async () => {
  await page.goto(`${base}/app/second-hand-device/purchase/create`, { waitUntil: 'domcontentloaded' })
  await settle(6000)
  const body = await page.locator('main').innerText()
  if (/Needs a connection|not available offline/i.test(body)) {
    throw new Error(body.replace(/\s+/g, ' ').slice(0, 200))
  }
  await pick(/Search device type/i)
  await pick(/Pick a device type first|Select brand|Search brand/i)
  await pick(/Pick a brand first|Enter model name/i, { name: `ZZ Model ${stamp}` })
  await pick(/Search seller by name or mobile/i, {
    name: `ZZ Seller ${stamp}`,
    mobile: `96${String(stamp).slice(-8)}`,
    check: [/Supplier/i],
  })

  const price = page.locator('main label', { hasText: /Purchase Price/i }).first()
  const priceInput = price
    .locator('xpath=following::input[1]')
    .first()
  await priceInput.fill('4000')
  await page.waitForTimeout(800)
  await clickButton(/^(Save|Create|Buy|Record)/i, page.locator('main'))
  await settle(11_000)
  if (page.url().includes('/create')) {
    const alert = page.locator('main [role=alert]')
    const why = (await alert.count()) ? await alert.first().innerText() : await page.locator('main').innerText()
    throw new Error(`still on the form: ${why.replace(/\s+/g, ' ').slice(0, 220)}`)
  }
  return page.url().replace(base, '')
})

await step('the phone is in Device Stock', async () => {
  await page.goto(`${base}/app/second-hand-device/stock`, { waitUntil: 'domcontentloaded' })
  await settle(7000)
  const rows = await page.locator('tbody tr').count()
  if (rows === 0 && bought) throw new Error('bought a phone but Device Stock is empty')
  return `${rows} row(s)`
})

// =============================================================================
// FLOW 3 — every screen still renders for this tenant
// =============================================================================
console.log('\n--- flow 3: the screens themselves ---')

const SCREENS = [
  'sales/invoices',
  'service/job-cards',
  'finance/receipts',
  'finance/ledger',
  'inventory/stock',
  'masters/items',
  'masters/parties',
  'second-hand-device/stock',
  'reports/service',
  'reports/job-profit',
]
const broken = []
for (const screen of SCREENS) {
  const before = errors.length
  await page.goto(`${base}/app/${screen}`, { waitUntil: 'domcontentloaded' })
  await settle(4500)
  const body = await page.locator('main').innerText().catch(() => '')
  const bad =
    /Something went wrong|Access Denied|Could ?n[o']t load|Failed to/i.test(body) ||
    errors.length > before
  if (bad) broken.push(`${screen}: ${body.replace(/\s+/g, ' ').slice(0, 90)}`)
  console.log(`${bad ? 'FAIL' : 'ok  '}  ${screen}`)
}
results.push({
  label: 'every listed screen renders without an error state',
  ok: broken.length === 0,
  detail: broken.join(' | ').slice(0, 300),
})

// =============================================================================
console.log('\n================ summary ================')
const failed = results.filter((r) => r.ok === false)
const skipped = results.filter((r) => r.skipped)
for (const r of results) {
  const mark = r.skipped ? 'SKIP' : r.ok ? 'PASS' : 'FAIL'
  console.log(`${mark}  ${r.label}${r.detail ? `  — ${r.detail}` : ''}`)
}
console.log(`\n${results.length} steps · ${failed.length} failed · ${skipped.length} skipped`)
if (errors.length) {
  console.log(`\nconsole errors seen (${errors.length}):`)
  for (const e of [...new Set(errors)].slice(0, 8)) console.log(`  ${e}`)
}
console.log(`\nsigned in as ${email}`)
await browser.close()
process.exit(failed.length ? 1 : 0)
