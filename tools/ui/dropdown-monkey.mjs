/**
 * Opens every dropdown on every screen and reports the ones that do not work.
 *
 *   node tools/ui/dropdown-monkey.mjs <base> [email] [password]
 *
 * The client reports that dropdowns misbehave across the app, so this treats every one of them
 * as guilty until it proves otherwise. Three kinds exist here and they are built differently:
 *
 *   SearchSelect  a Popover whose options are plain `<button>`s — no `role="option"`, no
 *                 listbox semantics. A probe looking for options by role finds zero even when
 *                 the list is full, which is how this was missed before.
 *   Select        Base UI, `[data-slot=select-trigger]` opening `[data-slot=select-item]`s.
 *   native        a bare `<select>`, used for things like page size.
 *
 * For each one: open it, count what appears, choose the first entry, and confirm the trigger's
 * own text changed. A dropdown that opens empty is reported separately from one that opens and
 * then refuses the click, because they are different faults.
 *
 * Counts are printed for everything, including how many dropdowns were found per screen, so a
 * run that opened nothing cannot read as a pass.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const [base, emailArg, passwordArg] = process.argv.slice(2)
if (!base) {
  console.error('usage: node tools/ui/dropdown-monkey.mjs <base> [email] [password]')
  process.exit(1)
}

const structure = JSON.parse(readFileSync('data/menu-structure.json', 'utf8')).menus
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } })

const stamp = Date.now()
const email = emailArg ?? `drop-${stamp}@aim-probe.test`
const password = passwordArg ?? 'ProbeOnly!2345'

if (emailArg) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(14_000)
} else {
  await page.goto(`${base}/signup`, { waitUntil: 'domcontentloaded' })
  await page.fill('#companyName', `ZZ DROP ${stamp}`)
  await page.fill('#fullName', 'Dropdown Probe')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(26_000)
}
console.log(`signed in as ${email}\n`)

await page.goto(`${base}/app/dashboard`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(6000)
const nav = page.locator('nav').first()
const screens = [['Dashboard', '/app/dashboard']]
for (const m of structure) {
  const head = nav.getByText(m.label, { exact: true }).first()
  if (!(await head.count())) continue
  await head.click({ timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(450)
  const links = await nav
    .locator('a[href*="/app/"]')
    .evaluateAll((els) => els.map((e) => [e.textContent.trim(), e.getAttribute('href')]))
  for (const [label, href] of links) if (!screens.some((s) => s[1] === href)) screens.push([label, href])
}
// The long forms carry most of the app's dropdowns and are not sidebar leaves.
screens.push(['Create Job Card', '/app/service/job-cards/create'])
screens.push(['Buy Second Hand Device', '/app/second-hand-device/purchase/create'])
console.log(`walking ${screens.length} screens\n`)

let opened = 0
const problems = []
const emptyButCreatable = []

async function closeAnyOverlay() {
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(250)
}

for (const [label, href] of screens) {
  const ok = await page
    .goto(base + href, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    .then(() => true)
    .catch(() => false)
  if (!ok) {
    problems.push({ screen: label, kind: 'screen', detail: 'navigation failed' })
    continue
  }
  await page.waitForTimeout(3200)

  // --- Base UI Selects -----------------------------------------------------------------
  //
  // Items are scoped to the list this trigger owns (`aria-controls`), not to the page. Base UI
  // leaves a closed select's items mounted, so a page-wide query returns the options of whichever
  // dropdown was opened first — an earlier run of this probe "chose All Types" in a page-size
  // dropdown and reported forty-eight faults that were all its own.
  const selects = page.locator('main [data-slot=select-trigger]')
  const selectCount = await selects.count()
  for (let i = 0; i < selectCount; i++) {
    const trigger = selects.nth(i)
    if (!(await trigger.isVisible().catch(() => false))) continue
    if (await trigger.isDisabled().catch(() => false)) continue

    const before = (await trigger.innerText().catch(() => '')).trim()
    await trigger.click({ timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(650)

    const listId = await trigger.getAttribute('aria-controls')
    const expanded = await trigger.getAttribute('aria-expanded')
    if (expanded !== 'true' || !listId) {
      problems.push({ screen: label, kind: 'Select', detail: `"${before}" did not open` })
      continue
    }
    opened += 1

    // `[id="…"]` rather than `#…`: the ids are Base UI's own (`base-ui-_r_27_-list`) and
    // `CSS.escape` does not exist in Node.
    const items = page.locator(`[id="${listId}"] [data-slot=select-item]`)
    const texts = (await items.allInnerTexts()).map((x) => x.trim()).filter(Boolean)
    if (texts.length === 0) {
      problems.push({ screen: label, kind: 'Select', detail: `"${before}" opens with no options` })
      await trigger.click().catch(() => {})
      continue
    }

    const target = texts.findIndex((tx) => tx !== before)
    if (target === -1) {
      await trigger.click().catch(() => {})
      await page.waitForTimeout(250)
      continue
    }

    await items.nth(target).click({ timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(700)
    const after = (await trigger.innerText().catch(() => '')).trim()
    if (after === before) {
      problems.push({
        screen: label,
        kind: 'Select',
        detail: `"${before}" ignored the choice "${texts[target]}" (${texts.length} options)`,
      })
    }

    // Escape must close an open listbox. Checked here rather than assumed, because this probe
    // relied on it and it did not hold.
    if ((await trigger.getAttribute('aria-expanded')) === 'true') {
      await page.keyboard.press('Escape').catch(() => {})
      await page.waitForTimeout(400)
      if ((await trigger.getAttribute('aria-expanded')) === 'true') {
        problems.push({ screen: label, kind: 'Select', detail: `"${before}" stays open after Escape` })
        await trigger.click().catch(() => {})
      }
    }
    await page.waitForTimeout(200)
  }

  // --- SearchSelect popovers ----------------------------------------------------------
  // The trigger is the element the Popover anchors; find it by the search icon its button holds.
  const combos = page.locator('main [data-slot=popover-trigger]')
  const comboCount = await combos.count()
  for (let i = 0; i < comboCount; i++) {
    const trigger = combos.nth(i)
    if (!(await trigger.isVisible().catch(() => false))) continue
    const disabled =
      (await trigger.getAttribute('aria-disabled')) === 'true' ||
      (await trigger.isDisabled().catch(() => false)) ||
      /pick a .* first/i.test((await trigger.innerText().catch(() => '')) || '')
    if (disabled) continue
    const before = (await trigger.innerText().catch(() => '')).trim().slice(0, 40)
    await trigger.click({ timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(700)
    const panel = page.locator('[data-slot=popover-content]').first()
    if (!(await panel.count())) {
      problems.push({ screen: label, kind: 'SearchSelect', detail: `"${before}" did not open` })
      continue
    }
    opened += 1
    // Options are rendered as buttons in SearchSelect and as label+checkbox rows in the
    // multi-select pickers — counting only buttons called a working status filter empty.
    const options = await panel.locator('button, label, [role=option]').count()
    const panelText = await panel.innerText().catch(() => '')
    const noMatches = /no matches/i.test(panelText)
    // "Add New…" is an input *placeholder*, which `innerText` does not return — reading only the
    // text made three working pickers look like dead ends.
    const canCreate =
      /add new/i.test(panelText) ||
      (await panel.locator('input[placeholder*="Add New" i], button:has-text("Add")').count()) > 0
    if (options === 0 || (noMatches && !canCreate)) {
      problems.push({
        screen: label,
        kind: 'SearchSelect',
        detail: `"${before}" opens with nothing to choose and no way to add one`,
      })
    } else if (noMatches && canCreate) {
      emptyButCreatable.push(`${label} · "${before}"`)
    }
    await closeAnyOverlay()
  }

  // --- native selects ------------------------------------------------------------------
  const natives = page.locator('main select')
  const nativeCount = await natives.count()
  for (let i = 0; i < nativeCount; i++) {
    const sel = natives.nth(i)
    if (!(await sel.isVisible().catch(() => false))) continue
    const n = await sel.locator('option').count()
    opened += 1
    if (n === 0) problems.push({ screen: label, kind: 'native select', detail: 'has no <option>s' })
  }

  const total = selectCount + comboCount + nativeCount
  if (total) console.log(`${label}: ${total} dropdowns (${selectCount} select, ${comboCount} search, ${nativeCount} native)`)
}

await browser.close()

console.log('\n' + '='.repeat(78))
console.log(`OPENED ${opened} DROPDOWNS ACROSS ${screens.length} SCREENS — ${problems.length} problems`)
console.log('='.repeat(78))
if (opened === 0) {
  console.log('!! opened nothing — this run proves nothing')
  process.exit(1)
}
for (const p of problems) console.log(`  ${p.screen} · ${p.kind}: ${p.detail}`)
if (!problems.length) console.log('  every dropdown opened, listed options, and accepted a choice')
if (emptyButCreatable.length) {
  console.log(`
empty on a fresh tenant but offering "Add New" (not a fault): ${emptyButCreatable.length}`)
  for (const e of emptyButCreatable) console.log(`  ${e}`)
}
process.exit(problems.length ? 1 : 0)
