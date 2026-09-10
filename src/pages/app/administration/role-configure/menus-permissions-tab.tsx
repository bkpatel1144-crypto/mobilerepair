import { useMemo, useState } from 'react'
import {
  ChevronRight,
  Search,
  LayoutGrid,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Check,
} from 'lucide-react'
import { NAV_SECTIONS, menuKey, type NavSection } from '@/config/nav'
import {
  PERMISSION_CATALOGUE,
  ALL_PERMISSION_KEYS,
  keysForModule,
} from '@/config/permission-catalogue'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { RoleWithId } from '@/hooks/use-roles'
import type { RoleDraft } from './types'
import { useTranslation } from 'react-i18next'

type VisibilityFilter = 'all' | 'selected' | 'unselected'

/** A permission chip's tone. `view` reads as neutral, a destructive action as red, so a role's
 *  reach is legible at a glance rather than as forty identical boxes. */
function actionTone(action: string, checked: boolean) {
  if (!checked) return 'bg-muted/30'
  if (action === 'delete')
    return 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
  if (action === 'view' || action === 'export')
    return 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
  return 'border-teal-200 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10'
}

interface MenusPermissionsTabProps {
  draft: RoleDraft
  setDraft: (updater: (prev: RoleDraft) => RoleDraft) => void
  otherRoles: RoleWithId[]
  disabled?: boolean
}

