/**
 * Signs up a brand-new account against the deployed app in a real browser and reports what the
 * new Owner actually ends up looking at.
 *
 * This exists because two rounds of reasoning about `firestore.rules`, plus a Node probe that
 * wrote one document per collection, all reported "fixed" while real signups kept landing on an
 * empty sidebar and "You don't have access to this page". Node cannot reproduce the client the app
 * really runs on: `src/lib/firebase.ts` configures `persistentLocalCache`, and none of that
 * machinery — the IndexedDB copy, latency compensation, TanStack Query's own caching on top —
 * exists outside a browser. The bug lives entirely in that layer, so it can only be seen here.
 *
 * Three points are measured, because the failure only showed up at one of them:
 *  - after signup, the case that was broken
 *  - after a reload, which separates a one-time race whose result got cached for the rest of the
 *    session from a tenant that is genuinely unreadable — the reload recovering is what identified
 *    this as a caching bug rather than a permissions one
 *  - after a login in a clean browser, the multi-user path, which exercises `logIn()` and a
 *    profile that has to be fetched rather than seeded from a cache
 *
 * At each point it records the sidebar's sections, the wordmark (the company name, or the "aim"
 * fallback that means the company read came back empty), the access-denied empty state, the cached
 * profile, and every console message and page error.
 *
 *   node tools/firebase/e2e-signup.mjs [url]
 *
 * Creates a real account and company on the live database, named "ZZ E2E <timestamp>" so they are
 * obvious in the console. Delete them there; `companies` is undeletable from a client.
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'https://aimenterprise.web.app'
const stamp = Date.now()
const account = {
  companyName: `ZZ E2E ${stamp}`,
  fullName: 'E2E Probe',
  email: `e2e-${stamp}@aim-probe.test`,
  password: 'ProbeOnly!2345',
}

const browser = await chromium.launch()
const page = await browser.newPage()

/** Console output is the primary evidence here, so nothing is filtered out at capture time. */
const logs = []
page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`))
page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.url().slice(0, 120)}`))

/** What the app is showing right now, in the terms the bug is described in. */
function snapshot(target = page) {
  return target.evaluate(() => {
    const text = document.body.innerText
    const profileKey = Object.keys(localStorage).find((k) => k.startsWith('aim-profile-cache:'))
    const sidebar = document.querySelector('aside')
    // Counting only `<a>` reported 3 for a fully populated sidebar and would have called a badly
    // broken one healthy: every collapsible section (Sales, Service, Finance, …) is a `<button>`,
    // and only the open section's leaves are links. Naming the sections that must be present is
    // the assertion that actually means something.
    const expected = ['Sales', 'Service', 'Finance', 'Masters', 'Reports', 'Administration']
    const sidebarText = sidebar?.innerText ?? ''
    return {
      path: location.pathname,
      sidebarSections: sidebar?.querySelectorAll('a, button[aria-expanded]').length ?? 0,
      missingSections: expected.filter((s) => !sidebarText.includes(s)),
      accessDenied: /don't have access|not have access/.test(text),
      wordmark: document.querySelector('aside a, header a')?.textContent?.trim() ?? null,
      profile: profileKey ? JSON.parse(localStorage.getItem(profileKey)) : null,
    }
  })
}

function report(label, state) {
  const ok = !state.accessDenied && state.missingSections.length === 0
  console.log(`\n${label}  ->  ${ok ? 'OK' : 'BROKEN'}`)
  console.log(`  path:           ${state.path}`)
  console.log(
    `  sections:       ${
      state.missingSections.length ? `MISSING ${state.missingSections.join(', ')}` : 'all present'
    }`
  )
  console.log(`  access denied:  ${state.accessDenied}`)
  console.log(`  wordmark:       ${state.wordmark}`)
  if (state.profile) {
    const { companyId, roleId, roleName, status } = state.profile
    console.log(`  profile:        role=${roleName} status=${status}`)
    console.log(`                  companyId=${companyId}`)
    console.log(`                  roleId=${roleId}`)
  } else {
    console.log('  profile:        none cached')
  }
}

console.log(`app:     ${url}`)
console.log(`account: ${account.email}`)

// `domcontentloaded`, never `networkidle` — Firestore holds a Listen stream open for the life of
// the page, so the network never goes idle and any wait for that times out.
await page.goto(`${url}/signup`, { waitUntil: 'domcontentloaded' })
await page.fill('#companyName', account.companyName)
await page.fill('#fullName', account.fullName)
await page.fill('#email', account.email)
await page.fill('#password', account.password)
await page.click('button[type=submit]')

// Generously long: `AuthProvider` retries a missing profile 12 times at 800ms before giving up,
// and this has to observe where the app settles, not somewhere it passes through.
await page.waitForTimeout(20_000)
const afterSignup = await snapshot()
report('AFTER SIGNUP', afterSignup)

await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForTimeout(12_000)
report('AFTER RELOAD (same IndexedDB and localStorage, fresh query caches)', await snapshot())

// A second browser with no IndexedDB, no localStorage and no query cache — the same account
// arriving from another device. This is the path that matters for a multi-tenant product and the
// one the reported failure was described in ("many users try to log in"), and it exercises code
// the signup path never touches: `logIn()`'s status and IP-whitelist checks, and a profile that has
// to be fetched rather than seeded from a cache this browser has never had.
const freshContext = await browser.newContext()
const loginPage = await freshContext.newPage()
await loginPage.goto(`${url}/login`, { waitUntil: 'domcontentloaded' })
await loginPage.fill('#email', account.email)
await loginPage.fill('#password', account.password)
await loginPage.click('button[type=submit]')
await loginPage.waitForTimeout(15_000)
const loginState = await snapshot(loginPage)
report('AFTER LOGIN (clean browser, nothing cached)', loginState)
await loginPage.screenshot({ path: 'e2e-login.png', fullPage: true })

const relevant = logs.filter((l) =>
  /permission|denied|offline|firestore|error|failed|auth/i.test(l)
)
console.log(`\nconsole (${relevant.length} of ${logs.length} messages matched):`)
for (const line of relevant.slice(0, 25)) console.log(`  ${line.slice(0, 300)}`)

if (afterSignup.profile) {
  console.log('\nverify the tenant server-side, signed in as this account:')
  console.log(
    `  node --env-file=.env.local tools/firebase/check-tenant.mjs '${account.email}' ` +
      `'${account.password}' '${afterSignup.profile.companyId}' '${afterSignup.profile.roleId}'`
  )
}

await page.screenshot({ path: 'e2e-signup.png', fullPage: true })
console.log('\nscreenshot: e2e-signup.png')
await browser.close()
