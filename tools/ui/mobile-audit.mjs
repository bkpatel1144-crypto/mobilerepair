/**
 * Every screen in the app, measured at phone width.
 *
 *   node tools/ui/mobile-audit.mjs <base> <email> <password> [outDir]
 *
 * "Mobile friendly" is not a judgement, it is a set of measurements, and these are the ones that
 * correspond to something actually broken on a 390px screen:
 *
 *  1. **The page scrolls sideways.** Always a bug. A table or a code block may scroll inside its
 *     own container; the page itself may not.
 *  2. **An element sticks out past the viewport.** Names the widest offender, because "something
 *     overflows" is not actionable and "this grid is 640px wide" is.
 *  3. **A form field is narrower than its own controls need.** Buy Mobile shipped with 154px
 *     fields this way, and it looked perfectly fine on the laptop it was built on.
 *  4. **A standalone tap target is smaller than 32px.** Not the 44px ideal — that would flag
 *     half the icon buttons in the app and drown the real problems. *Standalone* matters:
 *     a link flowing inside a sentence or a table cell is legitimately the height of its text,
 *     and "fixing" those to 32px would make the prose worse, not the app more tappable. So only
 *     elements that are their own block or flex item are measured.
 *  5. **Copy below 11px.** Unreadable at arm's length. Text drawn inside an `<svg>` is excluded:
 *     those are chart axis ticks, where 10px is the normal size and nobody reads them as prose.
 *
 * Reports per screen and screenshots each one, so a failure can be looked at rather than argued
 * about.
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const [base, email, password, outDirArg] = process.argv.slice(2)
if (!base || !email || !password) {
  console.error('usage: node tools/ui/mobile-audit.mjs <base> <email> <password> [outDir]')
  process.exit(1)
}
const outDir = outDirArg ?? 'screens/mobile'
await mkdir(outDir, { recursive: true })

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

/** Menu screens, plus the routes that are not menu leaves but are where the real work happens. */
const SCREENS = [
  'dashboard',
  ...navLeaves(),
  'service/job-cards/create',
  'service/job-cards/warranty',
  'masters/items/create',
  'second-hand-device/purchase/create',
  'administration/users/create',
  'administration/roles/create',
  'settings/company/preferences',
]

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
})
const page = await context.newPage()

// Log in at desktop width first — the login form is not what is being audited.
await page.setViewportSize({ width: 1200, height: 900 })
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(14_000)
await page.setViewportSize({ width: 390, height: 844 })

const rows = []

for (const screen of SCREENS) {
  await page.goto(`${base}/app/${screen}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4200)
  const name = screen.replace(/\//g, '--')
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true })

  const m = await page.evaluate(() => {
    const vw = window.innerWidth
    const main = document.querySelector('main')
    const text = (el) => (el.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 30)

    // 1 + 2: what sticks out, ignoring anything inside a deliberate scroll container.
    const scrolls = new Set()
    document.querySelectorAll('*').forEach((el) => {
      const s = getComputedStyle(el)
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') scrolls.add(el)
    })
    const insideScroller = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) if (scrolls.has(p)) return true
      return false
    }
    let widest = null
    ;(main ? main.querySelectorAll('*') : []).forEach((el) => {
      if (insideScroller(el)) return
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      const over = Math.round(r.right - vw)
      if (over > 1 && (!widest || over > widest.over)) {
        widest = { over, width: Math.round(r.width), tag: el.tagName.toLowerCase(), text: text(el) }
      }
    })

    // 3: form fields narrower than their controls need.
    const fields = main ? [...main.querySelectorAll('.space-y-1\\.5')] : []
    const withControls = fields.filter((el) => el.querySelector('input, textarea, select, button'))
    const narrow = withControls
      .map((el) => ({ w: Math.round(el.getBoundingClientRect().width), t: text(el) }))
      .filter((f) => f.w > 0 && f.w < 260)

    // 4: tap targets — standalone controls only, see the note above.
    const small = []
    ;(main ? main.querySelectorAll('button, a[href], [role=button]') : []).forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      if (getComputedStyle(el).display === 'inline') return
      if (r.height < 32 || r.width < 32) {
        small.push(`${Math.round(r.width)}x${Math.round(r.height)} ${text(el) || el.tagName}`)
      }
    })

    // 5: text too small to read.
    const tiny = new Set()
    ;(main ? main.querySelectorAll('*') : []).forEach((el) => {
      if (!el.childNodes.length) return
      // Chart ticks live in an <svg> and are drawn, not read.
      if (el.ownerSVGElement || el.tagName === 'svg') return
      const hasText = [...el.childNodes].some(
        (n) => n.nodeType === 3 && n.textContent.trim().length > 2
      )
      if (!hasText) return
      const size = parseFloat(getComputedStyle(el).fontSize)
      if (size && size < 11) tiny.add(`${size}px "${text(el)}"`)
    })

    return {
      pageScrolls: document.documentElement.scrollWidth > vw + 1,
      scrollWidth: document.documentElement.scrollWidth,
      vw,
      widest,
      fields: withControls.length,
      narrow: narrow.slice(0, 4),
      small: [...new Set(small)].slice(0, 4),
      smallCount: small.length,
      tiny: [...tiny].slice(0, 3),
    }
  })

  const problems = []
  if (m.pageScrolls) problems.push(`page scrolls sideways (${m.scrollWidth}px in ${m.vw}px)`)
  if (m.widest) problems.push(`${m.widest.tag} overflows by ${m.widest.over}px ("${m.widest.text}")`)
  if (m.narrow.length) problems.push(`${m.narrow.length} field(s) under 260px: ${m.narrow.map((f) => `${f.w}px`).join(', ')}`)
  if (m.smallCount) problems.push(`${m.smallCount} tap target(s) under 32px`)
  if (m.tiny.length) problems.push(`text under 11px: ${m.tiny.join('; ')}`)

  rows.push({ screen, problems, m })
  console.log(`${problems.length ? 'FAIL' : 'ok  '}  ${screen}${problems.length ? '  — ' + problems[0] : ''}`)
}

const bad = rows.filter((r) => r.problems.length)
const lines = [
  '# MOBILE_AUDIT.md — every screen at 390px',
  '',
  'Generated by `tools/ui/mobile-audit.mjs` against the deployed site.',
  '',
  `${rows.length} screens checked, ${bad.length} with something to fix.`,
  '',
]
for (const r of bad) {
  lines.push(`## ${r.screen}`, '')
  for (const p of r.problems) lines.push(`- ${p}`)
  if (r.m.narrow.length) lines.push(`- narrow fields: ${r.m.narrow.map((f) => `"${f.t}" ${f.w}px`).join(' · ')}`)
  if (r.m.small.length) lines.push(`- small targets: ${r.m.small.join(' · ')}`)
  lines.push(`- screenshot: \`${outDir}/${r.screen.replace(/\//g, '--')}.png\``, '')
}
if (!bad.length) lines.push('Nothing to fix — every screen fits, every field is usable.', '')
await writeFile('MOBILE_AUDIT.md', lines.join('\n'), 'utf8')

console.log(`\n${bad.length} of ${rows.length} screens have something to fix — see MOBILE_AUDIT.md`)
await browser.close()
