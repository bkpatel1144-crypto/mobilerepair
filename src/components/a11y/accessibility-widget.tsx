import { useEffect, useRef, useState } from 'react'
import {
  Accessibility,
  AArrowUp,
  AArrowDown,
  Contrast,
  RotateCcw,
  Type,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAccessibility } from '@/hooks/use-accessibility'
import { useReadAloud } from '@/hooks/use-read-aloud'
import { MAX_FONT_SCALE, MIN_FONT_SCALE } from '@/lib/accessibility'
import { cn } from '@/lib/utils'

/**
 * The floating accessibility toolbar, on every public page.
 *
 * A tab pinned to the left edge that opens a panel, rather than another item in the header: the
 * people who need it most are those least likely to find it inside a menu, and the convention of
 * a persistent edge tab is now well enough established that it reads as "accessibility" on sight.
 *
 * Everything here also lives in Settings > Preferences inside the app, off the same hook — this
 * is the discoverable surface, that is the one someone goes looking for deliberately.
 */
export function AccessibilityWidget() {
  const { t } = useTranslation()
  const { prefs, update, increaseFont, decreaseFont, reset, isModified } = useAccessibility()
  const { speaking, isSupported, toggle: toggleSpeech, stop } = useReadAloud()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape closes, and a click outside closes — both expected of a floating panel, and without
  // them the panel covers the content it is meant to help someone read.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // Deferred a tick so the click that opened the panel does not immediately close it.
    const id = setTimeout(() => document.addEventListener('mousedown', onClick), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(id)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const percent = Math.round(prefs.fontScale * 100)

  return (
    // Bottom-left on a phone, vertically centred from `lg` up.
    //
    // Centred everywhere put the tab straight on top of the hero paragraph at 390px — it covered
    // the start of a line, so the copy read "...arranty in one connected system". On a wide screen
    // the tab sits in the gutter beside the content and overlaps nothing, but a phone has no
    // gutter to sit in, and a floating control that hides the words underneath it is a poor trade
    // on the one page that has to be read.
    <div
      ref={panelRef}
      className="fixed bottom-6 left-0 z-50 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2"
    >
      <div className="flex items-end lg:items-start">
        {/* The edge tab. Vertical text so it takes almost no horizontal room on a phone, where
         * the panel itself would otherwise cover most of the screen. */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={t('a11y.title')}
          className={cn(
            // A round 44px button on a phone, the labelled edge tab from `lg` up.
            //
            // The tab shape only works where there is a gutter for it to live in. On a phone the
            // content runs to both edges, so a 40x72 tab clipped whatever it happened to be over
            // — after moving it out of the hero paragraph it landed on the product mockup's first
            // status label instead. A circle is the smallest footprint that stays a 44px target,
            // and bottom-left is where a phone user already expects a floating control.
            'flex items-center justify-center bg-slate-900 text-white shadow-lg transition-colors hover:bg-slate-800',
            'ml-3 size-11 rounded-full',
            'lg:ml-0 lg:h-auto lg:w-10 lg:flex-col lg:gap-1.5 lg:rounded-full lg:rounded-l-none lg:py-3.5',
            open && 'bg-primary hover:bg-primary'
          )}
        >
          <Accessibility className="size-5" />
          <span className="hidden text-[0.6rem] font-semibold uppercase tracking-wider [writing-mode:vertical-rl] lg:inline">
            {t('a11y.tab')}
          </span>
        </button>

        {open && (
          <div className="ml-2 w-[15.5rem] rounded-2xl border bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                <Accessibility className="size-4" />
                {t('a11y.title')}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
                className="-mr-1.5 -mt-1.5 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <Group label={t('a11y.fontSize')}>
              <div className="grid grid-cols-2 gap-2">
                <ControlButton
                  onClick={increaseFont}
                  disabled={prefs.fontScale >= MAX_FONT_SCALE}
                  label={t('a11y.increase')}
                >
                  <AArrowUp className="size-4" />
                  <span aria-hidden="true">A+</span>
                </ControlButton>
                <ControlButton
                  onClick={decreaseFont}
                  disabled={prefs.fontScale <= MIN_FONT_SCALE}
                  label={t('a11y.decrease')}
                >
                  <AArrowDown className="size-4" />
                  <span aria-hidden="true">A−</span>
                </ControlButton>
              </div>
              {/* The current value, announced on change. Two presses of A+ with no feedback
               * leaves someone unsure whether the control did anything. */}
              <p aria-live="polite" className="mt-2 text-center text-xs text-muted-foreground">
                {t('a11y.currentSize', { percent })}
              </p>
            </Group>

            <Group label={t('a11y.display')}>
              <ControlButton
                onClick={() => update({ highContrast: !prefs.highContrast })}
                pressed={prefs.highContrast}
                label={t('a11y.highContrast')}
                full
              >
                <Contrast className="size-4" />
                <span>{t('a11y.highContrast')}</span>
              </ControlButton>
              <ControlButton
                onClick={() => update({ dyslexiaFont: !prefs.dyslexiaFont })}
                pressed={prefs.dyslexiaFont}
                label={t('a11y.dyslexiaFont')}
                full
                className="mt-2"
              >
                <Type className="size-4" />
                <span>{t('a11y.dyslexiaFont')}</span>
              </ControlButton>
            </Group>

            {isSupported && (
              <Group label={t('a11y.audio')}>
                <ControlButton
                  onClick={toggleSpeech}
                  pressed={speaking}
                  label={speaking ? t('a11y.stopReading') : t('a11y.listenToPage')}
                  full
                >
                  {speaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  <span>{speaking ? t('a11y.stopReading') : t('a11y.listenToPage')}</span>
                </ControlButton>
              </Group>
            )}

            <button
              type="button"
              onClick={() => {
                stop()
                reset()
              }}
              disabled={!isModified}
              className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
            >
              <RotateCcw className="size-4" />
              {t('a11y.resetAll')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

/** `min-h-10` on every control: this is the one panel where a cramped tap target is a
 *  contradiction in terms. */
function ControlButton({
  onClick,
  disabled,
  pressed,
  label,
  full,
  className,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  pressed?: boolean
  label: string
  full?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      className={cn(
        'flex min-h-10 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors',
        full ? 'w-full px-3' : 'px-2',
        pressed
          ? 'border-primary bg-primary/10 text-primary'
          : 'hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
        className
      )}
    >
      {children}
    </button>
  )
}
