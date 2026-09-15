import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  /** For a small box — a dashboard widget, a panel — rather than a whole empty page. */
  compact?: boolean
  className?: string
}

/** Matches the reference app's empty-state copy pattern exactly: a muted icon, a bold-ish
 * title line, and a lighter description line underneath (e.g. "No backups yet. Create your
 * first backup above." / "No outstanding receivables" + "All payments are up to date."). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
  className,
}: EmptyStateProps) {
  return (
    // `py-12` is right for an empty page and wrong for a dashboard widget: it made "Nothing
    // needs attention" a 230px box at the top of the dashboard, taller than the twelve tiles
    // below it that were actually carrying numbers.
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-1 px-3 py-5' : 'gap-2 px-4 py-12',
        className
      )}
    >
      {Icon && (
        <Icon className={cn('mb-1 text-muted-foreground/60', compact ? 'size-6' : 'size-8')} />
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className={cn('max-w-sm text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
