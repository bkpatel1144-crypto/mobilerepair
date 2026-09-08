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
 * Wrapping flex rather than a grid, which is the fix for the dead space a grid leaves on a wide
 * screen. Grid tracks are a fixed count, so any tile count that does not divide by it strands
 * the remainder: the Dashboard's 16 tiles in the 7 columns a 1296px cap allows came out 7 + 7 + 2,
 * with five empty slots' worth of gap to the right of the last row. Flex items grow, so the last
 * row spreads to fill the width instead and there is no gap at any count.
 *
 * The rest of the rules, in one place:
 *  - `basis-[10.5rem]` is a real minimum, so tiles wrap rather than crush, and a 375px screen
 *    gets one or two per row without a breakpoint to keep in sync.
 *  - Each tile caps at `18rem`, so the pathological case — one tile orphaned onto its own row —
 *    stops at a tile-like width instead of stretching across the whole monitor.
 *  - The row is capped at `count` tiles' worth of width, so three tiles on a 1400px screen stay
 *    tile-sized rather than each ballooning to 460px. Up to eight; past that a row of tiles is
 *    really a table.
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
        'flex flex-wrap gap-3',
        '[&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-[10.5rem] [&>*]:max-w-[18rem]',
        className
      )}
      // In rem so it tracks the user's font size.
      style={{ maxWidth: `${Math.min(count, 8) * 13.5}rem` }}
    >
      {children}
    </div>
  )
}
