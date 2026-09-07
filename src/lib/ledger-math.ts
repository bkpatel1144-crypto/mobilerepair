/**
 * The pure arithmetic behind Party Ledger, Cash Book and Payables — pulled out of the hooks so
 * it can be asserted without a Firestore connection. These are the numbers a shop reconciles
 * against its own khata, so a sign error here is worse than a crash: it reads as a plausible
 * figure and nobody notices until a customer disputes it.
 *
 * ## Sign conventions, stated once
 *
 * Two different conventions are in play in this app, and conflating them was a real bug:
 *
 * - **Party ledger (a receivable).** `debit` is what the shop billed the customer, `credit` is
 *   what the customer paid. Balance is `debit - credit`, so **positive means the customer still
 *   owes the shop** and negative is the "Cr" case — the shop is holding more than it billed
 *   (an unused advance, or an overpayment). This matches `usePartyLedgerSummaries`' documented
 *   `billed - paid`, and `use-payables.ts` depends on it: it treats a negative party balance as
 *   an advance the shop owes back.
 *
 * - **Cash book (actual cash).** Money `in` is positive, money `out` is negative — the balance
 *   is how much cash is on hand, which is the opposite question from who owes whom.
 *
 * Both are correct for what they measure. They must not be swapped.
 */

/** The minimum an entry needs to take part in a running balance. */
export interface BalanceEntry {
  date: Date
  debit: number
  credit: number
}

export interface LedgerTotals {
  totalDebit: number
  totalCredit: number
  closingBalance: number
}

/**
 * Sorts oldest-first and stamps each entry with the balance *after* it is applied, using the
 * receivable convention above (`debit - credit`, positive = owed to the shop).
 *
 * The sort is stable on equal timestamps, which matters more than it looks: a bill and its
 * settling payment written in the same batch share a timestamp to the millisecond, and an
 * unstable order would make the intermediate balances flip between renders. `Array.prototype.sort`
 * is guaranteed stable, and the input is copied so a caller's array is never reordered underneath
 * it.
 */
export function withRunningBalance<T extends BalanceEntry>(
  entries: readonly T[]
): (T & { runningBalance: number })[] {
  const ordered = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime())
  let running = 0
  return ordered.map((e) => {
    running += e.debit - e.credit
    return { ...e, runningBalance: running }
  })
}

/** Totals for the ledger footer. Derived from the same rows the table renders, so the footer
 * cannot disagree with the column above it. */
export function ledgerTotals(entries: readonly BalanceEntry[]): LedgerTotals {
  let totalDebit = 0
  let totalCredit = 0
  for (const e of entries) {
    totalDebit += e.debit
    totalCredit += e.credit
  }
  return { totalDebit, totalCredit, closingBalance: totalDebit - totalCredit }
}

/** What one party owes, or is owed, across every job and receipt. Positive = the party owes the
 * shop. Kept as its own function so the list page's summary column and the detail drawer's
 * closing balance are computed by the same code rather than two similar expressions. */
export function partyBalance(billed: number, paid: number): number {
  return billed - paid
}

/** A cash movement. `direction` is the receipt's own field. */
export interface CashEntry {
  date: Date
  amount: number
  direction: 'in' | 'out'
}

export interface CashBookTotals<T> {
  opening: number
  totalCredit: number
  totalDebit: number
  closing: number
  rows: (T & { runningBalance: number })[]
}

/** Cash on hand, in the cash-book convention: `in` adds, `out` subtracts.
 *
 * `opening` is everything strictly before `from`, so narrowing the range from "This Month" to
 * "Today" carries the balance forward instead of restarting at zero — which is how a paper cash
 * book behaves and the only reading that makes the closing figure meaningful. Entries after `to`
 * are excluded entirely rather than folded into either total: a cash book cannot show cash it
 * has not received yet. */
export function cashBook<T extends CashEntry>(
  entries: readonly T[],
  bounds?: { from: Date; to: Date }
): CashBookTotals<T> {
  const signed = (e: CashEntry) => (e.direction === 'in' ? e.amount : -e.amount)
  const ordered = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime())

  let opening = 0
  const inRange: T[] = []
  for (const e of ordered) {
    if (bounds && e.date < bounds.from) opening += signed(e)
    else if (!bounds || e.date <= bounds.to) inRange.push(e)
  }

  let running = opening
  let totalCredit = 0
  let totalDebit = 0
  const rows = inRange.map((e) => {
    if (e.direction === 'in') totalCredit += e.amount
    else totalDebit += e.amount
    running += signed(e)
    return { ...e, runningBalance: running }
  })

  return { opening, totalCredit, totalDebit, closing: running, rows }
}

/** What one job card has actually taken in and paid back out.
 *
 * Computed from the job's own receipts rather than from `JobCardDoc.paidAmount`, which is
 * *already* net of refunds (`useCreateReceiptOrPayment` increments it by a negative amount for
 * an outgoing payment). Reading `paidAmount` as a gross figure and then subtracting refunds from
 * it as well removed them twice and understated every refund the shop owed. Deriving all three
 * numbers from one source also guarantees the row a user reads adds up: received minus refunded
 * is the amount due, on screen and in the totals.
 */
export function jobMoney(receipts: readonly { direction: 'in' | 'out'; amount: number }[]): {
  totalReceived: number
  alreadyRefunded: number
  amountDue: number
} {
  let totalReceived = 0
  let alreadyRefunded = 0
  for (const r of receipts) {
    if (r.direction === 'in') totalReceived += r.amount
    else alreadyRefunded += r.amount
  }
  return { totalReceived, alreadyRefunded, amountDue: totalReceived - alreadyRefunded }
}

/** A receipt, reduced to what a cash-basis revenue figure needs. */
export interface RevenueEntry {
  date: Date
  amount: number
  direction: 'in' | 'out'
  /** Absent on receipts written before Expenses and Supplier Payables existed; all of those are
   * customer money, so `undefined` reads as `'customer'`. */
  kind?: 'customer' | 'expense' | 'supplierPayment'
  voided?: boolean
}

/**
 * Cash-basis net revenue for a period: customer money in, less customer refunds out.
 *
 * Shared by the dashboard's Revenue tile and the Profit & Loss report so the two cannot disagree
 * about the same month. They did: the dashboard summed each job's `paidAmount` over the jobs
 * *created* in the range, which counts a payment in the month the job was opened rather than the
 * month the money arrived — and so both misses payments collected this month against older jobs
 * and includes payments collected later against this month's jobs.
 *
 * A refund is netted off revenue rather than counted as a cost, matching P&L's `netRevenue`:
 * treating it as an expense would overstate revenue and costs by the same amount and flatter
 * gross margin. Money out to a supplier or an operating expense is not revenue at all and is
 * excluded here — those are separate P&L lines.
 */
export function cashRevenue(
  entries: readonly RevenueEntry[],
  bounds?: { from: Date; to: Date }
): number {
  let total = 0
  for (const e of entries) {
    if (e.voided) continue
    if (bounds && (e.date < bounds.from || e.date > bounds.to)) continue
    if (e.direction === 'in') total += e.amount
    else if ((e.kind ?? 'customer') === 'customer') total -= e.amount
  }
  return total
}
