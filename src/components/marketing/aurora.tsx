import { cn } from '@/lib/utils'

/**
 * The light behind a dark section.
 *
 * Three drifting radial gradients rather than one static wash. A single fixed glow is the
 * default-template look; overlapping colours that move slowly read as depth, and the middle
 * layer is deliberately warm so the field is not uniformly teal — a page lit by one hue looks
 * tinted rather than lit.
 *
 * Inline styles, not Tailwind arbitrary values. The v3-style
 * `bg-[radial-gradient(...,var(--tw-gradient-stops))]` silently fails to resolve under Tailwind
 * v4's engine, and this project has already shipped a "dark navy hero" that rendered near-white
 * with unreadable text because of exactly that.
 *
 * `mk-drift` is an 18-second cycle, and `mk-grain` sits on top: a few percent of noise stops a
 * large gradient banding on an 8-bit display, which is where big dark fields usually fall apart.
 * Both stop under `prefers-reduced-motion`.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div className={cn('mk-grain pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {/* Dot grid, masked so it fades out before the content starts. Structure behind the light
       * is what keeps a large dark band from reading as an empty rectangle. */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(color-mix(in oklab, white 55%, transparent) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(80% 60% at 50% 0%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(80% 60% at 50% 0%, black, transparent 75%)',
        }}
      />
      <div
        className="mk-drift absolute -top-1/3 -left-1/4 h-[78rem] w-[78rem] opacity-95"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--color-mk-accent) 72%, transparent), transparent 62%)',
        }}
      />
      <div
        className="mk-drift absolute top-1/4 right-[-20%] h-[58rem] w-[58rem] opacity-65"
        style={{
          animationDelay: '-6s',
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--color-mk-warm) 55%, transparent), transparent 60%)',
        }}
      />
      <div
        className="mk-drift absolute -bottom-1/3 left-1/3 h-[52rem] w-[52rem] opacity-70"
        style={{
          animationDelay: '-12s',
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--color-mk-accent-soft) 58%, transparent), transparent 62%)',
        }}
      />
    </div>
  )
}
