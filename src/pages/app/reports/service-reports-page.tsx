import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Download, SlidersHorizontal, Package } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { ExpandableTable, type ExpandableTableColumn } from '@/components/shared/expandable-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJobCards, useJobTimeline, type JobCardWithId } from '@/hooks/use-job-cards'
import { useJobCosting } from '@/hooks/use-job-costing'
import { useUsers } from '@/hooks/use-users'
import { TimelinePanel } from '@/pages/app/service/job-cards/timeline-panel'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatCurrency, formatTimestamp } from '@/lib/utils'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'

function statusLabel(key: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

function outstandingOf(job: JobCardWithId): number {
  return job.finalAmount != null ? Math.max(0, job.finalAmount - job.paidAmount) : 0
}

/** The expanded row's own sub-panel — its own component (not an inline callback) so
 * `useJobTimeline`/`useJobCosting` only fetch for whichever row is actually open. */
function ServiceReportRowDetail({ job }: { job: JobCardWithId }) {
  const { data: timeline = [] } = useJobTimeline(job.id)
  const { data: costing } = useJobCosting(job.id)
  const supplierByItemId = new Map((costing?.costItems ?? []).filter((c) => c.linked).map((c) => [c.itemId, c.supplier]))
  const outstanding = outstandingOf(job)
  const deliveredOrReturnedBy = job.deliveredByName ?? job.returnedByName ?? null

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-3">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Details</p>
          <div className="mt-1.5 space-y-1 text-sm">
            <p>IMEI: {job.imei ?? '—'}</p>
            {deliveredOrReturnedBy && <p className="text-muted-foreground">Delivered By: {deliveredOrReturnedBy}</p>}
            {job.cancelledByName && <p className="text-muted-foreground">Cancelled By: {job.cancelledByName}</p>}
          </div>
        </div>
        <div className="space-y-1 rounded-lg border p-3 text-sm">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Payment</p>
          <div className="flex justify-between"><span className="text-muted-foreground">Final Amount</span><span className="font-medium">{formatCurrency(job.finalAmount ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="font-medium">{formatCurrency(job.paidAmount)}</span></div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Outstanding</span>
            {outstanding === 0 ? (
              <span className="font-medium text-emerald-600">✓ Fully Paid</span>
            ) : (
              <span className="font-medium text-red-600">{formatCurrency(outstanding)}</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Package className="size-3.5" />
          Parts / Items
        </p>
        {job.partsUsed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No parts used on this job.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full min-w-[480px] text-sm whitespace-nowrap">
              <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="p-2 text-left">Part</th>
                  <th className="p-2 text-left">Supplier</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {job.partsUsed.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.itemName}</td>
                    <td className="p-2">{supplierByItemId.get(p.itemId) ?? '—'}</td>
                    <td className="p-2 text-right">{formatCurrency(p.rate)}</td>
                    <td className="p-2 text-right">{p.qty}</td>
                    <td className="p-2 text-right">{formatCurrency(p.rate * p.qty)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/20 font-medium">
                  <td className="p-2" colSpan={4}>Total Parts Cost</td>
                  <td className="p-2 text-right">{formatCurrency(job.partsCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto">
        <TimelinePanel events={timeline} />
      </div>
    </div>
  )
}

/** `preview (38)` — the full job-card list with the heaviest filter set in the app, expandable
 * to the same Details/Payment/Parts/Timeline breakdown the Job Card detail page itself shows.
 * Reads `useJobCards()` directly (every job, any status) — unlike the profit-based reports below
 * it, this one isn't limited to costed/Closed jobs. */
export function ServiceReportsPage() {
  const { data: jobs = [], isLoading } = useJobCards()
  const { data: users = [] } = useUsers()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignedToFilter, setAssignedToFilter] = useState('all')
  const [receivedByFilter, setReceivedByFilter] = useState('all')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all')
  const [deliveredByFilter, setDeliveredByFilter] = useState('all')
  const [cancelledByFilter, setCancelledByFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const deviceTypes = Array.from(new Set(jobs.map((j) => j.deviceTypeName).filter((v): v is string => !!v))).sort()

  const bounds = dateRangeBounds(dateRange, customFrom, customTo)
  const filtered = jobs
    .filter((j) => !bounds || ((j.createdAt?.toDate?.() ?? new Date()) >= bounds.from && (j.createdAt?.toDate?.() ?? new Date()) <= bounds.to))
    .filter((j) => statusFilter === 'all' || j.status === statusFilter)
    .filter((j) => assignedToFilter === 'all' || j.assignedToId === assignedToFilter)
    .filter((j) => receivedByFilter === 'all' || j.receivedById === receivedByFilter)
    .filter((j) => deviceTypeFilter === 'all' || j.deviceTypeName === deviceTypeFilter)
    .filter((j) => deliveredByFilter === 'all' || j.deliveredById === deliveredByFilter)
    .filter((j) => cancelledByFilter === 'all' || j.cancelledById === cancelledByFilter)
    .filter((j) =>
      search.trim()
        ? `${j.jobNumber} ${j.customerName} ${j.brandName ?? ''} ${j.model ?? ''}`.toLowerCase().includes(search.toLowerCase())
        : true
    )

  const totals = {
    total: filtered.length,
    pending: filtered.filter((j) => ['pending', 'inQueue'].includes(j.status)).length,
    inProgress: filtered.filter((j) => ['inProgress', 'onHold'].includes(j.status)).length,
    completed: filtered.filter((j) => ['delivered', 'closed'].includes(j.status)).length,
    revenue: filtered.reduce((s, j) => s + (j.finalAmount ?? 0), 0),
    outstanding: filtered.reduce((s, j) => s + outstandingOf(j), 0),
  }

  const columns: ExpandableTableColumn<JobCardWithId>[] = [
    { key: 'created', header: 'Created', render: (j) => formatTimestamp(j.createdAt, false) },
    {
      key: 'job',
      header: 'Job Card',
      render: (j) => (
        <Link to={`/app/service/job-cards/${j.id}`} className="font-medium text-teal-700 hover:underline dark:text-teal-400">
          {j.jobNumber}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', render: (j) => <><p>{j.customerName}</p><p className="text-xs text-muted-foreground">{j.customerMobile}</p></> },
    { key: 'device', header: 'Device', hideOnMobile: true, render: (j) => <>{[j.brandName, j.model].filter(Boolean).join(' ') || '—'}{j.deviceTypeName && <p className="text-xs text-muted-foreground">{j.deviceTypeName}</p>}</> },
    { key: 'receivedBy', header: 'Received By', hideOnMobile: true, render: (j) => j.receivedByName },
    { key: 'assignedTo', header: 'Assigned To', hideOnMobile: true, render: (j) => j.assignedToName ?? '—' },
    { key: 'estCost', header: 'Est. Cost', hideOnMobile: true, render: (j) => formatCurrency(j.estimatedCost) },
    { key: 'finalAmt', header: 'Final Amt', render: (j) => (j.finalAmount != null ? formatCurrency(j.finalAmount) : '—') },
    { key: 'paid', header: 'Paid', render: (j) => <span className="text-teal-700 dark:text-teal-400">{formatCurrency(j.paidAmount)}</span> },
    { key: 'due', header: 'Due', hideOnMobile: true, render: (j) => formatCurrency(outstandingOf(j)) },
    { key: 'status', header: 'Status', render: (j) => <StatusBadge status={statusLabel(j.status)} /> },
    { key: 'deliveredBy', header: 'Delivered/Returned By', hideOnMobile: true, render: (j) => <span className="text-purple-700 dark:text-purple-400">{j.deliveredByName ?? j.returnedByName ?? '—'}</span> },
    { key: 'cancelledBy', header: 'Cancelled By', hideOnMobile: true, render: (j) => j.cancelledByName ?? '—' },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={BarChart3}
        title="Service Reports"
        subtitle="Complete job card report with advanced filters"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setShowAdvanced((v) => !v)}>
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                downloadCsv(
                  'service-reports.csv',
                  filtered.map((j) => ({
                    Created: formatTimestamp(j.createdAt, false),
                    'Job Card': j.jobNumber,
                    Customer: j.customerName,
                    Device: [j.brandName, j.model].filter(Boolean).join(' '),
                    'Received By': j.receivedByName,
                    'Assigned To': j.assignedToName ?? '',
                    'Est. Cost': j.estimatedCost,
                    'Final Amt': j.finalAmount ?? '',
                    Paid: j.paidAmount,
                    Due: outstandingOf(j),
                    Status: statusLabel(j.status),
                    'Delivered/Returned By': j.deliveredByName ?? j.returnedByName ?? '',
                    'Cancelled By': j.cancelledByName ?? '',
                  }))
                )
              }
            >
              <Download className="size-4" />
              Export Excel
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Jobs" value={totals.total} icon={BarChart3} />
        <StatCard label="Pending" value={totals.pending} tone="warning" />
        <StatCard label="In Progress" value={totals.inProgress} tone="info" />
        <StatCard label="Completed" value={totals.completed} tone="success" />
        <StatCard label="Revenue" value={formatCurrency(totals.revenue)} tone="success" />
        <StatCard label="Outstanding" value={formatCurrency(totals.outstanding)} tone={totals.outstanding > 0 ? 'danger' : 'default'} />
      </div>

      <div className="space-y-2">
        <FilterBar
          dateRange={dateRange === 'all' ? undefined : dateRange}
          onDateRangeChange={setDateRange}
          showCustomRange
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
        {showAdvanced && (
          <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Job no, customer, brand, model...">
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {JOB_STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assignedToFilter} onValueChange={(v) => v && setAssignedToFilter(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Users" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={receivedByFilter} onValueChange={(v) => v && setReceivedByFilter(v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Received By: All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Received By: All</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={deviceTypeFilter} onValueChange={(v) => v && setDeviceTypeFilter(v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {deviceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={deliveredByFilter} onValueChange={(v) => v && setDeliveredByFilter(v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Delivered By: All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Delivered By: All</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cancelledByFilter} onValueChange={(v) => v && setCancelledByFilter(v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Cancelled By: All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cancelled By: All</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterBar>
        )}
      </div>

      <ExpandableTable
        columns={columns}
        data={filtered}
        rowKey={(j) => j.id}
        isLoading={isLoading}
        emptyState={<EmptyState icon={BarChart3} title="No job cards found" description="Try widening your filters or date range." />}
        renderExpanded={(j) => <ServiceReportRowDetail job={j} />}
      />
    </div>
  )
}
