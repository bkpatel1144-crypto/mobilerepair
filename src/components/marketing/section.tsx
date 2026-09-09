import { Reveal } from '@/components/marketing/reveal'
import { cn } from '@/lib/utils'

/**
 * Layout primitives for the public site.
 *
 * These exist because the page they replaced nested four different width caps — `max-w-6xl` for
 * the shell, `max-w-4xl` for the hero, `max-w-2xl` for headings, `max-w-3xl` for the FAQ — so on
 * a 1440px screen roughly a third of the width was margin and no two sections agreed on where
 * the edge was. One `Container`, used by every section, is what keeps that from coming back.
 *
 * The distinction the old page missed: a *section* should span the screen, while a *paragraph*
 * should not. Long measure is genuinely harder to read, so `Prose` narrows text — and only text.
 * Cards, grids and images take the full container.
 */

/**
 * The page's horizontal bounds. `--container-page` is 92rem (1472px), so a 1440px screen is
 * filled edge to edge with only the gutter as margin, and a 1920px one still stops before the
 * line lengths get unreadable.
 *
 * Padding scales with the breakpoint rather than sitting at a fixed `px-4`: a phone needs the
 * content close to the edge to get any width at all, while on a large screen the same 16px makes
 * the layout look like it is falling off the sides.
 */
export function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-(--container-page) px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20',
        className
      )}
    >
      {children}
    </div>
  )
}

/** Background treatments a section can take. Full-bleed — the tone paints the whole width, and
 *  only the content inside is bounded by `Container`. */
type Tone = 'default' | 'muted' | 'dark' | 'brand'

const TONE: Record<Tone, string> = {
  // `mk-paper` rather than `background`: a warm off-white on the public site, the theme's own
  // near-black in dark mode. See the MARKETING SURFACE block in index.css for why pure white was
  // the thing making these pages read as a template.
  default: 'bg-mk-paper',
  muted: 'bg-mk-paper-2',
  // Dark in *both* themes — a deliberate contrast band, not a dark-mode variant — so it sets its
  // own foreground rather than inheriting the theme's.
  dark: 'bg-mk-ink text-slate-100',
  brand: 'bg-primary text-primary-foreground',
}

/**
 * One band of the page: full-bleed background, fluid vertical rhythm, bounded content.
 *
 * `bleed` skips the container for sections that manage their own (a hero with an image running to
 * the edge, say). `divide` adds the top hairline that separates two same-toned sections.
 */
export function Section({
  id,
  tone = 'default',
  size = 'default',
  divide = false,
  bleed = false,
  reveal = true,
  className,
  children,
}: {
  id?: string
  tone?: Tone
  size?: 'default' | 'sm' | 'none'
  divide?: boolean
  bleed?: boolean
  /**
   * Reveal the section's content as it scrolls into view. On by default, so eight interior pages
   * get the motion without a single edit each.
   *
   * Turn it off where a section stages its own children — the home page staggers items
   * individually, and a `Reveal` wrapping those would fade the whole block in at once and make
   * the stagger invisible. Also off for anything holding an absolutely positioned backdrop: the
   * `Aurora` would fade with the content instead of sitting behind it.
   */
  reveal?: boolean
  className?: string
  children: React.ReactNode
}) {
  const padding =
    size === 'none' ? '' : size === 'sm' ? 'py-(--spacing-section-sm)' : 'py-(--spacing-section)'

  const content = bleed ? children : <Container>{children}</Container>

  return (
    <section
      id={id}
      className={cn('relative', TONE[tone], padding, divide && 'border-t', className)}
    >
      {reveal ? <Reveal>{content}</Reveal> : content}
    </section>
  )
}

/**
 * A reading column. Caps measure at roughly 70 characters, which is where line length starts
 * costing comprehension — the one place narrowing is the right call.
 */
export function Prose({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('max-w-[68ch]', className)}>{children}</div>
}

/**
 * A section's heading block.
 *
 * Left-aligned by default. The old page centred every heading, which on a wide screen puts the
 * start of each line in a different place and gives the eye nothing to track down the page;
 * centring earns its place on a short call to action, not on six sections in a row.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  tone = 'default',
  className,
}: {
  eyebrow?: string
  title: string
  lead?: string
  align?: 'left' | 'center'
  tone?: Tone
  className?: string
}) {
  const onDark = tone === 'dark' || tone === 'brand'
  return (
    <div
      className={cn(
        align === 'center' && 'mx-auto text-center',
        align === 'center' ? 'max-w-3xl' : 'max-w-4xl',
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-[0.14em]',
            onDark ? 'text-primary-foreground/70' : 'text-primary'
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className={cn('text-headline text-balance', eyebrow && 'mt-3')}>{title}</h2>
      {lead && (
        <p
          className={cn(
            'text-lead mt-4',
            onDark ? 'text-slate-300' : 'text-muted-foreground',
            align === 'center' && 'mx-auto'
          )}
        >
          {lead}
        </p>
      )}
    </div>
  )
}
