import { cn } from '@/lib/utils'

/**
 * A horizontal count tile — icon, label and count on one line.
 *
 * Distinct from `StatCard`, which stacks a big number under a label and is for figures you read.
 * These are *filters*: a row of them across the top of a list, one selected, clicking one
 * narrows the table below. Making them a separate component keeps that difference visible in
 * the markup rather than being a `StatCard` with five overrides.
 */
export function StatPill({
  icon: Icon,
  label,
  count,
  tone = 'neutral',
  selected,
  onClick,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  count: number
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
  selected?: boolean
  onClick?: () => void
}) {
  const iconTone = {
    neutral: 'text-muted-foreground',
    success: 'text-teal-600 dark:text-teal-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600',
  }[tone]

  const content = (
    <>
      {Icon && <Icon className={cn('size-4 shrink-0', iconTone)} />}
      <span className="truncate text-sm">{label}</span>
      <span className="ml-auto font-bold tabular-nums">{count}</span>
    </>
  )

  const className = cn(
    'flex min-w-0 items-center gap-2 rounded-xl border bg-card px-4 py-3 text-left transition-colors',
    selected && 'border-teal-600 bg-teal-50/60 dark:bg-teal-500/10',
    onClick && !selected && 'hover:bg-muted/50'
  )

  if (!onClick) return <div className={className}>{content}</div>

  return (
    <button
      type="button"
      data-slot="button"
      aria-pressed={selected}
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  )
}

/** The row these sit in. Auto-fit so four tiles wrap rather than crush on a narrow screen. */
export function StatPillRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]">
      {children}
    </div>
  )
}
