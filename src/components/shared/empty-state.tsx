import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/** Matches the reference app's empty-state copy pattern exactly: a muted icon, a bold-ish
 * title line, and a lighter description line underneath (e.g. "No backups yet. Create your
 * first backup above." / "No outstanding receivables" + "All payments are up to date."). */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-4 py-12 text-center',
        className
      )}
    >
      {Icon && <Icon className="mb-1 size-8 text-muted-foreground/60" />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
