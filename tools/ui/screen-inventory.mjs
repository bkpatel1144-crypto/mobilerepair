/**
 * Phase 16 groundwork — screenshots and a structural inventory of every screen this app has.
 *
 *   node tools/ui/screen-inventory.mjs <base> <email> <password> [outDir]
 *
 * The comparison against the reference needs two halves and only one of them is missing. This
 * captures ours: a PNG per screen plus, for each, what it actually contains — heading, subtitle,
 * stat cards, toolbar buttons, table columns, empty state. So the question to the client stops
 * being "send me forty screenshots" and becomes "here is ours, tell me what yours has that this
 * does not".
 *
 * The inventory matters more than the images. Reading a screen's columns and buttons out of the
 * DOM is how a difference gets *named*; comparing source files has twice reported screens as
 * matching while they looked nothing alike.
 */
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { readFileSync } from 'node:fs'

const [base, email, password, outDirArg] = process.argv.slice(2)
if (!base || !email || !password) {
  console.error('usage: node tools/ui/screen-inventory.mjs <base> <email> <password> [outDir]')
  process.exit(1)
}
const outDir = outDirArg ?? 'screens'

/** Every menu leaf, read from nav.ts rather than listed by hand so this cannot drift. */
function navLeaves() {
  const nav = readFileSync('src/config/nav.ts', 'utf8')
  const leaves = []
  let section = null
  let sectionLabel = null
  for (const line of nav.split('\n')) {
    const key = line.match(/^ {4}key: '([a-z-]+)'/)
    if (key) section = key[1]
    const label = line.match(/^ {4}label: '([^']+)'/)
    if (label) sectionLabel = label[1]
    const leaf = line.match(/\{ label: '([^']+)', slug: '([^']+)'/)
    if (leaf && section) {
      leaves.push({ section, sectionLabel, label: leaf[1], slug: leaf[2] })
    }
  }
  return leaves
}


/**
 * The table columns a screen declares, read from its source file.
 *
 * The DOM is the better source and is used wherever it can be: a rendered `<thead>` is what the
 * shopkeeper actually sees. But a `DataTable` with no rows renders its empty state instead of a
 * header row, so on a screen with no data yet the DOM has no columns to read — and columns are
 * precisely what has to be compared against the reference. Reading the declaration keeps those
 * screens in the inventory instead of leaving a hole exactly where the tenant is new.
 *
 * Marked in the output, so nobody mistakes a declared column for one seen on screen.
 */
