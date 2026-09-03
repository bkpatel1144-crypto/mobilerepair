import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { Button } from '@/components/ui/button'
import { useReceivables, type ReceivableRow, type AgingBucket } from '@/hooks/use-receivables'
import { jobCardsQueryKey } from '@/hooks/use-job-cards'
import { useAuth } from '@/hooks/use-auth'
import { formatTimestamp } from '@/lib/utils'

const BUCKET_LABELS: Record<AgingBucket, string> = {
  '0-30': '0-30 days',
  '30-60': '30-60 days',
  '60-90': '60-90 days',
  '90+': '90+ days',
}

export function ReceivablesPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading } = useReceivables()
  const [search, setSearch] = useState('')

  const filtered = data.rows.filter((r) =>
    search.trim()
      ? `${r.job.jobNumber} ${r.job.customerName} ${r.job.customerMobile}`.toLowerCase().includes(search.toLowerCase())
      : true
  )

  const columns: DataTableColumn<ReceivableRow>[] = [
    { key: 'job', header: 'Job Card', render: (r) => <span className="font-semibold">{r.job.jobNumber}</span> },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => (
        <div>
          <p className="font-medium">{r.job.customerName}</p>
          <p className="text-xs text-muted-foreground">{r.job.customerMobile}</p>
        </div>
      ),
    },
    { key: 'device', header: 'Device', hideOnMobile: true, render: (r) => [r.job.brandName, r.job.model].filter(Boolean).join(' ') || r.job.deviceTypeName },
    { key: 'created', header: 'Created', hideOnMobile: true, render: (r) => formatTimestamp(r.job.createdAt) },
    { key: 'aging', header: 'Aging', sortValue: (r) => r.daysOld, render: (r) => `${r.daysOld}d (${BUCKET_LABELS[r.bucket]})` },
    { key: 'outstanding', header: 'Outstanding', sortValue: (r) => r.outstanding, render: (r) => <span className="font-medium text-red-600">₹{r.outstanding}</span> },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={AlertTriangle}
        title="Receivables"
        subtitle="Outstanding amounts across every active job card"
        actions={
          <Button type="button" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: jobCardsQueryKey(profile?.companyId) })}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Outstanding" value={`₹${data.totalOutstanding}`} tone="danger" />
        <StatCard label="Total Billed" value={`₹${data.totalBilled}`} tone="purple" />
        <StatCard label="Total Collected" value={`₹${data.totalCollected}`} tone="success" />
        <StatCard label="Collection %" value={`${data.collectionPercent}%`} tone="info" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(BUCKET_LABELS) as AgingBucket[]).map((b) => (
          <StatCard key={b} label={BUCKET_LABELS[b]} value={`₹${data.buckets[b]}`} tone={b === '90+' ? 'danger' : b === '60-90' ? 'warning' : 'default'} />
        ))}
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search job card, customer, mobile..." />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.job.id}
        isLoading={isLoading}
        emptyState={
          <EmptyState
            icon={Search}
            title="No outstanding receivables"
            description="All payments are up to date."
          />
        }
      />
    </div>
  )
}
