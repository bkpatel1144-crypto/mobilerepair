import { useState } from 'react'
import { FileText, Eye, Pencil, Ban, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { FormModal } from '@/components/shared/form-modal'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useJobCards, type JobCardWithId } from '@/hooks/use-job-cards'
import { useApplyJobAction } from '@/hooks/use-job-actions'
import type { VoidedBill } from '@/types/firestore'
import { dateRangeBounds } from '@/lib/date-range'
import { formatTimestamp } from '@/lib/utils'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import { actionAppliesTo } from '@/config/job-action-statuses'
import { EditBillModal } from './edit-bill-modal'
import { BillDetailsModal } from './bill-details-modal'
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

/**
 * One row of the invoice list: a bill, live or cancelled, with the job it belongs to.
 *
 * The list used to be rows of job cards, which worked only while a job could have exactly one
 * bill. It can have a live one plus any number of cancelled ones now, and all of them have to
 * appear.
 */
interface InvoiceRow {
  key: string
  job: JobCardWithId
  invoiceNumber: string | null
  amount: number
  at: ReturnType<typeof billDate>
  /** The cancellation record, or `null` for a bill that still stands. */
  cancelled: VoidedBill | null
}

export function SalesInvoicesPage() {
  const { t } = useTranslation()
  const { data: jobs = [], isLoading, error: loadError, refetch } = useJobCards()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [viewing, setViewing] = useState<JobCardWithId | null>(null)
  const [editing, setEditing] = useState<JobCardWithId | null>(null)
  const [cancelling, setCancelling] = useState<InvoiceRow | null>(null)

  /**
   * One row per *bill*, not per job card.
   *
   * A job can carry a live bill and any number of cancelled ones, so a row keyed on the job
   * could only ever show one of them. Cancelled bills have to stay on this list: under GST a
   * cancelled invoice number may not be reused and may not quietly disappear either — every
   * number issued has to be accounted for.
   */
  const invoices: InvoiceRow[] = jobs.flatMap((job) => {
    const rows: InvoiceRow[] = (job.voidedBills ?? []).map((v) => ({
      key: `${job.id}:${v.invoiceNumber ?? v.voidedAt.toMillis()}`,
      job,
      invoiceNumber: v.invoiceNumber,
      amount: v.amount,
      at: v.voidedAt,
      cancelled: v,
    }))
    if (job.finalAmount !== null && INVOICE_STATUSES.includes(job.status as InvoiceStatus)) {
      rows.push({
        key: job.id,
        job,
        invoiceNumber: job.invoiceNumber ?? null,
        amount: job.finalAmount,
        at: billDate(job),
        cancelled: null,
      })
    }
    return rows
  })

  // The status tabs count live bills only; a cancelled one has no job status of its own.
  const live = invoices.filter((r) => !r.cancelled)
  const counts: Record<Tab, number> = {
    all: invoices.length,
    ready: live.filter((r) => r.job.status === 'ready').length,
    delivered: live.filter((r) => r.job.status === 'delivered').length,
    closed: live.filter((r) => r.job.status === 'closed').length,
  }

  const bounds = dateRangeBounds(dateRange)
  // A custom range is applied from the two date inputs rather than from `dateRangeBounds`,
  // which only knows the named ranges. Either end on its own is a valid filter — "everything
  // since the 1st" is a question a shopkeeper actually asks.
  const customFromDate = customFrom ? new Date(`${customFrom}T00:00:00`) : null
  const customToDate = customTo ? new Date(`${customTo}T23:59:59`) : null
  const filtered = invoices
    // A cancelled bill has no job status to filter on — it belongs to every tab except the
    // status ones, and dropping it from "All" would hide the thing GST requires be visible.
    .filter((r) => tab === 'all' || (!r.cancelled && r.job.status === tab))
    .filter((r) => {
      const d = r.at?.toDate?.()
      if (dateRange === 'custom') {
        if (!customFromDate && !customToDate) return true
        if (!d) return false
        if (customFromDate && d < customFromDate) return false
        if (customToDate && d > customToDate) return false
        return true
      }
      if (!bounds) return true
      return !!d && d >= bounds.from && d <= bounds.to
    })
    .filter((r) =>
      search.trim()
        ? `${r.invoiceNumber ?? ''} ${r.job.jobNumber} ${r.job.customerName} ${r.job.customerMobile}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    )
    // Newest bill first — the same client-side sort every other list in this app uses, for the
    // same reason (`createdAt`-style fields can be briefly null while a write is pending).
    .sort((a, b) => (b.at?.toMillis?.() ?? 0) - (a.at?.toMillis?.() ?? 0))

  const columns: DataTableColumn<InvoiceRow>[] = [
    {
      key: 'billDate',
      header: t('pages.sales.salesInvoices.billDate'),
      sortValue: (r) => r.at?.toMillis?.() ?? 0,
      render: (r) => formatTimestamp(r.at, false),
    },
    {
      key: 'invoiceNumber',
      header: t('pages.sales.invoices.invoiceNo'),
      sortValue: (r) => r.invoiceNumber ?? r.job.jobNumber,
      // A job billed before the invoice series existed has no number of its own. Falling back
      // to the job number keeps the column honest rather than showing a blank where a
      // customer's copy has something printed on it.
      render: (r) => (
        <span className={r.cancelled ? 'font-semibold line-through' : 'font-semibold'}>
          {r.invoiceNumber ?? r.job.jobNumber}
        </span>
      ),
    },
    {
      key: 'jobNumber',
      header: t('common.jobCard'),
      hideOnMobile: true,
      sortValue: (r) => r.job.jobNumber,
      render: (r) => <span className="text-muted-foreground">{r.job.jobNumber}</span>,
    },
    {
      key: 'customer',
      header: t('common.customer'),
      sortValue: (r) => r.job.customerName,
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
      render: (r) => [r.job.brandName, r.job.model].filter(Boolean).join(' ') || '—',
    },
    {
      key: 'total',
      header: t('common.total'),
      sortValue: (r) => r.amount,
      render: (r) => `₹${r.amount}`,
    },
    {
      key: 'paid',
      header: t('common.paid'),
      sortValue: (r) => r.job.paidAmount,
      // A cancelled bill shows a dash rather than the job's running total: the money was not
      // paid against *this* bill, and repeating it on every cancelled row would read as the
      // customer having paid several times.
      render: (r) =>
        r.cancelled ? (
          '—'
        ) : (
          <span className="text-teal-600 dark:text-teal-400">₹{r.job.paidAmount}</span>
        ),
    },
    {
      key: 'outstanding',
      header: t('common.outstanding'),
      sortValue: (r) => (r.cancelled ? 0 : Math.max(0, r.amount - r.job.paidAmount)),
      render: (r) => {
        if (r.cancelled) return '—'
        const due = r.amount - r.job.paidAmount
        // An overpaid bill is not "outstanding" — it shows as settled here and surfaces as a
        // payable on the Payables page, which is the one place that difference is actionable.
        return due > 0 ? <span className="font-medium text-red-600">₹{due}</span> : '—'
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      sortValue: (r) => (r.cancelled ? 'cancelled' : r.job.status),
      render: (r) =>
        r.cancelled ? (
          <StatusBadge status={t('pages.sales.salesInvoices.cancelled')} tone="danger" />
        ) : (
          <StatusBadge status={statusLabel(r.job.status)} />
        ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`View bill ${r.job.jobNumber}`}
            onClick={(e) => {
              e.stopPropagation()
              setViewing(r.job)
            }}
          >
            <Eye className="size-4" />
          </Button>
          {/* A cancelled bill is a record, not a document to work on: nothing about it can be
           * edited and it cannot be cancelled twice. */}
          {!r.cancelled && (
            <>
              <Button
                type="button"
                size="icon-sm"
                aria-label={`Edit bill ${r.job.jobNumber}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditing(r.job)
                }}
              >
                <Pencil className="size-4" />
              </Button>
              {/* Only while the device is still here. Once it has gone, cancelling the bill is
               * a credit note, which is a different thing with its own questions about money
               * already collected — so the control is absent rather than half-working. */}
              {actionAppliesTo('voidBill', r.job.status) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-red-600"
                  aria-label={t('pages.sales.salesInvoices.cancelBill')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCancelling(r)
                  }}
                >
                  <Ban className="size-4" />
                </Button>
              )}
            </>
          )}
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
        actions={
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="size-4" />
            {t('common.refresh')}
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('shared.searchJobCardCustomerMobile')}
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
        showCustomRange
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      >
        {/* `option`, not `tab`: the callback parameter used to shadow the `tab` state, so
         * `tab === tab` was always true and every chip rendered as the selected one. */}
        <div className="flex flex-wrap gap-1 rounded-lg border p-0.5">
          {(Object.keys(TAB_LABELS) as Tab[]).map((option) => (
            <button
              key={option}
              type="button"
              data-slot="button"
              onClick={() => setTab(option)}
              aria-pressed={tab === option}
              className={
                'min-h-9 rounded-md px-3 py-1 text-sm ' +
                (tab === option ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted')
              }
            >
              {t(TAB_LABELS[option])} {counts[option]}
            </button>
          ))}
        </div>
        {dateRange !== 'all' && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setDateRange('all')}>
            {t('pages.sales.salesInvoices.clearDates')}
          </Button>
        )}
      </FilterBar>

      {cancelling && <CancelBillModal row={cancelling} onClose={() => setCancelling(null)} />}

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.key}
        rowClassName={(r) => (r.cancelled ? 'opacity-60' : undefined)}
        onRowClick={(r) => setViewing(r.job)}
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
      <BillDetailsModal job={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

/**
 * Cancelling a bill, as its own component.
 *
 * `useApplyJobAction` binds to one job when the hook is called, and a list has a different job
 * per row — so the modal is mounted with the row it is cancelling rather than hoisted to the
 * page, which would mean either calling the hook in a loop or writing a second mutation that
 * does the same thing.
 */
function CancelBillModal({ row, onClose }: { row: InvoiceRow; onClose: () => void }) {
  const { t } = useTranslation()
  const applyAction = useApplyJobAction(row.job)
  const [reason, setReason] = useState('')
  const number = row.invoiceNumber ?? row.job.jobNumber

  return (
    <FormModal
      needsConnection
      open
      onOpenChange={(o: boolean) => !o && onClose()}
      title={t('pages.sales.salesInvoices.cancelBillTitle', { number })}
      submitLabel={t('pages.sales.salesInvoices.cancelBill')}
      isSubmitting={applyAction.isPending}
      error={applyAction.error ? applyAction.error.message : null}
      onSubmit={async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reason.trim()) return
        try {
          await applyAction.mutateAsync({ action: 'voidBill', reason: reason.trim() })
        } catch {
          return // stays open, with the error above
        }
        onClose()
      }}
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t('pages.sales.salesInvoices.cancelBillMessage', { number })}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="cancel-bill-reason">
            {t('pages.sales.salesInvoices.cancelReason')}
            <span className="text-red-600"> *</span>
          </Label>
          <Textarea
            id="cancel-bill-reason"
            rows={2}
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            autoFocus
          />
        </div>
      </div>
    </FormModal>
  )
}
