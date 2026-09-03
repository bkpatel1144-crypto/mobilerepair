import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserPlus, Phone, Mail, Ban, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { useUsers, useSetUserStatus, type UserWithId } from '@/hooks/use-users'
import { useAuth } from '@/hooks/use-auth'
import { formatTimestamp } from '@/lib/utils'
import { buildPath } from '@/config/nav'

type StatusFilter = 'active' | 'disabled' | 'deleted' | null

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (
    parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase()
}

export function UserManagementPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { data: users = [], isLoading } = useUsers()
  const setStatus = useSetUserStatus()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null)
  const [confirmingToggle, setConfirmingToggle] = useState(false)

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
      header: 'User',
      sortValue: (u) => u.fullName,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
            {getInitials(u.fullName)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium">{u.fullName}</span>
              {u.protected && <StatusBadge status="Protected" tone="warning" />}
            </div>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <StatusBadge status={u.roleName} tone="warning" />,
    },
    { key: 'contact', header: 'Contact', hideOnMobile: true, render: (u) => u.mobile ?? '—' },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'created',
      header: 'Created',
      hideOnMobile: true,
      render: (u) => formatTimestamp(u.createdAt, false),
    },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        icon={Users}
        title="User Management"
        subtitle="Manage system users, roles, and permissions"
        actions={
          <Button onClick={() => navigate(`${buildPath('administration', 'users')}/create`)}>
            <UserPlus />
            Add New User
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <StatCard
          label="Total Users"
          value={counts.total}
          onClick={() => setStatusFilter(null)}
          selected={statusFilter === null}
        />
        <StatCard
          label="Active Users"
          value={counts.active}
          tone="success"
          onClick={() => setStatusFilter('active')}
          selected={statusFilter === 'active'}
        />
        <StatCard
          label="Disabled Users"
          value={counts.disabled}
          tone="warning"
          onClick={() => setStatusFilter('disabled')}
          selected={statusFilter === 'disabled'}
        />
        <StatCard
          label="Deleted Users"
          value={counts.deleted}
          tone="danger"
          onClick={() => setStatusFilter('deleted')}
          selected={statusFilter === 'deleted'}
        />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or mobile..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(u) => u.id}
        onRowClick={setSelectedUser}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try a different search or filter."
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
              {selectedUser.protected && <StatusBadge status="Protected" tone="warning" />}
            </>
          )
        }
        actions={
          selectedUser &&
          !selectedUser.protected &&
          selectedUser.id !== currentUser?.uid &&
          selectedUser.status !== 'deleted' && (
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingToggle(true)}>
              {selectedUser.status === 'active' ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
              {selectedUser.status === 'active' ? 'Disable User' : 'Enable User'}
            </Button>
          )
        }
        sections={
          selectedUser
            ? [
                {
                  title: 'Contact Details',
                  icon: Mail,
                  rows: [
                    { label: 'Email', value: selectedUser.email },
                    { label: 'Mobile', value: selectedUser.mobile ?? '—' },
                  ],
                },
                {
                  title: 'Role & Access',
                  icon: Phone,
                  rows: [{ label: 'Role', value: selectedUser.roleName }],
                },
                {
                  title: 'Timeline',
                  rows: [{ label: 'Created', value: formatTimestamp(selectedUser.createdAt, false) }],
                },
              ]
            : []
        }
      />

      {selectedUser && (
        <ConfirmDialog
          open={confirmingToggle}
          onOpenChange={setConfirmingToggle}
          title={`${selectedUser.status === 'active' ? 'Disable' : 'Enable'} "${selectedUser.fullName}"?`}
          message={
            selectedUser.status === 'active'
              ? 'This immediately signs them out and blocks every future sign-in until re-enabled — including a session already in progress.'
              : 'This restores their ability to sign in.'
          }
          confirmLabel={selectedUser.status === 'active' ? 'Disable User' : 'Enable User'}
          destructive={selectedUser.status === 'active'}
          isPending={setStatus.isPending}
          onConfirm={() =>
            setStatus.mutate(
              { uid: selectedUser.id, status: selectedUser.status === 'active' ? 'disabled' : 'active', userName: selectedUser.fullName },
              { onSuccess: () => setConfirmingToggle(false) }
            )
          }
        />
      )}
    </div>
  )
}
