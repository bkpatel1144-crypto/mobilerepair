import { cn } from '@/lib/utils'

/**
 * A row that scrolls sideways on a phone and lays out normally from `sm` up.
 *
 * The pattern every mobile app uses for a row of tiles or chips, and the thing the app was
 * missing. On the dashboard, six date filters wrapped onto three ragged lines and sixteen stat
 * tiles stacked into a two-column wall about 2,500px tall — so the first thing a shopkeeper saw
 * after signing in on their phone was a page to scroll past rather than read. A single row they
 * swipe through puts the same information in one screen's worth of height.
 *
 * Three details make it feel native rather than like a div that happens to overflow:
 *
 *  - **No scrollbar.** A bar across a row of cards reads as a rendering artefact. The gesture is
 *    the affordance on touch, and a partially visible next card is what signals there is more.
 *  - **Negative margin, matching padding.** The row scrolls to the true screen edge instead of
 *    stopping inside the page gutter, which is what stops it looking like a cut-off box. The
 *    padding puts the first and last item back in line with the rest of the page.
 *  - **Proximity snapping, not mandatory.** `mandatory` fights a deliberate small drag and can
 *    trap a row mid-flick; `proximity` tidies a near-miss and otherwise leaves the scroll alone.
 *
 * `overscroll-x-contain` stops a horizontal swipe turning into the browser's back gesture, which
 * on a phone is the difference between browsing the row and leaving the page.
 *
 * Children need an explicit width while scrolling, since a flexible child would collapse to fit
 * and leave nothing to scroll. Pass it through `className` as a child selector — e.g.
 * `className="[&>*]:w-[10.5rem]"` — rather than as a separate prop: Tailwind extracts class names
 * statically from the source, so a class assembled from a runtime string never reaches the
 * stylesheet and silently does nothing.
 */
export function ScrollRow({
  children,
  className,
  style,
  /** Where the row stops scrolling and becomes an ordinary wrapping flex row. */
  from = 'sm',
}: {
  children: React.ReactNode
  className?: string
  /** For passing a CSS custom property a caller needs to compute — a breakpoint-scoped width
   *  cap, say, which an inline `max-width` could not express. */
  style?: React.CSSProperties
  from?: 'sm' | 'md' | 'lg'
}) {
  // Whole class strings per breakpoint, not interpolated fragments, for the extraction reason
  // above. The variant order is `sm:[&>*]:…` — the reverse compiles to nothing.
  const releases = {
    sm: 'sm:mx-0 sm:snap-none sm:flex-wrap sm:overflow-visible sm:px-0 sm:[&>*]:shrink',
    md: 'md:mx-0 md:snap-none md:flex-wrap md:overflow-visible md:px-0 md:[&>*]:shrink',
    lg: 'lg:mx-0 lg:snap-none lg:flex-wrap lg:overflow-visible lg:px-0 lg:[&>*]:shrink',
  }[from]

  return (
    <div
      className={cn(
        'no-scrollbar -mx-4 flex snap-x snap-proximity gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 sm:px-6',
        '[&>*]:shrink-0 [&>*]:snap-start',
        releases,
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
}
