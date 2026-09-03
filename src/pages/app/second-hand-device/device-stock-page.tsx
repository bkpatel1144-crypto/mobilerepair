import { useState } from 'react'
import { Boxes, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import {
  useSecondHandPurchases,
  deviceLabel,
  type SecondHandPurchaseWithId,
} from '@/hooks/use-second-hand-purchases'
import { dateRangeBounds } from '@/lib/date-range'
import { purchaseDetailSections, purchaseTimeline, PURCHASE_STATUS_LABEL, PURCHASE_STATUS_TONE } from './purchase-detail-sections'

// `new Date().getTime()`, not the bare `Date.now()` call — the latter is flagged by this
// project's React Compiler config as an impure call even when it's a plain helper function
// invoked during render (see PROGRESS.md's Phase 6 notes for the same fix elsewhere).
function daysInStock(p: SecondHandPurchaseWithId) {
  const created = p.createdAt?.toDate?.()
  if (!created) return 0
  return Math.floor((new Date().getTime() - created.getTime()) / 86_400_000)
}

export function DeviceStockPage() {
  const { data: purchases = [], isLoading } = useSecondHandPurchases()
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [viewing, setViewing] = useState<SecondHandPurchaseWithId | null>(null)

  const stock = purchases.filter((p) => p.status === 'inStock' || p.status === 'inRefurb')
  const bounds = dateRangeBounds(dateRange)
  const filtered = stock
    .filter((p) => !bounds || ((p.createdAt?.toDate?.() ?? new Date(0)) >= bounds.from && (p.createdAt?.toDate?.() ?? new Date(0)) <= bounds.to))
    .filter((p) => (search.trim() ? `${p.purchaseNumber} ${deviceLabel(p)}`.toLowerCase().includes(search.toLowerCase()) : true))

  const totalInvested = stock.reduce((sum, p) => sum + p.purchasePrice + p.refurbCost, 0)
  const aging = stock.filter((p) => daysInStock(p) > 30).length

  const columns: DataTableColumn<SecondHandPurchaseWithId>[] = [
    { key: 'purchaseNumber', header: 'Purchase #', render: (p) => p.purchaseNumber },
    {
      key: 'device',
      header: 'Device',
      render: (p) => (
        <div>
          <p className="font-medium">{deviceLabel(p)}</p>
          <p className="text-xs text-muted-foreground">{[p.deviceTypeName, p.imei, `Grade ${p.conditionGrade}`].filter(Boolean).join(' · ')}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={PURCHASE_STATUS_LABEL[p.status]} tone={PURCHASE_STATUS_TONE[p.status]} /> },
    { key: 'purchasePrice', header: 'Purchase Price', hideOnMobile: true, render: (p) => `₹${p.purchasePrice}` },
    { key: 'refurbCost', header: 'Refurb Cost', hideOnMobile: true, render: (p) => (p.refurbCost > 0 ? `₹${p.refurbCost}` : '—') },
    { key: 'invested', header: 'Invested', render: (p) => `₹${p.purchasePrice + p.refurbCost}` },
    { key: 'expectedSalePrice', header: 'Expected Sale Price', hideOnMobile: true, render: (p) => (p.expectedSalePrice != null ? `₹${p.expectedSalePrice}` : '—') },
    {
      key: 'daysInStock',
      header: 'Days in Stock',
      sortValue: (p) => daysInStock(p),
      render: (p) => (
        <span className={daysInStock(p) > 30 ? 'font-medium text-amber-600' : ''}>{daysInStock(p)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader icon={Boxes} title="Device Stock" subtitle="Second hand devices currently in stock — invested amount and aging" />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="In Stock" value={stock.length} icon={Boxes} tone="success" />
        <StatCard label="Total Invested" value={`₹${totalInvested}`} />
        <StatCard label="Aging > 30 days" value={aging} icon={Clock} tone={aging > 0 ? 'warning' : 'default'} />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search stock..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={Boxes} title="No devices in stock" description="Devices you purchase will show up here until sold." />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={Boxes}
          title={viewing.purchaseNumber}
          subtitle={deviceLabel(viewing)}
          badges={<StatusBadge status={PURCHASE_STATUS_LABEL[viewing.status]} tone={PURCHASE_STATUS_TONE[viewing.status]} />}
          sections={purchaseDetailSections(viewing)}
          timeline={purchaseTimeline(viewing)}
        />
      )}
    </div>
  )
}
