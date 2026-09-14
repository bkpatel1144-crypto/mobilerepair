/**
 * Measures whether a form actually fits the screen it is on.
 *
 *   node tools/ui/form-layout-check.mjs <base> <email> <password> [outDir]
 *
 * "Mobile friendly" is not a look, it is two measurements: nothing may overflow the viewport
 * horizontally, and no field may be squeezed below the width at which its own controls stop
 * fitting. A two-column grid with no breakpoint passes every visual review on a laptop and puts
 * every field in a 163px column on a phone — which is how Buy Mobile shipped.
 *
 * Reports the narrowest field on each form, because that is the number that tells you whether a
 * column count is wrong, and screenshots both widths so the two can be looked at side by side.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const [base, email, password, outDirArg] = process.argv.slice(2)
if (!base || !email || !password) {
  console.error('usage: node tools/ui/form-layout-check.mjs <base> <email> <password> [outDir]')
  process.exit(1)
}
const outDir = outDirArg ?? 'screens/forms'
await mkdir(outDir, { recursive: true })

/** The long data-entry forms, the ones a column count actually matters on. */
const FORMS = [
  ['create-job-card', '/app/service/job-cards/create'],
  ['buy-mobile', '/app/second-hand-device/purchase/create'],
  ['create-item', '/app/masters/items/create'],
  ['create-user', '/app/administration/users/create'],
  ['create-role', '/app/administration/roles/create'],
]

/** 390px is an iPhone 14; 1500px is a laptop. A form has to work at both. */
const WIDTHS = [
  ['phone', 390, 844],
  ['desktop', 1500, 1000],
]

const failures = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } })
const page = await context.newPage()
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(14_000)

for (const [name, url] of FORMS) {
  for (const [label, width, height] of WIDTHS) {
    await page.setViewportSize({ width, height })
    await page.goto(base + url, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4500)
    await page.screenshot({ path: path.join(outDir, `${name}--${label}.png`), fullPage: true })

    const m = await page.evaluate(() => {
      const main = document.querySelector('main')
      if (!main) return null
      // A "field" is a label's own block — the wrapper that holds the control and any trailing
      // icon button. Its width is what decides whether the control is usable.
      const fields = [...main.querySelectorAll('.space-y-1\\.5')].filter((el) =>
        el.querySelector('input, button, textarea, select')
      )
      const widths = fields.map((el) => Math.round(el.getBoundingClientRect().width))
      return {
        fields: widths.length,
        narrowest: widths.length ? Math.min(...widths) : null,
        // The page itself must never scroll sideways.
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }
    })
    if (!m) {
      check(`${name} @ ${label}: page rendered`, false, 'no <main>')
      continue
    }

    check(
      `${name} @ ${label}: no horizontal overflow`,
      !m.overflow,
      m.overflow ? `${m.scrollWidth}px in a ${m.innerWidth}px viewport` : `${m.fields} fields`
    )
    if (label === 'phone' && m.narrowest != null) {
      // 260px is about where a text input plus a trailing icon button stops being usable.
      check(
        `${name} @ phone: no field squeezed below 260px`,
        m.narrowest >= 260,
        `narrowest field ${m.narrowest}px of ${m.fields}`
      )
    }
    if (label === 'desktop' && m.narrowest != null) {
      console.log(`      (desktop: ${m.fields} fields, narrowest ${m.narrowest}px)`)
    }
  }
}

console.log(`\n${failures.length ? `${failures.length} FAILED` : 'all checks passed'}`)
console.log(`screenshots in ${outDir}/`)
await browser.close()
process.exit(failures.length ? 1 : 0)
