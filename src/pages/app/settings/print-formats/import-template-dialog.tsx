import { useState } from 'react'
import { Upload } from 'lucide-react'
import { FormModal } from '@/components/shared/form-modal'
import { Label } from '@/components/ui/label'
import { useCreatePrintTemplate } from '@/hooks/use-print-templates'
import { PRINT_DOCUMENT_TYPES } from '@/config/print-fields'
import type { PrintTemplateDoc } from '@/types/firestore'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

/** Accepts a template exported from this app (the designer's "Export JSON" action writes the
 * same shape). Validated rather than trusted: an imported file becomes a document other people
 * print from, so a malformed one must fail here with a reason, not at the printer. */
function parseTemplate(
  raw: unknown,
  t: TFunction
):
  | {
      ok: true
      value: Omit<
        PrintTemplateDoc,
        'createdAt' | 'updatedAt' | 'createdById' | 'createdByName' | 'isDefault' | 'protected'
      >
    }
  | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object')
    return { ok: false, error: t('pages.settings.importTemplateDialog.thatFileIsNotATemplate') }
  const obj = raw as Record<string, unknown>
  if (!obj.documentType || !PRINT_DOCUMENT_TYPES.some((d) => d.key === obj.documentType)) {
    return { ok: false, error: `Unknown document type "${String(obj.documentType)}".` }
  }
  if (!Array.isArray(obj.elements))
    return { ok: false, error: t('pages.settings.importTemplateDialog.theFileHasNoElementsArray') }
  const paper = obj.paper as Record<string, unknown> | undefined
  if (!paper || typeof paper.width !== 'number' || typeof paper.height !== 'number') {
    return { ok: false, error: t('pages.settings.importTemplateDialog.theFileHasNoValidPaper') }
  }
  return { ok: true, value: obj as never }
}

export function ImportTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const create = useCreatePrintTemplate()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  // `FormModal` renders a real `<form onSubmit={…}>`: without `preventDefault` the browser
  // submits it natively, the page navigates, and the mutation dies mid-flight while the dialog
  // appears to close successfully.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!file) {
      setError(t('pages.settings.importTemplateDialog.chooseATemplateJsonFileFirst'))
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setError(t('pages.settings.importTemplateDialog.thatFileIsNotValidJson'))
      return
    }
    const result = parseTemplate(parsed, t)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const v = result.value
    await create.mutateAsync({
      name: `${v.name ?? t('pages.settings.importTemplateDialog.importedTemplate')} (Imported)`,
      documentType: v.documentType,
      category: v.category ?? 'bill',
      presetKey: v.presetKey ?? null,
      paper: v.paper,
      margins: v.margins ?? { top: 3, right: 3, bottom: 3, left: 3 },
      settings: v.settings ?? {
        copies: 1,
        duplicateCopy: false,
        duplicateCopyDirection: 'stacked',
        ups: 1,
        gapMm: 2,
        printSpeed: 4,
        printDensity: 8,
      },
      bandHeights: v.bandHeights ?? { header: 0, detail: 100, footer: 0 },
      elements: v.elements,
    })
    setFile(null)
    onOpenChange(false)
  }

  return (
    <FormModal
      error={error}
      open={open}
      onOpenChange={onOpenChange}
      title={t('pages.settings.importTemplateDialog.importTemplate')}
      description={t('pages.settings.importTemplateDialog.loadATemplateJsonExportedFrom')}
      submitLabel={t('common.import')}
      isSubmitting={create.isPending}
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <Label htmlFor="tpl-file">{t('pages.settings.importTemplateDialog.templateFile')}</Label>
        <label
          htmlFor="tpl-file"
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-4 text-sm hover:bg-muted/40"
        >
          <Upload className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            <span className="block truncate font-medium">
              {file ? file.name : 'Choose a .json file'}
            </span>
            <span className="block text-xs text-muted-foreground">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB`
                : t('pages.settings.importTemplateDialog.exportedFromTheDesigner')}
            </span>
          </span>
        </label>
        <input
          id="tpl-file"
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setError(null)
          }}
        />
      </div>
    </FormModal>
  )
}
