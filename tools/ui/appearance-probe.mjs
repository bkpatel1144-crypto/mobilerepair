/**
 * The Appearance panel, every setting, looked at rather than assumed.
 *
 *   node tools/ui/appearance-probe.mjs <base> <email> <password>
 *
 * A theme is the easiest thing in the world to break invisibly: a token that only exists in
 * light mode, an accent whose button text drops below 4.5:1, a glass surface that stays
 * translucent when someone asked it not to be. So this drives each setting on the real site,
 * screenshots it, and *measures* the contrast rather than trusting that the colours look fine.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const [base, email, password] = process.argv.slice(2)
const outDir = 'screens/appearance'
await mkdir(outDir, { recursive: true })

const fails = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) fails.push(label)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))
page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|net::ERR_/i.test(m.text())) errors.push(m.text().slice(0, 160))
})

await page.goto(base + '/login', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(15000)
await page.goto(base + '/app/service/job-cards', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(7000)

/** Sets the appearance the way the panel does, then lets the page settle. */
async function setAppearance(patch) {
  await page.evaluate((p) => {
    const cur = JSON.parse(localStorage.getItem('aim-appearance') || '{}')
    const next = { accent: 'teal', cards: 'white', chrome: 'docked', font: 'geist', ...cur, ...p }
    localStorage.setItem('aim-appearance', JSON.stringify(next))
    const r = document.documentElement
    r.setAttribute('data-accent', next.accent)
    r.setAttribute('data-cards', next.cards)
    r.setAttribute('data-chrome', next.chrome)
    r.setAttribute('data-font', next.font)
  }, patch)
  await page.waitForTimeout(900)
}

/** WCAG contrast of the primary button's label against its own fill. */
async function primaryContrast() {
  return page.evaluate(() => {
    // Colours are resolved through a canvas rather than parsed out of the computed string.
    //
    // This palette is authored in `oklch()`, and Chrome hands `getComputedStyle` back the same
    // `oklch(...)` it was given. Pulling the three numbers out of that with a regex and calling
    // them R, G and B turns white into near-black and produced sixteen confidently wrong
    // ratios — teal at 1.70:1, when white on teal-600 is about 3:1. Letting the browser paint
    // the colour and reading the pixel back works for any colour space, now or later.
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const toRgb = (css) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2]]
    }
    const lum = (rgb) => {
      const [r, g, b] = rgb.map((v) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const probe = document.createElement('div')
    probe.style.backgroundColor = 'var(--primary)'
    document.body.appendChild(probe)
    const primaryRgb = getComputedStyle(probe).backgroundColor
    probe.remove()

    const btn = [...document.querySelectorAll('button, a[data-slot=button]')].find(
      (b) => getComputedStyle(b).backgroundColor === primaryRgb && b.innerText.trim()
    )
    if (!btn) return null
    const cs = getComputedStyle(btn)
    const a = lum(toRgb(cs.color))
    const b = lum(toRgb(cs.backgroundColor))
    const hi = Math.max(a, b)
    const lo = Math.min(a, b)
    return {
      ratio: (hi + 0.05) / (lo + 0.05),
      text: btn.innerText.trim().slice(0, 20),
      fg: toRgb(cs.color).join(','),
      bg: toRgb(cs.backgroundColor).join(','),
    }
  })
}


/**
 * The worst-contrast piece of text in the sidebar, against the rail it sits on.
 *
 * Added because the ink sidebar shipped with the company wordmark dark-on-dark: the column set
 * its background from the sidebar tokens and its text colour from the page's, which is correct
 * right up until a look makes the rail dark. Nothing measured it, so it took a screenshot to
 * notice — exactly the kind of thing that should be a number.
 */
async function worstSidebarContrast() {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const toRgb = (css) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2]]
    }
    const lum = (rgb) => {
      const [r, g, b] = rgb.map((v) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const ratio = (fg, bg) => {
      const a = lum(toRgb(fg))
      const b = lum(toRgb(bg))
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    }

    const side = document.querySelector('[data-chrome-surface="sidebar"]')
    if (!side) return null
    const railBg = getComputedStyle(side).backgroundColor
    let worst = null
    side.querySelectorAll('*').forEach((el) => {
      const text = (el.textContent || '').trim()
      if (!text || el.children.length) return
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      const cs = getComputedStyle(el)
      // Against its own painted background if it has one, else the rail.
      const ownBg = cs.backgroundColor
      const bg = ownBg === 'rgba(0, 0, 0, 0)' || ownBg === 'transparent' ? railBg : ownBg
      const v = ratio(cs.color, bg)
      if (!worst || v < worst.ratio) worst = { ratio: v, text: text.slice(0, 24) }
    })
    return worst
  })
}

