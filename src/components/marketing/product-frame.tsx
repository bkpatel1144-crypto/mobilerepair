import { cn } from '@/lib/utils'

/**
 * Browser chrome around a product shot.
 *
 * The frame is the point, not decoration: a bare screenshot of a web app on a web page reads as
 * part of the page, and the visitor cannot tell where the marketing site stops and the product
 * starts. Window chrome plus a URL bar says "this is the software" in a way a caption has to
 * explain.
 *
 * Takes either an image or children, so the same frame holds a real captured screenshot and the
 * hand-built mockup used where no screenshot exists yet — the surrounding layout does not change
 * when one is swapped for the other.
 */
export function ProductFrame({
  src,
  alt,
  url,
  badge,
  className,
  children,
}: {
  /** A captured screenshot. Omit to render `children` instead. */
  src?: string
  /** Required with `src`. Describes the screen, not the fact that it is a screenshot. */
  alt?: string
  /** Shown in the fake address bar. */
  url: string
  /** Corner label, e.g. marking sample data. */
  badge?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        // `text-card-foreground` is load-bearing, not tidiness. This frame is placed inside the
        // hero, whose section sets `text-slate-100` for the dark background — and a `bg-card`
        // child does not reset the inherited colour. Any text in the frame that did not name its
        // own colour was rendering near-white on a white card: the mockup's "Device Received",
        // "Assigned to Technician" and "Ready for Pickup" headings were all but invisible, while
        // the `text-muted-foreground` lines beneath them showed up fine, which made the labels
        // look deliberately faded rather than broken.
        'overflow-hidden rounded-xl border border-black/10 bg-card text-card-foreground shadow-2xl ring-1 ring-black/5 sm:rounded-2xl',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2.5 sm:px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="mx-auto max-w-full truncate rounded-md bg-background/80 px-2.5 py-1 font-mono text-[0.65rem] text-muted-foreground sm:text-xs">
          {url}
        </span>
        {badge ? (
          <span className="hidden shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-amber-800 sm:inline dark:bg-amber-500/15 dark:text-amber-300">
            {badge}
          </span>
        ) : (
          // Balances the traffic lights so the URL stays optically centred.
          <span className="hidden w-14 shrink-0 sm:block" aria-hidden="true" />
        )}
      </div>
      {src ? (
        // `loading="lazy"` on every frame except the hero's, which is above the fold on load;
        // callers pass their own priority by ordering. Width/height are set by the aspect box so
        // the reserved space matches the image and the page does not jump when it arrives.
        <img src={src} alt={alt ?? ''} className="block w-full" loading="lazy" decoding="async" />
      ) : (
        children
      )}
    </div>
  )
}
