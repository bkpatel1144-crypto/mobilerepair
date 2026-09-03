import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Users, Briefcase, Download, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFieldVisits, type FieldVisitWithId } from '@/hooks/use-reports'
import { dateRangeBounds } from '@/lib/date-range'
import { downloadCsv } from '@/lib/csv-export'
import { formatTimestamp } from '@/lib/utils'
import { formatDurationLabel } from '@/lib/date-range'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'

function statusLabel(key: string) {
  return JOB_STATUSES.find((s) => s.key === key)?.label ?? key
}

interface TechnicianVisitGroup {
  technicianId: string
  technicianName: string
  visits: FieldVisitWithId[]
  totalMinutes: number
  jobsVisited: number
}

interface JobVisitGroup {
  jobCardId: string
  jobNumber: string
  customerName: string
  visits: FieldVisitWithId[]
  totalMinutes: number
}

/** `preview (32)` — reads `useFieldVisits()`, the flat collection `useApplyJobAction()`'s own
 * "Field Visit" job action writes alongside the job's own timeline event (see `FieldVisitDoc`'s
 * doc comment). Genuinely, honestly empty for a company that's never logged one — there's no
 * fabricated data behind the zero-state, same as the reference's own screenshot. */
export function FieldVisitReportPage() {
  const { data: visits = [], isLoading } = useFieldVisits()
  const [view, setView] = useState<'technician' | 'jobCard'>('technician')
  const [search, setSearch] = useState('')
  const [technicianFilter, setTechnicianFilter] = useState('all')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showTechnicianList, setShowTechnicianList] = useState(false)

  const bounds = dateRangeBounds(dateRange, customFrom, customTo)
  const filtered = visits
    .filter((v) => !bounds || ((v.createdAt?.toDate?.() ?? new Date()) >= bounds.from && (v.createdAt?.toDate?.() ?? new Date()) <= bounds.to))
    .filter((v) => technicianFilter === 'all' || v.technicianName === technicianFilter)
    .filter((v) => deviceTypeFilter === 'all' || v.deviceTypeName === deviceTypeFilter)
    .filter((v) => statusFilter === 'all' || v.jobStatus === statusFilter)

  const allTechnicians = Array.from(new Set(visits.map((v) => v.technicianName))).sort()
  const allDeviceTypes = Array.from(new Set(visits.map((v) => v.deviceTypeName).filter((v): v is string => !!v))).sort()

  const totals = {
    visits: filtered.length,
    totalMinutes: filtered.reduce((s, v) => s + (v.durationMinutes ?? 0), 0),
    technicians: new Set(filtered.map((v) => v.technicianId)),
    jobs: new Set(filtered.map((v) => v.jobCardId)),
  }

  function buildTechnicianGroups(): TechnicianVisitGroup[] {
    const map = new Map<string, TechnicianVisitGroup>()
    for (const v of filtered) {
      let group = map.get(v.technicianId)
      if (!group) {
        group = { technicianId: v.technicianId, technicianName: v.technicianName, visits: [], totalMinutes: 0, jobsVisited: 0 }
        map.set(v.technicianId, group)
      }
      group.visits.push(v)
      group.totalMinutes += v.durationMinutes ?? 0
    }
    for (const group of map.values()) group.jobsVisited = new Set(group.visits.map((v) => v.jobCardId)).size
    return Array.from(map.values())
      .filter((g) => (search.trim() ? g.technicianName.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => b.visits.length - a.visits.length)
  }
  const technicianGroups = buildTechnicianGroups()

  function buildJobGroups(): JobVisitGroup[] {
    const map = new Map<string, JobVisitGroup>()
    for (const v of filtered) {
      let group = map.get(v.jobCardId)
      if (!group) {
        group = { jobCardId: v.jobCardId, jobNumber: v.jobNumber, customerName: v.customerName, visits: [], totalMinutes: 0 }
        map.set(v.jobCardId, group)
      }
      group.visits.push(v)
      group.totalMinutes += v.durationMinutes ?? 0
    }
    return Array.from(map.values())
      .filter((g) => (search.trim() ? `${g.jobNumber} ${g.customerName}`.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => b.visits.length - a.visits.length)
  }
  const jobGroups = buildJobGroups()

  const technicianColumns: DataTableColumn<TechnicianVisitGroup>[] = [
    { key: 'technician', header: 'Technician', sortValue: (g) => g.technicianName, render: (g) => <span className="font-medium">{g.technicianName}</span> },
    { key: 'visits', header: 'Visits', sortValue: (g) => g.visits.length, render: (g) => g.visits.length },
    { key: 'time', header: 'Time Spent', sortValue: (g) => g.totalMinutes, render: (g) => formatDurationLabel(g.totalMinutes * 60000) },
    { key: 'jobs', header: 'Jobs Visited', sortValue: (g) => g.jobsVisited, render: (g) => g.jobsVisited },
  ]

  const jobColumns: DataTableColumn<JobVisitGroup>[] = [
    {
      key: 'job',
      header: 'Job Card',
      sortValue: (g) => g.jobNumber,
      render: (g) => (
        <Link to={`/app/service/job-cards/${g.jobCardId}`} className="font-medium text-teal-700 hover:underline dark:text-teal-400">
          {g.jobNumber}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', sortValue: (g) => g.customerName, render: (g) => g.customerName },
    { key: 'visits', header: 'Visits', sortValue: (g) => g.visits.length, render: (g) => g.visits.length },
    { key: 'time', header: 'Time Spent', sortValue: (g) => g.totalMinutes, render: (g) => formatDurationLabel(g.totalMinutes * 60000) },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={MapPin}
        title="Field Visit Report"
        subtitle="On-field technician logbook — time spent & engineers per job"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              downloadCsv(
                'field-visit-report.csv',
                filtered.map((v) => ({
                  'Job Card': v.jobNumber,
                  Customer: v.customerName,
                  Technician: v.technicianName,
                  'Device Type': v.deviceTypeName ?? '',
                  Status: statusLabel(v.jobStatus),
                  'Duration (min)': v.durationMinutes ?? '',
                  Note: v.note ?? '',
                  Logged: formatTimestamp(v.createdAt),
                }))
              )
            }
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Visits" value={totals.visits} icon={MapPin} />
        <StatCard label="Total Time Spent" value={formatDurationLabel(totals.totalMinutes * 60000)} icon={Clock} tone="purple" />
        <StatCard
          label="Technicians On-Field"
          value={totals.technicians.size}
          icon={Users}
          sublabel={totals.technicians.size > 0 ? 'Tap to see who' : undefined}
          onClick={totals.technicians.size > 0 ? () => setShowTechnicianList((v) => !v) : undefined}
        />
        <StatCard label="Jobs Visited" value={totals.jobs.size} icon={Briefcase} tone="success" />
      </div>

      {showTechnicianList && totals.technicians.size > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 p-2.5 text-sm">
          {allTechnicians
            .filter((name) => filtered.some((v) => v.technicianName === name))
            .map((name) => (
              <span key={name} className="rounded-full border bg-background px-2 py-0.5 text-xs">
                {name}
              </span>
            ))}
          <button type="button" onClick={() => setShowTechnicianList(false)} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        <FilterBar
          dateRange={dateRange === 'all' ? undefined : dateRange}
          onDateRangeChange={setDateRange}
          showCustomRange
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        >
          <Select value={technicianFilter} onValueChange={(v) => v && setTechnicianFilter(v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Technicians" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {allTechnicians.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={deviceTypeFilter} onValueChange={(v) => v && setDeviceTypeFilter(v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {allDeviceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {JOB_STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterBar>

        <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder={view === 'technician' ? 'Search technician...' : 'Search job, customer...'}>
          <div className="flex gap-1 rounded-lg border p-0.5">
            <Button type="button" size="sm" variant={view === 'technician' ? 'default' : 'ghost'} onClick={() => setView('technician')}>
              <Users className="size-3.5" />
              By Technician ({technicianGroups.length})
            </Button>
            <Button type="button" size="sm" variant={view === 'jobCard' ? 'default' : 'ghost'} onClick={() => setView('jobCard')}>
              <Briefcase className="size-3.5" />
              By Job Card ({jobGroups.length})
            </Button>
          </div>
        </FilterBar>
      </div>

      {view === 'technician' ? (
        <DataTable
          columns={technicianColumns}
          data={technicianGroups}
          rowKey={(g) => g.technicianId}
          isLoading={isLoading}
          emptyState={<EmptyState icon={MapPin} title="No field visits logged in this period" description="Log a Field Visit from a job card to see it here." />}
        />
      ) : (
        <DataTable
          columns={jobColumns}
          data={jobGroups}
          rowKey={(g) => g.jobCardId}
          isLoading={isLoading}
          emptyState={<EmptyState icon={MapPin} title="No field visits logged in this period" description="Log a Field Visit from a job card to see it here." />}
        />
      )}
    </div>
  )
}
