import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, increment, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { receiptsCollection, receiptDoc, jobCardDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getNextSequence, formatReceiptId } from '@/lib/sequences'
import { jobCardQueryKey, jobCardsQueryKey } from '@/hooks/use-job-cards'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { ReceiptDoc } from '@/types/firestore'

export interface ReceiptWithId extends ReceiptDoc {
  id: string
}

export function receiptsQueryKey(companyId: string | undefined) {
  return ['receipts', companyId] as const
}

/** Every receipt/payment for the company — Job Cards' own advance/final payment writes
 * (Phase 5) and this page's own "New Entry" (below) both write to the same collection, so this
 * one list is a complete Receipts & Payments ledger, a Cash Book, and (filtered by partyId) a
 * Party Ledger's payment rows — never a second collection standing in for any of those. Sorted
 * client-side, not via a server-side `orderBy('createdAt')` — `createdAt` is a
 * `serverTimestamp()` sentinel that reads back as `null` locally until the server acknowledges
 * it, and Firestore's query engine *excludes* a document entirely from an `orderBy()`-sorted
 * result while its sort field is null. A receipt recorded moments ago would otherwise be briefly
 * invisible in its own list. */
export function useReceipts() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: receiptsQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, receiptsCollection(companyId!)))
      const now = new Date().getTime() // not the bare `Date.now()` call — see this project's own established React Compiler purity fix
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as ReceiptDoc) }) as ReceiptWithId)
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId,
  })
}

export interface CreateReceiptInput {
  direction: 'in' | 'out'
  partyId: string
  partyName: string
  against: 'jobCard' | 'manualAdvance'
  jobCardId?: string | null
  jobCardNumber?: string | null
  amount: number
  mode: 'cash' | 'upi' | 'card'
  notes?: string | null
}

/** The "New Entry" modal's own write path — the standalone counterpart to Job Cards' own
 * advance/final-payment receipts (`use-job-cards.ts`/`use-job-actions.ts`), same collection,
 * same shape. When `against: 'jobCard'`, also patches that job's `paidAmount` in the same
 * batch — a receipt updating the job's own balance from two separate un-atomic writes is
 * exactly the failure mode BUILD_PLAN's Phase 6 calls out by name. */
export function useCreateReceiptOrPayment() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const uid = user!.uid
  const userName = profile!.fullName
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateReceiptInput) => {
      const seq = await getNextSequence(companyId, 'receipts')
      const now = serverTimestamp()
      const ref = doc(collection(db, receiptsCollection(companyId)))
      const data: ReceiptDoc = {
        receiptNumber: formatReceiptId(new Date(), seq),
        direction: input.direction,
        partyId: input.partyId,
        partyName: input.partyName,
        jobCardId: input.against === 'jobCard' ? (input.jobCardId ?? null) : null,
        jobCardNumber: input.against === 'jobCard' ? (input.jobCardNumber ?? null) : null,
        against: input.against,
        purpose: input.against === 'jobCard' ? 'final' : 'other',
        amount: input.amount,
        mode: input.mode,
        notes: input.notes ?? null,
        voided: false,
        createdById: uid,
        createdByName: userName,
        createdAt: now as never,
        updatedAt: now as never,
      }

      const batch = writeBatch(db)
      batch.set(ref, data)
      if (input.against === 'jobCard' && input.jobCardId) {
        const signedAmount = input.direction === 'in' ? input.amount : -input.amount
        batch.update(doc(db, jobCardDoc(companyId, input.jobCardId)), {
          paidAmount: increment(signedAmount),
          updatedAt: now,
        })
      }
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.direction === 'in' ? 'Receipt Received' : 'Payment Made',
        module: 'finance',
        entityType: 'Receipt',
        entityId: ref.id,
        entityLabel: data.receiptNumber,
        targetLabel: input.partyName,
        critical: true, // matches BUILD_PLAN.md's own critical-action list ("Payment Receipt Create")
        details: { amount: input.amount, mode: input.mode, against: input.against },
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: receiptsQueryKey(companyId) })
      queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(companyId) })
      if (input.jobCardId) {
        queryClient.invalidateQueries({ queryKey: jobCardQueryKey(companyId, input.jobCardId) })
      }
    },
  })
}

/** Reverses a receipt — flips `voided` true and, if it was against a job card, reverses that
 * job's `paidAmount` by the same amount in the same batch (never a soft-delete that leaves the
 * job's own balance stale, which is the exact bug BUILD_PLAN's Phase 6 warns against). */
export function useVoidReceipt() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (receipt: ReceiptWithId) => {
      const now = serverTimestamp()
      const batch = writeBatch(db)
      batch.update(doc(db, receiptDoc(companyId, receipt.id)), {
        voided: true,
        updatedAt: now,
      })
      if (receipt.jobCardId) {
        const signedAmount = receipt.direction === 'in' ? -receipt.amount : receipt.amount
        batch.update(doc(db, jobCardDoc(companyId, receipt.jobCardId)), {
          paidAmount: increment(signedAmount),
          updatedAt: now,
        })
      }
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Void Receipt',
        module: 'finance',
        entityType: 'Receipt',
        entityId: receipt.id,
        entityLabel: receipt.receiptNumber,
        targetLabel: receipt.partyName,
        critical: true, // reverses money already recorded — same bar as recording it in the first place
        details: { amount: receipt.amount, mode: receipt.mode },
      })
      await batch.commit()
    },
    onSuccess: (_data, receipt) => {
      queryClient.invalidateQueries({ queryKey: receiptsQueryKey(companyId) })
      queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(companyId) })
      if (receipt.jobCardId) {
        queryClient.invalidateQueries({ queryKey: jobCardQueryKey(companyId, receipt.jobCardId) })
      }
    },
  })
}
