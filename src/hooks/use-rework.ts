import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { commitBatch } from '@/lib/offline-commit'
import { jobCardsCollection, jobTimelineCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { formatJobCardId } from '@/lib/sequences'
import { getNextBlockSequence } from '@/lib/sequence-blocks'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import {
  jobCardQueryKey,
  jobCardsQueryKey,
  jobTimelineQueryKey,
  type JobCardWithId,
} from '@/hooks/use-job-cards'
import { warrantyLinesOf, jobWarrantyState } from '@/lib/warranty'
import type { JobCardDoc, JobTimelineEventDoc } from '@/types/firestore'

/**
 * A device that has come back, raised as a *linked* job rather than an unrelated new one.
 *
 * Before this there was no way to reopen anything. A closed job that came back had to be entered
 * from scratch, so the repair history broke at exactly the point it matters most and the shop
 * could not tell a repeat failure from a new customer.
 *
 * The original is never reopened in place. Its bill is settled, its money is counted in a
 * financial year that may already be closed, and its warranty runs from the day it was
 * delivered — reopening it would quietly move all three. A new card that points back at it keeps
 * every one of those facts intact and still answers "what happened to this phone before?".
 */

/** Statuses a job can come back from: the device has already gone to the customer. */
export const REWORKABLE_STATUSES = ['delivered', 'closed']

export function canRework(status: string): boolean {
  return REWORKABLE_STATUSES.includes(status)
}

export interface ReworkInput {
  /** Why it came back, in the shopkeeper's own words. Becomes the new card's reported problem. */
  reason: string
  /**
   * Charge for it or not. Defaults to free when the original is still under warranty — but it is
   * a choice, not a rule: physical damage is not covered by a warranty on a screen, and the
   * person at the counter is the one who can tell.
   */
  underWarranty: boolean
}

export function useReopenAsRework(job: JobCardWithId) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const uid = user!.uid
  const userName = profile!.fullName
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ReworkInput) => {
      const fy = getCurrentFinancialYear()
      const seq = await getNextBlockSequence(companyId, 'jobCards')
      const jobNumber = formatJobCardId(fy.name, seq)
      const newRef = doc(collection(db, jobCardsCollection(companyId)))
      const now = serverTimestamp()

      const data: JobCardDoc = {
        jobNumber,
        status: 'pending',
        branchId: job.branchId,
        // The customer and the device are carried over verbatim. Re-typing an IMEI is how the
        // link between two visits by the same phone gets lost.
        customerId: job.customerId,
        customerName: job.customerName,
        customerMobile: job.customerMobile,
        alternativeMobile: job.alternativeMobile,
        deviceTypeId: job.deviceTypeId,
        deviceTypeName: job.deviceTypeName,
        brandId: job.brandId,
        brandName: job.brandName,
        model: job.model,
        imei: job.imei,
        imei2: job.imei2,
        serialNo: job.serialNo,
        devicePinPattern: job.devicePinPattern,
        problemIds: [],
        problemLabels: [input.reason],
        remark: `Rework of ${job.jobNumber}`,
        serviceItems: [],
        // A warranty job is zero by default and starts with nothing paid. Nothing is carried
        // over from the original bill — that money belongs to the original job, and copying it
        // here would count the same rupees twice across the two cards.
        estimatedCost: 0,
        advanceReceived: 0,
        partsCost: 0,
        finalAmount: input.underWarranty ? 0 : null,
        paidAmount: 0,
        itemsReceived: [],
        itemsReturned: [],
        receivedById: uid,
        receivedByName: userName,
        assignedToId: null,
        assignedToName: null,
        deliveredById: null,
        deliveredByName: null,
        cancelledById: null,
        cancelledByName: null,
        returnedById: null,
        returnedByName: null,
        partsUsed: [],
        imageUrls: [],
        notes: [],
        attributes: {},
        cancelReason: null,
        holdReason: null,
        lastActionUndo: null,
        reworkOfJobCardId: job.id,
        reworkOfJobCardNumber: job.jobNumber,
        // Recorded rather than inferred later: a free repair with no reason attached shows up in
        // the P&L as a loss nobody can explain.
        isWarrantyJob: input.underWarranty,
        createdById: uid,
        createdByName: userName,
        createdAt: now as never,
        updatedAt: now as never,
        deliveredAt: null,
        billGeneratedAt: null,
        closedAt: null,
        cancelledAt: null,
      }

      const batch = writeBatch(db)
      batch.set(newRef, data)

      batch.set(doc(collection(db, jobTimelineCollection(companyId, newRef.id))), {
        type: 'created',
        title: input.underWarranty ? 'Created (warranty rework)' : 'Created (rework)',
        description: `Rework of ${job.jobNumber} — ${input.reason}`,
        userId: uid,
        userName,
        createdAt: now as never,
      } satisfies JobTimelineEventDoc)

      // The original gets a note too. Looking at the old card and not knowing the device came
      // back is the failure this whole feature exists to prevent, and the link has to read in
      // both directions to work at the counter.
      batch.set(doc(collection(db, jobTimelineCollection(companyId, job.id))), {
        type: 'note',
        title: 'Device Returned',
        description: `Came back — rework raised as ${jobNumber}: ${input.reason}`,
        userId: uid,
        userName,
        createdAt: now as never,
      } satisfies JobTimelineEventDoc)

      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Rework Raised',
        module: 'service',
        entityType: 'Job Card',
        entityId: newRef.id,
        entityLabel: jobNumber,
        targetLabel: job.customerName,
        // A free repair is money the shop chose not to take. That is worth being able to find.
        critical: input.underWarranty,
        details: { reworkOf: job.jobNumber, underWarranty: input.underWarranty },
      })

      await commitBatch(batch)
      return { id: newRef.id, jobNumber }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(companyId) })
      void queryClient.invalidateQueries({ queryKey: jobCardQueryKey(companyId, job.id) })
      void queryClient.invalidateQueries({ queryKey: jobTimelineQueryKey(companyId, job.id) })
    },
  })
}

/** Is this job still covered, as the rework dialog should default? */
export function jobIsUnderWarranty(job: JobCardWithId, now: Date, billLabel: string): boolean {
  return jobWarrantyState(warrantyLinesOf(job, now, billLabel)) === 'live'
}
