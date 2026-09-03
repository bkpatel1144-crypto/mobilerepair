import { useState } from 'react'
import { Check, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { RouteFallback } from '@/components/shared/route-fallback'
import { useRoles, type RoleWithId } from '@/hooks/use-roles'
import {
  useWorkflowConfig,
  useWorkflowConfigs,
  useSaveWorkflowConfig,
  blankWorkflowConfig,
} from '@/hooks/use-workflow-config'
import { countEnabledActions } from '@/config/workflow-statuses-actions'
import { PermissionsSubtab } from './permissions-subtab'
import { UsersSubtab } from './users-subtab'
import { BehaviorSubtab } from './behavior-subtab'
import { draftFromConfig, draftsEqual, type WorkflowConfigDraft } from './types'
import type { WorkflowConfigDoc } from '@/types/firestore'

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Select a role',
    body: 'Pick a configured role from the dropdown above, or choose an unconfigured one to set it up fresh.',
  },
  {
    step: 2,
    title: 'Set visibility & actions',
    body: 'Control which job statuses this role can see and exactly which actions they’re allowed to take at each step.',
  },
  {
    step: 3,
    title: 'Save & go live',
    body: 'Hit Save Config — changes apply instantly for every user with that role. No restart needed.',
  },
]

export function RolePermissionsTab() {
  const { data: allRoles = [], isLoading: rolesLoading } = useRoles()
  const { data: configuredRoles = [] } = useWorkflowConfigs()
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  if (rolesLoading) return <RouteFallback />

  if (!selectedRoleId) {
    return (
      <div className="space-y-6">
        <Select value="" onValueChange={(v) => v && setSelectedRoleId(v)}>
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue placeholder="Select a role to configure..." />
          </SelectTrigger>
          <SelectContent>
            {allRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div>
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            How it works
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="rounded-lg border bg-muted/20 p-4">
                <span className="mb-2 flex size-6 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                  {item.step}
                </span>
                <p className="mb-1 text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Configured roles
          </p>
          {configuredRoles.length === 0 ? (
            <EmptyState
              title="No roles configured yet"
              description="Pick a role from the dropdown above to set up its statuses and actions."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {configuredRoles.map((config) => {
                const role = allRoles.find((r) => r.id === config.id)
                return (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => setSelectedRoleId(config.id)}
                    className="relative rounded-lg border p-4 text-left transition-colors hover:border-teal-600/50 hover:bg-muted/30"
                  >
                    {role?.type === 'owner' && (
                      <span className="absolute top-3 right-3 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        OWNER
                      </span>
                    )}
                    <span className="mb-2 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-teal-600" />
                      <span className="text-sm font-semibold">{role?.name ?? config.roleName}</span>
                    </span>
                    <span className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>👁 {config.statusFilter.length}</span>
                      <span>⚡ {countEnabledActions(config.statusActionMatrix)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <SelectedRolePanel
      roleId={selectedRoleId}
      allRoles={allRoles}
      onSelectRole={setSelectedRoleId}
      onBack={() => setSelectedRoleId(null)}
    />
  )
}

function SelectedRolePanel({
  roleId,
  allRoles,
  onSelectRole,
  onBack,
}: {
  roleId: string
  allRoles: RoleWithId[]
  onSelectRole: (roleId: string) => void
  onBack: () => void
}) {
  const role = allRoles.find((r) => r.id === roleId)
  const { data: existingConfig, isLoading } = useWorkflowConfig(roleId)
  const saveConfig = useSaveWorkflowConfig()

  const [draft, setDraft] = useState<WorkflowConfigDraft | null>(null)
  const [seededForRoleId, setSeededForRoleId] = useState<string | null>(null)
  const [subtab, setSubtab] = useState<'permissions' | 'users' | 'behavior'>('permissions')

  const baseline: WorkflowConfigDoc | null =
    existingConfig ?? (role ? blankWorkflowConfig(role.id, role.name) : null)

  // Same "adjust state during render" pattern as role-configure-page.tsx — seed once per role
  // (and once the query settles, whichever comes later) rather than in an effect.
  if (!isLoading && baseline && seededForRoleId !== roleId) {
    setSeededForRoleId(roleId)
    setDraft(draftFromConfig(baseline))
  }

  if (isLoading || !draft || !baseline || !role) return <RouteFallback />

  const isDirty = !draftsEqual(draft, draftFromConfig(baseline))
  const enabledActions = countEnabledActions(draft.statusActionMatrix)

  function updateDraft(updater: (prev: WorkflowConfigDraft) => WorkflowConfigDraft) {
    setDraft((prev) => (prev ? updater(prev) : prev))
  }

  async function handleSave() {
    await saveConfig.mutateAsync({
      roleId: role!.id,
      roleName: role!.name,
      ...draft!,
      createdAt: baseline!.createdAt,
      updatedAt: baseline!.updatedAt,
    })
  }

  function handleCancel() {
    setDraft(draftFromConfig(baseline!))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={roleId} onValueChange={(v) => v && onSelectRole(v)}>
          <SelectTrigger className="w-56">
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-teal-600" />
                {role.name}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {allRoles.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>👁 {draft.statusFilter.length} statuses</span>
          <span>·</span>
          <span>⚡ {enabledActions} actions</span>
        </span>
        {role.type === 'owner' && <Crown className="size-4 text-amber-500" />}

        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm">
            <span className={draft.active ? 'text-teal-700 dark:text-teal-400' : 'text-muted-foreground'}>
              {draft.active ? 'Active' : 'Inactive'}
            </span>
            <Switch
              checked={draft.active}
              onCheckedChange={(checked) => updateDraft((prev) => ({ ...prev, active: checked }))}
            />
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>

      <Tabs value={subtab} onValueChange={(v) => setSubtab(v as typeof subtab)}>
        <TabsList>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
        </TabsList>
        <TabsContent value="permissions" className="pt-4">
          <PermissionsSubtab draft={draft} setDraft={updateDraft} disabled={saveConfig.isPending} />
        </TabsContent>
        <TabsContent value="users" className="pt-4">
          <UsersSubtab
            draft={draft}
            setDraft={updateDraft}
            disabled={saveConfig.isPending}
            allRoles={allRoles}
          />
        </TabsContent>
        <TabsContent value="behavior" className="pt-4">
          <BehaviorSubtab draft={draft} setDraft={updateDraft} disabled={saveConfig.isPending} />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t bg-background py-3">
        {isDirty ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            Unsaved changes
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3.5 text-teal-600" />
            All changes saved · Editing "{role.name}"
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={!isDirty || saveConfig.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!isDirty || saveConfig.isPending}>
            {saveConfig.isPending ? 'Saving…' : 'Save Config'}
          </Button>
        </div>
      </div>
    </div>
  )
}
