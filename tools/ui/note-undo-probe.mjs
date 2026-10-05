/**
 * Add Note and Undo, on their own, watched without a reload.
 *
 *   node tools/ui/note-undo-probe.mjs <base> <email> <password>
 *
 * The full-lifecycle probe could not settle these two: its "submit" was `button[type=submit]`,
 * and `ConfirmDialog` uses a plain button, so Undo was never actually confirmed. This clicks the
 * real control and reports what each one does to the screen, to the timeline, and to Firestore.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const [base, email, password] = process.argv.slice(2)
const outDir = 'screens/live'
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`))
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|net::ERR_/i.test(m.text())) errors.push(m.text().slice(0, 200))
})

const snap = () =>
  page.evaluate(() => {
    const main = document.querySelector('main')
    const t = main ? main.innerText.replace(/\s+/g, ' ') : ''
    return {
      timelineRows: document.querySelectorAll('main ol > li').length,
      notesCount: (t.match(/Notes\s+(\d+)/) || [, '?'])[1],
      partsCount: (t.match(/Parts Used\s+(\d+)/) || [, '?'])[1],
      partsCost: (t.match(/Parts Cost\s*₹([\d.]+)/) || [, '?'])[1],
      hasProbeNote: t.includes('ZZ probe note'),
      undoOffered: t.includes('Undo Last Action'),
    }
  })

/** ConfirmDialog's confirm button: the last one that is not Cancel. */
async function confirm() {
  const dialog = page.locator('[role=dialog]').last()
  if ((await dialog.count()) === 0) return 'no dialog'
  const label = await dialog.innerText()
  const buttons = dialog.locator('button').filter({ hasNotText: /^(Cancel|Close)$/ })
  const n = await buttons.count()
  if (n === 0) return `no confirm button in: ${label.replace(/\s+/g, ' ').slice(0, 100)}`
  await buttons.last().click()
  await page.waitForTimeout(4000)
  const still = (await page.locator('[role=dialog]').count()) > 0
  if (still) {
    const why = await page.locator('[role=dialog]').last().innerText()
    await page.keyboard.press('Escape')
    return `REFUSED: ${why.replace(/\s+/g, ' ').slice(0, 140)}`
  }
  return 'confirmed'
}

await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(15000)

// reuse the newest job card rather than making another
await page.goto(`${base}/app/service/job-cards`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(7000)
await page.locator('tbody tr').first().click()
await page.waitForTimeout(4000)
const expand = page.locator('[role=dialog] button').first()
await expand.click().catch(() => {})
await page.waitForTimeout(6000)
if (!/job-cards\/[A-Za-z0-9]{10}/.test(page.url())) {
  await page.keyboard.press('Escape')
  const href = await page.locator('tbody tr').first().evaluate((tr) => tr.querySelector('a')?.getAttribute('href'))
  if (href) await page.goto(base + href, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(6000)
}
console.log(`job card: ${page.url().replace(base, '')}\n`)

// ---- ADD NOTE -------------------------------------------------------------
const before = await snap()
console.log('before      ', JSON.stringify(before))

const noteBtn = page.locator('main button', { hasText: /^Add Note$/ }).first()
if ((await noteBtn.count()) === 0) {
  // Notes panel may be collapsed — its chevron is in the panel heading.
  const toggle = page.locator('main section', { hasText: /Notes/ }).first().locator('button').last()
  await toggle.click().catch(() => {})
  await page.waitForTimeout(1500)
}
await page.locator('main button', { hasText: /^Add Note$/ }).first().click()
await page.waitForTimeout(2000)
const dialog = page.locator('[role=dialog]').last()
const box = dialog.locator('textarea, input[type=text]').first()
await box.fill('ZZ probe note')
await page.waitForTimeout(500)
console.log('note submit ', await confirm())
await page.waitForTimeout(8000)

const afterNote = await snap()
console.log('after note  ', JSON.stringify(afterNote))
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(8000)
const noteTruth = await snap()
console.log('truth       ', JSON.stringify(noteTruth))
console.log(
  `\nADD NOTE: screen ${afterNote.hasProbeNote ? 'showed' : 'did NOT show'} the note; ` +
    `Firestore ${noteTruth.hasProbeNote ? 'has' : 'does NOT have'} it; ` +
    `timeline ${before.timelineRows} → ${afterNote.timelineRows} → ${noteTruth.timelineRows}\n`
)

// ---- UNDO -----------------------------------------------------------------
const beforeUndo = await snap()
console.log('before undo ', JSON.stringify(beforeUndo))
if (!beforeUndo.undoOffered) {
  console.log('UNDO: not offered on this job card')
} else {
  await page.locator('main button', { hasText: /^Undo$/ }).first().click()
  await page.waitForTimeout(2000)
  console.log('undo submit ', await confirm())
  await page.waitForTimeout(8000)
  const afterUndo = await snap()
  console.log('after undo  ', JSON.stringify(afterUndo))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(8000)
  const undoTruth = await snap()
  console.log('truth       ', JSON.stringify(undoTruth))
  const changed = afterUndo.timelineRows !== beforeUndo.timelineRows
  const persisted = undoTruth.timelineRows !== beforeUndo.timelineRows
  console.log(
    `\nUNDO: screen ${changed ? 'updated' : 'did NOT update'}; ` +
      `Firestore ${persisted ? 'persisted it' : 'did NOT persist it'}; ` +
      `timeline ${beforeUndo.timelineRows} → ${afterUndo.timelineRows} → ${undoTruth.timelineRows}`
  )
}

if (errors.length) {
  console.log(`\nconsole errors (${errors.length}):`)
  for (const e of [...new Set(errors)].slice(0, 6)) console.log(`  ${e}`)
}
await page.screenshot({ path: path.join(outDir, 'note-undo-final.png'), fullPage: true })
await browser.close()
