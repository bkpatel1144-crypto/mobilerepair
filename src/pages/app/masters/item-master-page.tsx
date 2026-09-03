import { useState } from 'react'
import { Package, Wrench, Plus, Pencil, Ban, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useItems, useCreateItem, useUpdateItem, useSetItemStatus, nextItemCode, type ItemWithId } from '@/hooks/use-items'
import { useItemCategories } from '@/hooks/use-item-categories'
import { useUoms } from '@/hooks/use-uom'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey } from '@/config/permission-schema'
import type { ItemType } from '@/types/firestore'

const TYPE_LABEL: Record<ItemType, string> = { service: 'Service', part: 'Part', product: 'Product' }

export function ItemMasterPage() {
  const { data: items = [], isLoading } = useItems()
  const { data: categories = [] } = useItemCategories()
  const { canDo } = usePermissions()
  const canManage = canDo(crudKey('masters', 'items', 'update'))

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all')
  const [editing, setEditing] = useState<ItemWithId | 'new' | null>(null)
  const [viewing, setViewing] = useState<ItemWithId | null>(null)

  const filtered = items
    .filter((i) => typeFilter === 'all' || i.type === typeFilter)
    .filter((i) => `${i.name} ${i.itemCode}`.toLowerCase().includes(search.toLowerCase()))

  const columns: DataTableColumn<ItemWithId>[] = [
    {
      key: 'item',
      header: 'Item',
      sortValue: (i) => i.name,
      render: (i) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {i.type === 'service' ? <Wrench className="size-4" /> : <Package className="size-4" />}
          </span>
          <div>
            <p className="font-medium">{i.name}</p>
            <p className="text-xs text-muted-foreground">{i.itemCode}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', hideOnMobile: true, render: (i) => i.categoryName ?? '—' },
    {
      key: 'type',
      header: 'Type',
      render: (i) => (
        <span
          className={
            'rounded-full px-2 py-0.5 text-xs font-medium ' +
            (i.type === 'service'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400')
          }
        >
          {TYPE_LABEL[i.type]}
        </span>
      ),
    },
    { key: 'nature', header: 'Nature', hideOnMobile: true, render: (i) => i.nature },
    { key: 'uom', header: 'UOM', hideOnMobile: true, render: (i) => i.uom },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status === 'active' ? 'Active' : 'Inactive'} /> },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Package}
        title="Item Master"
        subtitle="Products, services, and spare parts catalog"
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              Add Item
            </Button>
          )
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:max-w-xl">
        <StatCard label="Total" value={items.length} icon={Package} />
        <StatCard label="Active" value={items.filter((i) => i.status === 'active').length} tone="success" />
        <StatCard label="Services" value={items.filter((i) => i.type === 'service').length} />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search items...">
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="part">Part</SelectItem>
            <SelectItem value="product">Product</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(i) => i.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={Package} title="No items yet" description="Add your first item above." />}
      />

      {editing && <ItemModal editing={editing} existing={items} categories={categories} onClose={() => setEditing(null)} />}

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={viewing.type === 'service' ? Wrench : Package}
          title={viewing.name}
          subtitle={viewing.itemCode}
          badges={<StatusBadge status={viewing.status === 'active' ? 'Active' : 'Inactive'} />}
          actions={
            canManage && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(viewing); setViewing(null) }}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <ItemStatusButton item={viewing} />
              </>
            )
          }
          sections={[
            {
              title: 'CLASSIFICATION',
              rows: [
                { label: 'Type', value: TYPE_LABEL[viewing.type].toUpperCase() },
                { label: 'Nature', value: viewing.nature },
                { label: 'Category', value: viewing.categoryName ?? '—' },
                { label: 'Primary UOM', value: viewing.uom },
              ],
            },
            {
              title: 'PRICING',
              rows: [
                { label: 'Tax', value: `GST ${viewing.gstPercent}%` },
                { label: 'GST', value: `CGST ${viewing.cgstPercent}% + SGST ${viewing.sgstPercent}%` },
                { label: 'Selling Price', value: viewing.sellingPrice != null ? `₹${viewing.sellingPrice}` : '—' },
                { label: 'Purchase Price', value: viewing.purchasePrice != null ? `₹${viewing.purchasePrice}` : '—' },
                { label: 'MRP', value: viewing.mrp != null ? `₹${viewing.mrp}` : '—' },
              ],
            },
            { title: 'INVENTORY', rows: [{ label: 'Stock Tracked', value: viewing.stockTracked ? 'Yes' : 'No' }] },
            {
              title: 'ENABLED IN',
              children: (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ['Sales', viewing.enabledInSales],
                    ['Purchase', viewing.enabledInPurchase],
                    ['Production', viewing.enabledInProduction],
                    ['Service / POS', viewing.enabledInServicePos],
                  ].map(([label, on]) => (
                    <span
                      key={label as string}
                      className={
                        'rounded-full px-2 py-0.5 text-xs font-medium ' +
                        (on
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-secondary text-muted-foreground')
                      }
                    >
                      {label as string}
                    </span>
                  ))}
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

function ItemStatusButton({ item }: { item: ItemWithId }) {
  const setStatus = useSetItemStatus()
  const [confirming, setConfirming] = useState(false)
  const willDeactivate = item.status === 'active'

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        {willDeactivate ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
        {willDeactivate ? 'Deactivate' : 'Activate'}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${willDeactivate ? 'Deactivate' : 'Activate'} "${item.name}"?`}
        message={
          willDeactivate
            ? 'Deactivated items no longer appear as a selectable option in job cards, purchases, or sales.'
            : 'This item will become selectable again.'
        }
        confirmLabel={willDeactivate ? 'Deactivate' : 'Activate'}
        destructive={willDeactivate}
        isPending={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(
            { id: item.id, status: willDeactivate ? 'disabled' : 'active', itemName: item.name },
            { onSuccess: () => setConfirming(false) }
          )
        }
      />
    </>
  )
}

function ItemModal({
  editing,
  existing,
  categories,
  onClose,
}: {
  editing: ItemWithId | 'new'
  existing: ItemWithId[]
  categories: ReturnType<typeof useItemCategories>['data']
  onClose: () => void
}) {
  const isNew = editing === 'new'
  const { data: uoms = [] } = useUoms()
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()

  const [name, setName] = useState(isNew ? '' : editing.name)
  const [type, setType] = useState<ItemType>(isNew ? 'part' : editing.type)
  const [categoryId, setCategoryId] = useState(isNew ? 'none' : editing.categoryId ?? 'none')
  const [uom, setUom] = useState(isNew ? 'nos' : editing.uom)
  const [gstPercent, setGstPercent] = useState(isNew ? 18 : editing.gstPercent)
  const [sellingPrice, setSellingPrice] = useState<number | ''>(isNew ? '' : editing.sellingPrice ?? '')
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(isNew ? '' : editing.purchasePrice ?? '')
  const [mrp, setMrp] = useState<number | ''>(isNew ? '' : editing.mrp ?? '')
  const [stockTracked, setStockTracked] = useState(isNew ? true : editing.stockTracked)
  const [enabledInSales, setEnabledInSales] = useState(isNew ? true : editing.enabledInSales)
  const [enabledInPurchase, setEnabledInPurchase] = useState(isNew ? true : editing.enabledInPurchase)
  const [enabledInServicePos, setEnabledInServicePos] = useState(isNew ? true : editing.enabledInServicePos)
  const [description, setDescription] = useState(isNew ? '' : editing.description ?? '')

  const isPending = createItem.isPending || updateItem.isPending
  const category = (categories ?? []).find((c) => c.id === categoryId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const input = {
      name: name.trim(),
      type,
      itemCode: isNew ? nextItemCode(existing, type) : editing.itemCode,
      nature: type === 'service' ? ('Service' as const) : ('Goods' as const),
      categoryId: categoryId === 'none' ? null : categoryId,
      categoryName: category?.name ?? null,
      uom,
      gstPercent,
      sellingPrice: sellingPrice === '' ? null : Number(sellingPrice),
      purchasePrice: purchasePrice === '' ? null : Number(purchasePrice),
      mrp: mrp === '' ? null : Number(mrp),
      stockTracked,
      enabledInSales,
      enabledInPurchase,
      enabledInServicePos,
      description: description.trim() || null,
    }
    if (isNew) await createItem.mutateAsync(input)
    else await updateItem.mutateAsync({ ...input, id: editing.id })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Add Item' : 'Edit Item'}
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Create Item' : 'Save'}
      isSubmitting={isPending}
      className="sm:max-w-xl"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Item Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Screen Replacement" autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={type} onValueChange={(v) => v && setType(v as ItemType)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="part">Part</SelectItem>
              <SelectItem value="product">Product</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {(categories ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Primary UOM</Label>
          <Select value={uom} onValueChange={(v) => v && setUom(v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {uoms.map((u) => <SelectItem key={u.id} value={u.symbol ?? u.code.toLowerCase()}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>GST %</Label>
          <Input type="number" min={0} max={28} value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value) || 0)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Selling Price</Label>
          <Input type="number" min={0} value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="—" />
        </div>
        <div className="space-y-1.5">
          <Label>Purchase Price</Label>
          <Input type="number" min={0} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="—" />
        </div>
        <div className="space-y-1.5">
          <Label>MRP</Label>
          <Input type="number" min={0} value={mrp} onChange={(e) => setMrp(e.target.value === '' ? '' : Number(e.target.value))} placeholder="—" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Enabled In</Label>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <Checkbox checked={stockTracked} onCheckedChange={(v) => setStockTracked(v === true)} />
            Stock Tracked
          </label>
          <label className="flex items-center gap-1.5">
            <Checkbox checked={enabledInSales} onCheckedChange={(v) => setEnabledInSales(v === true)} />
            Sales
          </label>
          <label className="flex items-center gap-1.5">
            <Checkbox checked={enabledInPurchase} onCheckedChange={(v) => setEnabledInPurchase(v === true)} />
            Purchase
          </label>
          <label className="flex items-center gap-1.5">
            <Checkbox checked={enabledInServicePos} onCheckedChange={(v) => setEnabledInServicePos(v === true)} />
            Service / POS
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={2} />
      </div>
    </FormModal>
  )
}
