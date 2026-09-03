import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Download } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
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

function statusLabel(key: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

/** `preview (36)` — one row per Closed, *costed* job (`useCostedJobs()`; a job with no recorded
 * actual costing has no real profit number to show, so it's not part of this report at all —
 * matches the reference's own "Jobs: 1" count reflecting only the costed job, not every job
 * card ever created). */
export function JobWiseProfitPage() {
  const { data: rows, isLoading } = useCostedJobs()
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const bounds = dateRangeBounds(dateRange, customFrom, customTo)
  const filtered = rows
    .filter((r) => !bounds || (r.date >= bounds.from && r.date <= bounds.to))
    .filter((r) =>
      search.trim()
        ? `${r.job.jobNumber} ${r.job.customerName} ${r.job.assignedToName ?? ''}`.toLowerCase().includes(search.toLowerCase())
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
      header: 'Job',
      sortValue: (r) => r.job.jobNumber,
      render: (r) => (
        <Link to={`/app/service/job-cards/${r.job.id}`} className="font-medium text-teal-700 hover:underline dark:text-teal-400">
          {r.job.jobNumber}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', sortValue: (r) => r.job.customerName, render: (r) => r.job.customerName },
    { key: 'assignedTo', header: 'Assigned To', hideOnMobile: true, render: (r) => r.job.assignedToName ?? '—' },
    { key: 'revenue', header: 'Revenue', sortValue: (r) => r.revenue, render: (r) => formatCurrency(r.revenue) },
    { key: 'cost', header: 'Cost', sortValue: (r) => r.cost, render: (r) => formatCurrency(r.cost) },
    {
      key: 'profit',
      header: 'Profit',
      sortValue: (r) => r.profit,
      render: (r) => <span className={r.profit < 0 ? 'font-medium text-red-600' : 'font-medium text-emerald-600'}>{formatCurrency(r.profit)}</span>,
    },
    {
      key: 'margin',
      header: 'Margin',
      sortValue: (r) => r.marginPct,
      render: (r) => <span className={r.marginPct < 0 ? 'text-red-600' : 'text-emerald-600'}>{formatPercent(r.marginPct)}</span>,
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={statusLabel(r.job.status)} /> },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={BarChart3}
        title="Job-wise Profit"
        subtitle="Job-wise profit and loss analysis"
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
            Export Excel
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Jobs" value={totals.jobs} icon={BarChart3} />
        <StatCard label="Revenue" value={formatCurrency(totals.revenue)} tone="success" />
        <StatCard label="Cost" value={formatCurrency(totals.cost)} tone="warning" />
        <StatCard label="Profit" value={formatCurrency(totals.profit)} tone={totals.profit < 0 ? 'danger' : 'success'} />
        <StatCard label="Avg Margin" value={formatPercent(totals.avgMargin)} tone={totals.avgMargin < 0 ? 'danger' : 'default'} />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search job, customer, tech..."
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
        emptyState={<EmptyState icon={BarChart3} title="No costed jobs yet" description="Record actual costing on a closed job to see its profit here." />}
      />
    </div>
  )
}
