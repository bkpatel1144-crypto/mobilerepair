import { describe, it, expect } from 'vitest'
import { renderPrintHtml } from '@/lib/print-render'
import type { PrintTemplateDoc, PrintElement } from '@/types/firestore'

/**
 * These assert the CSS the *printer* receives, which is the half nobody was looking at.
 *
 * The designer canvas rendered an 80mm receipt perfectly while the generated document carried
 * `@page { size: 80mm auto }` — not valid CSS, because `size` takes one length, two lengths, or
 * a named page size with an optional orientation keyword, never a length paired with `auto` or
 * with `landscape`. An invalid declaration is dropped whole, so every print in the app came out
 * on the browser default regardless of the paper the template specified. Nothing on screen
 * showed it; you only find out at the printer.
 */

const STYLE = {
  fontSize: 8,
  bold: false,
  italic: false,
  align: 'center' as const,
  color: '#000',
  strokeWidth: 0,
  fill: null,
  borderStyle: 'none' as const,
}

function element(over: Partial<PrintElement>): PrintElement {
  return {
    id: 'e',
    band: 'detail',
    type: 'text',
    x: 0,
    y: 0,
    w: 60,
    h: 12,
    z: 0,
    fieldKey: null,
    text: null,
    rotation: 0,
    showLabel: false,
    style: STYLE,
    ...over,
  } as PrintElement
}

function template(over: Partial<PrintTemplateDoc> = {}): PrintTemplateDoc {
  const elements: PrintElement[] = [
    element({ id: 'e1', type: 'barcode', text: 'JC-2026-27-00041' }),
    element({ id: 'e2', type: 'qrcode', y: 14, w: 20, h: 20, text: 'JC-2026-27-00041' }),
  ]
  return {
    name: 'Test',
    documentType: 'jobCard',
    paper: { width: 80, height: 200, unit: 'mm', orientation: 'portrait' },
    margins: { top: 3, right: 3, bottom: 3, left: 3 },
    settings: { gapMm: 2, duplicateCopy: false, duplicateCopyDirection: 'stacked' },
    bandHeights: { header: 20, detail: 40, footer: 10 },
    elements,
    isDefault: true,
    isActive: true,
    ...over,
  } as PrintTemplateDoc
}

const pageRule = (html: string) => (html.match(/@page \{[^}]*\}/) ?? ['(none)'])[0]

describe('renderPrintHtml — paper size', () => {
  it('emits a valid two-length @page size, not a length plus auto', () => {
    const rule = pageRule(renderPrintHtml(template(), {} as never))
    expect(rule).toContain('size: 80mm 200mm')
    expect(rule).not.toContain('auto')
  })

  it('swaps the dimensions for landscape rather than using the orientation keyword', () => {
    // `size: 210mm landscape` is as invalid as `size: 80mm auto`, and fails the same silent way.
    const rule = pageRule(
      renderPrintHtml(
        template({
          paper: { width: 210, height: 297, unit: 'mm', orientation: 'landscape' },
        }),
        {} as never
      )
    )
    expect(rule).toContain('size: 297mm 210mm')
    expect(rule).not.toContain('landscape')
  })

  it('gives roll stock a real page length instead of a zero one', () => {
    const rule = pageRule(
      renderPrintHtml(
        template({ paper: { width: 58, height: 0, unit: 'mm', orientation: 'portrait' } }),
        {} as never
      )
    )
    expect(rule).toMatch(/size: 58mm \d+mm/)
    expect(rule).not.toContain('0mm;')
  })

  it('sets the body width to the printed page, so content is not laid out for A4', () => {
    expect(renderPrintHtml(template(), {} as never)).toContain('width: 80mm;')
  })
})

describe('renderPrintHtml — barcode and QR', () => {
  it('draws real symbols rather than the value in a box', () => {
    const html = renderPrintHtml(template(), {} as never)
    expect(html).toContain('<svg')
    expect(html).not.toContain('dashed')
  })

  it('embeds them inline, with no external request', () => {
    // Printed HTML is written into a blank popup; an external URL would print as a broken box.
    const html = renderPrintHtml(template(), {} as never)
    expect(html).not.toMatch(/<img[^>]+src="https?:/)
  })

  it('falls back to plain text when Code 128 cannot carry the value', () => {
    const html = renderPrintHtml(
      template({
        elements: [element({ id: 'e1', type: 'barcode', text: 'देवनागरी' })],
      }),
      {} as never
    )
    expect(html).toContain('monospace')
    expect(html).not.toContain('<svg')
  })
})
