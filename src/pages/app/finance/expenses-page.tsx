import { useState } from 'react'
import {
  Wallet,
  Plus,
  Ban,
  Pencil,
  IndianRupee,
  Receipt as ReceiptIcon,
  Tag,
  Download,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { FormModal } from '@/components/shared/form-modal'
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
  useUpdateExpense,
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

/**
 * One modal for recording an expense and for correcting one.
 *
 * `editing` is what switches it. The alternative — a second, nearly identical modal — is how
 * the two drift: the create form grows a field, the edit form does not, and the only way to
 * set that field on an existing row becomes voiding it and typing it again.
 */
function ExpenseModal({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** An existing expense to correct, or `null` to record a new one. */
  editing?: ExpenseWithId | null
}) {
  const { t } = useTranslation()
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const { data: categories = [] } = useExpenseCategories()
  const createCategory = useCreateExpenseCategory()
  const { data: parties = [] } = useParties()
  const { data: modes = [] } = usePaymentModes()

  const today = toDateInputValue(new Date())

  /* Initialised from `editing`, not synced to it.
   *
   * The first version prefilled in a `useEffect`, which the React Compiler rejects outright —
   * setting state from an effect on every open is a cascading render, and it is also the wrong
   * shape: these fields are a *draft*, owned by the form, seeded once. The call site gives the
   * modal a `key` so React remounts it when the row changes, which re-runs these initialisers
   * and costs nothing. */
  const [date, setDate] = useState(() =>
    editing ? toDateInputValue(editing.expenseDate.toDate()) : today
  )
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null)
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [mode, setMode] = useState<ExpenseDoc['mode']>(editing?.mode ?? 'cash')
  const [partyId, setPartyId] = useState<string | null>(editing?.paidToPartyId ?? null)
  const [notes, setNotes] = useState(editing?.notes ?? '')
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

  // `FormModal` renders a real `<form onSubmit={…}>`: without `preventDefault` the browser
  // submits it natively, the page navigates, and the mutation is killed mid-flight. Company
  // Settings silently saved nothing at all for exactly this reason.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    const fields = {
      expenseDate: new Date(`${date}T00:00:00`),
      categoryId: category.id,
      categoryName: category.name,
      amount: value,
      mode,
      paidToPartyId: party?.id ?? null,
      paidToPartyName: party?.name ?? null,
      notes: notes.trim() || null,
    }
    try {
      if (editing) await update.mutateAsync({ expense: editing, ...fields })
      else await create.mutateAsync(fields)
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
      needsConnection={true}
      error={error}
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
      title={editing ? t('pages.finance.expenses.editExpense') : t('pages.finance.expenses.newExpense')}
      description={t('pages.finance.expenses.recordedAsMoneyOutItAppears')}
      submitLabel={
        create.isPending || update.isPending
          ? t('shared.saving')
          : editing
            ? t('common.save')
            : t('pages.finance.expenses.recordExpense')
      }
      isSubmitting={create.isPending}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
        <div className="space-y-1.5">
          <Label htmlFor="exp-date">
            {t('common.date')} <span className="text-red-600">*</span>
          </Label>
          <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exp-amount">
            {t('common.amount')} <span className="text-red-600">*</span>
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
          {t('common.category')} <span className="text-red-600">*</span>
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
          {t('pages.finance.expenses.paidBy')} <span className="text-red-600">*</span>
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
          {t('pages.finance.expenses.paidTo')}{' '}
          <span className="text-xs font-normal text-muted-foreground">{t('shared.optional')}</span>
        </Label>
        <SearchSelect
          options={parties.map((p) => ({ id: p.id, label: p.name, helper: p.mobile || undefined }))}
          value={partyId}
          onChange={setPartyId}
          placeholder={t('pages.finance.expenses.landlordSupplierStaff')}
        />
        <p className="text-xs text-muted-foreground">
          {t('pages.finance.expenses.setThisToHaveTheExpense')}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="exp-notes">
          {t('common.notes')}{' '}
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
  const [editTarget, setEditTarget] = useState<ExpenseWithId | null>(null)

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
          <div className="flex items-center justify-end gap-0.5">
            {/* Correcting an amount used to mean voiding the row and typing it again, which
             * burns an EXP- number, leaves a voided line in the list for ever, and makes one
             * mistyped expense look like two expenses. */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${t('common.edit')} ${e.expenseNumber}`}
              onClick={(ev) => {
                ev.stopPropagation()
                setEditTarget(e)
              }}
            >
              <Pencil className="size-4" />
            </Button>
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
          </div>
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
              {t('shared.exportCsv')}
            </Button>
            <Button type="button" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" />
              {t('pages.finance.expenses.newExpense')}
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
            {t('shared.allTime')}
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
                {t('pages.finance.expenses.newExpense')}
              </Button>
            }
          />
        }
      />

      <ExpenseModal open={newOpen} onOpenChange={setNewOpen} />

      {/* `key` so the draft is rebuilt for each row — without it, opening a second expense
        * after a first would show the first one's values. */}
      <ExpenseModal
        key={editTarget?.id ?? 'none'}
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        editing={editTarget}
      />

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
