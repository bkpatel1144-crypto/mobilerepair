import { useMemo } from 'react'
import { useJobCards, type JobCardWithId } from '@/hooks/use-job-cards'
import { useReceipts } from '@/hooks/use-receipts'
import { useParties, type PartyWithId } from '@/hooks/use-parties'

export interface PartyLedgerSummary {
  party: PartyWithId
  jobsCount: number
  billed: number
  paid: number
  balance: number // billed - paid; positive = customer still owes, negative = shop owes (Cr)
}

/** One row of a party's own "khata" statement — `preview (65)`'s own three particular kinds:
 * Job Card Created (informational, never moves the balance), Advance/Payment Received (credit),
 * Bill Generated (debit). Derived entirely from `jobCards` + `receipts` already fetched
 * elsewhere in the app — no separate ledger-entries collection to keep in sync. */
export interface LedgerRow {
  id: string
  date: Date
  kind: 'jobCreated' | 'paymentReceived' | 'billGenerated'
  title: string
  description: string
  jobCardId: string | null
  jobCardNumber: string | null
  debit: number
  credit: number
  runningBalance: number
}

function deviceLabel(job: JobCardWithId) {
  return [job.brandName, job.model].filter(Boolean).join(' ') || job.deviceTypeName || 'Device'
}

/** Every job card + receipt for one party, merged into a chronological ledger with a running
 * balance — a positive balance means the customer still owes the shop; a negative balance
 * ("Cr" in the UI) means the shop is holding more than it's billed (an advance not yet used, or
 * an overpayment). "Bill Generated" uses the job's own `updatedAt` as the bill date — this app
 * doesn't record a separate `billGeneratedAt` timestamp, so it's the closest real timestamp
 * available rather than a fabricated one. */
export function usePartyLedgerDetail(partyId: string | undefined) {
  const { data: jobs = [], isLoading: jobsLoading } = useJobCards()
  const { data: receipts = [], isLoading: receiptsLoading } = useReceipts()
  const { data: parties = [], isLoading: partiesLoading } = useParties()

  const data = useMemo(() => {
    if (!partyId) return null
    const party = parties.find((p) => p.id === partyId)
    if (!party) return null

    const partyJobs = jobs.filter((j) => j.customerId === partyId)
    const partyReceipts = receipts.filter((r) => r.partyId === partyId && !r.voided)

    const events: Omit<LedgerRow, 'runningBalance'>[] = []

    for (const job of partyJobs) {
      const created = job.createdAt?.toDate?.()
      if (created) {
        events.push({
          id: `job-${job.id}`,
          date: created,
          kind: 'jobCreated',
          title: 'Job Card Created',
          description: `${deviceLabel(job)} · Est: ₹${job.estimatedCost}`,
          jobCardId: job.id,
          jobCardNumber: job.jobNumber,
          debit: 0,
          credit: 0,
        })
      }
      if (job.finalAmount != null) {
        const billedAt = job.updatedAt?.toDate?.() ?? created
        if (billedAt) {
          events.push({
            id: `bill-${job.id}`,
            date: billedAt,
            kind: 'billGenerated',
            title: 'Bill Generated',
            description: `${deviceLabel(job)} (Final: ₹${job.finalAmount})`,
            jobCardId: job.id,
            jobCardNumber: job.jobNumber,
            debit: job.finalAmount,
            credit: 0,
          })
        }
      }
    }

    for (const r of partyReceipts) {
      const at = r.createdAt?.toDate?.()
      if (!at) continue
      events.push({
        id: `receipt-${r.id}`,
        date: at,
        kind: 'paymentReceived',
        title: r.purpose === 'advance' ? 'Advance Received' : 'Payment Received',
        description: `${r.jobCardNumber ?? 'Manual entry'} · ${r.mode.toUpperCase()} · ${r.receiptNumber}`,
        jobCardId: r.jobCardId,
        jobCardNumber: r.jobCardNumber,
        debit: r.direction === 'out' ? r.amount : 0,
        credit: r.direction === 'in' ? r.amount : 0,
      })
    }

    events.sort((a, b) => a.date.getTime() - b.date.getTime())

    let running = 0
    const rows: LedgerRow[] = events.map((e) => {
      running += e.credit - e.debit
      return { ...e, runningBalance: running }
    })

    const totalBilled = rows.reduce((sum, r) => sum + r.debit, 0)
    const totalPaid = rows.reduce((sum, r) => sum + r.credit, 0)

    return { party, rows, totalBilled, totalPaid, closingBalance: running }
  }, [partyId, jobs, receipts, parties])

  return { data, isLoading: jobsLoading || receiptsLoading || partiesLoading }
}

/** The Party Ledger *list* page's own summary row per party — same underlying data as the
 * detail view above, just aggregated instead of itemized. */
export function usePartyLedgerSummaries() {
  const { data: jobs = [], isLoading: jobsLoading } = useJobCards()
  const { data: receipts = [], isLoading: receiptsLoading } = useReceipts()
  const { data: parties = [], isLoading: partiesLoading } = useParties()

  const data = useMemo<PartyLedgerSummary[]>(() => {
    return parties
      .map((party) => {
        const partyJobs = jobs.filter((j) => j.customerId === party.id)
        const partyReceipts = receipts.filter((r) => r.partyId === party.id && !r.voided)
        const billed = partyJobs.reduce((sum, j) => sum + (j.finalAmount ?? 0), 0)
        const paid = partyReceipts.reduce(
          (sum, r) => sum + (r.direction === 'in' ? r.amount : -r.amount),
          0
        )
        return {
          party,
          jobsCount: partyJobs.length,
          billed,
          paid,
          balance: billed - paid,
        }
      })
      .filter((s) => s.jobsCount > 0 || s.paid !== 0)
  }, [parties, jobs, receipts])

  return { data, isLoading: jobsLoading || receiptsLoading || partiesLoading }
}
