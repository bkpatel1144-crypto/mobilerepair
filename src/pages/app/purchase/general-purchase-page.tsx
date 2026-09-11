import { useState } from 'react'
import {
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Eye,
  Ban,
  Printer,
  ListChecks,
  IndianRupee,
  Building2,
} from 'lucide-react'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  usePurchases,
  useCreatePurchase,
  useCancelPurchase,
  purchaseTotal,
  purchaseSummary,
  type PurchaseLine,
  type PurchaseTerms,
  type PurchaseWithId,
} from '@/hooks/use-purchases'
import { useParties, useCreateParty } from '@/hooks/use-parties'
import { useItems } from '@/hooks/use-items'
import { usePermissions } from '@/hooks/use-permissions'
import { formatTimestamp } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const TERMS: { key: PurchaseTerms; labelKey: string }[] = [
  { key: 'credit', labelKey: 'pages.purchase.generalPurchase.creditPayLater' },
  { key: 'cash', labelKey: 'common.cash' },
  { key: 'upi', labelKey: 'common.upi' },
  { key: 'card', labelKey: 'common.card' },
]

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * Purchase > General Purchase — parts and stock bought from suppliers.
 *
 * Two kinds of entry share this list, which is why the number says which is which. One is
 * raised from a job card and numbered `JPU-…`, shown with a "From Job" badge and the job it
 * belongs to; the other is typed in here and numbered `PUR-…`.
 *
 * A cancelled entry keeps its lines and its total on screen under a red banner, with an Edit
 * history explaining what happened to the money. It is left out of "This list value" and
 * "Owed to suppliers" though — the shop neither holds those parts nor owes for them.
 */
