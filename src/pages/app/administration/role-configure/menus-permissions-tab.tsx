import { useMemo, useState } from 'react'
import { ChevronRight, Search, LayoutGrid, KeyRound, ShieldCheck, ShieldAlert, Check } from 'lucide-react'
import { NAV_SECTIONS, menuKey, type NavSection } from '@/config/nav'
import {
  PERMISSION_SCHEMA,
  CRUD_OPS,
  crudKey,
  specialActionKey,
  allKeysForModule,
  totalPermissionCount,
  type CrudOp,
} from '@/config/permission-schema'
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

const CRUD_LABELS: Record<CrudOp, string> = {
  create: 'Create',
  delete: 'Delete',
  update: 'Update',
  view: 'View',
}
type VisibilityFilter = 'all' | 'selected' | 'unselected'

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
  const allActionKeysFlat = useMemo(() => PERMISSION_SCHEMA.flatMap(allKeysForModule), [])

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

  function toggleCrud(sectionKey: string, entityKey: string, op: CrudOp) {
    const key = crudKey(sectionKey, entityKey, op)
    setDraft((prev) => ({
      ...prev,
      actionPermissions: { ...prev.actionPermissions, [key]: !prev.actionPermissions[key] },
    }))
  }

  function toggleSpecialAction(sectionKey: string, actionKey: string) {
    const key = specialActionKey(sectionKey, actionKey)
    setDraft((prev) => ({
      ...prev,
      actionPermissions: { ...prev.actionPermissions, [key]: !prev.actionPermissions[key] },
    }))
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
                <SelectValue placeholder="Inherit from role" />
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
            {draft.fullAccess ? 'Full Access Granted' : 'Grant Full Access'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:flex-none sm:basis-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menus..."
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
          const schema = PERMISSION_SCHEMA.find((m) => m.sectionKey === section.key)
          const moduleActionKeys = schema ? allKeysForModule(schema) : []
          const moduleCheckedActions = moduleActionKeys.filter(
            (k) => draft.actionPermissions[k]
          ).length

          const visibleLeaves = leaves.filter((l) => {
            const checked = draft.menuPermissions[menuKey(section.key, l.slug)]
            if (visibility === 'selected') return checked
            if (visibility === 'unselected') return !checked
            return true
          })

          const modulePermissionsFull =
            !!schema && moduleCheckedActions === totalPermissionCount(schema)

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
                    {totalPermissionCount(schema)}
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <KeyRound className="size-4" />
                          Permissions {moduleCheckedActions}/{totalPermissionCount(schema)}
                        </span>
                        {draft.fullAccess && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                            Granted via full access (*)
                          </span>
                        )}
                      </div>

                      <div className="overflow-hidden rounded-lg border">
                        <div className="bg-muted/50 px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          {section.label}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[420px] text-sm">
                            <thead className="border-t bg-muted/30 text-xs text-muted-foreground uppercase">
                              <tr>
                                <th className="p-2 text-left">Entity</th>
                                {CRUD_OPS.map((op) => (
                                  <th key={op} className="p-2 text-center">
                                    {CRUD_LABELS[op]}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {schema.entities.map((entity) => (
                                <tr key={entity.key} className="border-t">
                                  <td className="p-2 font-medium">{entity.label}</td>
                                  {CRUD_OPS.map((op) => (
                                    <td key={op} className="p-2">
                                      <div className="flex justify-center">
                                        <Checkbox
                                          checked={
                                            draft.actionPermissions[
                                              crudKey(section.key, entity.key, op)
                                            ] === true
                                          }
                                          onCheckedChange={() =>
                                            toggleCrud(section.key, entity.key, op)
                                          }
                                          disabled={disabled || draft.fullAccess}
                                        />
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {schema.specialActions.length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-3">
                          {schema.specialActions.map((action) => {
                            const checked =
                              draft.actionPermissions[
                                specialActionKey(section.key, action.key)
                              ] === true
                            return (
                              <label
                                key={action.key}
                                className={cn(
                                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs',
                                  checked
                                    ? 'border-teal-200 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10'
                                    : 'bg-muted/30'
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() =>
                                    toggleSpecialAction(section.key, action.key)
                                  }
                                  disabled={disabled || draft.fullAccess}
                                />
                                {action.label}
                              </label>
                            )
                          })}
                        </div>
                      )}
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
        title="Clear all menus & permissions?"
        message="This wipes every menu and permission checkbox for this role back to unchecked. It only affects the unsaved draft — you can still Cancel out of the page — but any hand-tuned selections made so far will be lost."
        confirmLabel="Clear All"
        onConfirm={() => {
          handleClearAll()
          setConfirmingClear(false)
        }}
      />

      <ConfirmDialog
        open={!!pendingInheritRoleId}
        onOpenChange={(open) => !open && setPendingInheritRoleId(null)}
        title={`Inherit permissions from "${pendingInheritRole?.name ?? ''}"?`}
        message="This replaces every menu and permission selection made so far in this draft with the picked role's configuration. Any hand-tuned changes not yet saved will be overwritten."
        confirmLabel="Inherit"
        onConfirm={() => {
          if (pendingInheritRoleId) applyInherit(pendingInheritRoleId)
          setPendingInheritRoleId(null)
        }}
      />
    </div>
  )
}
