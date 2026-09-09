import { cn } from '@/lib/utils'

/**
 * One titled card in a long data-entry form — the Buy Mobile layout, now shared.
 *
 * Buy Mobile grouped its fields into bordered cards with a small heading ("📋 Device Details",
 * "✓ Seller & ID Verification", "₹ Purchase Details"); Create Job Card was one unbroken card with
 * a two-column split and no headings at all, so the same product had two unrelated ideas of what a
 * form looks like. This is the Buy Mobile idea, extracted so both use it literally rather than by
 * resemblance.
 *
 * The glyph is passed as text (an emoji or a symbol like ₹) to match what Buy Mobile already
 * shipped, not as an icon component — the reference app's own headings are glyph-led too.
 */
export function FormSection({
  glyph,
  title,
  description,
  children,
  className,
}: {
  glyph?: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-4 rounded-lg border bg-card p-4', className)}>
      <div>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          {glyph && <span aria-hidden>{glyph}</span>}
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/**
 * The two-column field grid inside a section.
 *
 * `auto-fit` with a 15rem floor rather than `sm:grid-cols-2`: it drops to one column whenever the
 * *container* is narrow, not just when the viewport is, which is the difference on a tablet with
 * the sidebar open. Buy Mobile used a bare `grid-cols-2`, so on a 375px phone every field sat in
 * a ~163px column — an input with a trailing scan button in 163px is not a field, it is two
 * clipped halves of one.
 *
 * `[&>*]:min-w-0` is the other half of that fix: a grid item's automatic minimum size is its
 * min-content width, so without it the columns refuse to shrink and push their trailing buttons
 * past the card's own border. Measured on this exact form, twice.
 *
 * `FormGridFull` spans a child across the row — for a textarea, an image dropzone, or a field
 * whose label wraps badly in half the width.
 */
export const FORM_GRID_CLASS =
  'grid min-w-0 gap-x-4 gap-y-4 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))] [&>*]:min-w-0'

export function FormGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(FORM_GRID_CLASS, className)}>{children}</div>
}

/** A field that spans the whole `FormGrid` row. */
export function FormGridFull({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  // `1 / -1`, not `col-span-2`: with `auto-fit` the column count is not fixed at two.
  return <div className={cn('min-w-0 [grid-column:1/-1]', className)}>{children}</div>
}
