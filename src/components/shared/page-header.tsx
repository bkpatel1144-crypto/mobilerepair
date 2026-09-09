import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

/** The icon + bold title + grey subtitle + right-aligned action buttons header that opens
 * nearly every page in the reference app (see SCREENS_NOTES.md — repeats on every list,
 * report, and settings screen with only the icon/copy/actions changing). */
export function PageHeader({ icon: Icon, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    // Base is nowrap, wrapping returns at `sm`.
    //
    // `flex-wrap` at every size dropped the primary action onto its own line below the title on a
    // phone, which is where a mobile app puts it least: the create button belongs on the title
    // row's right edge. Keeping wrap from `sm` up preserves the safety net on the desktop pages
    // that pass three or four buttons.
    <div className={cn('flex items-start justify-between gap-3 sm:flex-wrap', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
            <Icon className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          {/* The title truncates rather than wrapping — a two-line title beside a button reads as
           * a layout accident. The subtitle is allowed to wrap, since it is usually a hint worth
           * reading in full. */}
          <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 sm:flex-wrap">{actions}</div>}
    </div>
  )
}
