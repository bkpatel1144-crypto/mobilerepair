import { useState } from 'react'
import { LogIn, Users, Globe, ShieldAlert, ShieldX, Ban, Wifi, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Input } from '@/components/ui/input'
import { useLoginReport } from '@/hooks/use-login-report'
import { useSessions, isSessionOnline } from '@/hooks/use-sessions'
import { formatTimestamp } from '@/lib/utils'
import { dateRangeBounds } from '@/lib/date-range'
import type { AuditLogWithId } from '@/hooks/use-audit-log'
import type { AuditResult } from '@/types/firestore'

type CardFilter = 'all' | 'online' | 'today' | 'users' | 'ips' | 'failed' | 'unauthorized' | 'blocked'

const RESULT_LABEL: Record<AuditResult, string> = { success: 'Success', unauthorized: 'Unauthorized', blocked: 'Blocked' }
const RESULT_TONE: Record<AuditResult, 'success' | 'danger' | 'warning'> = {
  success: 'success',
  unauthorized: 'danger',
  blocked: 'warning',
}

export function LoginReportPage() {
  const { data, isLoading } = useLoginReport()
  const { data: sessions = [] } = useSessions()
  const [cardFilter, setCardFilter] = useState<CardFilter>('all')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [ipFilter, setIpFilter] = useState('')
  const [viewing, setViewing] = useState<AuditLogWithId | null>(null)

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const onlineUserIds = new Set(sessions.filter(isSessionOnline).map((s) => s.userId))

  const bounds = dateRangeBounds(dateRange)
  const filtered = data.loginEvents
    .filter((e) => !bounds || ((e.createdAt?.toDate?.() ?? new Date(0)) >= bounds.from && (e.createdAt?.toDate?.() ?? new Date(0)) <= bounds.to))
    .filter((e) => !ipFilter.trim() || (e.ip ?? '').includes(ipFilter.trim()))
    .filter((e) => {
      const isToday = (e.createdAt?.toDate?.() ?? new Date(0)) >= startOfToday
      switch (cardFilter) {
        case 'online':
          return onlineUserIds.has(e.performedById)
        case 'today':
        case 'users':
        case 'ips':
          return isToday
        case 'failed':
          return isToday && e.result !== 'success'
        case 'unauthorized':
          return isToday && e.result === 'unauthorized'
        case 'blocked':
          return isToday && e.result === 'blocked'
        default:
          return true
      }
    })

  const columns: DataTableColumn<AuditLogWithId>[] = [
    { key: 'time', header: 'Time', sortValue: (e) => e.createdAt?.toDate?.()?.getTime() ?? 0, render: (e) => formatTimestamp(e.createdAt) },
    { key: 'user', header: 'User', render: (e) => <><p className="font-medium">{e.performedByName}</p><p className="text-xs text-muted-foreground">{e.entityLabel}</p></> },
    { key: 'role', header: 'Role', hideOnMobile: true, render: (e) => e.performedByRole },
    { key: 'ip', header: 'IP', hideOnMobile: true, render: (e) => e.ip ?? '—' },
    { key: 'result', header: 'Result', render: (e) => <StatusBadge status={RESULT_LABEL[e.result]} tone={RESULT_TONE[e.result]} /> },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader icon={LogIn} title="Login Report" subtitle="Every account sign-in across your company" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Online Right Now" value={data.onlineRightNow} icon={Wifi} tone="success" selected={cardFilter === 'online'} onClick={() => setCardFilter(cardFilter === 'online' ? 'all' : 'online')} />
        <StatCard label="Logins Today" value={data.loginsToday} icon={LogIn} selected={cardFilter === 'today'} onClick={() => setCardFilter(cardFilter === 'today' ? 'all' : 'today')} />
        <StatCard label="Users Today" value={data.usersToday} icon={Users} selected={cardFilter === 'users'} onClick={() => setCardFilter(cardFilter === 'users' ? 'all' : 'users')} />
        <StatCard label="IP Addresses" value={data.ipAddressesToday} icon={Globe} selected={cardFilter === 'ips'} onClick={() => setCardFilter(cardFilter === 'ips' ? 'all' : 'ips')} />
        <StatCard label="Failed Attempts" value={data.failedAttemptsToday} icon={ShieldAlert} tone="warning" selected={cardFilter === 'failed'} onClick={() => setCardFilter(cardFilter === 'failed' ? 'all' : 'failed')} />
        <StatCard label="Unauthorized" value={data.unauthorizedToday} icon={ShieldX} tone="danger" selected={cardFilter === 'unauthorized'} onClick={() => setCardFilter(cardFilter === 'unauthorized' ? 'all' : 'unauthorized')} />
        <StatCard label="Blocked IPs" value={data.blockedIpsToday} icon={Ban} tone="danger" selected={cardFilter === 'blocked'} onClick={() => setCardFilter(cardFilter === 'blocked' ? 'all' : 'blocked')} />
        <StatCard label="Busiest Time Today" value={data.busiestHourLabel ?? '—'} icon={Clock} />
      </div>

      <FilterBar
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      >
        <Input value={ipFilter} onChange={(e) => setIpFilter(e.target.value)} placeholder="Filter by IP..." className="w-40" />
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(e) => e.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={LogIn} title="No logins found" description="Sign-ins will appear here as your team logs in." />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={LogIn}
          title={viewing.performedByName}
          subtitle={viewing.entityLabel}
          badges={<StatusBadge status={RESULT_LABEL[viewing.result]} tone={RESULT_TONE[viewing.result]} />}
          sections={[
            {
              title: 'SESSION INFO',
              rows: [
                { label: 'Time', value: formatTimestamp(viewing.createdAt) },
                { label: 'Role', value: viewing.performedByRole },
                { label: 'IP Address', value: viewing.ip ?? '—' },
                { label: 'Browser', value: viewing.userAgent || '—' },
              ],
            },
            ...(Object.keys(viewing.details).length > 0
              ? [{ title: 'DETAILS', children: <p className="text-sm text-muted-foreground">{String(viewing.details.note ?? JSON.stringify(viewing.details))}</p> }]
              : []),
          ]}
        />
      )}
    </div>
  )
}
