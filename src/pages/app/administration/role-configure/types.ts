import type { RoleDashboardConfig } from '@/types/firestore'

/** The in-progress edit state for a role's Configure page — kept entirely client-side until
 * "Save" commits it via `useUpdateRole`. Both tabs (Menus & Permissions, Dashboard & Landing)
 * read/write the same draft so the footer's counts and Save/Cancel apply to whichever tab is
 * active, matching the reference app's single persistent footer bar. */
export interface RoleDraft {
  fullAccess: boolean
  menuPermissions: Record<string, boolean>
  actionPermissions: Record<string, boolean>
  dashboardConfig: RoleDashboardConfig
}
