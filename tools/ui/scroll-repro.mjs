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
console.log(await page.evaluate(() => {
  const de = document.documentElement
  const body = document.body
  return [
    `html data-app-shell: ${de.hasAttribute('data-app-shell')}`,
    `html inline style: "${de.getAttribute('style') || ''}"`,
    `body inline style: "${body.getAttribute('style') || ''}"`,
    `html computed overflow: ${getComputedStyle(de).overflow} height: ${getComputedStyle(de).height}`,
    `body computed overflow: ${getComputedStyle(body).overflow} height: ${getComputedStyle(body).height}`,
    `scrollHeight ${de.scrollHeight} clientHeight ${de.clientHeight}`,
  ].join(String.fromCharCode(10))
}))

await b.close()
