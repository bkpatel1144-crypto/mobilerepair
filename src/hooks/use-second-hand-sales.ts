import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { secondHandPurchaseDoc, secondHandSalesCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { formatSecondHandSaleId, getNextSequence } from '@/lib/sequences'
import { secondHandPurchasesQueryKey, type SecondHandPurchaseWithId, deviceLabel } from '@/hooks/use-second-hand-purchases'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { SecondHandSaleDoc } from '@/types/firestore'

export interface SecondHandSaleWithId extends SecondHandSaleDoc { id: string }

export function secondHandSalesQueryKey(companyId: string | undefined) {
  return ['secondHandSales', companyId] as const
}

/** Sorted client-side, not via a server-side `orderBy('createdAt')` — same pending-
 * `serverTimestamp()` reasoning as `useSecondHandPurchases()`. */
export function useSecondHandSales() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: secondHandSalesQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, secondHandSalesCollection(companyId!)))
      const now = new Date().getTime() // not the bare `Date.now()` call — see this project's own established React Compiler purity fix
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as SecondHandSaleDoc) }))
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId,
  })
}

export interface CreateSecondHandSaleInput {
  purchase: SecondHandPurchaseWithId
  buyerId: string
  buyerName: string
  salePrice: number
  paymentMode: 'cash' | 'upi' | 'card'
  warrantyDays: number
  accessoriesGiven: string | null
  notes: string | null
}

/** One atomic batch — the sale doc *and* the purchase's `status: 'sold'` flip happen together,
 * never as two separate un-atomic writes (same discipline Phase 6 enforced for receipts against
 * a job's `paidAmount`). `purchasePrice`/`refurbCost`/`profit` are snapshotted onto the sale doc
 * at this moment — see `SecondHandSaleDoc`'s own doc comment for why. */
export function useCreateSecondHandSale() {
  const { profile, user } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSecondHandSaleInput) => {
      const fy = getCurrentFinancialYear()
      const seq = await getNextSequence(companyId, 'secondHandSales')
      const ref = doc(collection(db, secondHandSalesCollection(companyId)))
      const now = serverTimestamp()
      const profit = input.salePrice - input.purchase.purchasePrice - input.purchase.refurbCost
      const data: SecondHandSaleDoc = {
        saleNumber: formatSecondHandSaleId(fy.name, seq),
        purchaseId: input.purchase.id,
        purchaseNumber: input.purchase.purchaseNumber,
        deviceLabel: deviceLabel(input.purchase),
        buyerId: input.buyerId,
        buyerName: input.buyerName,
        salePrice: input.salePrice,
        paymentMode: input.paymentMode,
        warrantyDays: input.warrantyDays,
        accessoriesGiven: input.accessoriesGiven,
        notes: input.notes,
        purchasePrice: input.purchase.purchasePrice,
        refurbCost: input.purchase.refurbCost,
        profit,
        soldById: user!.uid,
        soldByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      batch.update(doc(db, secondHandPurchaseDoc(companyId, input.purchase.id)), {
        status: 'sold',
        updatedAt: now,
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'second-hand-device',
        entityType: 'Device Sale',
        entityId: ref.id,
        entityLabel: data.saleNumber,
        targetLabel: input.buyerName,
        critical: true, // matches BUILD_PLAN.md's own critical-action list ("Second Hand Device Sale Create")
        details: { salePrice: input.salePrice, profit, buyer: input.buyerName },
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secondHandSalesQueryKey(companyId) })
      queryClient.invalidateQueries({ queryKey: secondHandPurchasesQueryKey(companyId) })
    },
  })
}

/** Joins a sale back to its purchase for the Sale Register's combined drawer (`preview (39)`) —
 * pass both lists already fetched elsewhere rather than a second round-trip. */
export function joinSaleWithPurchase(sale: SecondHandSaleWithId, purchases: SecondHandPurchaseWithId[]) {
  return { sale, purchase: purchases.find((p) => p.id === sale.purchaseId) }
}
