import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Crown, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/status-badge'
import { RouteFallback } from '@/components/shared/route-fallback'
import { EmptyState } from '@/components/shared/empty-state'
import { useRole, useRoles, useUpdateRole } from '@/hooks/use-roles'
import { usePermissions } from '@/hooks/use-permissions'
import { MenusPermissionsTab } from './role-configure/menus-permissions-tab'
import { DashboardLandingTab } from './role-configure/dashboard-landing-tab'
import type { RoleDraft } from './role-configure/types'
import { NAV_SECTIONS, menuKey } from '@/config/nav'
import { PERMISSION_SCHEMA, allKeysForModule } from '@/config/permission-schema'
import { DASHBOARD_WIDGETS } from '@/config/dashboard-widgets'
import { useBreadcrumbExtra } from '@/contexts/breadcrumb-context'

const ALL_LEAF_KEYS = NAV_SECTIONS.flatMap((s) =>
  s.children.filter((l) => !l.locked).map((l) => menuKey(s.key, l.slug))
)
const ALL_ACTION_KEYS = PERMISSION_SCHEMA.flatMap(allKeysForModule)

function draftFromRole(role: {
  fullAccess: boolean
  menuPermissions: Record<string, boolean>
  actionPermissions: Record<string, boolean>
  dashboardConfig: RoleDraft['dashboardConfig']
}): RoleDraft {
  return {
    fullAccess: role.fullAccess,
    menuPermissions: { ...role.menuPermissions },
    actionPermissions: { ...role.actionPermissions },
    dashboardConfig: {
      defaultLandingRoute: role.dashboardConfig.defaultLandingRoute,
      visibleWidgets: { ...role.dashboardConfig.visibleWidgets },
    },
  }
}

function draftsEqual(a: RoleDraft, b: RoleDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function RoleConfigurePage() {
  const { roleId } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const { data: role, isLoading } = useRole(roleId)
  useBreadcrumbExtra(role?.name ?? null)
  const { data: allRoles = [] } = useRoles()
  const { isOwner } = usePermissions()
  const updateRole = useUpdateRole()

  const [draft, setDraft] = useState<RoleDraft | null>(null)
  const [seededForRoleId, setSeededForRoleId] = useState<string | null>(null)
  const [tab, setTab] = useState<'menus' | 'dashboard'>('menus')

  // Seed the draft once per role, the moment it first loads (or `roleId` changes) —
  // "adjusting state during rendering" (react.dev) rather than an effect, so it can't cascade
  // into re-seeding on every background refetch (e.g. another tab's Save) and silently discard
  // in-progress edits.
  if (role && seededForRoleId !== role.id) {
    setSeededForRoleId(role.id)
    setDraft(draftFromRole(role))
  }

  if (isLoading || !draft || !role) return <RouteFallback />

  // Only another Owner (fullAccess) may edit the protected Owner role — matches
  // firestore.rules' own check, surfaced here so the UI doesn't invite an edit the backend
  // will just reject.
  const canEdit = !role.protected || isOwner
  const isDirty = !draftsEqual(draft, draftFromRole(role))

  const checkedMenus = ALL_LEAF_KEYS.filter((k) => draft.menuPermissions[k]).length
  const checkedPermissions = ALL_ACTION_KEYS.filter((k) => draft.actionPermissions[k]).length
  const checkedWidgets = DASHBOARD_WIDGETS.filter(
    (w) => draft.dashboardConfig.visibleWidgets[w.key]
  ).length

  function handleCancel() {
    setDraft(draftFromRole(role!))
  }

  async function handleSave() {
    await updateRole.mutateAsync({
      roleId: roleId!,
      roleName: role!.name,
      fullAccess: draft!.fullAccess,
      menuPermissions: draft!.menuPermissions,
      actionPermissions: draft!.actionPermissions,
      dashboardConfig: draft!.dashboardConfig,
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft />
            Back
          </Button>
          {role.type === 'owner' ? (
            <Crown className="size-5 text-amber-500" />
          ) : (
            <ShieldCheck className="size-5 text-teal-600" />
          )}
          <h1 className="text-lg font-bold">{role.name}</h1>
          <StatusBadge
            status={role.type === 'owner' ? 'Owner' : 'Custom'}
            tone={role.type === 'owner' ? 'warning' : 'neutral'}
          />
          {role.protected && <StatusBadge status="System" tone="neutral" />}
        </div>

        {!canEdit && (
          <EmptyState
            icon={ShieldCheck}
            title="Only another Owner can edit the Owner role"
            description="This role has full access by definition and can only be managed by a user who also has full access."
          />
        )}

        {role.protected && canEdit && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
            This is the Owner role. Removing full access here could lock every Owner out of
            administrative features — change it only if you're certain.
          </p>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'menus' | 'dashboard')}>
          <TabsList>
            <TabsTrigger value="menus">Menus & Permissions</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard & Landing</TabsTrigger>
          </TabsList>
          <TabsContent value="menus" className="pt-4">
            <MenusPermissionsTab
              draft={draft}
              setDraft={(updater) => setDraft((prev) => (prev ? updater(prev) : prev))}
              otherRoles={allRoles.filter((r) => r.id !== roleId)}
              disabled={!canEdit}
            />
          </TabsContent>
          <TabsContent value="dashboard" className="pt-4">
            <DashboardLandingTab
              draft={draft}
              setDraft={(updater) => setDraft((prev) => (prev ? updater(prev) : prev))}
              disabled={!canEdit}
            />
          </TabsContent>
        </Tabs>
      </div>

      {canEdit && (
        <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-3 border-t bg-background p-3 sm:px-6">
          <span className="text-xs text-muted-foreground">
            ⊞ {checkedMenus}/{ALL_LEAF_KEYS.length} menus · ⚿ {checkedPermissions}/
            {ALL_ACTION_KEYS.length} permissions · {checkedWidgets} widgets
          </span>
          {isDirty && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              Unsaved changes
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={!isDirty || updateRole.isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!isDirty || updateRole.isPending}>
              {updateRole.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