function declaredColumns(file, locale) {
  let source
  try {
    source = readFileSync(file, 'utf8')
  } catch {
    return []
  }
  const out = []
  for (const m of source.matchAll(/header:\s*(?:t\('([^']+)'\)|'([^']+)'|`([^`]+)`)/g)) {
    const key = m[1]
    if (key) {
      const resolved = key.split('.').reduce((node, part) => node?.[part], locale)
      out.push(typeof resolved === 'string' ? resolved : key)
    } else {
      out.push(m[2] ?? m[3])
    }
  }
  return out
}

/** `section/slug` -> the page file that renders it, resolved through App.tsx. */
function pageFiles() {
  const app = readFileSync('src/App.tsx', 'utf8')
  const componentFile = new Map()
  for (const m of app.matchAll(
    /const (\w+) = lazy\(\(\) =>\s*import\('@\/([^']+)'\)/g
  )) {
    componentFile.set(m[1], `src/${m[2]}.tsx`)
  }
  const byKey = new Map()
  for (const m of app.matchAll(/'([a-z-]+\/[a-z0-9-]+)':\s*(\w+),/g)) {
    const file = componentFile.get(m[2])
    if (file) byKey.set(m[1], file)
  }
  return byKey
}

const leaves = navLeaves()
if (leaves.length === 0) {
  console.error('read no menu leaves from src/config/nav.ts — run this from the repo root')
  process.exit(1)
}
console.log(`inventorying ${leaves.length + 1} screens`)

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } })
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.fill('#email', email)
await page.fill('#password', password)
await page.click('button[type=submit]')
await page.waitForTimeout(14_000)

/** What a screen is made of, read from the DOM. */
async function describe() {
  return page.evaluate(() => {
    const main = document.querySelector('main')
    if (!main) return null
    const text = (el) => (el?.innerText ?? '').replace(/\s+/g, ' ').trim()
    const uniq = (list) => [...new Set(list.filter(Boolean))]

    const heading = text(main.querySelector('h1'))
    // The subtitle is the paragraph immediately after the heading, when there is one.
    const subtitle = text(main.querySelector('h1')?.parentElement?.querySelector('p'))

    // Stat cards are the repeated `aria-pressed` buttons or bordered tiles at the top.
    const stats = uniq(
      [...main.querySelectorAll('[aria-pressed], [data-slot=stat-card]')].map((el) =>
        text(el).slice(0, 40)
      )
    )
    const buttons = uniq(
      [...main.querySelectorAll('button')]
        .map((el) => text(el) || el.getAttribute('aria-label') || '')
        .filter((t) => t.length > 0 && t.length < 30)
    )
    const columns = uniq([...main.querySelectorAll('thead th')].map((el) => text(el)))
    const rowCount = main.querySelectorAll('tbody tr').length
    const empty = text(main.querySelector('[data-slot=empty-state]'))
    const denied = /don.t have access/i.test(text(main))
    return { heading, subtitle, stats, buttons, columns, rowCount, empty, denied }
  })
}

const locale = JSON.parse(readFileSync('src/locales/en.json', 'utf8'))
const files = pageFiles()
const rows = []

async function capture(name, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  // Long enough for a Firestore query to land — an inventory of loading skeletons is worthless.
  await page.waitForTimeout(5200)
  const file = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  const info = (await describe()) ?? {}
  const key = name.replace('--', '/')
  const source = files.get(key)
  const declared = source && !info.columns?.length ? declaredColumns(source, locale) : []
  rows.push({ name, url, file, source, declared, ...info })
  const flag = info.denied ? ' [ACCESS DENIED]' : info.empty ? ' [empty]' : ''
  console.log(`  ${name}${flag}`)
}

await capture('dashboard', `${base}/app/dashboard`)
for (const leaf of leaves) {
  await capture(`${leaf.section}--${leaf.slug}`, `${base}/app/${leaf.section}/${leaf.slug}`)
}

// ---- the inventory --------------------------------------------------------
const lines = [
  '# SCREEN_INVENTORY.md — what every screen in this app currently contains',
  '',
  'Generated by `tools/ui/screen-inventory.mjs` against the deployed site. Each row is read from',
  'the rendered DOM, not from source: heading, subtitle, stat cards, toolbar buttons and table',
  'columns as they actually appear.',
  '',
  'Use it to compare against the reference app one section at a time — the question is which of',
  'these screens is missing a column, a filter or an action that theirs has.',
  '',
  `Captured ${rows.length} screens. Screenshots are in \`${outDir}/\`.`,
  '',
]

let currentSection = null
for (const r of rows) {
  const section = r.name.includes('--') ? r.name.split('--')[0] : 'dashboard'
  if (section !== currentSection) {
    currentSection = section
    lines.push('', `## ${section}`, '')
  }
  lines.push(`### ${r.name}`, '')
  lines.push(`- **Path:** \`${r.url.replace(base, '')}\``)
  lines.push(`- **Screenshot:** \`${r.file.replace(/\\/g, '/')}\``)
  if (r.denied) lines.push('- **ACCESS DENIED** — this role cannot open the screen')
  if (r.heading) lines.push(`- **Heading:** ${r.heading}`)
  if (r.subtitle) lines.push(`- **Subtitle:** ${r.subtitle}`)
  if (r.stats?.length) lines.push(`- **Cards:** ${r.stats.join(' · ')}`)
  if (r.buttons?.length) lines.push(`- **Buttons:** ${r.buttons.join(' · ')}`)
  if (r.columns?.length) {
    lines.push(`- **Columns (${r.columns.length}):** ${r.columns.join(' | ')}`)
  } else if (r.declared?.length) {
    lines.push(
      `- **Columns (${r.declared.length}, declared — the table was empty so none were on screen):** ${r.declared.join(' | ')}`
    )
  }
  if (r.source) lines.push(`- **Source:** \`${r.source}\``)
  if (typeof r.rowCount === 'number') lines.push(`- **Rows shown:** ${r.rowCount}`)
  if (r.empty) lines.push(`- **Empty state:** ${r.empty.slice(0, 120)}`)
  lines.push('')
}

await writeFile('SCREEN_INVENTORY.md', lines.join('\n'), 'utf8')
console.log(`\nwrote SCREEN_INVENTORY.md and ${rows.length} screenshots to ${outDir}/`)

const denied = rows.filter((r) => r.denied).map((r) => r.name)
const empty = rows.filter((r) => r.empty && !r.denied).map((r) => r.name)
const noColumns = rows
  .filter((r) => !r.denied && !r.columns?.length && !r.declared?.length)
  .map((r) => r.name)
console.log(`access denied: ${denied.length ? denied.join(', ') : 'none'}`)
console.log(`empty (no data seeded): ${empty.length}`)
console.log(`no table: ${noColumns.length}`)

await browser.close()
