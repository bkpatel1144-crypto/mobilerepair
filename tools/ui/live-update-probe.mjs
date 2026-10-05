/**
 * Does the job card detail update when you change it, or only when you reload?
 *
 *   node tools/ui/live-update-probe.mjs <base> <email> <password>
 *
 * Every other probe in this folder navigates (`page.goto`) before each action, which is a full
 * page load — so all of them would pass on an app that only ever shows the truth after a refresh.
 * That is the bug this one exists to catch, and the reason it is written the other way round:
 * it loads the job card **once**, and from then on only clicks and reads. No reload, no
 * navigation, no `waitForNavigation`.
 *
 * For each action it records three things:
 *   - what the page said before,
 *   - what it said N seconds after the click, with no reload,
 *   - what it says after an explicit reload.
 *
 * "live" means the second already matched the third. "STALE AFTER ACTION" means the write
 * reached Firestore and the screen kept showing the old value until forced — which is exactly
 * what a shopkeeper means by "nothing works, after refresh work".
 *
 * It also drives the whole status machine (take → hold → resume → done → bill → pay → close)
 * and Undo, because a status that changes correctly once tells you nothing about the ninth one.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const [base, email, password] = process.argv.slice(2)
if (!base || !email || !password) {
  console.error('usage: node tools/ui/live-update-probe.mjs <base> <email> <password>')
  process.exit(1)
}
const outDir = 'screens/live'
await mkdir(outDir, { recursive: true })

const rows = []
let shots = 0
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })

const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`))
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|net::ERR_/i.test(m.text())) errors.push(m.text().slice(0, 200))
})

/** The job's state as the page is currently showing it — no reload. */
async function readState() {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    const text = main ? main.innerText.replace(/\s+/g, ' ') : ''
    const status = (text.match(
      /\b(Pending|In Queue|In Progress|On Hold|Tech Done|Ready for Delivery|Ready|Delivered|Closed|Cancelled|Pending Return)\b/
    ) || ['—'])[0]
    const balance = (text.match(/Balance\s*₹?([\d.]+)/) || [, '—'])[1]
    const paid = (text.match(/Paid\s*₹([\d.]+)/) || [, '—'])[1]
    const parts = (text.match(/Parts Cost\s*₹([\d.]+)/) || [, '—'])[1]
    const timeline = (main?.innerText.match(/\b(Created|Taken|Note|Handover|Part Added)\b/g) ?? []).length
    // The buttons on offer are part of the state: an action row that has not caught up is the
    // same failure as a stale status, and it is the half a shopkeeper actually clicks.
    const buttons = [...(main?.querySelectorAll('button') ?? [])]
      .map((b) => b.innerText.trim())
      .filter((t) => t && t.length < 30)
    return { status, balance, paid, parts, timeline, buttons: buttons.join(',') }
  })
}

const sameState = (a, b) =>
  a.status === b.status &&
  a.balance === b.balance &&
  a.paid === b.paid &&
  a.parts === b.parts &&
  a.timeline === b.timeline

/**
 * Clicks something, then watches the page WITHOUT reloading, then reloads and compares.
 * `settleMs` is generous on purpose — this is not testing speed, it is testing whether the
 * screen ever catches up at all.
 */
async function act(label, doIt, settleMs = 9000) {
  // A modal left open blocks every click underneath it, which would report nine healthy
  // actions as broken. Clear the decks first and say so if there was something to clear.
  if ((await page.locator('[role=dialog]').count()) > 0) {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)
  }
  const before = await readState()
  let clicked = true
  try {
    await doIt()
  } catch (e) {
    clicked = false
    rows.push({ label, verdict: 'COULD NOT CLICK', detail: String(e.message ?? e).slice(0, 150) })
    console.log(`SKIP  ${label}  — ${String(e.message ?? e).slice(0, 120)}`)
    return
  }
  if (!clicked) return

  await page.waitForTimeout(settleMs)
  const live = await readState()

  // Only now is a reload allowed, and only to find out what was true all along.
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(7000)
  const reloaded = await readState()

  const changedOnServer = !sameState(before, reloaded)
  const changedOnScreen = !sameState(before, live)
  const matchesTruth = sameState(live, reloaded)

  let verdict
  if (!changedOnServer) verdict = 'NOTHING CHANGED'
  else if (matchesTruth) verdict = 'live'
  else if (!changedOnScreen) verdict = 'STALE AFTER ACTION'
  else verdict = 'PARTIALLY STALE'

  const detail = `${before.status}/₹${before.balance} → screen ${live.status}/₹${live.balance} → truth ${reloaded.status}/₹${reloaded.balance}`
  rows.push({ label, verdict, detail })
  const mark = verdict === 'live' ? 'ok  ' : verdict === 'NOTHING CHANGED' ? 'none' : 'FAIL'
  console.log(`${mark}  ${label}  — ${verdict}  (${detail})`)

  if (verdict !== 'live' && verdict !== 'NOTHING CHANGED') {
    await page
      .screenshot({ path: path.join(outDir, `stale-${String(++shots).padStart(2, '0')}.png`), fullPage: true })
      .catch(() => {})
  }
}

