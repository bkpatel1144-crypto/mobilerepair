import { useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  Compass,
  PanelRight,
  Plus,
  X,
  Sparkles,
  Check,
  Maximize2,
  User,
  Zap,
  Gauge,
  BarChart3,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'
import {
  DASHBOARD_WIDGETS,
  WIDGET_GROUPS,
  allWidgetsEnabled,
  widgetsInOrder,
  type WidgetGroupKey,
} from '@/config/dashboard-widgets'
import { DASHBOARD_MENU_KEY, DASHBOARD_NAV, NAV_SECTIONS, menuKey } from '@/config/nav'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWidgetLabels } from '@/hooks/use-widget-labels'
import { cn } from '@/lib/utils'
import { PreviewWidget } from './dashboard-preview'
import type { RoleDraft } from './types'
import { useTranslation } from 'react-i18next'

/**
 * Dashboard & Landing: a live preview of the dashboard this role will get.
 *
 * This replaced a list of thirty-four checkboxes. The reference builds the same screen as a
 * preview, and it is the better idea for a reason worth writing down: an administrator deciding
 * what a Technician should see is answering a visual question, and a column of labels reading
 * "Total in Pipeline — All job cards still active in the pipeline" cannot answer it. Here they
 * see the dashboard, click a widget's ✕ to drop it, and drag to reorder.
 *
 * The Widget Library drawer is where widgets are added back, grouped exactly as the catalogue
 * groups them, each showing its "N / M added" count. Widgets the product has not built are listed
 * with a sparkle and cannot be switched on — they are in the catalogue so the group totals match
 * the reference, not because they do anything.
 */

interface DashboardLandingTabProps {
  draft: RoleDraft
  setDraft: (updater: (prev: RoleDraft) => RoleDraft) => void
  disabled?: boolean
}

const GROUP_ICON: Record<WidgetGroupKey, LucideIcon> = {
  personal: User,
  quick: Zap,
  kpi: Gauge,
  chart: BarChart3,
  list: ListChecks,
}

const GROUP_ICON_TONE: Record<WidgetGroupKey, string> = {
  personal: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400',
  quick: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
  kpi: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  chart: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
  list: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
}

/** How wide one widget sits in the preview grid. Mirrors the real Dashboard's own layout: tiles
 *  four-up, charts two-up, banners and lists full width. */
const GROUP_SPAN: Record<WidgetGroupKey, string> = {
  personal: 'sm:col-span-6',
  quick: 'sm:col-span-2',
  kpi: 'sm:col-span-1',
  chart: 'sm:col-span-3',
  list: 'sm:col-span-6',
}

