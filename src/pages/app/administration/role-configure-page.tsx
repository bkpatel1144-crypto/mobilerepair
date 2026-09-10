import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Crown, ShieldCheck, LayoutGrid, KeyRound, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/shared/status-badge'
import { RouteFallback } from '@/components/shared/route-fallback'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { useRole, useRoles, useUpdateRole } from '@/hooks/use-roles'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/hooks/use-auth'
import { MenusPermissionsTab } from './role-configure/menus-permissions-tab'
import { DashboardLandingTab } from './role-configure/dashboard-landing-tab'
import type { RoleDraft } from './role-configure/types'
import { ALL_PERMISSION_KEYS } from '@/config/permission-catalogue'
import { TOTAL_MENU_COUNT, countMenus } from '@/config/menu-count'
import { normalizeVisibleWidgets, widgetIsOn } from '@/config/dashboard-widgets-legacy'
import { DASHBOARD_WIDGETS } from '@/config/dashboard-widgets'
import { useBreadcrumbExtra } from '@/contexts/breadcrumb-context'
import { useTranslation } from 'react-i18next'

const ALL_ACTION_KEYS = ALL_PERMISSION_KEYS

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
      // Translated on load, so a role saved before the catalogue was rebuilt does not open with
      // every widget unticked — and so the next save rewrites it in the current keys.
      visibleWidgets: normalizeVisibleWidgets(role.dashboardConfig.visibleWidgets),
    },
  }
}

function draftsEqual(a: RoleDraft, b: RoleDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function RoleConfigurePage() {
  const { t } = useTranslation()
  const { roleId } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const { data: role, isLoading, error: loadError, refetch } = useRole(roleId)
  useBreadcrumbExtra(role?.name ?? null)
  const { data: allRoles = [] } = useRoles()
  const { isOwner } = usePermissions()
  const { profile } = useAuth()
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

  if (loadError) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState
          error={loadError}
          onRetry={() => void refetch()}
          title={t('pages.administration.roleConfigure.couldnTLoadThisRole')}
        />
      </div>
    )
  }

  if (isLoading || !draft || !role) return <RouteFallback />

  // Only another Owner (fullAccess) may edit the protected Owner role — matches
  // firestore.rules' own check, surfaced here so the UI doesn't invite an edit the backend
  // will just reject.
  const canEdit = !role.protected || isOwner
  const isDirty = !draftsEqual(draft, draftFromRole(role))

  // Leaves plus the modules they imply, matching how the reference export counts a role's
  // menus — see `menu-count.ts`.
  const checkedMenus = countMenus(draft.menuPermissions)
  const checkedPermissions = ALL_ACTION_KEYS.filter((k) => draft.actionPermissions[k]).length
  // Every catalogue widget the role has on, built or not — the same number the Dashboard &
  // Landing tab's own "34 / 34" counter shows. Counting only the built ones made the footer
  // disagree with the tab directly above it. A key left behind by a rename is still excluded,
  // because the count runs over the catalogue rather than over the stored map.
  const checkedWidgets = DASHBOARD_WIDGETS.filter((w) =>
    widgetIsOn(draft.dashboardConfig.visibleWidgets, w.key)
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
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{role.code}</span>
          {role.protected && <StatusBadge status={t('common.system')} tone="neutral" />}

          {/* Who is doing the editing, matching the reference. On a screen that hands out
           * permissions it is worth being explicit about whose account is making the change —
           * the audit entry records the same name. */}
          {profile && (
            <span className="ml-auto flex items-center gap-2 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserIcon className="size-3.5 text-muted-foreground" />
              </span>
              <span className="max-w-40 truncate font-medium">{profile.fullName}</span>
            </span>
          )}
        </div>

        {!canEdit && (
          <EmptyState
            icon={ShieldCheck}
            title={t('pages.administration.roleConfigure.onlyAnotherOwnerCanEditThe')}
            description={t('pages.administration.roleConfigure.thisRoleHasFullAccessBy')}
          />
        )}

        {role.protected && canEdit && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
            {t('pages.administration.roleConfigure.thisIsTheOwnerRoleRemoving')}
          </p>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'menus' | 'dashboard')}>
          <TabsList>
            <TabsTrigger value="menus">
              {t('pages.administration.roleConfigure.menusPermissions')}
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              {t('pages.administration.roleConfigure.dashboardLanding')}
            </TabsTrigger>
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
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <LayoutGrid className="size-3.5" />
              {checkedMenus}/{TOTAL_MENU_COUNT} menus
            </span>
            <span className="text-border">|</span>
            <span className="inline-flex items-center gap-1">
              <KeyRound className="size-3.5" />
              {checkedPermissions}/{ALL_ACTION_KEYS.length} permissions
            </span>
            <span className="text-border">|</span>
            <span className="inline-flex items-center gap-1">
              <LayoutGrid className="size-3.5" />
              {checkedWidgets} widgets
            </span>
          </span>
          {isDirty && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              {t('common.unsavedChanges')}
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
              {updateRole.isPending ? 'Saving…' : t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
