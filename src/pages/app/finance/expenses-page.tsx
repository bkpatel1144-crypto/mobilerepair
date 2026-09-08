import { useState } from 'react'
import { Wallet, Plus, Ban, IndianRupee, Receipt as ReceiptIcon, Tag, Download } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
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
  useExpenses,
  useCreateExpense,
  useVoidExpense,
  type ExpenseWithId,
} from '@/hooks/use-expenses'
import { useExpenseCategories, useCreateExpenseCategory } from '@/hooks/use-expense-categories'
import { useParties } from '@/hooks/use-parties'
import { usePaymentModes } from '@/hooks/use-payment-modes'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatTimestamp, toDateInputValue } from '@/lib/utils'
import type { ExpenseDoc } from '@/types/firestore'
import { useTranslation } from 'react-i18next'

/** Maps a Payment Modes master row onto the three modes `ReceiptDoc` actually stores. The
 * receipt schema is a fixed union, so a shop that adds "Paytm" as a mode still records the
 * underlying instrument — otherwise the mode master and the receipt would drift apart. */
function modeFromName(name: string): ExpenseDoc['mode'] {
  const n = name.toLowerCase()
  if (n.includes('card')) return 'card'
  if (n.includes('cash')) return 'cash'
  return 'upi'
}

function NewExpenseModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { t } = useTranslation()
  const create = useCreateExpense()
  const { data: categories = [] } = useExpenseCategories()
  const createCategory = useCreateExpenseCategory()
  const { data: parties = [] } = useParties()
  const { data: modes = [] } = usePaymentModes()

  const today = toDateInputValue(new Date())
  const [date, setDate] = useState(today)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<ExpenseDoc['mode']>('cash')
  const [partyId, setPartyId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const category = categories.find((c) => c.id === categoryId)
  const party = parties.find((p) => p.id === partyId)

  function reset() {
    setDate(today)
    setCategoryId(null)
    setAmount('')
    setMode('cash')
    setPartyId(null)
    setNotes('')
    setError(null)
  }

  async function handleSubmit() {
    setError(null)
    const value = Number(amount)
    if (!category) {
      setError(t('pages.finance.expenses.pickACategory'))
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('shared.enterAnAmountGreaterThanZero'))
      return
    }
    try {
      await create.mutateAsync({
        expenseDate: new Date(`${date}T00:00:00`),
        categoryId: category.id,
        categoryName: category.name,
        amount: value,
        mode,
        paidToPartyId: party?.id ?? null,
        paidToPartyName: party?.name ?? null,
        notes: notes.trim() || null,
      })
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('pages.finance.expenses.couldNotRecordThisExpense')
      )
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
      title={t('pages.finance.expenses.newExpense')}
      description={t('pages.finance.expenses.recordedAsMoneyOutItAppears')}
      submitLabel={create.isPending ? 'Saving…' : t('pages.finance.expenses.recordExpense')}
      isSubmitting={create.isPending}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
        <div className="space-y-1.5">
          <Label htmlFor="exp-date">
            Date <span className="text-red-600">*</span>
          </Label>
          <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-amount">
            Amount <span className="text-red-600">*</span>
          </Label>
          <Input
            id="exp-amount"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>
          Category <span className="text-red-600">*</span>
        </Label>
        <SearchSelect
          options={categories.map((c) => ({ id: c.id, label: c.name }))}
          value={categoryId}
          onChange={setCategoryId}
          placeholder={t('pages.finance.expenses.searchCategory')}
          onCreateNew={(name) =>
            createCategory.mutate(
              { name, existingCount: categories.length },
              { onSuccess: (id) => setCategoryId(id) }
            )
          }
        />
      </div>

      <div className="space-y-1.5">
        <Label>
          Paid by <span className="text-red-600">*</span>
        </Label>
        <Select value={mode} onValueChange={(v) => v && setMode(v as ExpenseDoc['mode'])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Falls back to the fixed three if a shop has emptied its Payment Modes master. */}
            {(modes.length > 0
              ? modes.map((m) => ({ value: modeFromName(m.name), label: m.name }))
              : [
                  { value: 'cash' as const, label: t('common.cash') },
                  { value: 'upi' as const, label: t('shared.upi') },
                  { value: 'card' as const, label: t('common.cardMode') },
                ]
            ).map((m, i) => (
              <SelectItem key={`${m.value}-${i}`} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>
          Paid to{' '}
          <span className="text-xs font-normal text-muted-foreground">{t('shared.optional')}</span>
        </Label>
        <SearchSelect
          options={parties.map((p) => ({ id: p.id, label: p.name, helper: p.mobile || undefined }))}
          value={partyId}
          onChange={setPartyId}
          placeholder={t('pages.finance.expenses.landlordSupplierStaff')}
        />
        <p className="text-xs text-muted-foreground">
          Set this to have the expense show on that party's ledger. Leave empty for things like tea
          or transport.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-notes">
          Notes{' '}
          <span className="text-xs font-normal text-muted-foreground">{t('shared.optional')}</span>
        </Label>
        <Textarea
          id="exp-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. September rent"
        />
      </div>

      {error && <FormError message={error} />}
    </FormModal>
  )
}

export function ExpensesPage() {
  const { t } = useTranslation()
  const { data: expenses = [], isLoading, error: loadError, refetch } = useExpenses()
  const voidExpense = useVoidExpense()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('month')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [newOpen, setNewOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<ExpenseWithId | null>(null)

  const { data: categories = [] } = useExpenseCategories()

  const bounds = dateRangeBounds(dateRange)
  const inRange = expenses.filter((e) => {
    if (!bounds) return true
    const d = e.expenseDate?.toDate?.()
    return !!d && d >= bounds.from && d <= bounds.to
  })

  const filtered = inRange
    .filter((e) => categoryFilter === 'all' || e.categoryId === categoryFilter)
    .filter((e) =>
      search.trim()
        ? `${e.expenseNumber} ${e.categoryName} ${e.paidToPartyName ?? ''} ${e.notes ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    )

  // Voided rows stay visible but never count — same treatment the Receipts page gives a voided
  // payment, so a total can always be reconciled against the list above it.
  const live = filtered.filter((e) => !e.voided)
  const total = live.reduce((sum, e) => sum + e.amount, 0)

  const byCategory = new Map<string, number>()
  for (const e of live)
    byCategory.set(e.categoryName, (byCategory.get(e.categoryName) ?? 0) + e.amount)
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0]

  const columns: DataTableColumn<ExpenseWithId>[] = [
    {
      key: 'expenseNumber',
      header: t('pages.finance.expenses.expense'),
      sortValue: (e) => e.expenseNumber,
      render: (e) => (
        <div>
          <p className="font-semibold">{e.expenseNumber}</p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(e.expenseDate, false)}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: t('common.category'),
      sortValue: (e) => e.categoryName,
      render: (e) => e.categoryName,
    },
    {
      key: 'paidTo',
      header: t('pages.finance.expenses.paidTo'),
      hideOnMobile: true,
      render: (e) => e.paidToPartyName ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'mode',
      header: t('common.mode'),
      hideOnMobile: true,
      render: (e) => e.mode.toUpperCase(),
    },
    {
      key: 'amount',
      header: t('common.amount'),
      sortValue: (e) => e.amount,
      render: (e) => (
        <span
          className={e.voided ? 'text-muted-foreground line-through' : 'font-medium text-red-600'}
        >
          ₹{e.amount}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (e) =>
        e.voided ? (
          <StatusBadge status={t('common.voided')} tone="neutral" />
        ) : (
          <StatusBadge status={t('pages.finance.expenses.posted')} tone="success" />
        ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      className: 'text-right',
      render: (e) =>
        e.voided ? null : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Void ${e.expenseNumber}`}
            className="text-red-600"
            onClick={(ev) => {
              ev.stopPropagation()
              setVoidTarget(e)
            }}
          >
            <Ban className="size-4" />
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Wallet}
        title={t('common.expensesLabel')}
        subtitle={t('pages.finance.expenses.shopRunningCostsRentSalariesUtilities')}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={live.length === 0}
              onClick={() =>
                downloadCsv(
                  'expenses.csv',
                  live.map((e) => ({
                    'Expense #': e.expenseNumber,
                    Date: formatTimestamp(e.expenseDate, false),
                    Category: e.categoryName,
                    'Paid To': e.paidToPartyName ?? '',
                    Mode: e.mode,
                    Amount: e.amount,
                    Notes: e.notes ?? '',
                  }))
                )
              }
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button type="button" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" />
              New Expense
            </Button>
          </>
        }
      />

      <StatCardGrid>
        <StatCard label={t('common.total')} value={`₹${total}`} icon={IndianRupee} tone="danger" />
        <StatCard label={t('shared.entries')} value={live.length} icon={ReceiptIcon} />
        <StatCard
          label={t('pages.finance.expenses.topCategory')}
          value={topCategory ? `₹${topCategory[1]}` : '—'}
          sublabel={topCategory?.[0]}
          icon={Tag}
          tone="warning"
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.finance.expenses.searchExpenseCategoryPartyNotes')}
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      >
        <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('common.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.allCategories')}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {dateRange !== 'all' && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setDateRange('all')}>
            All time
          </Button>
        )}
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={Wallet}
            title={t('pages.finance.expenses.noExpensesInThisPeriod')}
            description={t('pages.finance.expenses.recordRentSalariesAndOtherRunning')}
            action={
              <Button type="button" onClick={() => setNewOpen(true)}>
                <Plus className="size-4" />
                New Expense
              </Button>
            }
          />
        }
      />

      <NewExpenseModal open={newOpen} onOpenChange={setNewOpen} />

      <ConfirmDialog
        open={!!voidTarget}
        onOpenChange={(o) => !o && setVoidTarget(null)}
        title={t('pages.finance.expenses.voidThisExpense')}
        message={
          voidTarget
            ? `${voidTarget.expenseNumber} (₹${voidTarget.amount}) stays on the list marked Voided and stops counting towards totals. Its cash-book entry is voided at the same time.`
            : ''
        }
        confirmLabel={t('pages.finance.expenses.void')}
        isPending={voidExpense.isPending}
        onConfirm={async () => {
          if (voidTarget) await voidExpense.mutateAsync(voidTarget)
          setVoidTarget(null)
        }}
      />
    </div>
  )
}
