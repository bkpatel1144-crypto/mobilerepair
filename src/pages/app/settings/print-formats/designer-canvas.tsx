import { useRef } from 'react'
import { PRINT_BANDS, type PrintBand, type PrintElement } from '@/types/firestore'
import { cn } from '@/lib/utils'
import type { DesignerDraft } from './use-designer-state'
import type { PrintContext } from '@/lib/print-contexts'

/** Screen pixels per millimetre at 100% zoom. 3.78 is the CSS definition (96dpi ÷ 25.4), so a
 * template drawn at 100% is genuinely life-size on a typical monitor. */
const PX_PER_MM = 96 / 25.4
const SNAP_MM = 0.5

function snap(value: number, enabled: boolean): number {
  return enabled ? Math.round(value / SNAP_MM) * SNAP_MM : Math.round(value * 100) / 100
}

/** What one element looks like on the canvas — deliberately a *separate* renderer from
 * `print-render.ts`. That one emits a standalone HTML document for the printer; this one draws
 * into the live DOM with selection chrome, sample values and band-relative positioning. Sharing
 * one renderer between them would mean the print output carrying editor affordances. */
function ElementView({ el, values }: { el: PrintElement; values: PrintContext }) {
  const s = el.style
  const text = (() => {
    if (el.type === 'field' && el.fieldKey) {
      const raw = values[el.fieldKey]
      return raw === null || raw === undefined ? `{${el.fieldKey}}` : String(raw)
    }
    return el.text ?? ''
  })()

  const base: React.CSSProperties = {
    fontSize: `${s.fontSize}pt`,
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? 'italic' : 'normal',
    textAlign: s.align,
    color: s.color,
    lineHeight: 1.25,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  }

  switch (el.type) {
    case 'line':
      return (
        <div
          style={{
            borderTop: `${Math.max(s.strokeWidth, 0.1) * PX_PER_MM}px ${s.borderStyle === 'dashed' ? 'dashed' : 'solid'} ${s.color}`,
            width: '100%',
          }}
        />
      )
    case 'shape':
      return (
        <div
          style={{
            border: `${Math.max(s.strokeWidth, 0.1) * PX_PER_MM}px solid ${s.color}`,
            background: s.fill ?? 'transparent',
            width: '100%',
            height: '100%',
          }}
        />
      )
    case 'logo':
    case 'image': {
      const src = el.type === 'logo' ? String(values.shopLogo ?? '') || (el.text ?? '') : (el.text ?? '')
      if (!src) {
        return (
          <div className="flex size-full items-center justify-center border border-dashed border-muted-foreground/40 text-[8px] text-muted-foreground">
            {el.type === 'logo' ? 'Logo' : 'Image'}
          </div>
        )
      }
      return <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    }
    case 'barcode':
    case 'qrcode':
      return (
        <div
          className="flex size-full items-center justify-center border border-dashed border-muted-foreground/50 font-mono"
          style={{ fontSize: `${Math.min(s.fontSize, 7)}pt`, letterSpacing: '0.5px' }}
        >
          {text || (el.type === 'qrcode' ? 'QR' : 'Barcode')}
        </div>
      )
    case 'field':
      if (el.showLabel) {
        return (
          <div style={{ ...base, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
            <span style={{ color: '#555', fontWeight: 400 }}>{el.text}</span>
            <span style={{ textAlign: 'right' }}>{text}</span>
          </div>
        )
      }
      return <div style={base}>{text}</div>
    default:
      return <div style={base}>{text}</div>
  }
}

export interface CanvasProps {
  draft: DesignerDraft
  values: PrintContext
  zoom: number
  showGrid: boolean
  activeBand: PrintBand
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onBandChange: (band: PrintBand) => void
  isLabel: boolean
  onGestureStart: () => void
  onGestureEnd: () => void
  onPreviewMove: (ids: string[], patch: (el: PrintElement) => PrintElement) => void
}

export function DesignerCanvas({
  draft,
  values,
  zoom,
  showGrid,
  activeBand,
  selectedIds,
  onSelect,
  onBandChange,
  isLabel,
  onGestureStart,
  onGestureEnd,
  onPreviewMove,
}: CanvasProps) {
  const scale = (zoom / 100) * PX_PER_MM
  const contentWidth = draft.paper.width - draft.margins.left - draft.margins.right
  const bands = isLabel ? (['detail'] as PrintBand[]) : PRINT_BANDS
  const dragRef = useRef<{ startX: number; startY: number; mode: 'move' | 'resize'; origin: PrintElement[] } | null>(null)

  function beginDrag(e: React.PointerEvent, mode: 'move' | 'resize', el: PrintElement) {
    if (el.locked) return
    e.stopPropagation()
    e.preventDefault()
    const ids = selectedIds.includes(el.id) ? selectedIds : [el.id]
    if (!selectedIds.includes(el.id)) onSelect([el.id])
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      mode,
      origin: draft.elements.filter((x) => ids.includes(x.id)).map((x) => ({ ...x })),
    }
    onGestureStart()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    // Divide by scale, so a drag moves the element by the distance the *pointer* travelled on
    // paper, not on screen — otherwise dragging at 50% zoom would move it twice as far.
    const dx = (e.clientX - drag.startX) / scale
    const dy = (e.clientY - drag.startY) / scale
    const ids = drag.origin.map((o) => o.id)

    onPreviewMove(ids, (el) => {
      const origin = drag.origin.find((o) => o.id === el.id)
      if (!origin) return el
      if (drag.mode === 'move') {
        return {
          ...el,
          x: Math.max(0, Math.min(snap(origin.x + dx, showGrid), contentWidth - origin.w)),
          y: Math.max(0, snap(origin.y + dy, showGrid)),
        }
      }
      return {
        ...el,
        w: Math.max(2, Math.min(snap(origin.w + dx, showGrid), contentWidth - origin.x)),
        h: Math.max(0.3, snap(origin.h + dy, showGrid)),
      }
    })
  }

  function endDrag() {
    if (!dragRef.current) return
    dragRef.current = null
    onGestureEnd()
  }

  return (
    <div
      className="flex min-h-full items-start justify-center overflow-auto bg-muted/40 p-8"
      onPointerDown={() => onSelect([])}
    >
      <div className="flex gap-3">
        {/* Band rail — click a label to switch which band new elements land in. */}
        <div className="flex flex-col gap-0" style={{ width: 62 }}>
          {bands.map((band) => (
            <button
              key={band}
              type="button"
              data-slot="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onBandChange(band)}
              style={{ height: Math.max(draft.bandHeights[band] * scale, 24) }}
              className={cn(
                'flex items-start justify-end pt-1 pr-2 text-[10px] font-semibold tracking-wide uppercase transition-colors',
                activeBand === band
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {band}
            </button>
          ))}
        </div>

        {/* Paper */}
        <div
          className="relative bg-white shadow-sm ring-1 ring-black/10"
          style={{
            width: draft.paper.width * scale,
            paddingTop: draft.margins.top * scale,
            paddingRight: draft.margins.right * scale,
            paddingBottom: draft.margins.bottom * scale,
            paddingLeft: draft.margins.left * scale,
          }}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="relative" style={{ width: contentWidth * scale }}>
            {bands.map((band) => {
              const height = Math.max(draft.bandHeights[band], 4)
              return (
                <div
                  key={band}
                  className={cn(
                    'relative border-b border-dashed border-teal-500/30 last:border-b-0',
                    activeBand === band && 'bg-teal-500/5'
                  )}
                  style={{
                    height: height * scale,
                    backgroundImage: showGrid
                      ? 'linear-gradient(to right, rgba(20,160,160,.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,160,160,.13) 1px, transparent 1px)'
                      : undefined,
                    backgroundSize: showGrid ? `${scale}px ${scale}px` : undefined,
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    onSelect([])
                    onBandChange(band)
                  }}
                >
                  {draft.elements
                    .filter((el) => el.band === band)
                    .sort((a, b) => a.z - b.z)
                    .map((el) => {
                      const isSelected = selectedIds.includes(el.id)
                      return (
                        <div
                          key={el.id}
                          onPointerDown={(e) => beginDrag(e, 'move', el)}
                          className={cn(
                            'absolute',
                            el.hidden && 'opacity-30',
                            el.locked ? 'cursor-not-allowed' : 'cursor-move',
                            isSelected
                              ? 'outline-2 outline-teal-600'
                              : 'outline-1 outline-transparent hover:outline-teal-500/40'
                          )}
                          style={{
                            left: el.x * scale,
                            top: el.y * scale,
                            width: el.w * scale,
                            height: Math.max(el.h * scale, 2),
                            zIndex: el.z,
                            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                          }}
                        >
                          <ElementView el={el} values={values} />
                          {/* A condition is invisible on paper by design, so the canvas has to
                            * say so — otherwise a row that will vanish at print time looks
                            * identical to one that won't. */}
                          {el.visibleWhen && (
                            <span
                              title={`Hidden when ${el.visibleWhen.fieldKey} is ${el.visibleWhen.op === 'notEmpty' ? 'empty' : 'set'}`}
                              className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-amber-950"
                            >
                              ?
                            </span>
                          )}
                          {isSelected && !el.locked && (
                            <span
                              onPointerDown={(e) => beginDrag(e, 'resize', el)}
                              className="absolute -right-1 -bottom-1 size-2.5 cursor-nwse-resize rounded-sm border border-white bg-teal-600"
                            />
                          )}
                        </div>
                      )
                    })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
