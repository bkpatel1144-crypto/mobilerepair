import { describe, expect, it } from 'vitest'
import { DEFAULT_ROLE_SEEDS } from './default-roles'
import { DASHBOARD_WIDGETS, allWidgetsEnabled } from './dashboard-widgets'
import { NAV_SECTIONS, DASHBOARD_MENU_KEY, menuKey } from './nav'
import { ALL_PERMISSION_KEYS } from './permission-catalogue'
import { DEFAULT_ROLE_GRANTS } from './default-role-grants'
import permissionExport from '../../data/permotion-sample.json'

/**
 * Holds the five seeded roles to the catalogues they key into.
 *
 * The test that matters most here is the widget one. `visibleWidgets` is a
 * `Record<string, boolean>`, so a key that no longer exists is not a type error, not a lint
 * warning and not a runtime failure — it simply stops hiding what it was written to hide. The
 * Technician role said `['revenue', 'outstanding']` after the catalogue had renamed those to
 * `kpi.revenue` / `kpi.outstanding`, which meant technicians would have seen the shop's revenue
 * and outstanding balance. Nothing anywhere would have reported that.
 *
 * `menuPermissions` and `actionPermissions` are keyed the same way and carry the same risk, so
 * they get the same treatment.
 */

const widgetKeys = new Set(DASHBOARD_WIDGETS.map((w) => w.key))
const menuKeys = new Set([
  DASHBOARD_MENU_KEY,
  ...NAV_SECTIONS.flatMap((s) => s.children.map((leaf) => menuKey(s.key, leaf.slug))),
])
const actionKeys = new Set(ALL_PERMISSION_KEYS)

describe('seeded roles key into the real catalogues', () => {
  it.each(DEFAULT_ROLE_SEEDS.map((r) => [r.code, r] as const))(
    '%s references only widget keys that exist',
    (_code, role) => {
      const unknown = Object.keys(role.dashboardConfig.visibleWidgets).filter(
        (k) => !widgetKeys.has(k)
      )
      expect(unknown, 'renamed or deleted widget key — this hide silently does nothing').toEqual([])
    }
  )

  it.each(DEFAULT_ROLE_SEEDS.map((r) => [r.code, r] as const))(
    '%s references only menu keys that exist',
    (_code, role) => {
      const unknown = Object.keys(role.menuPermissions).filter((k) => !menuKeys.has(k))
      expect(unknown).toEqual([])
    }
  )

  it.each(DEFAULT_ROLE_SEEDS.map((r) => [r.code, r] as const))(
    '%s references only action keys that exist',
    (_code, role) => {
      const unknown = Object.keys(role.actionPermissions).filter((k) => !actionKeys.has(k))
      expect(unknown).toEqual([])
    }
  )

  it('hides revenue and outstanding from technicians, and only from them', () => {
    // Stated as an outcome, not as a key list, so it keeps checking the *intent* ("technicians
    // don't handle money") through any future rename of the keys themselves.
    const hiddenFor = (code: string) => {
      const role = DEFAULT_ROLE_SEEDS.find((r) => r.code === code)!
      return Object.entries(role.dashboardConfig.visibleWidgets)
        .filter(([, visible]) => visible === false)
        .map(([key]) => key)
        .sort()
    }
    expect(hiddenFor('TECHNICIAN')).toEqual(['kpi.outstanding', 'kpi.revenue'])
    for (const code of ['OWNER', 'MANAGER', 'SALESMAN', 'ACCOUNTANT']) {
      expect(hiddenFor(code), `${code} should hide nothing`).toEqual([])
    }
  })

  it('starts every role from the full set of built widgets', () => {
    const built = Object.keys(allWidgetsEnabled()).sort()
    for (const role of DEFAULT_ROLE_SEEDS) {
      expect(Object.keys(role.dashboardConfig.visibleWidgets).sort(), role.code).toEqual(built)
    }
  })

  it.each([
    ['OWNER', 185],
    ['MANAGER', 104],
    ['SALESMAN', 39],
    ['TECHNICIAN', 13],
    ['ACCOUNTANT', 46],
  ] as const)('%s is granted the %i permissions its export lists', (code, count) => {
    // "Same as the reference" as a test rather than a claim. Manager is 104 of its export's 108:
    // the other four are `MASTERS_ATTRIBUTES_*`, for a master this app has no screen for, and the
    // generator prints them each run rather than quietly dropping them.
    const role = DEFAULT_ROLE_SEEDS.find((r) => r.code === code)!
    const granted = Object.entries(role.actionPermissions)
      .filter(([, on]) => on)
      .map(([key]) => key)
    expect(granted).toHaveLength(count)
    expect(granted.sort()).toEqual([...DEFAULT_ROLE_GRANTS[code].permissions].sort())
  })

  it("OWNER's grant is the export's own list, key for key", () => {
    const owner = DEFAULT_ROLE_SEEDS.find((r) => r.code === 'OWNER')!
    expect(Object.keys(owner.actionPermissions).sort()).toEqual(
      [...permissionExport.permissions].sort()
    )
  })

  it.each([
    ['OWNER', 44],
    ['MANAGER', 28],
    ['SALESMAN', 6],
    ['TECHNICIAN', 1],
    ['ACCOUNTANT', 15],
  ] as const)('%s sees the %i menus its export assigns, plus the dashboard', (code, count) => {
    const role = DEFAULT_ROLE_SEEDS.find((r) => r.code === code)!
    const menus = Object.keys(role.menuPermissions).filter((k) => k !== DASHBOARD_MENU_KEY)
    expect(menus).toHaveLength(count)
    expect(role.menuPermissions[DASHBOARD_MENU_KEY]).toBe(true)
  })

  it('lands every role on the dashboard', () => {
    for (const role of DEFAULT_ROLE_SEEDS) {
      expect(role.dashboardConfig.defaultLandingRoute, role.code).toBe(DASHBOARD_MENU_KEY)
    }
  })
})
