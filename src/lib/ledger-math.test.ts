import { describe, it, expect } from 'vitest'
import {
  withRunningBalance,
  ledgerTotals,
  partyBalance,
  cashBook,
  jobMoney,
  cashRevenue,
} from './ledger-math'

const d = (iso: string) => new Date(iso)

/** A billed job, in ledger terms. */
const bill = (iso: string, amount: number) => ({ date: d(iso), debit: amount, credit: 0 })
/** A payment from the customer. */
const paid = (iso: string, amount: number) => ({ date: d(iso), debit: 0, credit: amount })

describe('withRunningBalance', () => {
  it('leaves a customer who has paid nothing owing the full billed amount', () => {
    const [row] = withRunningBalance([bill('2026-04-01', 1000)])
    // Positive = owed *to the shop*. This is the assertion the old `credit - debit` failed: it
    // reported -1000, which the ledger table renders as "₹1000 Cr" — the shop owing the
    // customer, the exact opposite of the truth.
    expect(row.runningBalance).toBe(1000)
  })

  it('settles to zero when the payment matches the bill', () => {
    const rows = withRunningBalance([bill('2026-04-01', 1000), paid('2026-04-02', 1000)])
    expect(rows.map((r) => r.runningBalance)).toEqual([1000, 0])
  })

  it('goes negative when the customer has paid an advance against nothing billed yet', () => {
    const [row] = withRunningBalance([paid('2026-04-01', 500)])
    // Negative is the "Cr" case use-payables.ts looks for to list an advance owed back.
    expect(row.runningBalance).toBe(-500)
  })

  it('carries the balance across a part-payment', () => {
    const rows = withRunningBalance([
      bill('2026-04-01', 1200),
      paid('2026-04-05', 500),
      paid('2026-04-09', 300),
    ])
    expect(rows.map((r) => r.runningBalance)).toEqual([1200, 700, 400])
  })

  it('orders by date, not by the order events were collected', () => {
    // Job cards and receipts are gathered in separate loops, so the input is never chronological.
    const rows = withRunningBalance([paid('2026-04-05', 400), bill('2026-04-01', 1000)])
    expect(rows.map((r) => r.debit)).toEqual([1000, 0])
    expect(rows.map((r) => r.runningBalance)).toEqual([1000, 600])
  })

  it('keeps a bill and its same-millisecond payment in input order', () => {
    // A bill and its settling receipt written in one batch share a timestamp exactly. The order
    // must be stable or the intermediate balance flips between renders.
    const sameMoment = '2026-04-01T10:00:00.000Z'
    const rows = withRunningBalance([bill(sameMoment, 700), paid(sameMoment, 700)])
    expect(rows.map((r) => r.runningBalance)).toEqual([700, 0])
  })

  it('does not reorder the caller’s array', () => {
    const input = [paid('2026-04-05', 100), bill('2026-04-01', 100)]
    withRunningBalance(input)
    expect(input[0].credit).toBe(100)
  })

  it('has no rows and no balance for a party with no history', () => {
    expect(withRunningBalance([])).toEqual([])
  })
})

describe('ledgerTotals', () => {
  it('agrees with the last running balance', () => {
    const entries = [bill('2026-04-01', 1200), paid('2026-04-05', 500)]
    const rows = withRunningBalance(entries)
    const totals = ledgerTotals(entries)
    // The footer and the last row of the Balance column are read together on screen; if these
    // two ever disagree the statement is self-contradictory.
    expect(totals.closingBalance).toBe(rows[rows.length - 1].runningBalance)
    expect(totals).toEqual({ totalDebit: 1200, totalCredit: 500, closingBalance: 700 })
  })

  it('ignores informational rows that move neither side', () => {
    // "Job Card Created" is a real ledger row with debit 0 and credit 0.
    const totals = ledgerTotals([
      { date: d('2026-04-01'), debit: 0, credit: 0 },
      bill('2026-04-02', 900),
    ])
    expect(totals).toEqual({ totalDebit: 900, totalCredit: 0, closingBalance: 900 })
  })

  it('is zero across the board for an empty ledger', () => {
    expect(ledgerTotals([])).toEqual({ totalDebit: 0, totalCredit: 0, closingBalance: 0 })
  })
})

