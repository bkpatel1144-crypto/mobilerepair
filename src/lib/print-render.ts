import { PRINT_BANDS, type PrintBand, type PrintElement, type PrintTemplateDoc } from '@/types/firestore'
import type { PrintContext } from '@/lib/print-contexts'

/** Print contexts are built from real records, so a field can legitimately be a number or
 * absent. Coerced once here rather than making every caller stringify its own context. */
function valueOf(values: PrintContext, key: string | null): string {
  if (!key) return ''
  const raw = values[key]
  return raw === null || raw === undefined ? '' : String(raw)
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** pt → mm. Everything on the canvas is authored in mm except type size, which is in points
 * because that is what every other print tool uses; this is the one conversion. */
function ptToMm(pt: number): number {
  return (pt * 25.4) / 72
}

function styleAttr(el: PrintElement, extra = ''): string {
  const s = el.style
  return [
    'position:absolute',
    `left:${el.x}mm`,
    `top:${el.y}mm`,
    `width:${el.w}mm`,
    `height:${el.h}mm`,
    `font-size:${s.fontSize}pt`,
    `line-height:${ptToMm(s.fontSize) * 1.25}mm`,
    s.bold ? 'font-weight:700' : 'font-weight:400',
    s.italic ? 'font-style:italic' : '',
    `text-align:${s.align}`,
    `color:${s.color}`,
    // About the centre, so a rotated element stays where it was placed rather than swinging off
    // its own top-left corner — which is also how the canvas draws it.
    el.rotation ? `transform:rotate(${el.rotation}deg)` : '',
    extra,
  ]
    .filter(Boolean)
    .join(';')
}

/** One element's HTML. `values` is the caller-supplied print context — see `print-contexts.ts`;
 * a field with no value in it renders empty rather than showing its own key. */
/** `visibleWhen` is evaluated against the record being printed, so one template serves both a
 * GST-registered shop and one without. `hidden` is *not* checked here — it is a designer-only
 * convenience for getting an element out of the way while working, and must still print. */
function passesCondition(el: PrintElement, values: PrintContext): boolean {
  if (!el.visibleWhen) return true
  const raw = values[el.visibleWhen.fieldKey]
  const isEmpty = raw === null || raw === undefined || String(raw).trim() === ''
  return el.visibleWhen.op === 'notEmpty' ? !isEmpty : isEmpty
}

function renderElement(el: PrintElement, values: PrintContext): string {
  if (!passesCondition(el, values)) return ''

  switch (el.type) {
    case 'line':
      return `<div style="${styleAttr(el, `border-top:${el.style.strokeWidth}mm ${el.style.borderStyle === 'dashed' ? 'dashed' : 'solid'} ${el.style.color};height:0`)}"></div>`

    case 'shape':
      return `<div style="${styleAttr(el, `border:${el.style.strokeWidth}mm solid ${el.style.color};background:${el.style.fill ?? 'transparent'}`)}"></div>`

    case 'image':
    case 'logo': {
      const src = el.type === 'logo' ? valueOf(values, 'shopLogo') || (el.text ?? '') : (el.text ?? '')
      if (!src) return ''
      return `<img src="${escapeHtml(src)}" style="${styleAttr(el, 'object-fit:contain')}" />`
    }

    case 'barcode':
    case 'qrcode': {
      // Rendered as the encoded text with a monospace face rather than a fake bar pattern. A
      // real symbology needs an encoder, and printing a decorative barcode that no scanner can
      // read would be worse than printing the value plainly — see PROGRESS.md's "no fake data"
      // bar. The value is still correct and human-readable.
      const raw = el.fieldKey ? valueOf(values, el.fieldKey) : (el.text ?? '')
      if (!raw) return ''
      return `<div style="${styleAttr(el, 'font-family:monospace;letter-spacing:0.3mm;display:flex;align-items:center;justify-content:center;border:0.2mm dashed #999')}">${escapeHtml(raw)}</div>`
    }

    case 'field': {
      const value = valueOf(values, el.fieldKey)
      if (el.showLabel) {
        // Caption pinned left, value right — the reference's "Name        Rahul Sharma" row.
        return `<div style="${styleAttr(el, 'display:flex;align-items:baseline;justify-content:space-between;gap:2mm')}"><span style="color:#555;font-weight:400">${escapeHtml(el.text ?? '')}</span><span style="text-align:right">${escapeHtml(value)}</span></div>`
      }
      return `<div style="${styleAttr(el)}">${escapeHtml(value)}</div>`
    }

    case 'text':
    default:
      return `<div style="${styleAttr(el)}">${escapeHtml(el.text ?? '')}</div>`
  }
}

function bandOffset(template: PrintTemplateDoc, band: PrintBand): number {
  let offset = 0
  for (const b of PRINT_BANDS) {
    if (b === band) break
    offset += template.bandHeights[b] ?? 0
  }
  return offset
}

/** The page body — bands stacked in order, each element absolutely placed inside its band. */
export function renderTemplateBody(template: PrintTemplateDoc, values: PrintContext): string {
  return PRINT_BANDS.map((band) => {
    const height = template.bandHeights[band] ?? 0
    if (height <= 0 && !template.elements.some((e) => e.band === band)) return ''
    const els = template.elements
      .filter((e) => e.band === band)
      .sort((a, b) => a.z - b.z)
      .map((e) => renderElement(e, values))
      .join('\n')
    return `<div style="position:absolute;left:0;top:${bandOffset(template, band)}mm;width:100%;height:${height}mm">${els}</div>`
  }).join('\n')
}

/** Full standalone HTML document for one template + one record's values. */
export function renderPrintHtml(template: PrintTemplateDoc, values: PrintContext): string {
  const { paper, margins, settings } = template
  const contentWidth = paper.width - margins.left - margins.right
  const totalHeight = PRINT_BANDS.reduce((sum, b) => sum + (template.bandHeights[b] ?? 0), 0)

  const one = `<div class="pt-page" style="position:relative;width:${contentWidth}mm;height:${totalHeight}mm">${renderTemplateBody(template, values)}</div>`
  // `duplicateCopy` is honoured here because it is purely a matter of what HTML we emit. The
  // other thermal settings (ups/gap/speed/density) are not — see `PrintSettings`' doc comment.
  const copies = settings.duplicateCopy ? [one, one] : [one]
  const sideBySide = settings.duplicateCopy && settings.duplicateCopyDirection === 'side-by-side'

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(template.name)}</title>
<style>
  @page { size: ${paper.width}mm ${paper.orientation === 'landscape' ? 'landscape' : 'auto'}; margin: 0; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    width: ${paper.width}mm;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pt-sheet { display: flex; flex-direction: ${sideBySide ? 'row' : 'column'}; gap: ${settings.gapMm}mm; }
</style>
</head>
<body>
<div class="pt-sheet">${copies.join('\n')}</div>
</body>
</html>`
}

/** Opens a new tab with the rendered HTML and triggers the browser's own print dialog once it's
 * loaded — the same client-side-only mechanism every "Print X" button in this app has used.
 * Note this is the browser's dialog: a template's `printSpeed`/`printDensity`/`ups`/`gapMm` are
 * stored configuration, not commands this path can send (see `PrintSettings`). */
export function openPrintWindow(html: string): void {
  const win = window.open('', '_blank', 'width=520,height=720')
  if (!win) return // popup blocked — nothing silently fakes success
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    win.focus()
    win.print()
  }
}
