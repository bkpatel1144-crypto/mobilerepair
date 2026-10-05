import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserPlus, Phone, Mail, Ban, CheckCircle2, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { useUsers, useSetUserStatus, useUpdateUser, type UserWithId } from '@/hooks/use-users'
import { useRoles } from '@/hooks/use-roles'
import { FormModal } from '@/components/shared/form-modal'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { formatTimestamp } from '@/lib/utils'
import { buildPath } from '@/config/nav'
import { useTranslation } from 'react-i18next'

type StatusFilter = 'active' | 'disabled' | 'deleted' | null

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (
    parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase()
}

export function UserManagementPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { data: users = [], isLoading, error: loadError, refetch } = useUsers()
  const setStatus = useSetUserStatus()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null)
  const [confirmingToggle, setConfirmingToggle] = useState(false)
  /** The user being edited, held as a draft so cancelling changes nothing. */
  const [editing, setEditing] = useState<UserWithId | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftMobile, setDraftMobile] = useState('')
  const [draftRoleId, setDraftRoleId] = useState('')
  const { data: roles = [] } = useRoles()
  const updateUser = useUpdateUser()

  function openEdit(u: UserWithId) {
    setDraftName(u.fullName)
    setDraftMobile(u.mobile ?? '')
    setDraftRoleId(u.roleId)
    setEditing(u)
  }

  const counts = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    disabled: users.filter((u) => u.status === 'disabled').length,
    deleted: users.filter((u) => u.status === 'deleted').length,
  }

  const filtered = users
    .filter((u) => !statusFilter || u.status === statusFilter)
    .filter((u) =>
      `${u.fullName} ${u.email} ${u.mobile ?? ''}`.toLowerCase().includes(search.toLowerCase())
    )

  const columns: DataTableColumn<UserWithId>[] = [
    {
      key: 'user',
      header: t('common.user'),
      sortValue: (u) => u.fullName,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
            {getInitials(u.fullName)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium">{u.fullName}</span>
              {u.protected && (
                <StatusBadge
                  status={t('pages.administration.userManagement.protected')}
                  tone="warning"
                />
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('common.role'),
      render: (u) => <StatusBadge status={u.roleName} tone="warning" />,
    },
    {
      key: 'contact',
      header: t('shared.contact'),
      hideOnMobile: true,
      render: (u) => u.mobile ?? '—',
    },
    { key: 'status', header: t('common.status'), render: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'created',
      header: t('common.createdAt'),
      hideOnMobile: true,
      render: (u) => formatTimestamp(u.createdAt, false),
    },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        icon={Users}
        title={t('pages.administration.userManagement.userManagement')}
        subtitle={t('pages.administration.userManagement.manageSystemUsersRolesAndPermissions')}
        actions={
          <Button onClick={() => navigate(`${buildPath('administration', 'users')}/create`)}>
            <UserPlus />
            {t('pages.administration.userManagement.addNewUser')}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <StatCard
          label={t('pages.administration.userManagement.totalUsers')}
          value={counts.total}
          onClick={() => setStatusFilter(null)}
          selected={statusFilter === null}
        />
        <StatCard
          label={t('pages.administration.userManagement.activeUsers')}
          value={counts.active}
          tone="success"
          onClick={() => setStatusFilter('active')}
          selected={statusFilter === 'active'}
        />
        <StatCard
          label={t('pages.administration.userManagement.disabledUsers')}
          value={counts.disabled}
          tone="warning"
          onClick={() => setStatusFilter('disabled')}
          selected={statusFilter === 'disabled'}
        />
        <StatCard
          label={t('pages.administration.userManagement.deletedUsers')}
          value={counts.deleted}
          tone="danger"
          onClick={() => setStatusFilter('deleted')}
          selected={statusFilter === 'deleted'}
        />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.administration.userManagement.searchByNameEmailOrMobile')}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(u) => u.id}
        onRowClick={setSelectedUser}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={Users}
            title={t('pages.administration.userManagement.noUsersFound')}
            description={t('common.noResultsHint')}
          />
        }
      />

      <DetailDrawer
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        icon={Users}
        title={selectedUser?.fullName}
        subtitle={selectedUser?.email}
        badges={
          selectedUser && (
            <>
              <StatusBadge status={selectedUser.roleName} tone="warning" />
              <StatusBadge status={selectedUser.status} />
              {selectedUser.protected && (
                <StatusBadge
                  status={t('pages.administration.userManagement.protected')}
                  tone="warning"
                />
              )}
            </>
          )
        }
        actions={
          selectedUser &&
          !selectedUser.protected &&
          selectedUser.id !== currentUser?.uid &&
          selectedUser.status !== 'deleted' && (
            <>
              {/* There was no way to change a teammate at all — not their name, not their
               * mobile, and not their role. The only route from technician to manager was to
               * disable the account and create a second one, which leaves the shop with two
               * rows for one person and the job history on the dead one. */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openEdit(selectedUser)}
              >
                <Pencil className="size-3.5" />
                {t('pages.administration.userManagement.editUser')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmingToggle(true)}
              >
                {selectedUser.status === 'active' ? (
                  <Ban className="size-3.5" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                {selectedUser.status === 'active'
                  ? t('pages.administration.userManagement.disableUser')
                  : t('pages.administration.userManagement.enableUser')}
              </Button>
            </>
          )
        }
        sections={
          selectedUser
            ? [
                {
                  title: t('pages.administration.userManagement.contactDetails'),
                  icon: Mail,
                  rows: [
                    { label: t('common.email'), value: selectedUser.email },
                    { label: t('common.mobile'), value: selectedUser.mobile ?? '—' },
                  ],
                },
                {
                  title: t('pages.administration.userManagement.roleAccess'),
                  icon: Phone,
                  rows: [{ label: t('common.role'), value: selectedUser.roleName }],
                },
                {
                  title: t('common.timeline'),
                  rows: [
                    {
                      label: t('common.createdAt'),
                      value: formatTimestamp(selectedUser.createdAt, false),
                    },
                  ],
                },
              ]
            : []
        }
      />

      {selectedUser && (
        <ConfirmDialog
          open={confirmingToggle}
          onOpenChange={setConfirmingToggle}
          title={`${
            selectedUser.status === 'active'
              ? t('pages.administration.userManagement.disable')
              : t('common.enable')
          } "${selectedUser.fullName}"?`}
          message={
            selectedUser.status === 'active'
              ? t('pages.administration.userManagement.disableWarning')
              : t('pages.administration.userManagement.thisRestoresTheirAbilityToSign')
          }
          confirmLabel={
            selectedUser.status === 'active'
              ? t('pages.administration.userManagement.disableUser')
              : t('pages.administration.userManagement.enableUser')
          }
          destructive={selectedUser.status === 'active'}
          isPending={setStatus.isPending}
          onConfirm={() =>
            setStatus.mutate(
              {
                uid: selectedUser.id,
                status: selectedUser.status === 'active' ? 'disabled' : 'active',
                userName: selectedUser.fullName,
              },
              { onSuccess: () => setConfirmingToggle(false) }
            )
          }
        />
      )}

      <FormModal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title={t('pages.administration.userManagement.editUser')}
        submitLabel={t('common.save')}
        isSubmitting={updateUser.isPending}
        error={updateUser.error ? updateUser.error.message : null}
        onSubmit={async (e) => {
          e.preventDefault()
          if (!editing || !draftName.trim()) return
          const role = roles.find((r) => r.id === draftRoleId)
          if (!role) return
          try {
            await updateUser.mutateAsync({
              uid: editing.id,
              fullName: draftName.trim(),
              mobile: draftMobile.trim() || null,
              roleId: role.id,
              roleName: role.name,
              previousRoleName: editing.roleName,
            })
          } catch {
            return // the modal stays open and shows what went wrong
          }
          setSelectedUser(null)
          setEditing(null)
        }}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-name">{t('shared.fullName')}</Label>
            <Input
              id="edit-user-name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-mobile">{t('common.mobile')}</Label>
            <Input
              id="edit-user-mobile"
              inputMode="tel"
              value={draftMobile}
              onChange={(e) => setDraftMobile(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('common.role')}</Label>
            <Select value={draftRoleId} onValueChange={(v) => v && setDraftRoleId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Email is the Firebase Auth identity. Changing it here would rename the Firestore
           * row and leave the sign-in untouched — a user who looks renamed and still logs in as
           * the old address. That needs an Auth-side flow this app has no server for. */}
          <p className="text-xs text-muted-foreground">
            {t('pages.administration.userManagement.emailCannotChange')}
          </p>
        </div>
      </FormModal>
    </div>
  )
}
