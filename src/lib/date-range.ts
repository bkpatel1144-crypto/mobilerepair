import type { DateRangeKey } from '@/components/shared/filter-bar'

/** Converts a `FilterBar` date-range chip into concrete bounds. Shared by the Dashboard and
 * Job Cards list so "Today"/"This Week"/etc. mean exactly the same thing everywhere. Returns
 * `null` for `'all'` (or an incomplete custom range) — callers treat that as "no filter". */
export function dateRangeBounds(
  key: DateRangeKey | 'all',
  customFrom?: string,
  customTo?: string
): { from: Date; to: Date } | null {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1)

  switch (key) {
    case 'today':
      return { from: startOfToday, to: endOfToday }
    case 'yesterday': {
      const from = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
      const to = new Date(startOfToday.getTime() - 1)
      return { from, to }
    }
    case 'week': {
      const from = new Date(startOfToday.getTime() - startOfToday.getDay() * 24 * 60 * 60 * 1000)
      return { from, to: endOfToday }
    }
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday }
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfToday }
    case 'custom': {
      if (!customFrom) return null
      const from = new Date(`${customFrom}T00:00:00`)
      const to = customTo ? new Date(`${customTo}T23:59:59`) : endOfToday
      return { from, to }
    }
    default:
      return null
  }
}

/** Compact duration label matching the reference's own style ("6m", "2h", "3d"). */
export function formatDurationLabel(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}
