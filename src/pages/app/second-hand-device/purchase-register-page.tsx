import { useState } from 'react'
import { Download, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useSecondHandPurchases,
  deviceLabel,
  type SecondHandPurchaseWithId,
} from '@/hooks/use-second-hand-purchases'
import { useAllServiceOptions } from '@/hooks/use-service-options'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatTimestamp } from '@/lib/utils'
import { PrintButtonGroup } from './device-purchase-page'
import {
  purchaseDetailSections,
  purchaseTimeline,
  PURCHASE_STATUS_LABEL,
  PURCHASE_STATUS_TONE,
} from './purchase-detail-sections'
import { useTranslation } from 'react-i18next'

export function PurchaseRegisterPage() {
  const { t } = useTranslation()
  const { data: purchases = [], isLoading, error: loadError, refetch } = useSecondHandPurchases()
  const { data: options } = useAllServiceOptions()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewing, setViewing] = useState<SecondHandPurchaseWithId | null>(null)

  const bounds = dateRangeBounds(dateRange)
  const filtered = purchases
    .filter(
      (p) =>
        !bounds ||
        ((p.createdAt?.toDate?.() ?? new Date(0)) >= bounds.from &&
          (p.createdAt?.toDate?.() ?? new Date(0)) <= bounds.to)
    )
    .filter((p) => deviceTypeFilter === 'all' || p.deviceTypeId === deviceTypeFilter)
    .filter((p) => statusFilter === 'all' || p.status === statusFilter)
    .filter((p) =>
      search.trim()
        ? `${p.purchaseNumber} ${deviceLabel(p)} ${p.sellerName}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    )

  const totalPurchases = filtered.reduce((sum, p) => sum + p.purchasePrice, 0)

  const columns: DataTableColumn<SecondHandPurchaseWithId>[] = [
    {
      key: 'purchaseNumber',
      header: t('shared.purchase'),
      render: (p) => (
        <div>
          <p className="font-semibold">{p.purchaseNumber}</p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(p.purchaseDate, false)}</p>
        </div>
      ),
    },
    { key: 'device', header: t('common.device'), render: (p) => deviceLabel(p) },
    { key: 'seller', header: t('shared.seller'), hideOnMobile: true, render: (p) => p.sellerName },
    {
      key: 'price',
      header: t('common.purchasePrice'),
      sortValue: (p) => p.purchasePrice,
      render: (p) => `₹${p.purchasePrice}`,
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
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={ClipboardList}
        title={t('pages.secondHandDevice.purchaseRegister.purchaseRegister')}
        subtitle={t('pages.secondHandDevice.purchaseRegister.allDevicePurchasesFilterSearchAnd')}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                downloadCsv(
                  'purchase-register.csv',
                  filtered.map((p) => ({
                    'Purchase #': p.purchaseNumber,
                    Device: deviceLabel(p),
                    Seller: p.sellerName,
                    'Purchase Price': p.purchasePrice,
                    Status: t(PURCHASE_STATUS_LABEL[p.status]),
                  }))
                )
              }
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </>
        }
      />

      <StatCardGrid>
        <StatCard
          label={t('pages.secondHandDevice.purchaseRegister.purchases')}
          value={`₹${totalPurchases}`}
        />
        <StatCard
          label={t('pages.secondHandDevice.purchaseRegister.purchases')}
          value={filtered.length}
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('shared.receiptInvoiceBrandModel')}
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      >
        <Select value={deviceTypeFilter} onValueChange={(v) => v && setDeviceTypeFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('pages.secondHandDevice.purchaseRegister.allDeviceTypes')}
            </SelectItem>
            {(options?.deviceTypes ?? []).map((dt) => (
              <SelectItem key={dt.id} value={dt.id}>
                {dt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.allStatuses')}</SelectItem>
            <SelectItem value="inStock">{t('shared.inStock')}</SelectItem>
            <SelectItem value="inRefurb">{t('shared.inRefurb')}</SelectItem>
            <SelectItem value="sold">{t('common.sold')}</SelectItem>
            <SelectItem value="returnedToSeller">{t('shared.returnedToSeller')}</SelectItem>
          </SelectContent>
        </Select>
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
            icon={ClipboardList}
            title={t('pages.secondHandDevice.purchaseRegister.noPurchasesFound')}
            description={t(
              'pages.secondHandDevice.purchaseRegister.purchasesRecordedFromDevicePurchaseWill'
            )}
          />
        }
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={ClipboardList}
          title={viewing.purchaseNumber}
          subtitle={deviceLabel(viewing)}
          badges={
            <StatusBadge
              status={t(PURCHASE_STATUS_LABEL[viewing.status])}
              tone={PURCHASE_STATUS_TONE[viewing.status]}
            />
          }
          actions={<PrintButtonGroup purchase={viewing} />}
          sections={purchaseDetailSections(viewing, t)}
          timeline={purchaseTimeline(viewing, t)}
        />
      )}
    </div>
  )
}
