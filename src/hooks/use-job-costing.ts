import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, getDocs, collection, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { jobCostingCollection, jobCostingDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { JobCostingDoc } from '@/types/firestore'

export interface JobCostingWithId extends JobCostingDoc {
  id: string
}

export function jobCostingListQueryKey(companyId: string | undefined) {
  return ['jobCostingList', companyId] as const
}
export function jobCostingQueryKey(companyId: string | undefined, jobId: string | undefined) {
  return ['jobCosting', companyId, jobId] as const
}

/** Every recorded costing doc — the Job Costing list page cross-references this against
 * `useJobCards()`'s Closed jobs to know which are "Pending"/"Done" (a Closed job with no
 * matching doc here is Pending). */
export function useJobCostingList() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: jobCostingListQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, jobCostingCollection(companyId!)))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as JobCostingDoc) }))
    },
    enabled: !!companyId,
  })
}

export function useJobCosting(jobId: string | undefined) {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: jobCostingQueryKey(companyId, jobId),
    queryFn: async () => {
      const snap = await getDoc(doc(db, jobCostingDoc(companyId!, jobId!)))
      return snap.exists() ? (snap.data() as JobCostingDoc) : null
    },
    enabled: !!companyId && !!jobId,
  })
}

export function useSaveJobCosting() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<JobCostingDoc, 'createdById' | 'createdByName' | 'createdAt' | 'updatedAt'>) => {
      const now = serverTimestamp()
      const data: JobCostingDoc = {
        ...input,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(doc(db, jobCostingDoc(companyId, input.jobId)), data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Record Costing',
        module: 'service',
        entityType: 'Job Costing',
        entityId: input.jobId,
        entityLabel: input.jobNumber,
        critical: true, // matches BUILD_PLAN.md's own critical-action list ("Job Costing Create")
        details: { totalCost: input.totalCost, billAmount: input.billAmount, profit: input.profit },
      })
      await batch.commit()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: jobCostingListQueryKey(companyId) })
      queryClient.invalidateQueries({ queryKey: jobCostingQueryKey(companyId, variables.jobId) })
    },
  })
}
