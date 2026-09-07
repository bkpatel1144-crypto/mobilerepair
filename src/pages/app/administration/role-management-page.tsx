import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Crown,
  Shield,
  Settings2,
  Plus,
  RefreshCw,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  EyeOff,
  Trash2,
  ListChecks,
  CircleCheck,
  Clock,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatPill, StatPillRow } from '@/components/shared/stat-pill'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { DetailBlock, DetailValue, DetailNote } from '@/components/shared/detail-block'
import { FormModal } from '@/components/shared/form-modal'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  useRoles,
  useRenameRole,
  useSetRoleStatus,
  type RoleWithId,
} from '@/hooks/use-roles'
import { slugifyCode, formatDateTimeLong } from '@/lib/utils'
import { buildPath } from '@/config/nav'


type StatusFilter = 'active' | 'disabled' | 'deleted'

const STATUS_LABEL: Record<StatusFilter, string> = {
  active: 'Active Roles',
  disabled: 'Disabled Roles',
  deleted: 'Deleted Roles',
}

export function RoleManagementPage() {
  const navigate = useNavigate()
  const { data: roles = [], isLoading, error: loadError, refetch } = useRoles()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [selectedRole, setSelectedRole] = useState<RoleWithId | null>(null)
  const [editing, setEditing] = useState<RoleWithId | null>(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ role: RoleWithId; kind: 'disable' | 'enable' | 'delete' } | null>(null)
  const [showOwnerOnly, setShowOwnerOnly] = useState(false)

  const renameRole = useRenameRole()
  const setRoleStatus = useSetRoleStatus()


  const counts = {
    total: roles.length,
    active: roles.filter((r) => r.status === 'active').length,
    disabled: roles.filter((r) => r.status === 'disabled').length,
    deleted: roles.filter((r) => r.status === 'deleted').length,
  }

  const filtered = roles
    .filter((r) => r.status === statusFilter)
    .filter((r) => (showOwnerOnly ? r.type === 'owner' : true))
    .filter((r) => `${r.name} ${r.code}`.toLowerCase().includes(search.toLowerCase()))


  const columns: DataTableColumn<RoleWithId>[] = [
    {
      key: 'name',
      header: 'ROLE NAME',
      sortValue: (r) => r.name,
      render: (r) => (
        <span className="flex items-center gap-2.5">
          {r.type === 'owner' ? (
            <Crown className="size-4 shrink-0 text-amber-500" />
          ) : (
            <Shield className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className={cn('font-semibold', r.type === 'owner' && 'text-amber-700 dark:text-amber-400')}>
            {r.name}
          </span>
        </span>
      ),
    },
    {
      key: 'code',
      header: 'CODE',
      render: (r) => (
        <span
          className={cn(
            'rounded px-1.5 py-0.5 font-mono text-xs',
            r.type === 'owner'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400'
              : 'bg-muted'
          )}
        >
          {r.code}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'TYPE',
      render: (r) =>
        r.type === 'owner' ? (
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-medium text-white">
            Owner
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Custom
          </span>
        ),
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (r) =>
        r.status === 'active' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
            <CircleCheck className="size-3.5" />
            Active
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
            {r.status}
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`View ${r.name}`}
            className="text-teal-600 dark:text-teal-400"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedRole(r)
            }}
          >
            <Eye className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${r.name}`}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => navigate(`${buildPath('administration', 'roles')}/${r.id}/configure`)}
              >
                <ShieldCheck />
                <span className="font-medium text-teal-700 dark:text-teal-400">Configure Role</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setEditing(r)
                  setEditName(r.name)
                  setEditCode(r.code)
                }}
              >
                <Pencil />
                Edit
              </DropdownMenuItem>
              {/* The Owner role is protected in firestore.rules as well as here — it is the only
                * role that can edit itself, so disabling it would lock the shop out of its own
                * permissions with no way back. */}
              {!r.protected && (
                <>
                  <DropdownMenuItem
                    onClick={() =>
                      setConfirmAction({ role: r, kind: r.status === 'active' ? 'disable' : 'enable' })
                    }
                  >
                    <EyeOff />
                    {r.status === 'active' ? 'Disable Role' : 'Enable Role'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setConfirmAction({ role: r, kind: 'delete' })}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        icon={ShieldCheck}
        title="Roles Management"
        subtitle="Manage user roles, permissions, and menu access"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button
              type="button"
              onClick={() => navigate(`${buildPath('administration', 'roles')}/create`)}
            >
              <Plus className="size-4" />
              Add Role
            </Button>
          </>
        }
      />

      <StatPillRow>
        <StatPill label="Total Roles" count={counts.total} />
        <StatPill
          icon={ShieldCheck}
          label="Active Roles"
          count={counts.active}
          tone="success"
          selected={statusFilter === 'active'}
          onClick={() => setStatusFilter('active')}
        />
        <StatPill
          icon={EyeOff}
          label="Disabled Roles"
          count={counts.disabled}
          tone="warning"
          selected={statusFilter === 'disabled'}
          onClick={() => setStatusFilter('disabled')}
        />
        <StatPill
          icon={Trash2}
          label="Deleted Roles"
          count={counts.deleted}
          tone="danger"
          selected={statusFilter === 'deleted'}
          onClick={() => setStatusFilter('deleted')}
        />
      </StatPillRow>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by role name or code..."
          className="h-10 max-w-md flex-1 rounded-full"
        />
        <Button
          type="button"
          variant={showOwnerOnly ? 'secondary' : 'outline'}
          className="h-10"
          aria-pressed={showOwnerOnly}
          onClick={() => setShowOwnerOnly((v) => !v)}
        >
          <Filter className="size-4" />
          Filters
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button type="button" variant="outline" className="h-10" />}>
            <MoreVertical className="size-4" />
            More Actions
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              <ListChecks />
              Show active roles
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void refetch()}>
              <RefreshCw />
              Reload from server
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Viewing:</span>
        <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium">
          {STATUS_LABEL[statusFilter]} ({filtered.length})
        </span>
      </p>

      <DataTable
        columns={columns}
        rowClassName={(r) =>
          r.type === 'owner'
            ? 'bg-amber-50/70 border-l-4 border-l-amber-400 dark:bg-amber-500/10'
            : undefined
        }
        data={filtered}
        rowKey={(r) => r.id}
        onRowClick={setSelectedRole}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
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
        title="Role Details"
        pinHeader
        header={
          selectedRole && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Role Details</h2>
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-14 shrink-0 items-center justify-center rounded-2xl text-white',
                    selectedRole.type === 'owner' ? 'bg-amber-500' : 'bg-purple-500'
                  )}
                >
                  {selectedRole.type === 'owner' ? (
                    <Crown className="size-7" />
                  ) : (
                    <Shield className="size-7" />
                  )}
                </span>
                <div className="min-w-0 space-y-2">
                  <p className="truncate text-xl font-bold">{selectedRole.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                      {selectedRole.code}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {selectedRole.type === 'owner' ? 'Owner' : 'Custom'}
                    </span>
                  </div>
                  {selectedRole.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                      <CircleCheck className="size-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
                      {selectedRole.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        }
        actions={
          selectedRole && (
            <>
              <Button
                variant="outline"
                className="border-teal-500 text-teal-700 dark:text-teal-400"
                onClick={() =>
                  navigate(`${buildPath('administration', 'roles')}/${selectedRole.id}/configure`)
                }
              >
                <Settings2 />
                Configure
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(selectedRole)
                  setEditName(selectedRole.name)
                  setEditCode(selectedRole.code)
                }}
              >
                <Pencil />
                Edit
              </Button>
              {/* Same guard as the row kebab: the Owner role can't be disabled or deleted, since
                * it is the only role that can restore permissions once they are gone. */}
              {!selectedRole.protected && (
                <>
                  <Button
                    variant="outline"
                    className="border-amber-400 text-amber-700 dark:text-amber-400"
                    onClick={() =>
                      setConfirmAction({
                        role: selectedRole,
                        kind: selectedRole.status === 'active' ? 'disable' : 'enable',
                      })
                    }
                  >
                    <EyeOff />
                    {selectedRole.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmAction({ role: selectedRole, kind: 'delete' })}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </>
              )}
            </>
          )
        }
      >
        {selectedRole && (
          <>
            <DetailBlock
              icon={selectedRole.type === 'owner' ? Crown : Shield}
              title="Role Information"
              tone={selectedRole.type === 'owner' ? 'amber' : 'purple'}
            >
              <DetailValue label="Role Name" value={selectedRole.name} divider />
              <DetailValue
                label="Role Code"
                value={
                  <span className="inline-block rounded-md border bg-background px-2 py-1 font-mono text-sm">
                    {selectedRole.code}
                  </span>
                }
                divider
              />
              <DetailValue
                label="Role Type"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    {selectedRole.type === 'owner' ? (
                      <Crown className="size-4 text-amber-500" />
                    ) : (
                      <Shield className="size-4 text-purple-500" />
                    )}
                    {selectedRole.type === 'owner' ? 'Owner Role' : 'Custom Role'}
                  </span>
                }
              />
            </DetailBlock>

            <DetailBlock icon={Clock} title="Timeline" tone="blue">
              <DetailValue
                label="Created"
                value={formatDateTimeLong(selectedRole.createdAt)}
                divider
              />
              <DetailValue label="Last Updated" value={formatDateTimeLong(selectedRole.updatedAt)} />
            </DetailBlock>

            {selectedRole.protected && (
              <DetailNote icon={Crown} title="Owner Role" tone="amber">
                This role has full access by definition and can only be managed by another Owner,
                so it can't be disabled or deleted.
              </DetailNote>
            )}
          </>
        )}
      </DetailDrawer>

      <FormModal
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Edit Role"
        description="Rename this role or change its code. Permissions are edited in Configure."
        submitLabel={renameRole.isPending ? 'Saving…' : 'Save Changes'}
        isSubmitting={renameRole.isPending}
        onSubmit={async () => {
          if (!editing || !editName.trim()) return
          await renameRole.mutateAsync({
            roleId: editing.id,
            name: editName,
            code: editCode || slugifyCode(editName),
          })
          setEditing(null)
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="edit-role-name">
            Role Name <span className="text-red-600">*</span>
          </Label>
          <Input
            id="edit-role-name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. SalesManager"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-role-code">
            Role Code <span className="text-red-600">*</span>
          </Label>
          <Input
            id="edit-role-code"
            value={editCode}
            onChange={(e) => setEditCode(e.target.value.toUpperCase())}
            placeholder="e.g. SALES_MANAGER"
          />
          <p className="text-xs text-muted-foreground">Unique identifier (auto-generated from name)</p>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.kind === 'delete'
            ? 'Delete this role?'
            : confirmAction?.kind === 'disable'
              ? 'Disable this role?'
              : 'Enable this role?'
        }
        message={
          confirmAction
            ? confirmAction.kind === 'delete'
              ? `"${confirmAction.role.name}" is removed from the list. Anyone still holding it keeps the role on their profile but gains nothing from it — reassign those users first.`
              : confirmAction.kind === 'disable'
                ? `"${confirmAction.role.name}" keeps its permissions and its users but stops granting anything. Enabling it later restores exactly what is there now.`
                : `"${confirmAction.role.name}" starts granting its permissions again.`
            : ''
        }
        confirmLabel={
          confirmAction?.kind === 'delete' ? 'Delete' : confirmAction?.kind === 'disable' ? 'Disable' : 'Enable'
        }
        destructive={confirmAction?.kind !== 'enable'}
        isPending={setRoleStatus.isPending}
        onConfirm={async () => {
          if (!confirmAction) return
          await setRoleStatus.mutateAsync({
            role: confirmAction.role,
            status:
              confirmAction.kind === 'delete'
                ? 'deleted'
                : confirmAction.kind === 'disable'
                  ? 'disabled'
                  : 'active',
          })
          setConfirmAction(null)
        }}
      />

    </div>
  )
}
