import { useMemo } from 'react'
import { useReceipts, type ReceiptWithId } from '@/hooks/use-receipts'
import { dateRangeBounds } from '@/lib/date-range'
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
export function useCashBook(range: DateRangeKey | 'all' = 'all', customFrom?: string, customTo?: string) {
  const { data: allReceipts = [], isLoading } = useReceipts()

  const data = useMemo<CashBookData>(() => {
    const active = [...allReceipts].filter((r) => !r.voided).sort((a, b) => {
      const at = a.createdAt?.toDate?.()?.getTime() ?? 0
      const bt = b.createdAt?.toDate?.()?.getTime() ?? 0
      return at - bt
    })

    const bounds = dateRangeBounds(range, customFrom, customTo)
    const signedAmount = (r: ReceiptWithId) => (r.direction === 'in' ? r.amount : -r.amount)

    let opening = 0
    const inRange: ReceiptWithId[] = []
    for (const r of active) {
      const at = r.createdAt?.toDate?.()
      if (!at) continue
      if (bounds && at < bounds.from) {
        opening += signedAmount(r)
      } else if (!bounds || at <= bounds.to) {
        inRange.push(r)
      }
    }

    let running = opening
    let totalCredit = 0
    let totalDebit = 0
    const rows: CashBookRow[] = inRange.map((r) => {
      if (r.direction === 'in') totalCredit += r.amount
      else totalDebit += r.amount
      running += signedAmount(r)
      return { ...r, runningBalance: running }
    })

    return { opening, totalCredit, totalDebit, closing: running, rows }
  }, [allReceipts, range, customFrom, customTo])

  return { data, isLoading }
}
