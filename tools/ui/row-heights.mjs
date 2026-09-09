/**
 * Finds toolbars whose controls are not all the same height, on any screen width.
 *
 * Written after a filter row shipped with a 28px date chip beside a 32px search field beside a
 * 32px action button. That gap is small enough to read as sloppiness rather than a bug, and it
 * cannot be found by reading source: the heights come from `size` variants each page chooses for
 * itself, so the mismatch only exists once rendered together. Measuring the DOM turns "the UI
 * feels inconsistent" into a list of rows with their actual pixel heights.
 *
 *   node tools/ui/row-heights.mjs http://localhost:5173 1440
 *   node tools/ui/row-heights.mjs https://aimenterprise.web.app 390
 *
 * A row qualifies when one flex container holds two or more controls laid out horizontally.
 * Vertical stacks are skipped — a form column legitimately mixes a short input with a tall
 * textarea. Differences of 1px are ignored as sub-pixel rounding.
 *
 * It prints how many rows it examined per screen, and that number is the point: a silent "all
 * consistent" from a check that looked at nothing is worse than no check, which this project has
 * now been bitten by twice (`tsc --noEmit` against a solution-only tsconfig, and an overflow
 * check comparing two values that a clipping ancestor kept equal).
 *
 * Signs up a throwaway tenant, since every screen worth measuring is behind a login. Leaves a
 * company named "ZZ ROW <timestamp>" to delete from the console.
 */
import { chromium } from 'playwright'

const base = process.argv[2]
const width = Number(process.argv[3] ?? 1440)

const SCREENS = [
  ['dashboard', '/app/dashboard'],
  ['job cards', '/app/service/job-cards'],
  ['create job card', '/app/service/job-cards/create'],
  ['item master', '/app/masters/items'],
  ['roles', '/app/administration/roles'],
  ['users', '/app/administration/users'],
  ['financial years', '/app/settings/financial-years'],
  ['company', '/app/settings/company'],
  ['receipts', '/app/finance/receipts'],
  ['expenses', '/app/finance/expenses'],
  ['service options', '/app/service/options'],
  ['print formats', '/app/settings/print-formats'],
]

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width, height: width < 768 ? 844 : 900 },
  isMobile: width < 768,
  hasTouch: width < 768,
})

const stamp = Date.now()
await page.goto(`${base}/signup`, { waitUntil: 'domcontentloaded' })
await page.fill('#companyName', `ZZ ROW ${stamp}`)
await page.fill('#fullName', 'Row Probe')
await page.fill('#email', `row-${stamp}@aim-probe.test`)
await page.fill('#password', 'ProbeOnly!2345')
await page.click('button[type=submit]')
await page.waitForTimeout(22_000)

console.log(`\n=== ${width}px ===`)
let totalRows = 0
let totalExamined = 0

for (const [name, route] of SCREENS) {
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)

  const rows = await page.evaluate(() => {
    const SEL = '[data-slot=button],[data-slot=input],[data-slot=select-trigger]'
    const problems = []
    // Counted and reported so a silent "all consistent" cannot mean "examined nothing" — the
    // same trap as a typecheck with no files to check.
    let examined = 0
    for (const box of document.querySelectorAll('div')) {
      const cs = getComputedStyle(box)
      if (cs.display !== 'flex' || cs.flexDirection !== 'row') continue
      // Only controls that are this row's own items, not ones nested deeper in a child card.
      const controls = [...box.children]
        .map((c) => (c.matches(SEL) ? c : c.querySelector(SEL)))
        .filter((c) => c && c.getBoundingClientRect().height > 0)
      if (controls.length < 2) continue
      examined++
      const heights = controls.map((c) => Math.round(c.getBoundingClientRect().height))
      const distinct = [...new Set(heights)]
      if (distinct.length < 2) continue
      // A 1px difference is sub-pixel rounding, not a design inconsistency.
      if (Math.max(...distinct) - Math.min(...distinct) <= 1) continue
      problems.push({
        cls: (box.className || '').toString().replace(/\s+/g, ' ').slice(0, 64),
        heights: distinct.sort((a, b) => a - b).join('/'),
        labels: controls
          .slice(0, 4)
          .map((c) => (c.textContent || c.getAttribute('placeholder') || '·').trim().slice(0, 14))
          .join(', '),
      })
    }
    // One entry per distinct shape — the same row pattern repeats down a table otherwise.
    const seen = new Set()
    return {
      examined,
      rows: problems.filter((p) => {
        const key = p.cls + p.heights
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }),
    }
  })

  totalExamined += rows.examined
  console.log(
    `${name.padEnd(18)} examined: ${String(rows.examined).padStart(3)}` +
      (rows.rows.length ? `   MISMATCHED: ${rows.rows.length}` : '')
  )
  for (const r of rows.rows) console.log(`    ${r.heights}px  "${r.labels}"  [${r.cls}]`)
  totalRows += rows.rows.length
}

console.log(
  `
${totalExamined} control rows examined at ${width}px — ` +
    (totalRows ? `${totalRows} mismatched` : 'all consistent')
)
await browser.close()
