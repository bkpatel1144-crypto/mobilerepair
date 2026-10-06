import { useState } from 'react'
import { Ban, Download, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { FormModal } from '@/components/shared/form-modal'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import { useSecondHandPurchases } from '@/hooks/use-second-hand-purchases'
import {
  useSecondHandSales,
  isLiveSale,
  useVoidSecondHandSale,
  joinSaleWithPurchase,
  type SecondHandSaleWithId,
} from '@/hooks/use-second-hand-sales'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatTimestamp } from '@/lib/utils'
import { PrintButtonGroup } from './device-purchase-page'
import { purchaseDetailSections, purchaseTimeline } from './purchase-detail-sections'
import { useTranslation } from 'react-i18next'

export function SaleRegisterPage() {
  const { t } = useTranslation()
  const { data: sales = [], isLoading, error: loadError, refetch } = useSecondHandSales()
  const { data: purchases = [] } = useSecondHandPurchases()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [viewing, setViewing] = useState<SecondHandSaleWithId | null>(null)
  /* A sale is reversed from here because this is the only screen that lists sales — the Device
   * Sale page lists purchases that are still available to sell. */
  const [voiding, setVoiding] = useState<SecondHandSaleWithId | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const voidSale = useVoidSecondHandSale()

  const bounds = dateRangeBounds(dateRange)
  const filtered = sales
    .filter(
      (s) =>
        !bounds ||
        ((s.createdAt?.toDate?.() ?? new Date(0)) >= bounds.from &&
          (s.createdAt?.toDate?.() ?? new Date(0)) <= bounds.to)
    )
    .filter((s) =>
      search.trim()
        ? `${s.saleNumber} ${s.deviceLabel} ${s.buyerName}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    )

  // A reversed sale is still a row in the register — it happened and was undone — but it is
  // not revenue, and it is not profit.
  const counted = filtered.filter(isLiveSale)
  const totalSales = counted.reduce((sum, s) => sum + s.salePrice, 0)
  const totalProfit = counted.reduce((sum, s) => sum + s.profit, 0)
  const totalInvested = filtered.reduce((sum, s) => sum + s.purchasePrice + s.refurbCost, 0)
  const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0

  const columns: DataTableColumn<SecondHandSaleWithId>[] = [
    {
      key: 'saleNumber',
      header: t('shared.saleInvoice'),
      render: (s) => (
        <div>
          <p className="font-semibold">{s.saleNumber}</p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(s.createdAt, false)}</p>
        </div>
      ),
    },
    { key: 'device', header: t('common.device'), render: (s) => s.deviceLabel },
    { key: 'buyer', header: t('shared.buyer'), hideOnMobile: true, render: (s) => s.buyerName },
    {
      key: 'invested',
      header: t('shared.invested'),
      hideOnMobile: true,
      render: (s) => `₹${s.purchasePrice + s.refurbCost}`,
    },
    {
      key: 'salePrice',
      header: t('common.salePrice'),
      sortValue: (s) => s.salePrice,
      render: (s) => `₹${s.salePrice}`,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s) =>
        isLiveSale(s) ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-red-600"
            aria-label={t('pages.secondHandDevice.saleRegister.voidSale')}
            onClick={(e) => {
              e.stopPropagation()
              setVoidReason('')
              setVoiding(s)
            }}
          >
            <Ban className="size-4" />
          </Button>
        ) : (
          <StatusBadge status={t('pages.secondHandDevice.saleRegister.voided')} tone="danger" />
        ),
    },
    {
      key: 'profit',
      header: t('common.profit'),
      sortValue: (s) => s.profit,
      render: (s) => (
        <span className={s.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>₹{s.profit}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Receipt}
        title={t('pages.secondHandDevice.saleRegister.saleRegister')}
        subtitle={t('pages.secondHandDevice.saleRegister.allDeviceSalesProfitMarginAnd')}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                downloadCsv(
                  'sale-register.csv',
                  filtered.map((s) => ({
                    'Sale Invoice #': s.saleNumber,
                    Device: s.deviceLabel,
                    Buyer: s.buyerName,
                    Invested: s.purchasePrice + s.refurbCost,
                    'Sale Price': s.salePrice,
                    Profit: s.profit,
                  }))
                )
              }
            >
              <Download className="size-4" />
              {t('shared.exportCsv')}
            </Button>
          </>
        }
      />

      <StatCardGrid>
        <StatCard label={t('pages.secondHandDevice.saleRegister.sales')} value={`₹${totalSales}`} />
        <StatCard
          label={t('pages.secondHandDevice.saleRegister.profit')}
          value={`₹${totalProfit}`}
          tone={totalProfit >= 0 ? 'success' : 'danger'}
        />
        <StatCard label={t('pages.secondHandDevice.saleRegister.sales')} value={filtered.length} />
      </StatCardGrid>
      {totalInvested > 0 && (
        <p className="text-sm text-muted-foreground">↗ Average margin: {avgMargin.toFixed(1)}%</p>
      )}

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('shared.receiptInvoiceBrandModel')}
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      />

      <FormModal
        needsConnection
        open={!!voiding}
        onOpenChange={(o: boolean) => !o && setVoiding(null)}
        title={t('pages.secondHandDevice.saleRegister.voidSaleTitle', {
          number: voiding?.saleNumber ?? '',
        })}
        submitLabel={t('pages.secondHandDevice.saleRegister.voidSale')}
        isSubmitting={voidSale.isPending}
        error={voidSale.error ? voidSale.error.message : null}
        onSubmit={async (e: React.FormEvent) => {
          e.preventDefault()
          if (!voiding || !voidReason.trim()) return
          try {
            await voidSale.mutateAsync({ sale: voiding, reason: voidReason.trim() })
          } catch {
            return // the modal stays open and says why
          }
          setVoiding(null)
        }}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('pages.secondHandDevice.saleRegister.voidSaleMessage', {
              device: voiding?.deviceLabel ?? '',
            })}
          </p>
          {/* Required. Reversing a sale moves money and stock, and six months later the only
           * thing that explains it is what someone typed here. */}
          <div className="space-y-1.5">
            <Label htmlFor="void-reason">
              {t('pages.secondHandDevice.saleRegister.voidReason')}
              <span className="text-red-600"> *</span>
            </Label>
            <Textarea
              id="void-reason"
              rows={2}
              value={voidReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVoidReason(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </FormModal>

      <DataTable
        columns={columns}
        rowClassName={(s) => (isLiveSale(s) ? undefined : 'opacity-55 line-through')}
        data={filtered}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        onRowClick={setViewing}
        emptyState={
          <EmptyState
            icon={Receipt}
            title={t('pages.secondHandDevice.saleRegister.noSalesYet')}
            description={t('pages.secondHandDevice.saleRegister.devicesSoldFromDeviceSaleWill')}
          />
        }
      />

      {viewing &&
        (() => {
          const { purchase } = joinSaleWithPurchase(viewing, purchases)
          return (
            <DetailDrawer
              open
              onOpenChange={(open) => !open && setViewing(null)}
              icon={Receipt}
              title={viewing.saleNumber}
              subtitle={viewing.deviceLabel}
              badges={<StatusBadge status={t('common.sold')} tone="info" />}
              actions={<PrintButtonGroup sale={viewing} />}
              sections={purchase ? purchaseDetailSections(purchase, t, viewing) : []}
              timeline={purchase ? purchaseTimeline(purchase, t, viewing) : undefined}
            />
          )
        })()}
    </div>
  )
}
