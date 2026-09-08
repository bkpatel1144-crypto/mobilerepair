import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Eye,
  Printer,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  Type,
  Image as ImageIcon,
  Barcode,
  QrCode,
  Minus,
  Square,
  Lock,
  LockOpen,
  EyeOff,
  Download,
  MoreVertical,
  Star,
  History,
  Ruler,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { RouteFallback } from '@/components/shared/route-fallback'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTimeLong } from '@/lib/utils'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  usePrintTemplates,
  useUpdatePrintTemplate,
  usePrintTemplateVersions,
  type PrintTemplateVersionWithId,
  useSetDefaultPrintTemplate,
  useDuplicatePrintTemplate,
} from '@/hooks/use-print-templates'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { buildDefaultLayout } from '@/config/print-layouts'
import { PRINT_PRESETS } from '@/config/print-presets'
import { PageSetupDialog } from './page-setup-dialog'
import { useCompany } from '@/hooks/use-company'
import { PRINT_FIELDS, printDocumentTypeLabel, type PrintFieldDef } from '@/config/print-fields'
import { samplePrintContext } from '@/lib/print-sample'
import { renderPrintHtml, openPrintWindow } from '@/lib/print-render'
import { buildPath } from '@/config/nav'
import { cn } from '@/lib/utils'
import type { PrintBand, PrintElement, PrintElementStyle } from '@/types/firestore'
import { DesignerCanvas } from './designer-canvas'
import { useDesignerState, draftFromTemplate, newElement } from './use-designer-state'
import { useTranslation } from 'react-i18next'

const PALETTE: { type: PrintElement['type']; labelKey: string; icon: typeof Type }[] = [
  { type: 'text', labelKey: 'pages.settings.designer.text', icon: Type },
  { type: 'image', labelKey: 'pages.settings.designer.image', icon: ImageIcon },
  { type: 'logo', labelKey: 'pages.settings.designer.logo', icon: ImageIcon },
  { type: 'barcode', labelKey: 'pages.settings.designer.barcode', icon: Barcode },
  { type: 'qrcode', labelKey: 'pages.settings.designer.qrCode', icon: QrCode },
  { type: 'line', labelKey: 'pages.settings.designer.line', icon: Minus },
  { type: 'shape', labelKey: 'pages.settings.designer.shape', icon: Square },
]

const ZOOMS = [50, 75, 100, 125, 150, 200]

function FieldBadge({ type }: { type: PrintFieldDef['type'] }) {
  return (
    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {type}
    </span>
  )
}

