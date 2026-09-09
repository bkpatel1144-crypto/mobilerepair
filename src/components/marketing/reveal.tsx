import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Reveals its children as they scroll into view.
 *
 * `IntersectionObserver` rather than a scroll listener: the browser does the work off the main
 * thread, so a page with forty of these costs nothing during a flick-scroll on a phone, which a
 * `scroll` handler recalculating positions would not survive.
 *
 * It unobserves after the first entry. A reveal that replays every time you scroll back up is a
 * page showing off rather than a page being read.
 *
 * The transition itself lives in `index.css` under `[data-reveal]`, so this component only
 * toggles one attribute. That is also what makes reduced-motion honest: the media query there
 * sets both the hidden and shown states to visible, so if the observer never fires — no support,
 * or a print stylesheet — the content is still on the page rather than stuck at `opacity: 0`.
 */
export function Reveal({
  children,
  className,
  /** Stagger, in milliseconds, for items in a row. */
  delay = 0,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article'
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // No observer (or a very old browser): show it immediately rather than leave it hidden.
    if (typeof IntersectionObserver === 'undefined') {
      node.dataset.reveal = 'in'
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.reveal = 'in'
          observer.unobserve(entry.target)
        }
      },
      // A negative bottom margin means an element reveals slightly *before* its top edge
      // arrives, so the animation is finishing as it reaches comfortable reading position
      // instead of starting there.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  )
}
