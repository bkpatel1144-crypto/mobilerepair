import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardCheck, Inbox, ScanLine, SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScanJobCardModal } from '@/components/shared/scan-job-card-modal'
import { useJobCards, type JobCardWithId } from '@/hooks/use-job-cards'
import { useUsers } from '@/hooks/use-users'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import { crudKey } from '@/config/permission-schema'
import { formatTimestamp } from '@/lib/utils'
import { dateRangeBounds } from '@/lib/date-range'
import { buildPath } from '@/config/nav'
import { JobCardDetailDrawer } from './job-cards/job-card-detail-drawer'
import { StatusPill } from './job-cards/status-pill'
import { useTranslation } from 'react-i18next'
import { ScrollRow } from '@/components/shared/scroll-row'

type StatusPill = 'total' | (typeof JOB_STATUSES)[number]['key']

function statusLabel(key: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

export function JobCardsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: jobs = [], isLoading, error: loadError, refetch } = useJobCards()
  const { data: users = [] } = useUsers()
  const { user, profile } = useAuth()
  const { canDo } = usePermissions()

  const [statusFilter, setStatusFilter] = useState<StatusPill>('total')
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [assignedToFilter, setAssignedToFilter] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [myCompletedOnly, setMyCompletedOnly] = useState(false)
  const [myReceivedOnly, setMyReceivedOnly] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobCardWithId | null>(null)

  const counts: Record<StatusPill, number> = {
    total: jobs.length,
    ...(Object.fromEntries(
      JOB_STATUSES.map((s) => [s.key, jobs.filter((j) => j.status === s.key).length])
    ) as Record<string, number>),
  }

  const myCompletedCount = jobs.filter(
    (j) =>
      j.assignedToId === user?.uid &&
      ['techDone', 'ready', 'delivered', 'closed'].includes(j.status)
  ).length
  const myReceivedCount = jobs.filter((j) => j.receivedById === user?.uid).length

  const bounds = dateRangeBounds(dateRange)

  const filtered = jobs
    .filter((j) => statusFilter === 'total' || j.status === statusFilter)
    .filter((j) =>
      search.trim()
        ? `${j.jobNumber} ${j.customerName} ${j.customerMobile}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    )
    .filter((j) => {
      if (!bounds) return true
      const created = j.createdAt?.toDate?.()
      return !!created && created >= bounds.from && created <= bounds.to
    })
    .filter(
      (j) =>
        assignedToFilter.length === 0 ||
        (j.assignedToId && assignedToFilter.includes(j.assignedToId))
    )
    .filter(
      (j) =>
        !myCompletedOnly ||
        (j.assignedToId === user?.uid &&
          ['techDone', 'ready', 'delivered', 'closed'].includes(j.status))
    )
    .filter((j) => !myReceivedOnly || j.receivedById === user?.uid)

  const columns: DataTableColumn<JobCardWithId>[] = [
    { key: 'created', header: t('common.createdAt'), render: (j) => formatTimestamp(j.createdAt) },
    {
      key: 'jobNumber',
      header: t('common.jobCard'),
      sortValue: (j) => j.jobNumber,
      render: (j) => <span className="font-semibold">{j.jobNumber}</span>,
    },
    {
      key: 'customer',
      header: t('common.customer'),
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
      render: (j) => (
        <div>
          <p>{[j.brandName, j.model].filter(Boolean).join(' ') || '—'}</p>
          <p className="text-xs text-muted-foreground">{j.deviceTypeName}</p>
        </div>
      ),
    },
    {
      key: 'receivedBy',
      header: t('common.receivedBy'),
      hideOnMobile: true,
      render: (j) => j.receivedByName,
    },
    {
      key: 'assignedTo',
      header: t('common.assignedTo'),
      hideOnMobile: true,
      render: (j) => j.assignedToName ?? '—',
    },
    {
      key: 'estCost',
      header: t('shared.estCost'),
      hideOnMobile: true,
      render: (j) => `₹${j.estimatedCost}`,
    },
    {
      key: 'finalAmt',
      header: t('shared.finalAmt'),
      hideOnMobile: true,
      render: (j) => (j.finalAmount != null ? `₹${j.finalAmount}` : '—'),
    },
    { key: 'paid', header: t('common.paid'), render: (j) => `₹${j.paidAmount}` },
    {
      key: 'due',
      header: t('common.due'),
      render: (j) => {
        const due = (j.finalAmount ?? j.estimatedCost) - j.paidAmount
        return due > 0 ? `₹${due}` : '—'
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (j) => <StatusBadge status={statusLabel(j.status)} dot />,
    },
    {
      key: 'deliveredBy',
      header: t('pages.service.jobCards.deliveredReturnedBy'),
      hideOnMobile: true,
      render: (j) => j.deliveredByName ?? j.returnedByName ?? '—',
    },
    {
      key: 'cancelledBy',
      header: t('shared.cancelledBy'),
      hideOnMobile: true,
      render: (j) => j.cancelledByName ?? '—',
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title={t('pages.service.jobCards.roleJobs', { role: profile?.roleName ?? '' })}
        subtitle={t('pages.service.jobCards.clickAStatusCardToFilter')}
        actions={
          <>
            {canDo(crudKey('service', 'jobCards', 'create')) && (
              <Button
                type="button"
                onClick={() => navigate(`${buildPath('service', 'job-cards')}/create`)}
              >
                <Plus className="size-4" />
                {t('pages.service.jobCards.createJobCard')}
              </Button>
            )}
          </>
        }
      />

      {/* One swipeable line, not six wrapped rows. Eleven status cards at two or three per row
       * pushed the search box and the table itself most of a screen down the page, so the list
       * you came to read started below the fold. */}
      <ScrollRow className="gap-2">
        <StatusPill
          statusKey="total"
          label={t('common.total')}
          value={counts.total}
          selected={statusFilter === 'total'}
          onClick={() => setStatusFilter('total')}
        />
        {JOB_STATUSES.map((s) => (
          <StatusPill
            key={s.key}
            statusKey={s.key}
            label={s.label}
            value={counts[s.key] ?? 0}
            selected={statusFilter === s.key}
            onClick={() => setStatusFilter(s.key)}
          />
        ))}
      </ScrollRow>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.service.jobCards.searchJobCustomerMobile')}
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      >
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setScanOpen(true)}
          aria-label={t('shared.scanJobCard')}
        >
          <ScanLine className="size-4" />
        </Button>

        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant={assignedToFilter.length > 0 ? 'default' : 'outline'}
              >
                <SlidersHorizontal className="size-3.5" />
                Filters{assignedToFilter.length > 0 ? ` (${assignedToFilter.length})` : ''}
              </Button>
            }
          />
          <PopoverContent className="w-64 p-3" align="start">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('common.assignedTo')}
            </p>
            <div className="max-h-56 space-y-0.5 overflow-y-auto">
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('pages.service.jobCards.noUsersYet')}
                </p>
              )}
              {users.map((u) => {
                const checked = assignedToFilter.includes(u.id)
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      setAssignedToFilter((prev) =>
                        checked ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                      )
                    }
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => {}} />
                    {u.fullName}
                  </button>
                )
              })}
            </div>
            {assignedToFilter.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2 w-full"
                onClick={() => setAssignedToFilter([])}
              >
                Clear
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          size="sm"
          variant={myCompletedOnly ? 'default' : 'outline'}
          onClick={() => setMyCompletedOnly((v) => !v)}
        >
          <ClipboardCheck className="size-3.5" />
          My Completed Jobs ({myCompletedCount})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={myReceivedOnly ? 'default' : 'outline'}
          onClick={() => setMyReceivedOnly((v) => !v)}
        >
          <Inbox className="size-3.5" />
          My Received Jobs ({myReceivedCount})
        </Button>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(j) => j.id}
        onRowClick={setSelectedJob}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={ClipboardCheck}
            title={t('shared.noJobCardsFound')}
            description={t('pages.service.jobCards.createYourFirstJobCardTo')}
          />
        }
      />

      <JobCardDetailDrawer
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      />
      <ScanJobCardModal open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  )
}