export function PrintTemplateDesignerPage() {
  const { t } = useTranslation()
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const { data: templates = [], isLoading, error: loadError, refetch } = usePrintTemplates()
  const { data: company } = useCompany()
  const update = useUpdatePrintTemplate()
  const setDefault = useSetDefaultPrintTemplate()
  const duplicate = useDuplicatePrintTemplate()
  const versions = usePrintTemplateVersions(templateId)

  const template = templates.find((tpl) => tpl.id === templateId) ?? null

  const [ready, setReady] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(true)
  const [activeBand, setActiveBand] = useState<PrintBand>('header')
  const [leftTab, setLeftTab] = useState<'fields' | 'layers'>('fields')
  const [confirmBack, setConfirmBack] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pageSetupOpen, setPageSetupOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const state = useDesignerState(
    template
      ? draftFromTemplate(template)
      : {
          name: '',
          paper: { width: 80, height: 120, unit: 'mm', orientation: 'portrait' },
          margins: { top: 3, right: 3, bottom: 3, left: 3 },
          settings: {
            copies: 1,
            duplicateCopy: false,
            duplicateCopyDirection: 'stacked',
            ups: 1,
            gapMm: 2,
            printSpeed: 4,
            printDensity: 8,
          },
          bandHeights: { header: 0, detail: 0, footer: 0 },
          elements: [],
        }
  )

  // Seed the draft once the template arrives — "adjust state during render", the same pattern
  // role-configure-page and the workflow tabs already use, rather than an effect that would
  // re-seed on every background refetch and discard in-progress edits.
  if (template && ready !== template.id) {
    setReady(template.id)
    state.commit(draftFromTemplate(template))
    setActiveBand(template.category === 'label' ? 'detail' : 'header')
  }

  if (loadError) {
    return (
      <div className="p-6">
        <ErrorState
          error={loadError}
          onRetry={() => void refetch()}
          title={t('pages.settings.designer.couldnTLoadThisTemplate')}
        />
      </div>
    )
  }
  if (isLoading || ready !== templateId) return <RouteFallback />
  if (!template) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Printer}
          title={t('pages.settings.designer.templateNotFound')}
          description={t('pages.settings.designer.itMayHaveBeenDeleted')}
        />
      </div>
    )
  }

  const { draft } = state
  const isLabel = template.category === 'label'
  const contentWidth = draft.paper.width - draft.margins.left - draft.margins.right
  const fields = PRINT_FIELDS[template.documentType] ?? []
  const values = samplePrintContext(template.documentType, company?.name ?? 'Your Shop')
  const one = state.selected.length === 1 ? state.selected[0] : null

  function patchStyle(patch: Partial<PrintElementStyle>) {
    state.updateElements(state.selectedIds, (el) => ({ ...el, style: { ...el.style, ...patch } }))
  }
  function patchEl(patch: Partial<PrintElement>) {
    state.updateElements(state.selectedIds, (el) => ({ ...el, ...patch }))
  }

  async function handleSave() {
    await update.mutateAsync({
      id: template!.id,
      name: draft.name,
      documentType: template!.documentType,
      category: template!.category,
      presetKey: template!.presetKey,
      paper: draft.paper,
      margins: draft.margins,
      settings: draft.settings,
      bandHeights: draft.bandHeights,
      elements: draft.elements,
      previous: template!,
    })
    state.markSaved()
  }

  /** Loads an old revision into the editor as unsaved changes rather than writing it straight
   * back, so the shopkeeper can look at what they are about to restore before committing to it.
   * Routed through `commit`, which means Ctrl+Z undoes a restore like any other edit, and saving
   * afterwards goes through the same snapshot path — so the revision it replaces is itself
   * recorded and nothing is ever lost. */
  function restoreVersion(v: PrintTemplateVersionWithId) {
    state.commit({
      name: v.name,
      paper: v.paper,
      margins: v.margins,
      settings: v.settings,
      bandHeights: v.bandHeights,
      elements: v.elements,
    })
    setHistoryOpen(false)
  }

  function html() {
    return renderPrintHtml({ ...template!, ...draft }, values)
  }

  function goBack() {
    if (state.isDirty) setConfirmBack(true)
    else navigate(buildPath('settings', 'print-formats'))
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b p-3">
        <Input
          value={draft.name}
          onChange={(e) => state.setName(e.target.value)}
          className="h-9 w-56"
          aria-label={t('pages.settings.designer.templateName')}
        />
        <span className="text-sm text-muted-foreground">
          {printDocumentTypeLabel(template.documentType)}
        </span>
        {state.isDirty && (
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Unsaved changes
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" />
            Preview
          </Button>
          <Button type="button" variant="outline" onClick={() => openPrintWindow(html())}>
            <Printer className="size-4" />
            Print
          </Button>
          <Button type="button" onClick={handleSave} disabled={!state.isDirty || update.isPending}>
            <Save className="size-4" />
            {update.isPending ? 'Saving…' : t('common.save')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('pages.settings.designer.more')}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!template.isDefault && (
                <DropdownMenuItem
                  onClick={() =>
                    setDefault.mutate({
                      target: template,
                      siblings: templates.filter(
                        (tpl) => tpl.documentType === template.documentType
                      ),
                    })
                  }
                >
                  <Star />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => duplicate.mutate(template)}>
                <Copy />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPageSetupOpen(true)}>
                <Ruler />
                Page Setup
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                <History />
                Version History
                {versions.data && versions.data.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">v{template.version}</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const blob = new Blob([JSON.stringify({ ...template, ...draft }, null, 2)], {
                    type: 'application/json',
                  })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = `${draft.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`
                  a.click()
                  URL.revokeObjectURL(a.href)
                }}
              >
                <Download />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmReset(true)}>
                <RotateCcw />
                Reset to Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" variant="outline" onClick={goBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b bg-muted/30 px-3 py-1.5">
        {!isLabel &&
          (['header', 'detail', 'footer'] as PrintBand[]).map((b) => (
            <button
              key={b}
              type="button"
              data-slot="button"
              onClick={() => setActiveBand(b)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium capitalize',
                activeBand === b
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {b}
            </button>
          ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('shared.undo')}
          disabled={!state.canUndo}
          onClick={state.undo}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('pages.settings.designer.redo')}
          disabled={!state.canRedo}
          onClick={state.redo}
        >
          <Redo2 className="size-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('common.duplicate')}
          disabled={!state.selectedIds.length}
          onClick={state.duplicateSelected}
        >
          <Copy className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('common.delete')}
          disabled={!state.selectedIds.length}
          onClick={state.removeSelected}
          className="text-red-600"
        >
          <Trash2 className="size-4" />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        {(
          [
            ['Align left', AlignLeft, () => patchEl({ x: 0 })],
            [
              'Align centre',
              AlignCenter,
              () =>
                state.updateElements(state.selectedIds, (el) => ({
                  ...el,
                  x: Math.max(0, (contentWidth - el.w) / 2),
                })),
            ],
            [
              'Align right',
              AlignRight,
              () =>
                state.updateElements(state.selectedIds, (el) => ({
                  ...el,
                  x: Math.max(0, contentWidth - el.w),
                })),
            ],
            ['Align top', AlignStartVertical, () => patchEl({ y: 0 })],
          ] as const
        ).map(([label, Icon, fn]) => (
          <Tooltip key={label}>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                  disabled={!state.selectedIds.length}
                  onClick={fn}
                />
              }
            >
              <Icon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          variant={showGrid ? 'secondary' : 'ghost'}
          size="icon-sm"
          aria-label={t('pages.settings.designer.toggleGrid')}
          onClick={() => setShowGrid((g) => !g)}
        >
          <Grid3x3 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('pages.settings.designer.zoomOut')}
          onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z) - 1)] ?? z)}
        >
          <ZoomOut className="size-4" />
        </Button>
        <span className="w-12 text-center text-sm tabular-nums">{zoom}%</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('pages.settings.designer.zoomIn')}
          onClick={() =>
            setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z) + 1)] ?? z)
          }
        >
          <ZoomIn className="size-4" />
        </Button>
      </div>

      {/* Body: fields/layers | canvas | properties */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)_17rem]">
        <div className="hidden min-h-0 flex-col border-r lg:flex">
          <Tabs
            value={leftTab}
            onValueChange={(v) => v && setLeftTab(v as 'fields' | 'layers')}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList
              variant="line"
              className="h-auto w-full shrink-0 justify-start gap-4 rounded-none border-b px-3"
            >
              <TabsTrigger
                value="fields"
                className="flex-none px-0 pb-2 text-sm data-active:text-teal-700 data-active:after:bg-teal-600 dark:data-active:text-teal-400"
              >
                Fields
              </TabsTrigger>
              <TabsTrigger
                value="layers"
                className="flex-none px-0 pb-2 text-sm data-active:text-teal-700 data-active:after:bg-teal-600 dark:data-active:text-teal-400"
              >
                Layers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="min-h-0 flex-1 overflow-y-auto p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t('pages.settings.designer.addElement')}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PALETTE.map(({ type, labelKey, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    data-slot="button"
                    onClick={() => state.addElement(newElement(type, activeBand, contentWidth))}
                    className="flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs hover:border-teal-600/60 hover:bg-muted/50"
                  >
                    <Icon className="size-4" />
                    {t(labelKey)}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs font-medium text-muted-foreground">
                {t('pages.settings.designer.fields')}
              </p>
              <div className="mt-1.5 space-y-0.5">
                {fields.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    data-slot="button"
                    onClick={() =>
                      state.addElement(newElement('field', activeBand, contentWidth, f))
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span className="truncate">{f.label}</span>
                    <FieldBadge type={f.type} />
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="layers" className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="space-y-0.5">
                {draft.elements
                  .filter((e) => isLabel || e.band === activeBand)
                  .sort((a, b) => b.z - a.z)
                  .map((el) => (
                    <div
                      key={el.id}
                      className={cn(
                        'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm',
                        state.selectedIds.includes(el.id)
                          ? 'bg-teal-100 dark:bg-teal-500/15'
                          : 'hover:bg-muted'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => state.setSelectedIds([el.id])}
                        className="min-w-0 flex-1 truncate text-left"
                      >
                        {el.text || el.fieldKey || el.type}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t('pages.settings.designer.toggleVisibility')}
                        onClick={() =>
                          state.updateElements([el.id], (x) => ({ ...x, hidden: !x.hidden }))
                        }
                      >
                        {el.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={t('pages.settings.designer.toggleLock')}
                        onClick={() =>
                          state.updateElements([el.id], (x) => ({ ...x, locked: !x.locked }))
                        }
                      >
                        {el.locked ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
                      </Button>
                    </div>
                  ))}
                {draft.elements.length === 0 && (
                  <p className="p-2 text-xs text-muted-foreground">
                    {t('pages.settings.designer.nothingOnTheCanvasYet')}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="min-h-0 overflow-auto">
          <DesignerCanvas
            draft={draft}
            values={values}
            zoom={zoom}
            showGrid={showGrid}
            activeBand={activeBand}
            selectedIds={state.selectedIds}
            onSelect={state.setSelectedIds}
            onBandChange={setActiveBand}
            isLabel={isLabel}
            onGestureStart={state.beginGesture}
            onGestureEnd={state.endGesture}
            onPreviewMove={(ids, patch) => state.updateElements(ids, patch, true)}
          />
        </div>

        <div className="hidden min-h-0 overflow-y-auto border-l p-3 lg:block">
          {!one ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              {state.selectedIds.length > 1
                ? `${state.selectedIds.length} elements selected.`
                : 'Select an element to edit its properties.'}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {one.type}
              </p>

              {(one.type === 'text' ||
                one.type === 'field' ||
                one.type === 'barcode' ||
                one.type === 'qrcode' ||
                one.type === 'image') && (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {one.type === 'field'
                      ? 'Caption'
                      : one.type === 'image'
                        ? 'Image URL'
                        : t('pages.settings.designer.text')}
                  </Label>
                  <Input
                    value={one.text ?? ''}
                    onChange={(e) => patchEl({ text: e.target.value })}
                  />
                </div>
              )}

              {one.type === 'field' && (
                <label className="flex items-center justify-between gap-2 text-sm">
                  Show caption
                  <Switch
                    checked={one.showLabel}
                    onCheckedChange={(v) => patchEl({ showLabel: v })}
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-2">
                {(['x', 'y', 'w', 'h'] as const).map((k) => (
                  <div key={k} className="space-y-1">
                    <Label className="text-xs uppercase">{k} (mm)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={one[k]}
                      onChange={(e) =>
                        patchEl({ [k]: Number(e.target.value) || 0 } as Partial<PrintElement>)
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{t('pages.settings.designer.fontSizePt')}</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={one.style.fontSize}
                  onChange={(e) => patchStyle({ fontSize: Number(e.target.value) || 8 })}
                />
              </div>

              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={one.style.bold ? 'secondary' : 'outline'}
                  onClick={() => patchStyle({ bold: !one.style.bold })}
                >
                  Bold
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={one.style.italic ? 'secondary' : 'outline'}
                  onClick={() => patchStyle({ italic: !one.style.italic })}
                >
                  Italic
                </Button>
              </div>

              <div className="flex gap-1">
                {(['left', 'center', 'right'] as const).map((a) => (
                  <Button
                    key={a}
                    type="button"
                    size="sm"
                    variant={one.style.align === a ? 'secondary' : 'outline'}
                    onClick={() => patchStyle({ align: a })}
                    className="flex-1 capitalize"
                  >
                    {a}
                  </Button>
                ))}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{t('pages.settings.designer.rotation')}</Label>
                <Input
                  type="number"
                  step="1"
                  value={one.rotation}
                  onChange={(e) => patchEl({ rotation: Number(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{t('pages.settings.designer.visibility')}</Label>
                <Select
                  value={one.visibleWhen ? one.visibleWhen.fieldKey : '__always'}
                  onValueChange={(v) => {
                    if (!v) return
                    patchEl({
                      visibleWhen: v === '__always' ? null : { fieldKey: v, op: 'notEmpty' },
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__always">
                      {t('pages.settings.designer.alwaysVisible')}
                    </SelectItem>
                    {fields.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        Hide when {f.label} is empty
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Applies at print time, per record — useful for a row like GSTIN that only some
                  shops have.
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{t('pages.settings.designer.colour')}</Label>
                <Input
                  type="color"
                  value={one.style.color}
                  onChange={(e) => patchStyle({ color: e.target.value })}
                  className="h-9 p-1"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview renders the *real* print HTML in a sandboxed iframe rather than opening a print
       * window — you can check a layout without dismissing a printer dialog every time. It is
       * the identical output `Print` produces; nothing preview-only is injected. */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          size="xl"
          className="flex max-h-[calc(100dvh-2rem)] flex-col gap-3 overflow-hidden"
        >
          <DialogTitle className="flex items-baseline gap-2">
            Preview
            <span className="text-sm font-normal text-muted-foreground">— sample data</span>
          </DialogTitle>
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/40 p-4">
            <iframe
              title={t('pages.settings.designer.templatePreview')}
              srcDoc={html()}
              sandbox=""
              className="mx-auto block h-[60vh] w-full max-w-[840px] rounded border bg-white"
            />
          </div>
          <div className="flex shrink-0 justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={() => openPrintWindow(html())}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PageSetupDialog
        open={pageSetupOpen}
        onOpenChange={setPageSetupOpen}
        draft={draft}
        onChange={(patch) => state.commit((prev) => ({ ...prev, ...patch }))}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t('pages.settings.designer.resetToTheDefaultLayout')}
        message={t('pages.settings.designer.everyElementOnThisTemplateIs')}
        confirmLabel={t('common.reset')}
        onConfirm={() => {
          const preset =
            PRINT_PRESETS.find(
              (p) =>
                p.documentType === template!.documentType && p.presetKey === template!.presetKey
            ) ?? PRINT_PRESETS.find((p) => p.documentType === template!.documentType)
          if (!preset) return
          const layout = buildDefaultLayout(preset)
          state.commit((prev) => ({
            ...prev,
            elements: layout.elements,
            bandHeights: layout.bandHeights,
          }))
          state.setSelectedIds([])
          setConfirmReset(false)
        }}
      />

      <DetailDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        icon={History}
        title={t('pages.settings.designer.versionHistory')}
        subtitle={`${template.name} — currently on v${template.version}`}
      >
        {versions.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : versions.error ? (
          <ErrorState error={versions.error} onRetry={() => void versions.refetch()} />
        ) : !versions.data?.length ? (
          <EmptyState
            icon={History}
            title={t('pages.settings.designer.noEarlierVersionsYet')}
            description={t('pages.settings.designer.aVersionIsRecordedEachTime')}
          />
        ) : (
          <ol className="space-y-2">
            {versions.data.map((v) => (
              <li key={v.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                    v{v.version}
                  </span>
                  <span className="font-medium">{v.name}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => restoreVersion(v)}
                  >
                    <Undo2 className="size-4" />
                    Restore
                  </Button>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {v.elements.length} element{v.elements.length === 1 ? '' : 's'} · {v.paper.width}×
                  {v.paper.height}
                  {v.paper.unit}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Replaced by {v.supersededByName} · {formatDateTimeLong(v.supersededAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirmBack}
        onOpenChange={setConfirmBack}
        title={t('pages.settings.designer.discardUnsavedChanges')}
        message={t('pages.settings.designer.thisTemplateHasEditsThatHaven')}
        confirmLabel={t('common.discard')}
        onConfirm={() => navigate(buildPath('settings', 'print-formats'))}
      />
    </div>
  )
}
