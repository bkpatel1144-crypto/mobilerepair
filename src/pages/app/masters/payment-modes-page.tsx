import { useState } from 'react'
import { CreditCard, Plus, Star, MoreVertical, Pencil, Ban, CheckCircle2, Trash2 } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  usePaymentModes,
  useCreatePaymentMode,
  useUpdatePaymentMode,
  useSetPaymentModeStatus,
  useDeletePaymentMode,
  type PaymentModeWithId,
} from '@/hooks/use-payment-modes'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey } from '@/config/permission-schema'

const TYPE_OPTIONS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other']

export function PaymentModesPage() {
  const { data: modes = [], isLoading } = usePaymentModes()
  const { canDo } = usePermissions()
  const setStatus = useSetPaymentModeStatus()
  const deleteMode = useDeletePaymentMode()

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<PaymentModeWithId | 'new' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PaymentModeWithId | null>(null)
  const [toggleTarget, setToggleTarget] = useState<PaymentModeWithId | null>(null)

  const canManage = canDo(crudKey('masters', 'paymentModes', 'update'))
  const filtered = modes.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))

  const columns: DataTableColumn<PaymentModeWithId>[] = [
    {
      key: 'name',
      header: 'Payment Mode',
      sortValue: (m) => m.name,
      render: (m) => (
        <span className="inline-flex items-center gap-1.5 font-medium">
          {m.name}
          {m.isDefault && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (m) => <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{m.type}</span>,
    },
    { key: 'description', header: 'Description', hideOnMobile: true, render: (m) => m.description || '—' },
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status === 'active' ? 'Active' : 'Inactive'} /> },
    {
      key: 'actions',
      header: '',
      render: (m) =>
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
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(m) }}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setToggleTarget(m) }}>
                {m.status === 'active' ? <Ban className="size-4" /> : <CheckCircle2 className="size-4" />}
                {m.status === 'active' ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              {m.source === 'custom' && (
                <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(m) }}>
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
        icon={CreditCard}
        title="Payment Modes"
        subtitle="Cash, UPI, card, bank transfer and other accepted payment methods"
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              Add Payment Mode
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Total" value={modes.length} icon={CreditCard} />
        <StatCard label="Active" value={modes.filter((m) => m.status === 'active').length} tone="success" />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search payment modes..." />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(m) => m.id}
        isLoading={isLoading}
        emptyState={<EmptyState icon={CreditCard} title="No payment modes yet" description="Add your first payment mode above." />}
      />

      {editing && <PaymentModeModal editing={editing} existing={modes} onClose={() => setEditing(null)} />}

      {toggleTarget && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setToggleTarget(null)}
          title={`${toggleTarget.status === 'active' ? 'Deactivate' : 'Activate'} "${toggleTarget.name}"?`}
          message={
            toggleTarget.status === 'active'
              ? 'Deactivated payment modes no longer appear as a selectable option when recording a receipt or payment.'
              : 'This payment mode will become selectable again.'
          }
          confirmLabel={toggleTarget.status === 'active' ? 'Deactivate' : 'Activate'}
          destructive={toggleTarget.status === 'active'}
          isPending={setStatus.isPending}
          onConfirm={() =>
            setStatus.mutate(
              { id: toggleTarget.id, status: toggleTarget.status === 'active' ? 'disabled' : 'active', modeName: toggleTarget.name },
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
          message="Receipts already recorded under this payment mode will keep a reference to a mode that no longer exists. This cannot be undone."
          confirmLabel="Delete"
          isPending={deleteMode.isPending}
          onConfirm={() => deleteMode.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })}
        />
      )}
    </div>
  )
}

function PaymentModeModal({
  editing,
  existing,
  onClose,
}: {
  editing: PaymentModeWithId | 'new'
  existing: PaymentModeWithId[]
  onClose: () => void
}) {
  const isNew = editing === 'new'
  const createMode = useCreatePaymentMode(existing)
  const updateMode = useUpdatePaymentMode(existing)

  const [name, setName] = useState(isNew ? '' : editing.name)
  const [type, setType] = useState(isNew ? 'Cash' : editing.type)
  const [description, setDescription] = useState(isNew ? '' : editing.description ?? '')
  const [isDefault, setIsDefault] = useState(isNew ? false : editing.isDefault)

  const isPending = createMode.isPending || updateMode.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const input = { name: name.trim(), type, description: description.trim() || null, isDefault }
    if (isNew) await createMode.mutateAsync(input)
    else await updateMode.mutateAsync({ ...input, id: editing.id })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Add Payment Mode' : 'Edit Payment Mode'}
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Create' : 'Save'}
      isSubmitting={isPending}
    >
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cash, PhonePe UPI" autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>Code *</Label>
        <Input value={isNew ? 'AUTO-GENERATED' : editing.code} disabled />
      </div>
      <div className="space-y-1.5">
        <Label>Type *</Label>
        <Select value={type} onValueChange={(v) => v && setType(v)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(v === true)} />
        <span>
          Set as default <span className="text-muted-foreground">— Auto-select this mode during billing</span>
        </span>
      </label>
    </FormModal>
  )
}
