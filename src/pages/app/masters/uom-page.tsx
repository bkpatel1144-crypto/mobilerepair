import { useState } from 'react'
import { Ruler, Plus, MoreVertical, Pencil, Ban, CheckCircle2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useUoms,
  useCreateUom,
  useUpdateUom,
  useSetUomStatus,
  useDeleteUom,
  type UomWithId,
} from '@/hooks/use-uom'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey } from '@/config/permission-schema'

const TYPE_OPTIONS = ['Quantity', 'Length', 'Weight', 'Volume', 'Time', 'Other']

export function UomPage() {
  const { data: uoms = [], isLoading } = useUoms()
  const { canDo } = usePermissions()
  const canManage = canDo(crudKey('masters', 'uom', 'update'))
  const setStatus = useSetUomStatus()
  const deleteUom = useDeleteUom()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editing, setEditing] = useState<UomWithId | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UomWithId | null>(null)
  const [toggleTarget, setToggleTarget] = useState<UomWithId | null>(null)

  const filtered = uoms
    .filter((u) => typeFilter === 'all' || u.type === typeFilter)
    .filter((u) => `${u.name} ${u.code}`.toLowerCase().includes(search.toLowerCase()))

  const columns: DataTableColumn<UomWithId>[] = [
    {
      key: 'name',
      header: 'Unit',
      sortValue: (u) => u.displayOrder,
      render: (u) => (
        <div>
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.code} / {u.symbol ?? '—'}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', hideOnMobile: true, render: (u) => u.type },
    {
      key: 'conversion',
      header: 'Conversion',
      hideOnMobile: true,
      render: (u) =>
        u.baseUomId ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
            {u.type.toUpperCase()} · Base unit
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'source',
      header: 'Source',
      hideOnMobile: true,
      render: (u) => <span className="text-xs text-muted-foreground">{u.source === 'system' ? 'System' : 'Custom'}</span>,
    },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status === 'active' ? 'Active' : 'Inactive'} /> },
    {
      key: 'actions',
      header: '',
      render: (u) =>
        canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(u) }}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setToggleTarget(u) }}>
                {u.status === 'active' ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {u.status === 'active' ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              {u.source === 'custom' && (
                <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(u) }}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Ruler}
        title="Units of Measure"
        subtitle="Manage units used across items, stock, purchases and sales"
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              Add UOM
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Total" value={uoms.length} icon={Ruler} />
        <StatCard label="System" value={uoms.filter((u) => u.source === 'system').length} />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search UOMs...">
        <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Ruler} title="No units of measure yet" description="Add your first UOM above." />}
      />

      {editing && <UomModal editing={editing} existing={uoms} onClose={() => setEditing(null)} />}

      {toggleTarget && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setToggleTarget(null)}
          title={`${toggleTarget.status === 'active' ? 'Deactivate' : 'Activate'} "${toggleTarget.name}"?`}
          message={
            toggleTarget.status === 'active'
              ? 'Deactivated units no longer appear as a selectable option for new items.'
              : 'This unit will become selectable again for new items.'
          }
          confirmLabel={toggleTarget.status === 'active' ? 'Deactivate' : 'Activate'}
          destructive={toggleTarget.status === 'active'}
          isPending={setStatus.isPending}
          onConfirm={() =>
            setStatus.mutate(
              { id: toggleTarget.id, status: toggleTarget.status === 'active' ? 'disabled' : 'active', uomName: toggleTarget.name },
              { onSuccess: () => setToggleTarget(null) }
            )
          }
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title={`Delete "${deleteTarget.name}"?`}
          message="Items already using this unit will keep a reference to a unit that no longer exists. This cannot be undone."
          confirmLabel="Delete"
          isPending={deleteUom.isPending}
          onConfirm={() => deleteUom.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })}
        />
      )}
    </div>
  )
}

function UomModal({ editing, existing, onClose }: { editing: UomWithId | 'new'; existing: UomWithId[]; onClose: () => void }) {
  const isNew = editing === 'new'
  const createUom = useCreateUom()
  const updateUom = useUpdateUom()

  const [name, setName] = useState(isNew ? '' : editing.name)
  const [type, setType] = useState(isNew ? 'Quantity' : editing.type)
  const [symbol, setSymbol] = useState(isNew ? '' : editing.symbol ?? '')
  const [decimalPlaces, setDecimalPlaces] = useState(isNew ? 0 : editing.decimalPlaces)
  const [displayOrder, setDisplayOrder] = useState(isNew ? existing.length : editing.displayOrder)
  const [baseUomId, setBaseUomId] = useState(isNew ? 'none' : editing.baseUomId ?? 'none')
  const [conversionFactor, setConversionFactor] = useState<number | ''>(isNew ? '' : editing.conversionFactor ?? '')
  const [description, setDescription] = useState(isNew ? '' : editing.description ?? '')

  const isPending = createUom.isPending || updateUom.isPending
  const baseOptions = existing.filter((u) => isNew || u.id !== editing.id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const input = {
      name: name.trim(),
      type,
      symbol: symbol.trim() || null,
      decimalPlaces,
      displayOrder,
      baseUomId: baseUomId === 'none' ? null : baseUomId,
      conversionFactor: baseUomId === 'none' ? null : (conversionFactor === '' ? null : Number(conversionFactor)),
      description: description.trim() || null,
    }
    if (isNew) await createUom.mutateAsync(input)
    else await updateUom.mutateAsync({ ...input, id: editing.id })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Create Unit of Measure' : 'Edit Unit of Measure'}
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Create UOM' : 'Save'}
      isSubmitting={isPending}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>UOM Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kilogram, Pieces" autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>UOM Code *</Label>
          <Input value={isNew ? 'AUTO-GENERATED' : editing.code} disabled />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">e.g. Pcs, Nos, Dozen, Box</p>
        </div>
        <div className="space-y-1.5">
          <Label>Symbol / Abbreviation</Label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g. kg, L, pcs" />
          <p className="text-xs text-muted-foreground">Shown in dropdowns and reports</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Decimal Places</Label>
          <Input type="number" min={0} max={4} value={decimalPlaces} onChange={(e) => setDecimalPlaces(Number(e.target.value) || 0)} />
          <p className="text-xs text-muted-foreground">0 = whole numbers (Pcs), 3 = precise (Kg)</p>
        </div>
        <div className="space-y-1.5">
          <Label>Display Order</Label>
          <Input type="number" min={0} value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)} />
          <p className="text-xs text-muted-foreground">Lower number = shown first in dropdowns</p>
        </div>
      </div>
      <div className="space-y-2 rounded-md border border-dashed p-3">
        <p className="text-sm font-medium">Conversion (Optional)</p>
        <p className="text-xs text-muted-foreground">Set this only if this UOM converts to another. e.g. 1 Inch = 0.0254 Meter</p>
        <div className="grid grid-cols-2 gap-3">
          <Select value={baseUomId} onValueChange={(v) => v && setBaseUomId(v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Base UOM" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {baseOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="number"
            step="any"
            disabled={baseUomId === 'none'}
            value={conversionFactor}
            onChange={(e) => setConversionFactor(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Conversion factor"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes about this unit" rows={2} />
      </div>
    </FormModal>
  )
}
