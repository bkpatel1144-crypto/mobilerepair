import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import { purchasesCollection, purchaseDoc } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getNextSequence, formatPurchaseId } from '@/lib/sequences'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'

/** How a purchase was paid for. "credit" is the default because a shop usually settles with a
 *  parts supplier later, which is what puts the entry into Owed to Suppliers. */
export type PurchaseTerms = 'credit' | 'cash' | 'upi' | 'card'

export interface PurchaseLine {
  id: string
  itemId: string | null
  itemName: string
  itemCode?: string
  qty: number
  rate: number
}

/** One line in the "Edit history" panel — what changed, and what it did to the money. Kept on
 *  the document rather than in an audit collection because the shopkeeper reads it right there
 *  in the entry, beside the total it explains. */
export interface PurchaseEdit {
  label: string
  fromTotal: number
  toTotal: number
  fromItems: number
  toItems: number
  at: string
  byName: string
}

export interface PurchaseDoc {
  purchaseNumber: string
  supplierId: string | null
  supplierName: string
  invoiceNumber: string | null
  terms: PurchaseTerms
  lines: PurchaseLine[]
  total: number
  amountPaid: number
  status: 'active' | 'cancelled'
  cancelReason: string | null
  notes: string | null
  /** Set when the entry was raised from a job card rather than typed in — the "From Job" badge
   *  and the "Parts for JC-…" subtitle both read from these. */
  sourceJobCardId: string | null
  sourceJobCardNumber: string | null
  editHistory: PurchaseEdit[]
  createdById: string
  createdByName: string
  createdAt: unknown
  updatedAt: unknown
}

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
    companyId
      ? query(collection(db, purchasesCollection(companyId)), orderBy('createdAt', 'desc'))
      : null,
    (docs) => docs as PurchaseWithId[],
    !!companyId
  )
}

/** A purchase's own arithmetic, kept here so the form, the list and the writer all agree. */
export function purchaseTotal(lines: Pick<PurchaseLine, 'qty' | 'rate'>[]) {
  return lines.reduce((sum, l) => sum + l.qty * l.rate, 0)
}

/**
 * What the four cards above the list report.
 *
 * "This list value" and "Owed to suppliers" both count **active entries only**: a cancelled
 * purchase is kept for the record but the shop neither owns those parts nor owes for them, and
 * counting it would overstate both. The client's own screenshot shows exactly this — one
 * cancelled ₹6,200 entry, with both figures reading 0.
 */
export function purchaseSummary(rows: PurchaseWithId[]) {
  const active = rows.filter((r) => r.status === 'active')
  return {
    totalEntries: rows.length,
    active: active.length,
    listValue: active.reduce((sum, r) => sum + r.total, 0),
    owedToSuppliers: active.reduce((sum, r) => sum + Math.max(0, r.total - r.amountPaid), 0),
  }
}

export interface PurchaseInput {
  supplierId: string | null
  supplierName: string
  invoiceNumber: string | null
  terms: PurchaseTerms
  lines: PurchaseLine[]
  notes: string | null
}

export function useCreatePurchase() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PurchaseInput) => {
      const fy = getCurrentFinancialYear()
      const seq = await getNextSequence(companyId, 'purchases')
      const total = purchaseTotal(input.lines)
      const now = serverTimestamp()
      const batch = writeBatch(db)
      const ref = doc(collection(db, purchasesCollection(companyId)))

      batch.set(ref, {
        purchaseNumber: formatPurchaseId(fy.name, seq),
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        invoiceNumber: input.invoiceNumber,
        terms: input.terms,
        lines: input.lines,
        total,
        // Cash, UPI and card are settled at the counter; only credit leaves money owed.
        amountPaid: input.terms === 'credit' ? 0 : total,
        status: 'active',
        cancelReason: null,
        notes: input.notes,
        sourceJobCardId: null,
        sourceJobCardNumber: null,
        editHistory: [],
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now,
        updatedAt: now,
      } satisfies PurchaseDoc)

      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Purchase Created',
        module: 'purchase',
        entityType: 'Purchase',
        entityId: ref.id,
        entityLabel: formatPurchaseId(fy.name, seq),
        targetLabel: input.supplierName,
        critical: true,
        details: { total, items: input.lines.length, terms: input.terms },
      })
      await batch.commit()
      return { id: ref.id, total }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchasesQueryKey(companyId) }),
  })
}

export function useCancelPurchase() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ purchase, reason }: { purchase: PurchaseWithId; reason: string }) => {
      const batch = writeBatch(db)
      const edit: PurchaseEdit = {
        label: reason,
        fromTotal: purchase.total,
        toTotal: 0,
        fromItems: purchase.lines.length,
        toItems: 0,
        at: new Date().toISOString(),
        byName: profile!.fullName,
      }
      batch.update(doc(db, purchaseDoc(companyId, purchase.id)), {
        status: 'cancelled',
        cancelReason: reason,
        // The lines stay. A cancelled entry still has to show what was on it — the client's own
        // view keeps all three items visible under a red "Cancelled" banner.
        editHistory: [...purchase.editHistory, edit],
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Purchase Cancelled',
        module: 'purchase',
        entityType: 'Purchase',
        entityId: purchase.id,
        entityLabel: purchase.purchaseNumber,
        targetLabel: purchase.supplierName,
        critical: true,
        details: { reason, total: purchase.total },
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchasesQueryKey(companyId) }),
  })
}