describe('partyBalance', () => {
  it('matches the itemised ledger it summarises', () => {
    const entries = [bill('2026-04-01', 1200), paid('2026-04-05', 500)]
    const { totalDebit, totalCredit, closingBalance } = ledgerTotals(entries)
    // The list page shows partyBalance(); the drawer shows closingBalance. Same party, same
    // number — this is the pair that was inverted relative to each other.
    expect(partyBalance(totalDebit, totalCredit)).toBe(closingBalance)
  })

  it('is negative when the party has overpaid', () => {
    expect(partyBalance(500, 800)).toBe(-300)
  })
})

const cashIn = (iso: string, amount: number) => ({ date: d(iso), amount, direction: 'in' as const })
const cashOut = (iso: string, amount: number) => ({
  date: d(iso),
  amount,
  direction: 'out' as const,
})

describe('cashBook', () => {
  it('adds money in and subtracts money out', () => {
    const book = cashBook([cashIn('2026-04-01', 5000), cashOut('2026-04-02', 1200)])
    expect(book.rows.map((r) => r.runningBalance)).toEqual([5000, 3800])
    expect(book.closing).toBe(3800)
    expect(book.totalCredit).toBe(5000)
    expect(book.totalDebit).toBe(1200)
  })

  it('opens with everything before the range instead of restarting at zero', () => {
    const book = cashBook(
      [cashIn('2026-04-01', 5000), cashOut('2026-04-02', 1200), cashIn('2026-04-10', 800)],
      { from: d('2026-04-05'), to: d('2026-04-30') }
    )
    // A paper cash book carries yesterday's closing forward as today's opening.
    expect(book.opening).toBe(3800)
    expect(book.rows).toHaveLength(1)
    expect(book.closing).toBe(4600)
  })

  it('leaves entries after the range out of every total', () => {
    const book = cashBook([cashIn('2026-04-01', 100), cashIn('2026-05-01', 999)], {
      from: d('2026-04-01'),
      to: d('2026-04-30'),
    })
    // Cash the shop has not received yet is not on hand, and it is not opening balance either.
    expect(book.opening).toBe(0)
    expect(book.closing).toBe(100)
    expect(book.totalCredit).toBe(100)
  })

  it('counts an entry exactly on each boundary as in range', () => {
    const bounds = { from: d('2026-04-01T00:00:00.000Z'), to: d('2026-04-30T23:59:59.999Z') }
    const book = cashBook(
      [cashIn('2026-04-01T00:00:00.000Z', 10), cashIn('2026-04-30T23:59:59.999Z', 20)],
      bounds
    )
    expect(book.rows).toHaveLength(2)
    expect(book.closing).toBe(30)
  })

  it('can go negative — the shop can pay out more than it took in', () => {
    const book = cashBook([cashOut('2026-04-01', 700)])
    expect(book.closing).toBe(-700)
  })

  it('is all zeroes with no entries', () => {
    expect(cashBook([])).toEqual({
      opening: 0,
      totalCredit: 0,
      totalDebit: 0,
      closing: 0,
      rows: [],
    })
  })

  it('does not confuse the receivable convention for the cash one', () => {
    // Billing a customer ₹1000 leaves them owing ₹1000 (positive, ledger) while the shop's cash
    // is unchanged. Paying a supplier ₹1000 leaves cash at -₹1000 (negative, cash book). The two
    // signs answer different questions and swapping them was the bug this file exists to prevent.
    expect(withRunningBalance([bill('2026-04-01', 1000)])[0].runningBalance).toBe(1000)
    expect(cashBook([cashOut('2026-04-01', 1000)]).closing).toBe(-1000)
  })
})

const rIn = (amount: number) => ({ direction: 'in' as const, amount })
const rOut = (amount: number) => ({ direction: 'out' as const, amount })

