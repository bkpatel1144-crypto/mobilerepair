import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { jobCardDoc, jobTimelineCollection, receiptsCollection, fieldVisitsCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { formatReceiptId, getNextSequence } from '@/lib/sequences'
import { jobCardQueryKey, jobCardsQueryKey, jobTimelineQueryKey, type JobCardWithId } from '@/hooks/use-job-cards'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { FieldVisitDoc, JobCardDoc, JobTimelineEventDoc, PartUsed, ReceiptDoc } from '@/types/firestore'

/**
 * Every status-transition/data-mutating button on the Job Card detail page funnels through
 * `useApplyJobAction()` — one place that always does the same two things atomically (update the
 * job's own fields, append the real timeline event that action produced), and always snapshots
 * enough to support a single-level "Undo Last Action." `useRecordPayment()` is kept separate
 * because it also has to mint a `receipts` doc via its own sequence transaction, which doesn't
 * fit the plain "field patch" shape every other action has.
 */
export type JobActionInput =
  | { action: 'takeJob' }
  | { action: 'jobDone'; description?: string }
  | { action: 'hold'; reason: string }
  | { action: 'resume' }
  | { action: 'generateBill'; finalAmount: number }
  | { action: 'deliver' }
  | { action: 'close' }
  | { action: 'cancel'; reason: string }
  | { action: 'returnAndClose' }
  | { action: 'addImage'; url: string }
  | { action: 'addPart'; itemId: string; itemName: string; rate: number; qty: number }
  | { action: 'fieldVisit'; durationMinutes?: number; note?: string }
  | { action: 'handover'; toUserId: string; toUserName: string }
  | { action: 'note'; text: string }

function buildActionPatch(
  job: JobCardWithId,
  input: JobActionInput,
  uid: string,
  userName: string
): { patch: Partial<JobCardDoc>; event: Omit<JobTimelineEventDoc, 'createdAt'> } {
  switch (input.action) {
    case 'takeJob':
      return {
        patch: {
          status: 'inProgress',
          assignedToId: job.assignedToId ?? uid,
          assignedToName: job.assignedToName ?? userName,
        },
        event: {
          type: 'statusChange',
          title: 'Taken',
          description: 'Technician took the job',
          fromStatus: job.status,
          toStatus: 'inProgress',
          userId: uid,
          userName,
        },
      }
    case 'jobDone':
      return {
        patch: { status: 'techDone' },
        event: {
          type: 'repairDone',
          title: 'Repair Done',
          description: input.description || 'Repair completed by technician',
          fromStatus: job.status,
          toStatus: 'techDone',
          userId: uid,
          userName,
        },
      }
    case 'hold':
      return {
        patch: { status: 'onHold', holdReason: input.reason },
        event: {
          type: 'statusChange',
          title: 'Hold',
          description: `On hold: ${input.reason}`,
          fromStatus: job.status,
          toStatus: 'onHold',
          userId: uid,
          userName,
        },
      }
    case 'resume': {
      const resumeTo = job.assignedToId ? 'inProgress' : 'inQueue'
      return {
        patch: { status: resumeTo, holdReason: null },
        event: {
          type: 'statusChange',
          title: 'Resume',
          description: 'Job resumed',
          fromStatus: 'onHold',
          toStatus: resumeTo,
          userId: uid,
          userName,
        },
      }
    }
    case 'generateBill':
      return {
        patch: { status: 'ready', finalAmount: input.finalAmount },
        event: {
          type: 'billGenerated',
          title: 'Bill Generated',
          description: `Bill generated for ₹${input.finalAmount}`,
          fromStatus: job.status,
          toStatus: 'ready',
          userId: uid,
          userName,
        },
      }
    case 'deliver':
      return {
        patch: {
          status: 'delivered',
          deliveredById: uid,
          deliveredByName: userName,
          deliveredAt: serverTimestamp() as never,
        },
        event: {
          type: 'delivered',
          title: 'Delivered',
          description: 'Device delivered to customer',
          fromStatus: job.status,
          toStatus: 'delivered',
          userId: uid,
          userName,
        },
      }
    case 'close':
      return {
        patch: { status: 'closed', closedAt: serverTimestamp() as never },
        event: {
          type: 'statusChange',
          title: 'Closed',
          description: 'Job closed',
          fromStatus: job.status,
          toStatus: 'closed',
          userId: uid,
          userName,
        },
      }
    case 'cancel':
      return {
        patch: {
          status: 'cancelled',
          cancelledById: uid,
          cancelledByName: userName,
          cancelledAt: serverTimestamp() as never,
          cancelReason: input.reason,
        },
        event: {
          type: 'cancelled',
          title: 'Cancelled',
          description: `Cancelled: ${input.reason}`,
          fromStatus: job.status,
          toStatus: 'cancelled',
          userId: uid,
          userName,
        },
      }
    case 'returnAndClose':
      return {
        patch: { status: 'pendingReturn', returnedById: uid, returnedByName: userName },
        event: {
          type: 'statusChange',
          title: 'Return & Close',
          description: 'Device returned to customer, job closed',
          fromStatus: job.status,
          toStatus: 'pendingReturn',
          userId: uid,
          userName,
        },
      }
    case 'addImage':
      return {
        patch: { imageUrls: [...job.imageUrls, input.url] },
        event: { type: 'note', title: 'Add Image', description: 'Image added', userId: uid, userName },
      }
    case 'addPart': {
      const part: PartUsed = {
        id: crypto.randomUUID(),
        itemId: input.itemId,
        itemName: input.itemName,
        rate: input.rate,
        qty: input.qty,
      }
      return {
        patch: { partsUsed: [...job.partsUsed, part], partsCost: job.partsCost + input.rate * input.qty },
        event: {
          type: 'partAdded',
          title: 'Part Added',
          description: `Part added: ${input.itemName} x${input.qty}`,
          userId: uid,
          userName,
        },
      }
    }
    case 'fieldVisit':
      return {
        patch: {},
        event: {
          type: 'fieldVisit',
          title: 'Field Visit',
          description: input.note || (input.durationMinutes ? `Field visit logged (${input.durationMinutes}m)` : 'Field visit logged'),
          durationMinutes: input.durationMinutes ?? null,
          userId: uid,
          userName,
        },
      }
    case 'handover':
      return {
        patch: { assignedToId: input.toUserId, assignedToName: input.toUserName },
        event: {
          type: 'handover',
          title: 'Handover',
          description: `Handed over to ${input.toUserName}`,
          userId: uid,
          userName,
        },
      }
    case 'note': {
      const note = { id: crypto.randomUUID(), text: input.text, userId: uid, userName, createdAt: serverTimestamp() as never }
      return {
        patch: { notes: [...job.notes, note] },
        event: { type: 'note', title: 'Note', description: input.text, userId: uid, userName },
      }
    }
  }
}

export function useApplyJobAction(job: JobCardWithId) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const uid = user!.uid
  const userName = profile!.fullName
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: JobActionInput) => {
      const { patch, event } = buildActionPatch(job, input, uid, userName)
      const now = serverTimestamp()

      // Snapshot only the keys this action is about to change, so a single "Undo" can restore
      // them exactly — see `JobCardDoc.lastActionUndo`'s own doc comment.
      const beforePatch: Record<string, unknown> = {}
      for (const key of Object.keys(patch)) {
        beforePatch[key] = (job as unknown as Record<string, unknown>)[key] ?? null
      }

      const batch = writeBatch(db)
      const jobRef = doc(db, jobCardDoc(companyId, job.id))
      const eventRef = doc(collection(db, jobTimelineCollection(companyId, job.id)))

      batch.set(eventRef, { ...event, createdAt: now as never } satisfies JobTimelineEventDoc)
      batch.update(jobRef, {
        ...patch,
        updatedAt: now,
        lastActionUndo: { beforePatch, timelineEventId: eventRef.id, actionLabel: event.title },
      })

      // Field Visit Report (`preview (32)`) reads a flat `fieldVisits` collection rather than
      // every job's own `timeline` subcollection — see `FieldVisitDoc`'s own doc comment. Written
      // in this same batch so it's never out of sync with the timeline event it mirrors.
      if (input.action === 'fieldVisit') {
        const fieldVisitRef = doc(collection(db, fieldVisitsCollection(companyId)))
        batch.set(fieldVisitRef, {
          jobCardId: job.id,
          jobNumber: job.jobNumber,
          customerName: job.customerName,
          deviceTypeName: job.deviceTypeName,
          brandName: job.brandName,
          model: job.model,
          jobStatus: job.status,
          technicianId: uid,
          technicianName: userName,
          durationMinutes: input.durationMinutes ?? null,
          note: input.note ?? null,
          createdAt: now as never,
        } satisfies FieldVisitDoc)
      }

      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: event.title,
        module: 'service',
        entityType: 'Job Card',
        entityId: job.id,
        entityLabel: job.jobNumber,
        targetLabel: job.customerName,
        // Matches BUILD_PLAN.md's own critical-action list ("Job Card Bill") — every other
        // status/data action on a job is routine, this one changes what the customer owes.
        critical: input.action === 'generateBill',
        details: { action: input.action },
      })
      await batch.commit()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardQueryKey(companyId, job.id) })
      queryClient.invalidateQueries({ queryKey: jobTimelineQueryKey(companyId, job.id) })
      queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(companyId) })
    },
  })
}

