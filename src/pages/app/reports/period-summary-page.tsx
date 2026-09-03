import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Download, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { ExpandableTable, type ExpandableTableColumn } from '@/components/shared/expandable-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useCostedJobs, type CostedJobRow } from '@/hooks/use-reports'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatCurrency, formatPercent, cn } from '@/lib/utils'
import { dayKey, monthKey, formatMonthLabel, marginPct } from '@/lib/reports'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'

function statusLabel(key: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

interface PeriodGroup {
  key: string
  label: string
  jobs: CostedJobRow[]
  revenue: number
  jobCost: number
  grossProfit: number
}

// Shop Expenses is a genuinely locked feature in this build (Settings > Finance > Expenses,
// `nav.ts` marks it `locked: true` — never built, per BUILD_PLAN.md's own phase scope) — there is
// nowhere in the app a shop expense could ever be recorded, so this is honestly always ₹0, not a
// shortcut. Kept as a named constant (not a bare `0` scattered through the JSX) so the one place
// this changes, once Expenses is eventually built, is obvious.
const SHOP_EXPENSES = 0

/** `preview (33)` — the only Phase 9 report grouped by *time period* rather than by job/
 * technician/supplier. Daily groups by the job's own local calendar date (`dayKey`), Monthly by
 * calendar month (`monthKey`) — both off `CostedJobRow.date` (a job's `closedAt`), same as every
 * other profit report. */
export function PeriodSummaryPage() {
  const { data: rows, isLoading } = useCostedJobs()
  const [search, setSearch] = useState('')
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const bounds = dateRangeBounds(dateRange, customFrom, customTo)
  const dateFiltered = rows.filter((r) => !bounds || (r.date >= bounds.from && r.date <= bounds.to))

  function buildGroups(): PeriodGroup[] {
    const map = new Map<string, PeriodGroup>()
    for (const row of dateFiltered) {
      const key = granularity === 'daily' ? dayKey(row.date) : monthKey(row.date)
      const label = granularity === 'daily' ? row.date.toLocaleDateString('en-IN', { dateStyle: 'medium' }) : formatMonthLabel(key)
      let group = map.get(key)
      if (!group) {
        group = { key, label, jobs: [], revenue: 0, jobCost: 0, grossProfit: 0 }
        map.set(key, group)
      }
      group.jobs.push(row)
      group.revenue += row.revenue
      group.jobCost += row.cost
      group.grossProfit += row.profit
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1))
  }
  const groups = buildGroups()

  const filtered = groups.filter((g) => (search.trim() ? g.label.toLowerCase().includes(search.toLowerCase()) : true))

  const totalJobs = filtered.reduce((s, g) => s + g.jobs.length, 0)
  const totalRevenue = filtered.reduce((s, g) => s + g.revenue, 0)
  const totalJobCost = filtered.reduce((s, g) => s + g.jobCost, 0)
  const totalGrossProfit = filtered.reduce((s, g) => s + g.grossProfit, 0)
  const totalNetProfit = totalGrossProfit - SHOP_EXPENSES
  const totals = {
    jobs: totalJobs,
    revenue: totalRevenue,
    jobCost: totalJobCost,
    grossProfit: totalGrossProfit,
    netProfit: totalNetProfit,
    netMargin: marginPct(totalNetProfit, totalRevenue),
  }

  const columns: ExpandableTableColumn<PeriodGroup>[] = [
    { key: 'date', header: 'Date', render: (g) => <span className="font-medium">{g.label}</span> },
    { key: 'jobs', header: 'Jobs', render: (g) => g.jobs.length },
    { key: 'revenue', header: 'Revenue', render: (g) => formatCurrency(g.revenue) },
    { key: 'jobCost', header: 'Job Cost', render: (g) => formatCurrency(g.jobCost) },
    { key: 'shopExpenses', header: 'Shop Expenses', hideOnMobile: true, render: () => '—' },
    { key: 'netProfit', header: 'Net Profit', render: (g) => <span className={g.grossProfit < 0 ? 'font-medium text-red-600' : 'font-medium text-emerald-600'}>{formatCurrency(g.grossProfit)}</span> },
    { key: 'margin', header: 'Margin', render: (g) => <span className={g.grossProfit < 0 ? 'text-red-600' : 'text-emerald-600'}>{formatPercent(marginPct(g.grossProfit, g.revenue))}</span> },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Calendar}
        title="Period Summary"
        subtitle="Daily and monthly revenue, cost, and profit summary"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              downloadCsv(
                'period-summary.csv',
                filtered.map((g) => ({
                  Date: g.label,
                  Jobs: g.jobs.length,
                  Revenue: g.revenue,
                  'Job Cost': g.jobCost,
                  'Shop Expenses': SHOP_EXPENSES,
                  'Net Profit': g.grossProfit - SHOP_EXPENSES,
                  'Margin %': marginPct(g.grossProfit, g.revenue).toFixed(2),
                }))
              )
            }
          >
            <Download className="size-4" />
            Export Excel
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Jobs" value={totals.jobs} />
        <StatCard label="Revenue" value={formatCurrency(totals.revenue)} tone="success" />
        <StatCard label="Job Cost" value={formatCurrency(totals.jobCost)} tone="warning" />
        <StatCard label="Gross Profit" value={formatCurrency(totals.grossProfit)} tone={totals.grossProfit < 0 ? 'danger' : 'success'} />
        <StatCard label="Shop Expenses" value={formatCurrency(SHOP_EXPENSES)} />
        <StatCard label="Net Profit" value={formatCurrency(totals.netProfit)} tone={totals.netProfit < 0 ? 'danger' : 'success'} />
        <StatCard label="Net Margin" value={formatPercent(totals.netMargin)} tone={totals.netMargin < 0 ? 'danger' : 'default'} />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search date..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
        showCustomRange
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      >
        <div className="flex gap-1 rounded-lg border p-0.5">
          <Button type="button" size="sm" variant={granularity === 'daily' ? 'default' : 'ghost'} onClick={() => setGranularity('daily')}>
            Daily
          </Button>
          <Button type="button" size="sm" variant={granularity === 'monthly' ? 'default' : 'ghost'} onClick={() => setGranularity('monthly')}>
            Monthly
          </Button>
        </div>
      </FilterBar>

      <ExpandableTable
        columns={columns}
        data={filtered}
        rowKey={(g) => g.key}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Calendar} title="No costed jobs yet" description="Period totals appear once jobs have recorded costing." />}
        renderExpanded={(g) => {
          const netAfterExpenses = g.grossProfit - SHOP_EXPENSES
          return (
            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="font-medium">{g.jobs.length} jobs</span> on {g.label} ·{' '}
                  <span className="font-medium">{formatCurrency(g.revenue)}</span> revenue ·{' '}
                  <span className={cn('font-medium', g.grossProfit < 0 ? 'text-red-600' : 'text-emerald-600')}>{formatCurrency(g.grossProfit)}</span> profit
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadCsv(
                      `period-${g.key}.csv`,
                      g.jobs.map((r) => ({
                        'Job Card': r.job.jobNumber,
                        Customer: r.job.customerName,
                        'Assigned To': r.job.assignedToName ?? '',
                        Device: [r.job.brandName, r.job.model].filter(Boolean).join(' '),
                        Status: statusLabel(r.job.status),
                        Revenue: r.revenue,
                        Cost: r.cost,
                        Profit: r.profit,
                        'Margin %': r.marginPct.toFixed(2),
                      }))
                    )
                  }
                >
                  <Download className="size-3.5" />
                  Export Excel
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border bg-background">
                <table className="w-full min-w-[900px] text-sm whitespace-nowrap">
                  <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="p-2 text-left">Job Card</th>
                      <th className="p-2 text-left">Customer</th>
                      <th className="p-2 text-left">Assigned To</th>
                      <th className="p-2 text-left">Device</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-right">Revenue</th>
                      <th className="p-2 text-right">Cost</th>
                      <th className="p-2 text-right">Profit</th>
                      <th className="p-2 text-right">Margin</th>
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
                        <td className="p-2">{r.job.assignedToName ?? '—'}</td>
                        <td className="p-2">{[r.job.brandName, r.job.model].filter(Boolean).join(' ') || '—'}</td>
                        <td className="p-2"><StatusBadge status={statusLabel(r.job.status)} /></td>
                        <td className="p-2 text-right">{formatCurrency(r.revenue)}</td>
                        <td className="p-2 text-right">{formatCurrency(r.cost)}</td>
                        <td className={r.profit < 0 ? 'p-2 text-right font-medium text-red-600' : 'p-2 text-right font-medium text-emerald-600'}>{formatCurrency(r.profit)}</td>
                        <td className={r.marginPct < 0 ? 'p-2 text-right text-red-600' : 'p-2 text-right text-emerald-600'}>{formatPercent(r.marginPct)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/20 font-medium">
                      <td className="p-2" colSpan={5}>Page Total</td>
                      <td className="p-2 text-right">{formatCurrency(g.revenue)}</td>
                      <td className="p-2 text-right">{formatCurrency(g.jobCost)}</td>
                      <td className={g.grossProfit < 0 ? 'p-2 text-right text-red-600' : 'p-2 text-right text-emerald-600'}>{formatCurrency(g.grossProfit)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-500/10">
                <FileText className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900 dark:text-amber-300">Shop expenses in this period</p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
                    Rent, electricity, wages — the shop's own costs. They belong to the period, not to any one repair.
                  </p>
                </div>
                <span className="font-medium text-amber-900 dark:text-amber-300">- {formatCurrency(SHOP_EXPENSES)}</span>
              </div>
              {SHOP_EXPENSES === 0 && <p className="text-xs text-muted-foreground">No shop expenses recorded in this period.</p>}

              <div className="flex items-center justify-between border-t pt-2 text-sm font-medium">
                <span>Net after shop expenses</span>
                <span className={netAfterExpenses < 0 ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(netAfterExpenses)}</span>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
