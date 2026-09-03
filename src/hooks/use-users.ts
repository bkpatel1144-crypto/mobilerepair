import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, query, where, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { usersCollection, userDoc } from '@/lib/firestore-paths'
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

  return useQuery({
    queryKey: usersQueryKey(companyId),
    queryFn: async () => {
      // Company-scoped filter — required by firestore.rules' `list` rule (see firestore.rules'
      // comment on `users/{uid}`), not just a client-side nicety.
      const q = query(collection(db, usersCollection()), where('companyId', '==', companyId))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) }) as UserWithId)
    },
    enabled: !!companyId,
  })
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
      batch.update(doc(db, userDoc(input.uid)), { status: input.status, updatedAt: serverTimestamp() })
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
