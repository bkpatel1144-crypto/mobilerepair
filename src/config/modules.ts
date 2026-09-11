import { NAV_SECTIONS } from '@/config/nav'

/**
 * Which ERP modules a company has switched on — Settings > Company > Preferences.
 *
 * Pure, and deliberately separate from `use-company-preferences.ts`: `usePermissions()` reads
 * this on every render of every page, and must not pull `firebase/storage` (the logo upload)
 * into the entry chunk to do it.
 */

/**
 * The two modules a company cannot switch off.
 *
 * A company that could switch off Settings could never switch anything back on, and one
 * without Administration could not grant the permission needed to fix it either. The
 * reference's own screen shows both greyed out for the same reason.
 */
export const LOCKED_MODULES = ['administration', 'settings']

export const TOGGLEABLE_MODULES = NAV_SECTIONS.map((s) => s.key).filter(
  (key) => !LOCKED_MODULES.includes(key)
)

/**
 * Is this module on for this company?
 *
 * Absent means all of them. A company created before this setting existed must not silently
 * lose its menus, and "no list stored" is the only honest reading of a field never written.
 * The same reasoning covers the moment before the company document has loaded: showing a menu
 * that then disappears is better than denying access to one the company actually has.
 */
export function moduleEnabled(enabledModules: string[] | undefined, key: string): boolean {
  if (LOCKED_MODULES.includes(key)) return true
  if (!enabledModules) return true
  return enabledModules.includes(key)
}

/** The module a menu key belongs to — `service/job-cards` → `service`, `dashboard` → null.
 *  The dashboard belongs to no module and is never hidden by this setting. */
export function moduleOfMenuKey(menuKey: string): string | null {
  const slash = menuKey.indexOf('/')
  return slash === -1 ? null : menuKey.slice(0, slash)
}
