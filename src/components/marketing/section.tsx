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
        'mx-auto w-full max-w-(--container-page) px-5 sm:px-8 lg:px-12 xl:px-16',
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
  default: 'bg-background',
  muted: 'bg-muted/40',
  // Deliberately not a `dark:` variant — this section is dark in both themes, so it needs its
  // own foreground colors rather than inheriting the theme's.
  dark: 'bg-slate-950 text-slate-100',
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
  className,
  children,
}: {
  id?: string
  tone?: Tone
  size?: 'default' | 'sm' | 'none'
  divide?: boolean
  bleed?: boolean
  className?: string
  children: React.ReactNode
}) {
  const padding =
    size === 'none' ? '' : size === 'sm' ? 'py-(--spacing-section-sm)' : 'py-(--spacing-section)'

  return (
    <section
      id={id}
      className={cn('relative', TONE[tone], padding, divide && 'border-t', className)}
    >
      {bleed ? children : <Container>{children}</Container>}
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
