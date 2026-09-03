import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  jobCardsCollection,
  jobCardDoc,
  jobTimelineCollection,
  receiptsCollection,
} from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { getNextSequence, formatJobCardId, formatReceiptId } from '@/lib/sequences'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { JobCardDoc, JobTimelineEventDoc, ReceiptDoc } from '@/types/firestore'

export interface JobCardWithId extends JobCardDoc {
  id: string
}
export interface TimelineEventWithId extends JobTimelineEventDoc {
  id: string
}

export function jobCardsQueryKey(companyId: string | undefined) {
  return ['jobCards', companyId] as const
}
export function jobCardQueryKey(companyId: string | undefined, jobId: string | undefined) {
  return ['jobCard', companyId, jobId] as const
}
export function jobTimelineQueryKey(companyId: string | undefined, jobId: string | undefined) {
  return ['jobTimeline', companyId, jobId] as const
}

/** All job cards for the company — `job-cards-page.tsx` does its own status-pill/search/date
 * filtering client-side against this one list, same pattern as every other list hook here.
 * Sorted client-side, not via a server-side `orderBy('createdAt')` — `createdAt` is a
 * `serverTimestamp()` sentinel that reads back as `null` locally until the server acknowledges
 * it, and Firestore's query engine *excludes* a document entirely from an `orderBy()`-sorted
 * result while its sort field is null. A job card created moments ago (routinely true right
 * after this exact page is the very next navigation) would otherwise be briefly invisible in
 * its own list. */
export function useJobCards() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: jobCardsQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, jobCardsCollection(companyId!)))
      const now = new Date().getTime() // not the bare `Date.now()` call — see this project's own established React Compiler purity fix
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as JobCardDoc) }))
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId,
  })
}

export function useJobCard(jobId: string | undefined) {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: jobCardQueryKey(companyId, jobId),
    queryFn: async () => {
      const snap = await getDoc(doc(db, jobCardDoc(companyId!, jobId!)))
      return snap.exists() ? ({ id: snap.id, ...(snap.data() as JobCardDoc) } as JobCardWithId) : null
    },
    enabled: !!companyId && !!jobId,
  })
}

/** Sorted client-side (oldest first) — same pending-`serverTimestamp()` reasoning as
 * `useJobCards()` above, and especially relevant here: this is read on the very page a job was
 * just created on (or an action was just taken on), the fastest possible write-then-read path
 * in the whole app. */
export function useJobTimeline(jobId: string | undefined) {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: jobTimelineQueryKey(companyId, jobId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, jobTimelineCollection(companyId!, jobId!)))
      const now = new Date().getTime() // not the bare `Date.now()` call — see this project's own established React Compiler purity fix
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as JobTimelineEventDoc) }))
        .sort((a, b) => (a.createdAt?.toDate?.()?.getTime() ?? now) - (b.createdAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId && !!jobId,
  })
}

export interface CreateJobCardInput {
  branchId: string
  customerId: string
  customerName: string
  customerMobile: string
  alternativeMobile?: string | null
  deviceTypeId?: string | null
  deviceTypeName?: string | null
  brandId?: string | null
  brandName?: string | null
  model?: string | null
  imei?: string | null
  imei2?: string | null
  serialNo?: string | null
  devicePinPattern?: string | null
  problemIds: string[]
  problemLabels: string[]
  remark?: string | null
  serviceItems?: { itemId: string; itemName: string; price: number }[]
  estimatedCost: number
  advanceReceived: number
  advanceMode?: 'cash' | 'upi' | 'card'
  itemsReceived?: string[]
  itemsReturned?: string[]
  assignedToId?: string | null
  assignedToName?: string | null
  imageUrls?: string[]
}

/** Creates the job card, an "Assigned" timeline event when a technician was picked at intake,
 * an "Advance Received" timeline event + a real `receipts` doc when an advance was taken — all
 * in the *same* batch as the "Created" event, so a job card is never left half-written (a
 * receipt with no job, or a job with no Created event). See `getNextSequence()` for why the
 * job/receipt numbers themselves come from a separate transaction first: Firestore batches
 * can't read-then-write the same counter doc safely inside themselves. */
