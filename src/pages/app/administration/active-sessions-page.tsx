import { useState } from 'react'
import { Monitor, Users, Clock, ChevronRight, Wifi } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  useSessions,
  isSessionActive,
  isSessionOnline,
  isSessionIdle,
  isCurrentSession,
  type SessionWithId,
} from '@/hooks/use-sessions'
import { rawUserAgent } from '@/lib/user-agent'
import { formatTimestamp } from '@/lib/utils'
import { formatDurationLabel } from '@/lib/date-range'

function statusFor(session: SessionWithId): { label: string; tone: 'success' | 'warning' | 'neutral' } {
  if (!isSessionActive(session)) return { label: 'Ended', tone: 'neutral' }
  if (isSessionOnline(session)) return { label: 'Online', tone: 'success' }
  if (isSessionIdle(session)) return { label: 'Idle', tone: 'warning' }
  return { label: 'Away', tone: 'neutral' }
}

export function ActiveSessionsPage() {
  const { data: sessions = [], isLoading } = useSessions()
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<SessionWithId | null>(null)
  const [techDetailsOpen, setTechDetailsOpen] = useState(false)

  const online = sessions.filter(isSessionOnline)
  const idle = sessions.filter(isSessionIdle)
  const uniqueUsers = new Set(sessions.filter(isSessionActive).map((s) => s.userId)).size

  const filtered = sessions.filter((s) =>
    search.trim() ? `${s.userName} ${s.ip ?? ''} ${s.deviceLabel}`.toLowerCase().includes(search.toLowerCase()) : true
  )

  const columns: DataTableColumn<SessionWithId>[] = [
    {
      key: 'user',
      header: 'User',
      sortValue: (s) => s.userName,
      render: (s) => (
        <div>
          <p className="font-medium">
            {s.userName}
            {isCurrentSession(s) && (
              <span className="ml-1.5 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                This device
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{s.roleName}</p>
        </div>
      ),
    },
    { key: 'device', header: 'Device', hideOnMobile: true, render: (s) => s.deviceLabel },
    { key: 'ip', header: 'IP', hideOnMobile: true, render: (s) => s.ip ?? '—' },
    { key: 'lastActivity', header: 'Last Activity', render: (s) => formatTimestamp(s.lastActivityAt) },
    {
      key: 'status',
      header: 'Status',
      render: (s) => {
        const { label, tone } = statusFor(s)
        return <StatusBadge status={label} tone={tone} dot />
      },
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader icon={Monitor} title="Active Sessions" subtitle="Signed-in devices across your team" />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Currently Online" value={online.length} icon={Wifi} tone="success" />
        <StatCard label="Unique Users" value={uniqueUsers} icon={Users} />
        <StatCard label="Idle (30m+)" value={idle.length} icon={Clock} tone={idle.length > 0 ? 'warning' : 'default'} />
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by user, device, IP..." />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        onRowClick={(s) => { setViewing(s); setTechDetailsOpen(false) }}
        emptyState={<EmptyState icon={Monitor} title="No sessions yet" description="Sessions appear here as your team signs in." />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={Monitor}
          title={viewing.userName}
          subtitle={viewing.deviceLabel}
          badges={
            <>
              <StatusBadge status={statusFor(viewing).label} tone={statusFor(viewing).tone} dot />
              {isCurrentSession(viewing) && <StatusBadge status="This is your current session" tone="info" />}
            </>
          }
          sections={[
            {
              title: 'SESSION',
              rows: [
                { label: 'Signed in', value: formatTimestamp(viewing.signedInAt) },
                { label: 'Last activity', value: formatTimestamp(viewing.lastActivityAt) },
                {
                  label: 'Signed in for',
                  // `new Date().getTime()`, not the bare `Date.now()` call — see this project's
                  // own established fix for this exact React Compiler purity flag (Phase 6/7).
                  value: formatDurationLabel(new Date().getTime() - (viewing.signedInAt?.toDate?.()?.getTime() ?? new Date().getTime())),
                },
                { label: 'Auto-expires on', value: formatTimestamp(viewing.expiresAt) },
                ...(isSessionActive(viewing) && !isSessionOnline(viewing)
                  ? [{
                      label: 'Inactive for',
                      value: formatDurationLabel(new Date().getTime() - (viewing.lastActivityAt?.toDate?.()?.getTime() ?? new Date().getTime())),
                      tone: 'warning' as const,
                    }]
                  : []),
              ],
            },
            {
              title: 'NETWORK & DEVICE',
              rows: [
                { label: 'IP Address', value: viewing.ip ?? '—' },
                { label: 'Device', value: viewing.deviceLabel },
                { label: 'Role', value: viewing.roleName },
                { label: 'Branch', value: viewing.branchName },
              ],
            },
          ]}
        >
          <Collapsible open={techDetailsOpen} onOpenChange={setTechDetailsOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ChevronRight className={`size-4 transition-transform ${techDetailsOpen ? 'rotate-90' : ''}`} />
              Technical details
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="mt-2 rounded-md bg-muted/40 p-3 font-mono text-xs break-all text-muted-foreground">
                {rawUserAgent(viewing.userAgent)}
              </p>
            </CollapsibleContent>
          </Collapsible>
        </DetailDrawer>
      )}
    </div>
  )
}
