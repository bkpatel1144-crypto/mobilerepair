/**
 * Every widget the Dashboard page (`src/pages/app/dashboard-page.tsx`) can show — the Role
 * Configure "Dashboard & Landing" tab toggles visibility per role from this same list, so the
 * two can never drift out of sync. Order here is display order.
 */
export interface DashboardWidgetSpec {
  key: string
  label: string
}

export const DASHBOARD_WIDGETS: DashboardWidgetSpec[] = [
  { key: 'totalJobCards', label: 'Total Job Cards' },
  { key: 'totalInPipeline', label: 'Total in Pipeline' },
  { key: 'allJobCards', label: 'All Job Cards' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'inProgress', label: 'In Progress' },
  { key: 'pending', label: 'Pending' },
  { key: 'avgTurnaround', label: 'Avg Turnaround' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'inQueue', label: 'In Queue' },
  { key: 'onHold', label: 'On Hold' },
  { key: 'techDone', label: 'Tech Done' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'closed', label: 'Closed' },
  { key: 'pendingReturn', label: 'Pending Return' },
  { key: 'jobCardsByStatusChart', label: 'Job Cards by Status (chart)' },
  { key: 'revenueTrendChart', label: 'Revenue Trend (chart)' },
]

export function allWidgetsEnabled(): Record<string, boolean> {
  return Object.fromEntries(DASHBOARD_WIDGETS.map((w) => [w.key, true]))
}
