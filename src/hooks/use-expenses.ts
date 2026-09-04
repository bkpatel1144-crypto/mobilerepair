import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLiveQuery } from '@/hooks/use-live-query'
import {
  expensesCollection,
  expenseDoc,
  receiptsCollection,
  receiptDoc,
} from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { addAuditLogToBatch, auditContextFrom } from '@/lib/audit-log'
import { getNextSequence, formatExpenseId, formatReceiptId } from '@/lib/sequences'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { receiptsQueryKey } from '@/hooks/use-receipts'
import type { ExpenseDoc, ReceiptDoc } from '@/types/firestore'

export interface ExpenseWithId extends ExpenseDoc {
  id: string
}

export function expensesQueryKey(companyId: string | undefined) {
  return ['expenses', companyId] as const
}

/** Newest first, and sorted client-side for the same reason every other list here is: a
 * just-written document's `serverTimestamp()` is briefly null, and Firestore excludes a document
 * from an `orderBy` result while its sort field is null — so a server-side order would make a
 * brand-new expense vanish from its own list for a moment. */
export function useExpenses() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useLiveQuery<ExpenseWithId[]>(
    expensesQueryKey(companyId),
    companyId ? collection(db, expensesCollection(companyId)) : null,
    (docs) => {
      const now = new Date().getTime() // not the bare `Date.now()` — this project's React Compiler purity fix
      return (docs as ExpenseWithId[]).sort(
        (a, b) =>
          (b.expenseDate?.toDate?.()?.getTime() ?? now) - (a.expenseDate?.toDate?.()?.getTime() ?? now)
      )
    },
    !!companyId
  )
}

export interface CreateExpenseInput {
  expenseDate: Date
  categoryId: string
  categoryName: string
  amount: number
  mode: ExpenseDoc['mode']
  paidToPartyId: string | null
  paidToPartyName: string | null
  notes: string | null
}

/**
 * Writes the expense **and** its paired `out` receipt in one batch.
 *
 * Cash Book and Party Ledger are both built on `receipts`. An expense recorded only in its own
 * collection would leave the cash book's closing balance disagreeing with the till by exactly
 * the shop's running costs — so the receipt isn't a convenience, it's what keeps one number
 * true. Both documents plus the audit entry commit together; there is no window where an
 * expense exists without its cash movement.
 */
export function useCreateExpense() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      // Two counters, because the two documents are numbered in different schemes on purpose:
      // EXP-2026-27-00001 (financial year, looked up by year) and RCP-0309-00001 (day, matching
      // every other receipt in the app).
      const [expSeq, rcpSeq] = await Promise.all([
        getNextSequence(companyId, 'expenses'),
        getNextSequence(companyId, 'receipts'),
      ])
      const fy = getCurrentFinancialYear()
      const now = serverTimestamp()

      const expenseRef = doc(collection(db, expensesCollection(companyId)))
      const receiptRef = doc(collection(db, receiptsCollection(companyId)))

      const expense: ExpenseDoc = {
        expenseNumber: formatExpenseId(fy.name, expSeq),
        expenseDate: Timestamp.fromDate(input.expenseDate),
        categoryId: input.categoryId,
        categoryName: input.categoryName,
        amount: input.amount,
        mode: input.mode,
        paidToPartyId: input.paidToPartyId,
        paidToPartyName: input.paidToPartyName,
        branchId: profile!.branchId,
        notes: input.notes,
        receiptId: receiptRef.id,
        voided: false,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }

      const receipt: ReceiptDoc = {
        receiptNumber: formatReceiptId(input.expenseDate, rcpSeq),
        direction: 'out',
        // A party is optional on an expense (tea has no landlord), but the ledger needs *some*
        // label; the category stands in so a cash-book row is never blank.
        partyId: input.paidToPartyId ?? '',
        partyName: input.paidToPartyName ?? input.categoryName,
        jobCardId: null,
        jobCardNumber: null,
        against: 'manualAdvance',
        purpose: 'other',
        amount: input.amount,
        mode: input.mode,
        notes: `Expense ${expense.expenseNumber}${input.notes ? ` — ${input.notes}` : ''}`,
        voided: false,
        createdById: user!.uid,
        createdByName: profile!.fullName,
        createdAt: now as never,
        updatedAt: now as never,
      }

      const batch = writeBatch(db)
      batch.set(expenseRef, expense)
      batch.set(receiptRef, receipt)
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Expense Recorded',
        module: 'finance',
        entityType: 'Expense',
        entityId: expenseRef.id,
        entityLabel: expense.expenseNumber,
        targetLabel: input.categoryName,
        critical: true, // money leaving the shop, same bar as a payment receipt
        details: { amount: input.amount, mode: input.mode, category: input.categoryName },
      })
      await batch.commit()
      return { id: expenseRef.id, ...expense }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesQueryKey(companyId) })
      // The paired receipt changes Cash Book, Party Ledger and Payables too.
      queryClient.invalidateQueries({ queryKey: receiptsQueryKey(companyId) })
    },
  })
}

/**
 * Voids an expense and its paired receipt together.
 *
 * Void, not delete — the same call the Receipts page already makes for a payment, and for the
 * same reason: a cash entry that vanishes leaves a book that cannot be reconciled against
 * yesterday's printout. Voiding both sides keeps the expense list and the cash book agreeing.
 */
export function useVoidExpense() {
  const { user, profile } = useAuth()
  const companyId = profile!.companyId
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expense: ExpenseWithId) => {
      const now = serverTimestamp()
      const batch = writeBatch(db)
      batch.update(doc(db, expenseDoc(companyId, expense.id)), { voided: true, updatedAt: now })
      if (expense.receiptId) {
        batch.update(doc(db, receiptDoc(companyId, expense.receiptId)), {
          voided: true,
          updatedAt: now,
        })
      }
      await addAuditLogToBatch(batch, auditContextFrom(user!, profile!), {
        action: 'Expense Voided',
        module: 'finance',
        entityType: 'Expense',
        entityId: expense.id,
        entityLabel: expense.expenseNumber,
        targetLabel: expense.categoryName,
        critical: true,
        details: { amount: expense.amount },
      })
      await batch.commit()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesQueryKey(companyId) })
      queryClient.invalidateQueries({ queryKey: receiptsQueryKey(companyId) })
    },
  })
}
