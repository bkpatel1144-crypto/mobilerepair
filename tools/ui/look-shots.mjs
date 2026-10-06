import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
const [base, email, password] = process.argv.slice(2)
const outDir = 'screens/look'
await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
await page.goto(base + '/login', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email); await page.fill('#password', password)
await page.click('button[type=submit]'); await page.waitForTimeout(15000)

async function look(patch, name, url) {
  await page.evaluate((p) => {
    const next = { look: 'studio', accent: 'teal', cards: 'white', chrome: 'docked', font: 'geist', ...p }
    localStorage.setItem('aim-appearance', JSON.stringify(next))
    const r = document.documentElement
    r.setAttribute('data-look', next.look)
    r.setAttribute('data-accent', next.accent)
    r.setAttribute('data-cards', next.cards)
    r.setAttribute('data-chrome', next.chrome)
    r.setAttribute('data-font', next.font)
  }, patch)
  if (url) { await page.goto(base + url, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(6500) }
  else await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(outDir, name + '.png') })
  console.log('shot', name)
}

await look({ look: 'classic' }, '1-classic', '/app/service/job-cards')
await look({ look: 'studio' }, '2-studio', '/app/service/job-cards')
await look({ look: 'studio' }, '3-studio-dashboard', '/app/dashboard')
await page.evaluate(() => document.documentElement.classList.add('dark'))
await look({ look: 'studio' }, '4-studio-dark', '/app/service/job-cards')
await page.evaluate(() => document.documentElement.classList.remove('dark'))
await browser.close()
