import { useState } from 'react'
import { Download, RefreshCw, Receipt } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import { useSecondHandPurchases } from '@/hooks/use-second-hand-purchases'
import {
  useSecondHandSales,
  secondHandSalesQueryKey,
  joinSaleWithPurchase,
  type SecondHandSaleWithId,
} from '@/hooks/use-second-hand-sales'
import { useAuth } from '@/hooks/use-auth'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatTimestamp } from '@/lib/utils'
import { PrintButtonGroup } from './device-purchase-page'
import { purchaseDetailSections, purchaseTimeline } from './purchase-detail-sections'

export function SaleRegisterPage() {
  const { data: sales = [], isLoading } = useSecondHandSales()
  const { data: purchases = [] } = useSecondHandPurchases()
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [viewing, setViewing] = useState<SecondHandSaleWithId | null>(null)

  const bounds = dateRangeBounds(dateRange)
  const filtered = sales
    .filter((s) => !bounds || ((s.createdAt?.toDate?.() ?? new Date(0)) >= bounds.from && (s.createdAt?.toDate?.() ?? new Date(0)) <= bounds.to))
    .filter((s) =>
      search.trim() ? `${s.saleNumber} ${s.deviceLabel} ${s.buyerName}`.toLowerCase().includes(search.toLowerCase()) : true
    )

  const totalSales = filtered.reduce((sum, s) => sum + s.salePrice, 0)
  const totalProfit = filtered.reduce((sum, s) => sum + s.profit, 0)
  const totalInvested = filtered.reduce((sum, s) => sum + s.purchasePrice + s.refurbCost, 0)
  const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0

  const columns: DataTableColumn<SecondHandSaleWithId>[] = [
    {
      key: 'saleNumber',
      header: 'Sale Invoice #',
      render: (s) => (
        <div>
          <p className="font-semibold">{s.saleNumber}</p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(s.createdAt, false)}</p>
        </div>
      ),
    },
    { key: 'device', header: 'Device', render: (s) => s.deviceLabel },
    { key: 'buyer', header: 'Buyer', hideOnMobile: true, render: (s) => s.buyerName },
    { key: 'invested', header: 'Invested', hideOnMobile: true, render: (s) => `₹${s.purchasePrice + s.refurbCost}` },
    { key: 'salePrice', header: 'Sale Price', sortValue: (s) => s.salePrice, render: (s) => `₹${s.salePrice}` },
    {
      key: 'profit',
      header: 'Profit',
      sortValue: (s) => s.profit,
      render: (s) => <span className={s.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>₹{s.profit}</span>,
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Receipt}
        title="Sale Register"
        subtitle="All device sales — profit, margin and export"
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
              Export CSV
            </Button>
            <Button type="button" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: secondHandSalesQueryKey(profile?.companyId) })}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        <StatCard label="Sales (₹)" value={`₹${totalSales}`} />
        <StatCard label="Profit (₹)" value={`₹${totalProfit}`} tone={totalProfit >= 0 ? 'success' : 'danger'} />
        <StatCard label="Sales" value={filtered.length} />
      </div>
      {totalInvested > 0 && (
        <p className="text-sm text-muted-foreground">↗ Average margin: {avgMargin.toFixed(1)}%</p>
      )}

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Receipt/invoice #, brand, model..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={Receipt} title="No sales yet" description="Devices sold from Device Sale will appear here." />}
      />

      {viewing && (() => {
        const { purchase } = joinSaleWithPurchase(viewing, purchases)
        return (
          <DetailDrawer
            open
            onOpenChange={(open) => !open && setViewing(null)}
            icon={Receipt}
            title={viewing.saleNumber}
            subtitle={viewing.deviceLabel}
            badges={<StatusBadge status="Sold" tone="info" />}
            actions={<PrintButtonGroup sale={viewing} />}
            sections={purchase ? purchaseDetailSections(purchase, viewing) : []}
            timeline={purchase ? purchaseTimeline(purchase, viewing) : undefined}
          />
        )
      })()}
    </div>
  )
}
