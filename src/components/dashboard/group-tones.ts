import type { WidgetGroupKey } from '@/config/dashboard-widgets'

/**
 * The tint each widget group's icon carries, in the Dashboard and in the Role Configure preview.
 *
 * Its own module because a file that exports both components and constants breaks Fast Refresh —
 * the whole module reloads on every edit instead of the component hot-swapping.
 *
 * Literal class strings: Tailwind extracts these statically, so a tint assembled from the group
 * key at runtime would never reach the stylesheet.
 */
export const GROUP_ICON_TONE: Record<WidgetGroupKey, string> = {
  personal: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400',
  quick: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
  kpi: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  chart: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
  list: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
}
