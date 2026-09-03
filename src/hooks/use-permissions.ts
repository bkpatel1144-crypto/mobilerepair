import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { roleDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import type { RoleDoc } from '@/types/firestore'

export function roleQueryKey(companyId: string | undefined, roleId: string | undefined) {
  return ['role', companyId, roleId] as const
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
      return snap.exists() ? (snap.data() as RoleDoc) : null
    },
    enabled: !!companyId && !!roleId,
    staleTime: 5 * 60_000,
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

  return {
    role,
    isLoading,
    isOwner: role?.fullAccess === true,
    canView,
    canDo,
  }
}

/** Standalone invalidation helper so the Configure page doesn't need to reach into
 * `usePermissions()`'s internals to know the query key shape. */
export function useInvalidateRolePermissions() {
  const queryClient = useQueryClient()
  return (companyId: string, roleId: string) =>
    queryClient.invalidateQueries({ queryKey: roleQueryKey(companyId, roleId) })
}
