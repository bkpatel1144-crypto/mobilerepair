/**
 * Shared math for every Phase 9 report — kept in one place so "profit," "margin," and "how far a
 * single cost line overran a job's own revenue" mean exactly the same thing on every report page
 * that shows them (Job-wise Profit, Technician Report, Supplier Report, Period Summary).
 */

/** Profit as a % of revenue — the "Margin" column everywhere. `0` for a job with no revenue at
 * all rather than `Infinity`/`NaN`, since a bare "0%" reads sanely in a table cell where those
 * wouldn't. */
export function marginPct(profit: number, revenue: number): number {
  return revenue > 0 ? (profit / revenue) * 100 : 0
}

/** How far one cost line (e.g. a single part's actual cost) overshoots the *whole job's* revenue
 * — Supplier Report's own `↘920.4%`-style annotation (`preview (35)`). Positive means this one
 * line alone already cost more than the job billed; matches the reference's own displayed values
 * exactly (verified: a ₹2,500 part against a ₹245 job computes to 920.4%, not a coincidence). */
export function lineOverrunPct(lineCost: number, jobRevenue: number): number {
  return jobRevenue > 0 ? ((lineCost - jobRevenue) / jobRevenue) * 100 : 0
}

/** `YYYY-MM-DD` grouping key for Period Summary's "Daily" view — plain local-date formatting,
 * not `toISOString()` (which would shift the date at UTC day boundaries away from what the shop's
 * own clock shows). */
export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** `YYYY-MM` grouping key for Period Summary's "Monthly" view. */
export function monthKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}