export function useCreateJobCard() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const uid = user!.uid
  const userName = profile!.fullName
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateJobCardInput) => {
      const fy = getCurrentFinancialYear()
      // Both counters are independent — `getNextSequence()` is a `runTransaction()` (a read
      // round trip, then a commit round trip), so running the job/receipt sequence draws
      // sequentially would pay that cost twice in a row before the actual batch write even
      // starts. Kicking them off together roughly halves the real-world latency this
      // measured at (~10-20s sequential on this network, vs. the single slower one of the two
      // once parallel) — a genuinely felt difference for someone creating a job card at a
      // front desk, not a micro-optimization.
      const [jobSeq, receiptSeq] = await Promise.all([
        getNextSequence(companyId, 'jobCards'),
        input.advanceReceived > 0 ? getNextSequence(companyId, 'receipts') : Promise.resolve(null),
      ])
      const jobNumber = formatJobCardId(fy.name, jobSeq)

      const jobRef = doc(collection(db, jobCardsCollection(companyId)))
      const now = serverTimestamp()
      const initialStatus = input.assignedToId ? 'inQueue' : 'pending'

      const jobData: JobCardDoc = {
        jobNumber,
        status: initialStatus,
        branchId: input.branchId,
        customerId: input.customerId,
        customerName: input.customerName,
        customerMobile: input.customerMobile,
        alternativeMobile: input.alternativeMobile ?? null,
        deviceTypeId: input.deviceTypeId ?? null,
        deviceTypeName: input.deviceTypeName ?? null,
        brandId: input.brandId ?? null,
        brandName: input.brandName ?? null,
        model: input.model ?? null,
        imei: input.imei ?? null,
        imei2: input.imei2 ?? null,
        serialNo: input.serialNo ?? null,
        devicePinPattern: input.devicePinPattern ?? null,
        problemIds: input.problemIds,
        problemLabels: input.problemLabels,
        remark: input.remark ?? null,
        serviceItems: input.serviceItems ?? [],
        estimatedCost: input.estimatedCost,
        advanceReceived: input.advanceReceived,
        partsCost: 0,
        finalAmount: null,
        paidAmount: input.advanceReceived,
        itemsReceived: input.itemsReceived ?? [],
        itemsReturned: input.itemsReturned ?? [],
        receivedById: uid,
        receivedByName: userName,
        assignedToId: input.assignedToId ?? null,
        assignedToName: input.assignedToName ?? null,
        deliveredById: null,
        deliveredByName: null,
        cancelledById: null,
        cancelledByName: null,
        returnedById: null,
        returnedByName: null,
        partsUsed: [],
        imageUrls: input.imageUrls ?? [],
        notes: [],
        cancelReason: null,
        holdReason: null,
        lastActionUndo: null,
        createdById: uid,
        createdByName: userName,
        createdAt: now as never,
        updatedAt: now as never,
        deliveredAt: null,
        closedAt: null,
        cancelledAt: null,
      }

      const batch = writeBatch(db)
      batch.set(jobRef, jobData)

      const createdEventRef = doc(collection(db, jobTimelineCollection(companyId, jobRef.id)))
      batch.set(createdEventRef, {
        type: 'created',
        title: 'Created',
        description: `Job card ${jobNumber} created`,
        userId: uid,
        userName,
        createdAt: now as never,
      } satisfies JobTimelineEventDoc)

      if (input.assignedToId) {
        const assignedEventRef = doc(collection(db, jobTimelineCollection(companyId, jobRef.id)))
        batch.set(assignedEventRef, {
          type: 'assigned',
          title: 'Assigned',
          description: 'Technician assigned at creation — added to queue',
          userId: uid,
          userName,
          createdAt: now as never,
        } satisfies JobTimelineEventDoc)
      }

      if (input.advanceReceived > 0) {
        const receiptRef = doc(collection(db, receiptsCollection(companyId)))
        const receiptData: ReceiptDoc = {
          receiptNumber: formatReceiptId(new Date(), receiptSeq!),
          direction: 'in',
          partyId: input.customerId,
          partyName: input.customerName,
          jobCardId: jobRef.id,
          jobCardNumber: jobNumber,
          against: 'jobCard',
          purpose: 'advance',
          amount: input.advanceReceived,
          mode: input.advanceMode ?? 'cash',
          notes: null,
          voided: false,
          createdById: uid,
          createdByName: userName,
          createdAt: now as never,
          updatedAt: now as never,
        }
        batch.set(receiptRef, receiptData)

        const advanceEventRef = doc(collection(db, jobTimelineCollection(companyId, jobRef.id)))
        batch.set(advanceEventRef, {
          type: 'advanceReceived',
          title: 'Advance Received',
          description: `Advance ₹${input.advanceReceived} received`,
          userId: uid,
          userName,
          createdAt: now as never,
        } satisfies JobTimelineEventDoc)
      }

      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'service',
        entityType: 'Job Card',
        entityId: jobRef.id,
        entityLabel: jobNumber,
        targetLabel: input.customerName,
        details: { customer: input.customerName, device: input.deviceTypeName, advance: input.advanceReceived },
      })
      await batch.commit()
      return { id: jobRef.id, jobNumber }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(companyId) }),
  })
}
