import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { rolesCollection, roleDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { roleQueryKey } from '@/hooks/use-permissions'
import { allWidgetsEnabled } from '@/config/dashboard-widgets'
import { DASHBOARD_MENU_KEY } from '@/config/nav'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { RoleDoc } from '@/types/firestore'

export interface RoleWithId extends RoleDoc {
  id: string
}

export function rolesQueryKey(companyId: string | undefined) {
  return ['roles', companyId] as const
}

export function useRoles() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: rolesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, rolesCollection(companyId!)))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RoleDoc) }) as RoleWithId)
    },
    enabled: !!companyId,
  })
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
