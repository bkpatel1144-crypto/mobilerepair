import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { jobCostingCollection, jobCostingDoc, purchaseDoc } from '@/lib/firestore-paths'
import { getNextSequence, formatJobPurchaseId } from '@/lib/sequences'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { purchasesQueryKey, type PurchaseDoc, type PurchaseEdit } from '@/hooks/use-purchases'
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

  return useLiveQuery<(JobCostingDoc & { id: string })[]>(
    jobCostingListQueryKey(companyId),
    companyId ? collection(db, jobCostingCollection(companyId)) : null,
    (docs) => {
      const rows = docs as (JobCostingDoc & { id: string })[]
      return ((rows) => rows)(rows)
    },
    !!companyId
  )
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
    mutationFn: async (
      input: Omit<JobCostingDoc, 'createdById' | 'createdByName' | 'createdAt' | 'updatedAt'>
    ) => {
      const now = serverTimestamp()
      const data: JobCostingDoc = {
        ...input,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }
      // Recording a costing is the shop saying what it *paid* for this job's parts, and to whom.
      // That is a purchase, so one is written beside it — the "From Job" half of
      // Purchase > General Purchase. The purchase carries the cost prices, not the bill's
      // selling prices: the client's own JPU entry totals ₹6,200 against a ₹245 bill for the
      // same three parts.
      //
      // The purchase document is keyed by job id, exactly as the costing is, so re-recording a
      // costing updates the same entry instead of raising a second one for the same job.
      const purchaseRef = doc(db, purchaseDoc(companyId, input.jobId))
      const existingPurchase = await getDoc(purchaseRef)
      const lines = input.costItems
        .filter((c) => c.cost > 0 && c.qty > 0)
        .map((c) => ({
          id: c.id,
          itemId: c.itemId,
          itemName: c.itemName,
          qty: c.qty,
          rate: c.cost,
        }))
      const purchaseTotalValue = lines.reduce((sum, l) => sum + l.qty * l.rate, 0)
      // Their entry shows one supplier for the whole purchase while a costing records one per
      // line. The first line that names a supplier speaks for the entry; when they differ the
      // individual lines are still on the costing itself.
      const supplierName = input.costItems.find((c) => c.supplier?.trim())?.supplier?.trim() ?? ''

      const batch = writeBatch(db)
      batch.set(doc(db, jobCostingDoc(companyId, input.jobId)), data)

      if (lines.length > 0) {
        if (!existingPurchase.exists()) {
          const fy = getCurrentFinancialYear()
          const seq = await getNextSequence(companyId, 'purchases')
          batch.set(purchaseRef, {
            purchaseNumber: formatJobPurchaseId(fy.name, seq),
            supplierId: null,
            supplierName,
            invoiceNumber: null,
            terms: 'credit',
            lines,
            total: purchaseTotalValue,
            amountPaid: 0,
            status: 'active',
            cancelReason: null,
            notes: null,
            sourceJobCardId: input.jobId,
            sourceJobCardNumber: input.jobNumber,
            editHistory: [],
            createdById: user!.uid,
            createdByName: profile!.fullName,
            createdAt: now as never,
            updatedAt: now as never,
          } satisfies PurchaseDoc)
        } else {
          const prev = existingPurchase.data() as PurchaseDoc
          const edit: PurchaseEdit = {
            label: 'Costing updated',
            fromTotal: prev.total,
            toTotal: purchaseTotalValue,
            fromItems: prev.lines.length,
            toItems: lines.length,
            at: new Date().toISOString(),
            byName: profile!.fullName,
          }
          batch.update(purchaseRef, {
            supplierName: supplierName || prev.supplierName,
            lines,
            total: purchaseTotalValue,
            // Re-recording a costing brings a cancelled entry back: the shop has said again that
            // it paid for these parts.
            status: 'active',
            cancelReason: null,
            editHistory: [...(prev.editHistory ?? []), edit],
            updatedAt: now,
          })
        }
      }
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
      // The costing raised or updated a purchase, so General Purchase and Supplier
      // Payables are both now out of date.
      queryClient.invalidateQueries({ queryKey: purchasesQueryKey(companyId) })
    },
  })
}
