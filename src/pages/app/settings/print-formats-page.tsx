import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Printer,
  RefreshCw,
  Sparkles,
  Upload,
  Monitor,
  Plus,
  ChevronDown,
  Star,
  MoreVertical,
  Copy,
  Trash2,
  Search,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  usePrintTemplates,
  useSetDefaultPrintTemplate,
  useDeletePrintTemplate,
  useDuplicatePrintTemplate,
  useAddMissingDefaults,
  printTemplatesQueryKey,
  type PrintTemplateWithId,
} from '@/hooks/use-print-templates'
import { useAuth } from '@/hooks/use-auth'
import { PRINT_DOCUMENT_TYPES, printDocumentTypeLabel } from '@/config/print-fields'
import { buildPath } from '@/config/nav'
import { cn } from '@/lib/utils'
import type { PrintDocumentType } from '@/types/firestore'
import { ImportTemplateDialog } from './print-formats/import-template-dialog'
import { PrintDevicesDialog } from './print-formats/print-devices-dialog'
import { NewTemplateDialog } from './print-formats/new-template-dialog'

/** `Bill & Label Designer` — every document type as a collapsible group, each holding the
 * formats defined for it (58mm / 80mm / A4 …), exactly one of which is the default the app's
 * real print buttons resolve to. */
export function PrintFormatsPage() {
  const { data: templates = [], isLoading, error: loadError, refetch } = usePrintTemplates()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<PrintDocumentType>>(new Set(['jobCard']))
  const [deleteTarget, setDeleteTarget] = useState<PrintTemplateWithId | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [devicesOpen, setDevicesOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  const setDefault = useSetDefaultPrintTemplate()
  const deleteTemplate = useDeletePrintTemplate()
  const duplicate = useDuplicatePrintTemplate()
  const addMissing = useAddMissingDefaults()

  const q = search.trim().toLowerCase()
  const groups = PRINT_DOCUMENT_TYPES.map((docType) => {
    const all = templates.filter((t) => t.documentType === docType.key)
    const matches =
      !q ||
      docType.label.toLowerCase().includes(q) ||
      all.some((t) => t.name.toLowerCase().includes(q))
    const formats = q && !docType.label.toLowerCase().includes(q)
      ? all.filter((t) => t.name.toLowerCase().includes(q))
      : all
    return { docType, formats, visible: matches }
  }).filter((g) => g.visible)

  function toggle(key: PrintDocumentType) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function openDesigner(id: string) {
    navigate(`${buildPath('settings', 'print-formats')}/${id}`)
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Printer}
        title="Bill & Label Designer"
        subtitle="Design and manage print templates for bills, receipts and labels"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: printTemplatesQueryKey(profile?.companyId) })
          }
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading || addMissing.isPending}
          onClick={() => addMissing.mutate(templates)}
        >
          <Sparkles className="size-4" />
          {addMissing.isPending ? 'Adding…' : 'Add Missing Defaults'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="size-4" />
          Import Template
        </Button>
        <Button type="button" variant="outline" onClick={() => setDevicesOpen(true)}>
          <Monitor className="size-4" />
          Print Devices
        </Button>
        <Button type="button" onClick={() => setNewOpen(true)}>
          <Plus className="size-4" />
          New Template
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search document types or templates..."
          className="h-10 rounded-full pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={() => void refetch()} title="Couldn't load your print templates" />
      ) : groups.length === 0 ? (
        <EmptyState icon={Printer} title="No matches" description="No document type or template matches that search." />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          {groups.map(({ docType, formats }, i) => {
            const isOpen = expanded.has(docType.key)
            const defaultTemplate = formats.find((t) => t.isDefault)
            return (
              <div key={docType.key} className={cn(i > 0 && 'border-t')}>
                <button
                  type="button"
                  data-slot="button"
                  onClick={() => toggle(docType.key)}
                  aria-expanded={isOpen}
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 p-4 text-left hover:bg-muted/40"
                >
                  <span className="font-semibold">{docType.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {formats.length} format{formats.length === 1 ? '' : 's'}
                  </span>
                  {defaultTemplate && (
                    <span className="truncate text-sm text-muted-foreground">
                      Default: {defaultTemplate.name}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      'ml-auto size-4 shrink-0 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="border-t bg-muted/20 p-4">
                    {formats.length === 0 ? (
                      <EmptyState
                        icon={Printer}
                        title="No formats for this document type"
                        description="Use Add Missing Defaults to restore the standard formats, or create one."
                      />
                    ) : (
                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]">
                        {formats.map((t) => (
                          <div
                            key={t.id}
                            className="group relative rounded-xl border bg-card p-4 transition-colors hover:border-teal-600/60"
                          >
                            <button
                              type="button"
                              onClick={() => openDesigner(t.id)}
                              className="block w-full pr-8 text-left"
                            >
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="truncate font-medium">{t.name}</span>
                                {t.isDefault && (
                                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/40 dark:text-amber-400">
                                    <Star className="size-3 fill-current" />
                                    Default
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {t.paper.width}×{t.paper.height}mm · v{t.version}
                              </span>
                            </button>

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Actions for ${t.name}`}
                                    className="absolute top-3 right-2"
                                  />
                                }
                              >
                                <MoreVertical className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!t.isDefault && (
                                  <DropdownMenuItem
                                    onClick={() => setDefault.mutate({ target: t, siblings: formats })}
                                  >
                                    <Star />
                                    Set as Default
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => duplicate.mutate(t)}>
                                  <Copy />
                                  Duplicate
                                </DropdownMenuItem>
                                {/* A protected seed has no Delete — it is the fallback every real
                                 * print button resolves to. Duplicate it and edit the copy. */}
                                {!t.protected && (
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setDeleteTarget(t)}
                                  >
                                    <Trash2 />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this template?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed permanently. Any print action currently using it falls back to the default ${printDocumentTypeLabel(deleteTarget.documentType)} format.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteTemplate.mutate(deleteTarget)
          setDeleteTarget(null)
        }}
      />

      <ImportTemplateDialog open={importOpen} onOpenChange={setImportOpen} />
      <PrintDevicesDialog open={devicesOpen} onOpenChange={setDevicesOpen} />
      <NewTemplateDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        existing={templates}
        onCreated={openDesigner}
      />
    </div>
  )
}