describe('jobMoney', () => {
  it('reports the full advance as due when nothing has been refunded', () => {
    expect(jobMoney([rIn(1000)])).toEqual({
      totalReceived: 1000,
      alreadyRefunded: 0,
      amountDue: 1000,
    })
  })

  it('takes a partial refund off exactly once', () => {
    // The bug: Payables read `job.paidAmount` (already ₹600 after the refund) as the gross
    // received and subtracted the ₹400 again, reporting ₹200 owed instead of ₹600.
    expect(jobMoney([rIn(1000), rOut(400)])).toEqual({
      totalReceived: 1000,
      alreadyRefunded: 400,
      amountDue: 600,
    })
  })

  it('leaves nothing due once the advance is fully refunded', () => {
    expect(jobMoney([rIn(1000), rOut(1000)]).amountDue).toBe(0)
  })

  it('goes negative on an over-refund so the caller can reject the row', () => {
    // Payables drops any row with `amountDue <= 0`. Surfacing the negative rather than clamping
    // it keeps that decision at the call site, where the ₹0 case is dropped for the same reason.
    expect(jobMoney([rIn(500), rOut(800)]).amountDue).toBe(-300)
  })

  it('adds up multiple payments and multiple refunds', () => {
    expect(jobMoney([rIn(500), rIn(300), rOut(100), rOut(50)])).toEqual({
      totalReceived: 800,
      alreadyRefunded: 150,
      amountDue: 650,
    })
  })

  it('always has received minus refunded equal to the amount due', () => {
    // The three numbers appear on one row on screen; a user checking the arithmetic must find
    // it correct.
    const m = jobMoney([rIn(1000), rIn(250), rOut(400)])
    expect(m.totalReceived - m.alreadyRefunded).toBe(m.amountDue)
  })

  it('is all zeroes for a job with no receipts', () => {
    expect(jobMoney([])).toEqual({ totalReceived: 0, alreadyRefunded: 0, amountDue: 0 })
  })
})

describe('cashRevenue', () => {
  const paidIn = (iso: string, amount: number) => ({
    date: d(iso),
    amount,
    direction: 'in' as const,
  })

  it('sums customer money received', () => {
    expect(cashRevenue([paidIn('2026-04-01', 1000), paidIn('2026-04-02', 500)])).toBe(1500)
  })

  it('nets a customer refund off revenue rather than counting it as a cost', () => {
    // Treating a refund as an expense would overstate revenue and costs by the same amount and
    // flatter gross margin — this is what makes it a subtraction here.
    expect(cashRevenue([paidIn('2026-04-01', 1000), { ...cashOut('2026-04-02', 300) }])).toBe(700)
  })

  it('treats a receipt with no `kind` as customer money', () => {
    // Receipts written before Expenses and Supplier Payables existed have no `kind`, and every
    // one of them is a job advance, final payment or refund.
    const legacyRefund = { date: d('2026-04-02'), amount: 300, direction: 'out' as const }
    expect(cashRevenue([paidIn('2026-04-01', 1000), legacyRefund])).toBe(700)
  })

  it('excludes an operating expense from revenue entirely', () => {
    const expense = {
      date: d('2026-04-02'),
      amount: 300,
      direction: 'out' as const,
      kind: 'expense' as const,
    }
    expect(cashRevenue([paidIn('2026-04-01', 1000), expense])).toBe(1000)
  })

  it('excludes a supplier payment from revenue entirely', () => {
    const supplier = {
      date: d('2026-04-02'),
      amount: 300,
      direction: 'out' as const,
      kind: 'supplierPayment' as const,
    }
    expect(cashRevenue([paidIn('2026-04-01', 1000), supplier])).toBe(1000)
  })

  it('ignores voided receipts', () => {
    expect(
      cashRevenue([paidIn('2026-04-01', 1000), { ...paidIn('2026-04-02', 500), voided: true }])
    ).toBe(1000)
  })

  it('attributes revenue to the day the money arrived, not the day the job opened', () => {
    // The dashboard used to sum each job's paidAmount over jobs *created* in the range, so a
    // payment collected in May against an April job counted as April revenue — and disagreed
    // with the P&L for the same month.
    const april = { from: d('2026-04-01'), to: d('2026-04-30T23:59:59.999Z') }
    const entries = [paidIn('2026-04-10', 1000), paidIn('2026-05-05', 700)]
    expect(cashRevenue(entries, april)).toBe(1000)
    expect(cashRevenue(entries)).toBe(1700)
  })

  it('counts entries exactly on each boundary', () => {
    const bounds = { from: d('2026-04-01T00:00:00.000Z'), to: d('2026-04-30T23:59:59.999Z') }
    expect(
      cashRevenue(
        [paidIn('2026-04-01T00:00:00.000Z', 10), paidIn('2026-04-30T23:59:59.999Z', 20)],
        bounds
      )
    ).toBe(30)
  })

  it('is zero with no receipts', () => {
    expect(cashRevenue([])).toBe(0)
  })
})
