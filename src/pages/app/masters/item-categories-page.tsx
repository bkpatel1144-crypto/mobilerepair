import { useState } from 'react'
import { FolderTree, FolderClosed, Plus, Pencil, Trash2, Ban, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useItemCategories,
  useCreateItemCategory,
  useUpdateItemCategory,
  useSetItemCategoryStatus,
  useDeleteItemCategory,
  categoryLevel,
  type ItemCategoryWithId,
} from '@/hooks/use-item-categories'
import { useItems } from '@/hooks/use-items'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey } from '@/config/permission-schema'

export function ItemCategoriesPage() {
  const { data: categories = [], isLoading } = useItemCategories()
  const { data: items = [] } = useItems()
  const { canDo } = usePermissions()
  const canManage = canDo(crudKey('masters', 'itemCategories', 'update'))

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ItemCategoryWithId | 'new' | null>(null)
  const [viewing, setViewing] = useState<ItemCategoryWithId | null>(null)

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  function itemCountFor(cat: ItemCategoryWithId) {
    return items.filter((i) => i.categoryId === cat.id).length
  }
  function subCategoryCountFor(cat: ItemCategoryWithId) {
    return categories.filter((c) => c.parentId === cat.id).length
  }

  const columns: DataTableColumn<ItemCategoryWithId>[] = [
    {
      key: 'name',
      header: 'Category',
      sortValue: (c) => c.name,
      render: (c) => {
        const { level, parentName } = categoryLevel(c, categories)
        return (
          <div>
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.code}{level === 'Sub' && parentName ? ` · Under: ${parentName}` : ''}</p>
          </div>
        )
      },
    },
    {
      key: 'type',
      header: 'Type',
      hideOnMobile: true,
      render: (c) => (
        <span
          className={
            'rounded-full px-2 py-0.5 text-xs font-medium ' +
            (c.type === 'Service'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400')
          }
        >
          {c.type}
        </span>
      ),
    },
    { key: 'level', header: 'Level', hideOnMobile: true, render: (c) => categoryLevel(c, categories).level },
    { key: 'items', header: 'Items', render: (c) => itemCountFor(c) },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={FolderTree}
        title="Item Categories"
        subtitle="Organise items into categories and sub-categories"
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              Add Category
            </Button>
          )
        }
      />

      <StatCard label="Total" value={categories.length} icon={FolderTree} className="sm:max-w-48" />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search categories..." />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={FolderTree} title="No item categories yet" description="Add your first category above." />}
      />

      {editing && <ItemCategoryModal editing={editing} existing={categories} onClose={() => setEditing(null)} />}

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={FolderClosed}
          title={viewing.name}
          subtitle={viewing.code}
          badges={
            <>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                {viewing.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              {viewing.source === 'system' && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">System</span>
              )}
            </>
          }
          actions={
            canManage && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(viewing); setViewing(null) }}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <ItemCategoryStatusButton category={viewing} />
                {viewing.source === 'custom' && (
                  <ItemCategoryDeleteButton
                    category={viewing}
                    itemCount={itemCountFor(viewing)}
                    subCategoryCount={subCategoryCountFor(viewing)}
                    onDeleted={() => setViewing(null)}
                  />
                )}
              </>
            )
          }
          sections={[
            {
              title: 'DETAILS',
              rows: [
                { label: 'Type', value: viewing.type },
                { label: 'Level', value: categoryLevel(viewing, categories).level },
                { label: 'Path', value: viewing.code },
              ],
            },
            {
              title: 'STATISTICS',
              children: (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xl font-bold">{itemCountFor(viewing)}</p>
                    <p className="text-xs text-muted-foreground">Items</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xl font-bold">{subCategoryCountFor(viewing)}</p>
                    <p className="text-xs text-muted-foreground">Sub-Categories</p>
                  </div>
                </div>
              ),
            },
            ...(viewing.description
              ? [{ title: 'DESCRIPTION', children: <p className="text-sm text-muted-foreground">{viewing.description}</p> }]
              : []),
          ]}
        />
      )}
    </div>
  )
}

function ItemCategoryStatusButton({ category }: { category: ItemCategoryWithId }) {
  const setStatus = useSetItemCategoryStatus()
  const [confirming, setConfirming] = useState(false)
  const willDeactivate = category.status === 'active'

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        {willDeactivate ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
        {willDeactivate ? 'Deactivate' : 'Activate'}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${willDeactivate ? 'Deactivate' : 'Activate'} "${category.name}"?`}
        message={
          willDeactivate
            ? 'Deactivated categories no longer appear as a selectable option for new items.'
            : 'This category will become selectable again for new items.'
        }
        confirmLabel={willDeactivate ? 'Deactivate' : 'Activate'}
        destructive={willDeactivate}
        isPending={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(
            { id: category.id, status: willDeactivate ? 'disabled' : 'active', categoryName: category.name },
            { onSuccess: () => setConfirming(false) }
          )
        }
      />
    </>
  )
}

function ItemCategoryDeleteButton({
  category,
  itemCount,
  subCategoryCount,
  onDeleted,
}: {
  category: ItemCategoryWithId
  itemCount: number
  subCategoryCount: number
  onDeleted: () => void
}) {
  const deleteCategory = useDeleteItemCategory()
  const [confirming, setConfirming] = useState(false)
  const hasDependents = itemCount > 0 || subCategoryCount > 0

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
        message={
          hasDependents
            ? `This category still has ${itemCount} item(s) and ${subCategoryCount} sub-categor${subCategoryCount === 1 ? 'y' : 'ies'}. Deleting it will leave them pointing at a category that no longer exists. This cannot be undone.`
            : 'This permanently deletes the category. This cannot be undone.'
        }
        confirmLabel="Delete"
        isPending={deleteCategory.isPending}
        onConfirm={() => deleteCategory.mutate(category, { onSuccess: () => { setConfirming(false); onDeleted() } })}
      />
    </>
  )
}

function ItemCategoryModal({
  editing,
  existing,
  onClose,
}: {
  editing: ItemCategoryWithId | 'new'
  existing: ItemCategoryWithId[]
  onClose: () => void
}) {
  const isNew = editing === 'new'
  const createCategory = useCreateItemCategory()
  const updateCategory = useUpdateItemCategory()

  const [name, setName] = useState(isNew ? '' : editing.name)
  const [type, setType] = useState<'Raw Material' | 'Service'>(isNew ? 'Raw Material' : editing.type)
  const [parentId, setParentId] = useState(isNew ? 'none' : editing.parentId ?? 'none')
  const [description, setDescription] = useState(isNew ? '' : editing.description ?? '')

  const isPending = createCategory.isPending || updateCategory.isPending
  const parentOptions = existing.filter((c) => !c.parentId && (isNew || c.id !== editing.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const input = { name: name.trim(), type, parentId: parentId === 'none' ? null : parentId, description: description.trim() || null }
    if (isNew) await createCategory.mutateAsync(input)
    else await updateCategory.mutateAsync({ ...input, id: editing.id })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Create Item Category' : 'Edit Item Category'}
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Create Category' : 'Save'}
      isSubmitting={isPending}
    >
      <div className="space-y-1.5">
        <Label>Category Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Screens & Displays" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={type} onValueChange={(v) => v && setType(v as typeof type)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Raw Material">Raw Material</SelectItem>
              <SelectItem value="Service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Parent Category</Label>
          <Select value={parentId} onValueChange={(v) => v && setParentId(v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="None (Root)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Root)</SelectItem>
              {parentOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={2} />
      </div>
    </FormModal>
  )
}
