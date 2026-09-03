import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

// Tailwind's compiler needs literal class strings in source — never build these with template
// interpolation (`bg-${tone}-100`), it silently won't generate the CSS.
const TONE_ICON_STYLES: Record<StatTone, string> = {
  default: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
}

const TONE_SELECTED_STYLES: Record<StatTone, string> = {
  default: 'border-teal-600 bg-teal-50 dark:bg-teal-500/10',
  success: 'border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
  warning: 'border-amber-600 bg-amber-50 dark:bg-amber-500/10',
  danger: 'border-red-600 bg-red-50 dark:bg-red-500/10',
  info: 'border-blue-600 bg-blue-50 dark:bg-blue-500/10',
  purple: 'border-purple-600 bg-purple-50 dark:bg-purple-500/10',
}

interface StatCardBaseProps {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  tone?: StatTone
  sublabel?: string
  trend?: { direction: 'up' | 'down'; label: string }
  selected?: boolean
  className?: string
}

type StatCardProps = StatCardBaseProps & ({ onClick?: undefined } | { onClick: () => void })

/** The stat-card / clickable-filter-pill pattern used everywhere in the reference app: a
 * bordered card with a label, a big number, an optional icon in a soft colored circle, and an
 * optional trend arrow. Passing `onClick` renders it as a real <button> (used for "click a
 * status card to filter" list headers); omitting it renders a plain, non-interactive card
 * (used for dashboard/report summary tiles). */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  sublabel,
  trend,
  selected,
  onClick,
  className,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex w-full items-start justify-between gap-2">
        <div className="min-w-0">
          {/* Two-line wrap, not truncate — a narrow card (e.g. "Total in Pipeline" at 6-per-row
           * desktop widths) previously ellipsized mid-word, which read as broken rather than
           * merely tight. Verified via a real browser screenshot. */}
          <p className="line-clamp-2 text-xs leading-tight font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
          {trend && (
            <p
              className={cn(
                'mt-1 flex items-center gap-0.5 text-xs font-medium',
                trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {trend.direction === 'up' ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              TONE_ICON_STYLES[tone]
            )}
          >
            <Icon className="size-4.5" />
          </span>
        )}
      </div>
    </>
  )

  const sharedClassName = cn(
    'flex min-w-[9.5rem] flex-1 flex-col items-start rounded-lg border bg-card p-4 text-left transition-colors',
    selected ? TONE_SELECTED_STYLES[tone] : 'border-border',
    onClick &&
      'cursor-pointer hover:border-teal-600/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
    className
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClassName} aria-pressed={selected}>
        {content}
      </button>
    )
  }

  return <div className={sharedClassName}>{content}</div>
}
