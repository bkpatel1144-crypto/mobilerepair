import { Container } from '@/components/marketing/section'
import { Prose } from '@/components/marketing/section'

/**
 * The opening band of an interior page.
 *
 * Shared rather than written per page so the eight public pages agree on where a title sits and
 * how much room it gets — the old site had two pages and they already disagreed, with the landing
 * hero centred at `max-w-4xl` and the pricing hero centred at a different width.
 *
 * Left-aligned and full-width, with only the supporting paragraph held to a reading measure. On a
 * page whose job is to be read, a centred heading gives the eye a different starting point on
 * every line and buys nothing back.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string
  title: string
  lead?: string
  /** Actions or supporting content below the lead. */
  children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden border-b bg-muted/30">
      {/* A quiet brand wash rather than a flat grey, so an interior page still feels part of the
       * same site as the dark home hero. Inline styles because Tailwind v4's engine silently
       * fails to resolve `bg-[radial-gradient(...,var(--tw-gradient-stops))]`. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(55rem 28rem at 10% -30%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 65%)',
        }}
      />
      <Container className="relative py-(--spacing-section-sm)">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h1 className="text-headline mt-3 max-w-4xl text-balance">{title}</h1>
        {lead && (
          <Prose className="mt-5">
            <p className="text-lead text-muted-foreground">{lead}</p>
          </Prose>
        )}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  )
}
