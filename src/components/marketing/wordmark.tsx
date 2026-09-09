import { COMPANY } from '@/config/company'
import { cn } from '@/lib/utils'

/**
 * The brand lockup: mark, product name, and the company name beneath it.
 *
 * The old header was a generic wrench glyph next to a 18px lowercase "aim", which gave a visitor
 * no idea who was behind the software — and "who is this company" is the first question anyone
 * asks before putting their shop's books into a stranger's web app. Naming AIM ENTERPRISE in the
 * lockup answers it in the one place that appears on every page.
 *
 * The mark is inline SVG rather than an icon-font glyph or an `<img>`: it renders at the same
 * moment as the text (no second request, no layout shift), scales without a raster, and its
 * strokes take `currentColor`, so the one component works on the light header and the dark
 * footer without a second asset.
 */
export function Wordmark({
  className,
  tone = 'default',
  showCompany = true,
}: {
  className?: string
  /** `inverse` for placement on a dark background. */
  tone?: 'default' | 'inverse'
  showCompany?: boolean
}) {
  const inverse = tone === 'inverse'
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] shadow-sm',
          inverse ? 'bg-white text-slate-900' : 'bg-primary text-primary-foreground'
        )}
      >
        {/* A lowercase single-storey "a" — a ring plus a stem — matching public/favicon.svg so
         * the browser tab and the header are recognisably the same mark. */}
        <svg viewBox="0 0 64 64" className="size-5" aria-hidden="true" fill="none">
          <circle cx="27" cy="36" r="11.5" stroke="currentColor" strokeWidth="7" />
          <rect x="38" y="21" width="7" height="30" rx="3.5" fill="currentColor" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            'text-[1.35rem] font-bold tracking-tight',
            inverse ? 'text-white' : 'text-foreground'
          )}
        >
          {COMPANY.productName}
        </span>
        {showCompany && (
          <span
            className={cn(
              'mt-0.5 truncate text-[0.6rem] font-semibold uppercase tracking-[0.16em]',
              inverse ? 'text-slate-400' : 'text-muted-foreground'
            )}
          >
            {COMPANY.legalName}
          </span>
        )}
      </span>
    </span>
  )
}
