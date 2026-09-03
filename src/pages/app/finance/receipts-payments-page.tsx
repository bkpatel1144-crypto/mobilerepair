import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Wallet,
  RefreshCw,
  Plus,
  MoreVertical,
  Undo2,
  Search,
  Banknote,
  Smartphone,
  CreditCard,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchSelect } from '@/components/shared/search-select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useReceipts, useCreateReceiptOrPayment, useVoidReceipt, receiptsQueryKey, type ReceiptWithId } from '@/hooks/use-receipts'
import { useParties, useCreateParty } from '@/hooks/use-parties'
import { useJobCards } from '@/hooks/use-job-cards'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey, specialActionKey } from '@/config/permission-schema'
import { formatTimestamp } from '@/lib/utils'
import { dateRangeBounds } from '@/lib/date-range'

const MODE_ICONS = { cash: Banknote, upi: Smartphone, card: CreditCard } as const

export function ReceiptsPaymentsPage() {
  const { data: receipts = [], isLoading } = useReceipts()
  const { canDo, isOwner } = usePermissions()
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const voidReceipt = useVoidReceipt()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [modeFilter, setModeFilter] = useState<'all' | 'cash' | 'upi' | 'card'>('all')
  const [newEntryOpen, setNewEntryOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<ReceiptWithId | null>(null)

  const bounds = dateRangeBounds(dateRange)
  const active = receipts.filter((r) => !r.voided)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayReceived = active
    .filter((r) => r.direction === 'in' && (r.createdAt?.toDate?.() ?? new Date(0)) >= today)
    .reduce((s, r) => s + r.amount, 0)
  const netAmount = active.reduce((s, r) => s + (r.direction === 'in' ? r.amount : -r.amount), 0)
  const cashNet = active
    .filter((r) => r.mode === 'cash')
    .reduce((s, r) => s + (r.direction === 'in' ? r.amount : -r.amount), 0)

  const filtered = receipts
    .filter((r) => {
      if (!bounds) return true
      const at = r.createdAt?.toDate?.()
      return !!at && at >= bounds.from && at <= bounds.to
    })
    .filter((r) => modeFilter === 'all' || r.mode === modeFilter)
    .filter((r) =>
      search.trim()
        ? `${r.receiptNumber} ${r.partyName} ${r.jobCardNumber ?? ''}`.toLowerCase().includes(search.toLowerCase())
        : true
    )

  const canVoid = isOwner || canDo(specialActionKey('finance', 'voidReceipt'))

  const columns: DataTableColumn<ReceiptWithId>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{r.receiptNumber}</span>
          <span
            className={
              'rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase ' +
              (r.direction === 'in'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400')
            }
          >
            {r.direction === 'in' ? 'Advance' : 'Payment'}
          </span>
          {r.voided && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400">
              Voided
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'party',
      header: 'Party',
      render: (r) => (
        <div>
          <p className="font-medium">{r.partyName}</p>
        </div>
      ),
    },
    { key: 'against', header: 'Against', hideOnMobile: true, render: (r) => r.jobCardNumber ?? 'Manual / Advance' },
    {
      key: 'mode',
      header: 'Mode',
      render: (r) => <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium uppercase">{r.mode}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortValue: (r) => r.amount,
      render: (r) => (
        <span className={r.direction === 'in' ? 'text-emerald-600' : 'text-red-600'}>
          {r.direction === 'in' ? '+' : '−'}₹{r.amount}
        </span>
      ),
    },
    { key: 'date', header: 'Date', sortValue: (r) => r.createdAt?.toDate?.()?.getTime() ?? 0, render: (r) => formatTimestamp(r.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        !r.voided && canVoid ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setVoidTarget(r)
                }}
              >
                <Undo2 className="size-4" />
                Void Receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Wallet}
        title="Receipts & Payments"
        subtitle="All payment entries — Job Cards and manual"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: receiptsQueryKey(profile?.companyId) })}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            {canDo(crudKey('finance', 'receipts', 'create')) && (
              <Button type="button" onClick={() => setNewEntryOpen(true)}>
                <Plus className="size-4" />
                New Entry
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Today Received" value={`₹${todayReceived}`} sublabel={`${active.filter((r) => r.direction === 'in' && (r.createdAt?.toDate?.() ?? new Date(0)) >= today).length} receipts`} icon={Wallet} tone="success" />
        <StatCard label="Net Amount" value={`₹${netAmount}`} sublabel="After money out" tone="info" />
        <StatCard label="Cash · Net" value={`₹${cashNet}`} />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search receipt, party..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      >
        <Select value={modeFilter} onValueChange={(v) => v && setModeFilter(v as typeof modeFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyState={
          <EmptyState icon={Search} title="No receipts found" description="Receipts recorded here, and from Job Cards, will appear in this list." />
        }
      />

      <NewEntryDialog open={newEntryOpen} onOpenChange={setNewEntryOpen} />

      {voidTarget && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setVoidTarget(null)}
          title={`Void receipt "${voidTarget.receiptNumber}"?`}
          message={`This reverses ₹${voidTarget.amount} against ${voidTarget.partyName}${voidTarget.jobCardNumber ? ` (job ${voidTarget.jobCardNumber})` : ''} in the ledger and Cash Book. This cannot be undone.`}
          confirmLabel="Void Receipt"
          isPending={voidReceipt.isPending}
          onConfirm={() => voidReceipt.mutate(voidTarget, { onSuccess: () => setVoidTarget(null) })}
        />
      )}
    </div>
  )
}

function NewEntryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: parties = [] } = useParties()
  const { data: jobs = [] } = useJobCards()
  const createParty = useCreateParty()
  const createEntry = useCreateReceiptOrPayment()

  const [direction, setDirection] = useState<'in' | 'out'>('in')
  const [against, setAgainst] = useState<'jobCard' | 'manualAdvance'>('manualAdvance')
  const [partyId, setPartyId] = useState<string | null>(null)
  const [jobCardId, setJobCardId] = useState<string | null>(null)
  const [amount, setAmount] = useState(0)
  const [mode, setMode] = useState<'cash' | 'upi' | 'card'>('cash')
  const [notes, setNotes] = useState('')
  const [quickAddCustomer, setQuickAddCustomer] = useState<{ name: string; mobile: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setDirection('in')
    setAgainst('manualAdvance')
    setPartyId(null)
    setJobCardId(null)
    setAmount(0)
    setMode('cash')
    setNotes('')
    setQuickAddCustomer(null)
    setError(null)
  }

  const party = parties.find((p) => p.id === partyId)
  const partyJobs = jobs.filter((j) => j.customerId === partyId)
  const selectedJob = jobs.find((j) => j.id === jobCardId)

  async function handleSubmit() {
    setError(null)
    if (!party) {
      setError('Select a customer.')
      return
    }
    if (against === 'jobCard' && !selectedJob) {
      setError('Select a job card.')
      return
    }
    if (amount <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }
    await createEntry.mutateAsync({
      direction,
      partyId: party.id,
      partyName: party.name,
      against,
      jobCardId: selectedJob?.id ?? null,
      jobCardNumber: selectedJob?.jobNumber ?? null,
      amount,
      mode,
      notes: notes.trim() || null,
    })
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Entry</DialogTitle>
          <DialogDescription>Record a receipt or payment.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={direction === 'in' ? 'default' : 'outline'} onClick={() => setDirection('in')}>
            ₹ Receipt (IN)
          </Button>
          <Button type="button" variant={direction === 'out' ? 'default' : 'outline'} onClick={() => setDirection('out')}>
            ₹ Payment (OUT)
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>Customer *</Label>
          <SearchSelect
            options={parties.map((p) => ({ id: p.id, label: p.name, helper: p.mobile }))}
            value={partyId}
            onChange={(id) => {
              setPartyId(id)
              setJobCardId(null)
              if (id) setQuickAddCustomer(null)
            }}
            placeholder="Search customer..."
            onCreateNew={(query) => setQuickAddCustomer({ name: query, mobile: '' })}
          />
          {quickAddCustomer && !partyId && (
            <div className="flex gap-2 rounded-md border border-dashed p-2">
              <Input
                value={quickAddCustomer.name}
                onChange={(e) => setQuickAddCustomer({ ...quickAddCustomer, name: e.target.value })}
                placeholder="Customer name"
                className="h-8 text-sm"
              />
              <Input
                value={quickAddCustomer.mobile}
                onChange={(e) => setQuickAddCustomer({ ...quickAddCustomer, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit mobile"
                className="h-8 text-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  createParty.mutate(
                    { name: quickAddCustomer.name, mobile: quickAddCustomer.mobile },
                    { onSuccess: (p) => setPartyId(p.id) }
                  )
                }
              >
                Add
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Against</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={against === 'jobCard' ? 'default' : 'outline'} disabled={!partyId} onClick={() => setAgainst('jobCard')}>
              Job Card
            </Button>
            <Button type="button" variant={against === 'manualAdvance' ? 'default' : 'outline'} onClick={() => setAgainst('manualAdvance')}>
              Manual / Advance
            </Button>
          </div>
        </div>

        {against === 'jobCard' && (
          <div className="space-y-1.5">
            <Label>Job Card</Label>
            <SearchSelect
              options={partyJobs.map((j) => ({ id: j.id, label: j.jobNumber, helper: [j.brandName, j.model].filter(Boolean).join(' ') }))}
              value={jobCardId}
              onChange={setJobCardId}
              placeholder={partyId ? "Select this customer's job card..." : 'Pick a customer first'}
              disabled={!partyId}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Amount *</Label>
          <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        </div>

        <div className="space-y-1.5">
          <Label>Payment Mode</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'upi', 'card'] as const).map((m) => {
              const Icon = MODE_ICONS[m]
              return (
                <Button key={m} type="button" variant={mode === m ? 'default' : 'outline'} onClick={() => setMode(m)}>
                  <Icon className="size-4" />
                  {m.toUpperCase()}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Notes (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any note" rows={2} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={createEntry.isPending}>
            {createEntry.isPending ? 'Saving…' : direction === 'in' ? 'Record Receipt' : 'Record Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
