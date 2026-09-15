import type * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * The card chrome every block of the job card detail wears.
 *
 * It lives here rather than in `job-card-detail-content.tsx` because the Timeline is rendered by
 * a separate component and had no chrome at all — a bare heading and one line of grey text
 * floating beside eight bordered cards, which read as a column that had failed to load rather
 * than one with nothing in it yet.
 */
export function DetailPanel({
  icon: Icon,
  title,
  action,
  tone = 'default',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  /** Sits at the right of the heading band — a count, or a control. */
  action?: React.ReactNode
  /** `accent` marks the one panel in a column that is worth finding first. */
  tone?: 'default' | 'accent'
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border bg-card',
        tone === 'accent' && 'border-teal-200 dark:border-teal-500/30'
      )}
    >
      {/* A tinted band rather than a bare bold line: with eight panels stacked down a column,
       * a heading that looks like the content it heads gives the eye nothing to catch. */}
      <header
        className={cn(
          'flex items-center gap-2 border-b px-3.5 py-2.5',
          tone === 'accent'
            ? 'border-teal-200 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10'
            : 'bg-muted/40'
        )}
      >
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md bg-background ring-1 ring-inset',
            tone === 'accent'
              ? 'text-teal-700 ring-teal-200 dark:text-teal-400 dark:ring-teal-500/30'
              : 'text-muted-foreground ring-border'
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </header>
      <div className="space-y-2 px-3.5 py-3">{children}</div>
    </section>
  )
}

/** A count next to a panel's title. Ten of these across a column read at a glance; ten titles
 *  ending in "(3)" do not. */
export function CountChip({ n }: { n: number }) {
  return (
    <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums ring-1 ring-border ring-inset">
      {n}
    </span>
  )
}

/** Nothing here — said quietly, so eight panels of blanks do not shout as loud as the data. */
export function EmptyDash() {
  return <span className="text-sm text-muted-foreground/60">—</span>
}
