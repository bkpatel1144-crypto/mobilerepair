import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { roleDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { DASHBOARD_WIDGETS } from '@/config/dashboard-widgets'
import type { RoleDoc } from '@/types/firestore'

/** Widgets the product has actually implemented, by key — a widget the reference lists but this
 *  app does not render can never be shown, whatever a role document says. */
const AVAILABLE_WIDGETS = new Set(DASHBOARD_WIDGETS.filter((w) => w.available).map((w) => w.key))

/**
 * Is one dashboard widget shown for a role?
 *
 * Deliberately unlike `canView`/`canDo` in two ways:
 *
 *  - `fullAccess` does *not* bypass it. Widget visibility is a layout preference, not a
 *    privilege, so an Owner who switches Revenue off on the Dashboard & Landing tab has to see it
 *    stay off — that tab is the whole reason the flag exists.
 *  - Absent means visible (`!== false`), not hidden. A role document is written once at signup
 *    with the widgets that existed *then*; keying off `=== true` would make every widget added
 *    later invisible to every existing role until someone re-saved each one by hand.
 *
 * Hiding is therefore always explicit, which is exactly how `default-roles.ts` writes it. A role
 * that has not loaded yet shows the default set rather than an empty dashboard — the Dashboard
 * holds itself behind a skeleton while `isLoading`, so that fallback only applies to a tenant
 * whose role document is genuinely missing.
 *
 * Exported as a plain function so it can be tested without a rendered hook.
 */
export function isWidgetVisible(
  role: Pick<RoleDoc, 'dashboardConfig'> | null,
  key: string
): boolean {
  if (!AVAILABLE_WIDGETS.has(key)) return false
  if (!role) return true
  return role.dashboardConfig?.visibleWidgets?.[key] !== false
}

export function roleQueryKey(companyId: string | undefined, roleId: string | undefined) {
  return ['role', companyId, roleId] as const
}

/** Thrown when the profile's `roleId` points at a role document that isn't there — see the
 *  queryFn below for why that has to be retried rather than reported as "no access". */
class RoleDocMissingError extends Error {
  constructor() {
    super('Role document not found')
    this.name = 'RoleDocMissingError'
  }
}

/**
 * The one place every route guard, sidebar item, and action button in the app checks
 * permissions through — per BUILD_PLAN.md Phase 3, nothing else should hardcode
 * `if (role === 'owner')` anywhere. Backed by TanStack Query with a long `staleTime` (role
 * definitions change rarely); the Role Configure page invalidates `roleQueryKey(...)` after a
 * successful save so changes take effect without a re-login.
 */
export function usePermissions() {
  const { profile, loading: authLoading, profileLoading } = useAuth()
  const companyId = profile?.companyId
  const roleId = profile?.roleId

  const query = useQuery({
    queryKey: roleQueryKey(companyId, roleId),
    queryFn: async () => {
      const snap = await getDoc(doc(db, roleDoc(companyId!, roleId!)))
      // Absent is a *retryable* condition, not an answer. A profile naming a role document that
      // isn't there is never a legitimate "this user lacks access" — the two are written in the
      // same batch, so it means the tenant is incomplete or this read simply lost a race with a
      // write that is still propagating. Returning null here instead reported it as a definitive
      // denial, and every route then rendered "You don't have access to this page" with an empty
      // sidebar — to the shop's own Owner, whose role grants `fullAccess`. Throwing keeps the
      // query pending through the retries below, so that window shows a loading state, and if the
      // document really never appears `AuthProvider` clears the cached profile and
      // `ProtectedRoute` routes to /complete-setup, which is where a tenant this broken belongs.
      if (!snap.exists()) throw new RoleDocMissingError()
      return snap.data() as RoleDoc
    },
    enabled: !!companyId && !!roleId,
    staleTime: 5 * 60_000,
    retry: (failureCount, error) => {
      // Longer than the default for a missing document, since that's the case worth waiting out.
      if (error instanceof RoleDocMissingError) return failureCount < 5
      // A `permission-denied` is a real answer from the backend — retrying only delays showing
      // the user something. Everything else (offline, a dropped stream) keeps the library's own
      // default budget; this callback replaces it wholesale, so not restating it here would have
      // quietly turned one transient network blip into a locked-out session.
      if ((error as { code?: string }).code === 'permission-denied') return false
      return failureCount < 3
    },
    retryDelay: 800,
  })

  const role = query.data ?? null

  // A *disabled* query's own `isLoading` is `false` in TanStack Query v5 — it only reflects an
  // active fetch, not "hasn't started yet because its inputs aren't ready." Since this query
  // stays disabled until `profile` resolves, checking `query.isLoading` alone reports "done"
  // during the auth/profile-resolution gap and would prematurely read as "confirmed no access"
  // before the role ever had a chance to load. Verified live: without this, a hard reload could
  // briefly (and, in one race, not-so-briefly — see auth-provider.tsx) show "Access Denied" for
  // a real Owner account.
  const isLoading = authLoading || profileLoading || query.isLoading

  /** Is this menu leaf (or "dashboard") visible to the current role? */
  function canView(key: string): boolean {
    if (!role) return false
    if (role.fullAccess) return true
    return role.menuPermissions[key] === true
  }

  /** Can the current role perform this action? `key` is a full `actionPermissions` key —
   * see `src/config/permission-schema.ts`'s `crudKey()`/`specialActionKey()`. */
  function canDo(key: string): boolean {
    if (!role) return false
    if (role.fullAccess) return true
    return role.actionPermissions[key] === true
  }

  /** Is this dashboard widget shown for the current role? See `isWidgetVisible`. */
  function canSeeWidget(key: string): boolean {
    return isWidgetVisible(role, key)
  }

  return {
    role,
    isLoading,
    isOwner: role?.fullAccess === true,
    canView,
    canDo,
    canSeeWidget,
  }
}

/** Standalone invalidation helper so the Configure page doesn't need to reach into
 * `usePermissions()`'s internals to know the query key shape. */
export function useInvalidateRolePermissions() {
  const queryClient = useQueryClient()
  return (companyId: string, roleId: string) =>
    queryClient.invalidateQueries({ queryKey: roleQueryKey(companyId, roleId) })
}
