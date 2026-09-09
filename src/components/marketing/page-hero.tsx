import { Container, Prose } from '@/components/marketing/section'
import { Reveal } from '@/components/marketing/reveal'

/**
 * The opening band of an interior page.
 *
 * Shared rather than written per page so the eight public pages agree on where a title sits and
 * how much room it gets — the old site had two pages and they already disagreed, with the landing
 * hero centred at `max-w-4xl` and the pricing hero at a different width.
 *
 * Left-aligned and full-width, with only the supporting paragraph held to a reading measure. On a
 * page whose job is to be read, a centred heading gives the eye a different starting point on
 * every line and buys nothing back.
 *
 * Deliberately not a copy of the home hero. That one is dark, tall and lit; this needs to open a
 * page rather than sell it, so it stays on paper and earns its presence from three quieter
 * things: a brand wash that ties it to the dark sections elsewhere, a dot grid for structure, and
 * a hairline gradient at the bottom instead of a flat border. The old version had the wash alone,
 * which on a grey band read as a smudge rather than as light.
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
    <section className="mk-grain relative overflow-hidden bg-mk-paper-2">
      {/* Inline styles for every gradient here: Tailwind v4's engine silently fails to resolve
       * the v3-style `bg-[radial-gradient(...,var(--tw-gradient-stops))]`, and this project has
       * already shipped a "dark" hero that rendered near-white because of exactly that. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(58rem 30rem at 8% -25%, color-mix(in oklab, var(--color-mk-accent) 22%, transparent), transparent 62%),' +
            'radial-gradient(40rem 24rem at 95% 10%, color-mix(in oklab, var(--color-mk-warm) 12%, transparent), transparent 60%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(color-mix(in oklab, var(--foreground) 14%, transparent) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          maskImage: 'radial-gradient(70% 80% at 0% 0%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(70% 80% at 0% 0%, black, transparent 70%)',
        }}
      />

      <Container className="relative py-(--spacing-section-sm) lg:py-24">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mk-accent">
            {eyebrow}
          </p>
          <h1 className="text-headline mt-3 max-w-4xl text-balance">{title}</h1>
          {lead && (
            <Prose className="mt-5">
              <p className="text-lead text-muted-foreground">{lead}</p>
            </Prose>
          )}
          {children && <div className="mt-8">{children}</div>}
        </Reveal>
      </Container>

      {/* A gradient hairline rather than `border-b`: a full-width 1px rule across a lit band cuts
       * it off, where a line that fades at both ends lets the section end. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          backgroundImage:
            'linear-gradient(to right, transparent, color-mix(in oklab, var(--foreground) 12%, transparent) 25%, color-mix(in oklab, var(--foreground) 12%, transparent) 75%, transparent)',
        }}
      />
    </section>
  )
}
