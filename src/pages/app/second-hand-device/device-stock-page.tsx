import { useState } from 'react'
import { Boxes, Clock, IndianRupee } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
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
import {
  purchaseDetailSections,
  purchaseTimeline,
  PURCHASE_STATUS_LABEL,
  PURCHASE_STATUS_TONE,
} from './purchase-detail-sections'
import { useTranslation } from 'react-i18next'

// `new Date().getTime()`, not the bare `Date.now()` call — the latter is flagged by this
// project's React Compiler config as an impure call even when it's a plain helper function
// invoked during render (see PROGRESS.md's Phase 6 notes for the same fix elsewhere).
function daysInStock(p: SecondHandPurchaseWithId) {
  const created = p.createdAt?.toDate?.()
  if (!created) return 0
  return Math.floor((new Date().getTime() - created.getTime()) / 86_400_000)
}

export function DeviceStockPage() {
  const { t } = useTranslation()
  const { data: purchases = [], isLoading, error: loadError, refetch } = useSecondHandPurchases()
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [viewing, setViewing] = useState<SecondHandPurchaseWithId | null>(null)

  const stock = purchases.filter((p) => p.status === 'inStock' || p.status === 'inRefurb')
  const bounds = dateRangeBounds(dateRange)
  const filtered = stock
    .filter(
      (p) =>
        !bounds ||
        ((p.createdAt?.toDate?.() ?? new Date(0)) >= bounds.from &&
          (p.createdAt?.toDate?.() ?? new Date(0)) <= bounds.to)
    )
    .filter((p) =>
      search.trim()
        ? `${p.purchaseNumber} ${deviceLabel(p)}`.toLowerCase().includes(search.toLowerCase())
        : true
    )

  const totalInvested = stock.reduce((sum, p) => sum + p.purchasePrice + p.refurbCost, 0)
  const aging = stock.filter((p) => daysInStock(p) > 30).length

  const columns: DataTableColumn<SecondHandPurchaseWithId>[] = [
    { key: 'purchaseNumber', header: t('shared.purchase'), render: (p) => p.purchaseNumber },
    {
      key: 'device',
      header: t('common.device'),
      render: (p) => (
        <div>
          <p className="font-medium">{deviceLabel(p)}</p>
          <p className="text-xs text-muted-foreground">
            {[p.deviceTypeName, p.imei, `Grade ${p.conditionGrade}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (p) => (
        <StatusBadge
          status={t(PURCHASE_STATUS_LABEL[p.status])}
          tone={PURCHASE_STATUS_TONE[p.status]}
        />
      ),
    },
    {
      key: 'purchasePrice',
      header: t('common.purchasePrice'),
      hideOnMobile: true,
      render: (p) => `₹${p.purchasePrice}`,
    },
    {
      key: 'refurbCost',
      header: t('shared.refurbCost'),
      hideOnMobile: true,
      render: (p) => (p.refurbCost > 0 ? `₹${p.refurbCost}` : '—'),
    },
    {
      key: 'invested',
      header: t('shared.invested'),
      render: (p) => `₹${p.purchasePrice + p.refurbCost}`,
    },
    {
      key: 'expectedSalePrice',
      header: t('shared.expectedSalePrice'),
      hideOnMobile: true,
      render: (p) => (p.expectedSalePrice != null ? `₹${p.expectedSalePrice}` : '—'),
    },
    {
      key: 'daysInStock',
      header: t('pages.secondHandDevice.deviceStock.daysInStock'),
      sortValue: (p) => daysInStock(p),
      render: (p) => (
        <span className={daysInStock(p) > 30 ? 'font-medium text-amber-600' : ''}>
          {daysInStock(p)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Boxes}
        title={t('pages.secondHandDevice.deviceStock.deviceStock')}
        subtitle={t('pages.secondHandDevice.deviceStock.secondHandDevicesCurrentlyInStock')}
      />

      <StatCardGrid>
        <StatCard label={t('shared.inStock')} value={stock.length} icon={Boxes} tone="success" />
        <StatCard
          label={t('pages.secondHandDevice.deviceStock.totalInvested')}
          icon={IndianRupee}
          value={`₹${totalInvested}`}
        />
        <StatCard
          label="Aging > 30 days"
          value={aging}
          icon={Clock}
          tone={aging > 0 ? 'warning' : 'default'}
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.secondHandDevice.deviceStock.searchStock')}
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      />

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
            icon={Boxes}
            title={t('pages.secondHandDevice.deviceStock.noDevicesInStock')}
            description={t('pages.secondHandDevice.deviceStock.devicesYouPurchaseWillShowUp')}
          />
        }
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={Boxes}
          title={viewing.purchaseNumber}
          subtitle={deviceLabel(viewing)}
          badges={
            <StatusBadge
              status={t(PURCHASE_STATUS_LABEL[viewing.status])}
              tone={PURCHASE_STATUS_TONE[viewing.status]}
            />
          }
          sections={purchaseDetailSections(viewing, t)}
          timeline={purchaseTimeline(viewing, t)}
        />
      )}
    </div>
  )
}
