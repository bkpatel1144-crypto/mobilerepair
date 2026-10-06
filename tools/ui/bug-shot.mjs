import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
const [base, email, password, path] = process.argv.slice(2)
await mkdir('screens/bug', { recursive: true })
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1500, height: 900 } })
await page.goto(base + '/login', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email); await page.fill('#password', password)
await page.click('button[type=submit]'); await page.waitForTimeout(15000)
await page.goto(base + path, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(7000)
// wheel hard over the sidebar, the way the user did
await page.mouse.move(120, 700)
for (let i = 0; i < 15; i++) await page.mouse.wheel(0, 600)
await page.waitForTimeout(900)
await page.screenshot({ path: 'screens/bug/fixed.png' })
console.log('window scrollY after wheeling:', await page.evaluate(() => Math.round(window.scrollY)))
await b.close()
