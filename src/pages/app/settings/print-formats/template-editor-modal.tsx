import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Type, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { PRINT_FIELDS, samplePrintContext } from '@/config/print-fields'
import { renderPrintHtml } from '@/lib/print-render'
import { useCreatePrintTemplate, useUpdatePrintTemplate, type PrintTemplateWithId } from '@/hooks/use-print-templates'
import type { PrintDocumentType, PrintTemplateBlock, PrintTemplateDoc } from '@/types/firestore'

function newBlock(kind: PrintTemplateBlock['kind']): PrintTemplateBlock {
  return {
    id: crypto.randomUUID(),
    kind,
    fieldKey: kind === 'field' ? null : null,
    label: kind === 'text' ? 'Text' : kind === 'divider' ? 'Divider' : 'Field',
    text: kind === 'text' ? '' : null,
    bold: false,
    align: 'left',
    fontSize: 'sm',
  }
}

/** The "simple field-picker + positioned-text-block canvas" BUILD_PLAN itself calls for —
 * "positioned" here means an *ordered list*, reordered with up/down arrows (this project's own
 * established "functional, not pixel-perfect drag-drop" convention, first used for Service
 * Options' own reorder-by-arrows in Phase 5), not free-form pixel coordinates. The right-hand
 * pane renders the *exact same* `renderPrintHtml()` every real print button uses, against sample
 * data — a true live preview, not a decorative mockup. */
export function TemplateEditorModal({
  documentType,
  templateName,
  existing,
  onClose,
}: {
  documentType: PrintDocumentType
  templateName?: string
  existing?: PrintTemplateWithId
  onClose: () => void
}) {
  const [name, setName] = useState(existing?.name ?? templateName ?? '')
  const [paperWidth, setPaperWidth] = useState<PrintTemplateDoc['paperWidth']>(existing?.paperWidth ?? '58mm')
  const [blocks, setBlocks] = useState<PrintTemplateBlock[]>(existing?.blocks ?? [])
  const createTemplate = useCreatePrintTemplate()
  const updateTemplate = useUpdatePrintTemplate()
  const isSaving = createTemplate.isPending || updateTemplate.isPending

  const fields = PRINT_FIELDS[documentType]

  function updateBlock(id: string, patch: Partial<PrintTemplateBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }
  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }
  function moveBlock(id: string, direction: -1 | 1) {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id)
      const swapWith = index + direction
      if (index < 0 || swapWith < 0 || swapWith >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[swapWith]] = [next[swapWith], next[index]]
      return next
    })
  }
  function addFieldBlock(fieldKey: string) {
    const field = fields.find((f) => f.key === fieldKey)
    if (!field) return
    setBlocks((prev) => [...prev, { ...newBlock('field'), fieldKey: field.key, label: field.label }])
  }

  async function handleSave() {
    if (!name.trim() || blocks.length === 0) return
    if (existing) {
      await updateTemplate.mutateAsync({ id: existing.id, name: name.trim(), documentType, paperWidth, blocks })
    } else {
      await createTemplate.mutateAsync({ name: name.trim(), documentType, paperWidth, blocks })
    }
    onClose()
  }

  const previewHtml = renderPrintHtml(
    { name, documentType, paperWidth, blocks, isDefault: false, protected: false } as PrintTemplateDoc,
    samplePrintContext(documentType)
  )

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        size="xl"
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-3 overflow-hidden sm:rounded-xl"
      >
        <DialogTitle>{existing ? 'Edit Print Template' : 'Design Template'}</DialogTitle>
        <DialogDescription>Field-picker + ordered blocks, bound to real data at print time.</DialogDescription>

        {/* `minmax(0,…)` on both tracks: a grid track is `min-content`-floored by default, and
         * the editor column contains selects/buttons that refuse to shrink, so it held the
         * track open and starved the preview column down to a few pixels — the source of the
         * one-letter-per-line "LIVE PREVIEW" heading and the dialog's horizontal scrollbar.
         * Stacks below `lg`, where there simply isn't room for two panes.
         *
         * Scrolling is per-pane from `lg` up, not on this grid. When the grid itself was the
         * scroller, the two columns moved as one body: working down a long block list dragged
         * the live preview up and out of view, which defeats the point of having a preview
         * beside the editor at all. Below `lg` the panes are stacked, so the grid scrolls as a
         * single column instead — nested scroll regions in a stack are worse than one. */}
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:overflow-hidden">
          <div className="space-y-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]">
              <div className="space-y-1.5">
                <Label>Template Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Job Card Bill" />
              </div>
              <div className="space-y-1.5">
                <Label>Paper Width</Label>
                <Select value={paperWidth} onValueChange={(v) => v && setPaperWidth(v as PrintTemplateDoc['paperWidth'])}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm</SelectItem>
                    <SelectItem value="80mm">80mm</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              {blocks.map((block, i) => (
                <div key={block.id} className="space-y-2 rounded-lg border p-2.5">
                  <div className="flex items-center gap-2">
                    {block.kind === 'field' ? (
                      <Select value={block.fieldKey ?? undefined} onValueChange={(v) => v && updateBlock(block.id, { fieldKey: v, label: fields.find((f) => f.key === v)?.label ?? block.label })}>
                        <SelectTrigger className="h-8 flex-1"><SelectValue placeholder="Choose field..." /></SelectTrigger>
                        <SelectContent>
                          {fields.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : block.kind === 'text' ? (
                      <Input value={block.text ?? ''} onChange={(e) => updateBlock(block.id, { text: e.target.value })} placeholder="Literal text (e.g. a heading)" className="h-8 flex-1" />
                    ) : (
                      <span className="flex-1 text-sm text-muted-foreground">— divider line —</span>
                    )}
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveBlock(block.id, -1)} disabled={i === 0}>
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveBlock(block.id, 1)} disabled={i === blocks.length - 1}>
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeBlock(block.id)}>
                      <Trash2 className="size-3.5 text-red-600" />
                    </Button>
                  </div>
                  {block.kind !== 'divider' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={block.bold} onChange={(e) => updateBlock(block.id, { bold: e.target.checked })} />
                        Bold
                      </label>
                      <Select value={block.align} onValueChange={(v) => v && updateBlock(block.id, { align: v as PrintTemplateBlock['align'] })}>
                        <SelectTrigger size="sm" className="h-7 w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={block.fontSize} onValueChange={(v) => v && updateBlock(block.id, { fontSize: v as PrintTemplateBlock['fontSize'] })}>
                        <SelectTrigger size="sm" className="h-7 w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Select<string> onValueChange={(v) => v && addFieldBlock(v)}>
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue placeholder="+ Add Field..." />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={() => setBlocks((prev) => [...prev, newBlock('text')])}>
                <Type className="size-3.5" />
                Add Text
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setBlocks((prev) => [...prev, newBlock('divider')])}>
                <Minus className="size-3.5" />
                Add Divider
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 lg:min-h-0">
            <p className="shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Live Preview (sample data)
            </p>
            <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/30 p-3">
              {/* `h-96` fixed meant the preview neither grew into a tall dialog nor shrank in a
               * short one; it now fills its pane and scrolls within it. */}
              <iframe title="Template preview" srcDoc={previewHtml} className="mx-auto h-96 w-full rounded border bg-white lg:h-full lg:min-h-96" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!name.trim() || blocks.length === 0 || isSaving}>
            <Plus className="size-4" />
            {isSaving ? 'Saving…' : existing ? 'Save Changes' : 'Create & Design'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
