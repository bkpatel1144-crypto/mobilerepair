import { useState } from 'react'
import { FolderTree, FolderClosed, Plus, Pencil, Trash2, Ban, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { LoadDefaultsButton } from '@/components/shared/load-defaults-button'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { StatusBadge } from '@/components/shared/status-badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { ItemCategoryType } from '@/types/firestore'
import { useTranslation } from 'react-i18next'

/** One tone per category type. Literal class strings — Tailwind extracts these statically, so a
 *  colour assembled from `c.type` at runtime never reaches the stylesheet. */
const CATEGORY_TYPE_STYLE: Record<ItemCategoryType, string> = {
  'Raw Material': 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  'Finished Goods': 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  Consumables: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Service: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
}

/** Every type the export uses, in the order the form offers them. The values themselves are
 *  written to Firestore, so they stay English and are translated only for display — the same
 *  arrangement `TYPE_LABEL` uses on the Item Master. */
const CATEGORY_TYPES: ItemCategoryType[] = [
  'Raw Material',
  'Finished Goods',
  'Consumables',
  'Service',
]

const CATEGORY_TYPE_LABEL: Record<ItemCategoryType, string> = {
  'Raw Material': 'pages.masters.itemCategories.rawMaterial',
  'Finished Goods': 'pages.masters.itemCategories.finishedGoods',
  Consumables: 'pages.masters.itemCategories.consumables',
  Service: 'shared.service',
}

export function ItemCategoriesPage() {
  const { t } = useTranslation()
  const { data: categories = [], isLoading, error: loadError, refetch } = useItemCategories()
  const { data: items = [] } = useItems()
  const { canDo } = usePermissions()
  const canManage = canDo(crudKey('masters', 'itemCategories', 'update'))

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ItemCategoryType>('all')
  const [levelFilter, setLevelFilter] = useState<'all' | 'root' | 'sub'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')
  const [editing, setEditing] = useState<ItemCategoryWithId | 'new' | null>(null)
  const [viewing, setViewing] = useState<ItemCategoryWithId | null>(null)

  const filtered = categories
    .filter((c) => typeFilter === 'all' || c.type === typeFilter)
    .filter((c) => levelFilter === 'all' || (levelFilter === 'root' ? !c.parentId : !!c.parentId))
    .filter((c) => statusFilter === 'all' || c.status === statusFilter)
    // The code too, not just the name: the export's codes are what an item references, so
    // searching "SPARE_" to find every spare-part category has to work.
    .filter((c) =>
      `${c.name} ${c.code} ${c.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
    )

  function itemCountFor(cat: ItemCategoryWithId) {
    return items.filter((i) => i.categoryId === cat.id).length
  }
  function subCategoryCountFor(cat: ItemCategoryWithId) {
    return categories.filter((c) => c.parentId === cat.id).length
  }

  const columns: DataTableColumn<ItemCategoryWithId>[] = [
    {
      key: 'name',
      header: t('common.category'),
      sortValue: (c) => c.name,
      render: (c) => {
        const { level, parentName } = categoryLevel(c, categories)
        return (
          <div>
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">
              {c.code}
              {level === 'Sub' && parentName ? ` · Under: ${parentName}` : ''}
            </p>
          </div>
        )
      },
    },
    {
      key: 'type',
      header: t('common.type'),
      hideOnMobile: true,
      sortValue: (c) => c.type,
      render: (c) => (
        <span
          className={'rounded-full px-2 py-0.5 text-xs font-medium ' + CATEGORY_TYPE_STYLE[c.type]}
        >
          {t(CATEGORY_TYPE_LABEL[c.type])}
        </span>
      ),
    },
    {
      key: 'level',
      header: t('pages.masters.itemCategories.level'),
      hideOnMobile: true,
      render: (c) => categoryLevel(c, categories).level,
    },
    { key: 'items', header: t('common.items'), render: (c) => itemCountFor(c) },
    {
      key: 'subCategories',
      header: t('pages.masters.itemCategories.subCategories'),
      hideOnMobile: true,
      // Counted from the tree rather than read from the export's `stats.subCategoryCount`, which
      // is 0 on every record there — a stored count that nothing updates goes stale the first
      // time someone adds a category.
      sortValue: (c) => categories.filter((x) => x.parentId === c.id).length,
      render: (c) => categories.filter((x) => x.parentId === c.id).length,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (c) => (
        <StatusBadge status={c.status === 'active' ? 'Active' : t('common.inactive')} />
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={FolderTree}
        title={t('pages.masters.itemCategories.itemCategories')}
        subtitle={t('pages.masters.itemCategories.organiseItemsIntoCategoriesAndSub')}
        actions={
          canManage && (
            <>
              <LoadDefaultsButton variant="outline" />
              <Button type="button" onClick={() => setEditing('new')}>
                <Plus className="size-4" />
                {t('shared.addCategory')}
              </Button>
            </>
          )
        }
      />

      <StatCardGrid>
        <StatCard label={t('common.total')} value={categories.length} icon={FolderTree} />
        <StatCard
          label={t('pages.masters.itemCategories.rootCategories')}
          value={categories.filter((c) => !c.parentId).length}
          icon={FolderTree}
          tone="info"
        />
        <StatCard
          label={t('pages.masters.itemCategories.subCategories')}
          value={categories.filter((c) => c.parentId).length}
          icon={FolderTree}
          tone="purple"
        />
        <StatCard
          label={t('common.active')}
          value={categories.filter((c) => c.status === 'active').length}
          icon={CheckCircle2}
          tone="success"
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.masters.itemCategories.searchCategories')}
      >
        <Select
          value={typeFilter}
          onValueChange={(v) => v && setTypeFilter(v as typeof typeFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.allTypes')}</SelectItem>
            {CATEGORY_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(CATEGORY_TYPE_LABEL[value])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={levelFilter}
          onValueChange={(v) => v && setLevelFilter(v as typeof levelFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.masters.itemCategories.allLevels')}</SelectItem>
            <SelectItem value="root">{t('pages.masters.itemCategories.root')}</SelectItem>
            <SelectItem value="sub">{t('pages.masters.itemCategories.sub')}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => v && setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.allStatuses')}</SelectItem>
            <SelectItem value="active">{t('common.active')}</SelectItem>
            <SelectItem value="disabled">{t('common.inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        onRowClick={setViewing}
        emptyState={
          <EmptyState
            icon={FolderTree}
            title={t('pages.masters.itemCategories.noItemCategoriesYet')}
            description={t('shared.addYourFirstCategoryAbove')}
          />
        }
      />

      {editing && (
        <ItemCategoryModal
          editing={editing}
          existing={categories}
          onClose={() => setEditing(null)}
        />
      )}

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
                {viewing.status === 'active' ? 'Active' : t('common.inactive')}
              </span>
              {viewing.source === 'system' && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                  System
                </span>
              )}
            </>
          }
          actions={
            canManage && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(viewing)
                    setViewing(null)
                  }}
                >
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
              title: t('shared.details'),
              rows: [
                { label: t('common.type'), value: viewing.type },
                {
                  label: t('pages.masters.itemCategories.level'),
                  value: categoryLevel(viewing, categories).level,
                },
                { label: t('pages.masters.itemCategories.path'), value: viewing.code },
              ],
            },
            {
              title: t('pages.masters.itemCategories.statistics'),
              children: (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xl font-bold">{itemCountFor(viewing)}</p>
                    <p className="text-xs text-muted-foreground">{t('common.items')}</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xl font-bold">{subCategoryCountFor(viewing)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('pages.masters.itemCategories.subCategories')}
                    </p>
                  </div>
                </div>
              ),
            },
            ...(viewing.description
              ? [
                  {
                    title: t('shared.description'),
                    children: (
                      <p className="text-sm text-muted-foreground">{viewing.description}</p>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  )
}

function ItemCategoryStatusButton({ category }: { category: ItemCategoryWithId }) {
  const { t } = useTranslation()
  const setStatus = useSetItemCategoryStatus()
  const [confirming, setConfirming] = useState(false)
  const willDeactivate = category.status === 'active'

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        {willDeactivate ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
        {willDeactivate ? 'Deactivate' : t('common.activate')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${willDeactivate ? 'Deactivate' : t('common.activate')} "${category.name}"?`}
        message={
          willDeactivate
            ? 'Deactivated categories no longer appear as a selectable option for new items.'
            : t('pages.masters.itemCategories.thisCategoryWillBecomeSelectableAgain')
        }
        confirmLabel={willDeactivate ? 'Deactivate' : t('common.activate')}
        destructive={willDeactivate}
        isPending={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(
            {
              id: category.id,
              status: willDeactivate ? 'disabled' : 'active',
              categoryName: category.name,
            },
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
  const { t } = useTranslation()
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
            : t('pages.masters.itemCategories.thisPermanentlyDeletesTheCategoryThis')
        }
        confirmLabel={t('common.delete')}
        isPending={deleteCategory.isPending}
        onConfirm={() =>
          deleteCategory.mutate(category, {
            onSuccess: () => {
              setConfirming(false)
              onDeleted()
            },
          })
        }
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
  const { t } = useTranslation()
  const isNew = editing === 'new'
  const createCategory = useCreateItemCategory()
  const updateCategory = useUpdateItemCategory()

  const [name, setName] = useState(isNew ? '' : editing.name)
  const [type, setType] = useState<ItemCategoryType>(isNew ? 'Raw Material' : editing.type)
  const [parentId, setParentId] = useState(isNew ? 'none' : (editing.parentId ?? 'none'))
  const [description, setDescription] = useState(isNew ? '' : (editing.description ?? ''))

  const isPending = createCategory.isPending || updateCategory.isPending
  const parentOptions = existing.filter((c) => !c.parentId && (isNew || c.id !== editing.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const input = {
      name: name.trim(),
      type,
      parentId: parentId === 'none' ? null : parentId,
      description: description.trim() || null,
    }
    if (isNew) await createCategory.mutateAsync(input)
    else await updateCategory.mutateAsync({ ...input, id: editing.id })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Create Item Category' : t('pages.masters.itemCategories.editItemCategory')}
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Create Category' : t('common.save')}
      isSubmitting={isPending}
    >
      <div className="space-y-1.5">
        <Label>{t('pages.masters.itemCategories.categoryName')}</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Screens & Displays"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t('shared.type')}</Label>
          <Select value={type} onValueChange={(v) => v && setType(v as typeof type)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* All four the export uses. Two of them were missing, so a shopkeeper adding an
               * Accessories or Consumables category had to file it under Raw Material. */}
              {CATEGORY_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(CATEGORY_TYPE_LABEL[value])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('pages.masters.itemCategories.parentCategory')}</Label>
          <Select value={parentId} onValueChange={(v) => v && setParentId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('pages.masters.itemCategories.noneRoot')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('pages.masters.itemCategories.noneRoot')}</SelectItem>
              {parentOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t('common.description')}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('common.optional')}
          rows={2}
        />
      </div>
    </FormModal>
  )
}