/** Clicks a main-area button by text. Throws listing what was there instead. */
async function click(textRe, { dialog = false } = {}) {
  const scope = dialog ? page.locator('[role=dialog]').last() : page.locator('main')
  const button = scope.locator('button', { hasText: textRe }).first()
  if ((await button.count()) === 0) {
    const seen = await scope.locator('button:visible').allInnerTexts().catch(() => [])
    throw new Error(`no ${textRe} — saw: ${[...new Set(seen)].join(' | ').slice(0, 180)}`)
  }
  await button.scrollIntoViewIfNeeded().catch(() => {})
  await button.click()
  await page.waitForTimeout(1800)
}

/** Confirms whatever modal the action opened, if it opened one. */
async function confirmDialog(submitRe = /^(Confirm|Save|Submit|Yes|Deliver|Hold|Done|Record|Generate|Pay)/i) {
  const dialog = page.locator('[role=dialog]').last()
  if ((await dialog.count()) === 0) return false

  // Fill what the form insists on before submitting. Hold wants a reason, Cancel wants a
  // reason, Payment wants an amount — submitting without them is the probe failing validation,
  // not the app failing to work, and the two must not be reported as the same thing.
  for (const trigger of await dialog.locator('[data-slot=select-trigger]').all()) {
    await trigger.click().catch(() => {})
    await page.waitForTimeout(700)
    const opt = page.locator('[role=option]:visible').first()
    if (await opt.count()) await opt.click().catch(() => {})
    await page.waitForTimeout(500)
  }
  const amount = dialog.locator('input[type=number]').first()
  if (await amount.count()) {
    const current = await amount.inputValue()
    if (!current || current === '0') await amount.fill('100')
  }
  for (const box of await dialog.locator('textarea').all()) {
    if (!(await box.inputValue())) await box.fill('ZZ probe').catch(() => {})
  }
  await page.waitForTimeout(400)

  const submit = dialog.locator('button[type=submit]').first()
  if (await submit.count()) await submit.click()
  else await dialog.locator('button', { hasText: submitRe }).last().click().catch(() => {})
  await page.waitForTimeout(3000)

  // Still open means it refused. What it says is the finding.
  if ((await page.locator('[role=dialog]').count()) > 0) {
    const why = await page.locator('[role=dialog]').last().innerText().catch(() => '')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(800)
    throw new Error(`the dialog refused to close: ${why.replace(/\s+/g, ' ').slice(0, 180)}`)
  }
  return true
}

// =============================================================================
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(15_000)
console.log(`signed in as ${email} → ${page.url().replace(base, '')}`)
if (!page.url().includes('/app/')) {
  console.log('could not sign in — stopping')
  await page.screenshot({ path: path.join(outDir, 'login-failed.png'), fullPage: true })
  await browser.close()
  process.exit(1)
}

// ---- a job card of our own, so nothing of theirs is touched ----------------
await page.goto(`${base}/app/service/job-cards/create`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)

async function pickFirst(triggerRe) {
  const trigger = page.locator('button', { hasText: triggerRe }).first()
  if ((await trigger.count()) === 0) return false
  await trigger.click()
  await page.waitForTimeout(1200)
  const opt = page.locator('[data-slot=popover-content]:visible [role=option]').first()
  if ((await opt.count()) === 0) {
    await page.keyboard.press('Escape')
    return false
  }
  await opt.click()
  await page.waitForTimeout(800)
  return true
}

