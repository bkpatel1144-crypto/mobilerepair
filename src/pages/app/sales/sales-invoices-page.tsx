import { useState } from 'react'
import { FileText, Eye, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useJobCards, type JobCardWithId } from '@/hooks/use-job-cards'
import { dateRangeBounds } from '@/lib/date-range'
import { formatTimestamp } from '@/lib/utils'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import { JobCardDetailDrawer } from '../service/job-cards/job-card-detail-drawer'
import { EditBillModal } from './edit-bill-modal'
import { useTranslation } from 'react-i18next'

/**
 * `preview (68)` — Sales > Sales Invoices.
 *
 * There is no separate `invoices` collection, and deliberately so: in this app a bill *is* a
 * job card that has been through the `generateBill` action, which is the only thing that ever
 * sets `finalAmount` (see `use-job-actions.ts`). Writing invoice rows to a second collection
 * would mean two sources of truth for one number — the same reasoning Phase 5 used to make
 * Service Items query Item Master rather than duplicate it.
 *
 * So an invoice here is exactly: `finalAmount !== null`, in one of the three post-bill statuses
 * the page's own subtitle names (ready / delivered / closed). A cancelled job keeps whatever
 * `finalAmount` it had, which is why the status filter is a whitelist rather than a
 * "not pending" check.
 */
const INVOICE_STATUSES = ['ready', 'delivered', 'closed'] as const
type InvoiceStatus = (typeof INVOICE_STATUSES)[number]
type Tab = 'all' | InvoiceStatus

const TAB_LABELS: Record<Tab, string> = {
  all: 'common.all',
  ready: 'shared.ready',
  delivered: 'shared.delivered',
  closed: 'pages.sales.salesInvoices.closed',
}

function statusLabel(key: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

/** The bill date, not the job date. `billGeneratedAt` is written by the `generateBill` action
 * itself; jobs billed before that field existed fall back to `updatedAt`, which is the closest
 * real timestamp on the document — never a fabricated one. */
function billDate(job: JobCardWithId) {
  return job.billGeneratedAt ?? job.updatedAt
}

export function SalesInvoicesPage() {
  const { t } = useTranslation()
  const { data: jobs = [], isLoading, error: loadError, refetch } = useJobCards()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [tab, setTab] = useState<Tab>('all')
  const [viewing, setViewing] = useState<JobCardWithId | null>(null)
  const [editing, setEditing] = useState<JobCardWithId | null>(null)

  const invoices = jobs.filter(
    (j) => j.finalAmount !== null && INVOICE_STATUSES.includes(j.status as InvoiceStatus)
  )

  const counts: Record<Tab, number> = {
    all: invoices.length,
    ready: invoices.filter((j) => j.status === 'ready').length,
    delivered: invoices.filter((j) => j.status === 'delivered').length,
    closed: invoices.filter((j) => j.status === 'closed').length,
  }

  const bounds = dateRangeBounds(dateRange)
  const filtered = invoices
    .filter((j) => tab === 'all' || j.status === tab)
    .filter((j) => {
      if (!bounds) return true
      const d = billDate(j)?.toDate?.()
      return !!d && d >= bounds.from && d <= bounds.to
    })
    .filter((j) =>
      search.trim()
        ? `${j.jobNumber} ${j.customerName} ${j.customerMobile}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    )
    // Newest bill first — the same client-side sort every other list in this app uses, for the
    // same reason (`createdAt`-style fields can be briefly null while a write is pending).
    .sort((a, b) => (billDate(b)?.toMillis?.() ?? 0) - (billDate(a)?.toMillis?.() ?? 0))

  const columns: DataTableColumn<JobCardWithId>[] = [
    {
      key: 'billDate',
      header: t('pages.sales.salesInvoices.billDate'),
      sortValue: (j) => billDate(j)?.toMillis?.() ?? 0,
      render: (j) => formatTimestamp(billDate(j), false),
    },
    {
      key: 'jobNumber',
      header: t('common.jobCard'),
      sortValue: (j) => j.jobNumber,
      render: (j) => <span className="font-semibold">{j.jobNumber}</span>,
    },
    {
      key: 'customer',
      header: t('common.customer'),
      sortValue: (j) => j.customerName,
      render: (j) => (
        <div>
          <p className="font-medium">{j.customerName}</p>
          <p className="text-xs text-muted-foreground">{j.customerMobile}</p>
        </div>
      ),
    },
    {
      key: 'device',
      header: t('common.device'),
      hideOnMobile: true,
      render: (j) => [j.brandName, j.model].filter(Boolean).join(' ') || '—',
    },
    {
      key: 'total',
      header: t('common.total'),
      sortValue: (j) => j.finalAmount ?? 0,
      render: (j) => `₹${j.finalAmount ?? 0}`,
    },
    {
      key: 'paid',
      header: t('common.paid'),
      sortValue: (j) => j.paidAmount,
      render: (j) => <span className="text-teal-600 dark:text-teal-400">₹{j.paidAmount}</span>,
    },
    {
      key: 'outstanding',
      header: t('common.outstanding'),
      sortValue: (j) => Math.max(0, (j.finalAmount ?? 0) - j.paidAmount),
      render: (j) => {
        const due = (j.finalAmount ?? 0) - j.paidAmount
        // An overpaid bill is not "outstanding" — it shows as settled here and surfaces as a
        // payable on the Payables page, which is the one place that difference is actionable.
        return due > 0 ? <span className="font-medium text-red-600">₹{due}</span> : '—'
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      sortValue: (j) => j.status,
      render: (j) => <StatusBadge status={statusLabel(j.status)} />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (j) => (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`View bill ${j.jobNumber}`}
            onClick={(e) => {
              e.stopPropagation()
              setViewing(j)
            }}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            aria-label={`Edit bill ${j.jobNumber}`}
            onClick={(e) => {
              e.stopPropagation()
              setEditing(j)
            }}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={FileText}
        title={t('pages.sales.salesInvoices.salesInvoices')}
        subtitle={t('pages.sales.salesInvoices.allGeneratedBillsViewOrEdit')}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('shared.searchJobCardCustomerMobile')}
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      >
        <div className="flex flex-wrap gap-1 rounded-lg border p-0.5">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              data-slot="button"
              onClick={() => setTab(tab)}
              aria-pressed={tab === tab}
              className={
                'min-h-9 rounded-md px-3 py-1 text-sm ' +
                (tab === tab ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted')
              }
            >
              {t(TAB_LABELS[tab])} {counts[tab]}
            </button>
          ))}
        </div>
        {dateRange !== 'all' && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setDateRange('all')}>
            {t('pages.sales.salesInvoices.clearDates')}
          </Button>
        )}
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(j) => j.id}
        onRowClick={setViewing}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={FileText}
            title={t('pages.sales.salesInvoices.noBillsGeneratedYet')}
            description={t('pages.sales.salesInvoices.aJobCardAppearsHereOnce')}
          />
        }
      />

      <EditBillModal job={editing} onOpenChange={(open) => !open && setEditing(null)} />

      <JobCardDetailDrawer
        job={viewing}
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />
    </div>
  )
}