export function MenusPermissionsTab({
  draft,
  setDraft,
  otherRoles,
  disabled,
}: MenusPermissionsTabProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState<VisibilityFilter>('all')
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [pendingInheritRoleId, setPendingInheritRoleId] = useState<string | null>(null)

  const allLeafKeys = useMemo(
    () =>
      NAV_SECTIONS.flatMap((s) =>
        s.children.filter((l) => !l.locked).map((l) => menuKey(s.key, l.slug))
      ),
    []
  )
  const allActionKeysFlat = ALL_PERMISSION_KEYS

  const totalMenus = allLeafKeys.length
  const checkedMenus = allLeafKeys.filter((k) => draft.menuPermissions[k]).length
  const totalPermissions = allActionKeysFlat.length
  const checkedPermissions = allActionKeysFlat.filter((k) => draft.actionPermissions[k]).length

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function toggleLeaf(section: NavSection, slug: string) {
    const key = menuKey(section.key, slug)
    setDraft((prev) => ({
      ...prev,
      menuPermissions: { ...prev.menuPermissions, [key]: !prev.menuPermissions[key] },
    }))
  }

  function toggleModuleAll(section: NavSection) {
    const leafKeys = section.children
      .filter((l) => !l.locked)
      .map((l) => menuKey(section.key, l.slug))
    const allChecked = leafKeys.every((k) => draft.menuPermissions[k])
    setDraft((prev) => {
      const next = { ...prev.menuPermissions }
      for (const k of leafKeys) next[k] = !allChecked
      return { ...prev, menuPermissions: next }
    })
  }

  function togglePermission(key: string) {
    setDraft((prev) => ({
      ...prev,
      actionPermissions: { ...prev.actionPermissions, [key]: !prev.actionPermissions[key] },
    }))
  }

  /** Every permission a feature has, on or off together. */
  function toggleFeature(keys: string[]) {
    const allOn = keys.every((k) => draft.actionPermissions[k])
    setDraft((prev) => {
      const next = { ...prev.actionPermissions }
      for (const k of keys) next[k] = !allOn
      return { ...prev, actionPermissions: next }
    })
  }

  function handleCollapseAll() {
    setExpanded(new Set())
  }
  function handleExpandAll() {
    setExpanded(new Set(NAV_SECTIONS.map((s) => s.key)))
  }
  function handleClearAll() {
    setDraft((prev) => ({ ...prev, menuPermissions: {}, actionPermissions: {} }))
  }
  function handleSelectAll() {
    setDraft((prev) => ({
      ...prev,
      menuPermissions: Object.fromEntries(allLeafKeys.map((k) => [k, true])),
      actionPermissions: Object.fromEntries(allActionKeysFlat.map((k) => [k, true])),
    }))
  }
  function applyInherit(roleId: string) {
    const source = otherRoles.find((r) => r.id === roleId)
    if (!source) return
    setDraft((prev) => ({
      ...prev,
      fullAccess: source.fullAccess,
      menuPermissions: { ...source.menuPermissions },
      actionPermissions: { ...source.actionPermissions },
    }))
  }

  const pendingInheritRole = otherRoles.find((r) => r.id === pendingInheritRoleId) ?? null
  const searchLower = search.trim().toLowerCase()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
          <LayoutGrid className="size-3.5" /> {checkedMenus}/{totalMenus} MENUS
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
          <KeyRound className="size-3.5" /> {checkedPermissions}/{totalPermissions} PERMISSIONS
        </span>
        {draft.fullAccess && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <ShieldAlert className="size-3.5" /> Full access (*)
          </span>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
            disabled={disabled}
          >
            Collapse
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
            disabled={disabled}
          >
            Expand
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmingClear(true)}
            disabled={disabled || draft.fullAccess}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={disabled || draft.fullAccess}
          >
            Select All
          </Button>
          {otherRoles.length > 0 && (
            <Select onValueChange={setPendingInheritRoleId} disabled={disabled || draft.fullAccess}>
              <SelectTrigger size="sm" className="w-[160px]">
                <SelectValue
                  placeholder={t('pages.administration.menusPermissionsTab.inheritFromRole')}
                />
              </SelectTrigger>
              <SelectContent>
                {otherRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            type="button"
            size="sm"
            variant={draft.fullAccess ? 'default' : 'outline'}
            onClick={() => setDraft((prev) => ({ ...prev, fullAccess: !prev.fullAccess }))}
            disabled={disabled}
          >
            <ShieldCheck className="size-3.5" />
            {draft.fullAccess
              ? 'Full Access Granted'
              : t('pages.administration.menusPermissionsTab.grantFullAccess')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:flex-none sm:basis-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pages.administration.menusPermissionsTab.searchMenus')}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'selected', 'unselected'] as const).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={visibility === v ? 'default' : 'outline'}
              onClick={() => setVisibility(v)}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {NAV_SECTIONS.map((section) => {
          const leaves = section.children.filter((l) => !l.locked)
          const matchesSearch =
            !searchLower ||
            section.label.toLowerCase().includes(searchLower) ||
            leaves.some((l) => l.label.toLowerCase().includes(searchLower))
          if (!matchesSearch) return null

          const leafKeys = leaves.map((l) => menuKey(section.key, l.slug))
          const checkedCount = leafKeys.filter((k) => draft.menuPermissions[k]).length
          const moduleAllChecked = checkedCount === leaves.length && leaves.length > 0
          const isOpen = expanded.has(section.key)
          const schema = PERMISSION_CATALOGUE.find((m) => m.sectionKey === section.key)
          const moduleActionKeys = schema ? keysForModule(schema) : []
          const moduleCheckedActions = moduleActionKeys.filter(
            (k) => draft.actionPermissions[k]
          ).length

          const visibleLeaves = leaves.filter((l) => {
            const checked = draft.menuPermissions[menuKey(section.key, l.slug)]
            if (visibility === 'selected') return checked
            if (visibility === 'unselected') return !checked
            return true
          })

          const modulePermissionsFull = !!schema && moduleCheckedActions === moduleActionKeys.length

          return (
            <div key={section.key} className="overflow-hidden rounded-lg border">
              <div
                className={cn(
                  'flex items-center gap-2.5 p-2.5',
                  moduleAllChecked && 'bg-teal-50 dark:bg-teal-500/10'
                )}
              >
                <Checkbox
                  checked={moduleAllChecked}
                  indeterminate={checkedCount > 0 && !moduleAllChecked}
                  onCheckedChange={() => toggleModuleAll(section)}
                  disabled={disabled || draft.fullAccess}
                />
                <button
                  type="button"
                  onClick={() => toggleExpand(section.key)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <ChevronRight
                    className={cn(
                      'size-4 shrink-0 text-muted-foreground transition-transform',
                      isOpen && 'rotate-90'
                    )}
                  />
                  <span className="font-medium">{section.label}</span>
                </button>
                <span className="text-xs text-muted-foreground">
                  {checkedCount}/{leaves.length}
                </span>
                {schema && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                    <KeyRound className="size-3.5" /> {moduleCheckedActions}/
                    {moduleActionKeys.length}
                    {modulePermissionsFull && <Check className="size-3.5" />}
                  </span>
                )}
              </div>

              {isOpen && (
                <div className="space-y-4 border-t p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {visibleLeaves.map((leaf) => (
                      <label
                        key={leaf.slug}
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
                          draft.menuPermissions[menuKey(section.key, leaf.slug)]
                            ? 'border-teal-200 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10'
                            : 'bg-muted/30'
                        )}
                      >
                        <Checkbox
                          checked={draft.menuPermissions[menuKey(section.key, leaf.slug)] === true}
                          onCheckedChange={() => toggleLeaf(section, leaf.slug)}
                          disabled={disabled || draft.fullAccess}
                        />
                        {leaf.label}
                      </label>
                    ))}
                  </div>

                  {schema && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <KeyRound className="size-4" />
                          {t('common.permissions')} {moduleCheckedActions}/{moduleActionKeys.length}
                        </span>
                        {draft.fullAccess && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                            {t('pages.administration.menusPermissionsTab.grantedViaFullAccess')}
                          </span>
                        )}
                      </div>

                      {/* Module access first, on its own. The reference treats it as a permission
                       * in its own right — a role can hold every permission inside a module and
                       * still not be able to open it. */}
                      <label
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm',
                          actionTone(
                            'access',
                            draft.actionPermissions[schema.moduleAccess.key] === true
                          )
                        )}
                      >
                        <Checkbox
                          checked={draft.actionPermissions[schema.moduleAccess.key] === true}
                          onCheckedChange={() => togglePermission(schema.moduleAccess.key)}
                          disabled={disabled || draft.fullAccess}
                        />
                        <span className="font-medium">{schema.moduleAccess.label}</span>
                      </label>

                      {/* One block per feature, carrying exactly the permissions that feature
                       * has. This replaced an entity x CRUD grid, which could express neither
                       * `MASTERS_ITEMS_IMPORT` nor `SERVICE_JOB_CARDS_ASSIGN`, and invented
                       * combinations the reference does not have — deleting a report, say. */}
                      {schema.features.map((feature) => {
                        const featureKeys = feature.permissions.map((p) => p.key)
                        const on = featureKeys.filter(
                          (k) => draft.actionPermissions[k] === true
                        ).length
                        const leaf = section.children.find((l) => l.slug === feature.navSlug)
                        const label = leaf?.label ?? feature.refSlug
                        if (searchLower && !label.toLowerCase().includes(searchLower)) {
                          // Only filter features out when the search does not already match the
                          // module itself — otherwise searching "Masters" would empty it.
                          if (!section.label.toLowerCase().includes(searchLower)) return null
                        }
                        const visible = feature.permissions.filter((p) => {
                          const checked = draft.actionPermissions[p.key] === true
                          if (visibility === 'selected') return checked
                          if (visibility === 'unselected') return !checked
                          return true
                        })
                        if (!visible.length) return null
                        return (
                          <div key={feature.navSlug} className="rounded-lg border">
                            <div className="flex items-center gap-2 border-b bg-muted/40 px-2.5 py-1.5">
                              <Checkbox
                                checked={on === featureKeys.length}
                                indeterminate={on > 0 && on < featureKeys.length}
                                onCheckedChange={() => toggleFeature(featureKeys)}
                                disabled={disabled || draft.fullAccess}
                              />
                              <span className="text-sm font-medium">{label}</span>
                              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                                {on}/{featureKeys.length}
                              </span>
                            </div>
                            <div className="grid gap-1.5 p-2 sm:grid-cols-2 lg:grid-cols-3">
                              {visible.map((permission) => {
                                const checked = draft.actionPermissions[permission.key] === true
                                return (
                                  <label
                                    key={permission.key}
                                    title={permission.key}
                                    className={cn(
                                      'flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs',
                                      actionTone(permission.action, checked)
                                    )}
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={() => togglePermission(permission.key)}
                                      disabled={disabled || draft.fullAccess}
                                    />
                                    <span className="truncate">{permission.label}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={confirmingClear}
        onOpenChange={setConfirmingClear}
        title={t('pages.administration.menusPermissionsTab.clearAllMenusPermissions')}
        message={t('pages.administration.menusPermissionsTab.thisWipesEveryMenuAndPermission')}
        confirmLabel={t('shared.clearAll')}
        onConfirm={() => {
          handleClearAll()
          setConfirmingClear(false)
        }}
      />

      <ConfirmDialog
        open={!!pendingInheritRoleId}
        onOpenChange={(open) => !open && setPendingInheritRoleId(null)}
        title={`Inherit permissions from "${pendingInheritRole?.name ?? ''}"?`}
        message={t('pages.administration.menusPermissionsTab.thisReplacesEveryMenuAndPermission')}
        confirmLabel={t('pages.administration.menusPermissionsTab.inherit')}
        onConfirm={() => {
          if (pendingInheritRoleId) applyInherit(pendingInheritRoleId)
          setPendingInheritRoleId(null)
        }}
      />
    </div>
  )
}
