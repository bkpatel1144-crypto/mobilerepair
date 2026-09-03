import { useState } from 'react'
import { Printer, ChevronDown, ChevronRight, Star, MoreVertical, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { usePrintTemplates, useSetDefaultPrintTemplate, useDeletePrintTemplate, type PrintTemplateWithId } from '@/hooks/use-print-templates'
import { PRINT_DOCUMENT_TYPES } from '@/config/print-fields'
import { TemplateEditorModal } from '@/pages/app/settings/print-formats/template-editor-modal'
import type { PrintDocumentType } from '@/types/firestore'

/** `preview (1)`/`(2)` — "Bill & Label Designer": the 11 document types grouped, each showing
 * its own format count + default name, expand to a card per template. */
export function PrintFormatsPage() {
  const { data: templates = [], isLoading } = usePrintTemplates()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<PrintDocumentType>>(new Set())
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<PrintDocumentType | ''>('')
  const [designing, setDesigning] = useState<{ documentType: PrintDocumentType; name?: string; existing?: PrintTemplateWithId } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PrintTemplateWithId | null>(null)

  const setDefault = useSetDefaultPrintTemplate()
  const deleteTemplate = useDeletePrintTemplate()

  function toggle(type: PrintDocumentType) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const filteredTypes = PRINT_DOCUMENT_TYPES.filter((t) =>
    search.trim() ? t.label.toLowerCase().includes(search.toLowerCase()) || templates.some((tpl) => tpl.documentType === t.key && tpl.name.toLowerCase().includes(search.toLowerCase())) : true
  )

  function startCreate() {
    setNewName('')
    setNewType('')
    setCreating(true)
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newType) return
    setCreating(false)
    setDesigning({ documentType: newType, name: newName.trim() })
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Printer}
        title="Bill & Label Designer"
        subtitle="Design and manage print templates for bills, receipts and labels"
        actions={
          <Button type="button" onClick={startCreate}>
            <Plus className="size-4" />
            New Template
          </Button>
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search document types or templates..." />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTypes.map((docType) => {
            const forType = templates.filter((t) => t.documentType === docType.key)
            const defaultTemplate = forType.find((t) => t.isDefault) ?? forType[0]
            const isOpen = expanded.has(docType.key)
            return (
              <div key={docType.key} className="rounded-lg border">
                <button type="button" onClick={() => toggle(docType.key)} className="flex w-full items-center justify-between gap-2 p-3 text-left">
                  <span className="flex items-center gap-2 font-medium">
                    {isOpen ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                    {docType.label}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">{forType.length} format{forType.length === 1 ? '' : 's'}</span>
                    {defaultTemplate && <span>Default: {defaultTemplate.name}</span>}
                  </span>
                </button>
                {isOpen && (
                  <div className="space-y-2 border-t p-3">
                    {forType.length === 0 ? (
                      <EmptyState icon={Printer} title="No templates yet for this document type" />
                    ) : (
                      forType.map((t) => (
                        <div key={t.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                          <div>
                            <p className="font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{t.paperWidth} · v1</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {t.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                                <Star className="size-3 fill-current" />
                                Default
                              </span>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm"><MoreVertical className="size-4" /></Button>} />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDesigning({ documentType: docType.key, existing: t })}>Edit</DropdownMenuItem>
                                {!t.isDefault && (
                                  <DropdownMenuItem onClick={() => setDefault.mutate({ target: t, siblings: forType })}>Set as Default</DropdownMenuItem>
                                )}
                                {!t.protected && (
                                  <DropdownMenuItem onClick={() => setDeleteTarget(t)} className="text-red-600">
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <FormModal
        open={creating}
        onOpenChange={setCreating}
        title="New Print Template"
        onSubmit={handleCreateSubmit}
        submitLabel="Create & Design"
      >
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Standard Job Card Bill" autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>Document Type</Label>
          <Select value={newType} onValueChange={(v) => v && setNewType(v as PrintDocumentType)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Choose a document type..." /></SelectTrigger>
            <SelectContent>
              {PRINT_DOCUMENT_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </FormModal>

      {designing && (
        <TemplateEditorModal
          documentType={designing.documentType}
          templateName={designing.name}
          existing={designing.existing}
          onClose={() => {
            // A newly created/edited template should be immediately visible, not silently saved
            // behind a still-collapsed section the user has to know to click open themselves.
            setExpanded((prev) => new Set(prev).add(designing.documentType))
            setDesigning(null)
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title={`Delete "${deleteTarget.name}"?`}
          message="This permanently deletes the template and every block designed in it. This cannot be undone."
          confirmLabel="Delete"
          isPending={deleteTemplate.isPending}
          onConfirm={() => deleteTemplate.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })}
        />
      )}
    </div>
  )
}
