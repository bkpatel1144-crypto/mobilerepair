import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, increment, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import {
  supplierBillsCollection,
  supplierBillDoc,
  receiptsCollection,
  secondHandPurchaseDoc,
} from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { getNextSequence, formatSupplierBillId, formatReceiptId } from '@/lib/sequences'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { useSecondHandPurchases } from '@/hooks/use-second-hand-purchases'
import { receiptsQueryKey } from '@/hooks/use-receipts'
import { secondHandPurchasesQueryKey } from '@/hooks/use-second-hand-purchases'
import type { ReceiptDoc, SupplierBillDoc } from '@/types/firestore'

export interface SupplierBillWithId extends SupplierBillDoc {
  id: string
}

export function supplierBillsQueryKey(companyId: string | undefined) {
  return ['supplierBills', companyId] as const
}

export function useSupplierBills() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<SupplierBillWithId[]>(
    supplierBillsQueryKey(companyId),
    companyId ? collection(db, supplierBillsCollection(companyId)) : null,
    (docs) => {
      const now = new Date().getTime() // not the bare `Date.now()` — this project's purity fix
      return (docs as SupplierBillWithId[]).sort(
        (a, b) => (b.billDate?.toDate?.()?.getTime() ?? now) - (a.billDate?.toDate?.()?.getTime() ?? now)
      )
    },
    !!companyId
  )
}

/**
 * One thing the shop owes, from either of the two places a debt to a supplier can arise.
 *
 * `bill` is an entered purchase invoice. `devicePurchase` is a second-hand device bought for
 * more than was handed over at the counter — `purchasePrice - amountPaid` against a real
 * `sellerId`. Both are genuinely money owed, so a payables screen that showed only the first
 * would under-report; keeping them one union means the aging buckets and per-supplier totals
 * don't have to be computed twice.
 */
export type PayableKind = 'bill' | 'devicePurchase'

export interface SupplierPayable {
  kind: PayableKind
  /** The bill doc id, or the purchase doc id for a device purchase. */
  id: string
  supplierId: string
  supplierName: string
  reference: string
  date: Date
  /** Device purchases have no invoice terms, so they are treated as due on the day. */
  dueDate: Date
  amount: number
  amountPaid: number
  outstanding: number
  daysOverdue: number
  bucket: 'current' | '1-30' | '31-60' | '60+'
}

export interface SupplierGroup {
  supplierId: string
  supplierName: string
  items: SupplierPayable[]
  billed: number
  paid: number
  outstanding: number
  oldestDaysOverdue: number
}

export interface SupplierPayablesData {
  groups: SupplierGroup[]
  buckets: Record<SupplierPayable['bucket'], number>
  totalOutstanding: number
  supplierCount: number
}

function bucketFor(daysOverdue: number): SupplierPayable['bucket'] {
  if (daysOverdue <= 0) return 'current'
  if (daysOverdue <= 30) return '1-30'
  if (daysOverdue <= 60) return '31-60'
  return '60+'
}

/**
 * Aging is measured from the due date, falling back to the bill date when a supplier gave no
 * terms — treating an undated bill as "not due yet" forever would quietly hide the oldest debts,
 * which is the one thing this screen exists to surface.
 */
export function useSupplierPayables() {
  const bills = useSupplierBills()
  const purchases = useSecondHandPurchases()

  const data = useMemo<SupplierPayablesData>(() => {
    const items: SupplierPayable[] = []
    // Midnight, so "days overdue" is a whole number of calendar days and doesn't shift as the
    // day goes on.
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayMs = 86_400_000

    for (const b of bills.data ?? []) {
      if (b.status === 'void') continue
      const outstanding = Math.max(0, b.amount - b.amountPaid)
      if (outstanding <= 0) continue
      const billDate = b.billDate?.toDate?.() ?? today
      const dueDate = b.dueDate?.toDate?.() ?? billDate
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / dayMs)
      items.push({
        kind: 'bill',
        id: b.id,
        supplierId: b.supplierId,
        supplierName: b.supplierName,
        reference: b.supplierRef?.trim() ? `${b.billNumber} · ${b.supplierRef}` : b.billNumber,
        date: billDate,
        dueDate,
        amount: b.amount,
        amountPaid: b.amountPaid,
        outstanding,
        daysOverdue,
        bucket: bucketFor(daysOverdue),
      })
    }

    for (const p of purchases.data ?? []) {
      // A device returned to its seller is no longer owed for.
      if (p.status === 'returnedToSeller') continue
      const outstanding = Math.max(0, p.purchasePrice - p.amountPaid)
      if (outstanding <= 0) continue
      const date = p.purchaseDate?.toDate?.() ?? today
      const daysOverdue = Math.floor((today.getTime() - date.getTime()) / dayMs)
      items.push({
        kind: 'devicePurchase',
        id: p.id,
        supplierId: p.sellerId,
        supplierName: p.sellerName,
        reference: `${p.purchaseNumber} · ${[p.brandName, p.model].filter(Boolean).join(' ')}`,
        date,
        dueDate: date,
        amount: p.purchasePrice,
        amountPaid: p.amountPaid,
        outstanding,
        daysOverdue,
        bucket: bucketFor(daysOverdue),
      })
    }

    const bySupplier = new Map<string, SupplierGroup>()
    for (const item of items) {
      // Group by id where there is one; a bill entered against a name with no party still needs
      // to group, so the name is the fallback key.
      const key = item.supplierId || item.supplierName
      let group = bySupplier.get(key)
      if (!group) {
        group = {
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          items: [],
          billed: 0,
          paid: 0,
          outstanding: 0,
          oldestDaysOverdue: 0,
        }
        bySupplier.set(key, group)
      }
      group.items.push(item)
      group.billed += item.amount
      group.paid += item.amountPaid
      group.outstanding += item.outstanding
      group.oldestDaysOverdue = Math.max(group.oldestDaysOverdue, item.daysOverdue)
    }

    const buckets: SupplierPayablesData['buckets'] = { current: 0, '1-30': 0, '31-60': 0, '60+': 0 }
    for (const item of items) buckets[item.bucket] += item.outstanding

    return {
      groups: [...bySupplier.values()].sort((a, b) => b.outstanding - a.outstanding),
      buckets,
      totalOutstanding: items.reduce((sum, i) => sum + i.outstanding, 0),
      supplierCount: bySupplier.size,
    }
  }, [bills.data, purchases.data])

  return {
    data,
    isLoading: bills.isLoading || purchases.isLoading,
    error: bills.error ?? purchases.error,
    refetch: () => Promise.all([bills.refetch(), purchases.refetch()]),
  }
}

