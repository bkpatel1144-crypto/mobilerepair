import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { rolesCollection, roleDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { roleQueryKey } from '@/hooks/use-permissions'
import { allWidgetsEnabled } from '@/config/dashboard-widgets'
import { DASHBOARD_MENU_KEY } from '@/config/nav'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { RoleDoc , EntityStatus} from '@/types/firestore'

export interface RoleWithId extends RoleDoc {
  id: string
}

export function rolesQueryKey(companyId: string | undefined) {
  return ['roles', companyId] as const
}

export function useRoles() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<(RoleDoc & { id: string })[]>(
    rolesQueryKey(companyId),
    companyId ? collection(db, rolesCollection(companyId)) : null,
    (docs) => {
      const rows = docs as (RoleDoc & { id: string })[]
      return ((rows) => rows)(rows)
    },
    !!companyId
  )
}

export function useRole(roleId: string | undefined) {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: roleQueryKey(companyId, roleId),
    queryFn: async () => {
      const snap = await getDoc(doc(db, roleDoc(companyId!, roleId!)))
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as RoleDoc) } as RoleWithId) : null
    },
    enabled: !!companyId && !!roleId,
  })
}

export function useCreateRole() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string; code: string }) => {
      const ref = doc(collection(db, rolesCollection(companyId)))
      const now = serverTimestamp()
      // New roles start locked down — no menus, no actions — until an Owner/Administrator
      // explicitly grants access via Configure. Safer default than starting wide open.
      const data: RoleDoc = {
        name: input.name,
        code: input.code,
        type: 'custom',
        protected: false,
        status: 'active',
        fullAccess: false,
        menuPermissions: { [DASHBOARD_MENU_KEY]: true },
        actionPermissions: {},
        dashboardConfig: {
          defaultLandingRoute: DASHBOARD_MENU_KEY,
          visibleWidgets: allWidgetsEnabled(),
        },
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'administration',
        entityType: 'Role',
        entityId: ref.id,
        entityLabel: input.name,
        critical: true, // a new role changes who can access what — same bar as a User write
      })
      await batch.commit()
      return ref.id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesQueryKey(companyId) }),
  })
}

export interface UpdateRoleInput {
  roleId: string
  /** For the audit-log entry's own label — falls back to the raw id if the caller doesn't have
   * it handy, but every real call site does (it's already loaded the role to edit its config). */
  roleName?: string
  fullAccess: boolean
  menuPermissions: Record<string, boolean>
  actionPermissions: Record<string, boolean>
  dashboardConfig: RoleDoc['dashboardConfig']
}

export function useUpdateRole() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateRoleInput) => {
      const batch = writeBatch(db)
      batch.update(doc(db, roleDoc(companyId, input.roleId)), {
        fullAccess: input.fullAccess,
        menuPermissions: input.menuPermissions,
        actionPermissions: input.actionPermissions,
        dashboardConfig: input.dashboardConfig,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'administration',
        entityType: 'Role',
        entityId: input.roleId,
        entityLabel: input.roleName ?? input.roleId,
        critical: true,
      })
      await batch.commit()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey(companyId) })
      queryClient.invalidateQueries({ queryKey: roleQueryKey(companyId, variables.roleId) })
    },
  })
}

/**
 * Renames a role, or corrects its code.
 *
 * Separate from `useUpdateRole`, which writes the permission matrix. Splitting them keeps the
 * Edit dialog from having to send a whole permission set it never touched — a rename that
 * round-trips the matrix would overwrite a change someone else made in Configure in between.
 */
export function useRenameRole() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { roleId: string; name: string; code: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, roleDoc(companyId, input.roleId)), {
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Rename',
        module: 'administration',
        entityType: 'Role',
        entityId: input.roleId,
        entityLabel: input.name.trim(),
        critical: true, // anything touching who-can-do-what
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesQueryKey(companyId) }),
  })
}

/**
 * Disables or re-enables a role.
 *
 * A disabled role keeps its permissions and its users — it simply stops granting anything. That
 * is why this is a status change and not a delete: re-enabling has to restore exactly what was
 * there, and a deleted-then-recreated role would come back with an empty matrix and silently
 * lock out everyone who held it.
 */
export function useSetRoleStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { role: RoleWithId; status: EntityStatus }) => {
      if (input.role.protected) {
        throw new Error('The Owner role is protected and cannot be disabled or deleted.')
      }
      const batch = writeBatch(db)
      batch.update(doc(db, roleDoc(companyId, input.role.id)), {
        status: input.status,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Enable' : input.status === 'deleted' ? 'Delete' : 'Disable',
        module: 'administration',
        entityType: 'Role',
        entityId: input.role.id,
        entityLabel: input.role.name,
        critical: true,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesQueryKey(companyId) }),
  })
}
