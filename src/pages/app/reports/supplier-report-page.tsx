import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Download, Wrench, TrendingDown } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { ExpandableTable, type ExpandableTableColumn } from '@/components/shared/expandable-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCostedJobs } from '@/hooks/use-reports'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatCurrency, formatPercent, formatTimestamp } from '@/lib/utils'
import { lineOverrunPct } from '@/lib/reports'

interface SupplierTransaction {
  jobId: string
  jobNumber: string
  partName: string
  deviceLabel: string
  purchasePrice: number
  qty: number
  totalCost: number
  jobRevenue: number
  overrunPct: number
  date: Date
}

interface SupplierGroup {
  supplierName: string
  transactions: SupplierTransaction[]
  totalPurchase: number
  totalQty: number
  jobCount: number
  avgCostPerUnit: number
  sharePct: number
}

/** `preview (35)` — every `costItems[]` line across every costed job, grouped by its own
 * `supplier` (a plain name string on the cost item — see `record-costing-modal.tsx`'s own doc
 * comment for why this isn't a partyId reference). A cost item with no supplier picked isn't
 * attributable to anyone and is deliberately excluded, not lumped into a fake "Unknown" row. */
export function SupplierReportPage() {
  const { data: rows, isLoading } = useCostedJobs()
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const bounds = dateRangeBounds(dateRange, customFrom, customTo)
  const dateFiltered = rows.filter((r) => !bounds || (r.date >= bounds.from && r.date <= bounds.to))

  function buildGroups(): SupplierGroup[] {
    const map = new Map<string, SupplierGroup>()
    for (const row of dateFiltered) {
      const deviceLabel = [row.job.brandName, row.job.model].filter(Boolean).join(' ') || '—'
      for (const item of row.costing.costItems) {
        if (!item.supplier) continue
        let group = map.get(item.supplier)
        if (!group) {
          group = { supplierName: item.supplier, transactions: [], totalPurchase: 0, totalQty: 0, jobCount: 0, avgCostPerUnit: 0, sharePct: 0 }
          map.set(item.supplier, group)
        }
        const totalCost = item.cost * item.qty
        group.transactions.push({
          jobId: row.job.id,
          jobNumber: row.job.jobNumber,
          partName: item.itemName,
          deviceLabel,
          purchasePrice: item.cost,
          qty: item.qty,
          totalCost,
          jobRevenue: row.revenue,
          overrunPct: lineOverrunPct(totalCost, row.revenue),
          date: row.date,
        })
        group.totalPurchase += totalCost
        group.totalQty += item.qty
      }
    }
    const grandTotal = Array.from(map.values()).reduce((s, g) => s + g.totalPurchase, 0)
    for (const group of map.values()) {
      group.jobCount = new Set(group.transactions.map((t) => t.jobId)).size
      group.avgCostPerUnit = group.totalQty > 0 ? group.totalPurchase / group.totalQty : 0
      group.sharePct = grandTotal > 0 ? (group.totalPurchase / grandTotal) * 100 : 0
    }
    return Array.from(map.values())
  }
  const groups = buildGroups()

  const allSuppliers = groups.map((g) => g.supplierName).sort()
  const filtered = groups
    .filter((g) => supplierFilter === 'all' || g.supplierName === supplierFilter)
    .filter((g) => (search.trim() ? g.supplierName.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => b.totalPurchase - a.totalPurchase)

  const totals = {
    suppliers: filtered.length,
    totalPurchase: filtered.reduce((s, g) => s + g.totalPurchase, 0),
    totalQty: filtered.reduce((s, g) => s + g.totalQty, 0),
  }

  const columns: ExpandableTableColumn<SupplierGroup>[] = [
    { key: 'supplier', header: 'Supplier', render: (g) => <span className="font-medium">{g.supplierName}</span> },
    { key: 'totalPurchase', header: 'Total Purchase', render: (g) => formatCurrency(g.totalPurchase) },
    { key: 'totalQty', header: 'Total Qty', render: (g) => g.totalQty },
    { key: 'jobs', header: 'Jobs', hideOnMobile: true, render: (g) => g.jobCount },
    { key: 'avgCost', header: 'Avg Cost/Unit', hideOnMobile: true, render: (g) => formatCurrency(g.avgCostPerUnit) },
    {
      key: 'share',
      header: 'Share %',
      render: (g) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(g.sharePct, 100)}%` }} />
          </div>
          <span className="text-xs tabular-nums">{g.sharePct.toFixed(1)}%</span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Package}
        title="Supplier Report"
        subtitle="Supplier-wise parts purchase and cost analysis"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              downloadCsv(
                'supplier-report.csv',
                filtered.map((g) => ({
                  Supplier: g.supplierName,
                  'Total Purchase': g.totalPurchase,
                  'Total Qty': g.totalQty,
                  Jobs: g.jobCount,
                  'Avg Cost/Unit': g.avgCostPerUnit.toFixed(2),
                  'Share %': g.sharePct.toFixed(1),
                }))
              )
            }
          >
            <Download className="size-4" />
            Export Excel
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        <StatCard label="Suppliers" value={totals.suppliers} icon={Package} tone="warning" />
        <StatCard label="Total Purchase" value={formatCurrency(totals.totalPurchase)} />
        <StatCard label="Total Qty" value={totals.totalQty} />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search supplier..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
        showCustomRange
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      >
        <Select value={supplierFilter} onValueChange={(v) => v && setSupplierFilter(v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {allSuppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <ExpandableTable
        columns={columns}
        data={filtered}
        rowKey={(g) => g.supplierName}
        isLoading={isLoading}
        emptyState={<EmptyState icon={Package} title="No supplier purchases yet" description="Pick a supplier while recording a job's actual costing to see them here." />}
        renderExpanded={(g) => {
          const topParts = Array.from(
            g.transactions.reduce((map, t) => {
              const existing = map.get(t.partName) ?? { qty: 0, spend: 0 }
              existing.qty += t.qty
              existing.spend += t.totalCost
              map.set(t.partName, existing)
              return map
            }, new Map<string, { qty: number; spend: number }>())
          )
            .sort((a, b) => b[1].spend - a[1].spend)
            .slice(0, 5)

          return (
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{g.transactions.length} transactions · {g.supplierName}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadCsv(
                      `supplier-${g.supplierName}.csv`,
                      g.transactions.map((t) => ({
                        'Job Card': t.jobNumber,
                        'Part Name': t.partName,
                        'Device Name': t.deviceLabel,
                        'Purchase Price': t.purchasePrice,
                        Qty: t.qty,
                        'Total Cost': t.totalCost,
                        'Job Revenue': t.jobRevenue,
                        Date: formatTimestamp({ toDate: () => t.date }, false),
                      }))
                    )
                  }
                >
                  <Download className="size-3.5" />
                  Export Excel
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCard label="Total Spent" value={formatCurrency(g.totalPurchase)} className="min-w-0" />
                <StatCard label="Total Qty" value={g.totalQty} className="min-w-0" />
                <StatCard label="Transactions" value={g.transactions.length} className="min-w-0" />
                <StatCard label="Avg Cost/Unit" value={formatCurrency(g.avgCostPerUnit)} className="min-w-0" />
              </div>
              {topParts.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Top Parts by Spend</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topParts.map(([name, stats]) => (
                      <span key={name} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs">
                        <Wrench className="size-3" />
                        {name} ×{stats.qty} — {formatCurrency(stats.spend)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border bg-background">
                <table className="w-full min-w-[820px] text-sm whitespace-nowrap">
                  <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="p-2 text-left">Job Card</th>
                      <th className="p-2 text-left">Part Name</th>
                      <th className="p-2 text-left">Device Name</th>
                      <th className="p-2 text-right">Purchase Price</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Total Cost</th>
                      <th className="p-2 text-right">Job Revenue</th>
                      <th className="p-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.transactions.map((t, i) => (
                      <tr key={`${t.jobId}-${i}`} className="border-t">
                        <td className="p-2">
                          <Link to={`/app/service/job-cards/${t.jobId}`} className="font-medium text-teal-700 hover:underline dark:text-teal-400">
                            {t.jobNumber}
                          </Link>
                        </td>
                        <td className="p-2">{t.partName}</td>
                        <td className="p-2">{t.deviceLabel}</td>
                        <td className="p-2 text-right">{formatCurrency(t.purchasePrice)}</td>
                        <td className="p-2 text-right">{t.qty}</td>
                        <td className="p-2 text-right">{formatCurrency(t.totalCost)}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(t.jobRevenue)}
                          {t.overrunPct > 0 && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-red-600">
                              <TrendingDown className="size-3" />
                              {formatPercent(t.overrunPct)}
                            </span>
                          )}
                        </td>
                        <td className="p-2">{formatTimestamp({ toDate: () => t.date }, false)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