export interface CreateSupplierBillInput {
  supplierId: string
  supplierName: string
  supplierRef: string | null
  billDate: Date
  dueDate: Date | null
  amount: number
  notes: string | null
}

export function useCreateSupplierBill() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSupplierBillInput) => {
      const seq = await getNextSequence(companyId, 'supplierBills')
      const now = serverTimestamp()
      const ref = doc(collection(db, supplierBillsCollection(companyId)))
      const data: SupplierBillDoc = {
        billNumber: formatSupplierBillId(getCurrentFinancialYear().name, seq),
        supplierRef: input.supplierRef,
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        billDate: Timestamp.fromDate(input.billDate),
        dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
        amount: input.amount,
        amountPaid: 0,
        notes: input.notes,
        status: 'open',
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }
      const batch = writeBatch(db)
      batch.set(ref, data)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Create',
        module: 'finance',
        entityType: 'Supplier Bill',
        entityId: ref.id,
        entityLabel: data.billNumber,
        targetLabel: input.supplierName,
        critical: true,
        details: { amount: input.amount },
      })
      await batch.commit()
      return { id: ref.id, ...data }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierBillsQueryKey(companyId) }),
  })
}

/**
 * Settles part or all of one payable.
 *
 * Always writes an `out` receipt, whichever kind is being paid: Party Ledger and Cash Book are
 * built on `receipts`, so a payment recorded only against the bill would leave the supplier's
 * ledger showing a debt that had in fact been settled. The bill's own `amountPaid` is advanced
 * with `increment()` rather than a read-then-write, so two tills paying the same bill at once
 * can't both write the same total and lose one payment.
 */
export function useRecordSupplierPayment() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      payable: SupplierPayable
      amount: number
      mode: ReceiptDoc['mode']
      notes: string | null
    }) => {
      const { payable } = input
      const seq = await getNextSequence(companyId, 'receipts')
      const now = serverTimestamp()
      const receiptRef = doc(collection(db, receiptsCollection(companyId)))

      const receipt: ReceiptDoc = {
        receiptNumber: formatReceiptId(new Date(), seq),
        direction: 'out',
        partyId: payable.supplierId,
        partyName: payable.supplierName,
        jobCardId: null,
        jobCardNumber: null,
        against: 'manualAdvance',
        purpose: 'other',
        kind: 'supplierPayment',
        amount: input.amount,
        mode: input.mode,
        notes: `Payment for ${payable.reference}${input.notes ? ` — ${input.notes}` : ''}`,
        voided: false,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }

      const batch = writeBatch(db)
      batch.set(receiptRef, receipt)

      if (payable.kind === 'bill') {
        const settled = input.amount >= payable.outstanding
        batch.update(doc(db, supplierBillDoc(companyId, payable.id)), {
          amountPaid: increment(input.amount),
          // Only close it when this payment covers the remainder; a part payment leaves it open.
          ...(settled ? { status: 'paid' } : {}),
          updatedAt: now,
        })
      } else {
        batch.update(doc(db, secondHandPurchaseDoc(companyId, payable.id)), {
          amountPaid: increment(input.amount),
          updatedAt: now,
        })
      }

      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Supplier Payment',
        module: 'finance',
        entityType: payable.kind === 'bill' ? 'Supplier Bill' : 'Device Purchase',
        entityId: payable.id,
        entityLabel: payable.reference,
        targetLabel: payable.supplierName,
        critical: true,
        details: { amount: input.amount, mode: input.mode, receipt: receipt.receiptNumber },
      })
      await batch.commit()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierBillsQueryKey(companyId) })
      queryClient.invalidateQueries({ queryKey: receiptsQueryKey(companyId) })
      queryClient.invalidateQueries({ queryKey: secondHandPurchasesQueryKey(companyId) })
    },
  })
}

/** Marks a bill void. Not a delete — the same reasoning as receipts and expenses: a settled
 * book has to stay reconcilable against what was printed yesterday. */
export function useVoidSupplierBill() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bill: SupplierBillWithId) => {
      const batch = writeBatch(db)
      batch.update(doc(db, supplierBillDoc(companyId, bill.id)), {
        status: 'void',
        updatedAt: serverTimestamp(),
      })
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Void',
        module: 'finance',
        entityType: 'Supplier Bill',
        entityId: bill.id,
        entityLabel: bill.billNumber,
        targetLabel: bill.supplierName,
        critical: true,
      })
      await batch.commit()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierBillsQueryKey(companyId) }),
  })
}
