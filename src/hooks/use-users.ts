import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, query, serverTimestamp, where, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { userDoc, usersCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { createTeammateUser, type CreateTeammateInput } from '@/lib/user-management'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, UserDoc } from '@/types/firestore'

export interface UserWithId extends UserDoc {
  id: string
}

export function usersQueryKey(companyId: string | undefined) {
  return ['users', companyId] as const
}

export function useUsers() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<(UserDoc & { id: string })[]>(
    usersQueryKey(companyId),
    // Company-scoped filter — required by firestore.rules' `list` rule on `users/{uid}` (see
    // its comment there), not just a client-side nicety: an unscoped listen is rejected outright.
    companyId
      ? query(collection(db, usersCollection()), where('companyId', '==', companyId))
      : null,
    (docs) => {
      const rows = docs as (UserDoc & { id: string })[]
      return ((rows) => rows)(rows)
    },
    !!companyId
  )
}

export function useCreateTeammate() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Omit<CreateTeammateInput, 'companyId' | 'performedBy'>) =>
      createTeammateUser({ ...input, companyId, performedBy: auditContextFrom(user!, profile!) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey(companyId) }),
  })
}

/** Disable/re-enable a teammate — the UI hides this for `protected` users (the signing-up Owner)
 * and for the viewer's own row, so nobody can lock themselves or the account's own Owner out;
 * `firestore.rules`' own `users/{uid}` update rule doesn't separately special-case `protected`
 * the way Roles/Branches do, so this client-side guard is the actual boundary here. Phase 8's own
 * point: a `disabled` account is rejected at the next `logIn()` attempt (see `src/lib/auth.ts`),
 * whether or not that user is still mid-session elsewhere. */
export function useSetUserStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { uid: string; status: EntityStatus; userName: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, userDoc(input.uid)), {
        status: input.status,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Enable User' : 'Disable User',
        module: 'administration',
        entityType: 'User',
        entityId: input.uid,
        entityLabel: input.userName,
        critical: true, // changes whether an account can sign in at all
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey(companyId) }),
  })
}

/**
 * Changes a teammate's name, mobile or role.
 *
 * There was no way to do this at all: User Management could create a user and disable one, and
 * nothing in between. Promoting a technician to manager meant disabling their account and
 * making a second one, which leaves the shop with two rows for one person and a job history
 * attached to the dead one.
 *
 * Email is deliberately not editable. It is the Firebase Auth identity, and changing it here
 * would change the Firestore row while leaving the sign-in untouched — a user who looks renamed
 * and still logs in as the old address. That needs an Auth-side flow, which this app (client SDK
 * only, no server) cannot do safely.
 */
export function useUpdateUser() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    networkMode: 'always',
    mutationFn: async (input: {
      uid: string
      fullName: string
      mobile: string | null
      roleId: string
      roleName: string
      /** The role before this edit, so the audit entry says what actually changed. */
      previousRoleName: string
    }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, userDoc(input.uid)), {
        fullName: input.fullName,
        mobile: input.mobile,
        roleId: input.roleId,
        roleName: input.roleName,
        updatedAt: serverTimestamp(),
      })
      const roleChanged = input.roleName !== input.previousRoleName
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update User',
        module: 'administration',
        entityType: 'User',
        entityId: input.uid,
        entityLabel: input.fullName,
        // A role change is what someone can do *after* it that matters, so it is logged as
        // critical and says which way it went.
        critical: roleChanged,
        details: roleChanged ? { role: `${input.previousRoleName} → ${input.roleName}` } : {},
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey(companyId) }),
  })
}
