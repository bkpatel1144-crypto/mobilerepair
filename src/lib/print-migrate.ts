import type {
  PrintBand,
  PrintElement,
  PrintTemplateDoc,
  PrintTemplateDocV1,
} from '@/types/firestore'
import { makeStyle } from '@/config/print-layouts'

const LINE_H = 4.2
const FONT_PT: Record<'sm' | 'md' | 'lg', number> = { sm: 7, md: 8.5, lg: 11 }
const PAPER_WIDTH_MM: Record<PrintTemplateDocV1['paperWidth'], number> = {
  '58mm': 58,
  '80mm': 80,
  a4: 210,
}
const PAPER_HEIGHT_MM: Record<PrintTemplateDocV1['paperWidth'], number> = {
  '58mm': 190,
  '80mm': 190,
  a4: 297,
}

/**
 * Reads a v1 template (a flat, ordered `blocks` array) as a v2 one (banded, mm-positioned
 * `elements`).
 *
 * Done on *read* rather than as a one-shot migration script, because this project is
 * client-SDK-only — there is no server, no Admin SDK and no Cloud Function that could sweep
 * every tenant's `printTemplates` collection. A read-time upgrade means an old template renders
 * and opens correctly on first sight, and is rewritten in the new shape the next time someone
 * saves it. Nothing has to be migrated ahead of time, and a company that never opens the
 * designer keeps printing exactly as before.
 *
 * v1 had no concept of bands, so every block lands in `detail`: that is what v1 actually printed
 * (one continuous run of lines), and inventing a header/footer split here would silently change
 * people's existing output rather than preserve it.
 */
export function migratePrintTemplate(raw: PrintTemplateDoc | PrintTemplateDocV1): PrintTemplateDoc {
  if ((raw as PrintTemplateDoc).schemaVersion === 2) return raw as PrintTemplateDoc

  const v1 = raw as PrintTemplateDocV1
  const width = PAPER_WIDTH_MM[v1.paperWidth] ?? 80
  const margin = v1.paperWidth === 'a4' ? 10 : 3
  const contentWidth = width - margin * 2

  let y = 0
  let z = 0
  const elements: PrintElement[] = (v1.blocks ?? []).map((b) => {
    const isDivider = b.kind === 'divider'
    const h = isDivider ? 0.3 : LINE_H
    const el: PrintElement = {
      id: b.id,
      band: 'detail' as PrintBand,
      type: isDivider ? 'line' : b.kind === 'field' ? 'field' : 'text',
      x: 0,
      y,
      w: contentWidth,
      h,
      z: z++,
      fieldKey: b.kind === 'field' ? b.fieldKey : null,
      // v1 printed a field as "Label: value" on one line, so the label survives as the caption.
      text: b.kind === 'text' ? b.text : b.kind === 'field' ? b.label : null,
      showLabel: b.kind === 'field',
      symbology: null,
      style: makeStyle({
        fontSize: FONT_PT[b.fontSize] ?? 8.5,
        bold: b.bold,
        align: b.align,
      }),
      locked: false,
      hidden: false,
    }
    y += h + (isDivider ? 1.2 : 0)
    return el
  })

  return {
    schemaVersion: 2,
    name: v1.name,
    documentType: v1.documentType,
    category: 'bill',
    presetKey: v1.paperWidth,
    paper: {
      width,
      height: PAPER_HEIGHT_MM[v1.paperWidth] ?? 190,
      unit: 'mm',
      orientation: 'portrait',
    },
    margins: { top: margin, right: margin, bottom: margin, left: margin },
    settings: {
      copies: 1,
      duplicateCopy: false,
      duplicateCopyDirection: 'stacked',
      ups: 1,
      gapMm: 2,
      printSpeed: 4,
      printDensity: 8,
    },
    bandHeights: { header: 0, detail: Math.max(y, 10), footer: 0 },
    elements,
    isDefault: v1.isDefault,
    isActive: true,
    version: 1,
    protected: v1.protected,
    createdById: v1.createdById,
    createdByName: v1.createdByName,
    createdAt: v1.createdAt,
    updatedAt: v1.updatedAt,
  }
}