export function GeneralPurchasePage() {
  const { t } = useTranslation()
  const { data: purchases = [], isLoading, error: loadError, refetch } = usePurchases()
  const { data: parties = [] } = useParties()
  const { data: items = [] } = useItems()
  const { canDo } = usePermissions()
  const canManage = canDo('PURCHASE_GENERAL_PURCHASE_CREATE')

  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<PurchaseWithId | null>(null)
  const [cancelling, setCancelling] = useState<PurchaseWithId | null>(null)

  const create = useCreatePurchase()
  const cancel = useCancelPurchase()

  const q = search.trim().toLowerCase()
  const rows = q
    ? purchases.filter(
        (p) =>
          p.purchaseNumber.toLowerCase().includes(q) ||
          (p.invoiceNumber ?? '').toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q)
      )
    : purchases
  const summary = purchaseSummary(rows)

  const columns: DataTableColumn<PurchaseWithId>[] = [
    {
      key: 'number',
      header: t('pages.purchase.generalPurchase.purchaseNo'),
      sortValue: (p) => p.purchaseNumber,
      render: (p) => (
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{p.purchaseNumber}</span>
            {p.sourceJobCardId && (
              <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                {t('pages.purchase.generalPurchase.fromJob')}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {formatTimestamp(p.createdAt as never)}
            {p.sourceJobCardNumber
              ? ` · ${t('pages.purchase.generalPurchase.partsFor', { job: p.sourceJobCardNumber })}`
              : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'supplier',
      header: t('common.supplier'),
      sortValue: (p) => p.supplierName,
      render: (p) => <span>{p.supplierName || '—'}</span>,
    },
    {
      key: 'items',
      header: t('pages.purchase.generalPurchase.items'),
      hideOnMobile: true,
      render: (p) => t('pages.purchase.generalPurchase.nItems', { count: p.lines.length }),
    },
    {
      key: 'amount',
      header: t('common.amount'),
      sortValue: (p) => p.total,
      render: (p) => <span className="font-medium">{money(p.total)}</span>,
    },
    {
      key: 'payment',
      header: t('common.payment'),
      hideOnMobile: true,
      render: (p) =>
        p.amountPaid > 0 ? (
          <span className="text-emerald-700 dark:text-emerald-400">{money(p.amountPaid)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (p) =>
        p.status === 'cancelled' ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/15 dark:text-red-400">
            {t('common.cancelled')}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            {t('common.active')}
          </span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${p.purchaseNumber}`}
              >
                <span className="text-lg leading-none">⋮</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewing(p)}>
              <Eye className="size-4" />
              {t('common.view')}
            </DropdownMenuItem>
            {canManage && p.status === 'active' && (
              <DropdownMenuItem onClick={() => setCancelling(p)}>
                <Ban className="size-4" />
                {t('pages.purchase.generalPurchase.cancelEntry')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{t('pages.purchase.generalPurchase.generalPurchase')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('pages.purchase.generalPurchase.buyPartsAccessories')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="size-4" />
            {t('common.refresh')}
          </Button>
          {canManage && (
            <Button type="button" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              {t('pages.purchase.generalPurchase.newPurchase')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label={t('pages.purchase.generalPurchase.totalEntries')}
          value={String(summary.totalEntries)}
        />
        <StatCard
          icon={PackagePlus}
          label={t('common.active')}
          value={String(summary.active)}
          tone="success"
        />
        <StatCard
          icon={IndianRupee}
          label={t('pages.purchase.generalPurchase.thisListValue')}
          value={money(summary.listValue)}
          tone="info"
        />
        <StatCard
          icon={Building2}
          label={t('pages.purchase.generalPurchase.owedToSuppliers')}
          value={money(summary.owedToSuppliers)}
          tone="warning"
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('pages.purchase.generalPurchase.searchPurchaseInvoice')}
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={PackagePlus}
            title={t('pages.purchase.generalPurchase.noPurchasesYet')}
            description={t('pages.purchase.generalPurchase.recordWhatYouBuy')}
          />
        }
      />

      {creating && (
        <NewPurchaseModal
          parties={parties}
          items={items}
          onClose={() => setCreating(false)}
          onSave={(input) => create.mutate(input, { onSuccess: () => setCreating(false) })}
          isSaving={create.isPending}
        />
      )}

      <PurchaseViewModal purchase={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={cancelling != null}
        onOpenChange={(o) => !o && setCancelling(null)}
        title={cancelling ? `${t('pages.purchase.generalPurchase.cancelEntry')} ${cancelling.purchaseNumber}?` : ''}
        message={t('pages.purchase.generalPurchase.aCancelledEntryStops')}
        confirmLabel={t('pages.purchase.generalPurchase.cancelEntry')}
        destructive
        onConfirm={() => {
          if (cancelling)
            cancel.mutate(
              { purchase: cancelling, reason: t('pages.purchase.generalPurchase.cancelledByUser') },
              { onSuccess: () => setCancelling(null) }
            )
        }}
      />
    </div>
  )
}

function PurchaseViewModal({
  purchase,
  onClose,
}: {
  purchase: PurchaseWithId | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  if (!purchase) return null
  const termsLabel =
    purchase.terms === 'credit'
      ? t('pages.purchase.generalPurchase.onCredit')
      : t(TERMS.find((x) => x.key === purchase.terms)?.labelKey ?? 'common.cash')

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle>{purchase.purchaseNumber}</DialogTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              {t('pages.purchase.generalPurchase.printReceipt')}
            </Button>
          </div>
        </DialogHeader>

        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t('common.supplier')}</dt>
            <dd className="font-medium">{purchase.supplierName || '—'}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t('pages.purchase.generalPurchase.invoiceNo')}</dt>
            <dd className="font-medium">{purchase.invoiceNumber || '—'}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">
              {t('pages.purchase.generalPurchase.purchaseTerms')}
            </dt>
            <dd className="font-medium">{termsLabel}</dd>
          </div>
        </dl>

        <div className="space-y-1.5">
          {purchase.lines.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{l.itemName}</p>
                <p className="text-xs text-muted-foreground">
                  {l.qty} × ₹{l.rate}
                </p>
              </div>
              <span className="font-semibold">{money(l.qty * l.rate)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="font-semibold">{t('common.total')}</span>
          <span className="text-lg font-bold">{money(purchase.total)}</span>
        </div>

        {purchase.status === 'cancelled' && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {t('common.cancelled')}: {purchase.cancelReason}
          </p>
        )}

        {purchase.editHistory.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">
              {t('pages.purchase.generalPurchase.editHistory')}
            </p>
            {purchase.editHistory.map((e, i) => (
              <div key={i} className="rounded-lg border bg-muted/30 px-3 py-2 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="font-medium">• {e.label}</span>
                  <span className="text-muted-foreground">
                    {new Date(e.at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">
                  {money(e.fromTotal)} → {money(e.toTotal)}{' '}
                  <span className="text-emerald-700 dark:text-emerald-400">
                    ({e.toTotal - e.fromTotal >= 0 ? '+' : '−'}
                    {money(Math.abs(e.toTotal - e.fromTotal))})
                  </span>{' '}
                  · {e.fromItems} → {e.toItems} {t('pages.purchase.generalPurchase.itemsLower')}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function NewPurchaseModal({
  parties,
  items,
  onClose,
  onSave,
  isSaving,
}: {
  parties: ReturnType<typeof useParties>['data']
  items: ReturnType<typeof useItems>['data']
  onClose: () => void
  onSave: (input: {
    supplierId: string | null
    supplierName: string
    invoiceNumber: string | null
    terms: PurchaseTerms
    lines: PurchaseLine[]
    notes: string | null
  }) => void
  isSaving: boolean
}) {
  const { t } = useTranslation()
  const createParty = useCreateParty()
  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [supplierName, setSupplierName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [terms, setTerms] = useState<PurchaseTerms>('credit')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<PurchaseLine[]>([
    { id: crypto.randomUUID(), itemId: null, itemName: '', qty: 1, rate: 0 },
  ])

  const supplierOptions = (parties ?? [])
    .filter((p) => p.partyTypes.includes('supplier') || p.partyTypes.length === 0)
    .map((p) => ({ id: p.id, label: p.name, helper: p.mobile }))
  const itemOptions = (items ?? []).map((i) => ({ id: i.id, label: i.name, helper: i.itemCode }))

  const patch = (id: string, p: Partial<PurchaseLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...p } : l)))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!supplierId) return setError(t('pages.purchase.generalPurchase.chooseASupplier'))
    const filled = lines.filter((l) => l.itemId && l.qty > 0)
    if (filled.length === 0) return setError(t('pages.purchase.generalPurchase.addAtLeastOneItem'))
    onSave({
      supplierId,
      supplierName,
      invoiceNumber: invoiceNumber.trim() || null,
      terms,
      lines: filled,
      notes: notes.trim() || null,
    })
  }

  return (
    <FormModal
      open
      onOpenChange={(o) => !o && onClose()}
      title={t('pages.purchase.generalPurchase.newPurchaseEntry')}
      error={error}
      onSubmit={handleSubmit}
      submitLabel={t('pages.purchase.generalPurchase.savePurchase')}
      isSubmitting={isSaving}
      className="sm:max-w-xl"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            {t('common.supplier')} <span className="text-red-600">*</span>
          </Label>
          <SearchSelect
            options={supplierOptions}
            value={supplierId}
            onChange={(id) => {
              setSupplierId(id)
              setSupplierName(supplierOptions.find((s) => s.id === id)?.label ?? '')
            }}
            onCreateNew={(name) => {
              void createParty
                .mutateAsync({ name: name.trim(), mobile: '', partyTypes: ['supplier'] })
                .then((p) => {
                  setSupplierId(p.id)
                  setSupplierName(p.name)
                })
            }}
            placeholder={t('pages.purchase.generalPurchase.selectSupplier')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invoiceNumber">
            {t('pages.purchase.generalPurchase.invoiceNumber')}
          </Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder={t('pages.purchase.generalPurchase.suppliersInvoice')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>
            {t('pages.purchase.generalPurchase.items')} <span className="text-red-600">*</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                { id: crypto.randomUUID(), itemId: null, itemName: '', qty: 1, rate: 0 },
              ])
            }
          >
            <Plus className="size-4" />
            {t('pages.purchase.generalPurchase.addRow')}
          </Button>
        </div>
        {lines.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchSelect
                options={itemOptions}
                value={l.itemId}
                onChange={(id) => {
                  const item = (items ?? []).find((i) => i.id === id)
                  patch(l.id, {
                    itemId: id,
                    itemName: item?.name ?? '',
                    itemCode: item?.itemCode,
                    rate: l.rate || (item?.purchasePrice ?? 0),
                  })
                }}
                placeholder={t('pages.purchase.generalPurchase.selectItem')}
              />
            </div>
            <Input
              className="w-16"
              inputMode="numeric"
              aria-label={t('common.quantity')}
              value={String(l.qty)}
              onChange={(e) => patch(l.id, { qty: Number(e.target.value) || 0 })}
            />
            <Input
              className="w-24"
              inputMode="numeric"
              aria-label={t('common.rate')}
              value={String(l.rate)}
              onChange={(e) => patch(l.id, { rate: Number(e.target.value) || 0 })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('common.remove')}
              className="shrink-0 text-red-600 hover:bg-red-50"
              onClick={() => setLines((prev) => prev.filter((x) => x.id !== l.id))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <p className="text-right text-sm font-semibold">
          {t('common.total')}: {money(purchaseTotal(lines))}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>{t('pages.purchase.generalPurchase.paymentMode')}</Label>
        <Select value={terms} onValueChange={(v) => v && setTerms(v as PurchaseTerms)}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TERMS.map((x) => (
              <SelectItem key={x.key} value={x.key}>
                {t(x.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="purchaseNotes">{t('common.notes')}</Label>
        <Textarea
          id="purchaseNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('pages.purchase.generalPurchase.optionalNotes')}
          rows={3}
        />
      </div>
    </FormModal>
  )
}
