/**
 * The exact 10 job statuses and 14 actions from BUILD_PLAN.md Phase 4/`SCREENS_NOTES.md`
 * `preview (13)` — the status×action matrix in the Workflow Designer's Permissions tab is
 * built from this same list, and Phase 5's Job Cards list/detail page (status pill row, status
 * badges, action buttons) must reuse it too rather than redeclaring its own copy. Keys match
 * `dashboard-widgets.ts`'s existing camelCase status keys (`inQueue`, `techDone`, `ready`,
 * `pendingReturn`) where one already existed, so a job's `status` field lines up with both
 * without translation.
 */

export interface JobStatusSpec {
  key: string
  label: string
}

// Status dot/badge colors come from `StatusBadge`'s own `STATUS_TONE_MAP` (matched by this
// exact `label`, lowercased) — one tone system for the whole app, not a second one here.
export const JOB_STATUSES: JobStatusSpec[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'inQueue', label: 'In Queue' },
  { key: 'inProgress', label: 'In Progress' },
  { key: 'onHold', label: 'On Hold' },
  { key: 'techDone', label: 'Tech Done' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'closed', label: 'Closed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'pendingReturn', label: 'Pending Return' },
]

export interface JobActionSpec {
  key: string
  label: string
}

export const JOB_ACTIONS: JobActionSpec[] = [
  { key: 'takeJob', label: 'Take Job' },
  { key: 'jobDone', label: 'Job Done' },
  { key: 'hold', label: 'Hold' },
  { key: 'resume', label: 'Resume' },
  { key: 'generateBill', label: 'Generate Bill' },
  { key: 'payment', label: 'Payment' },
  { key: 'deliver', label: 'Deliver' },
  { key: 'close', label: 'Close' },
  { key: 'cancel', label: 'Cancel' },
  { key: 'returnAndClose', label: 'Return & Close' },
  { key: 'addImage', label: 'Add Image' },
  { key: 'addPart', label: 'Add Part' },
  { key: 'fieldVisit', label: 'Field Visit' },
  { key: 'handover', label: 'Handover' },
]

export type JobAccessScope = 'all' | 'assigneeOpen' | 'assignedOnly'

export const JOB_ACCESS_SCOPES: { key: JobAccessScope; label: string }[] = [
  { key: 'all', label: 'All Jobs' },
  { key: 'assigneeOpen', label: 'Assignee + Open' },
  { key: 'assignedOnly', label: 'Assigned Only' },
]

/** Builds an empty (all-false) status×action matrix — the starting point for a role that has
 * never been configured before. */
export function emptyStatusActionMatrix(): Record<string, Record<string, boolean>> {
  const matrix: Record<string, Record<string, boolean>> = {}
  for (const status of JOB_STATUSES) {
    matrix[status.key] = Object.fromEntries(JOB_ACTIONS.map((a) => [a.key, false]))
  }
  return matrix
}

export function countEnabledActions(matrix: Record<string, Record<string, boolean>>): number {
  let n = 0
  for (const status of JOB_STATUSES) {
    for (const action of JOB_ACTIONS) {
      if (matrix[status.key]?.[action.key]) n++
    }
  }
  return n
}
