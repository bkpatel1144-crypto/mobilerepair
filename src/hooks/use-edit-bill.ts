import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/use-auth'
import {
  jobCardDoc,
  jobTimelineCollection,
  receiptsCollection,
} from '@/lib/firestore-paths'
import { getNextSequence } from '@/lib/sequences'
import { formatPaymentOutId } from '@/lib/sequences'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import {
  jobCardQueryKey,
  jobCardsQueryKey,
  jobTimelineQueryKey,
  type JobCardWithId,
} from '@/hooks/use-job-cards'
import { receiptsQueryKey } from '@/hooks/use-receipts'
import type { JobTimelineEventDoc, PartUsed, ReceiptDoc } from '@/types/firestore'

/** What a bill comes to, given its parts and the two adjustments on top of them. */
export function billTotals(input: {
  parts: Pick<PartUsed, 'rate' | 'qty'>[]
  serviceCharge: number
  discount: number
  paidAmount: number
}) {
  const partsTotal = input.parts.reduce((sum, p) => sum + p.rate * p.qty, 0)
  // Clamped at zero: a discount larger than the bill is a typo, and a negative total would put
  // a refund on the books that nobody agreed to.
  const total = Math.max(0, partsTotal + input.serviceCharge - input.discount)
  const balanceDue = Math.max(0, total - input.paidAmount)
  const refundDue = Math.max(0, input.paidAmount - total)
  return { partsTotal, total, balanceDue, refundDue }
}

/**
 * Saves an edited bill: the parts, the service charge, the discount, and what all of that now
 * comes to.
 *
 * This is the only route to changing a billed job, which is why it exists. `addPart` on the job
 * card raised `partsCost` and never touched `finalAmount`, so a part added after Generate Bill
 * was a part the shop paid for and never charged for. Parts are now blocked once a bill exists
 * (`config/job-action-statuses.ts`) and everything after that happens here, where the two
 * numbers are recomputed together and cannot drift apart.
 *
 * Three things go into one batch, so a refund can never exist without the bill that justifies
 * it:
 *
 *  - the job card: its parts, `partsCost`, `serviceCharge`, `discount`, `billWarranty` and
 *    `finalAmount`,
 *  - a `billEdited` timeline event naming both the old and the new total,
 *  - and, when the new total is below what has already been paid, an outgoing receipt for the
 *    difference, with `paidAmount` brought down to match.
 *
 * `lastActionUndo` is cleared. Undo reverts one patch, and this one can have moved money out of
 * the till — reversing the job card without reversing the refund would be worse than not
 * offering undo at all.
 */
export function useEditBill(job: JobCardWithId) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const uid = user!.uid
  const userName = profile!.fullName
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      parts: PartUsed[]
      serviceCharge: number
      discount: number
      billWarranty: { value: number; unit: 'days' | 'months' | 'years' } | null
      refundMode: 'cash' | 'upi' | 'card'
    }) => {
      const previousTotal = job.finalAmount ?? 0
      const { partsTotal, total, refundDue } = billTotals({
        parts: input.parts,
        serviceCharge: input.serviceCharge,
        discount: input.discount,
        paidAmount: job.paidAmount,
      })

      // The sequence is a transaction and must not run inside the batch.
      const seq = refundDue > 0 ? await getNextSequence(companyId, 'receipts') : null

      const now = serverTimestamp()
      const batch = writeBatch(db)
      const jobRef = doc(db, jobCardDoc(companyId, job.id))
      const eventRef = doc(collection(db, jobTimelineCollection(companyId, job.id)))

      batch.update(jobRef, {
        partsUsed: input.parts,
        partsCost: partsTotal,
        serviceCharge: input.serviceCharge,
        discount: input.discount,
        billWarranty: input.billWarranty,
        finalAmount: total,
        ...(refundDue > 0 ? { paidAmount: total } : {}),
        updatedAt: now,
        lastActionUndo: null,
      })

      const refundNote = refundDue > 0 ? ` (₹${refundDue.toFixed(2)} refunded)` : ''
      batch.set(eventRef, {
        type: 'billEdited',
        title: 'Bill Edited',
        description: `Bill edited: ₹${previousTotal} → ₹${total}${refundNote}`,
        userId: uid,
        userName,
        createdAt: now as never,
      } satisfies JobTimelineEventDoc)

      let refundNumber: string | null = null
      if (refundDue > 0 && seq !== null) {
        const receiptRef = doc(collection(db, receiptsCollection(companyId)))
        refundNumber = formatPaymentOutId(new Date(), seq)
        batch.set(receiptRef, {
          receiptNumber: refundNumber,
          // Out, not a voided receipt: the original payment genuinely happened and stays on the
          // books. This is the shop handing money back.
          direction: 'out',
          partyId: job.customerId,
          partyName: job.customerName,
          jobCardId: job.id,
          jobCardNumber: job.jobNumber,
          against: 'jobCard',
          purpose: 'other',
          kind: 'customer',
          amount: refundDue,
          mode: input.refundMode,
          notes: `Refund on bill edit for ${job.jobNumber}`,
          voided: false,
          createdById: uid,
          createdByName: userName,
          createdAt: now as never,
          updatedAt: now as never,
        } satisfies ReceiptDoc)
      }

      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Bill Edited',
        module: 'sales',
        entityType: 'Job Card',
        entityId: job.id,
        entityLabel: job.jobNumber,
        targetLabel: job.customerName,
        // Changes what the customer owes, and can move money out of the till.
        critical: true,
        details: {
          previousTotal,
          total,
          parts: input.parts.length,
          ...(refundNumber ? { refund: refundDue, refundNumber } : {}),
        },
      })

      await batch.commit()
      return { total, refundDue, refundNumber }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardQueryKey(companyId, job.id) })
      queryClient.invalidateQueries({ queryKey: jobTimelineQueryKey(companyId, job.id) })
      queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(companyId) })
      // A refund is a receipt like any other — Receipts & Payments, the cash book and the
      // ledgers all read that collection, and none of them would notice it otherwise.
      queryClient.invalidateQueries({ queryKey: receiptsQueryKey(companyId) })
    },
  })
}
