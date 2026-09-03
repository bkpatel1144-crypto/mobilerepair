import { useState } from 'react'
import { Users, User, Truck, UserCog, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
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
import {
  useParties,
  useCreateParty,
  useUpdateParty,
  useSetPartyStatus,
  type PartyWithId,
  type CreatePartyInput,
} from '@/hooks/use-parties'
import { usePartyCategories } from '@/hooks/use-party-categories'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey } from '@/config/permission-schema'
import { formatTimestamp } from '@/lib/utils'

type PartyTypeFilter = 'all' | 'customer' | 'supplier' | 'both'

export function PartiesPage() {
  const { data: parties = [], isLoading } = useParties()
  const { data: categories = [] } = usePartyCategories()
  const { canDo } = usePermissions()
  const canManage = canDo(crudKey('masters', 'parties', 'update'))

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<PartyTypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState<PartyWithId | 'new' | null>(null)
  const [viewing, setViewing] = useState<PartyWithId | null>(null)

  const activeParties = parties.filter((p) => p.status !== 'deleted')

  const filtered = activeParties
    .filter((p) => {
      if (typeFilter === 'all') return true
      if (typeFilter === 'both') return p.partyTypes.length > 1
      return p.partyTypes.includes(typeFilter) && p.partyTypes.length === 1
    })
    .filter((p) => categoryFilter === 'all' || p.categoryId === categoryFilter)
    .filter((p) =>
      search.trim() ? `${p.name} ${p.mobile} ${p.partyNumber}`.toLowerCase().includes(search.toLowerCase()) : true
    )

  function typeLabel(p: PartyWithId) {
    if (p.partyTypes.length > 1) return 'Both'
    return p.partyTypes.includes('supplier') ? 'Supplier' : 'Customer'
  }

  const columns: DataTableColumn<PartyWithId>[] = [
    {
      key: 'party',
      header: 'Party',
      sortValue: (p) => p.name,
      render: (p) => (
        <div>
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.partyNumber}</p>
        </div>
      ),
    },
    { key: 'mobile', header: 'Mobile', render: (p) => p.mobile },
    { key: 'category', header: 'Category', hideOnMobile: true, render: (p) => p.categoryName ?? '—' },
    { key: 'type', header: 'Type', hideOnMobile: true, render: (p) => typeLabel(p) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status === 'active' ? 'Active' : 'Inactive'} /> },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Users}
        title="Parties"
        subtitle="Manage customers and suppliers"
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              Add Party
            </Button>
          )
        }
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, mobile, or party code..." />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All'],
              ['customer', 'Customers'],
              ['supplier', 'Suppliers'],
              ['both', 'Both'],
            ] as [PartyTypeFilter, string][]
          ).map(([key, label]) => (
            <Button key={key} type="button" size="sm" variant={typeFilter === key ? 'default' : 'outline'} onClick={() => setTypeFilter(key)}>
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" size="sm" variant={categoryFilter === 'all' ? 'default' : 'outline'} onClick={() => setCategoryFilter('all')}>
            All
          </Button>
          {categories.map((c) => (
            <Button key={c.id} type="button" size="sm" variant={categoryFilter === c.id ? 'default' : 'outline'} onClick={() => setCategoryFilter(c.id)}>
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={Users} title="No parties found" description="Add your first customer or supplier above." />}
      />

      {editing && <PartyModal editing={editing} categories={categories} onClose={() => setEditing(null)} />}

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={viewing.partyTypes.includes('supplier') && !viewing.partyTypes.includes('customer') ? Truck : User}
          title={viewing.name}
          subtitle={<>{viewing.partyNumber} · 📞 {viewing.mobile}</>}
          badges={<StatusBadge status={viewing.status === 'active' ? 'Active' : 'Inactive'} />}
          actions={
            canManage && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(viewing); setViewing(null) }}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <PartyDeleteButton party={viewing} onDone={() => setViewing(null)} />
              </>
            )
          }
          sections={[
            {
              title: 'DETAILS',
              icon: UserCog,
              rows: [
                { label: 'Category', value: viewing.categoryName ?? '—' },
                { label: 'Mobile', value: viewing.mobile },
                ...(viewing.email ? [{ label: 'Email', value: viewing.email }] : []),
                ...(viewing.address ? [{ label: 'Address', value: viewing.address }] : []),
                ...(viewing.gstNumber ? [{ label: 'GST Number', value: viewing.gstNumber }] : []),
                ...(viewing.panNumber ? [{ label: 'PAN Number', value: viewing.panNumber }] : []),
              ],
            },
            {
              title: 'CREDIT',
              rows: [
                { label: 'Credit Limit', value: `₹${viewing.creditLimit}` },
                { label: 'Credit Days', value: String(viewing.creditDays) },
              ],
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

function PartyDeleteButton({ party, onDone }: { party: PartyWithId; onDone: () => void }) {
  const setStatus = useSetPartyStatus()
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
        title={`Delete "${party.name}"?`}
        message="This removes the party from every picker (job cards, receipts, purchases). There is no undo screen for this in the app — recovering it would mean editing Firestore directly."
        confirmLabel="Delete"
        isPending={setStatus.isPending}
        onConfirm={() => setStatus.mutate({ id: party.id, status: 'deleted', partyName: party.name }, { onSuccess: () => { setConfirming(false); onDone() } })}
      />
    </>
  )
}

function PartyModal({
  editing,
  categories,
  onClose,
}: {
  editing: PartyWithId | 'new'
  categories: ReturnType<typeof usePartyCategories>['data']
  onClose: () => void
}) {
  const isNew = editing === 'new'
  const createParty = useCreateParty()
  const updateParty = useUpdateParty()

  const [name, setName] = useState(isNew ? '' : editing.name)
  const [mobile, setMobile] = useState(isNew ? '' : editing.mobile)
  const [categoryId, setCategoryId] = useState(isNew ? 'none' : editing.categoryId ?? 'none')
  const [isCustomer, setIsCustomer] = useState(isNew ? true : editing.partyTypes.includes('customer'))
  const [isSupplier, setIsSupplier] = useState(isNew ? false : editing.partyTypes.includes('supplier'))
  const [showExtra, setShowExtra] = useState(!isNew)
  const [address, setAddress] = useState(isNew ? '' : editing.address ?? '')
  const [email, setEmail] = useState(isNew ? '' : editing.email ?? '')
  const [gstNumber, setGstNumber] = useState(isNew ? '' : editing.gstNumber ?? '')
  const [panNumber, setPanNumber] = useState(isNew ? '' : editing.panNumber ?? '')
  const [area, setArea] = useState(isNew ? '' : editing.area ?? '')
  const [village, setVillage] = useState(isNew ? '' : editing.village ?? '')
  const [taluka, setTaluka] = useState(isNew ? '' : editing.taluka ?? '')
  const [district, setDistrict] = useState(isNew ? '' : editing.district ?? '')
  const [pincode, setPincode] = useState(isNew ? '' : editing.pincode ?? '')

  const isPending = createParty.isPending || updateParty.isPending
  const category = (categories ?? []).find((c) => c.id === categoryId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !mobile.trim()) return
    const partyTypes: ('customer' | 'supplier')[] = [
      ...(isCustomer ? (['customer'] as const) : []),
      ...(isSupplier ? (['supplier'] as const) : []),
    ]
    const input: CreatePartyInput = {
      name: name.trim(),
      mobile: mobile.trim(),
      partyTypes: partyTypes.length ? partyTypes : ['customer'],
      categoryId: categoryId === 'none' ? null : categoryId,
      categoryName: category?.name ?? null,
      address: address.trim() || null,
      email: email.trim() || null,
      gstNumber: gstNumber.trim() || null,
      panNumber: panNumber.trim() || null,
      area: area.trim() || null,
      village: village.trim() || null,
      taluka: taluka.trim() || null,
      district: district.trim() || null,
      pincode: pincode.trim() || null,
      creditLimit: isNew ? 0 : editing.creditLimit,
      creditDays: category?.defaultCreditDays ?? (isNew ? 0 : editing.creditDays),
    }
    if (isNew) await createParty.mutateAsync(input)
    else await updateParty.mutateAsync({ ...input, id: editing.id })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Create Party' : 'Edit Party'}
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Create Party' : 'Save'}
      isSubmitting={isPending}
      className="sm:max-w-xl"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Party Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rajesh Kumar" autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>Mobile *</Label>
          <Input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile number"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {(categories ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Party Type *</Label>
          <div className="flex h-8 items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={isCustomer} onCheckedChange={(v) => setIsCustomer(v === true)} />
              Customer
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={isSupplier} onCheckedChange={(v) => setIsSupplier(v === true)} />
              Supplier
            </label>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowExtra((v) => !v)}
        className="flex items-center gap-1 text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        {showExtra ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        {showExtra ? 'Hide extra details' : 'All optional — add what you need'}
      </button>

      {showExtra && (
        <div className="space-y-3 rounded-md border border-dashed p-3">
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Shop / house, area, city, pincode" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>GST number</Label>
              <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())} placeholder="27ABCDE1234F1Z5" />
            </div>
            <div className="space-y-1.5">
              <Label>PAN number</Label>
              <Input value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Area</Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Locality / area" />
            </div>
            <div className="space-y-1.5">
              <Label>Village</Label>
              <Input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Village" />
            </div>
            <div className="space-y-1.5">
              <Label>Taluka</Label>
              <Input value={taluka} onChange={(e) => setTaluka(e.target.value)} placeholder="Taluka" />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Pincode</Label>
            <Input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit PIN" />
          </div>
        </div>
      )}
    </FormModal>
  )
}
