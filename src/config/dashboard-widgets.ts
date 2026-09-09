/**
 * Every widget the Dashboard can show, and the groups the Widget Library presents them in.
 *
 * Rebuilt against the client's reference export (`data/dashboard.json`) and the Widget Library
 * screenshots. What was here before was 18 flat entries with invented keys — `totalJobCards`
 * where the reference says `kpi.jobcards.total` — and no groups at all. Three consequences, all
 * of them real:
 *
 *  - A role config written by the reference system could not be read by this one, and vice
 *    versa. The keys are the storage format, so they have to match exactly.
 *  - Sixteen widgets did not exist here. The Welcome Banner, the four Quick Actions and Recent
 *    Job Cards were all *rendered* by the Dashboard but were not in the catalogue, so no role
 *    could turn them off — the toggle simply was not there.
 *  - Without groups the library is a flat list of 34 items, where the reference shows five
 *    labelled sections each with its own "16 / 19 added" count.
 *
 * `available: false` marks a widget the reference lists but has not shipped — they carry a small
 * badge in its library and cannot be enabled. Kept in the catalogue rather than dropped so the
 * group totals match ("1 / 2 added" for Personal only reads correctly if Notifications is
 * present), and so enabling one later is a one-word change.
 *
 * Key naming follows the reference exactly for the 26 that appear in its export. The 8 it lists
 * but does not enable are not in that file, so their keys follow the same convention and are
 * marked below — worth knowing if a config is ever exchanged with the reference system.
 */
export type WidgetGroupKey = 'personal' | 'quick' | 'kpi' | 'chart' | 'list'

export interface DashboardWidgetSpec {
  key: string
  label: string
  /** One line, shown under the label in the Widget Library. */
  description: string
  group: WidgetGroupKey
  /** False for widgets the reference lists but has not built. Cannot be enabled. */
  available: boolean
}

export interface WidgetGroupSpec {
  key: WidgetGroupKey
  label: string
}

/** Display order of the sections in the library and on the Dashboard. */
export const WIDGET_GROUPS: WidgetGroupSpec[] = [
  { key: 'personal', label: 'Personal' },
  { key: 'quick', label: 'Quick Actions' },
  { key: 'kpi', label: 'KPI Cards' },
  { key: 'chart', label: 'Charts & Graphs' },
  { key: 'list', label: 'Lists' },
]

