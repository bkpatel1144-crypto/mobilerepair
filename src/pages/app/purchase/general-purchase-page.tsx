import { useState } from 'react'
import {
  PackagePlus,
  Plus,
  Trash2,
  Ban,
  IndianRupee,
  AlertTriangle,
  Building,
  ListOrdered,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { SearchSelect } from '@/components/shared/search-select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  usePurchases,
  useCreatePurchase,
  useSetPurchaseStatus,
  type PurchaseWithId,
} from '@/hooks/use-purchases'
import { useParties } from '@/hooks/use-parties'
import { useItems } from '@/hooks/use-items'
import { usePaymentModes } from '@/hooks/use-payment-modes'
import { usePermissions } from '@/hooks/use-permissions'
import { dateRangeBounds } from '@/lib/date-range'
import { formatTimestamp, toDateInputValue } from '@/lib/utils'
import type { PurchaseLine } from '@/types/firestore'
import { useTranslation } from 'react-i18next'

/**
 * Purchase > General Purchase (Parts & Stock).
 *
 * Recording what the shop bought from a supplier — the spend side that Supplier Payables has
 * always reported against but nothing in the app could enter. Lines come from Item Master rather
 * than free text, so a purchase is tied to the same items job cards consume.
 */
export function GeneralPurchasePage() {
  const { t } = useTranslation()
  const { data: purchases = [], isLoading, error: loadError, refetch } = usePurchases()
  const { canDo } = usePermissions()
  const canCreate = canDo('PURCHASE_GENERAL_PURCHASE_CREATE')
  const canManage = canDo('PURCHASE_GENERAL_PURCHASE_UPDATE')

  const [search, setSearch] = useState('')
  const [range, setRange] = useState<DateRangeKey | undefined>(undefined)
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<PurchaseWithId | null>(null)

  const bounds = range ? dateRangeBounds(range) : null
  const filtered = purchases
    .filter((p) => {
      if (!bounds) return true
      const date = p.createdAt?.toDate?.()
      return !!date && date >= bounds.from && date <= bounds.to
    })
    .filter((p) =>
      `${p.purchaseNumber} ${p.supplierName} ${p.invoiceNumber ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )

  const active = purchases.filter((p) => p.status === 'active')
  const totalSpend = active.reduce((sum, p) => sum + p.subtotal, 0)
  const outstanding = active.reduce((sum, p) => sum + (p.subtotal - p.amountPaid), 0)

  const columns: DataTableColumn<PurchaseWithId>[] = [
    {
      key: 'number',
      header: t('pages.purchase.generalPurchase.purchaseNo'),
      sortValue: (p) => p.purchaseNumber,
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium tabular-nums">{p.purchaseNumber}</p>
          <p className="text-xs text-muted-foreground">{p.purchaseDate}</p>
        </div>
      ),
    },
    {
      key: 'supplier',
      header: t('common.supplier'),
      render: (p) => <span className="truncate">{p.supplierName}</span>,
    },
    {
      key: 'lines',
      header: t('pages.purchase.generalPurchase.lines'),
      hideOnMobile: true,
      sortValue: (p) => p.lines.length,
      render: (p) => p.lines.length,
    },
    {
      key: 'total',
      header: t('common.grandTotal'),
      sortValue: (p) => p.subtotal,
      render: (p) => <span className="tabular-nums">₹{p.subtotal}</span>,
    },
    {
      key: 'due',
      header: t('common.due'),
      hideOnMobile: true,
      sortValue: (p) => p.subtotal - p.amountPaid,
      render: (p) => {
        const due = p.subtotal - p.amountPaid
        return (
          <span className={due > 0 ? 'font-medium text-red-600 tabular-nums' : 'tabular-nums'}>
            ₹{due}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (p) => (
        <StatusBadge status={p.status === 'active' ? 'Active' : t('common.cancelled')} />
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={PackagePlus}
        title={t('pages.purchase.generalPurchase.generalPurchase')}
        subtitle={t('pages.purchase.generalPurchase.partsAndStockBoughtFromSuppliers')}
        actions={
          canCreate && (
            <Button type="button" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              {t('pages.purchase.generalPurchase.recordPurchase')}
            </Button>
          )
        }
      />

      <StatCardGrid>
        <StatCard label={t('common.total')} value={purchases.length} icon={ListOrdered} />
        <StatCard
          label={t('pages.purchase.generalPurchase.totalSpend')}
          value={`₹${totalSpend}`}
          icon={IndianRupee}
          tone="success"
        />
        <StatCard
          label={t('shared.totalOutstanding')}
          value={`₹${outstanding}`}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label={t('common.suppliers')}
          value={new Set(active.map((p) => p.supplierId)).size}
          icon={Building}
          tone="info"
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.purchase.generalPurchase.searchPurchases')}
        dateRange={range}
        onDateRangeChange={setRange}
      >
        {range && (
          <Button type="button" variant="outline" size="sm" onClick={() => setRange(undefined)}>
            {t('common.allTime')}
          </Button>
        )}
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        onRowClick={setViewing}
        emptyState={
          <EmptyState
            icon={PackagePlus}
            title={t('pages.purchase.generalPurchase.noPurchasesYet')}
            description={t('pages.purchase.generalPurchase.recordWhatYouBuyFromSuppliers')}
          />
        }
      />

      {creating && <PurchaseModal onClose={() => setCreating(false)} />}

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={PackagePlus}
          title={viewing.purchaseNumber}
          subtitle={viewing.supplierName}
          badges={
            <StatusBadge status={viewing.status === 'active' ? 'Active' : t('common.cancelled')} />
          }
          actions={
            canManage &&
            viewing.status === 'active' && (
              <CancelPurchaseButton purchase={viewing} onDone={() => setViewing(null)} />
            )
          }
          sections={[
            {
              title: t('common.summary'),
              icon: PackagePlus,
              rows: [
                { label: t('common.supplier'), value: viewing.supplierName },
                { label: t('common.date'), value: viewing.purchaseDate },
                {
                  label: t('pages.purchase.generalPurchase.supplierInvoiceNo'),
                  value: viewing.invoiceNumber || '—',
                },
                { label: t('common.paymentMode'), value: viewing.paymentMode || '—' },
                { label: t('common.grandTotal'), value: `₹${viewing.subtotal}` },
                { label: t('common.paid'), value: `₹${viewing.amountPaid}` },
                {
                  label: t('common.due'),
                  value: `₹${viewing.subtotal - viewing.amountPaid}`,
                  tone: viewing.subtotal - viewing.amountPaid > 0 ? 'danger' : 'success',
                },
                { label: t('common.createdBy'), value: viewing.createdByName },
              ],
            },
            {
              title: t('pages.purchase.generalPurchase.lines'),
              icon: ListOrdered,
              tone: 'blue',
              children: (
                <div className="overflow-hidden rounded-xl border">
                  {viewing.lines.map((line, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border-t px-3 py-2 text-sm first:border-t-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{line.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {line.qty} {line.uom} × ₹{line.rate}
                        </p>
                      </div>
                      <span className="shrink-0 font-medium tabular-nums">₹{line.amount}</span>
                    </div>
                  ))}
                </div>
              ),
            },
            ...(viewing.notes
              ? [
                  {
                    title: t('common.notes'),
                    rows: [{ label: t('common.notes'), value: viewing.notes, wide: true }],
                  },
                ]
              : []),
          ]}
          timeline={[
            { title: t('common.createdAt'), timestamp: formatTimestamp(viewing.createdAt) },
            { title: t('common.updatedAt'), timestamp: formatTimestamp(viewing.updatedAt) },
          ]}
        />
      )}
    </div>
  )
}

function PurchaseModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const create = useCreatePurchase()
  const { data: parties = [] } = useParties()
  const { data: items = [] } = useItems()
  const { data: paymentModes = [] } = usePaymentModes()

  const suppliers = parties.filter(
    (p) => p.type === 'supplier' || p.partyTypes?.includes('supplier')
  )

  const [supplierId, setSupplierId] = useState<string | null>(null)
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState(toDateInputValue(new Date()))
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [lines, setLines] = useState<PurchaseLine[]>([])
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0)

  function addLine(itemId: string) {
    const item = items.find((i) => i.id === itemId)
    if (!item || lines.some((l) => l.itemId === itemId)) return
    setLines((prev) => [
      ...prev,
      {
        itemId: item.id,
        itemName: item.name,
        itemCode: item.itemCode,
        uom: item.primaryUom.symbol,
        qty: 1,
        rate: item.purchasePrice ?? 0,
        amount: item.purchasePrice ?? 0,
      },
    ])
  }

  function patchLine(index: number, patch: Partial<PurchaseLine>) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line
        const next = { ...line, ...patch }
        // The amount is always derived here, never typed — a stored total that disagrees with
        // its own qty × rate is the kind of thing nobody notices until the books do not balance.
        return { ...next, amount: Math.round(next.qty * next.rate * 100) / 100 }
      })
    )
  }

  const supplier = suppliers.find((s) => s.id === supplierId)

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={t('pages.purchase.generalPurchase.recordPurchase')}
      error={error}
      isSubmitting={create.isPending}
      submitLabel={t('common.save')}
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        if (!supplier) {
          setError(t('pages.purchase.generalPurchase.chooseASupplier'))
          return
        }
        if (!lines.length) {
          setError(t('pages.purchase.generalPurchase.addAtLeastOneLine'))
          return
        }
        create.mutate(
          {
            supplierId: supplier.id,
            supplierName: supplier.name,
            purchaseDate,
            invoiceNumber: invoiceNumber.trim() || null,
            lines,
            amountPaid: Number(amountPaid) || 0,
            paymentMode: paymentMode || null,
            notes: notes.trim() || null,
          },
          { onSuccess: onClose, onError: (err) => setError(err.message) }
        )
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>
            {t('common.supplier')} <span className="text-red-600">*</span>
          </Label>
          <SearchSelect
            options={suppliers.map((s) => ({ id: s.id, label: s.name, helper: s.mobile }))}
            value={supplierId}
            onChange={setSupplierId}
            placeholder={t('shared.searchSupplier')}
            open={supplierOpen}
            onOpenChange={setSupplierOpen}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('common.date')}</Label>
          <Input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('pages.purchase.generalPurchase.supplierInvoiceNo')}</Label>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder={t('shared.optional2')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label>
            {t('pages.purchase.generalPurchase.lines')} <span className="text-red-600">*</span>
          </Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('common.grandTotal')}: ₹{subtotal}
          </span>
        </div>

        {lines.map((line, i) => (
          <div key={line.itemId} className="flex items-end gap-2 rounded-lg border p-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{line.itemName}</p>
              <p className="text-xs text-muted-foreground">{line.itemCode}</p>
            </div>
            <div className="w-16 space-y-1">
              <Label className="text-[10px] uppercase">{t('common.quantity')}</Label>
              <Input
                type="number"
                inputMode="decimal"
                className="h-8"
                value={String(line.qty)}
                onChange={(e) => patchLine(i, { qty: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="w-20 space-y-1">
              <Label className="text-[10px] uppercase">{t('common.rate')}</Label>
              <Input
                type="number"
                inputMode="decimal"
                className="h-8"
                value={String(line.rate)}
                onChange={(e) => patchLine(i, { rate: Number(e.target.value) || 0 })}
              />
            </div>
            <span className="w-20 shrink-0 pb-2 text-right text-sm font-medium tabular-nums">
              ₹{line.amount}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-red-600"
              aria-label={t('common.remove')}
              onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}

        <SearchSelect
          options={items
            .filter((i) => !lines.some((l) => l.itemId === i.id))
            .map((i) => ({ id: i.id, label: i.name, helper: i.itemCode }))}
          value={null}
          onChange={(id) => id && addLine(id)}
          placeholder={t('pages.purchase.generalPurchase.addAnItem')}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t('common.paid')}</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            {t('common.due')}: ₹{Math.max(subtotal - (Number(amountPaid) || 0), 0)}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>{t('common.paymentMode')}</Label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm"
          >
            <option value="">—</option>
            {paymentModes.map((mode) => (
              <option key={mode.id} value={mode.name}>
                {mode.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t('common.notes')}</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={t('shared.optionalNotes')}
        />
      </div>
    </FormModal>
  )
}

function CancelPurchaseButton({
  purchase,
  onDone,
}: {
  purchase: PurchaseWithId
  onDone: () => void
}) {
  const { t } = useTranslation()
  const setStatus = useSetPurchaseStatus()
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
        <Ban className="size-3.5" />
        {t('common.cancel')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${t('common.cancel')} ${purchase.purchaseNumber}?`}
        message={t('pages.purchase.generalPurchase.aCancelledPurchaseStopsCounting')}
        confirmLabel={t('common.confirm')}
        destructive
        isPending={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(
            { id: purchase.id, status: 'disabled', purchaseNumber: purchase.purchaseNumber },
            {
              onSuccess: () => {
                setConfirming(false)
                onDone()
              },
            }
          )
        }
      />
    </>
  )
}
