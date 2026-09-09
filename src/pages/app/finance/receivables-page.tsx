import { useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { useReceivables, type ReceivableRow, type AgingBucket } from '@/hooks/use-receivables'
import { formatTimestamp } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

const BUCKET_LABELS: Record<AgingBucket, string> = {
  '0-30': 'pages.finance.receivables.030Days',
  '30-60': 'pages.finance.receivables.3060Days',
  '60-90': 'pages.finance.receivables.6090Days',
  '90+': 'pages.finance.receivables.90Days',
}

export function ReceivablesPage() {
  const { t } = useTranslation()
  const { data, isLoading, error: loadError, refetch } = useReceivables()
  const [search, setSearch] = useState('')

  const filtered = data.rows.filter((r) =>
    search.trim()
      ? `${r.job.jobNumber} ${r.job.customerName} ${r.job.customerMobile}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true
  )

  const columns: DataTableColumn<ReceivableRow>[] = [
    {
      key: 'job',
      header: t('common.jobCard'),
      render: (r) => <span className="font-semibold">{r.job.jobNumber}</span>,
    },
    {
      key: 'customer',
      header: t('common.customer'),
      render: (r) => (
        <div>
          <p className="font-medium">{r.job.customerName}</p>
          <p className="text-xs text-muted-foreground">{r.job.customerMobile}</p>
        </div>
      ),
    },
    {
      key: 'device',
      header: t('common.device'),
      hideOnMobile: true,
      render: (r) =>
        [r.job.brandName, r.job.model].filter(Boolean).join(' ') || r.job.deviceTypeName,
    },
    {
      key: 'created',
      header: t('common.createdAt'),
      hideOnMobile: true,
      render: (r) => formatTimestamp(r.job.createdAt),
    },
    {
      key: 'aging',
      header: t('pages.finance.receivables.aging'),
      sortValue: (r) => r.daysOld,
      render: (r) => `${r.daysOld}d (${t(BUCKET_LABELS[r.bucket])})`,
    },
    {
      key: 'outstanding',
      header: t('common.outstanding'),
      sortValue: (r) => r.outstanding,
      render: (r) => <span className="font-medium text-red-600">₹{r.outstanding}</span>,
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={AlertTriangle}
        title={t('pages.finance.receivables.receivables')}
        subtitle={t('pages.finance.receivables.outstandingAmountsAcrossEveryActiveJob')}
      />

      <StatCardGrid>
        <StatCard
          label={t('shared.totalOutstanding')}
          value={`₹${data.totalOutstanding}`}
          tone="danger"
        />
        <StatCard label={t('shared.totalBilled')} value={`₹${data.totalBilled}`} tone="purple" />
        <StatCard
          label={t('shared.totalCollected')}
          value={`₹${data.totalCollected}`}
          tone="success"
        />
        <StatCard
          label={t('pages.finance.receivables.collection')}
          value={`${data.collectionPercent}%`}
          tone="info"
        />
      </StatCardGrid>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(BUCKET_LABELS) as AgingBucket[]).map((b) => (
          <StatCard
            key={b}
            label={t(BUCKET_LABELS[b])}
            value={`₹${data.buckets[b]}`}
            tone={b === '90+' ? 'danger' : b === '60-90' ? 'warning' : 'default'}
          />
        ))}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('shared.searchJobCardCustomerMobile')}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.job.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={Search}
            title={t('pages.finance.receivables.noOutstandingReceivables')}
            description={t('pages.finance.receivables.allPaymentsAreUpToDate')}
          />
        }
      />
    </div>
  )
}
