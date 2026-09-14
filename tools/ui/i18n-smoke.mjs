/**
 * A smoke check after a translation sweep.
 *
 *   node tools/ui/i18n-smoke.mjs <base> <email> <password>
 *
 * Wrapping a bare JSX text node in `t()` fails in exactly two ways, and neither throws: the key
 * is missing, so i18next renders the dotted key itself at the user; or the line was replaced in a
 * scope with no `t` and the button comes out empty. Both look fine in a diff and terrible on
 * screen.
 *
 * So every screen is loaded in English and again in Gujarati, and checked for a raw key, for an
 * empty button, and for English left over where Gujarati was expected.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const [base, email, password] = process.argv.slice(2)
if (!base || !email || !password) {
  console.error('usage: node tools/ui/i18n-smoke.mjs <base> <email> <password>')
  process.exit(1)
}

const failures = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

/** Menu leaves, read from nav.ts so this cannot drift out of step with the app. */
function navLeaves() {
  const nav = readFileSync('src/config/nav.ts', 'utf8')
  const out = []
  let section = null
  for (const line of nav.split('\n')) {
    const key = line.match(/^ {4}key: '([a-z-]+)'/)
    if (key) section = key[1]
    const leaf = line.match(/\{ label: '[^']+', slug: '([^']+)'/)
    if (leaf && section) out.push(`${section}/${leaf[1]}`)
  }
  return out
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(14_000)

const paths = ['dashboard', ...navLeaves()]

async function sweep(language) {
  await page.evaluate((lng) => localStorage.setItem('aim-language', lng), language)
  const rawKeys = []
  const emptyButtons = []
  for (const p of paths) {
    await page.goto(`${base}/app/${p}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3200)
    const found = await page.evaluate(() => {
      const main = document.querySelector('main')
      if (!main) return { keys: [], empty: 0 }
      const text = main.innerText
      // A dotted key that reached the screen — "pages.finance.expenses.paidBy" and the like.
      const keys = [...new Set(text.match(/\b(?:pages|shared|common|components|marketing)\.[a-zA-Z0-9.]+/g) ?? [])]
      // A button with no text and no icon is a label that vanished.
      const empty = [...main.querySelectorAll('button')].filter(
        (b) => b.innerText.trim() === '' && !b.querySelector('svg') && !b.getAttribute('aria-label')
      ).length
      return { keys, empty }
    })
    if (found.keys.length) rawKeys.push(`${p}: ${found.keys.join(', ')}`)
    if (found.empty) emptyButtons.push(`${p}: ${found.empty}`)
  }
  return { rawKeys, emptyButtons }
}

const en = await sweep('en')
check(`English: no raw translation keys on any of ${paths.length} screens`, en.rawKeys.length === 0, en.rawKeys.slice(0, 3).join(' | '))
check('English: no buttons lost their label', en.emptyButtons.length === 0, en.emptyButtons.slice(0, 3).join(' | '))

const gu = await sweep('gu')
check(`Gujarati: no raw translation keys on any of ${paths.length} screens`, gu.rawKeys.length === 0, gu.rawKeys.slice(0, 3).join(' | '))
check('Gujarati: no buttons lost their label', gu.emptyButtons.length === 0, gu.emptyButtons.slice(0, 3).join(' | '))

console.log(`\n${failures.length ? `${failures.length} FAILED` : 'all checks passed'}`)
await browser.close()
process.exit(failures.length ? 1 : 0)
