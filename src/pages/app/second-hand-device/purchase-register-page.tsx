import { useState } from 'react'
import { Download, RefreshCw, ClipboardList } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useSecondHandPurchases,
  secondHandPurchasesQueryKey,
  deviceLabel,
  type SecondHandPurchaseWithId,
} from '@/hooks/use-second-hand-purchases'
import { useAllServiceOptions } from '@/hooks/use-service-options'
import { useAuth } from '@/hooks/use-auth'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatTimestamp } from '@/lib/utils'
import { PrintButtonGroup } from './device-purchase-page'
import { purchaseDetailSections, purchaseTimeline, PURCHASE_STATUS_LABEL, PURCHASE_STATUS_TONE } from './purchase-detail-sections'

export function PurchaseRegisterPage() {
  const { data: purchases = [], isLoading } = useSecondHandPurchases()
  const { data: options } = useAllServiceOptions()
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewing, setViewing] = useState<SecondHandPurchaseWithId | null>(null)

  const bounds = dateRangeBounds(dateRange)
  const filtered = purchases
    .filter((p) => !bounds || ((p.createdAt?.toDate?.() ?? new Date(0)) >= bounds.from && (p.createdAt?.toDate?.() ?? new Date(0)) <= bounds.to))
    .filter((p) => deviceTypeFilter === 'all' || p.deviceTypeId === deviceTypeFilter)
    .filter((p) => statusFilter === 'all' || p.status === statusFilter)
    .filter((p) =>
      search.trim() ? `${p.purchaseNumber} ${deviceLabel(p)} ${p.sellerName}`.toLowerCase().includes(search.toLowerCase()) : true
    )

  const totalPurchases = filtered.reduce((sum, p) => sum + p.purchasePrice, 0)

  const columns: DataTableColumn<SecondHandPurchaseWithId>[] = [
    {
      key: 'purchaseNumber',
      header: 'Purchase #',
      render: (p) => (
        <div>
          <p className="font-semibold">{p.purchaseNumber}</p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(p.purchaseDate, false)}</p>
        </div>
      ),
    },
    { key: 'device', header: 'Device', render: (p) => deviceLabel(p) },
    { key: 'seller', header: 'Seller', hideOnMobile: true, render: (p) => p.sellerName },
    { key: 'price', header: 'Purchase Price', sortValue: (p) => p.purchasePrice, render: (p) => `₹${p.purchasePrice}` },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={PURCHASE_STATUS_LABEL[p.status]} tone={PURCHASE_STATUS_TONE[p.status]} /> },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={ClipboardList}
        title="Purchase Register"
        subtitle="All device purchases — filter, search and export"
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
                    Status: PURCHASE_STATUS_LABEL[p.status],
                  }))
                )
              }
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button type="button" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: secondHandPurchasesQueryKey(profile?.companyId) })}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Purchases (₹)" value={`₹${totalPurchases}`} />
        <StatCard label="Purchases" value={filtered.length} />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Receipt/invoice #, brand, model..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      >
        <Select value={deviceTypeFilter} onValueChange={(v) => v && setDeviceTypeFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Device Types</SelectItem>
            {(options?.deviceTypes ?? []).map((dt) => <SelectItem key={dt.id} value={dt.id}>{dt.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="inStock">In Stock</SelectItem>
            <SelectItem value="inRefurb">In Refurb</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="returnedToSeller">Returned to Seller</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={ClipboardList} title="No purchases found" description="Purchases recorded from Device Purchase will appear here." />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={ClipboardList}
          title={viewing.purchaseNumber}
          subtitle={deviceLabel(viewing)}
          badges={<StatusBadge status={PURCHASE_STATUS_LABEL[viewing.status]} tone={PURCHASE_STATUS_TONE[viewing.status]} />}
          actions={<PrintButtonGroup purchase={viewing} />}
          sections={purchaseDetailSections(viewing)}
          timeline={purchaseTimeline(viewing)}
        />
      )}
    </div>
  )
}
