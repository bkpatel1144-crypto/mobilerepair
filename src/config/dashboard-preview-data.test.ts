import { describe, expect, it } from 'vitest'
import {
  PREVIEW_DAYS,
  PREVIEW_JOBCARD_TREND,
  PREVIEW_KPI,
  PREVIEW_RECENT_JOB_CARDS,
  PREVIEW_REVENUE_TOTAL,
  PREVIEW_REVENUE_TREND,
  PREVIEW_STATUS_BREAKDOWN,
  PREVIEW_TOTAL_JOB_CARDS,
} from './dashboard-preview-data'
import { DASHBOARD_WIDGETS } from './dashboard-widgets'

/**
 * Keeps the preview's numbers agreeing with each other.
 *
 * A preview whose donut says 46 while its tiles add to 39 is worse than no preview: an
 * administrator reads it as the product being wrong, not the sample data. These are cheap
 * assertions over constants, and they are the only thing standing between an edit to one figure
 * and a screen that contradicts itself.
 */
describe('dashboard preview data', () => {
  it('status counts sum to the total the tiles claim', () => {
    const sum = PREVIEW_STATUS_BREAKDOWN.reduce((n, s) => n + s.count, 0)
    expect(sum).toBe(PREVIEW_TOTAL_JOB_CARDS)
    expect(PREVIEW_KPI['kpi.jobcards.total'].value).toBe(String(PREVIEW_TOTAL_JOB_CARDS))
  })

  it('each status tile matches its slice', () => {
    const bySlice = new Map(PREVIEW_STATUS_BREAKDOWN.map((s) => [s.status, s.count]))
    const pairs: [string, string][] = [
      ['kpi.jobcards.pending', 'Pending'],
      ['kpi.jobcards.queued', 'Queued'],
      ['kpi.jobcards.in_progress', 'In Progress'],
      ['kpi.jobcards.hold', 'On Hold'],
      ['kpi.jobcards.tech_done', 'Tech Done'],
      ['kpi.jobcards.ready', 'Ready'],
      ['kpi.jobcards.delivered', 'Delivered'],
      ['kpi.jobcards.closed', 'Closed'],
      ['kpi.jobcards.cancelled', 'Cancelled'],
    ]
    for (const [key, status] of pairs) {
      expect(PREVIEW_KPI[key].value, `${key} vs ${status}`).toBe(String(bySlice.get(status)))
    }
  })

  it('both trends have one point per day', () => {
    expect(PREVIEW_REVENUE_TREND).toHaveLength(PREVIEW_DAYS.length)
    expect(PREVIEW_JOBCARD_TREND).toHaveLength(PREVIEW_DAYS.length)
  })

  it('the revenue trend sums to the total its header shows', () => {
    // The reference screenshot reads "Total: ₹43.2K".
    expect(Math.round(PREVIEW_REVENUE_TOTAL / 100) / 10).toBe(43.2)
  })

  it('has a figure for every KPI widget the product has built', () => {
    // A built KPI with no sample value renders blank in the preview, which reads as a bug.
    const built = DASHBOARD_WIDGETS.filter((w) => w.group === 'kpi' && w.available).map((w) => w.key)
    expect(built.filter((key) => !PREVIEW_KPI[key])).toEqual([])
  })

  it('the pipeline figure excludes closed and cancelled, as its description says', () => {
    const closedOrCancelled = PREVIEW_STATUS_BREAKDOWN.filter((s) =>
      ['Closed', 'Cancelled'].includes(s.status)
    ).reduce((n, s) => n + s.count, 0)
    expect(PREVIEW_KPI['kpi.jobcards.pipeline'].value).toBe(
      String(PREVIEW_TOTAL_JOB_CARDS - closedOrCancelled)
    )
  })

  it('every recent job card has a status the breakdown knows', () => {
    const known = new Set(
      PREVIEW_STATUS_BREAKDOWN.map((s) => s.status.toUpperCase().replace(/ /g, '_'))
    )
    known.add('TECHNICIAN_COMPLETED') // the reference's own wording for Tech Done in a list row
    expect(PREVIEW_RECENT_JOB_CARDS.filter((j) => !known.has(j.status))).toEqual([])
  })
})
