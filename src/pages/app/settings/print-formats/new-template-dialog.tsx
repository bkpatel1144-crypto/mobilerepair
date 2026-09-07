import { useState } from 'react'
import { FormModal } from '@/components/shared/form-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormError } from '@/components/shared/form-error'
import { PRINT_DOCUMENT_TYPES } from '@/config/print-fields'
import { PRINT_PRESETS } from '@/config/print-presets'
import { buildDefaultLayout } from '@/config/print-layouts'
import { useCreatePrintTemplate, type PrintTemplateWithId } from '@/hooks/use-print-templates'
import type { PrintDocumentType } from '@/types/firestore'

/** A new template always starts from a catalogue preset rather than a blank page: paper size,
 * margins and print settings for a 58mm roll are not something anyone should have to type in
 * from memory, and starting from the seeded layout means the first print already works. */
export function NewTemplateDialog({
  open,
  onOpenChange,
  existing,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existing: PrintTemplateWithId[]
  onCreated: (id: string) => void
}) {
  const create = useCreatePrintTemplate()
  const [documentType, setDocumentType] = useState<PrintDocumentType>('jobCard')
  const [presetIndex, setPresetIndex] = useState(0)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const presets = PRINT_PRESETS.filter((p) => p.documentType === documentType)
  const preset = presets[presetIndex] ?? presets[0]

  async function handleSubmit() {
    setError(null)
    const finalName = name.trim() || `${preset?.name ?? 'Template'} (Copy)`
    if (!preset) {
      setError('That document type has no base format to start from.')
      return
    }
    if (existing.some((tpl) => tpl.name.trim().toLowerCase() === finalName.toLowerCase())) {
      setError('A template with that name already exists.')
      return
    }
    const layout = buildDefaultLayout(preset)
    const created = await create.mutateAsync({
      name: finalName,
      documentType,
      category: preset.category,
      presetKey: preset.presetKey,
      paper: preset.paper,
      margins: preset.margins,
      settings: preset.settings,
      bandHeights: layout.bandHeights,
      elements: layout.elements,
    })
    onOpenChange(false)
    setName('')
    onCreated(created.id)
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="New Template"
      description="Pick a document type and a paper size to start from. You can change everything in the designer."
      submitLabel="Create & Design"
      isSubmitting={create.isPending}
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <Label>Document Type</Label>
        <Select
          value={documentType}
          onValueChange={(v) => {
            if (!v) return
            setDocumentType(v as PrintDocumentType)
            setPresetIndex(0)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRINT_DOCUMENT_TYPES.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Start From</Label>
        <Select value={String(presetIndex)} onValueChange={(v) => v && setPresetIndex(Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((p, i) => (
              <SelectItem key={p.name} value={String(i)}>
                {p.paper.width}×{p.paper.height}mm{p.presetKey ? ` · ${p.presetKey}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tpl-name">Name</Label>
        <Input
          id="tpl-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={preset ? `${preset.name} (Copy)` : 'Template name'}
        />
      </div>

      {error && <FormError message={error} />}
    </FormModal>
  )
}