const ACCENTS = ['teal', 'navy', 'forest', 'indigo', 'orchid', 'rosewood', 'amber', 'slate']

for (const mode of ['light', 'dark']) {
  await page.evaluate((m) => document.documentElement.classList.toggle('dark', m === 'dark'), mode)
  for (const accent of ACCENTS) {
    await setAppearance({ accent })
    const c = await primaryContrast()
    check(
      mode + '/' + accent + ': primary button text is readable',
      !!c && c.ratio >= 4.5,
      c ? c.ratio.toFixed(2) + ':1  rgb(' + c.fg + ') on rgb(' + c.bg + ')' : 'no primary button found'
    )
  }
  await page.screenshot({ path: path.join(outDir, 'accents-' + mode + '.png') })
}
await page.evaluate(() => document.documentElement.classList.remove('dark'))
await setAppearance({ accent: 'teal' })

// ---- card styles ----------------------------------------------------------
const cardColours = new Set()
for (const cards of ['white', 'tinted', 'filled']) {
  await setAppearance({ cards })
  await page.screenshot({ path: path.join(outDir, 'cards-' + cards + '.png') })
  cardColours.add(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--card').trim()
    )
  )
}
check('the three card styles are actually different', cardColours.size === 3, [...cardColours].join(' | '))
await setAppearance({ cards: 'white' })

// ---- fonts ----------------------------------------------------------------
const families = new Set()
for (const font of ['geist', 'system', 'serif', 'mono']) {
  await setAppearance({ font })
  families.add(await page.evaluate(() => getComputedStyle(document.body).fontFamily.slice(0, 40)))
}
check('each typeface option changes the body font', families.size === 4, families.size + ' distinct')
await setAppearance({ font: 'geist' })

// ---- floating chrome ------------------------------------------------------
await setAppearance({ chrome: 'floating' })
await page.screenshot({ path: path.join(outDir, 'chrome-floating.png') })
const floating = await page.evaluate(() => {
  const side = document.querySelector('[data-chrome-surface="sidebar"]')
  const top = document.querySelector('[data-chrome-surface="topbar"]')
  const cs = side && getComputedStyle(side)
  return {
    radius: cs ? cs.borderTopLeftRadius : null,
    blur: cs ? cs.backdropFilter : null,
    topRadius: top ? getComputedStyle(top).borderTopLeftRadius : null,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }
})
check('the sidebar floats with rounded corners', parseFloat(floating.radius || '0') > 8, floating.radius)
check('and the top bar too', parseFloat(floating.topRadius || '0') > 8, floating.topRadius)
check('glass is actually blurring', /blur/.test(floating.blur || ''), floating.blur || 'none')
check('floating chrome does not make the page scroll sideways', !floating.overflow)

await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(2500)
await page.screenshot({ path: path.join(outDir, 'chrome-floating-phone.png'), fullPage: true })
const phone = await page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  width: document.documentElement.scrollWidth,
}))
check('and still fits a phone', !phone.overflow, phone.width + 'px in 390px')

await page.setViewportSize({ width: 1500, height: 1000 })
await setAppearance({ chrome: 'docked' })

// ---- the sidebar, in both looks and both themes -----------------------------
for (const look of ['studio', 'classic']) {
  for (const mode of ['light', 'dark']) {
    await page.evaluate((m) => document.documentElement.classList.toggle('dark', m === 'dark'), mode)
    await setAppearance({ look })
    const w = await worstSidebarContrast()
    check(
      look + '/' + mode + ': every sidebar label is readable on the rail',
      !!w && w.ratio >= 4.5,
      w ? w.ratio.toFixed(2) + ':1 worst, on "' + w.text + '"' : 'no sidebar text found'
    )
  }
}
await page.evaluate(() => document.documentElement.classList.remove('dark'))
await setAppearance({ look: 'studio' })

check('no console errors', errors.length === 0, errors.slice(0, 2).join(' | '))

console.log('\nscreenshots in ' + outDir + '/')
console.log(fails.length ? fails.length + ' FAILED: ' + fails.join(', ') : 'all checks passed')
await browser.close()
process.exit(fails.length ? 1 : 0)
