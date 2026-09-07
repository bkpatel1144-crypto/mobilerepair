import { useMemo } from 'react'
import { useReceipts, type ReceiptWithId } from '@/hooks/use-receipts'
import { dateRangeBounds } from '@/lib/date-range'
import { cashBook } from '@/lib/ledger-math'
import type { DateRangeKey } from '@/components/shared/filter-bar'

export interface CashBookRow extends ReceiptWithId {
  runningBalance: number
}

export interface CashBookData {
  opening: number
  totalCredit: number
  totalDebit: number
  closing: number
  rows: CashBookRow[]
}

/** Every non-voided receipt/payment ordered oldest-first with a running balance — "Opening" is
 * the balance of everything *before* the selected range (so switching from "This Month" to
 * "Today" doesn't reset the running total to zero, matching how a real cash book works), not
 * just a fixed 0. */
export function useCashBook(
  range: DateRangeKey | 'all' = 'all',
  customFrom?: string,
  customTo?: string
) {
  const { data: allReceipts = [], isLoading, error, refetch } = useReceipts()

  const data = useMemo<CashBookData>(() => {
    // Receipts with no `createdAt` yet — a local write whose server timestamp hasn't landed —
    // are dropped rather than dated to the epoch, which would park them at the top of the book
    // and shift every running balance below them.
    const entries = allReceipts
      .filter((r) => !r.voided)
      .flatMap((r) => {
        const date = r.createdAt?.toDate?.()
        return date ? [{ ...r, date }] : []
      })

    const { opening, totalCredit, totalDebit, closing, rows } = cashBook(
      entries,
      dateRangeBounds(range, customFrom, customTo) ?? undefined
    )
    return { opening, totalCredit, totalDebit, closing, rows }
  }, [allReceipts, range, customFrom, customTo])

  return { data, isLoading, error, refetch }
}
