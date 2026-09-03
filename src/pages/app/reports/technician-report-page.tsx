import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Download, TrendingDown, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { ExpandableTable, type ExpandableTableColumn } from '@/components/shared/expandable-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCostedJobs, type CostedJobRow } from '@/hooks/use-reports'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatCurrency, formatPercent, formatTimestamp } from '@/lib/utils'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'

function statusLabel(key: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

interface TechnicianGroup {
  technicianId: string
  technicianName: string
  jobs: CostedJobRow[]
  revenue: number
  cost: number
  profit: number
  marginPct: number
  avgPerJob: number
  winRate: number
}

function groupByTechnician(rows: CostedJobRow[]): TechnicianGroup[] {
  const map = new Map<string, TechnicianGroup>()
  for (const row of rows) {
    const id = row.job.assignedToId ?? 'unassigned'
    const name = row.job.assignedToName ?? 'Unassigned'
    let group = map.get(id)
    if (!group) {
      group = { technicianId: id, technicianName: name, jobs: [], revenue: 0, cost: 0, profit: 0, marginPct: 0, avgPerJob: 0, winRate: 0 }
      map.set(id, group)
    }
    group.jobs.push(row)
    group.revenue += row.revenue
    group.cost += row.cost
    group.profit += row.profit
  }
  for (const group of map.values()) {
    group.marginPct = group.revenue > 0 ? (group.profit / group.revenue) * 100 : 0
    group.avgPerJob = group.jobs.length > 0 ? group.profit / group.jobs.length : 0
    group.winRate = group.jobs.length > 0 ? (group.jobs.filter((j) => j.profit >= 0).length / group.jobs.length) * 100 : 0
  }
  return Array.from(map.values())
}

/** `preview (34)` — same `useCostedJobs()` join as Job-wise Profit, grouped by
 * `assignedToId`/`assignedToName` (the technician a job's own final assignment landed on — a
 * job handed over mid-repair already reflects its *last* assignee by the time it's Closed). */
export function TechnicianReportPage() {
  const { data: rows, isLoading } = useCostedJobs()
  const [search, setSearch] = useState('')
  const [technicianFilter, setTechnicianFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const bounds = dateRangeBounds(dateRange, customFrom, customTo)
  const dateFiltered = rows.filter((r) => !bounds || (r.date >= bounds.from && r.date <= bounds.to))
  const groups = groupByTechnician(dateFiltered)
  const allTechnicians = Array.from(new Set(dateFiltered.map((r) => r.job.assignedToName ?? 'Unassigned'))).sort()

  const filtered = groups
    .filter((g) => technicianFilter === 'all' || g.technicianName === technicianFilter)
    .filter((g) => (search.trim() ? g.technicianName.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => b.jobs.length - a.jobs.length)

  const totalRevenue = filtered.reduce((s, g) => s + g.revenue, 0)
  const totalCost = filtered.reduce((s, g) => s + g.cost, 0)
  const totalProfit = filtered.reduce((s, g) => s + g.profit, 0)
  const totals = {
    technicians: filtered.length,
    jobs: filtered.reduce((s, g) => s + g.jobs.length, 0),
    revenue: totalRevenue,
    cost: totalCost,
    profit: totalProfit,
  }

  const columns: ExpandableTableColumn<TechnicianGroup>[] = [
    { key: 'technician', header: 'Technician', render: (g) => <span className="font-medium">{g.technicianName}</span> },
    { key: 'jobs', header: 'Jobs', render: (g) => g.jobs.length },
    { key: 'revenue', header: 'Revenue', render: (g) => formatCurrency(g.revenue) },
    { key: 'cost', header: 'Cost', render: (g) => formatCurrency(g.cost) },
    { key: 'profit', header: 'Profit', render: (g) => <span className={g.profit < 0 ? 'font-medium text-red-600' : 'font-medium text-emerald-600'}>{formatCurrency(g.profit)}</span> },
    { key: 'margin', header: 'Margin', hideOnMobile: true, render: (g) => <span className={g.marginPct < 0 ? 'text-red-600' : 'text-emerald-600'}>{formatPercent(g.marginPct)}</span> },
    { key: 'avgPerJob', header: 'Avg/Job', hideOnMobile: true, render: (g) => formatCurrency(g.avgPerJob) },
    {
      key: 'performance',
      header: 'Performance',
      render: (g) =>
        g.profit < 0 ? (
          <StatusBadge status="Loss" tone="danger" icon={TrendingDown} />
        ) : (
          <StatusBadge status="Profit" tone="success" icon={TrendingUp} />
        ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Users}
        title="Technician Report"
        subtitle="Technician-wise job performance and profitability"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              downloadCsv(
                'technician-report.csv',
                filtered.map((g) => ({
                  Technician: g.technicianName,
                  Jobs: g.jobs.length,
                  Revenue: g.revenue,
                  Cost: g.cost,
                  Profit: g.profit,
                  'Margin %': g.marginPct.toFixed(2),
                  'Avg/Job': g.avgPerJob.toFixed(2),
                  'Win Rate %': g.winRate.toFixed(1),
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
        <StatCard label="Technicians" value={totals.technicians} icon={Users} tone="purple" />
        <StatCard label="Jobs" value={totals.jobs} />
        <StatCard label="Revenue" value={formatCurrency(totals.revenue)} tone="success" />
        <StatCard label="Cost" value={formatCurrency(totals.cost)} tone="warning" />
        <StatCard label="Profit" value={formatCurrency(totals.profit)} tone={totals.profit < 0 ? 'danger' : 'success'} />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search technician..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
        showCustomRange
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      >
        <Select value={technicianFilter} onValueChange={(v) => v && setTechnicianFilter(v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Technicians" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Technicians</SelectItem>
            {allTechnicians.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <ExpandableTable
        columns={columns}
        data={filtered}
        rowKey={(g) => g.technicianId}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Users} title="No costed jobs yet" description="Technician performance appears once jobs have recorded costing." />}
        renderExpanded={(g) => (
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{g.jobs.length} jobs - {g.technicianName}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    `technician-${g.technicianName}.csv`,
                    g.jobs.map((r) => ({
                      'Job Card': r.job.jobNumber,
                      Customer: r.job.customerName,
                      Device: [r.job.brandName, r.job.model].filter(Boolean).join(' '),
                      Status: statusLabel(r.job.status),
                      Revenue: r.revenue,
                      Cost: r.cost,
                      Profit: r.profit,
                      'Margin %': r.marginPct.toFixed(2),
                      Date: formatTimestamp(r.job.closedAt, false),
                    }))
                  )
                }
              >
                <Download className="size-3.5" />
                Export Excel
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              <StatCard label="Revenue" value={formatCurrency(g.revenue)} tone="success" className="min-w-0" />
              <StatCard label="Cost" value={formatCurrency(g.cost)} tone="warning" className="min-w-0" />
              <StatCard label="Profit" value={formatCurrency(g.profit)} tone={g.profit < 0 ? 'danger' : 'success'} className="min-w-0" />
              <StatCard label="Avg Margin" value={formatPercent(g.marginPct)} tone={g.marginPct < 0 ? 'danger' : 'default'} className="min-w-0" />
              <StatCard label="Win Rate" value={`${g.winRate.toFixed(0)}%`} className="min-w-0" />
              <StatCard label="Avg / Job" value={formatCurrency(g.avgPerJob)} className="min-w-0" />
            </div>
            <div className="overflow-x-auto rounded-lg border bg-background">
              <table className="w-full min-w-[880px] text-sm whitespace-nowrap">
                <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="p-2 text-left">Job Card</th>
                    <th className="p-2 text-left">Customer</th>
                    <th className="p-2 text-left">Device</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-right">Revenue</th>
                    <th className="p-2 text-right">Cost</th>
                    <th className="p-2 text-right">Profit</th>
                    <th className="p-2 text-right">Margin</th>
                    <th className="p-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {g.jobs.map((r) => (
                    <tr key={r.job.id} className="border-t">
                      <td className="p-2">
                        <Link to={`/app/service/job-cards/${r.job.id}`} className="font-medium text-teal-700 hover:underline dark:text-teal-400">
                          {r.job.jobNumber}
                        </Link>
                      </td>
                      <td className="p-2">{r.job.customerName}</td>
                      <td className="p-2">{[r.job.brandName, r.job.model].filter(Boolean).join(' ') || '—'}</td>
                      <td className="p-2"><StatusBadge status={statusLabel(r.job.status)} /></td>
                      <td className="p-2 text-right">{formatCurrency(r.revenue)}</td>
                      <td className="p-2 text-right">{formatCurrency(r.cost)}</td>
                      <td className={r.profit < 0 ? 'p-2 text-right font-medium text-red-600' : 'p-2 text-right font-medium text-emerald-600'}>{formatCurrency(r.profit)}</td>
                      <td className={r.marginPct < 0 ? 'p-2 text-right text-red-600' : 'p-2 text-right text-emerald-600'}>{formatPercent(r.marginPct)}</td>
                      <td className="p-2">{formatTimestamp(r.job.closedAt, false)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      />
    </div>
  )
}
