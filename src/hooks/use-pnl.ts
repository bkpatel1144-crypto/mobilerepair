import { useMemo } from 'react'
import { useReceipts } from '@/hooks/use-receipts'
import { useExpenses } from '@/hooks/use-expenses'
import { dateRangeBounds } from '@/lib/date-range'
import type { DateRangeKey } from '@/components/shared/filter-bar'

export interface PnlLine {
  label: string
  amount: number
}

export interface PnlData {
  revenue: number
  refunds: number
  netRevenue: number
  directCost: number
  grossProfit: number
  grossMarginPct: number
  operatingExpenses: number
  netProfit: number
  netMarginPct: number
  /** Operating expenses split by category, biggest first. */
  expenseLines: PnlLine[]
  /** Every cash movement the statement is built from, for the "show me the rows" drill-down —
   * a P&L nobody can trace back to entries is a number people stop trusting. */
  entryCount: number
}

const EMPTY: PnlData = {
  revenue: 0,
  refunds: 0,
  netRevenue: 0,
  directCost: 0,
  grossProfit: 0,
  grossMarginPct: 0,
  operatingExpenses: 0,
  netProfit: 0,
  netMarginPct: 0,
  expenseLines: [],
  entryCount: 0,
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0
}

/**
 * Cash-basis Profit & Loss.
 *
 * Built entirely from `receipts` (plus `expenses` for the category split), which is the whole
 * point of choosing cash basis: Cash Book is built on the same collection, so the two reports
 * cannot disagree. An accrual version would read billed job amounts and `jobCosting.totalCost`
 * instead, and would legitimately show profit on money not yet collected — useful for filing,
 * confusing for a shopkeeper reconciling a till.
 *
 * The three-way split of `direction: 'out'` comes from `ReceiptDoc.kind`:
 *  - `'expense'`          → operating expenses
 *  - `'supplierPayment'`  → direct cost (parts and devices bought for resale)
 *  - anything else        → a refund to a customer, which reduces revenue rather than being a
 *                           cost; treating a refund as an expense would overstate both revenue
 *                           and costs by the same amount and quietly flatter gross margin.
 *
 * `kind` is absent on receipts written before those features existed. That defaults to the
 * customer bucket, which is correct — every one of them is a job advance, final payment or
 * refund.
 */
export function usePnl(
  range: DateRangeKey | 'all' = 'month',
  customFrom?: string,
  customTo?: string
) {
  const receipts = useReceipts()
  const expenses = useExpenses()

  const data = useMemo<PnlData>(() => {
    const rows = receipts.data
    if (!rows) return EMPTY

    const bounds = dateRangeBounds(range, customFrom, customTo)
    const inRange = (d: Date | undefined) => !bounds || (!!d && d >= bounds.from && d <= bounds.to)

    let revenue = 0
    let refunds = 0
    let directCost = 0
    let operatingExpenses = 0
    let entryCount = 0

    for (const r of rows) {
      if (r.voided) continue
      if (!inRange(r.createdAt?.toDate?.())) continue
      entryCount += 1

      if (r.direction === 'in') {
        revenue += r.amount
        continue
      }
      if (r.kind === 'expense') operatingExpenses += r.amount
      else if (r.kind === 'supplierPayment') directCost += r.amount
      else refunds += r.amount
    }

    // Category split comes from `expenses`, not the receipts, because only the expense document
    // carries the category. Filtered on `expenseDate` — the day money actually left — which is
    // the date the expense list and this report both group by.
    const byCategory = new Map<string, number>()
    for (const e of expenses.data ?? []) {
      if (e.voided) continue
      if (!inRange(e.expenseDate?.toDate?.())) continue
      byCategory.set(e.categoryName, (byCategory.get(e.categoryName) ?? 0) + e.amount)
    }

    const netRevenue = revenue - refunds
    const grossProfit = netRevenue - directCost
    const netProfit = grossProfit - operatingExpenses

    return {
      revenue,
      refunds,
      netRevenue,
      directCost,
      grossProfit,
      grossMarginPct: pct(grossProfit, netRevenue),
      operatingExpenses,
      netProfit,
      netMarginPct: pct(netProfit, netRevenue),
      expenseLines: [...byCategory.entries()]
        .map(([label, amount]) => ({ label, amount }))
        .sort((a, b) => b.amount - a.amount),
      entryCount,
    }
  }, [receipts.data, expenses.data, range, customFrom, customTo])

  return {
    data,
    isLoading: receipts.isLoading || expenses.isLoading,
    error: receipts.error ?? expenses.error,
    refetch: () => Promise.all([receipts.refetch(), expenses.refetch()]),
  }
}
