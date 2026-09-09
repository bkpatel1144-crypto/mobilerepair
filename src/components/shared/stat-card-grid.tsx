import { Children } from 'react'
import { ScrollRow } from '@/components/shared/scroll-row'
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
 * On a phone it stops wrapping and scrolls sideways. Wrapping is right on a desktop and wrong
 * here: sixteen tiles came out two-per-row and about 2,500px tall, so the first thing a shopkeeper
 * saw after signing in was a wall to scroll past rather than a dashboard to read. One swipeable
 * row puts the same numbers in a single screen's height.
 *
 * Each tile is wrapped rather than sized directly, which is not tidiness — it is the only thing
 * that works. `StatCard` carries `flex-1` in its own class list, i.e. `flex-basis: 0%`, so a width
 * set from this component was ignored for flex sizing: sixteen tiles with a zero base size split
 * the container evenly and came out 34px wide, squashed to slivers with their labels gone. The
 * wrapper takes over the flex sizing the card used to get from this row, and the card's `flex-1`
 * then makes it fill the wrapper.
 *
 * The rest of the rules, in one place:
 *  - `basis-[10.5rem]` is a real minimum, so tiles wrap rather than crush, and a 375px screen
 *    gets one or two per row without a breakpoint to keep in sync.
 *  - Each tile caps at `18rem`, so the pathological case — one tile orphaned onto its own row —
 *    stops at a tile-like width instead of stretching across the whole monitor.
 *  - The row is capped at `count` tiles' worth of width, so three tiles on a 1400px screen stay
 *    tile-sized rather than each ballooning to 460px. Up to eight; past that a row of tiles is
 *    really a table. Carried as a custom property because the cap must not apply to the scrolling
 *    row, where it would only shorten the track — and an inline `max-width` cannot be
 *    breakpoint-scoped.
 */
export function StatCardGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const tiles = Children.toArray(children).filter(Boolean)

  return (
    <ScrollRow
      className={cn('sm:max-w-(--stat-row-max)', className)}
      style={{ '--stat-row-max': `${Math.min(tiles.length, 8) * 13.5}rem` } as React.CSSProperties}
    >
      {tiles.map((tile, index) => (
        <div
          // `flex` on the wrapper so the card fills it in both directions: the width from its own
          // `flex-1`, the height from the default `align-items: stretch`. Without it the tiles in
          // a row came out at different heights wherever one label wrapped to two lines.
          key={index}
          className="flex w-[10.5rem] sm:w-auto sm:min-w-0 sm:flex-1 sm:basis-[10.5rem] sm:max-w-[18rem]"
        >
          {tile}
        </div>
      ))}
    </ScrollRow>
  )
}
