import { useState } from 'react'
import { Calculator, IndianRupee } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useJobCards, type JobCardWithId } from '@/hooks/use-job-cards'
import { useJobCostingList } from '@/hooks/use-job-costing'
import { formatTimestamp } from '@/lib/utils'
import { RecordCostingModal } from './job-costing/record-costing-modal'

type Tab = 'all' | 'pending' | 'done'

export function JobCostingPage() {
  const { data: jobs = [], isLoading } = useJobCards()
  const { data: costings = [] } = useJobCostingList()

  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobCardWithId | null>(null)
  const [recordingJob, setRecordingJob] = useState<JobCardWithId | null>(null)

  const closedJobs = jobs.filter((j) => j.status === 'closed')
  const costingByJobId = new Map(costings.map((c) => [c.id, c]))

  const filtered = closedJobs
    .filter((j) => `${j.jobNumber} ${j.customerName} ${j.model ?? ''}`.toLowerCase().includes(search.toLowerCase()))
    .filter((j) => {
      if (tab === 'all') return true
      const done = costingByJobId.has(j.id)
      return tab === 'done' ? done : !done
    })

  const pendingCount = closedJobs.filter((j) => !costingByJobId.has(j.id)).length
  const doneCount = closedJobs.length - pendingCount

  const columns: DataTableColumn<JobCardWithId>[] = [
    { key: 'job', header: 'Job', render: (j) => <span className="font-semibold">{j.jobNumber}</span> },
    { key: 'customer', header: 'Customer', render: (j) => j.customerName },
    { key: 'device', header: 'Device', render: (j) => [j.brandName, j.model].filter(Boolean).join(' ') || '—' },
    { key: 'technician', header: 'Technician', hideOnMobile: true, render: (j) => j.assignedToName ?? '—' },
    { key: 'parts', header: 'Parts', hideOnMobile: true, render: (j) => `⚙ ${j.partsUsed.length} parts` },
    { key: 'revenue', header: 'Revenue', render: (j) => `₹${j.finalAmount ?? j.estimatedCost}` },
    {
      key: 'profit',
      header: 'Profit',
      hideOnMobile: true,
      render: (j) => {
        const costing = costingByJobId.get(j.id)
        return costing ? `₹${costing.profit}` : '—'
      },
    },
    { key: 'status', header: 'Status', render: () => <StatusBadge status="Closed" tone="neutral" /> },
    {
      key: 'costing',
      header: 'Costing',
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
        title="Job Costing"
        subtitle="Closed jobs — record actual parts, labor & overhead costs"
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search job, customer, device...">
        <div className="flex gap-1 rounded-lg border p-0.5">
          {(['all', 'pending', 'done'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                'rounded-md px-3 py-1 text-sm capitalize ' +
                (tab === t ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted')
              }
            >
              {t} {t === 'pending' ? `(${pendingCount})` : t === 'done' ? `(${doneCount})` : ''}
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
        emptyState={<EmptyState icon={Calculator} title="No closed jobs yet" description="Closed job cards ready for costing will show up here." />}
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
                  title: 'Job Details',
                  rows: [
                    { label: 'Customer', value: selectedJob.customerName },
                    { label: 'Technician', value: selectedJob.assignedToName ?? '—' },
                    { label: 'Device', value: [selectedJob.brandName, selectedJob.model].filter(Boolean).join(' ') || '—' },
                    { label: 'IMEI', value: selectedJob.imei ?? '—' },
                    { label: 'Created', value: formatTimestamp(selectedJob.createdAt) },
                    { label: 'Closed', value: formatTimestamp(selectedJob.closedAt) },
                  ],
                },
                {
                  title: 'Financial',
                  rows: [
                    { label: 'Revenue', value: `₹${selectedJob.finalAmount ?? selectedJob.estimatedCost}` },
                    { label: 'Advance Paid', value: `₹${selectedJob.advanceReceived}` },
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
                  <TableHead>Part</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
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
