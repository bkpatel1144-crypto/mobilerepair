import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { secondHandPurchaseDoc, secondHandPurchasesCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { formatSecondHandPurchaseId, getNextSequence } from '@/lib/sequences'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type {
  AccountLockStatus,
  ConditionGrade,
  SecondHandPurchaseDoc,
  SecondHandPurchaseStatus,
} from '@/types/firestore'

export interface SecondHandPurchaseWithId extends SecondHandPurchaseDoc { id: string }

export function secondHandPurchasesQueryKey(companyId: string | undefined) {
  return ['secondHandPurchases', companyId] as const
}

/** Sorted client-side, not via a server-side `orderBy('createdAt')` — `createdAt` is a
 * `serverTimestamp()` sentinel that reads back as `null` locally until the server acknowledges
 * it, and Firestore's query engine *excludes* a document entirely from an `orderBy()`-sorted
 * result while its sort field is null. A purchase recorded moments ago (routinely true right
 * after Create Purchase redirects back to this exact list) would otherwise be briefly invisible. */
export function useSecondHandPurchases() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: secondHandPurchasesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, secondHandPurchasesCollection(companyId!)))
      const now = new Date().getTime() // not the bare `Date.now()` call — see this project's own established React Compiler purity fix
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as SecondHandPurchaseDoc) }))
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId,
  })
}

export function deviceLabel(p: Pick<SecondHandPurchaseDoc, 'brandName' | 'model' | 'deviceTypeName'>) {
  const base = [p.brandName, p.model].filter(Boolean).join(' ')
  return base ? `${base}${p.deviceTypeName ? ` (${p.deviceTypeName})` : ''}` : (p.deviceTypeName ?? 'Device')
}

export interface CreateSecondHandPurchaseInput {
  deviceTypeId: string | null
  deviceTypeName: string | null
  brandId: string | null
  brandName: string | null
  model: string | null
  imei: string | null
  imei2: string | null
  devicePinPattern: string | null
  ram: string | null
  storage: string | null
  colour: string | null
  batteryHealthPercent: number | null
  network: string | null
  originalInvoiceDate: Date | null
  warrantyLeftMonths: number | null
  dualSim: boolean
  hasBox: boolean
  hasBill: boolean
  conditionGrade: ConditionGrade
  accountLockStatus: AccountLockStatus
  accessoriesIncluded: string | null
  conditionNotes: string | null
  imageUrls: string[]

  sellerId: string
  sellerName: string
  idProofType: string | null
  idProofNumber: string | null
  idProofPhotoUrl: string | null
  imeiCheckedClean: boolean
  sellerDeclaredNotStolen: boolean

  purchasePrice: number
  purchaseDate: Date
  paymentMode: 'cash' | 'upi' | 'card'
  amountPaid: number
  purchasedById: string
  purchasedByName: string
  expectedSalePrice: number | null
  notes: string | null
}

export function useCreateSecondHandPurchase() {
  const { profile, user } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSecondHandPurchaseInput) => {
      const fy = getCurrentFinancialYear()
      const seq = await getNextSequence(companyId, 'secondHandPurchases')
      const ref = doc(collection(db, secondHandPurchasesCollection(companyId)))
      const now = serverTimestamp()
      const data: SecondHandPurchaseDoc = {
        purchaseNumber: formatSecondHandPurchaseId(fy.name, seq),
        status: 'inStock',
        ...input,
        originalInvoiceDate: input.originalInvoiceDate ? Timestamp.fromDate(input.originalInvoiceDate) : null,
        purchaseDate: Timestamp.fromDate(input.purchaseDate),
        refurbCost: 0,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'second-hand-device',
        entityType: 'Device Purchase',
        entityId: ref.id,
        entityLabel: data.purchaseNumber,
        targetLabel: input.sellerName,
        critical: true, // matches BUILD_PLAN.md's own critical-action list ("Second Hand Device Purchase Create")
        details: { purchasePrice: input.purchasePrice, seller: input.sellerName },
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: secondHandPurchasesQueryKey(companyId) }),
  })
}

/** Edit while still `inStock`/`inRefurb` — matches the reference's own "✎ Edit" action on the
 * Device Purchase drawer. Deliberately a smaller field set than create (device identity/seller/
 * purchase-price terms are fixed at intake); this covers what's actually re-editable in
 * practice: condition, accessories, notes, and expected sale price. */
export function useUpdateSecondHandPurchase() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      id: string
      purchaseNumber: string
      conditionGrade: ConditionGrade
      conditionNotes: string | null
      accessoriesIncluded: string | null
      expectedSalePrice: number | null
      refurbCost: number
      notes: string | null
    }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, secondHandPurchaseDoc(companyId, input.id)), {
        conditionGrade: input.conditionGrade,
        conditionNotes: input.conditionNotes,
        accessoriesIncluded: input.accessoriesIncluded,
        expectedSalePrice: input.expectedSalePrice,
        refurbCost: input.refurbCost,
        notes: input.notes,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Update',
        module: 'second-hand-device',
        entityType: 'Device Purchase',
        entityId: input.id,
        entityLabel: input.purchaseNumber,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: secondHandPurchasesQueryKey(companyId) }),
  })
}

const STATUS_ACTION_LABEL: Record<SecondHandPurchaseStatus, string> = {
  inStock: 'Restock',
  inRefurb: 'Send to Refurb',
  sold: 'Sold', // never reached via this hook — `useCreateSecondHandSale` sets this status itself
  returnedToSeller: 'Return to Seller',
}

export function useSetSecondHandPurchaseStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: SecondHandPurchaseStatus; purchaseNumber: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, secondHandPurchaseDoc(companyId, input.id)), {
        status: input.status,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: STATUS_ACTION_LABEL[input.status],
        module: 'second-hand-device',
        entityType: 'Device Purchase',
        entityId: input.id,
        entityLabel: input.purchaseNumber,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: secondHandPurchasesQueryKey(companyId) }),
  })
}
