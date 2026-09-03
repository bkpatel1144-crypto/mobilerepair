import { useState } from 'react'
import { Users, Plus, Star, Pencil, Trash2, FolderClosed } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { formatTimestamp } from '@/lib/utils'
import {
  usePartyCategories,
  useCreatePartyCategory,
  useUpdatePartyCategory,
  useDeletePartyCategory,
  type PartyCategoryWithId,
} from '@/hooks/use-party-categories'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey } from '@/config/permission-schema'

export function PartyCategoriesPage() {
  const { data: categories = [], isLoading } = usePartyCategories()
  const { canDo } = usePermissions()
  const canManage = canDo(crudKey('masters', 'partyCategories', 'update'))

  const [editing, setEditing] = useState<PartyCategoryWithId | 'new' | null>(null)
  const [viewing, setViewing] = useState<PartyCategoryWithId | null>(null)

  const columns: DataTableColumn<PartyCategoryWithId>[] = [
    {
      key: 'name',
      header: 'Category',
      sortValue: (c) => c.name,
      render: (c) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{c.name}</span>
          {c.isDefaultForSupplier && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
              <Star className="size-2.5 fill-current" /> Default Supplier
            </span>
          )}
          {c.isDefaultForCustomer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
              <Star className="size-2.5 fill-current" /> Default Customer
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Default (Customer)',
      hideOnMobile: true,
      render: (c) => <Star className={c.isDefaultForCustomer ? 'size-4 fill-amber-400 text-amber-400' : 'size-4 text-muted-foreground/40'} />,
    },
    {
      key: 'supplier',
      header: 'Default (Supplier)',
      hideOnMobile: true,
      render: (c) => <Star className={c.isDefaultForSupplier ? 'size-4 fill-blue-500 text-blue-500' : 'size-4 text-muted-foreground/40'} />,
    },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status === 'active' ? 'Active' : 'Inactive'} /> },
    { key: 'created', header: 'Created', hideOnMobile: true, render: (c) => formatTimestamp(c.createdAt, false) },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Users}
        title="Party Categories"
        subtitle="Manage all party categories"
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              Add Category
            </Button>
          )
        }
      />

      <StatCard label="Total" value={categories.length} icon={Users} className="sm:max-w-48" />

      <DataTable
        columns={columns}
        data={categories}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={Users} title="No party categories yet" description="Add your first category above." />}
      />

      {editing && <PartyCategoryModal editing={editing} existing={categories} onClose={() => setEditing(null)} />}

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={FolderClosed}
          title={viewing.name}
          subtitle={viewing.code}
          badges={<StatusBadge status={viewing.status === 'active' ? 'Active' : 'Inactive'} />}
          actions={
            canManage && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(viewing); setViewing(null) }}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                {viewing.source === 'custom' && (
                  <DeletePartyCategoryButton
                    category={viewing}
                    onDeleted={() => setViewing(null)}
                  />
                )}
              </>
            )
          }
          sections={[
            {
              title: 'CREDIT INFORMATION',
              rows: [{ label: 'Default Credit Days', value: `${viewing.defaultCreditDays} Days` }],
            },
          ]}
          timeline={[
            { title: 'Created', timestamp: formatTimestamp(viewing.createdAt) },
            { title: 'Updated', timestamp: formatTimestamp(viewing.updatedAt) },
          ]}
        />
      )}
    </div>
  )
}

function DeletePartyCategoryButton({ category, onDeleted }: { category: PartyCategoryWithId; onDeleted: () => void }) {
  const deleteCategory = useDeletePartyCategory()
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete "${category.name}"?`}
        message="Parties already assigned to this category will keep a reference to a category that no longer exists. This cannot be undone."
        confirmLabel="Delete"
        isPending={deleteCategory.isPending}
        onConfirm={() => deleteCategory.mutate(category, { onSuccess: () => { setConfirming(false); onDeleted() } })}
      />
    </>
  )
}

function PartyCategoryModal({
  editing,
  existing,
  onClose,
}: {
  editing: PartyCategoryWithId | 'new'
  existing: PartyCategoryWithId[]
  onClose: () => void
}) {
  const isNew = editing === 'new'
  const createCategory = useCreatePartyCategory(existing)
  const updateCategory = useUpdatePartyCategory(existing)

  const [name, setName] = useState(isNew ? '' : editing.name)
  const [creditDays, setCreditDays] = useState(isNew ? 0 : editing.defaultCreditDays)
  const [isDefaultForCustomer, setIsDefaultForCustomer] = useState(isNew ? false : editing.isDefaultForCustomer)
  const [isDefaultForSupplier, setIsDefaultForSupplier] = useState(isNew ? false : editing.isDefaultForSupplier)

  const isPending = createCategory.isPending || updateCategory.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const input = { name: name.trim(), defaultCreditDays: creditDays, isDefaultForCustomer, isDefaultForSupplier }
    if (isNew) await createCategory.mutateAsync(input)
    else await updateCategory.mutateAsync({ ...input, id: editing.id })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Create New Category' : 'Edit Category'}
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Create Category' : 'Save'}
      isSubmitting={isPending}
    >
      <div className="space-y-1.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name (e.g. Retail Customer)"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">This name will be visible in parties and reports.</p>
      </div>
      <div className="space-y-1.5">
        <Input value={isNew ? 'Auto-generated code' : editing.code} disabled />
        <p className="text-xs text-muted-foreground">Unique system identifier. Auto-generated but editable.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Default Credit Days</Label>
        <Input type="number" min={0} value={creditDays} onChange={(e) => setCreditDays(Number(e.target.value) || 0)} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <Checkbox checked={isDefaultForCustomer} onCheckedChange={(v) => setIsDefaultForCustomer(v === true)} />
          Default for Customer
        </label>
        <label className="flex items-center gap-1.5">
          <Checkbox checked={isDefaultForSupplier} onCheckedChange={(v) => setIsDefaultForSupplier(v === true)} />
          Default for Supplier
        </label>
      </div>
    </FormModal>
  )
}
