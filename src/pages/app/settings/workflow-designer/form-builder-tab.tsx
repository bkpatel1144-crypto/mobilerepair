import { useRef, useState } from 'react'
import { Download, FileUp, Bookmark, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RouteFallback } from '@/components/shared/route-fallback'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  useFormSchema,
  useSaveFormSchema,
  blankFormSchema,
  fieldsAndSectionsFor,
  type FormType,
} from '@/hooks/use-form-schema'
import { FieldControlRow } from './form-builder/field-control-row'
import type { FormFieldConfig, FormLayout, FormSchemaDoc } from '@/types/firestore'

const LAYOUT_OPTIONS: { value: FormLayout; label: string }[] = [
  { value: 'standard', label: 'Standard (one field per row)' },
  { value: 'compact', label: 'Compact (paired fields)' },
  { value: 'twoColumn', label: 'Two Column' },
  { value: 'largeDesktop', label: 'Large Desktop' },
  { value: 'auto', label: 'Auto (adapts to screen size)' },
]

type SchemaDraft = Omit<FormSchemaDoc, 'createdAt' | 'updatedAt'>

function draftFromSchema(schema: FormSchemaDoc): SchemaDraft {
  return {
    layout: schema.layout,
    templateName: schema.templateName,
    expandedSections: { ...schema.expandedSections },
    fields: Object.fromEntries(Object.entries(schema.fields).map(([k, v]) => [k, { ...v }])),
  }
}

