/**
 * The sample figures the Role Configure dashboard preview renders.
 *
 * The preview has to show a *shaped* dashboard — a donut with slices, a trend with a curve, job
 * cards with statuses — because its job is to let an administrator see what a role will get. Real
 * data cannot be used: the preview is for a role, not for the person configuring it, and pulling
 * the live figures would leak this company's revenue into a screen about permissions.
 *
 * The numbers are the client's own from the reference screenshots, kept consistent with each
 * other: the status counts sum to the 46 the donut and the Total Job Cards tile both claim.
 * `dashboard-preview-data.test.ts` asserts that, so an edit to one number that forgets the others
 * fails rather than shipping a preview that contradicts itself.
 */

export const PREVIEW_TOTAL_JOB_CARDS = 46

/** Slice colours match `status-tone.ts` so the preview and the real Dashboard read alike. */
export const PREVIEW_STATUS_BREAKDOWN: { status: string; count: number; hex: string }[] = [
  { status: 'Pending', count: 6, hex: '#d97706' },
  { status: 'Queued', count: 2, hex: '#ea580c' },
  { status: 'In Progress', count: 5, hex: '#2563eb' },
  { status: 'On Hold', count: 1, hex: '#eab308' },
  { status: 'Tech Done', count: 8, hex: '#059669' },
  { status: 'Ready', count: 3, hex: '#22c55e' },
  { status: 'Delivered', count: 12, hex: '#9333ea' },
  { status: 'Closed', count: 8, hex: '#6b7280' },
  { status: 'Cancelled', count: 1, hex: '#dc2626' },
]

/** KPI tile values, by widget key. */
export const PREVIEW_KPI: Record<string, { value: string; tone?: string }> = {
  'kpi.revenue': { value: '₹45.8K' },
  'kpi.outstanding': { value: '₹12.5K' },
  'kpi.jobcards.today': { value: '46' },
  'kpi.jobcards.total': { value: '46' },
  'kpi.jobcards.pipeline': { value: '37' },
  'kpi.jobcards.ready': { value: '3' },
  'kpi.jobcards.delivered': { value: '12' },
  'kpi.jobcards.closed': { value: '8' },
  'kpi.jobcards.pending': { value: '6' },
  'kpi.jobcards.queued': { value: '2' },
  'kpi.jobcards.in_progress': { value: '5' },
  'kpi.jobcards.hold': { value: '1' },
  'kpi.jobcards.tech_done': { value: '8' },
  'kpi.jobcards.cancelled': { value: '1' },
  'kpi.jobcards.pending_return': { value: '0' },
  'kpi.turnaround': { value: '1.5d' },
}

/** Fourteen days, ending on the day the reference screenshot was taken. */
export const PREVIEW_DAYS = [
  '08-27',
  '08-28',
  '08-29',
  '08-30',
  '08-31',
  '09-01',
  '09-02',
  '09-03',
  '09-04',
  '09-05',
  '09-06',
  '09-07',
  '09-08',
  '09-09',
]

/** Revenue per day. Sums to the ₹43.2K the Revenue Trend header states. */
export const PREVIEW_REVENUE_TREND = [
  5200, 4800, 900, 1100, 4600, 2800, 4500, 3900, 2100, 900, 1400, 3600, 5400, 2000,
]

/** Job cards opened per day, the counterpart curve. */
export const PREVIEW_JOBCARD_TREND = [7, 3, 5, 1, 4, 6, 5, 3, 5, 8, 6, 5, 2, 3]

export const PREVIEW_TECHNICIANS = [
  { name: 'Rahul', completed: 7, inProgress: 3, queued: 2 },
  { name: 'Amit', completed: 5, inProgress: 2, queued: 2 },
  { name: 'Suresh', completed: 4, inProgress: 1, queued: 1 },
]

export interface PreviewJobCard {
  number: string
  customer: string
  status: string
}

export const PREVIEW_RECENT_JOB_CARDS: PreviewJobCard[] = [
  { number: 'JC-2026-00001', customer: 'Sample Customer A', status: 'IN_PROGRESS' },
  { number: 'JC-2026-00002', customer: 'Sample Customer B', status: 'PENDING' },
  { number: 'JC-2026-00003', customer: 'Sample Customer C', status: 'DELIVERED' },
  { number: 'JC-2026-00004', customer: 'Sample Customer D', status: 'TECHNICIAN_COMPLETED' },
  { number: 'JC-2026-00005', customer: 'Sample Customer E', status: 'QUEUED' },
]

/** "My Job Cards" is the same list filtered to the signed-in technician — three of the five. */
export const PREVIEW_MY_JOB_CARDS: PreviewJobCard[] = PREVIEW_RECENT_JOB_CARDS.filter((j) =>
  ['JC-2026-00001', 'JC-2026-00002', 'JC-2026-00004'].includes(j.number)
)

export const PREVIEW_REVENUE_TOTAL = PREVIEW_REVENUE_TREND.reduce((a, b) => a + b, 0)
