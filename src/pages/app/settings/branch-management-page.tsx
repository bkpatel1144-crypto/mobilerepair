import { useState } from 'react'
import { Building2, Crown, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useSetBranchStatus,
  useDeleteBranch,
  type BranchWithId,
} from '@/hooks/use-branches'
import { formatTimestamp } from '@/lib/utils'

/** `preview (14)`/`(15)` — a straightforward list + protected-row + drawer, same shape as every
 * other Masters-style page in this app. The seeded "Main Branch" (`type: 'system'`,
 * `protected: true`) can never be disabled or deleted through this UI, backed server-side by
 * `firestore.rules`' own `resource.data.protected != true` guard. */
export function BranchManagementPage() {
  const { data: branches = [], isLoading } = useBranches()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')
  const [viewing, setViewing] = useState<BranchWithId | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<BranchWithId | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [confirmAction, setConfirmAction] = useState<'toggle' | 'delete' | null>(null)

  const createBranch = useCreateBranch()
  const updateBranch = useUpdateBranch()
  const setStatus = useSetBranchStatus()
  const deleteBranch = useDeleteBranch()

  const filtered = branches
    .filter((b) => statusFilter === 'all' || b.status === statusFilter)
    .filter((b) => (search.trim() ? `${b.name} ${b.code}`.toLowerCase().includes(search.toLowerCase()) : true))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim()) return
    await createBranch.mutateAsync({ name: nameInput.trim() })
    setCreating(false)
    setNameInput('')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || !nameInput.trim()) return
    await updateBranch.mutateAsync({ id: editing.id, name: nameInput.trim() })
    setEditing(null)
    setNameInput('')
  }

  const columns: DataTableColumn<BranchWithId>[] = [
    {
      key: 'name',
      header: 'Branch Name',
      sortValue: (b) => b.name,
      render: (b) => (
        <span className="inline-flex items-center gap-2">
          {b.type === 'system' && <Crown className="size-3.5 text-amber-500" />}
          <span>
            <p className="font-medium">{b.name}</p>
            <p className="text-xs text-muted-foreground">{b.code}</p>
          </span>
          {b.type === 'system' && <StatusBadge status="Main" tone="warning" />}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status === 'active' ? 'Active' : 'Disabled'} dot /> },
    { key: 'type', header: 'Type', hideOnMobile: true, render: (b) => (b.type === 'system' ? 'System' : 'Custom') },
    { key: 'created', header: 'Created', hideOnMobile: true, render: (b) => formatTimestamp(b.createdAt, false) },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Building2}
        title="Branch Management"
        subtitle="Manage organizational branches and locations"
        actions={
          <Button type="button" onClick={() => setCreating(true)}>
            + Create Branch
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        <StatCard label="Total Branches" value={branches.length} icon={Building2} />
        <StatCard
          label="Active"
          value={branches.filter((b) => b.status === 'active').length}
          tone="success"
          selected={statusFilter === 'active'}
          onClick={() => setStatusFilter((f) => (f === 'active' ? 'all' : 'active'))}
        />
        <StatCard
          label="Inactive"
          value={branches.filter((b) => b.status === 'disabled').length}
          tone="warning"
          selected={statusFilter === 'disabled'}
          onClick={() => setStatusFilter((f) => (f === 'disabled' ? 'all' : 'disabled'))}
        />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search branches by name or code..." />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={Building2} title="No branches found" />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={viewing.type === 'system' ? Crown : Building2}
          title={viewing.name}
          subtitle={`Code: ${viewing.code}`}
          badges={
            <>
              <StatusBadge status={viewing.status === 'active' ? 'Active' : 'Disabled'} dot />
              {viewing.type === 'system' && <StatusBadge status="System" tone="purple" />}
            </>
          }
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNameInput(viewing.name)
                  setEditing(viewing)
                }}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction('toggle')}
                disabled={viewing.type === 'system'}
              >
                {viewing.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
              {!viewing.protected && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-600"
                  onClick={() => setConfirmAction('delete')}
                >
                  Delete
                </Button>
              )}
            </>
          }
          sections={[
            {
              title: 'BRANCH INFORMATION',
              rows: [
                { label: 'Name', value: viewing.name },
                { label: 'Branch Code', value: viewing.code },
              ],
            },
            {
              title: 'STATUS & TYPE',
              rows: [
                { label: 'Current Status', value: viewing.status === 'active' ? 'Active' : 'Disabled', tone: viewing.status === 'active' ? 'success' : 'warning' },
                { label: 'Branch Type', value: viewing.type === 'system' ? 'System Branch' : 'Custom Branch', tone: viewing.type === 'system' ? 'purple' : 'default' },
              ],
            },
            ...(viewing.protected
              ? [{ title: '', children: <p className="text-xs text-muted-foreground">Protected system branch — cannot be deleted.</p> }]
              : []),
          ]}
          timeline={[
            { title: 'Created', timestamp: formatTimestamp(viewing.createdAt) },
            { title: 'Last Updated', timestamp: formatTimestamp(viewing.updatedAt) },
          ]}
        />
      )}

      <FormModal
        open={creating}
        onOpenChange={(o) => {
          setCreating(o)
          if (!o) setNameInput('')
        }}
        title="Create New Branch"
        description="Add a new branch to your organization"
        onSubmit={handleCreate}
        submitLabel="Create Branch"
        isSubmitting={createBranch.isPending}
      >
        <div className="space-y-1.5">
          <Label>Branch Name</Label>
          <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Enter branch name" autoFocus />
          <p className="text-xs text-muted-foreground">A unique branch code will be auto-generated from the name.</p>
        </div>
      </FormModal>

      <FormModal
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setNameInput('')
          }
        }}
        title="Edit Branch"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        isSubmitting={updateBranch.isPending}
      >
        <div className="space-y-1.5">
          <Label>Branch Name</Label>
          <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} autoFocus />
        </div>
      </FormModal>

      {viewing && confirmAction && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setConfirmAction(null)}
          title={
            confirmAction === 'delete'
              ? `Delete "${viewing.name}"?`
              : `${viewing.status === 'active' ? 'Deactivate' : 'Activate'} "${viewing.name}"?`
          }
          message={
            confirmAction === 'delete'
              ? 'This permanently deletes the branch. This cannot be undone.'
              : viewing.status === 'active'
                ? 'Deactivated branches no longer appear as a selectable option for new job cards or transactions.'
                : 'This branch will become selectable again.'
          }
          confirmLabel={confirmAction === 'delete' ? 'Delete' : viewing.status === 'active' ? 'Deactivate' : 'Activate'}
          destructive={confirmAction === 'delete' || viewing.status === 'active'}
          isPending={confirmAction === 'delete' ? deleteBranch.isPending : setStatus.isPending}
          onConfirm={() => {
            if (confirmAction === 'delete') {
              deleteBranch.mutate(viewing, { onSuccess: () => { setConfirmAction(null); setViewing(null) } })
            } else {
              setStatus.mutate(
                { id: viewing.id, status: viewing.status === 'active' ? 'disabled' : 'active', branchName: viewing.name },
                { onSuccess: () => { setConfirmAction(null); setViewing(null) } }
              )
            }
          }}
        />
      )}
    </div>
  )
}