function draftsEqual(a: SchemaDraft, b: SchemaDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** The "This is a live preview of the real Create Job Card form" note itself (and its Lead-form
 * equivalent) — matches `preview (9)`'s exact wording. */
const PREVIEW_NOTE: Record<FormType, string> = {
  jobCard:
    'This is a live preview of the real Create Job Card form — toggle fields above, changes apply once you click Save in the Form Builder panel. Nothing here can be submitted or saved from this preview.',
  lead: 'This is a live preview of the real Create Lead form — toggle fields above, changes apply once you click Save in the Form Builder panel. Nothing here can be submitted or saved from this preview.',
}

const TEMPLATE_STORAGE_PREFIX = 'aim-form-templates:'

function readTemplates(formType: FormType): Record<string, SchemaDraft> {
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_PREFIX + formType)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeTemplates(formType: FormType, templates: Record<string, SchemaDraft>) {
  try {
    localStorage.setItem(TEMPLATE_STORAGE_PREFIX + formType, JSON.stringify(templates))
  } catch {
    // Best-effort only — templates are a convenience, not the saved schema itself.
  }
}

export function FormBuilderTab({ formType }: { formType: FormType }) {
  const { data: existingSchema, isLoading } = useFormSchema(formType)
  const saveSchema = useSaveFormSchema(formType)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { fields, sections } = fieldsAndSectionsFor(formType)

  const baseline: FormSchemaDoc = existingSchema ?? blankFormSchema(formType)
  const [draft, setDraft] = useState<SchemaDraft | null>(null)
  const [seededKey, setSeededKey] = useState<string | null>(null)
  const [templates, setTemplates] = useState(() => readTemplates(formType))
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null)
  const [pendingTemplateName, setPendingTemplateName] = useState<string | null>(null)

  // Re-seed whenever the form type switches (Job Card Form ↔ Lead Form tab) or the query
  // settles for the first time — "adjust state during render," same pattern as everywhere
  // else in this app that needs a draft to track a save target.
  const seedKey = `${formType}:${isLoading ? 'loading' : 'ready'}`
  if (!isLoading && seededKey !== seedKey) {
    setSeededKey(seedKey)
    setDraft(draftFromSchema(baseline))
  }

  if (isLoading || !draft) return <RouteFallback />

  const isDirty = !draftsEqual(draft, draftFromSchema(baseline))

  function updateField(key: string, patch: Partial<FormFieldConfig>) {
    setDraft((prev) => {
      if (!prev) return prev
      const current = prev.fields[key]
      if (!current) return prev
      return { ...prev, fields: { ...prev.fields, [key]: { ...current, ...patch } } }
    })
  }

  function toggleSectionExpanded(key: string) {
    setDraft((prev) =>
      prev
        ? { ...prev, expandedSections: { ...prev.expandedSections, [key]: !prev.expandedSections[key] } }
        : prev
    )
  }

  async function handleSave() {
    await saveSchema.mutateAsync({
      ...draft!,
      createdAt: baseline.createdAt,
      updatedAt: baseline.updatedAt,
    })
  }

  function handleDiscard() {
    setDraft(draftFromSchema(baseline))
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formType}-form-schema.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as SchemaDraft
        setDraft(parsed)
      } catch {
        // Malformed file — leave the current draft untouched rather than corrupt it.
      }
    }
    reader.readAsText(file)
  }

  function handleSaveAsTemplate() {
    if (!draft) return
    const name = window.prompt('Save this configuration as a template named:')
    if (!name) return
    const next = { ...templates, [name]: draft }
    writeTemplates(formType, next)
    setTemplates(next)
  }

  function handleApplyTemplate(name: string) {
    const template = templates[name]
    if (template) setDraft(template)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Template</p>
            <Select value="" onValueChange={(v) => v && setPendingTemplateName(v)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(templates).length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No templates saved yet</div>
                ) : (
                  Object.keys(templates).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Layout</p>
            <Select
              value={draft.layout}
              onValueChange={(v) => v && setDraft((prev) => (prev ? { ...prev, layout: v as FormLayout } : prev))}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setPendingImportFile(file)
              e.target.value = ''
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="size-3.5" />
            Import
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-3.5" />
            Export
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleSaveAsTemplate}>
            <Bookmark className="size-3.5" />
            Save as template
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={!isDirty}
          >
            <RotateCcw className="size-3.5" />
            Discard changes
          </Button>
          <span className="text-xs text-muted-foreground">{isDirty ? '' : 'Saved'}</span>
          <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || saveSchema.isPending}>
            <Check className="size-3.5" />
            {saveSchema.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Use the icons on each field below to configure it.</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {sections.map((section) => (
            <label key={section.key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.expandedSections[section.key] !== false}
                onCheckedChange={() => toggleSectionExpanded(section.key)}
              />
              {section.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {sections
          .filter((section) => draft.expandedSections[section.key] !== false)
          .flatMap((section) => fields.filter((f) => f.section === section.key))
          .map((field) => (
            <FieldControlRow
              key={field.key}
              label={field.label}
              structurallyLocked={field.structurallyLocked}
              config={draft.fields[field.key]}
              onChange={(patch) => updateField(field.key, patch)}
              disabled={saveSchema.isPending}
              helperText={'helperText' in field ? field.helperText : undefined}
              previewType={field.type}
              placeholder={'placeholder' in field ? field.placeholder : undefined}
              quickAmounts={'quickAmounts' in field ? field.quickAmounts : undefined}
              quickDates={'quickDates' in field ? field.quickDates : undefined}
              options={'options' in field ? field.options : undefined}
            />
          ))}
      </div>

      <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-500/10 dark:text-blue-400">
        {PREVIEW_NOTE[formType]}
      </p>

      <ConfirmDialog
        open={!!pendingImportFile}
        onOpenChange={(open) => !open && setPendingImportFile(null)}
        title="Import form schema?"
        message="This replaces every field and layout setting currently in this draft with the contents of the uploaded file. Nothing is saved until you click Save, but any unsaved changes made so far will be overwritten."
        confirmLabel="Import"
        onConfirm={() => {
          if (pendingImportFile) handleImportFile(pendingImportFile)
          setPendingImportFile(null)
        }}
      />

      <ConfirmDialog
        open={!!pendingTemplateName}
        onOpenChange={(open) => !open && setPendingTemplateName(null)}
        title={`Apply template "${pendingTemplateName ?? ''}"?`}
        message="This replaces every field and layout setting currently in this draft with the saved template. Nothing is saved until you click Save, but any unsaved changes made so far will be overwritten."
        confirmLabel="Apply"
        onConfirm={() => {
          if (pendingTemplateName) handleApplyTemplate(pendingTemplateName)
          setPendingTemplateName(null)
        }}
      />
    </div>
  )
}
