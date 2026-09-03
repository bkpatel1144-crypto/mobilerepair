import { useMemo } from 'react'
import { useJobCards, type JobCardWithId } from '@/hooks/use-job-cards'
import { useReceipts } from '@/hooks/use-receipts'
import { usePartyLedgerSummaries } from '@/hooks/use-party-ledger'

export interface PayableRow {
  job: JobCardWithId
  totalReceived: number
  alreadyRefunded: number
  amountDue: number
  kind: 'refundDue' | 'unusedAdvance'
}

export interface PayablesData {
  totalPayable: number
  refundDueTotal: number
  unusedAdvanceTotal: number
  advanceCreditTotal: number
  rows: PayableRow[]
}

/**
 * This app has no supplier-purchase flow yet (that's Phase 7+), so "Payables" here is the
 * customer-side money the shop is holding that isn't confirmed revenue — exactly what
 * BUILD_PLAN's own "Refund Due / Unused Advance / Advance Credit" card set describes, not a
 * traditional accounts-payable-to-suppliers screen:
 *  - Refund Due: a *cancelled/returned* job where money was collected (advance or otherwise)
 *    and hasn't been fully refunded yet — a real amount the shop now owes back.
 *  - Unused Advance: an *active, not-yet-billed* job holding a paid amount that isn't yet
 *    recognized against a final bill — not owed back, just not yet earned.
 *  - Advance Credit: a party whose combined ledger balance across every job is negative (paid
 *    more overall than billed) — `usePartyLedgerSummaries`' own "Cr" balance, surfaced here as
 *    its own total rather than recomputed a second way.
 */
export function usePayables() {
  const { data: jobs = [], isLoading: jobsLoading } = useJobCards()
  const { data: receipts = [], isLoading: receiptsLoading } = useReceipts()
  const { data: partySummaries, isLoading: summariesLoading } = usePartyLedgerSummaries()

  const data = useMemo<PayablesData>(() => {
    const rows: PayableRow[] = []

    for (const job of jobs) {
      const refundsIssued = receipts
        .filter((r) => r.jobCardId === job.id && r.direction === 'out' && !r.voided)
        .reduce((sum, r) => sum + r.amount, 0)

      if (job.status === 'cancelled' || job.status === 'pendingReturn') {
        const amountDue = job.paidAmount - refundsIssued
        if (amountDue > 0) {
          rows.push({ job, totalReceived: job.paidAmount, alreadyRefunded: refundsIssued, amountDue, kind: 'refundDue' })
        }
      } else if (job.finalAmount == null && job.paidAmount > 0) {
        rows.push({
          job,
          totalReceived: job.paidAmount,
          alreadyRefunded: refundsIssued,
          amountDue: job.paidAmount - refundsIssued,
          kind: 'unusedAdvance',
        })
      }
    }

    const refundDueTotal = rows.filter((r) => r.kind === 'refundDue').reduce((s, r) => s + r.amountDue, 0)
    const unusedAdvanceTotal = rows.filter((r) => r.kind === 'unusedAdvance').reduce((s, r) => s + r.amountDue, 0)
    const advanceCreditTotal = partySummaries
      .filter((s) => s.balance < 0)
      .reduce((sum, s) => sum + Math.abs(s.balance), 0)

    return {
      totalPayable: refundDueTotal + unusedAdvanceTotal,
      refundDueTotal,
      unusedAdvanceTotal,
      advanceCreditTotal,
      rows: rows.sort((a, b) => b.amountDue - a.amountDue),
    }
  }, [jobs, receipts, partySummaries])

  return { data, isLoading: jobsLoading || receiptsLoading || summariesLoading }
}
