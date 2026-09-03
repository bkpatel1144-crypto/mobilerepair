/**
 * Split out of `status-badge.tsx` (a component file, so `react-refresh/only-export-components`
 * forbids it exporting plain constants/functions alongside the component) — same reasoning as
 * `contexts/auth-context.ts` being separate from `auth-provider.tsx`. `StatusBadge` re-exports
 * `BadgeTone`/`toneFromStatus` from here so existing imports don't need to change.
 */

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'

export const TONE_STYLES: Record<BadgeTone, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  neutral: 'bg-secondary text-secondary-foreground',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
}

export const TONE_DOT_STYLES: Record<BadgeTone, string> = {
  success: 'bg-emerald-600',
  warning: 'bg-amber-600',
  danger: 'bg-red-600',
  info: 'bg-blue-600',
  neutral: 'bg-muted-foreground',
  purple: 'bg-purple-600',
}

/** Every status vocabulary observed across the reference app, pre-mapped to a color tone —
 * see SCREENS_NOTES.md "Color scheme observed" and the per-page status columns it documents.
 * Matching is case-insensitive against the raw status string; pass an explicit `tone` prop to
 * override for a one-off case instead of growing this map indefinitely. */
const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  active: 'success',
  paid: 'success',
  'fully paid': 'success',
  success: 'success',
  ready: 'success',
  'ready for delivery': 'success',
  'tech done': 'success',
  'technician completed': 'success',
  settled: 'success',
  completed: 'success',
  pending: 'warning',
  'in queue': 'warning',
  'on hold': 'warning',
  default: 'warning',
  incomplete: 'warning',
  unsettled: 'warning',
  'unused advance': 'warning',
  'pending return': 'warning',
  'cancelled · pending return': 'purple',
  'cancelled - pending return': 'purple',
  'in progress': 'info',
  delivered: 'purple',
  owner: 'warning',
  system: 'neutral',
  closed: 'neutral',
  custom: 'neutral',
  inactive: 'danger',
  disabled: 'danger',
  deleted: 'danger',
  cancelled: 'danger',
  overdue: 'danger',
  blocked: 'danger',
  unauthorized: 'danger',
  due: 'danger',
  critical: 'danger',
}

/** Exported for the rare case that needs the tone's raw classes without the full badge markup
 * — e.g. a removable filter chip that has to slot in its own trailing "×" button, which
 * `StatusBadge` itself deliberately doesn't support (every other call site is a plain,
 * non-interactive label). */
export function toneFromStatus(status: string): BadgeTone {
  return STATUS_TONE_MAP[status.trim().toLowerCase()] ?? 'neutral'
}
