import type { PrintBand, PrintDocumentType, PrintElement, PrintElementStyle } from '@/types/firestore'
import type { PrintPresetDef } from '@/config/print-presets'

/**
 * The authored default content for each template.
 *
 * `data/document-templates.json` carries paper/margins/settings but **no element data at all**
 * (`extraSlots` is `[]` on all 19 of its templates), so the layouts themselves are written here,
 * modelled on the reference designer's own rendering: a centred shop header, a detail body of
 * "Caption................value" rows grouped under small-caps section headings with rules
 * between them, and a centred thank-you footer.
 *
 * Rows are *composed*, not hand-positioned. Every element's `y` is derived by stacking whatever
 * comes before it, so a template stays correct when a row is inserted, and a 58mm and an 80mm
 * variant of the same document share one definition instead of two sets of coordinates that
 * drift apart. The designer writes absolute mm back out on save — this file only decides where
 * things start.
 */

const LINE_H = 4.2 // mm per text row
const GAP_SM = 1.2
const GAP_MD = 2.4

export const DEFAULT_STYLE: PrintElementStyle = {
  fontSize: 8,
  bold: false,
  italic: false,
  align: 'left',
  color: '#000000',
  strokeWidth: 0.2,
  fill: null,
  borderStyle: 'solid',
}

export function makeStyle(patch: Partial<PrintElementStyle> = {}): PrintElementStyle {
  return { ...DEFAULT_STYLE, ...patch }
}

