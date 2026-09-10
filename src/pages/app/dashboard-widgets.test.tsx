// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { initTestI18n, renderPage, LEAKED_KEY } from '@/test/render-page'
import { DASHBOARD_WIDGETS } from '@/config/dashboard-widgets'
import { isWidgetVisible } from '@/hooks/use-permissions'
import type { RoleDoc } from '@/types/firestore'

/**
 * Ties the widget catalogue to what the Dashboard actually puts on the screen.
 *
 * Two failures this exists to catch, both of which every static check and every other test in the
 * repo passed straight through:
 *
 *  1. **A widget advertised but never built.** `available: true` was transcribed from the client's
 *     reference screenshots, so the catalogue claimed Job Cards Trend, Jobs by Technician and
 *     Recent Job Cards while the Dashboard rendered none of them. `dashboard-widgets.test.ts`
 *     could not notice: it checks the catalogue against the export, and both agreed. The only
 *     honest check is to render the page and look.
 *  2. **A gate that gates nothing.** `visibleWidgets` was written at signup, editable in Role
 *     Configure, saved to Firestore — and read by no code at all. Every role saw every widget.
 *     Because it is a `Record<string, boolean>`, neither a missing key nor a renamed one is a
 *     type error.
 *
 * `usePermissions` is mocked rather than driven through Firebase so each role shape is exact and
 * the assertions do not depend on a query's retry schedule. Its own decision logic is a pure
 * function, tested at the bottom of this file.
 */

vi.mock('@/lib/firebase', () => ({ app: {}, auth: {}, db: {}, storage: {} }))

vi.mock('firebase/firestore', () => {
  const noop = () => ({})
  return {
    collection: noop,
    doc: noop,
    query: noop,
    where: noop,
    orderBy: noop,
    limit: noop,
    getDocs: async () => ({ docs: [], empty: true }),
    getDoc: async () => ({ exists: () => false, data: () => undefined }),
    onSnapshot: () => () => {},
    writeBatch: () => ({ set: noop, update: noop, delete: noop, commit: async () => {} }),
    serverTimestamp: noop,
    Timestamp: { now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }) },
  }
})

vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  onAuthStateChanged: () => () => {},
}))

/** Which widgets the mocked `usePermissions` reports as visible, swapped per test. */
let visible: (key: string) => boolean = () => true
let permissionsLoading = false

vi.mock('@/hooks/use-permissions', async () => {
  const actual =
    await vi.importActual<typeof import('@/hooks/use-permissions')>('@/hooks/use-permissions')
  return {
    ...actual,
    usePermissions: () => ({
      role: null,
      isLoading: permissionsLoading,
      isOwner: true,
      canView: () => true,
      canDo: () => true,
      canSeeWidget: (key: string) => visible(key),
    }),
  }
})

const ALL_KEYS = DASHBOARD_WIDGETS.map((w) => w.key)
const UNBUILT = DASHBOARD_WIDGETS.filter((w) => !w.available).map((w) => w.key)

async function renderDashboard() {
  const { DashboardPage } = await import('./dashboard-page')
  return renderPage(<DashboardPage />)
}

beforeAll(async () => {
  await initTestI18n('en')
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as never
  // recharts measures its container; jsdom reports 0×0, which makes it render nothing at all.
  // The widget panel around each chart is what carries `data-widget`, so this only matters for
  // keeping the charts from warning.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 })
})

afterEach(() => {
  cleanup()
  visible = () => true
  permissionsLoading = false
})

describe('the Dashboard renders every widget it advertises', () => {
  // Generous timeout: the first render in the file pays for compiling recharts, which both trend
  // charts and the pie pull in. The assertions themselves are instant.
  it('has a data-widget node for every widget in the catalogue', async () => {
    const { container } = await renderDashboard()
    const rendered = new Set(
      [...container.querySelectorAll('[data-widget]')].map((el) => el.getAttribute('data-widget')!)
    )
    // All thirty-four, not just the built ones: a widget the product has not finished still
    // renders, as a "Widget coming soon" card. Anything a role can switch on has to appear, or
    // the Role Configure preview is lying about what the role gets.
    //
    // Asserted, not assumed: a selector that matched nothing would otherwise report "nothing
    // missing" while examining zero nodes.
    expect(rendered.size, 'widgets found on the page').toBe(ALL_KEYS.length)
    const missing = ALL_KEYS.filter((key) => !rendered.has(key))
    expect(
      missing,
      'the Widget Library offers these but the Dashboard renders nothing for them'
    ).toEqual([])
  }, 30_000)

  it('renders an unbuilt widget as a "coming soon" card, not as a real one', async () => {
    // The distinction that matters: it appears, but it does not pretend to have data.
    const { container } = await renderDashboard()
    for (const key of UNBUILT) {
      const node = container.querySelector(`[data-widget="${key}"]`)
      expect(node, key).not.toBeNull()
      expect(node?.textContent, key).toContain('Widget coming soon')
    }
    // And a built one does not carry that text.
    const built = container.querySelector('[data-widget="kpi.revenue"]')
    expect(built?.textContent).not.toContain('Widget coming soon')
  })

  it('emits each widget key exactly once', async () => {
    const { container } = await renderDashboard()
    const rendered = [...container.querySelectorAll('[data-widget]')].map((el) =>
      el.getAttribute('data-widget')
    )
    const seen = new Map<string, number>()
    for (const key of rendered) seen.set(key!, (seen.get(key!) ?? 0) + 1)
    expect([...seen].filter(([, n]) => n > 1)).toEqual([])
  })
})

