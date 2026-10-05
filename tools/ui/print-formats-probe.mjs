/**
 * The Print Formats designer, exercised the way a shop uses it.
 *
 *   node tools/ui/print-formats-probe.mjs <base> <email> <password>
 *
 * Opens a template, adds one of every element the palette offers, saves, reloads, and checks
 * each one survived — then opens Preview and reads what actually comes out. The last part is
 * the point: the designer can look perfectly healthy while the thing it prints is wrong, and
 * a barcode is the clearest case, because the app's own Scan Job Card decodes QR with `jsqr`
 * and so can tell you definitively whether a printed label is scannable.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const [base, email, password] = process.argv.slice(2)
const outDir = 'screens/print'
await mkdir(outDir, { recursive: true })

const found = []
const bug = (what, detail = '') => {
  found.push({ what, detail })
  console.log(`BUG   ${what}${detail ? `  — ${detail}` : ''}`)
}
const ok = (what, detail = '') => console.log(`ok    ${what}${detail ? `  — ${detail}` : ''}`)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`))
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|net::ERR_/i.test(m.text())) errors.push(m.text().slice(0, 200))
})

await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(15000)

await page.goto(`${base}/app/settings/print-formats`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(7000)
await page.screenshot({ path: path.join(outDir, '01-list.png'), fullPage: true })

const rows = await page.locator('tbody tr').count()
console.log(`templates listed: ${rows}`)
if (rows === 0) {
  bug('no print templates exist at all', 'a shop cannot print anything')
  await browser.close()
  process.exit(1)
}

// open the first template's designer
await page.locator('tbody tr').first().click()
await page.waitForTimeout(3000)
if (!/designer|print-formats\//.test(page.url())) {
  const edit = page.locator('tbody tr').first().locator('button, a').first()
  await edit.click().catch(() => {})
  await page.waitForTimeout(3000)
}
await page.waitForTimeout(5000)
console.log(`designer url: ${page.url().replace(base, '')}`)
await page.screenshot({ path: path.join(outDir, '02-designer.png'), fullPage: true })

// ---- add one of every element -------------------------------------------
const PALETTE = ['Text', 'Image', 'Logo', 'Barcode', 'QR Code', 'Line', 'Shape']
const added = []
for (const name of PALETTE) {
  const before = await page.locator('[data-el-id], [data-element-id]').count()
  const btn = page.locator('button', { hasText: new RegExp(`^${name}$`) }).first()
  if ((await btn.count()) === 0) {
    bug(`palette has no "${name}" button`)
    continue
  }
  await btn.click()
  await page.waitForTimeout(1200)
  const after = await page.locator('[data-el-id], [data-element-id]').count()
  if (after > before) {
    added.push(name)
    ok(`added ${name}`, `${before} → ${after} elements`)
  } else {
    bug(`"${name}" did not add an element`, `count stayed ${before}`)
  }
}

// ---- save, reload, and see what survived --------------------------------
const countBeforeSave = await page.locator('[data-el-id], [data-element-id]').count()
const save = page.locator('button', { hasText: /^Save$/ }).first()
if ((await save.count()) === 0) bug('no Save button in the designer')
else {
  await save.click()
  await page.waitForTimeout(6000)
  const body = await page.locator('body').innerText()
  if (/Unsaved changes/i.test(body)) bug('still says "Unsaved changes" after Save')
  else ok('Save cleared the unsaved marker')
}
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(8000)
const countAfterReload = await page.locator('[data-el-id], [data-element-id]').count()
if (countAfterReload < countBeforeSave) {
  bug('elements lost on reload', `${countBeforeSave} before save → ${countAfterReload} after reload`)
} else {
  ok('elements survived the reload', `${countAfterReload}`)
}
await page.screenshot({ path: path.join(outDir, '03-after-reload.png'), fullPage: true })

// ---- what does it actually print? ---------------------------------------
const printHtml = await page.evaluate(() => {
  // The preview pane renders the same HTML the printer gets.
  const frame = document.querySelector('iframe')
  if (frame) {
    try {
      return frame.contentDocument?.body?.innerHTML ?? null
    } catch {
      return null
    }
  }
  return null
})

const preview = page.locator('button', { hasText: /^Preview$/ }).first()
if ((await preview.count()) === 0) {
  bug('no Preview button')
} else {
  const popupPromise = page.context().waitForEvent('page', { timeout: 8000 }).catch(() => null)
  await preview.click()
  await page.waitForTimeout(4000)
  const popup = await popupPromise
  const target = popup ?? page
  await target.waitForTimeout(3000).catch(() => {})
  const html = await target.content().catch(() => '')
  await target.screenshot({ path: path.join(outDir, '04-preview.png'), fullPage: true }).catch(() => {})

  // A real barcode/QR is drawn — an <svg>, a <canvas>, or an <img>. Text in a dashed box is not.
  const hasSvgOrCanvas = /<svg|<canvas/i.test(html)
  const hasDashedTextBox = /dashed/i.test(html) && /monospace/i.test(html)
  if (hasDashedTextBox && !hasSvgOrCanvas) {
    bug(
      'Barcode / QR Code print as plain text, not a scannable symbol',
      'rendered as monospace text in a dashed box; the app\'s own Scan Job Card uses jsqr and cannot read it'
    )
  } else if (hasSvgOrCanvas) {
    ok('the preview draws a real symbol')
  }
  if (popup) await popup.close().catch(() => {})
}

if (printHtml === null) ok('(preview is a popup, not an inline iframe)')

if (errors.length) {
  console.log(`\nconsole errors (${errors.length}):`)
  for (const e of [...new Set(errors)].slice(0, 8)) console.log(`  ${e}`)
}
console.log(`\n${found.length} bug(s) found; screenshots in ${outDir}/`)
await browser.close()