/** Reverts whatever the most recent action patched and deletes the timeline event it wrote —
 * gated in the UI by the role's Behavior "Allow undo last action" toggle, never here (this hook
 * just does what it's asked; the page decides whether to show the button at all). */
export function useUndoLastAction(job: JobCardWithId) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!job.lastActionUndo) return
      const { beforePatch, timelineEventId, actionLabel } = job.lastActionUndo
      const batch = writeBatch(db)
      batch.update(doc(db, jobCardDoc(companyId, job.id)), {
        ...beforePatch,
        updatedAt: serverTimestamp(),
        lastActionUndo: null,
      })
      batch.delete(doc(db, jobTimelineCollection(companyId, job.id), timelineEventId))
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Undo Last Action',
        module: 'service',
        entityType: 'Job Card',
        entityId: job.id,
        entityLabel: job.jobNumber,
        targetLabel: job.customerName,
        details: { undone: actionLabel },
      })
      await batch.commit()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardQueryKey(companyId, job.id) })
      queryClient.invalidateQueries({ queryKey: jobTimelineQueryKey(companyId, job.id) })
      queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(companyId) })
    },
  })
}

/** Records a receipt against the job (the "Payment" action, and Generate Bill's own optional
 * "collect payment" step) — separate from `useApplyJobAction` because it also mints a real
 * `receipts` doc via its own sequence, not just a job-card field patch. */
