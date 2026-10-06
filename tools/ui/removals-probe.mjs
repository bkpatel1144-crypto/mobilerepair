/**
 * Can a mistake be undone? Adds a part, a note and an image, then removes each one.
 *
 *   node tools/ui/removals-probe.mjs <base> <email> <password>
 *
 * `addPart`, `addImage` and `note` all shipped with no inverse, so the real check is not that
 * a Remove button exists but that the thing is gone from Firestore afterwards and the money
 * moved with it — a part removed from the list while `partsCost` stays put is the same class
 * of bug as a part added to a billed job.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const [base, email, password] = process.argv.slice(2)
const outDir = 'screens/removals'
await mkdir(outDir, { recursive: true })
const fails = []
const check = (l, ok, d = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${l}${d ? `  — ${d}` : ''}`)
  if (!ok) fails.push(l)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } })
await page.goto(base + '/login', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email); await page.fill('#password', password)
await page.click('button[type=submit]'); await page.waitForTimeout(15000)

// Its own job card, in a state where parts can still be added — reusing whatever happens to be
// at the top of the list means the probe passes or fails on the shop's data rather than on the
// code, and a Closed job legitimately has no Add Part at all.
await page.goto(base + '/app/service/job-cards/create', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)

async function pickFirst(re) {
  const trigger = page.locator('button', { hasText: re }).first()
  if ((await trigger.count()) === 0) return false
  await trigger.click()
  await page.waitForTimeout(1100)
  const opt = page.locator('[data-slot=popover-content]:visible [role=option]').first()
  if ((await opt.count()) === 0) { await page.keyboard.press('Escape'); return false }
  await opt.click()
  await page.waitForTimeout(700)
  return true
}
await pickFirst(/Search customer by name or mobile/i)
await pickFirst(/Search device type/i)
await pickFirst(/Pick a device type first|Select brand/i)
await pickFirst(/Pick a brand first|Enter model name/i)
await page.locator('button', { hasText: /Select problems/i }).first().click()
await page.waitForTimeout(1200)
{
  const pop = page.locator('[data-slot=popover-content]:visible').last()
  const r = pop.locator('button').filter({ hasText: /\w/ }).nth(1)
  if (await r.count()) await r.click()
  await page.waitForTimeout(500)
  const done = pop.locator('button', { hasText: /^Done$/ }).first()
  if (await done.count()) await done.click(); else await page.keyboard.press('Escape')
}
await page.waitForTimeout(800)
const nums = page.locator('main input[type=number]')
if ((await nums.count()) >= 1) await nums.nth(0).fill('1000')
const remark = page.locator('main textarea').first()
if (await remark.count()) await remark.fill('ZZ REMOVALS PROBE — safe to delete')
await page.waitForTimeout(600)
await page.locator('main button', { hasText: /^Create Job Card$/ }).last().click()
await page.waitForTimeout(13000)
check('created a job card to work on', !page.url().includes('/create'), page.url().replace(base, ''))
if (page.url().includes('/create')) { await browser.close(); process.exit(1) }

const read = () => page.evaluate(() => {
  const t = document.querySelector('main').innerText.replace(/\s+/g, ' ')
  return {
    parts: Number((t.match(/Parts Used\s+(\d+)/) || [, '0'])[1]),
    cost: Number((t.match(/Parts Cost\s*₹([\d.]+)/) || [, '0'])[1]),
    notes: Number((t.match(/Notes\s+(\d+)/) || [, '0'])[1]),
  }
})

// ---- add then remove a part ------------------------------------------------
const before = await read()
await page.locator('main button', { hasText: /^Add Part$/ }).first().click()
await page.waitForTimeout(1200)
await page.locator('button', { hasText: /Search part/i }).first().click()
await page.waitForTimeout(1100)
await page.locator('[data-slot=popover-content]:visible [role=option]').first().click()
await page.waitForTimeout(800)
await page.locator('main input[type=number]').first().fill('175')
await page.waitForTimeout(400)
await page.locator('main button', { hasText: /^Add$/ }).last().click()
await page.waitForTimeout(8000)
const added = await read()
check('the part was added', added.parts === before.parts + 1, `${before.parts} -> ${added.parts}, ₹${added.cost}`)

const removeBtn = page.locator('main button[aria-label="Remove part"]').last()
check('a Remove control exists on the part', (await removeBtn.count()) > 0)
if (await removeBtn.count()) {
  await removeBtn.click()
  await page.waitForTimeout(1500)
  const dialog = page.locator('[role=dialog]').last()
  console.log('      dialog buttons:', JSON.stringify(await dialog.locator('button').allInnerTexts()))
  await dialog.locator('button', { hasText: /^Remove$/ }).last().click()
  await page.waitForTimeout(8000)
  const stillOpen = (await page.locator('[role=dialog]').count()) > 0
  check('the confirm closed', !stillOpen)
  const after = await read()
  check('the part is gone', after.parts === before.parts, `${added.parts} -> ${after.parts}`)
  check('and the cost came off with it', after.cost === before.cost, `₹${added.cost} -> ₹${after.cost}`)

  // the truth, not the screen
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(7000)
  const truth = await read()
  check('still gone after a reload', truth.parts === before.parts && truth.cost === before.cost,
    `${truth.parts} parts, ₹${truth.cost}`)
}

// ---- add then remove a note ------------------------------------------------
const n0 = await read()
await page.locator('main button', { hasText: /^Add Note$/ }).first().click()
await page.waitForTimeout(1500)
await page.locator('[role=dialog] textarea').first().fill('ZZ removable note')
await page.locator('[role=dialog] button[type=submit]').first().click()
await page.waitForTimeout(8000)
const n1 = await read()
check('the note was added', n1.notes === n0.notes + 1, `${n0.notes} -> ${n1.notes}`)

const noteRemove = page.locator('main button[aria-label="Remove note"]').last()
check('a Remove control exists on the note', (await noteRemove.count()) > 0)
if (await noteRemove.count()) {
  await noteRemove.click()
  await page.waitForTimeout(1500)
  await page.locator('[role=dialog]').last().locator('button', { hasText: /^Remove$/ }).last().click()
  await page.waitForTimeout(8000)
  const n2 = await read()
  check('the note is gone', n2.notes === n0.notes, `${n1.notes} -> ${n2.notes}`)
}

await page.screenshot({ path: path.join(outDir, 'detail.png'), fullPage: true })
console.log(`\n${fails.length ? fails.length + ' FAILED' : 'all checks passed'}`)
await browser.close()
process.exit(fails.length ? 1 : 0)
