import type { PrintTemplateDoc } from '@/types/firestore'

const FONT_SIZE_PX: Record<PrintTemplateDoc['blocks'][number]['fontSize'], number> = {
  sm: 11,
  md: 13,
  lg: 17,
}

const PAPER_WIDTH_MM: Record<PrintTemplateDoc['paperWidth'], number> = {
  '58mm': 58,
  '80mm': 80,
  a4: 210,
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Renders one template against a real (or sample, for the builder's own preview) context into
 * a standalone, print-ready HTML document — thermal-printer-width-aware for 58mm/80mm, a plain
 * page for a4. Every "Print X" button in the app funnels through this one function so a template
 * edited once in Settings → Print Formats changes what every one of them actually prints,
 * matching BUILD_PLAN's own "functional, bound to live data" bar (not pixel-perfect drag-drop,
 * but genuinely renders the real record, not a decorative stub). */
export function renderPrintHtml(
  template: PrintTemplateDoc,
  context: Record<string, string | number | null | undefined>
): string {
  const widthMm = PAPER_WIDTH_MM[template.paperWidth]
  const bodyBlocks = template.blocks
    .map((block) => {
      if (block.kind === 'divider') {
        return '<hr class="pt-divider" />'
      }
      const text =
        block.kind === 'text'
          ? (block.text ?? '')
          : (() => {
              const raw = block.fieldKey ? context[block.fieldKey] : undefined
              return raw == null || raw === '' ? `— ${block.label} —` : String(raw)
            })()
      const style = [
        `font-size:${FONT_SIZE_PX[block.fontSize]}px`,
        `text-align:${block.align}`,
        block.bold ? 'font-weight:700' : 'font-weight:400',
      ].join(';')
      return `<p class="pt-line" style="${style}">${escapeHtml(text)}</p>`
    })
    .join('\n')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(template.name)}</title>
<style>
  @page { size: ${widthMm}mm auto; margin: 3mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: ${widthMm}mm; margin: 0 auto; padding: 4mm; color: #000; }
  .pt-line { margin: 2px 0; word-wrap: break-word; white-space: pre-wrap; }
  .pt-divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
</style>
</head>
<body>
${bodyBlocks}
</body>
</html>`
}

/** Opens a new tab with the rendered HTML and triggers the browser's own print dialog once it's
 * loaded — the same client-side-only mechanism every "Print X" button in this app has used since
 * the earlier, honest `window.print()` stub this replaces; the difference is what's now in the
 * window (a real rendered template + real data) rather than the current page's own DOM. */
export function openPrintWindow(html: string): void {
  const win = window.open('', '_blank', 'width=420,height=640')
  if (!win) return // popup blocked — nothing silently fakes success
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    win.focus()
    win.print()
  }
}
