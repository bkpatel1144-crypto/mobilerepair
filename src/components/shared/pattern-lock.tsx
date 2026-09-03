import { useEffect, useRef, useState } from 'react'
import { Grid3x3, RotateCcw, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
const DOT_POS: Record<number, [number, number]> = {
  1: [40, 40], 2: [100, 40], 3: [160, 40],
  4: [40, 100], 5: [100, 100], 6: [160, 100],
  7: [40, 160], 8: [100, 160], 9: [160, 160],
} // prettier-ignore
const HIT_RADIUS = 22

/** Encodes/decodes a pattern as `"1-2-3-6-9"` — dot indices in the order they were drawn. */
function parsePattern(value: string): number[] {
  return value
    .split('-')
    .map((n) => Number(n))
    .filter((n) => DOTS.includes(n as (typeof DOTS)[number]))
}

/**
 * The real "Draw Pattern" dialog behind the amber "⊞ Draw" button — a proper drag gesture (press
 * a dot, drag through the others, release), rendered with actual connecting lines between the
 * dots in sequence, matching the reference's own dialog: title + "Connect at least 2 dots"
 * subtitle, a live "Pattern: N dots connected" readout, and Clear / Cancel / Save Pattern.
 */
export function PatternLockPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (pattern: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<number[]>(() => parsePattern(value))
  const [dragging, setDragging] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  function hitTest(clientX: number, clientY: number): number | null {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 200
    const y = ((clientY - rect.top) / rect.height) * 200
    for (const dot of DOTS) {
      const [dx, dy] = DOT_POS[dot]
      if (Math.hypot(x - dx, y - dy) < HIT_RADIUS) return dot
    }
    return null
  }

  function handlePointerDown(e: React.PointerEvent) {
    const dot = hitTest(e.clientX, e.clientY)
    if (dot == null) return
    setDraft([dot])
    setDragging(true)
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const dot = hitTest(e.clientX, e.clientY)
    if (dot != null) setDraft((prev) => (prev.includes(dot) ? prev : [...prev, dot]))
  }
  function handlePointerUp() {
    setDragging(false)
  }

  function handleSave() {
    onChange(draft.join('-'))
    setOpen(false)
  }
  function handleClear() {
    setDraft([])
  }
  function handleCancel() {
    setDraft(parsePattern(value))
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setDraft(parsePattern(value))
          setOpen(true)
        }}
        className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-400"
      >
        <Grid3x3 className="size-3.5" />
        Draw
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                <Grid3x3 className="size-5" />
              </span>
              <div>
                <DialogTitle>Draw Pattern</DialogTitle>
                <DialogDescription>Connect at least 2 dots</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <svg
            ref={svgRef}
            viewBox="0 0 200 200"
            className="mx-auto w-full max-w-56 touch-none select-none rounded-lg border bg-muted/20"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {draft.slice(1).map((dot, i) => {
              const [x1, y1] = DOT_POS[draft[i]]
              const [x2, y2] = DOT_POS[dot]
              return (
                <line
                  key={dot}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  className="text-amber-500"
                />
              )
            })}
            {DOTS.map((dot) => {
              const [cx, cy] = DOT_POS[dot]
              const active = draft.includes(dot)
              return (
                <circle
                  key={dot}
                  cx={cx}
                  cy={cy}
                  r={active ? 9 : 6}
                  className={cn(
                    active ? 'fill-amber-500' : 'fill-muted-foreground/25',
                    'transition-[r]'
                  )}
                />
              )
            })}
          </svg>

          <p
            className={cn(
              'text-center text-sm font-medium',
              draft.length >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
            )}
          >
            Pattern: {draft.length} dots connected
          </p>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClear} disabled={draft.length === 0}>
              <RotateCcw className="size-3.5" />
              Clear
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={draft.length < 2}
              className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
            >
              <Check className="size-3.5" />
              Save Pattern
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Auto-advancing "Step N of total" replay of an already-saved pattern — opened by clicking the
 * "Pattern drawn" confirmation text itself (not the "Draw" button beside it, which re-opens
 * editing). A little live redraw of what was actually saved, cycling on a timer while open;
 * purely a nice touch, no state it owns needs to persist anywhere. */
export function PatternReplayPopover({ value, children }: { value: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const dots = parsePattern(value)

  if (dots.length === 0) return <>{children}</>

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" className="text-left" />}>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-4" align="start">
        {/* Mounted fresh each time the popover opens, so `step` naturally starts at 1 with no
         * "reset on reopen" effect needed — the same pattern used by the scanner modals. */}
        {open && <PatternReplayBody dots={dots} onClose={() => setOpen(false)} />}
      </PopoverContent>
    </Popover>
  )
}

function PatternReplayBody({ dots, onClose }: { dots: number[]; onClose: () => void }) {
  const total = dots.length
  const [step, setStep] = useState(1)

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s >= total ? 1 : s + 1))
    }, 700)
    return () => clearInterval(id)
  }, [total])

  const revealed = dots.slice(0, step)

  return (
    <>
      <p className="mb-3 text-center text-xs font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
        Step {step} of {total}
      </p>
      <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-40">
        {revealed.slice(1).map((dot, i) => {
          const [x1, y1] = DOT_POS[revealed[i]]
          const [x2, y2] = DOT_POS[dot]
          return (
            <line
              key={dot}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              className="text-amber-500"
            />
          )
        })}
        {DOTS.map((dot) => {
          const revealedIndex = revealed.indexOf(dot)
          const isRevealed = revealedIndex !== -1
          const isCurrent = dot === revealed[revealed.length - 1]
          const [cx, cy] = DOT_POS[dot]
          return (
            <g key={dot}>
              {isCurrent && (
                <circle cx={cx} cy={cy} r={13} className="fill-none stroke-amber-400" strokeWidth={2} />
              )}
              <circle cx={cx} cy={cy} r={isRevealed ? 9 : 5} className={isRevealed ? 'fill-amber-500' : 'fill-muted-foreground/25'} />
              {isRevealed && (
                <text x={cx} y={cy + 3.5} textAnchor="middle" className="fill-white text-[9px] font-bold">
                  {revealedIndex + 1}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={onClose}>
        Close
      </Button>
    </>
  )
}

/** Small read-only dot graphic for the detail page — nine dots with the saved pattern's dots
 * filled in, matching the job detail page's "PIN / PATTERN" mini-grid. */
export function PatternLockPreview({ value }: { value: string }) {
  const dots = parsePattern(value)
  return (
    <span className="inline-grid grid-cols-3 gap-1">
      {DOTS.map((d) => (
        <span
          key={d}
          className={cn('size-1.5 rounded-full', dots.includes(d) ? 'bg-amber-500' : 'bg-muted-foreground/25')}
        />
      ))}
    </span>
  )
}
