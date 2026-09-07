import { useState } from 'react'
import {
  Truck,
  Plus,
  IndianRupee,
  Users,
  AlertTriangle,
  ChevronRight,
  Ban,
  Smartphone,
  FileText,
  Download,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { FormModal } from '@/components/shared/form-modal'
import { FormError } from '@/components/shared/form-error'
import { SearchSelect } from '@/components/shared/search-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useSupplierPayables,
  useSupplierBills,
  useCreateSupplierBill,
  useRecordSupplierPayment,
  useVoidSupplierBill,
  type SupplierGroup,
  type SupplierPayable,
  type SupplierBillWithId,
} from '@/hooks/use-supplier-payables'
import { useParties, useCreateParty } from '@/hooks/use-parties'
import { downloadCsv } from '@/lib/csv-export'
import { cn } from '@/lib/utils'
import type { ReceiptDoc } from '@/types/firestore'

const BUCKET_LABELS: {
  key: SupplierPayable['bucket']
  label: string
  tone: 'success' | 'warning' | 'danger'
}[] = [
  { key: 'current', label: 'Current', tone: 'success' },
  { key: '1-30', label: '1–30 days', tone: 'warning' },
  { key: '31-60', label: '31–60 days', tone: 'warning' },
  { key: '60+', label: '60+ days', tone: 'danger' },
]

function agingBadge(p: SupplierPayable) {
  if (p.daysOverdue <= 0) return <StatusBadge status="Current" tone="success" />
  if (p.daysOverdue <= 30)
    return <StatusBadge status={`${p.daysOverdue}d overdue`} tone="warning" />
  return <StatusBadge status={`${p.daysOverdue}d overdue`} tone="danger" />
}

function NewBillModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const create = useCreateSupplierBill()
  const { data: parties = [] } = useParties()
  const createParty = useCreateParty()

  const today = new Date().toISOString().slice(0, 10)
  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [supplierRef, setSupplierRef] = useState('')
  const [billDate, setBillDate] = useState(today)
  const [dueDate, setDueDate] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Same rule the Job Costing supplier picker uses: a party with no types set is still
  // offerable, since plenty of parties were created before types were being recorded.
  const suppliers = parties.filter(
    (p) => p.partyTypes.includes('supplier') || p.partyTypes.length === 0
  )
  const supplier = parties.find((p) => p.id === supplierId)

  function reset() {
    setSupplierId(null)
    setSupplierRef('')
    setBillDate(today)
    setDueDate('')
    setAmount('')
    setNotes('')
    setError(null)
  }

  async function handleSubmit() {
    setError(null)
    const value = Number(amount)
    if (!supplier) {
      setError('Pick a supplier.')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a bill amount greater than zero.')
      return
    }
    if (dueDate && dueDate < billDate) {
      setError('The due date cannot be before the bill date.')
      return
    }
    try {
      await create.mutateAsync({
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierRef: supplierRef.trim() || null,
        billDate: new Date(`${billDate}T00:00:00`),
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`) : null,
        amount: value,
        notes: notes.trim() || null,
      })
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this bill.')
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
      title="New Supplier Bill"
      description="A purchase invoice you owe. Payments against it are recorded here and show on the supplier's ledger."
      submitLabel={create.isPending ? 'Saving…' : 'Save Bill'}
      isSubmitting={create.isPending}
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <Label>
          Supplier <span className="text-red-600">*</span>
        </Label>
        <SearchSelect
          options={suppliers.map((p) => ({
            id: p.id,
            label: p.name,
            helper: p.mobile || undefined,
          }))}
          value={supplierId}
          onChange={setSupplierId}
          placeholder="Search supplier..."
          onCreateNew={(name) =>
            createParty.mutate(
              { name: name.trim(), mobile: '', partyTypes: ['supplier'] },
              { onSuccess: (created) => setSupplierId(created.id) }
            )
          }
        />
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
        <div className="space-y-1.5">
          <Label htmlFor="sb-ref">
            Their invoice #{' '}
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="sb-ref"
            value={supplierRef}
            onChange={(e) => setSupplierRef(e.target.value)}
            placeholder="e.g. INV-8842"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sb-amount">
            Amount <span className="text-red-600">*</span>
          </Label>
          <Input
            id="sb-amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
        <div className="space-y-1.5">
          <Label htmlFor="sb-date">
            Bill date <span className="text-red-600">*</span>
          </Label>
          <Input
            id="sb-date"
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sb-due">
            Due date <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="sb-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Left empty, the bill ages from its bill date.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sb-notes">
          Notes <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id="sb-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <FormError message={error} />}
    </FormModal>
  )
}

function PaymentModal({
  payable,
  onClose,
}: {
  payable: SupplierPayable | null
  onClose: () => void
}) {
  const pay = useRecordSupplierPayment()
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<ReceiptDoc['mode']>('cash')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [seeded, setSeeded] = useState<string | null>(null)

  // Prefill the full outstanding once per payable — paying in full is the common case, and
  // seeding during render (rather than in an effect) is the pattern used elsewhere here.
  if (payable && seeded !== payable.id) {
    setSeeded(payable.id)
    setAmount(String(payable.outstanding))
    setMode('cash')
    setNotes('')
    setError(null)
  }

  async function handleSubmit() {
    if (!payable) return
    setError(null)
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    if (value > payable.outstanding) {
      setError(`That is more than the ₹${payable.outstanding} outstanding on this item.`)
      return
    }
    try {
      await pay.mutateAsync({ payable, amount: value, mode, notes: notes.trim() || null })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record this payment.')
    }
  }

  return (
    <FormModal
      open={!!payable}
      onOpenChange={(o) => !o && onClose()}
      title="Record Payment"
      description={payable ? `${payable.supplierName} · ${payable.reference}` : ''}
      submitLabel={pay.isPending ? 'Saving…' : 'Record Payment'}
      isSubmitting={pay.isPending}
      onSubmit={handleSubmit}
    >
      {payable && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 text-sm">
          <span className="text-muted-foreground">Outstanding</span>
          <span className="text-lg font-semibold text-red-600">₹{payable.outstanding}</span>
        </div>
      )}

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
        <div className="space-y-1.5">
          <Label htmlFor="pay-amount">
            Amount <span className="text-red-600">*</span>
          </Label>
          <Input
            id="pay-amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Paid by <span className="text-red-600">*</span>
          </Label>
          <Select value={mode} onValueChange={(v) => v && setMode(v as ReceiptDoc['mode'])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pay-notes">
          Notes <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="pay-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Recorded as a payment out, so it appears in Cash Book and on this supplier's ledger.
      </p>

      {error && <FormError message={error} />}
    </FormModal>
  )
}

export function SupplierPayablesPage() {
  const { data, isLoading, error: loadError, refetch } = useSupplierPayables()
  const { data: bills = [] } = useSupplierBills()
  const voidBill = useVoidSupplierBill()

  const [search, setSearch] = useState('')
  const [bucketFilter, setBucketFilter] = useState<SupplierPayable['bucket'] | 'all'>('all')
  const [viewing, setViewing] = useState<SupplierGroup | null>(null)
  const [paying, setPaying] = useState<SupplierPayable | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<SupplierBillWithId | null>(null)

  const groups = data.groups
    .map((g) =>
      bucketFilter === 'all' ? g : { ...g, items: g.items.filter((i) => i.bucket === bucketFilter) }
    )
    .filter((g) => g.items.length > 0)
    .filter((g) =>
      search.trim() ? g.supplierName.toLowerCase().includes(search.toLowerCase()) : true
    )
    .map((g) => ({
      ...g,
      outstanding: g.items.reduce((s, i) => s + i.outstanding, 0),
      billed: g.items.reduce((s, i) => s + i.amount, 0),
      paid: g.items.reduce((s, i) => s + i.amountPaid, 0),
    }))

  const columns: DataTableColumn<SupplierGroup>[] = [
    {
      key: 'supplier',
      header: 'Supplier',
      sortValue: (g) => g.supplierName,
      render: (g) => (
        <div>
          <p className="font-medium">{g.supplierName}</p>
          <p className="text-xs text-muted-foreground">
            {g.items.length} item{g.items.length === 1 ? '' : 's'}
          </p>
        </div>
      ),
    },
    { key: 'billed', header: 'Billed', sortValue: (g) => g.billed, render: (g) => `₹${g.billed}` },
    {
      key: 'paid',
      header: 'Paid',
      sortValue: (g) => g.paid,
      render: (g) => <span className="text-teal-600 dark:text-teal-400">₹{g.paid}</span>,
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      sortValue: (g) => g.outstanding,
      render: (g) => <span className="font-semibold text-red-600">₹{g.outstanding}</span>,
    },
    {
      key: 'oldest',
      header: 'Oldest',
      hideOnMobile: true,
      sortValue: (g) => g.oldestDaysOverdue,
      render: (g) =>
        g.oldestDaysOverdue <= 0 ? (
          <StatusBadge status="Current" tone="success" />
        ) : (
          <StatusBadge
            status={`${g.oldestDaysOverdue}d`}
            tone={g.oldestDaysOverdue > 60 ? 'danger' : 'warning'}
          />
        ),
    },
    {
      key: 'go',
      header: '',
      render: () => <ChevronRight className="size-4 text-muted-foreground" />,
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Truck}
        title="Supplier Payables"
        subtitle="What the shop owes suppliers — purchase bills and unpaid device purchases, by age"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={groups.length === 0}
              onClick={() =>
                downloadCsv(
                  'supplier-payables.csv',
                  groups.flatMap((g) =>
                    g.items.map((i) => ({
                      Supplier: g.supplierName,
                      Reference: i.reference,
                      Type: i.kind === 'bill' ? 'Bill' : 'Device purchase',
                      'Due Date': i.dueDate.toLocaleDateString('en-IN'),
                      Amount: i.amount,
                      Paid: i.amountPaid,
                      Outstanding: i.outstanding,
                      'Days Overdue': Math.max(0, i.daysOverdue),
                    }))
                  )
                )
              }
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button type="button" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" />
              New Bill
            </Button>
          </>
        }
      />

      {loadError ? (
        <ErrorState error={loadError} onRetry={() => void refetch()} />
      ) : (
        <>
          <StatCardGrid>
            <StatCard
              label="Total Outstanding"
              value={`₹${data.totalOutstanding}`}
              icon={IndianRupee}
              tone="danger"
            />
            <StatCard label="Suppliers" value={data.supplierCount} icon={Users} />
            <StatCard
              label="Overdue 60+"
              value={`₹${data.buckets['60+']}`}
              icon={AlertTriangle}
              tone="warning"
            />
          </StatCardGrid>

          {/* Aging buckets double as the filter — clicking one is how you get to "show me only
           * what's badly overdue", which is the question this page is opened to answer. */}
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(9rem,1fr))]">
            {BUCKET_LABELS.map((b) => {
              const selected = bucketFilter === b.key
              return (
                <button
                  key={b.key}
                  type="button"
                  data-slot="button"
                  aria-pressed={selected}
                  onClick={() => setBucketFilter(selected ? 'all' : b.key)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-colors',
                    selected
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-500/10'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {b.label}
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-xl font-bold tabular-nums',
                      b.tone === 'danger' && data.buckets[b.key] > 0 && 'text-red-600',
                      b.tone === 'warning' && data.buckets[b.key] > 0 && 'text-amber-600'
                    )}
                  >
                    ₹{data.buckets[b.key]}
                  </p>
                </button>
              )
            })}
          </div>

          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search supplier..."
          >
            {bucketFilter !== 'all' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setBucketFilter('all')}
              >
                Clear age filter
              </Button>
            )}
          </FilterBar>

          <DataTable
            columns={columns}
            data={groups}
            rowKey={(g) => g.supplierId || g.supplierName}
            onRowClick={setViewing}
            isLoading={isLoading}
            emptyState={
              <EmptyState
                icon={Truck}
                title="Nothing owed to suppliers"
                description="Enter a purchase bill, or record a device purchase without paying it in full, and it will appear here."
                action={
                  <Button type="button" onClick={() => setNewOpen(true)}>
                    <Plus className="size-4" />
                    New Bill
                  </Button>
                }
              />
            }
          />
        </>
      )}

      <DetailDrawer
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        icon={Truck}
        title={viewing?.supplierName ?? ''}
        subtitle={
          viewing
            ? `₹${viewing.outstanding} outstanding across ${viewing.items.length} item(s)`
            : ''
        }
      >
        <div className="space-y-2">
          {viewing?.items
            .slice()
            .sort((a, b) => b.daysOverdue - a.daysOverdue)
            .map((item) => {
              const bill = bills.find((b) => b.id === item.id)
              return (
                <div key={`${item.kind}-${item.id}`} className="space-y-2 rounded-lg border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium">
                        {item.kind === 'bill' ? (
                          <FileText className="size-3.5 text-muted-foreground" />
                        ) : (
                          <Smartphone className="size-3.5 text-muted-foreground" />
                        )}
                        <span className="truncate">{item.reference}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {item.dueDate.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    {agingBadge(item)}
                  </div>

                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase">Amount</dt>
                      <dd className="font-medium">₹{item.amount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase">Paid</dt>
                      <dd className="font-medium text-teal-600 dark:text-teal-400">
                        ₹{item.amountPaid}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground uppercase">Due</dt>
                      <dd className="font-semibold text-red-600">₹{item.outstanding}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={() => setPaying(item)}>
                      <IndianRupee className="size-3.5" />
                      Record Payment
                    </Button>
                    {/* Only a bill can be voided — a device purchase is voided from its own
                     * register, where the device's status lives. */}
                    {item.kind === 'bill' && bill && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => setVoidTarget(bill)}
                      >
                        <Ban className="size-3.5" />
                        Void Bill
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </DetailDrawer>

      <NewBillModal open={newOpen} onOpenChange={setNewOpen} />

      <PaymentModal
        payable={paying}
        onClose={() => {
          setPaying(null)
          setViewing(null)
        }}
      />

      <ConfirmDialog
        open={!!voidTarget}
        onOpenChange={(o) => !o && setVoidTarget(null)}
        title="Void this bill?"
        message={
          voidTarget
            ? `${voidTarget.billNumber} (₹${voidTarget.amount}) stops counting as payable. Payments already recorded against it stay on the supplier's ledger — void the receipts separately if they were entered in error.`
            : ''
        }
        confirmLabel="Void Bill"
        isPending={voidBill.isPending}
        onConfirm={async () => {
          if (voidTarget) await voidBill.mutateAsync(voidTarget)
          setVoidTarget(null)
          setViewing(null)
        }}
      />
    </div>
  )
}