/** A declarative row, resolved into a positioned `PrintElement` by `buildBand()`. */
type Row =
  | { kind: 'field'; fieldKey: string; label: string; bold?: boolean; size?: number }
  | { kind: 'value'; fieldKey: string; bold?: boolean; size?: number; align?: 'left' | 'center' | 'right' }
  | { kind: 'text'; text: string; bold?: boolean; size?: number; align?: 'left' | 'center' | 'right'; muted?: boolean }
  | { kind: 'section'; text: string }
  | { kind: 'rule' }
  | { kind: 'space'; mm: number }

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `el-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Stacks `rows` down a band of `contentWidth` mm, returning positioned elements plus the total
 * height consumed — the caller uses that height to size the band itself. */
function buildBand(band: PrintBand, rows: Row[], contentWidth: number): { elements: PrintElement[]; height: number } {
  const elements: PrintElement[] = []
  let y = 0
  let z = 0

  const base = (type: PrintElement['type'], h: number, style: PrintElementStyle): PrintElement => ({
    id: nextId(),
    band,
    type,
    x: 0,
    y,
    w: contentWidth,
    h,
    z: z++,
    fieldKey: null,
    text: null,
    showLabel: false,
    symbology: null,
    style,
    locked: false,
    hidden: false,
  })

  for (const row of rows) {
    switch (row.kind) {
      case 'field':
        elements.push({
          ...base('field', LINE_H, makeStyle({ fontSize: row.size ?? 8, bold: row.bold ?? false })),
          fieldKey: row.fieldKey,
          text: row.label,
          showLabel: true,
        })
        y += LINE_H
        break
      case 'value':
        elements.push({
          ...base(
            'field',
            LINE_H,
            makeStyle({ fontSize: row.size ?? 8, bold: row.bold ?? false, align: row.align ?? 'left' })
          ),
          fieldKey: row.fieldKey,
          showLabel: false,
        })
        y += LINE_H
        break
      case 'text':
        elements.push({
          ...base(
            'text',
            LINE_H,
            makeStyle({
              fontSize: row.size ?? 8,
              bold: row.bold ?? false,
              align: row.align ?? 'left',
              color: row.muted ? '#666666' : '#000000',
            })
          ),
          text: row.text,
        })
        y += LINE_H
        break
      case 'section':
        y += GAP_SM
        elements.push({
          ...base('text', LINE_H - 0.6, makeStyle({ fontSize: 6.5, bold: true, color: '#555555' })),
          text: row.text.toUpperCase(),
        })
        y += LINE_H - 0.6
        break
      case 'rule':
        y += GAP_SM
        elements.push({ ...base('line', 0.3, makeStyle({ strokeWidth: 0.2 })) })
        y += 0.3 + GAP_SM
        break
      case 'space':
        y += row.mm
        break
    }
  }

  return { elements, height: Math.max(y, 2) }
}

const SHOP_HEADER: Row[] = [
  { kind: 'value', fieldKey: 'shopName', bold: true, size: 11, align: 'center' },
  { kind: 'value', fieldKey: 'shopPhone', size: 7, align: 'center' },
]

const THANKS_FOOTER: Row[] = [
  { kind: 'text', text: 'Thank you for choosing us!', bold: true, size: 8.5, align: 'center' },
  { kind: 'text', text: 'Please keep this receipt for reference.', size: 6.5, align: 'center', muted: true },
]

/** Per-document-type detail content. Keys not listed fall back to `GENERIC_DETAIL`. */
const DETAIL_ROWS: Partial<Record<PrintDocumentType, Row[]>> = {
  jobCard: [
    { kind: 'value', fieldKey: 'jobNumber', bold: true, size: 10 },
    { kind: 'value', fieldKey: 'createdAt', size: 6.5 },
    { kind: 'rule' },
    { kind: 'section', text: 'Customer' },
    { kind: 'field', fieldKey: 'customerName', label: 'Name', bold: true },
    { kind: 'field', fieldKey: 'customerMobile', label: 'Mobile', bold: true },
    { kind: 'rule' },
    { kind: 'section', text: 'Device' },
    { kind: 'field', fieldKey: 'deviceTypeName', label: 'Type' },
    { kind: 'field', fieldKey: 'brandName', label: 'Brand' },
    { kind: 'field', fieldKey: 'model', label: 'Model', bold: true },
    { kind: 'field', fieldKey: 'imei', label: 'IMEI' },
    { kind: 'rule' },
    { kind: 'section', text: 'Problem Reported' },
    { kind: 'value', fieldKey: 'problemLabels' },
    { kind: 'rule' },
    { kind: 'field', fieldKey: 'receivedByName', label: 'Received By', bold: true },
    { kind: 'section', text: 'Payment Summary' },
    { kind: 'field', fieldKey: 'estimatedCost', label: 'Estimated Cost', bold: true },
    { kind: 'field', fieldKey: 'advanceReceived', label: 'Advance Paid', bold: true },
  ],
  jobCardBill: [
    { kind: 'value', fieldKey: 'jobNumber', bold: true, size: 10 },
    { kind: 'rule' },
    { kind: 'section', text: 'Customer' },
    { kind: 'field', fieldKey: 'customerName', label: 'Name', bold: true },
    { kind: 'field', fieldKey: 'customerMobile', label: 'Mobile' },
    { kind: 'rule' },
    { kind: 'section', text: 'Device' },
    { kind: 'field', fieldKey: 'brandName', label: 'Brand' },
    { kind: 'field', fieldKey: 'model', label: 'Model', bold: true },
    { kind: 'rule' },
    { kind: 'section', text: 'Amount' },
    { kind: 'field', fieldKey: 'finalAmount', label: 'Total', bold: true, size: 9 },
    { kind: 'field', fieldKey: 'paidAmount', label: 'Paid', bold: true },
  ],
  paymentReceipt: [
    { kind: 'value', fieldKey: 'receiptNumber', bold: true, size: 10 },
    { kind: 'value', fieldKey: 'createdAt', size: 6.5 },
    { kind: 'rule' },
    { kind: 'field', fieldKey: 'partyName', label: 'Received From', bold: true },
    { kind: 'field', fieldKey: 'mode', label: 'Mode' },
    { kind: 'rule' },
    { kind: 'field', fieldKey: 'amount', label: 'Amount', bold: true, size: 10 },
  ],
}

const GENERIC_DETAIL: Row[] = [
  { kind: 'section', text: 'Details' },
  { kind: 'text', text: 'Add fields from the panel on the left.', size: 7, muted: true },
]

/** Labels are a single small area — no bands, no rules, just the identifying marks. */
const LABEL_ROWS: Partial<Record<PrintDocumentType, Row[]>> = {
  barcodeLabel: [
    { kind: 'value', fieldKey: 'itemName', bold: true, size: 7, align: 'center' },
    { kind: 'value', fieldKey: 'sellingPrice', bold: true, size: 8, align: 'center' },
  ],
  productLabel: [
    { kind: 'value', fieldKey: 'itemName', bold: true, size: 7.5, align: 'center' },
    { kind: 'value', fieldKey: 'sellingPrice', bold: true, size: 8, align: 'center' },
  ],
  customerLabel: [
    { kind: 'value', fieldKey: 'customerName', bold: true, size: 8, align: 'center' },
    { kind: 'value', fieldKey: 'customerMobile', size: 7, align: 'center' },
  ],
  deviceTagLabel: [
    { kind: 'value', fieldKey: 'jobNumber', bold: true, size: 8, align: 'center' },
    { kind: 'value', fieldKey: 'customerName', size: 7, align: 'center' },
    { kind: 'value', fieldKey: 'model', size: 7, align: 'center' },
  ],
  secondHandDeviceLabel: [
    { kind: 'value', fieldKey: 'deviceLabel', bold: true, size: 7.5, align: 'center' },
    { kind: 'value', fieldKey: 'salePrice', bold: true, size: 8, align: 'center' },
  ],
}

export interface BuiltLayout {
  elements: PrintElement[]
  bandHeights: Record<PrintBand, number>
}

/** Produces the seeded content for one preset. */
export function buildDefaultLayout(preset: PrintPresetDef): BuiltLayout {
  const contentWidth = Math.max(preset.paper.width - preset.margins.left - preset.margins.right, 10)

  if (preset.category === 'label') {
    const rows = LABEL_ROWS[preset.documentType] ?? [
      { kind: 'text', text: 'Label', bold: true, size: 8, align: 'center' },
    ]
    const detail = buildBand('detail', rows, contentWidth)
    const usable = preset.paper.height - preset.margins.top - preset.margins.bottom
    return {
      elements: detail.elements,
      bandHeights: { header: 0, detail: Math.max(detail.height, usable), footer: 0 },
    }
  }

  const header = buildBand('header', SHOP_HEADER, contentWidth)
  const detail = buildBand(
    'detail',
    [
      { kind: 'space', mm: GAP_MD },
      ...(DETAIL_ROWS[preset.documentType] ?? GENERIC_DETAIL),
    ],
    contentWidth
  )
  const footer = buildBand('footer', [{ kind: 'space', mm: GAP_MD }, ...THANKS_FOOTER], contentWidth)

  return {
    elements: [...header.elements, ...detail.elements, ...footer.elements],
    bandHeights: { header: header.height, detail: detail.height, footer: footer.height },
  }
}
