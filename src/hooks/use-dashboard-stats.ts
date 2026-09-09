import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useJobCards } from '@/hooks/use-job-cards'
import { useReceipts } from '@/hooks/use-receipts'
import { dateRangeBounds, formatDurationLabel } from '@/lib/date-range'
import { cashRevenue } from '@/lib/ledger-math'
import { dayKey } from '@/lib/reports'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import type { DateRangeKey } from '@/components/shared/filter-bar'

/** One row of the Recent Job Cards widget — only what the row renders, so the widget does not
 *  hold on to ten whole job documents. */
export interface RecentJobCard {
  id: string
  jobNumber: string
  customerName: string
  device: string | null
  status: string
  statusLabel: string
  amount: number
  createdLabel: string | null
}

export interface DashboardStats {
  /** Every job card the company has, ignoring the date filter — `kpi.jobcards.total`. */
  totalJobCards: number
  /** Job cards created inside the selected range — `kpi.jobcards.today`. */
  periodJobCards: number
  totalInPipeline: number
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
  jobCardTrend: { date: string; count: number }[]
  jobsByTechnician: { name: string; count: number }[]
  recentJobCards: RecentJobCard[]
}

const ACTIVE_STATUSES = ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone', 'ready']

/** How many technicians the workload chart plots before the rest are folded into "Others". */
const TECHNICIAN_CHART_LIMIT = 8
/** Rows in the Recent Job Cards widget. The reference's own description says "Latest 10". */
const RECENT_JOB_CARD_LIMIT = 10
/** Days both trend charts cover when no date range is chosen — the reference describes them as
 *  "over last 30 days", and an unbounded chart on a shop with two years of history is unreadable
 *  rather than informative. A chosen range is honoured in full instead of being clipped to this. */
const TREND_DAYS = 30

/** `2026-09-09` -> `09 Sep`, in local time. Splits the key rather than `new Date(key)`, which
 *  parses as UTC midnight and can render the previous day once formatted locally. */
function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

/** Every tile, and both charts, computed for real off the same `jobCards` list every other
 * Service page already reads (`useJobCards`) — no separate aggregation collection needed at
 * this data volume. Replaces the Phase-1 all-zero stub now that Job Cards (Phase 5) is real. */