export function DashboardLandingTab({ draft, setDraft, disabled }: DashboardLandingTabProps) {
  const { t } = useTranslation()
  const widgetText = useWidgetLabels()
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [landingOpen, setLandingOpen] = useState(true)
  const [wide, setWide] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)

  // Escape closes the library, as the drawer's own footer promises.
  useEffect(() => {
    if (!libraryOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLibraryOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [libraryOpen])

  const landingOptions = [
    { key: DASHBOARD_MENU_KEY, label: `${DASHBOARD_NAV.label} (${t('common.default')})` },
    ...NAV_SECTIONS.flatMap((section) =>
      section.children
        .filter((leaf) => !leaf.locked && draft.menuPermissions[menuKey(section.key, leaf.slug)])
        .map((leaf) => ({
          key: menuKey(section.key, leaf.slug),
          label: `${section.label} › ${leaf.label}`,
        }))
    ),
  ]

  const isOn = (key: string) => draft.dashboardConfig.visibleWidgets[key] === true
  const activeCount = DASHBOARD_WIDGETS.filter((w) => isOn(w.key)).length
  const ordered = widgetsInOrder(draft.dashboardConfig.widgetOrder)

  function toggleWidget(key: string) {
    // Every widget is selectable, including the ones not built yet — they render as a
    // "Widget coming soon" card. See `allWidgetsEnabled` for why that changed.
    setDraft((prev) => ({
      ...prev,
      dashboardConfig: {
        ...prev.dashboardConfig,
        visibleWidgets: {
          ...prev.dashboardConfig.visibleWidgets,
          [key]: !prev.dashboardConfig.visibleWidgets[key],
        },
      },
    }))
  }

  function setAllWidgets(value: boolean) {
    setDraft((prev) => ({
      ...prev,
      dashboardConfig: {
        ...prev.dashboardConfig,
        visibleWidgets: value
          ? allWidgetsEnabled()
          : Object.fromEntries(DASHBOARD_WIDGETS.map((w) => [w.key, false])),
      },
    }))
  }

  /**
   * Moves a widget within its group.
   *
   * Scoped to the group because the Dashboard renders the groups in a fixed order — banner, quick
   * actions, tiles, charts, lists — so a chart dragged in among the tiles would not survive a
   * render. The stored order covers the whole catalogue, so one list expresses every group.
   */
  function reorder(groupKey: WidgetGroupKey, fromKey: string, toKey: string) {
    if (fromKey === toKey) return
    setDraft((prev) => {
      const current = widgetsInOrder(prev.dashboardConfig.widgetOrder)
      const group = current.filter((w) => w.group === groupKey).map((w) => w.key)
      const from = group.indexOf(fromKey)
      const to = group.indexOf(toKey)
      if (from < 0 || to < 0) return prev
      const next = [...group]
      next.splice(to, 0, ...next.splice(from, 1))
      let cursor = 0
      return {
        ...prev,
        dashboardConfig: {
          ...prev.dashboardConfig,
          widgetOrder: current.map((w) => (w.group === groupKey ? next[cursor++] : w.key)),
        },
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* ---- toolbar ------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums">
          <LayoutGrid className="size-3.5" />
          {activeCount} / {DASHBOARD_WIDGETS.length}
        </span>
        <button
          type="button"
          onClick={() => setAllWidgets(true)}
          disabled={disabled || activeCount === DASHBOARD_WIDGETS.length}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <Eye className="size-3.5" />
          {t('pages.administration.dashboardLandingTab.showAll')}
        </button>
        <button
          type="button"
          onClick={() => setAllWidgets(false)}
          disabled={disabled || activeCount === 0}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <EyeOff className="size-3.5" />
          {t('pages.administration.dashboardLandingTab.hideAll')}
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLandingOpen((v) => !v)}
          >
            <Compass className="size-3.5" />
            {t('pages.administration.dashboardLandingTab.landing')}
          </Button>
          <Button type="button" size="sm" onClick={() => setLibraryOpen(true)} disabled={disabled}>
            <PanelRight className="size-3.5" />
            {t('pages.administration.dashboardLandingTab.addWidget')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={t('pages.administration.dashboardLandingTab.widenPreview')}
            onClick={() => setWide((v) => !v)}
          >
            <Maximize2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {landingOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground">
            {t('pages.administration.dashboardLandingTab.redirectOnLogin')}
          </label>
          <Select
            value={draft.dashboardConfig.defaultLandingRoute}
            onValueChange={(value) => {
              if (!value) return
              setDraft((prev) => ({
                ...prev,
                dashboardConfig: { ...prev.dashboardConfig, defaultLandingRoute: value },
              }))
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {landingOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ---- the preview --------------------------------------------------------------- */}
      <div className={cn('mx-auto space-y-3', wide ? 'max-w-none' : 'max-w-5xl')}>
        {activeCount === 0 && (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t('pages.administration.dashboardLandingTab.everyWidgetIsHidden')}
          </p>
        )}
        {WIDGET_GROUPS.map((group) => {
          const inGroup = ordered.filter((w) => w.group === group.key && isOn(w.key))
          if (!inGroup.length) return null
          const Icon = GROUP_ICON[group.key]
          return (
            <section key={group.key} className="rounded-xl border bg-muted/20 p-3">
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    GROUP_ICON_TONE[group.key]
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {widgetText.group(group.key, group.label)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('pages.administration.dashboardLandingTab.nWidgets', {
                      count: inGroup.length,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLibraryOpen(true)}
                  disabled={disabled}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <Plus className="size-3.5" />
                  {t('common.add')}
                </button>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-6">
                {inGroup.map((widget) => (
                  <div
                    key={widget.key}
                    data-widget={widget.key}
                    draggable={!disabled}
                    onDragStart={() => setDragging(widget.key)}
                    onDragEnd={() => setDragging(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (dragging) reorder(group.key, dragging, widget.key)
                      setDragging(null)
                    }}
                    className={cn(
                      'group relative min-w-0',
                      GROUP_SPAN[group.key],
                      dragging === widget.key && 'opacity-40'
                    )}
                  >
                    {/* Both controls appear on hover, as the reference does — a permanent ✕ on
                     * every tile turns the preview into a form again. */}
                    {!disabled && (
                      <>
                        <span className="absolute -top-1.5 -left-1.5 z-10 hidden cursor-grab rounded-md border bg-background p-1 shadow-sm group-hover:block">
                          <GripVertical className="size-3 text-muted-foreground" />
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleWidget(widget.key)}
                          aria-label={`${t('common.remove')} ${widget.label}`}
                          className="absolute -top-1.5 -right-1.5 z-10 hidden rounded-full border bg-background p-1 shadow-sm group-hover:block hover:bg-muted"
                        >
                          <X className="size-3" />
                        </button>
                      </>
                    )}
                    <PreviewWidget widget={widget} />
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* ---- widget library ------------------------------------------------------------ */}
      {libraryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label={t('common.close')}
            className="flex-1 bg-black/20"
            onClick={() => setLibraryOpen(false)}
          />
          <div className="flex w-full max-w-md flex-col border-l bg-background shadow-xl">
            <div className="flex items-start justify-between gap-2 border-b p-4">
              <div>
                <p className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="size-4 text-teal-600 dark:text-teal-400" />
                  {t('pages.administration.dashboardLandingTab.widgetLibrary')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('pages.administration.dashboardLandingTab.clickAnyWidgetToAddOrRemove')}
                </p>
              </div>
              <button
                type="button"
                aria-label={t('common.close')}
                onClick={() => setLibraryOpen(false)}
                className="rounded p-1 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {WIDGET_GROUPS.map((group) => {
                const widgets = ordered.filter((w) => w.group === group.key)
                const added = widgets.filter((w) => isOn(w.key)).length
                const Icon = GROUP_ICON[group.key]
                return (
                  <section key={group.key} className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-lg',
                          GROUP_ICON_TONE[group.key]
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">
                          {widgetText.group(group.key, group.label)}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {t('pages.administration.dashboardLandingTab.addedCount', {
                            added,
                            total: widgets.length,
                          })}
                        </p>
                      </div>
                    </div>

                    {widgets.map((widget) => {
                      const on = isOn(widget.key)
                      return (
                        <button
                          key={widget.key}
                          type="button"
                          data-library-widget={widget.key}
                          onClick={() => toggleWidget(widget.key)}
                          disabled={disabled}
                          title={
                            widget.available
                              ? undefined
                              : t('pages.administration.dashboardLandingTab.widgetComingSoon')
                          }
                          className={cn(
                            'flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left',
                            on
                              ? 'border-teal-200 bg-teal-50/60 dark:border-teal-500/30 dark:bg-teal-500/10'
                              : 'bg-muted/20',
                            'hover:border-teal-300'
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                              on
                                ? 'border-teal-600 bg-teal-600 text-white'
                                : 'border-muted-foreground/30'
                            )}
                          >
                            {on && <Check className="size-3" />}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-sm font-medium">
                              {widgetText.label(widget.key, widget.label)}
                              {!widget.available && (
                                <Sparkles className="size-3 text-amber-500" aria-hidden />
                              )}
                            </span>
                            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                              {widgetText.description(widget.key, widget.description)}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </section>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-2 border-t p-3 text-xs text-muted-foreground">
              <span>{t('pages.administration.dashboardLandingTab.tipPressEscToClose')}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium tabular-nums">
                {t('pages.administration.dashboardLandingTab.activeCount', { count: activeCount })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