export function useRecordPayment(job: JobCardWithId) {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const uid = user!.uid
  const userName = profile!.fullName
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { amount: number; mode: 'cash' | 'upi' | 'card'; purpose?: 'advance' | 'final' | 'other' }) => {
      const seq = await getNextSequence(companyId, 'receipts')
      const now = serverTimestamp()
      const receiptRef = doc(collection(db, receiptsCollection(companyId)))
      const receiptData: ReceiptDoc = {
        receiptNumber: formatReceiptId(new Date(), seq),
        direction: 'in',
        partyId: job.customerId,
        partyName: job.customerName,
        jobCardId: job.id,
        jobCardNumber: job.jobNumber,
        against: 'jobCard',
        purpose: input.purpose ?? 'final',
        amount: input.amount,
        mode: input.mode,
        notes: null,
        voided: false,
        createdById: uid,
        createdByName: userName,
        createdAt: now as never,
        updatedAt: now as never,
      }

      const eventRef = doc(collection(db, jobTimelineCollection(companyId, job.id)))
      const batch = writeBatch(db)
      batch.set(receiptRef, receiptData)
      batch.set(eventRef, {
        type: 'paymentReceived',
        title: 'Payment Received',
        description: `Payment ₹${input.amount} received`,
        userId: uid,
        userName,
        createdAt: now as never,
      } satisfies JobTimelineEventDoc)
      batch.update(doc(db, jobCardDoc(companyId, job.id)), {
        paidAmount: job.paidAmount + input.amount,
        updatedAt: now,
        lastActionUndo: null, // a receipt is its own record — don't let a status-action undo touch it
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Payment Received',
        module: 'finance',
        entityType: 'Receipt',
        entityId: receiptRef.id,
        entityLabel: receiptData.receiptNumber,
        targetLabel: job.customerName,
        critical: true, // matches BUILD_PLAN.md's own critical-action list ("Payment Receipt Create")
        details: { amount: input.amount, mode: input.mode, jobCardNumber: job.jobNumber },
      })
      await batch.commit()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobCardQueryKey(companyId, job.id) })
      queryClient.invalidateQueries({ queryKey: jobTimelineQueryKey(companyId, job.id) })
      queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(companyId) })
    },
  })
}

