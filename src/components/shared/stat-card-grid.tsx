import { Children } from 'react'
import { cn } from '@/lib/utils'

/**
 * The row of summary tiles that sits under a page header.
 *
 * Exists because every page had been rolling its own: `grid-cols-3 sm:max-w-md` here,
 * `grid-cols-2 sm:grid-cols-4 sm:max-w-xl` there, nothing at all elsewhere. Cards ended up
 * different widths from one Settings page to the next, and the arbitrary `max-w-*` caps fought
 * `StatCard`'s own minimum width — which is what made four tiles read as one segmented block
 * with a stray full-width gap beside it.
 *
 * Layout rules, in one place:
 *  - Tracks are `auto-fill` with a real minimum, so tiles wrap instead of crushing, and a
 *    375px screen gets one or two per row without any breakpoint to keep in sync.
 *  - The grid is capped at `count` tracks' worth of width, so three tiles on a 1400px screen
 *    stay tile-sized rather than stretching to 460px each — the thing an unbounded `1fr` grid
 *    gets wrong.
 */
export function StatCardGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const count = Children.toArray(children).filter(Boolean).length

  return (
    <div
      className={cn(
        'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr))]',
        className
      )}
      // Capped in rem so it tracks the user's font size, and only up to six — beyond that a row
      // of tiles is a table, and stretching one across a wide monitor helps nobody.
      style={{ maxWidth: `${Math.min(count, 6) * 13.5}rem` }}
    >
      {children}
    </div>
  )
}
