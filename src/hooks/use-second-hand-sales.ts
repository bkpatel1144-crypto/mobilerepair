import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import {
  secondHandPurchaseDoc,
  secondHandSaleDoc,
  secondHandSalesCollection,
} from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { formatSecondHandSaleId, getNextSequence } from '@/lib/sequences'
import {
  secondHandPurchasesQueryKey,
  type SecondHandPurchaseWithId,
  deviceLabel,
} from '@/hooks/use-second-hand-purchases'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { SecondHandSaleDoc } from '@/types/firestore'

export interface SecondHandSaleWithId extends SecondHandSaleDoc {
  id: string
}

export function secondHandSalesQueryKey(companyId: string | undefined) {
  return ['secondHandSales', companyId] as const
}

/** Sorted client-side, not via a server-side `orderBy('createdAt')` — same pending-
 * `serverTimestamp()` reasoning as `useSecondHandPurchases()`. */
export function useSecondHandSales() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<SecondHandSaleWithId[]>(
    secondHandSalesQueryKey(companyId),
    companyId ? collection(db, secondHandSalesCollection(companyId)) : null,
    (docs) => {
      const now = new Date().getTime() // not the bare `Date.now()` call — see this project's own established React Compiler purity fix
      return (docs as SecondHandSaleWithId[]).sort(
        (a, b) =>
          (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now)
      )
    },
    !!companyId
  )
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
/**
 * A sale that still counts. `voided` is optional on the document — every sale written before
 * voiding existed has no such field — so this reads a missing value as "not voided" rather
 * than letting `undefined` decide.
 *
 * Deliberately a predicate rather than a filter inside `useSecondHandSales`: the list has to
 * *show* voided rows, struck through, or a reversal looks like the record vanished. Only the
 * totals skip them, and every place that sums money calls this.
 */
export function isLiveSale(sale: { voided?: boolean }): boolean {
  return sale.voided !== true
}

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
export function joinSaleWithPurchase(
  sale: SecondHandSaleWithId,
  purchases: SecondHandPurchaseWithId[]
) {
  return { sale, purchase: purchases.find((p) => p.id === sale.purchaseId) }
}

/**
 * Reverses a sale that should not have happened, and puts the device back in stock.
 *
 * The second half is the point. Creating a sale flips its purchase to `sold`, and there was no
 * way to undo that — so a sale recorded against the wrong device, or to the wrong buyer, left
 * a real handset marked sold for ever. It stops appearing in Device Stock, it cannot be sold
 * again, and the only workaround is re-entering the purchase, which duplicates the device and
 * double-counts what the shop paid for it.
 *
 * Voided, not deleted: the sale consumed an `SHDS-` number out of a sequence that is meant to
 * be continuous, and "this sale was reversed, by whom and why" is exactly what someone looks
 * for later. Profit totals skip voided rows instead.
 */
export function useVoidSecondHandSale() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    networkMode: 'always',
    mutationFn: async (input: { sale: SecondHandSaleWithId; reason: string }) => {
      const { sale } = input
      const now = serverTimestamp()
      const batch = writeBatch(db)

      batch.update(doc(db, secondHandSaleDoc(companyId, sale.id)), {
        voided: true,
        voidedAt: now,
        voidedById: user!.uid,
        voidedByName: profile!.fullName,
        voidReason: input.reason,
        updatedAt: now,
      })
      // Back to stock. `inStock` rather than `inRefurb`, because reversing a sale says nothing
      // about whether the device needs work — it only says it is the shop's again.
      batch.update(doc(db, secondHandPurchaseDoc(companyId, sale.purchaseId)), {
        status: 'inStock',
        updatedAt: now,
      })

      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Device Sale Voided',
        module: 'second-hand-device',
        entityType: 'Device Sale',
        entityId: sale.id,
        entityLabel: sale.saleNumber,
        targetLabel: sale.buyerName,
        critical: true, // money and stock both move
        details: {
          salePrice: sale.salePrice,
          device: sale.deviceLabel,
          returnedToStock: sale.purchaseNumber,
          reason: input.reason,
        },
      })
      await batch.commit()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: secondHandSalesQueryKey(companyId) })
      // The purchase moved too, so Device Stock and the registers are both stale.
      void queryClient.invalidateQueries({ queryKey: secondHandPurchasesQueryKey(companyId) })
    },
  })
}
