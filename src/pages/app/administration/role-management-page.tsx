import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, Crown, Circle, Settings2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { FormModal } from '@/components/shared/form-modal'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useRoles, useCreateRole, type RoleWithId } from '@/hooks/use-roles'
import { slugifyCode, formatTimestamp } from '@/lib/utils'
import { buildPath } from '@/config/nav'

const addRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').max(40),
})
type AddRoleInput = z.infer<typeof addRoleSchema>

type StatusFilter = 'active' | 'disabled' | 'deleted' | null

export function RoleManagementPage() {
  const navigate = useNavigate()
  const { data: roles = [], isLoading } = useRoles()
  const createRole = useCreateRole()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [selectedRole, setSelectedRole] = useState<RoleWithId | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddRoleInput>({ resolver: zodResolver(addRoleSchema) })
  const watchedName = watch('name') ?? ''

  const counts = {
    total: roles.length,
    active: roles.filter((r) => r.status === 'active').length,
    disabled: roles.filter((r) => r.status === 'disabled').length,
    deleted: roles.filter((r) => r.status === 'deleted').length,
  }

  const filtered = roles
    .filter((r) => !statusFilter || r.status === statusFilter)
    .filter((r) => `${r.name} ${r.code}`.toLowerCase().includes(search.toLowerCase()))

  async function onAddRole(data: AddRoleInput) {
    const roleId = await createRole.mutateAsync({ name: data.name, code: slugifyCode(data.name) })
    setAddOpen(false)
    reset()
    // Every new role starts fully locked down — send the creator straight into Configure so
    // the role is never left silently inaccessible-but-existing.
    navigate(`${buildPath('administration', 'roles')}/${roleId}/configure`)
  }

  const columns: DataTableColumn<RoleWithId>[] = [
    {
      key: 'name',
      header: 'Role Name',
      sortValue: (r) => r.name,
      render: (r) => (
        <span className="flex items-center gap-2 font-medium">
          {r.type === 'owner' ? (
            <Crown className="size-4 text-amber-500" />
          ) : (
            <Circle className="size-3 text-muted-foreground/40" />
          )}
          {r.name}
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (r) => (
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{r.code}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => (
        <StatusBadge
          status={r.type === 'owner' ? 'Owner' : 'Custom'}
          tone={r.type === 'owner' ? 'warning' : 'neutral'}
        />
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        icon={ShieldCheck}
        title="Role Management"
        subtitle="Manage user roles, permissions, and menu access"
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Settings2 />
            Add Role
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <StatCard
          label="Total Roles"
          value={counts.total}
          onClick={() => setStatusFilter(null)}
          selected={statusFilter === null}
        />
        <StatCard
          label="Active Roles"
          value={counts.active}
          tone="success"
          onClick={() => setStatusFilter('active')}
          selected={statusFilter === 'active'}
        />
        <StatCard
          label="Disabled Roles"
          value={counts.disabled}
          tone="warning"
          onClick={() => setStatusFilter('disabled')}
          selected={statusFilter === 'disabled'}
        />
        <StatCard
          label="Deleted Roles"
          value={counts.deleted}
          tone="danger"
          onClick={() => setStatusFilter('deleted')}
          selected={statusFilter === 'deleted'}
        />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by role name or code..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        onRowClick={setSelectedRole}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={ShieldCheck}
            title="No roles found"
            description="Try a different search or filter."
          />
        }
      />

      <DetailDrawer
        open={!!selectedRole}
        onOpenChange={(open) => !open && setSelectedRole(null)}
        icon={selectedRole?.type === 'owner' ? Crown : ShieldCheck}
        title={selectedRole?.name}
        badges={
          selectedRole && (
            <>
              <StatusBadge
                status={selectedRole.type === 'owner' ? 'Owner' : 'Custom'}
                tone={selectedRole.type === 'owner' ? 'warning' : 'neutral'}
              />
              <StatusBadge status={selectedRole.status} />
            </>
          )
        }
        actions={
          selectedRole && (
            <Button
              onClick={() =>
                navigate(`${buildPath('administration', 'roles')}/${selectedRole.id}/configure`)
              }
            >
              <Settings2 />
              Configure
            </Button>
          )
        }
        sections={
          selectedRole
            ? [
                {
                  title: 'Role Information',
                  icon: ShieldCheck,
                  rows: [
                    { label: 'Role Name', value: selectedRole.name },
                    { label: 'Role Code', value: selectedRole.code },
                    {
                      label: 'Role Type',
                      value: selectedRole.type === 'owner' ? 'Owner Role' : 'Custom Role',
                    },
                  ],
                },
                ...(selectedRole.protected
                  ? [
                      {
                        title: 'Owner Role',
                        children: (
                          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                            This is the Owner role. It has full access and can only be managed by
                            another Owner.
                          </p>
                        ),
                      },
                    ]
                  : []),
                {
                  title: 'Timeline',
                  rows: [
                    { label: 'Created', value: formatTimestamp(selectedRole.createdAt) },
                    { label: 'Last Updated', value: formatTimestamp(selectedRole.updatedAt) },
                  ],
                },
              ]
            : []
        }
      />

      <FormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Role"
        description="Create a custom role — it starts with no access until you configure it."
        onSubmit={handleSubmit(onAddRole)}
        submitLabel="Create & Configure"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-1.5">
          <Label htmlFor="roleName">Role Name *</Label>
          <Input
            id="roleName"
            placeholder="e.g. Front Desk"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          {watchedName && (
            <p className="text-xs text-muted-foreground">
              Code: <span className="font-mono">{slugifyCode(watchedName)}</span>
            </p>
          )}
        </div>
      </FormModal>
    </div>
  )
}
