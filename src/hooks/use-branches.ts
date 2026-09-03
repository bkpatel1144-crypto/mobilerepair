import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { branchesCollection, branchDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { slugifyCode } from '@/lib/utils'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { BranchDoc, EntityStatus } from '@/types/firestore'

export interface BranchWithId extends BranchDoc {
  id: string
}

export function branchesQueryKey(companyId: string | undefined) {
  return ['branches', companyId] as const
}

/** Whole-collection fetch, sorted client-side by name — not a server-side `orderBy('createdAt')`,
 * same reasoning as every other list hook in this app (a pending `serverTimestamp()` would
 * otherwise make a freshly-created branch briefly invisible in its own list). */
export function useBranches() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: branchesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, branchesCollection(companyId!)))
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as BranchDoc) }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    enabled: !!companyId,
  })
}

/** `preview (15)` — Name only; the code auto-generates from it (`slugifyCode`), matching the
 * modal's own observed helper text ("A unique branch code will be auto-generated from the
 * name."). Every branch created through this UI is `type: 'custom'`, never `'system'` — that
 * type is reserved for the one seeded "Main Branch". */
export function useCreateBranch() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const ref = doc(collection(db, branchesCollection(companyId)))
      const now = serverTimestamp()
      const data: BranchDoc = {
        name: input.name,
        code: slugifyCode(input.name, 10),
        type: 'custom',
        protected: false,
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'settings',
        entityType: 'Branch',
        entityId: ref.id,
        entityLabel: data.name,
        critical: true,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchesQueryKey(companyId) }),
  })
}

export function useUpdateBranch() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, branchDoc(companyId, input.id)), { name: input.name, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'settings',
        entityType: 'Branch',
        entityId: input.id,
        entityLabel: input.name,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchesQueryKey(companyId) }),
  })
}

export function useSetBranchStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: EntityStatus; branchName: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, branchDoc(companyId, input.id)), { status: input.status, updatedAt: serverTimestamp() })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Activate' : 'Deactivate',
        module: 'settings',
        entityType: 'Branch',
        entityId: input.id,
        entityLabel: input.branchName,
        critical: true,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchesQueryKey(companyId) }),
  })
}

/** Only a non-`protected` branch may ever reach this — the UI hides Delete for the seeded "Main
 * Branch", and `firestore.rules` backs that up server-side (`resource.data.protected != true`). */
export function useDeleteBranch() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (branch: BranchWithId) => {
      const batch = writeBatch(db)
      batch.delete(doc(db, branchDoc(companyId, branch.id)))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Delete',
        module: 'settings',
        entityType: 'Branch',
        entityId: branch.id,
        entityLabel: branch.name,
        critical: true,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: branchesQueryKey(companyId) }),
  })
}
