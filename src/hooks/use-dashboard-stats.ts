import { useMemo } from 'react'
import { useJobCards } from '@/hooks/use-job-cards'
import { dateRangeBounds, formatDurationLabel } from '@/lib/date-range'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import type { DateRangeKey } from '@/components/shared/filter-bar'

export interface DashboardStats {
  totalJobCards: number
  totalInPipeline: number
  allJobCards: number
  revenue: number
  outstanding: number
  inProgress: number
  pending: number
  avgTurnaroundLabel: string | null
  cancelled: number
  inQueue: number
  onHold: number
  techDone: number
  ready: number
  delivered: number
  closed: number
  pendingReturn: number
  jobCardsByStatus: { status: string; count: number }[]
  revenueTrend: { date: string; revenue: number }[]
}

const ACTIVE_STATUSES = ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone', 'ready']

/** Every tile, and both charts, computed for real off the same `jobCards` list every other
 * Service page already reads (`useJobCards`) — no separate aggregation collection needed at
 * this data volume. Replaces the Phase-1 all-zero stub now that Job Cards (Phase 5) is real. */
export function useDashboardStats(
  range: DateRangeKey | 'all' = 'all',
  customFrom?: string,
  customTo?: string
) {
  const { data: allJobs = [], isLoading } = useJobCards()

  const data = useMemo<DashboardStats>(() => {
    const bounds = dateRangeBounds(range, customFrom, customTo)
    const jobsInRange = bounds
      ? allJobs.filter((j) => {
          const created = j.createdAt?.toDate?.()
          return !!created && created >= bounds.from && created <= bounds.to
        })
      : allJobs

    const countBy = (status: string) => jobsInRange.filter((j) => j.status === status).length

    const revenue = jobsInRange.reduce((sum, j) => sum + (j.paidAmount ?? 0), 0)
    const outstanding = jobsInRange.reduce((sum, j) => {
      const due = (j.finalAmount ?? j.estimatedCost ?? 0) - (j.paidAmount ?? 0)
      return sum + (due > 0 ? due : 0)
    }, 0)

    const turnarounds: number[] = []
    for (const j of jobsInRange) {
      const end = j.closedAt?.toDate?.() ?? j.deliveredAt?.toDate?.()
      const start = j.createdAt?.toDate?.()
      if (end && start) turnarounds.push(end.getTime() - start.getTime())
    }
    const avgTurnaroundLabel = turnarounds.length
      ? formatDurationLabel(turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length)
      : null

    const jobCardsByStatus = JOB_STATUSES.map((s) => ({ status: s.label, count: countBy(s.key) })).filter(
      (s) => s.count > 0
    )

    // Revenue trend: bucket paid amounts by day across the jobs actually in range (falls back to
    // each job's own createdAt day when range is 'all', so "All Time" still draws a real trend).
    const byDay = new Map<string, number>()
    for (const j of jobsInRange) {
      const created = j.createdAt?.toDate?.()
      if (!created || !j.paidAmount) continue
      const key = created.toISOString().slice(0, 10)
      byDay.set(key, (byDay.get(key) ?? 0) + j.paidAmount)
    }
    const revenueTrend = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rev]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: rev,
      }))

    return {
      totalJobCards: jobsInRange.length,
      totalInPipeline: jobsInRange.filter((j) => ACTIVE_STATUSES.includes(j.status)).length,
      allJobCards: allJobs.length,
      revenue,
      outstanding,
      inProgress: countBy('inProgress'),
      pending: countBy('pending'),
      avgTurnaroundLabel,
      cancelled: countBy('cancelled'),
      inQueue: countBy('inQueue'),
      onHold: countBy('onHold'),
      techDone: countBy('techDone'),
      ready: countBy('ready'),
      delivered: countBy('delivered'),
      closed: countBy('closed'),
      pendingReturn: countBy('pendingReturn'),
      jobCardsByStatus,
      revenueTrend,
    }
  }, [allJobs, range, customFrom, customTo])

  return { data, isLoading }
}