export const DASHBOARD_WIDGETS: DashboardWidgetSpec[] = [
  // ---- Personal ----------------------------------------------------------------------------
  {
    key: 'personal.welcome',
    label: 'Welcome Banner',
    description: 'Personalized greeting',
    group: 'personal',
    available: true,
  },
  {
    key: 'personal.notifications',
    label: 'Notifications',
    description: 'Recent alerts for the user',
    group: 'personal',
    available: false,
  },

  // ---- Quick Actions -----------------------------------------------------------------------
  {
    key: 'quick.scan_jobcard',
    label: 'Scan Job Card',
    description: 'Open scanner to look up a job card by barcode / QR',
    group: 'quick',
    available: true,
  },
  {
    key: 'quick.new_jobcard',
    label: 'New Job Card',
    description: 'Quick action button',
    group: 'quick',
    available: true,
  },
  {
    key: 'quick.new_party',
    label: 'New Party',
    description: 'Quick action button',
    group: 'quick',
    available: true,
  },
  {
    key: 'quick.new_item',
    label: 'New Item',
    description: 'Quick action button',
    group: 'quick',
    available: true,
  },
  {
    key: 'quick.new_invoice',
    label: 'New Invoice',
    description: 'Quick action button',
    group: 'quick',
    available: false,
  },

  // ---- KPI Cards ---------------------------------------------------------------------------
  {
    key: 'kpi.jobcards.total',
    label: 'Total Job Cards',
    description: 'Count of all job cards',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.pipeline',
    label: 'Total in Pipeline',
    description: 'All job cards still active in the pipeline (excludes Closed and Cancelled)',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.today',
    label: 'Period Job Cards',
    description: 'Job cards in the selected date range (label adapts: Today / This Week / This Month / etc.)',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.revenue',
    label: 'Revenue',
    description: 'Revenue from delivered/closed jobs in the selected range',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.outstanding',
    label: 'Outstanding Amount',
    description: 'Total unpaid receivables across all jobs (point-in-time, NOT date-filtered)',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.in_progress',
    label: 'In-Progress Job Cards',
    description: 'Currently active job cards',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.pending',
    label: 'Pending Job Cards',
    description: 'Job cards in PENDING status',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.turnaround',
    label: 'Avg Turnaround',
    description: 'Average time to close a job',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.cancelled',
    label: 'Cancelled Job Cards',
    description: 'Cancelled job cards',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.queued',
    label: 'In Queue Job Cards',
    description: 'Job cards waiting in QUEUE',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.hold',
    label: 'On Hold Job Cards',
    description: 'Job cards put on hold',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.tech_done',
    label: 'Tech Done Job Cards',
    description: 'Job cards completed by technician',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.ready',
    label: 'Ready Job Cards',
    description: 'Job cards ready for delivery',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.delivered',
    label: 'Delivered Job Cards',
    description: 'Delivered (but not yet closed) job cards',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.closed',
    label: 'Closed Job Cards',
    description: 'Fully closed job cards',
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.jobcards.pending_return',
    label: 'Pending Return Job Cards',
    description: "Cancelled jobs whose device hasn't been returned yet",
    group: 'kpi',
    available: true,
  },
  {
    key: 'kpi.parties.total',
    label: 'Total Parties',
    description: 'Customers + suppliers',
    group: 'kpi',
    available: false,
  },
  {
    key: 'kpi.items.total',
    label: 'Total Items',
    description: 'Items in catalog',
    group: 'kpi',
    available: false,
  },
  {
    key: 'kpi.users.active',
    label: 'Active Users',
    description: 'Currently active users',
    group: 'kpi',
    available: false,
  },

  // ---- Charts & Graphs ------------------------------------------------------------------------
  {
    key: 'chart.jobcards.by_status',
    label: 'Job Cards by Status',
    description: 'Distribution of job cards across statuses',
    group: 'chart',
    available: true,
  },
  {
    key: 'chart.revenue.trend',
    label: 'Revenue Trend',
    description: 'Daily revenue over last 30 days',
    group: 'chart',
    available: true,
  },
  {
    key: 'chart.jobcards.trend',
    label: 'Job Cards Trend',
    description: 'Last 30 days bar chart',
    group: 'chart',
    available: true,
  },
  {
    key: 'chart.jobcards.by_tech',
    label: 'Jobs by Technician',
    description: 'Workload per technician',
    group: 'chart',
    available: true,
  },
  {
    key: 'chart.sales_vs_purchase',
    label: 'Sales vs Purchase',
    description: 'Monthly comparison',
    group: 'chart',
    available: false,
  },

  // ---- Lists -----------------------------------------------------------------------------------
  {
    key: 'list.jobcards.recent',
    label: 'Recent Job Cards',
    description: 'Latest 10 job cards',
    group: 'list',
    available: true,
  },
  {
    key: 'list.jobcards.mine',
    label: 'My Job Cards',
    description: 'Job cards assigned to logged-in user',
    group: 'list',
    available: false,
  },
  {
    key: 'list.parties.recent',
    label: 'Recent Parties',
    description: 'Latest parties added',
    group: 'list',
    available: false,
  },
]

/** Widgets in one group, in display order. */
export function widgetsInGroup(group: WidgetGroupKey): DashboardWidgetSpec[] {
  return DASHBOARD_WIDGETS.filter((w) => w.group === group)
}

/**
 * Every widget the product has actually built, switched on.
 *
 * Only `available` ones: enabling a widget with no implementation would put a toggle in Role
 * Configure that changes nothing on the Dashboard, which is worse than not offering it. This is
 * exactly the 26 the reference export enables for OWNER, asserted in `dashboard-widgets.test.ts`.
 */
export function allWidgetsEnabled(): Record<string, boolean> {
  return Object.fromEntries(DASHBOARD_WIDGETS.filter((w) => w.available).map((w) => [w.key, true]))
}
