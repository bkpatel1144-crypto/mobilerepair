import { useState } from 'react'
import { Calculator, IndianRupee } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useJobCards, type JobCardWithId } from '@/hooks/use-job-cards'
import { useJobCostingList } from '@/hooks/use-job-costing'
import { formatTimestamp } from '@/lib/utils'
import { RecordCostingModal } from './job-costing/record-costing-modal'
import { useTranslation } from 'react-i18next'

type Tab = 'all' | 'pending' | 'done'

export function JobCostingPage() {
  const { t } = useTranslation()
  const { data: jobs = [], isLoading, error: loadError, refetch } = useJobCards()
  const { data: costings = [] } = useJobCostingList()

  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobCardWithId | null>(null)
  const [recordingJob, setRecordingJob] = useState<JobCardWithId | null>(null)

  const closedJobs = jobs.filter((j) => j.status === 'closed')
  const costingByJobId = new Map(costings.map((c) => [c.id, c]))

  const filtered = closedJobs
    .filter((j) =>
      `${j.jobNumber} ${j.customerName} ${j.model ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter((j) => {
      if (tab === 'all') return true
      const done = costingByJobId.has(j.id)
      return tab === 'done' ? done : !done
    })

  const pendingCount = closedJobs.filter((j) => !costingByJobId.has(j.id)).length
  const doneCount = closedJobs.length - pendingCount

  const columns: DataTableColumn<JobCardWithId>[] = [
    {
      key: 'job',
      header: t('common.job'),
      render: (j) => <span className="font-semibold">{j.jobNumber}</span>,
    },
    { key: 'customer', header: t('common.customer'), render: (j) => j.customerName },
    {
      key: 'device',
      header: t('common.device'),
      render: (j) => [j.brandName, j.model].filter(Boolean).join(' ') || '—',
    },
    {
      key: 'technician',
      header: t('common.technician'),
      hideOnMobile: true,
      render: (j) => j.assignedToName ?? '—',
    },
    {
      key: 'parts',
      header: t('common.parts'),
      hideOnMobile: true,
      render: (j) => `⚙ ${j.partsUsed.length} parts`,
    },
    {
      key: 'revenue',
      header: t('common.revenue'),
      render: (j) => `₹${j.finalAmount ?? j.estimatedCost}`,
    },
    {
      key: 'profit',
      header: t('common.profit'),
      hideOnMobile: true,
      render: (j) => {
        const costing = costingByJobId.get(j.id)
        return costing ? `₹${costing.profit}` : '—'
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      render: () => <StatusBadge status="Closed" tone="neutral" />,
    },
    {
      key: 'costing',
      header: t('pages.service.jobCosting.costing'),
      render: (j) =>
        costingByJobId.has(j.id) ? (
          <StatusBadge status="Recorded" tone="success" />
        ) : (
          <StatusBadge status="Pending Costing" tone="warning" />
        ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Calculator}
        title={t('pages.service.jobCosting.jobCosting')}
        subtitle={t('pages.service.jobCosting.closedJobsRecordActualPartsLabor')}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search job, customer, device..."
      >
        <div className="flex gap-1 rounded-lg border p-0.5">
          {(['all', 'pending', 'done'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              data-slot="button"
              onClick={() => setTab(tab)}
              className={
                'rounded-md px-3 py-1 text-sm capitalize ' +
                (tab === tab ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted')
              }
            >
              {tab}{' '}
              {tab === 'pending' ? `(${pendingCount})` : tab === 'done' ? `(${doneCount})` : ''}
            </button>
          ))}
        </div>
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
            icon={Calculator}
            title={t('pages.service.jobCosting.noClosedJobsYet')}
            description={t('pages.service.jobCosting.closedJobCardsReadyForCosting')}
          />
        }
      />

      <DetailDrawer
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
        icon={IndianRupee}
        title={selectedJob?.jobNumber}
        badges={
          selectedJob && (
            <>
              <StatusBadge status="Closed" tone="neutral" />
              {costingByJobId.has(selectedJob.id) ? (
                <StatusBadge status="Costed" tone="success" />
              ) : (
                <StatusBadge status="Pending Costing" tone="warning" />
              )}
            </>
          )
        }
        actions={
          selectedJob && (
            <Button
              type="button"
              onClick={() => {
                // Close the drawer first — `RecordCostingModal` is its own fixed-overlay modal,
                // not nested inside the drawer, so leaving the Sheet open underneath stacks two
                // backdrops at the same z-index and the *older* one (the Sheet's) ends up
                // intercepting clicks meant for the modal's own buttons.
                setRecordingJob(selectedJob)
                setSelectedJob(null)
              }}
            >
              <IndianRupee className="size-4" />
              Record Cost
            </Button>
          )
        }
        sections={
          selectedJob
            ? [
                {
                  title: t('pages.service.jobCosting.jobDetails'),
                  rows: [
                    { label: t('common.customer'), value: selectedJob.customerName },
                    { label: t('common.technician'), value: selectedJob.assignedToName ?? '—' },
                    {
                      label: t('common.device'),
                      value:
                        [selectedJob.brandName, selectedJob.model].filter(Boolean).join(' ') || '—',
                    },
                    { label: t('shared.imei'), value: selectedJob.imei ?? '—' },
                    { label: t('common.createdAt'), value: formatTimestamp(selectedJob.createdAt) },
                    { label: t('shared.closed'), value: formatTimestamp(selectedJob.closedAt) },
                  ],
                },
                {
                  title: t('pages.service.jobCosting.financial'),
                  rows: [
                    {
                      label: t('common.revenue'),
                      value: `₹${selectedJob.finalAmount ?? selectedJob.estimatedCost}`,
                    },
                    {
                      label: t('pages.service.jobCosting.advancePaid'),
                      value: `₹${selectedJob.advanceReceived}`,
                    },
                  ],
                },
              ]
            : []
        }
      >
        {selectedJob && selectedJob.partsUsed.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Parts Used ({selectedJob.partsUsed.length})</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.part')}</TableHead>
                  <TableHead>{t('common.rate')}</TableHead>
                  <TableHead>{t('shared.qty')}</TableHead>
                  <TableHead>{t('common.total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedJob.partsUsed.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.itemName}</TableCell>
                    <TableCell>₹{p.rate}</TableCell>
                    <TableCell>{p.qty}</TableCell>
                    <TableCell>₹{p.rate * p.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DetailDrawer>

      {recordingJob && (
        <RecordCostingModal
          job={recordingJob}
          existing={costingByJobId.get(recordingJob.id) ?? null}
          onClose={() => setRecordingJob(null)}
        />
      )}
    </div>
  )
}
