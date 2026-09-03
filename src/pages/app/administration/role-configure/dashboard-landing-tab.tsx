import { useState } from 'react'
import { DASHBOARD_WIDGETS } from '@/config/dashboard-widgets'
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
import type { RoleDraft } from './types'

interface DashboardLandingTabProps {
  draft: RoleDraft
  setDraft: (updater: (prev: RoleDraft) => RoleDraft) => void
  disabled?: boolean
}

export function DashboardLandingTab({ draft, setDraft, disabled }: DashboardLandingTabProps) {
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
        visibleWidgets: Object.fromEntries(DASHBOARD_WIDGETS.map((w) => [w.key, value])),
      },
    }))
  }

  const enabledCount = DASHBOARD_WIDGETS.filter(
    (w) => draft.dashboardConfig.visibleWidgets[w.key]
  ).length

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Default Landing Page</label>
        <p className="text-xs text-muted-foreground">
          Where this role lands immediately after logging in.
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Visible Dashboard Widgets</label>
            <p className="text-xs text-muted-foreground">
              {enabledCount}/{DASHBOARD_WIDGETS.length} widgets shown on this role's dashboard.
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
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAllWidgets(true)}
              disabled={disabled}
            >
              Select All
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARD_WIDGETS.map((widget) => (
            <label
              key={widget.key}
              className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-sm"
            >
              <Checkbox
                checked={draft.dashboardConfig.visibleWidgets[widget.key] === true}
                onCheckedChange={() => toggleWidget(widget.key)}
                disabled={disabled}
              />
              {widget.label}
            </label>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={confirmingClear}
        onOpenChange={setConfirmingClear}
        title="Clear all dashboard widgets?"
        message="This turns off every dashboard widget for this role — its dashboard will show nothing until widgets are re-enabled. It only affects the unsaved draft."
        confirmLabel="Clear All"
        onConfirm={() => {
          setAllWidgets(false)
          setConfirmingClear(false)
        }}
      />
    </div>
  )
}
