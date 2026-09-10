import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { purchaseDoc, purchasesCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { getNextSequence, formatPurchaseId } from '@/lib/sequences'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import type { EntityStatus, PurchaseDoc, PurchaseLine } from '@/types/firestore'

/**
 * Purchase > General Purchase — buying parts and consumables from a supplier.
 *
 * The counterpart to the second-hand device purchase this app already had: that one buys a
 * single device to resell, this one buys stock to consume on job cards. Separate collections
 * because they share almost nothing — a device has an IMEI, a condition grade and a lock status;
 * a parts purchase has lines.
 */

export interface PurchaseWithId extends PurchaseDoc {
  id: string
}

export function purchasesQueryKey(companyId: string | undefined) {
  return ['purchases', companyId] as const
}

export function usePurchases() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<PurchaseWithId[]>(
    purchasesQueryKey(companyId),
    companyId ? collection(db, purchasesCollection(companyId)) : null,
    // Sorted client-side rather than with `orderBy('createdAt')`: `createdAt` is a
    // `serverTimestamp()` sentinel that reads back null until the server acknowledges it, and
    // Firestore drops a null sort field from an ordered result — so a purchase recorded a moment
    // ago would be briefly missing from its own list. Same reasoning as `useJobCards`.
    (docs) => {
      const now = new Date().getTime()
      return (docs as PurchaseWithId[]).sort(
        (a, b) =>
          (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now)
      )
    },
    !!companyId
  )
}

export interface PurchaseInput {
  supplierId: string
  supplierName: string
  purchaseDate: string
  invoiceNumber?: string | null
  lines: PurchaseLine[]
  amountPaid: number
  paymentMode?: string | null
  notes?: string | null
}

export function useCreatePurchase() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PurchaseInput) => {
      const fy = getCurrentFinancialYear()
      const seq = await getNextSequence(companyId, 'purchase')
      const ref = doc(collection(db, purchasesCollection(companyId)))
      const now = serverTimestamp()
      const subtotal = input.lines.reduce((sum, line) => sum + line.amount, 0)
      const data: PurchaseDoc = {
        purchaseNumber: formatPurchaseId(fy.name, seq),
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        purchaseDate: input.purchaseDate,
        invoiceNumber: input.invoiceNumber ?? null,
        lines: input.lines,
        subtotal,
        // Clamped: paying more than the bill would make Supplier Payables report a negative
        // balance, which reads as the supplier owing the shop.
        amountPaid: Math.min(Math.max(input.amountPaid, 0), subtotal),
        paymentMode: input.paymentMode ?? null,
        notes: input.notes ?? null,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        status: 'active',
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'purchase',
        entityType: 'Purchase',
        entityId: ref.id,
        entityLabel: data.purchaseNumber,
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchasesQueryKey(companyId) }),
  })
}

export function useSetPurchaseStatus() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; status: EntityStatus; purchaseNumber: string }) => {
      const batch = writeBatch(db)
      batch.update(doc(db, purchaseDoc(companyId, input.id)), {
        status: input.status,
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: input.status === 'active' ? 'Activate' : 'Cancel',
        module: 'purchase',
        entityType: 'Purchase',
        entityId: input.id,
        entityLabel: input.purchaseNumber,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchasesQueryKey(companyId) }),
  })
}