export function useDashboardStats(
  range: DateRangeKey | 'all' = 'all',
  customFrom?: string,
  customTo?: string
) {
  const { t } = useTranslation()
  // Resolved here rather than at the call site because these two land *inside* chart data, where
  // a raw key would be plotted as an axis label.
  const unassignedLabel = t('shared.unassigned')
  const othersLabel = t('common.others')
  const { data: allJobs = [], isLoading, error, refetch } = useJobCards()
  const {
    data: allReceipts = [],
    isLoading: receiptsLoading,
    error: receiptsError,
    refetch: refetchReceipts,
  } = useReceipts()

  const data = useMemo<DashboardStats>(() => {
    const bounds = dateRangeBounds(range, customFrom, customTo)
    const jobsInRange = bounds
      ? allJobs.filter((j) => {
          const created = j.createdAt?.toDate?.()
          return !!created && created >= bounds.from && created <= bounds.to
        })
      : allJobs

    const countBy = (status: string) => jobsInRange.filter((j) => j.status === status).length

    const receiptEntries = allReceipts.flatMap((r) => {
      const date = r.createdAt?.toDate?.()
      return date ? [{ ...r, date }] : []
    })
    const revenue = cashRevenue(receiptEntries, bounds ?? undefined)
    // Deliberately over `allJobs`, not `jobsInRange`. This and the pipeline count below are
    // point-in-time balances: money still owed is owed whichever month the job was booked in, and
    // a job still in the pipeline is still in it. Filtering them by the range answered a question
    // nobody asks - "what was outstanding on work booked this week" - and read as 0 the moment a
    // shopkeeper clicked Today, which looks like the books are clear when they are not. The
    // widget catalogue states this outright: "point-in-time, NOT date-filtered".
    const outstanding = allJobs.reduce((sum, j) => {
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

    const jobCardsByStatus = JOB_STATUSES.map((s) => ({
      status: s.label,
      count: countBy(s.key),
    })).filter((s) => s.count > 0)

    // Revenue trend: bucketed by the day each payment was received, for the same reason the tile
    // above is. Keyed with `dayKey` rather than `toISOString().slice(0, 10)` — that formats in
    // UTC, so a payment taken at 11pm local time was plotted on the following day.
    const byDay = new Map<string, number>()
    for (const e of receiptEntries) {
      if (e.voided) continue
      if (bounds && (e.date < bounds.from || e.date > bounds.to)) continue
      const signed =
        e.direction === 'in' ? e.amount : (e.kind ?? 'customer') === 'customer' ? -e.amount : 0
      if (signed === 0) continue
      const key = dayKey(e.date)
      byDay.set(key, (byDay.get(key) ?? 0) + signed)
    }
    const revenueDays = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
    const revenueTrend = (bounds ? revenueDays : revenueDays.slice(-TREND_DAYS)).map(
      ([key, rev]) => ({ date: dayLabel(key), revenue: rev })
    )

    // Job cards created per day - the counterpart of the revenue line, windowed the same way.
    const jobsPerDay = new Map<string, number>()
    for (const j of jobsInRange) {
      const created = j.createdAt?.toDate?.()
      if (!created) continue
      const key = dayKey(created)
      jobsPerDay.set(key, (jobsPerDay.get(key) ?? 0) + 1)
    }
    const jobDays = [...jobsPerDay.entries()].sort(([a], [b]) => a.localeCompare(b))
    const jobCardTrend = (bounds ? jobDays : jobDays.slice(-TREND_DAYS)).map(([key, count]) => ({
      date: dayLabel(key),
      count,
    }))

    // Workload per technician. Unassigned jobs get their own bar rather than being dropped - a
    // pile of unassigned work is the single most useful thing this chart can show.
    const perTechnician = new Map<string, number>()
    for (const j of jobsInRange) {
      const name = j.assignedToName?.trim() || unassignedLabel
      perTechnician.set(name, (perTechnician.get(name) ?? 0) + 1)
    }
    const ranked = [...perTechnician.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    const jobsByTechnician = ranked.slice(0, TECHNICIAN_CHART_LIMIT)
    const spilled = ranked.slice(TECHNICIAN_CHART_LIMIT)
    if (spilled.length) {
      jobsByTechnician.push({
        name: othersLabel,
        count: spilled.reduce((sum, r) => sum + r.count, 0),
      })
    }

    // `allJobs` arrives newest-first from `useJobCards`, so the latest ten is a slice. Not
    // range-filtered: "Recent Job Cards" means recent, and clicking Today on a quiet morning
    // should not empty the one widget that says what just came through the door.
    const recentJobCards: RecentJobCard[] = allJobs.slice(0, RECENT_JOB_CARD_LIMIT).map((j) => ({
      id: j.id,
      jobNumber: j.jobNumber,
      customerName: j.customerName,
      device: [j.brandName, j.model].filter(Boolean).join(' ') || j.deviceTypeName || null,
      status: j.status,
      statusLabel: JOB_STATUSES.find((s) => s.key === j.status)?.label ?? j.status,
      amount: j.finalAmount ?? j.estimatedCost ?? 0,
      createdLabel: j.createdAt?.toDate?.() ? dayLabel(dayKey(j.createdAt.toDate())) : null,
    }))

    return {
      totalJobCards: allJobs.length,
      periodJobCards: jobsInRange.length,
      totalInPipeline: allJobs.filter((j) => ACTIVE_STATUSES.includes(j.status)).length,
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
      jobCardTrend,
      jobsByTechnician,
      recentJobCards,
    }
  }, [allJobs, allReceipts, range, customFrom, customTo, unassignedLabel, othersLabel])

  return {
    data,
    isLoading: isLoading || receiptsLoading,
    error: error ?? receiptsError,
    refetch: () => Promise.all([refetch(), refetchReceipts()]),
  }
}
