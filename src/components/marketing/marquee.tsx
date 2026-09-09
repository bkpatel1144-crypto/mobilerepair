import { cn } from '@/lib/utils'

/**
 * A continuously scrolling row.
 *
 * Used for the device brands the software actually ships with — Samsung, Xiaomi, Apple, OnePlus
 * and the rest of the twenty seeded into every new company. Worth stating plainly: this is a
 * marquee of *real* seed data, not the row of borrowed customer logos this pattern is usually
 * used for. There are no customers to name yet, and inventing them on a page a shop owner will
 * judge the product by is not a trade worth making. The brands are true, checkable, and answer
 * the question a repair shop actually has — will it already know my devices?
 *
 * The children are rendered twice. The track translates by exactly -50%, so at the end of the
 * cycle the second copy sits precisely where the first started and the loop is seamless with no
 * measurement in JavaScript. The duplicate is `aria-hidden`, so a screen reader hears the list
 * once.
 *
 * Masked at both edges rather than faded with an overlay: an overlay has to know the background
 * colour behind it, which breaks the moment the section tone changes.
 */
export function Marquee({
  children,
  className,
  /** Seconds for one full pass. Longer for wider content, or it reads as frantic. */
  duration = 42,
  reverse = false,
}: {
  children: React.ReactNode
  className?: string
  duration?: number
  reverse?: boolean
}) {
  return (
    <div
      className={cn('mk-marquee-host relative overflow-hidden', className)}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div
        className="mk-marquee flex w-max"
        style={
          {
            '--mk-marquee-duration': `${duration}s`,
            animationDirection: reverse ? 'reverse' : undefined,
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
