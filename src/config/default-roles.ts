import { DASHBOARD_MENU_KEY } from '@/config/nav'
import { DEFAULT_ROLE_GRANTS } from '@/config/default-role-grants'
import { allWidgetsEnabled } from '@/config/dashboard-widgets'
import type {
  ActionPermissions,
  MenuPermissions,
  RoleCode,
  RoleDashboardConfig,
  RoleType,
} from '@/types/firestore'

/**
 * Starter permission sets seeded for every new company at signup. Phase 3 builds the full
 * Role Management + Configure UI on top of these same `menuPermissions`/`actionPermissions`
 * shapes — this file only decides sensible *defaults*, not the enforcement engine itself.
 *
 * `menuPermissions` is keyed per leaf (`"sales/invoices"`, plus the literal `"dashboard"`) —
 * see `src/config/nav.ts`'s `menuKey()`. A section with no visible leaves simply doesn't show
 * up in the sidebar; there's no separate standalone "module visible" flag to keep in sync.
 */

export interface DefaultRoleSeed {
  name: string
  code: RoleCode
  type: RoleType
  protected: boolean
  fullAccess: boolean
  menuPermissions: MenuPermissions
  actionPermissions: ActionPermissions
  dashboardConfig: RoleDashboardConfig
}

function defaultDashboardConfig(hiddenWidgetKeys: string[] = []): RoleDashboardConfig {
  const visibleWidgets = allWidgetsEnabled()
  for (const key of hiddenWidgetKeys) visibleWidgets[key] = false
  return { defaultLandingRoute: DASHBOARD_MENU_KEY, visibleWidgets }
}

/**
 * One seeded role's menus and permissions, read from the client's export for that role.
 *
 * This replaced a tier model — "full", "createViewUpdate", "viewOnly" applied per module — which
 * was a reasonable guess and nothing more. The exports say a Salesman holds 39 permissions across
 * 10 menus and a Technician 13 across 2, and no tier rule produces those numbers.
 * `default-role-grants.ts` is generated from the five files; see `build-role-seeds.cjs`.
 */
function grantsFor(code: RoleCode): {
  menuPermissions: MenuPermissions
  actionPermissions: ActionPermissions
} {
  const grant = DEFAULT_ROLE_GRANTS[code]
  if (!grant) throw new Error(`no reference grant for ${code}`)
  return {
    // The Dashboard is not one of the reference's menus — it is where every role lands — so it is
    // added here rather than being absent from all five.
    menuPermissions: {
      [DASHBOARD_MENU_KEY]: true,
      ...Object.fromEntries(grant.menus.map((key) => [key, true])),
    },
    actionPermissions: Object.fromEntries(grant.permissions.map((key) => [key, true])),
  }
}

export const DEFAULT_ROLE_SEEDS: DefaultRoleSeed[] = [
  {
    name: 'Owner',
    code: 'OWNER',
    type: 'owner',
    protected: true,
    fullAccess: true,
    ...grantsFor('OWNER'),
    dashboardConfig: defaultDashboardConfig(),
  },
  {
    name: 'Manager',
    code: 'MANAGER',
    type: 'custom',
    protected: false,
    fullAccess: false,
    ...grantsFor('MANAGER'),
    dashboardConfig: defaultDashboardConfig(),
  },
  {
    name: 'Salesman',
    code: 'SALESMAN',
    type: 'custom',
    protected: false,
    fullAccess: false,
    ...grantsFor('SALESMAN'),
    dashboardConfig: defaultDashboardConfig(),
  },
  {
    name: 'Technician',
    code: 'TECHNICIAN',
    type: 'custom',
    protected: false,
    fullAccess: false,
    ...grantsFor('TECHNICIAN'),
    // Technicians don't handle money — hide the financial stat tiles on their dashboard.
    // These are `DASHBOARD_WIDGETS` keys, asserted in `default-roles.test.ts`: they were
    // `['revenue', 'outstanding']` against a catalogue that had renamed them to `kpi.*`, and
    // since `visibleWidgets` is a `Record<string, boolean>` the stale keys were a silent no-op
    // rather than a type error.
    dashboardConfig: defaultDashboardConfig(['kpi.revenue', 'kpi.outstanding']),
  },
  {
    name: 'Accountant',
    code: 'ACCOUNTANT',
    type: 'custom',
    protected: false,
    fullAccess: false,
    ...grantsFor('ACCOUNTANT'),
    dashboardConfig: defaultDashboardConfig(),
  },
]
