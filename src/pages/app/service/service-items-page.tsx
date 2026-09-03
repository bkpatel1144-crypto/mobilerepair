import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Wrench, RefreshCw, Plus, ExternalLink, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { useItems, itemsQueryKey, useCreateItem, useUpdateItem, nextItemCode, type ItemWithId } from '@/hooks/use-items'

/**
 * Read-only-by-design view of Item Master, filtered to `type === 'service'` — matches
 * `preview (75)`'s own banner text exactly: this never duplicates Item Master's data into a
 * second collection, it just queries the *same* `items` collection with a filter. "Add
 * Item"/"Edit" do a genuinely minimal inline create/rename against that same collection, since
 * Phase 7's real Item Master page doesn't exist yet to hand off to — see PROGRESS.md.
 */
export function ServiceItemsPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: items = [], isLoading } = useItems()
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()

  const [search, setSearch] = useState('')
  const [modalItem, setModalItem] = useState<ItemWithId | 'new' | null>(null)
  const [name, setName] = useState('')
  const [uom, setUom] = useState('nos')
  const [sellingPrice, setSellingPrice] = useState<number | ''>('')

  const serviceItems = items.filter((i) => i.type === 'service')
  const partItems = items.filter((i) => i.type === 'part')
  const filtered = serviceItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))

  function openNew() {
    setName('')
    setUom('nos')
    setSellingPrice('')
    setModalItem('new')
  }
  function openEdit(item: ItemWithId) {
    setName(item.name)
    setUom(item.uom)
    setSellingPrice(item.sellingPrice ?? '')
    setModalItem(item)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (modalItem === 'new') {
      await createItem.mutateAsync({
        name: name.trim(),
        type: 'service',
        itemCode: nextItemCode(items, 'service'),
        uom,
        sellingPrice: sellingPrice === '' ? null : Number(sellingPrice),
      })
    } else if (modalItem) {
      await updateItem.mutateAsync({
        id: modalItem.id,
        name: name.trim(),
        type: modalItem.type,
        itemCode: modalItem.itemCode,
        uom,
        sellingPrice: sellingPrice === '' ? null : Number(sellingPrice),
      })
    }
    setModalItem(null)
  }

  const columns: DataTableColumn<ItemWithId>[] = [
    {
      key: 'item',
      header: 'Item',
      sortValue: (i) => i.name,
      render: (i) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Wrench className="size-4" />
          </span>
          <div>
            <p className="font-medium">{i.name}</p>
            <p className="text-xs text-muted-foreground">{i.itemCode}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (i) => i.categoryName ?? '—' },
    { key: 'type', header: 'Type', render: () => <StatusBadge status="Services" tone="success" /> },
    { key: 'uom', header: 'UOM', hideOnMobile: true, render: (i) => i.uom },
    { key: 'price', header: 'Selling Price', render: (i) => (i.sellingPrice != null ? `₹${i.sellingPrice}` : '—') },
    {
      key: 'edit',
      header: '',
      render: (i) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openEdit(i)
          }}
          className="flex items-center gap-1 text-sm text-teal-700 hover:underline dark:text-teal-400"
        >
          <Pencil className="size-3.5" />
          Edit
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Service Items"
        subtitle="Items and services used in job cards — managed via Item Master"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: itemsQueryKey(profile?.companyId) })}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button type="button" onClick={openNew}>
              <Plus className="size-4" />
              Add Item
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-3">
        <StatCard label="Total" value={items.length} />
        <StatCard label="Services" value={serviceItems.length} tone="success" />
        <StatCard label="Parts" value={partItems.length} />
      </div>

      <p className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-500/10 dark:text-blue-400">
        <span>
          Service items are managed in Item Master. Items with Services type appear here
          automatically. To add or edit items, use Item Master.
        </span>
        <Button type="button" size="sm" variant="outline" disabled title="Item Master ships in Phase 7">
          <ExternalLink className="size-3.5" />
          Item Master
        </Button>
      </p>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search service items..." />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(i) => i.id}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Wrench} title="No service items yet" description="Add one to get started." />}
      />

      <FormModal
        open={!!modalItem}
        onOpenChange={(o) => !o && setModalItem(null)}
        title={modalItem === 'new' ? 'Add Service Item' : 'Edit Service Item'}
        onSubmit={handleSubmit}
        isSubmitting={createItem.isPending || updateItem.isPending}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>UOM</Label>
              <Input value={uom} onChange={(e) => setUom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Selling Price</Label>
              <Input type="number" min={0} value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  )
}
