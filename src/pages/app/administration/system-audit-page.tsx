import { useState } from 'react'
import { ClipboardList, AlertTriangle, Download, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuditLog, type AuditLogWithId } from '@/hooks/use-audit-log'
import { downloadCsv } from '@/lib/csv-export'
import { formatTimestamp } from '@/lib/utils'
import type { AuditResult } from '@/types/firestore'
import { useTranslation } from 'react-i18next'

const RESULT_LABEL: Record<AuditResult, string> = {
  success: 'Success',
  unauthorized: 'Unauthorized',
  blocked: 'Blocked',
  failed: 'Failed',
}
const RESULT_TONE: Record<AuditResult, 'success' | 'danger' | 'warning'> = {
  success: 'success',
  unauthorized: 'danger',
  blocked: 'warning',
  failed: 'danger',
}

export function SystemAuditPage() {
  const { t } = useTranslation()
  const { data: events = [], isLoading, error: loadError, refetch } = useAuditLog()
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [resultFilter, setResultFilter] = useState<'all' | AuditResult>('all')
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [viewing, setViewing] = useState<AuditLogWithId | null>(null)

  const modules = Array.from(new Set(events.map((e) => e.module))).sort()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayCount = events.filter(
    (e) => (e.createdAt?.toDate?.() ?? new Date(0)) >= startOfToday
  ).length
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
    {
      key: 'time',
      header: t('common.time'),
      sortValue: (e) => e.createdAt?.toDate?.()?.getTime() ?? 0,
      render: (e) => formatTimestamp(e.createdAt),
    },
    {
      key: 'action',
      header: t('pages.administration.systemAudit.action'),
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 font-medium">
          {e.critical && <AlertTriangle className="size-3.5 text-red-600" />}
          {e.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: t('shared.entity'),
      render: (e) => (
        <>
          <p>{e.entityType}</p>
          <p className="text-xs text-muted-foreground">{e.entityLabel}</p>
        </>
      ),
    },
    {
      key: 'performedBy',
      header: t('pages.administration.systemAudit.performedBy'),
      hideOnMobile: true,
      render: (e) => e.performedByName,
    },
    {
      key: 'target',
      header: t('pages.administration.systemAudit.target'),
      hideOnMobile: true,
      render: (e) => e.targetLabel,
    },
    {
      key: 'result',
      header: t('shared.result'),
      render: (e) => <StatusBadge status={RESULT_LABEL[e.result]} tone={RESULT_TONE[e.result]} />,
    },
    { key: 'ip', header: t('shared.ip'), hideOnMobile: true, render: (e) => e.ip ?? '—' },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={ClipboardList}
        title={t('pages.administration.systemAudit.systemAudit')}
        subtitle={t('pages.administration.systemAudit.fullTrailOfEveryMutationAcross')}
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

      <StatCardGrid>
        <StatCard
          label={t('pages.administration.systemAudit.totalEvents')}
          value={events.length}
          icon={ClipboardList}
        />
        <StatCard
          label={t('pages.administration.systemAudit.critical')}
          value={criticalCount}
          icon={AlertTriangle}
          tone={criticalCount > 0 ? 'danger' : 'default'}
          selected={criticalOnly}
          onClick={() => setCriticalOnly((v) => !v)}
        />
        <StatCard label={t('common.today')} value={todayCount} icon={Calendar} />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search action, entity, user..."
      >
        <Select value={moduleFilter} onValueChange={(v) => v && setModuleFilter(v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('pages.administration.systemAudit.allModules')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.administration.systemAudit.allModules')}</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={resultFilter}
          onValueChange={(v) => v && setResultFilter(v as typeof resultFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('pages.administration.systemAudit.allResults')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.administration.systemAudit.allResults')}</SelectItem>
            <SelectItem value="success">{t('pages.administration.systemAudit.success')}</SelectItem>
            <SelectItem value="unauthorized">{t('shared.unauthorized')}</SelectItem>
            <SelectItem value="blocked">{t('pages.administration.systemAudit.blocked')}</SelectItem>
            <SelectItem value="failed">{t('pages.administration.systemAudit.failed')}</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        onRowClick={setViewing}
        emptyState={
          <EmptyState
            icon={ClipboardList}
            title={t('pages.administration.systemAudit.noAuditEventsYet')}
            description={t('pages.administration.systemAudit.everyWriteYourTeamMakesWill')}
          />
        }
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
              <StatusBadge
                status={RESULT_LABEL[viewing.result]}
                tone={RESULT_TONE[viewing.result]}
              />
              {viewing.critical && (
                <StatusBadge
                  status={t('pages.administration.systemAudit.critical')}
                  tone="danger"
                  icon={AlertTriangle}
                />
              )}
            </>
          }
          sections={[
            {
              title: t('pages.administration.systemAudit.entity'),
              rows: [
                { label: t('common.type'), value: viewing.entityType },
                { label: t('pages.administration.systemAudit.id'), value: viewing.entityId ?? '—' },
                { label: t('pages.administration.systemAudit.target'), value: viewing.targetLabel },
              ],
            },
            {
              title: t('pages.administration.systemAudit.performedBy2'),
              rows: [
                { label: t('common.name'), value: viewing.performedByName },
                { label: t('common.role'), value: viewing.performedByRole },
                { label: t('common.branch'), value: viewing.performedByBranch },
              ],
            },
            {
              title: t('shared.sessionInfo'),
              rows: [
                { label: t('common.time'), value: formatTimestamp(viewing.createdAt) },
                { label: t('shared.ipAddress'), value: viewing.ip ?? '—' },
                { label: t('shared.browser'), value: viewing.userAgent || '—' },
              ],
            },
            {
              title: t('pages.administration.systemAudit.additionalDetails'),
              children:
                Object.keys(viewing.details).length > 0 ? (
                  <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs">
                    {JSON.stringify(viewing.details, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('pages.administration.systemAudit.noAdditionalDetailsRecorded')}
                  </p>
                ),
            },
          ]}
        />
      )}
    </div>
  )
}