describe('the Dashboard honours the role config', () => {
  it('drops just the hidden widget', async () => {
    // The Technician case, end to end: `default-roles.ts` hides these two keys.
    const hidden = ['kpi.revenue', 'kpi.outstanding']
    visible = (key) => !hidden.includes(key)
    const { container } = await renderDashboard()
    for (const key of hidden) {
      expect(container.querySelector(`[data-widget="${key}"]`), key).toBeNull()
    }
    // And the neighbours it was not asked to hide are untouched.
    expect(container.querySelector('[data-widget="kpi.jobcards.total"]')).not.toBeNull()
    expect(container.querySelector('[data-widget="list.jobcards.recent"]')).not.toBeNull()
  })

  it('explains itself when a role has every widget switched off', async () => {
    visible = () => false
    const { container } = await renderDashboard()
    expect(container.querySelectorAll('[data-widget]')).toHaveLength(0)
    // Rather than a page that looks broken.
    expect(container.textContent).toContain('No widgets enabled')
  })

  it('waits for the role before showing a number', async () => {
    // Job cards and receipts come from the persistent cache and can resolve before the role
    // document does, so rendering first and hiding after would flash a real Revenue figure at a
    // Technician whose role hides it.
    permissionsLoading = true
    const { container } = await renderDashboard()
    expect(container.querySelectorAll('[data-widget]')).toHaveLength(0)
    expect(container.textContent?.trim()).toBe('')
  })
})

describe.each(['en', 'hi', 'gu'] as const)('the Dashboard leaks no key in %s', (lng) => {
  it('renders every widget without a raw translation key', async () => {
    // `pages-render.test.tsx` covers this for every other page, but it drives the real
    // `usePermissions`, which leaves the Dashboard on its loading skeleton — so the widget copy
    // added here would go unchecked. The three widgets built in this pass are the most label-dense
    // part of the page.
    await initTestI18n(lng)
    const { container } = await renderDashboard()
    expect(container.textContent?.match(LEAKED_KEY)?.[0] ?? null).toBeNull()
    await initTestI18n('en')
  }, 30_000)
})

describe('isWidgetVisible', () => {
  const roleWith = (visibleWidgets: Record<string, boolean>) =>
    ({ dashboardConfig: { defaultLandingRoute: 'dashboard', visibleWidgets } }) as Pick<
      RoleDoc,
      'dashboardConfig'
    >

  it('hides only what is explicitly false', () => {
    const role = roleWith({ 'kpi.revenue': false })
    expect(isWidgetVisible(role, 'kpi.revenue')).toBe(false)
    expect(isWidgetVisible(role, 'kpi.outstanding')).toBe(true)
  })

  it('shows a widget added after the role was written', () => {
    // The reason for `!== false` over `=== true`: a role seeded before a widget existed has no
    // entry for it, and treating that as "hidden" would make every new widget invisible to every
    // existing role until an administrator re-saved each one.
    expect(isWidgetVisible(roleWith({}), 'kpi.revenue')).toBe(true)
  })

  it('shows an unbuilt widget the role switched on', () => {
    // It renders as a placeholder rather than being refused — see `allWidgetsEnabled`.
    expect(isWidgetVisible(roleWith({ 'kpi.parties.total': true }), 'kpi.parties.total')).toBe(true)
    expect(isWidgetVisible(null, 'chart.sales_vs_purchase')).toBe(true)
  })

  it('still hides an unbuilt widget the role switched off', () => {
    expect(
      isWidgetVisible(roleWith({ 'chart.sales_vs_purchase': false }), 'chart.sales_vs_purchase')
    ).toBe(false)
  })

  it('never shows a key that is not in the catalogue at all', () => {
    expect(isWidgetVisible(roleWith({ revenue: true }), 'revenue')).toBe(false)
  })

  it('falls back to the default set when the role has not resolved', () => {
    expect(isWidgetVisible(null, 'kpi.revenue')).toBe(true)
  })
})
