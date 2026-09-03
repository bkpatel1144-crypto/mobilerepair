import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { fieldVisitsCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { useJobCards, type JobCardWithId } from '@/hooks/use-job-cards'
import { useJobCostingList, type JobCostingWithId } from '@/hooks/use-job-costing'
import { marginPct } from '@/lib/reports'
import type { FieldVisitDoc } from '@/types/firestore'

export interface CostedJobRow {
  job: JobCardWithId
  costing: JobCostingWithId
  /** = `costing.billAmount` — the bill amount *as it stood the moment costing was recorded*, not
   * re-read live off the job card, so a job's own `finalAmount` changing later never silently
   * rewrites a past report's numbers. */
  revenue: number
  cost: number
  profit: number
  marginPct: number
  /** The date every profit/cost/margin report groups and filters by — a job only ever gets a
   * `JobCostingDoc` once Closed (see Job Costing's own page), so `closedAt` should always be
   * set; falls back to the costing doc's own `createdAt` for the one theoretical edge case
   * where it somehow isn't, never to "now" (which would wrongly pull a stale job into "today"). */
  date: Date
}

/**
 * The one join every profit-based Phase 9 report (Job-wise Profit, Technician Report, Supplier
 * Report, Period Summary) is built on: `jobCosting` docs (the only place real revenue/cost/profit
 * numbers exist — an un-costed job has neither) cross-referenced against `jobCards` for
 * descriptive fields (customer, device, assigned technician). Fetch-once-and-compute-client-side,
 * same convention as every other report/list hook in this app at this data volume.
 */
export function useCostedJobs() {
  const jobsQuery = useJobCards()
  const costingQuery = useJobCostingList()

  const data = useMemo<CostedJobRow[]>(() => {
    const jobs = jobsQuery.data ?? []
    const costings = costingQuery.data ?? []
    const jobById = new Map(jobs.map((j) => [j.id, j]))
    const now = new Date()

    const rows: CostedJobRow[] = []
    for (const costing of costings) {
      const job = jobById.get(costing.jobId)
      if (!job) continue // a costing doc whose job was somehow removed — nothing to report against
      const revenue = costing.billAmount
      const cost = costing.totalCost
      const profit = costing.profit
      const date = job.closedAt?.toDate?.() ?? costing.createdAt?.toDate?.() ?? now
      rows.push({ job, costing, revenue, cost, profit, marginPct: marginPct(profit, revenue), date })
    }
    return rows
  }, [jobsQuery.data, costingQuery.data])

  return { data, isLoading: jobsQuery.isLoading || costingQuery.isLoading }
}

export interface FieldVisitWithId extends FieldVisitDoc {
  id: string
}

export function fieldVisitsQueryKey(companyId: string | undefined) {
  return ['fieldVisits', companyId] as const
}

/** Whole-collection fetch, sorted client-side — same "small data volume, compute client-side"
 * convention as every other list hook, and the same not-a-server-`orderBy()` reasoning as
 * `use-audit-log.ts`: a visit logged moments ago (routinely true right after this exact action)
 * would otherwise be briefly invisible in its own report while its `createdAt` is still
 * server-timestamp-pending. */
export function useFieldVisits() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: fieldVisitsQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, fieldVisitsCollection(companyId!)))
      const now = new Date().getTime()
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as FieldVisitDoc) }))
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId,
  })
}
