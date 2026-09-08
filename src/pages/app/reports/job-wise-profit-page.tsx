import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Download, IndianRupee, Percent, TrendingDown, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useCostedJobs, type CostedJobRow } from '@/hooks/use-reports'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import { useTranslation } from 'react-i18next'

function statusLabel(key: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

/** `preview (36)` — one row per Closed, *costed* job (`useCostedJobs()`; a job with no recorded
 * actual costing has no real profit number to show, so it's not part of this report at all —
 * matches the reference's own "Jobs: 1" count reflecting only the costed job, not every job
 * card ever created). */
export function JobWiseProfitPage() {
  const { t } = useTranslation()
  const { data: rows, isLoading, error: loadError, refetch } = useCostedJobs()
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const bounds = dateRangeBounds(dateRange, customFrom, customTo)
  const filtered = rows
    .filter((r) => !bounds || (r.date >= bounds.from && r.date <= bounds.to))
    .filter((r) =>
      search.trim()
        ? `${r.job.jobNumber} ${r.job.customerName} ${r.job.assignedToName ?? ''}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    )

  const totalRevenue = filtered.reduce((s, r) => s + r.revenue, 0)
  const totalCost = filtered.reduce((s, r) => s + r.cost, 0)
  const totalProfit = filtered.reduce((s, r) => s + r.profit, 0)
  const totals = {
    jobs: filtered.length,
    revenue: totalRevenue,
    cost: totalCost,
    profit: totalProfit,
    avgMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
  }

  const columns: DataTableColumn<CostedJobRow>[] = [
    {
      key: 'job',
      header: t('common.job'),
      sortValue: (r) => r.job.jobNumber,
      render: (r) => (
        <Link
          to={`/app/service/job-cards/${r.job.id}`}
          className="font-medium text-teal-700 hover:underline dark:text-teal-400"
        >
          {r.job.jobNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: t('common.customer'),
      sortValue: (r) => r.job.customerName,
      render: (r) => r.job.customerName,
    },
    {
      key: 'assignedTo',
      header: t('common.assignedTo'),
      hideOnMobile: true,
      render: (r) => r.job.assignedToName ?? '—',
    },
    {
      key: 'revenue',
      header: t('common.revenue'),
      sortValue: (r) => r.revenue,
      render: (r) => formatCurrency(r.revenue),
    },
    {
      key: 'cost',
      header: t('common.cost'),
      sortValue: (r) => r.cost,
      render: (r) => formatCurrency(r.cost),
    },
    {
      key: 'profit',
      header: t('common.profit'),
      sortValue: (r) => r.profit,
      render: (r) => (
        <span
          className={r.profit < 0 ? 'font-medium text-red-600' : 'font-medium text-emerald-600'}
        >
          {formatCurrency(r.profit)}
        </span>
      ),
    },
    {
      key: 'margin',
      header: t('common.margin'),
      sortValue: (r) => r.marginPct,
      render: (r) => (
        <span className={r.marginPct < 0 ? 'text-red-600' : 'text-emerald-600'}>
          {formatPercent(r.marginPct)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (r) => <StatusBadge status={statusLabel(r.job.status)} />,
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={BarChart3}
        title={t('pages.reports.jobWiseProfit.jobWiseProfit')}
        subtitle={t('pages.reports.jobWiseProfit.jobWiseProfitAndLossAnalysis')}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              downloadCsv(
                'job-wise-profit.csv',
                filtered.map((r) => ({
                  Job: r.job.jobNumber,
                  Customer: r.job.customerName,
                  'Assigned To': r.job.assignedToName ?? '',
                  Revenue: r.revenue,
                  Cost: r.cost,
                  Profit: r.profit,
                  'Margin %': r.marginPct.toFixed(2),
                  Status: statusLabel(r.job.status),
                }))
              )
            }
          >
            <Download className="size-4" />
            {t('shared.exportExcel')}
          </Button>
        }
      />

      <StatCardGrid>
        <StatCard label={t('common.jobs')} value={totals.jobs} icon={BarChart3} />
        <StatCard
          label={t('common.revenue')}
          icon={IndianRupee}
          value={formatCurrency(totals.revenue)}
          tone="success"
        />
        <StatCard
          label={t('common.cost')}
          icon={TrendingDown}
          value={formatCurrency(totals.cost)}
          tone="warning"
        />
        <StatCard
          label={t('common.profit')}
          icon={TrendingUp}
          value={formatCurrency(totals.profit)}
          tone={totals.profit < 0 ? 'danger' : 'success'}
        />
        <StatCard
          label={t('shared.avgMargin')}
          icon={Percent}
          value={formatPercent(totals.avgMargin)}
          tone={totals.avgMargin < 0 ? 'danger' : 'default'}
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.reports.jobWiseProfit.searchJobCustomerTech')}
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
        showCustomRange
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
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
            icon={BarChart3}
            title={t('shared.noCostedJobsYet')}
            description={t('pages.reports.jobWiseProfit.recordActualCostingOnAClosed')}
          />
        }
      />
    </div>
  )
}
