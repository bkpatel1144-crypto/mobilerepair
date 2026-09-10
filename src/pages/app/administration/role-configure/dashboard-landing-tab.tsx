import { useState } from 'react'
import {
  DASHBOARD_WIDGETS,
  WIDGET_GROUPS,
  allWidgetsEnabled,
  widgetsInGroup,
  widgetsInOrder,
} from '@/config/dashboard-widgets'
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { DASHBOARD_MENU_KEY, DASHBOARD_NAV, NAV_SECTIONS, menuKey } from '@/config/nav'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useWidgetLabels } from '@/hooks/use-widget-labels'
import { cn } from '@/lib/utils'
import type { WidgetGroupKey } from '@/config/dashboard-widgets'
import type { RoleDraft } from './types'
import { useTranslation } from 'react-i18next'

/**
 * The Widget Library, in the five groups the reference app presents it in.
 *
 * What this replaced was a flat list of every catalogue entry with a checkbox each, which had two
 * concrete faults beyond looking nothing like the reference:
 *
 *  - It offered widgets the product has not built. Ticking one wrote `true` into the role document
 *    and changed nothing on the Dashboard — a control that lies about what it does. They stay
 *    listed, because the group counts ("1 / 2 added" for Personal) only read correctly with them
 *    present, but they are disabled and badged.
 *  - "Select All" wrote `true` for all 34, unbuilt ones included. It now seeds exactly the set the
 *    Dashboard can render, which is the same set signup writes.
 */

interface DashboardLandingTabProps {
  draft: RoleDraft
  setDraft: (updater: (prev: RoleDraft) => RoleDraft) => void
  disabled?: boolean
}

const BUILT_WIDGETS = DASHBOARD_WIDGETS.filter((w) => w.available)