await pickFirst(/Search customer by name or mobile/i)
await pickFirst(/Search device type/i)
await pickFirst(/Pick a device type first|Select brand|Search brand/i)
await pickFirst(/Pick a brand first|Enter model name/i)
await page.locator('button', { hasText: /Select problems/i }).first().click()
await page.waitForTimeout(1200)
{
  const pop = page.locator('[data-slot=popover-content]:visible').last()
  const row = pop.locator('button').filter({ hasText: /\w/ }).nth(1)
  if (await row.count()) await row.click()
  await page.waitForTimeout(500)
  const done = pop.locator('button', { hasText: /^Done$/ }).first()
  if (await done.count()) await done.click()
  else await page.keyboard.press('Escape')
}
await page.waitForTimeout(900)
const nums = page.locator('main input[type=number]')
if ((await nums.count()) >= 2) {
  await nums.nth(0).fill('1000')
  await nums.last().fill('200')
}
const remark = page.locator('main textarea').first()
if (await remark.count()) await remark.fill('ZZ LIVE-UPDATE PROBE — safe to delete')
await page.waitForTimeout(600)
await page.locator('main button', { hasText: /^Create Job Card$/ }).last().click()
await page.waitForTimeout(14_000)

if (page.url().includes('/create')) {
  const why = await page.locator('main').innerText()
  console.log(`could not create a test job card: ${why.replace(/\s+/g, ' ').slice(0, 200)}`)
  await page.screenshot({ path: path.join(outDir, 'create-failed.png'), fullPage: true })
  await browser.close()
  process.exit(1)
}
const jobUrl = page.url()
console.log(`test job card: ${jobUrl.replace(base, '')}\n`)
console.log('--- from here on NOTHING is reloaded until after each action is observed ---\n')

// ---- the status machine, start to finish, never reloading to make it work --
await act('Take Job', () => click(/^Take Job$/))
await act('Hold', async () => {
  await click(/^Hold$/)
  await confirmDialog()
})
await act('Resume', () => click(/^Resume$/))
await act('Add Part', async () => {
  await click(/^Add Part$/)
  await pickFirst(/Search part/i)
  const rate = page.locator('main input[type=number]').first()
  await rate.fill('150')
  await page.waitForTimeout(400)
  await page.locator('main button', { hasText: /^Add$/ }).last().click()
  await page.waitForTimeout(2000)
})
await act('Add Note', async () => {
  await click(/^Add Note$/)
  const dialog = page.locator('[role=dialog]').last()
  const box = dialog.locator('textarea, input[type=text]').first()
  if (await box.count()) await box.fill('ZZ probe note')
  await confirmDialog()
})
await act('Undo Last Action', async () => {
  await click(/^Undo$/)
  await confirmDialog()
})
await act('Job Done', async () => {
  await click(/^Job Done$/)
  await confirmDialog()
})
await act('Generate Bill', async () => {
  await click(/^Generate Bill$/)
  await confirmDialog()
})
await act('Payment', async () => {
  await click(/^Payment$/)
  await confirmDialog()
})
await act('Deliver & Close', async () => {
  await click(/Deliver.*Close/i)
  await confirmDialog()
})

// =============================================================================
console.log('\n================ summary ================')
for (const r of rows) console.log(`${r.verdict.padEnd(20)} ${r.label}  ${r.detail ?? ''}`)
const stale = rows.filter((r) => r.verdict === 'STALE AFTER ACTION' || r.verdict === 'PARTIALLY STALE')
const nothing = rows.filter((r) => r.verdict === 'NOTHING CHANGED')
const couldnt = rows.filter((r) => r.verdict === 'COULD NOT CLICK')
console.log(
  `\n${rows.length} actions · ${stale.length} stale until reload · ${nothing.length} changed nothing · ${couldnt.length} unreachable`
)
if (errors.length) {
  console.log(`\nconsole errors (${errors.length}):`)
  for (const e of [...new Set(errors)].slice(0, 6)) console.log(`  ${e}`)
}
console.log(`\ntest job card left at ${jobUrl}`)
await browser.close()
process.exit(stale.length ? 1 : 0)
