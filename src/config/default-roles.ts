import { NAV_SECTIONS, DASHBOARD_MENU_KEY, menuKey } from '@/config/nav'
import { CRUD_OPS, PERMISSION_SCHEMA, crudKey, specialActionKey } from '@/config/permission-schema'
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

/** Grants every leaf under the given sections (locked leaves excluded — they're globally
 * unavailable pending their feature phase, not something a role can unlock). */
function menusForSections(sectionKeys: string[]): MenuPermissions {
  const perms: MenuPermissions = { [DASHBOARD_MENU_KEY]: true }
  for (const section of NAV_SECTIONS) {
    if (!sectionKeys.includes(section.key)) continue
    for (const leaf of section.children) {
      if (leaf.locked) continue
      perms[menuKey(section.key, leaf.slug)] = true
    }
  }
  return perms
}

type AccessTier = 'full' | 'createViewUpdate' | 'viewOnly'

/** Grants every `actionPermissions` key a module contributes, at the given tier: `full` = every
 * CRUD op + every special action; `createViewUpdate` = create/view/update only, no delete, no
 * special actions (a role that can work jobs but shouldn't delete records or touch the
 * sensitive special actions); `viewOnly` = the `view` CRUD op only. */
function grantModuleAccess(sectionKey: string, tier: AccessTier): ActionPermissions {
  const schema = PERMISSION_SCHEMA.find((m) => m.sectionKey === sectionKey)
  if (!schema) return {}

  const perms: ActionPermissions = {}
  const crudOpsForTier: readonly (typeof CRUD_OPS)[number][] =
    tier === 'full'
      ? CRUD_OPS
      : tier === 'createViewUpdate'
        ? ['create', 'view', 'update']
        : ['view']

  for (const entity of schema.entities) {
    for (const op of crudOpsForTier) {
      perms[crudKey(sectionKey, entity.key, op)] = true
    }
  }
  if (tier === 'full') {
    for (const action of schema.specialActions) {
      perms[specialActionKey(sectionKey, action.key)] = true
    }
  }
  return perms
}

function grantModules(grants: Partial<Record<string, AccessTier>>): ActionPermissions {
  return Object.assign(
    {},
    ...Object.entries(grants).map(([section, tier]) => grantModuleAccess(section, tier!))
  )
}

export const DEFAULT_ROLE_SEEDS: DefaultRoleSeed[] = [
  {
    name: 'Owner',
    code: 'OWNER',
    type: 'owner',
    protected: true,
    fullAccess: true,
    // Stored for clarity even though `fullAccess` already grants everything — matches the
    // reference app's Owner role, which shows every menu/permission checked.
    menuPermissions: menusForSections(NAV_SECTIONS.map((s) => s.key)),
    actionPermissions: grantModules(
      Object.fromEntries(PERMISSION_SCHEMA.map((m) => [m.sectionKey, 'full']))
    ),
    dashboardConfig: defaultDashboardConfig(),
  },
  {
    name: 'Manager',
    code: 'MANAGER',
    type: 'custom',
    protected: false,
    fullAccess: false,
    menuPermissions: menusForSections([
      'sales',
      'service',
      'finance',
      'masters',
      'second-hand-device',
      'reports',
    ]),
    actionPermissions: grantModules({
      sales: 'full',
      service: 'full',
      finance: 'full',
      masters: 'full',
      'second-hand-device': 'full',
      reports: 'viewOnly',
    }),
    dashboardConfig: defaultDashboardConfig(),
  },
  {
    name: 'Salesman',
    code: 'SALESMAN',
    type: 'custom',
    protected: false,
    fullAccess: false,
    menuPermissions: menusForSections(['sales', 'service', 'masters', 'second-hand-device']),
    actionPermissions: grantModules({
      sales: 'full',
      service: 'createViewUpdate',
      finance: 'viewOnly',
      masters: 'createViewUpdate',
      'second-hand-device': 'full',
    }),
    dashboardConfig: defaultDashboardConfig(),
  },
  {
    name: 'Technician',
    code: 'TECHNICIAN',
    type: 'custom',
    protected: false,
    fullAccess: false,
    menuPermissions: menusForSections(['service']),
    actionPermissions: grantModules({ service: 'createViewUpdate' }),
    // Technicians don't handle money — hide the financial stat tiles on their dashboard.
    dashboardConfig: defaultDashboardConfig(['revenue', 'outstanding']),
  },
  {
    name: 'Accountant',
    code: 'ACCOUNTANT',
    type: 'custom',
    protected: false,
    fullAccess: false,
    menuPermissions: menusForSections(['sales', 'service', 'finance', 'masters', 'reports']),
    actionPermissions: grantModules({
      finance: 'full',
      reports: 'viewOnly',
      masters: 'viewOnly',
      sales: 'viewOnly',
      service: 'viewOnly',
    }),
    dashboardConfig: defaultDashboardConfig(),
  },
]