export function DashboardLandingTab({ draft, setDraft, disabled }: DashboardLandingTabProps) {
  const { t } = useTranslation()
  const widgetText = useWidgetLabels()
  const [confirmingClear, setConfirmingClear] = useState(false)
  // Only routes this role can actually reach make sense as a landing page.
  const landingOptions = [
    { key: DASHBOARD_MENU_KEY, label: DASHBOARD_NAV.label },
    ...NAV_SECTIONS.flatMap((section) =>
      section.children
        .filter((leaf) => !leaf.locked && draft.menuPermissions[menuKey(section.key, leaf.slug)])
        .map((leaf) => ({
          key: menuKey(section.key, leaf.slug),
          label: `${section.label} — ${leaf.label}`,
        }))
    ),
  ]

  function toggleWidget(key: string) {
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
        // `allWidgetsEnabled()` rather than every catalogue key, so "Select All" cannot switch on
        // a widget the Dashboard has no implementation for.
        visibleWidgets: value
          ? allWidgetsEnabled()
          : Object.fromEntries(BUILT_WIDGETS.map((w) => [w.key, false])),
      },
    }))
  }

  const isOn = (key: string) => draft.dashboardConfig.visibleWidgets[key] === true
  const enabledCount = BUILT_WIDGETS.filter((w) => isOn(w.key)).length

  /**
   * Moves a widget within its group.
   *
   * Reordering is scoped to the group because the Dashboard renders the groups in a fixed order
   * — the welcome banner, then quick actions, then KPI tiles, then charts, then lists — and
   * dragging a chart in among the stat tiles would not survive a render. Within a group it is
   * free.
   *
   * The stored order is the whole catalogue's, not just the group's, so one list can express
   * every group's arrangement and `widgetsInOrder` needs no notion of groups at all.
   */
  function moveWidget(groupKey: WidgetGroupKey, key: string, delta: number) {
    setDraft((prev) => {
      const current = widgetsInOrder(prev.dashboardConfig.widgetOrder)
      const group = current.filter((w) => w.group === groupKey).map((w) => w.key)
      const from = group.indexOf(key)
      const to = from + delta
      if (from < 0 || to < 0 || to >= group.length) return prev
      const reordered = [...group]
      const [moved] = reordered.splice(from, 1)
      reordered.splice(to, 0, moved)

      // Rebuild the full list, substituting this group's new sequence in place.
      let cursor = 0
      const next = current.map((w) => (w.group === groupKey ? reordered[cursor++] : w.key))
      return {
        ...prev,
        dashboardConfig: { ...prev.dashboardConfig, widgetOrder: next },
      }
    })
  }

  function handleDrop(groupKey: WidgetGroupKey, fromKey: string, toKey: string) {
    if (fromKey === toKey) return
    const current = widgetsInOrder(draft.dashboardConfig.widgetOrder)
    const group = current.filter((w) => w.group === groupKey).map((w) => w.key)
    const from = group.indexOf(fromKey)
    const to = group.indexOf(toKey)
    if (from < 0 || to < 0) return
    moveWidget(groupKey, fromKey, to - from)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {t('pages.administration.dashboardLandingTab.defaultLandingPage')}
        </label>
        <p className="text-xs text-muted-foreground">
          {t('pages.administration.dashboardLandingTab.whereThisRoleLandsImmediatelyAfter')}
        </p>
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

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <label className="text-sm font-medium">
              {t('pages.administration.dashboardLandingTab.visibleDashboardWidgets')}
            </label>
            <p className="text-xs text-muted-foreground">
              {t('pages.administration.dashboardLandingTab.widgetsShownOnThisRoleSDashboard')}{' '}
              <span className="font-medium text-foreground">
                {t('pages.administration.dashboardLandingTab.activeCount', {
                  count: enabledCount,
                })}
              </span>
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmingClear(true)}
              disabled={disabled || enabledCount === 0}
            >
              {t('common.clear')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAllWidgets(true)}
              disabled={disabled || enabledCount === BUILT_WIDGETS.length}
            >
              {t('common.selectAll')}
            </Button>
          </div>
        </div>

        {WIDGET_GROUPS.map((group) => {
          // The role's own order within the group, falling back to the catalogue's.
          const ordered = widgetsInOrder(draft.dashboardConfig.widgetOrder)
          const widgets = ordered.filter((w) => w.group === group.key)
          // Asserted rather than assumed: a bad order must not drop a widget off the screen.
          if (widgets.length !== widgetsInGroup(group.key).length) {
            throw new Error(`widget order lost entries in ${group.key}`)
          }
          const added = widgets.filter((w) => w.available && isOn(w.key)).length
          return (
            <section key={group.key} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 border-b pb-1.5">
                <h3 className="text-sm font-semibold">
                  {widgetText.group(group.key, group.label)}
                </h3>
                <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {t('pages.administration.dashboardLandingTab.addedCount', {
                    added,
                    total: widgets.length,
                  })}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {widgets.map((widget, index) => (
                  <label
                    key={widget.key}
                    title={
                      widget.available
                        ? undefined
                        : t('pages.administration.dashboardLandingTab.thisWidgetIsInTheReference')
                    }
                    draggable={!disabled}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', widget.key)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDrop(group.key, e.dataTransfer.getData('text/plain'), widget.key)
                    }}
                    className={cn(
                      'flex min-w-0 items-start gap-2 rounded-md border bg-muted/30 p-2.5 text-sm',
                      widget.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {/* Drag to reorder, and the two buttons for anyone not using a mouse — a
                     * drag handle alone is unreachable by keyboard and unusable on a phone. */}
                    <span className="flex flex-col items-center gap-0.5 pt-0.5">
                      <GripVertical
                        className="size-3.5 shrink-0 cursor-grab text-muted-foreground"
                        aria-hidden
                      />
                      <span className="flex gap-0.5">
                        <button
                          type="button"
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          disabled={disabled || index === 0}
                          aria-label={t('pages.administration.dashboardLandingTab.moveUp')}
                          onClick={(e) => {
                            e.preventDefault()
                            moveWidget(group.key, widget.key, -1)
                          }}
                        >
                          <ChevronUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          disabled={disabled || index === widgets.length - 1}
                          aria-label={t('pages.administration.dashboardLandingTab.moveDown')}
                          onClick={(e) => {
                            e.preventDefault()
                            moveWidget(group.key, widget.key, 1)
                          }}
                        >
                          <ChevronDown className="size-3" />
                        </button>
                      </span>
                    </span>
                    <Checkbox
                      className="mt-0.5"
                      checked={widget.available && isOn(widget.key)}
                      onCheckedChange={() => widget.available && toggleWidget(widget.key)}
                      disabled={disabled || !widget.available}
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1.5 font-medium">
                        {widgetText.label(widget.key, widget.label)}
                        {!widget.available && (
                          <span className="rounded-full border px-1.5 py-px text-[10px] font-medium text-muted-foreground uppercase">
                            {t('pages.administration.dashboardLandingTab.notBuiltYet')}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                        {widgetText.description(widget.key, widget.description)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <ConfirmDialog
        open={confirmingClear}
        onOpenChange={setConfirmingClear}
        title={t('pages.administration.dashboardLandingTab.clearAllDashboardWidgets')}
        message={t('pages.administration.dashboardLandingTab.thisTurnsOffEveryDashboardWidget')}
        confirmLabel={t('shared.clearAll')}
        onConfirm={() => {
          setAllWidgets(false)
          setConfirmingClear(false)
        }}
      />
    </div>
  )
}
