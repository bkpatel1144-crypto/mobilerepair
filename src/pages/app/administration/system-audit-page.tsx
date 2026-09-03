import { useState } from 'react'
import { ClipboardList, AlertTriangle, Download, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuditLog, type AuditLogWithId } from '@/hooks/use-audit-log'
import { downloadCsv } from '@/lib/csv-export'
import { formatTimestamp } from '@/lib/utils'
import type { AuditResult } from '@/types/firestore'

const RESULT_LABEL: Record<AuditResult, string> = { success: 'Success', unauthorized: 'Unauthorized', blocked: 'Blocked' }
const RESULT_TONE: Record<AuditResult, 'success' | 'danger' | 'warning'> = {
  success: 'success',
  unauthorized: 'danger',
  blocked: 'warning',
}

export function SystemAuditPage() {
  const { data: events = [], isLoading } = useAuditLog()
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [resultFilter, setResultFilter] = useState<'all' | AuditResult>('all')
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [viewing, setViewing] = useState<AuditLogWithId | null>(null)

  const modules = Array.from(new Set(events.map((e) => e.module))).sort()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayCount = events.filter((e) => (e.createdAt?.toDate?.() ?? new Date(0)) >= startOfToday).length
  const criticalCount = events.filter((e) => e.critical).length

  const filtered = events
    .filter((e) => moduleFilter === 'all' || e.module === moduleFilter)
    .filter((e) => resultFilter === 'all' || e.result === resultFilter)
    .filter((e) => !criticalOnly || e.critical)
    .filter((e) =>
      search.trim()
        ? `${e.action} ${e.entityType} ${e.entityLabel} ${e.performedByName} ${e.targetLabel}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    )

  const columns: DataTableColumn<AuditLogWithId>[] = [
    { key: 'time', header: 'Time', sortValue: (e) => e.createdAt?.toDate?.()?.getTime() ?? 0, render: (e) => formatTimestamp(e.createdAt) },
    {
      key: 'action',
      header: 'Action',
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 font-medium">
          {e.critical && <AlertTriangle className="size-3.5 text-red-600" />}
          {e.action}
        </span>
      ),
    },
    { key: 'entity', header: 'Entity', render: (e) => <><p>{e.entityType}</p><p className="text-xs text-muted-foreground">{e.entityLabel}</p></> },
    { key: 'performedBy', header: 'Performed By', hideOnMobile: true, render: (e) => e.performedByName },
    { key: 'target', header: 'Target', hideOnMobile: true, render: (e) => e.targetLabel },
    { key: 'result', header: 'Result', render: (e) => <StatusBadge status={RESULT_LABEL[e.result]} tone={RESULT_TONE[e.result]} /> },
    { key: 'ip', header: 'IP', hideOnMobile: true, render: (e) => e.ip ?? '—' },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={ClipboardList}
        title="System Audit"
        subtitle="Full trail of every mutation across your company"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              downloadCsv(
                'system-audit.csv',
                filtered.map((e) => ({
                  Time: formatTimestamp(e.createdAt),
                  Action: e.action,
                  Entity: e.entityType,
                  'Entity Label': e.entityLabel,
                  'Performed By': e.performedByName,
                  Target: e.targetLabel,
                  Result: RESULT_LABEL[e.result],
                  IP: e.ip ?? '',
                }))
              )
            }
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        <StatCard label="Total Events" value={events.length} icon={ClipboardList} />
        <StatCard label="Critical" value={criticalCount} icon={AlertTriangle} tone={criticalCount > 0 ? 'danger' : 'default'} selected={criticalOnly} onClick={() => setCriticalOnly((v) => !v)} />
        <StatCard label="Today" value={todayCount} icon={Calendar} />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search action, entity, user...">
        <Select value={moduleFilter} onValueChange={(v) => v && setModuleFilter(v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={resultFilter} onValueChange={(v) => v && setResultFilter(v as typeof resultFilter)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Results" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="unauthorized">Unauthorized</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={ClipboardList} title="No audit events yet" description="Every write your team makes will show up here." />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={ClipboardList}
          title={viewing.action}
          subtitle={`${viewing.entityType} · ${viewing.entityLabel}`}
          badges={
            <>
              <StatusBadge status={RESULT_LABEL[viewing.result]} tone={RESULT_TONE[viewing.result]} />
              {viewing.critical && <StatusBadge status="Critical" tone="danger" icon={AlertTriangle} />}
            </>
          }
          sections={[
            {
              title: 'ENTITY',
              rows: [
                { label: 'Type', value: viewing.entityType },
                { label: 'ID', value: viewing.entityId ?? '—' },
                { label: 'Target', value: viewing.targetLabel },
              ],
            },
            {
              title: 'PERFORMED BY',
              rows: [
                { label: 'Name', value: viewing.performedByName },
                { label: 'Role', value: viewing.performedByRole },
                { label: 'Branch', value: viewing.performedByBranch },
              ],
            },
            {
              title: 'SESSION INFO',
              rows: [
                { label: 'Time', value: formatTimestamp(viewing.createdAt) },
                { label: 'IP Address', value: viewing.ip ?? '—' },
                { label: 'Browser', value: viewing.userAgent || '—' },
              ],
            },
            {
              title: 'ADDITIONAL DETAILS',
              children:
                Object.keys(viewing.details).length > 0 ? (
                  <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs">
                    {JSON.stringify(viewing.details, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">No additional details recorded.</p>
                ),
            },
          ]}
        />
      )}
    </div>
  )
}
