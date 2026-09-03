import { useMemo } from 'react'
import { useJobCards, type JobCardWithId } from '@/hooks/use-job-cards'

export type AgingBucket = '0-30' | '30-60' | '60-90' | '90+'

export interface ReceivableRow {
  job: JobCardWithId
  outstanding: number
  daysOld: number
  bucket: AgingBucket
}

export interface ReceivablesData {
  totalOutstanding: number
  totalBilled: number
  totalCollected: number
  collectionPercent: number
  buckets: Record<AgingBucket, number>
  rows: ReceivableRow[]
}

function bucketFor(days: number): AgingBucket {
  if (days <= 30) return '0-30'
  if (days <= 60) return '30-60'
  if (days <= 90) return '60-90'
  return '90+'
}

/** A job counts as an outstanding receivable once it has a real billed amount (estimated, before
 * a final bill, or final once generated) that exceeds what's been paid, and isn't cancelled —
 * a cancelled job's shortfall is a *payable* (a refund the shop may owe back), not money still
 * owed to the shop, so `usePayables` claims that case instead of double-counting it here. */
export function useReceivables() {
  const { data: jobs = [], isLoading } = useJobCards()

  const data = useMemo<ReceivablesData>(() => {
    // `new Date()` here, not the bare `Date.now()` — same value, but the latter is the specific
    // pattern the React Compiler's purity check flags as an impure call during render.
    const now = new Date().getTime()
    const rows: ReceivableRow[] = []
    let totalBilled = 0
    let totalCollected = 0

    for (const job of jobs) {
      if (job.status === 'cancelled' || job.status === 'pendingReturn') continue
      const billed = job.finalAmount ?? job.estimatedCost
      totalBilled += billed
      totalCollected += job.paidAmount
      const outstanding = billed - job.paidAmount
      if (outstanding <= 0) continue
      const created = job.createdAt?.toDate?.()
      const daysOld = created ? Math.floor((now - created.getTime()) / (1000 * 60 * 60 * 24)) : 0
      rows.push({ job, outstanding, daysOld, bucket: bucketFor(daysOld) })
    }

    const buckets: Record<AgingBucket, number> = { '0-30': 0, '30-60': 0, '60-90': 0, '90+': 0 }
    let totalOutstanding = 0
    for (const row of rows) {
      buckets[row.bucket] += row.outstanding
      totalOutstanding += row.outstanding
    }

    return {
      totalOutstanding,
      totalBilled,
      totalCollected,
      collectionPercent: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100,
      buckets,
      rows: rows.sort((a, b) => b.daysOld - a.daysOld),
    }
  }, [jobs])

  return { data, isLoading }
}
