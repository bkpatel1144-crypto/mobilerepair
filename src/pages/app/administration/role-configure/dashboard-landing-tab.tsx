import { useState } from 'react'
import {
  DASHBOARD_WIDGETS,
  WIDGET_GROUPS,
  allWidgetsEnabled,
  widgetsInGroup,
} from '@/config/dashboard-widgets'
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
          const widgets = widgetsInGroup(group.key)
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
                {widgets.map((widget) => (
                  <label
                    key={widget.key}
                    title={
                      widget.available
                        ? undefined
                        : t('pages.administration.dashboardLandingTab.thisWidgetIsInTheReference')
                    }
                    className={cn(
                      'flex min-w-0 items-start gap-2 rounded-md border bg-muted/30 p-2.5 text-sm',
                      widget.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                    )}
                  >
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
