import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
const base = process.argv[2]
const outDir = 'screens/landing'
await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
for (const [name, w, h] of [['desktop', 1500, 900], ['phone', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)
  // above the fold only — the question is what lands in the first viewport
  await page.screenshot({ path: path.join(outDir, name + '-fold.png') })
  await page.close()
}
await browser.close()
console.log('shots written')
