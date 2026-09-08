import { useState } from 'react'
import { Monitor, Users, Clock, ChevronRight, Wifi } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
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
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

/** Takes `t` rather than reaching for it: this is a plain function, not a component, so the
 * hook is not available here — and resolving the label at module load would freeze it in
 * whichever language was active at import time. */
function statusFor(
  session: SessionWithId,
  t: TFunction
): {
  label: string
  tone: 'success' | 'warning' | 'neutral'
} {
  if (!isSessionActive(session))
    return { label: t('pages.administration.activeSessions.ended'), tone: 'neutral' }
  if (isSessionOnline(session))
    return { label: t('pages.administration.activeSessions.online'), tone: 'success' }
  if (isSessionIdle(session))
    return { label: t('pages.administration.activeSessions.idle'), tone: 'warning' }
  return { label: t('pages.administration.activeSessions.away'), tone: 'neutral' }
}

export function ActiveSessionsPage() {
  const { t } = useTranslation()
  const { data: sessions = [], isLoading, error: loadError, refetch } = useSessions()
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<SessionWithId | null>(null)
  const [techDetailsOpen, setTechDetailsOpen] = useState(false)

  const online = sessions.filter(isSessionOnline)
  const idle = sessions.filter(isSessionIdle)
  const uniqueUsers = new Set(sessions.filter(isSessionActive).map((s) => s.userId)).size

  const filtered = sessions.filter((s) =>
    search.trim()
      ? `${s.userName} ${s.ip ?? ''} ${s.deviceLabel}`.toLowerCase().includes(search.toLowerCase())
      : true
  )

  const columns: DataTableColumn<SessionWithId>[] = [
    {
      key: 'user',
      header: t('pages.administration.activeSessions.user'),
      sortValue: (s) => s.userName,
      render: (s) => (
        <div>
          <p className="font-medium">
            {s.userName}
            {isCurrentSession(s) && (
              <span className="ml-1.5 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                {t('pages.administration.activeSessions.thisDevice')}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{s.roleName}</p>
        </div>
      ),
    },
    { key: 'device', header: t('shared.device'), hideOnMobile: true, render: (s) => s.deviceLabel },
    { key: 'ip', header: t('shared.ip'), hideOnMobile: true, render: (s) => s.ip ?? '—' },
    {
      key: 'lastActivity',
      header: t('pages.administration.activeSessions.lastActivity'),
      render: (s) => formatTimestamp(s.lastActivityAt),
    },
    {
      key: 'status',
      header: t('shared.status'),
      render: (s) => {
        const { label, tone } = statusFor(s, t)
        return <StatusBadge status={label} tone={tone} dot />
      },
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Monitor}
        title={t('pages.administration.activeSessions.activeSessions')}
        subtitle={t('pages.administration.activeSessions.signedInDevicesAcrossYourTeam')}
      />

      <StatCardGrid>
        <StatCard
          label={t('pages.administration.activeSessions.currentlyOnline')}
          value={online.length}
          icon={Wifi}
          tone="success"
        />
        <StatCard
          label={t('pages.administration.activeSessions.uniqueUsers')}
          value={uniqueUsers}
          icon={Users}
        />
        <StatCard
          label={t('pages.administration.activeSessions.idle30m')}
          value={idle.length}
          icon={Clock}
          tone={idle.length > 0 ? 'warning' : 'default'}
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.administration.activeSessions.searchByUserDeviceIp')}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        onRowClick={(s) => {
          setViewing(s)
          setTechDetailsOpen(false)
        }}
        emptyState={
          <EmptyState
            icon={Monitor}
            title={t('pages.administration.activeSessions.noSessionsYet')}
            description={t('pages.administration.activeSessions.sessionsAppearHereAsYourTeam')}
          />
        }
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
              <StatusBadge
                status={statusFor(viewing, t).label}
                tone={statusFor(viewing, t).tone}
                dot
              />
              {isCurrentSession(viewing) && (
                <StatusBadge
                  status={t('pages.administration.activeSessions.thisIsYourCurrentSession')}
                  tone="info"
                />
              )}
            </>
          }
          sections={[
            {
              title: t('pages.administration.activeSessions.session'),
              rows: [
                {
                  label: t('pages.administration.activeSessions.signedIn'),
                  value: formatTimestamp(viewing.signedInAt),
                },
                {
                  label: t('pages.administration.activeSessions.lastActivity2'),
                  value: formatTimestamp(viewing.lastActivityAt),
                },
                {
                  label: t('pages.administration.activeSessions.signedInFor'),
                  // `new Date().getTime()`, not the bare `Date.now()` call — see this project's
                  // own established fix for this exact React Compiler purity flag (Phase 6/7).
                  value: formatDurationLabel(
                    new Date().getTime() -
                      (viewing.signedInAt?.toDate?.()?.getTime() ?? new Date().getTime())
                  ),
                },
                {
                  label: t('pages.administration.activeSessions.autoExpiresOn'),
                  value: formatTimestamp(viewing.expiresAt),
                },
                ...(isSessionActive(viewing) && !isSessionOnline(viewing)
                  ? [
                      {
                        label: t('pages.administration.activeSessions.inactiveFor'),
                        value: formatDurationLabel(
                          new Date().getTime() -
                            (viewing.lastActivityAt?.toDate?.()?.getTime() ?? new Date().getTime())
                        ),
                        tone: 'warning' as const,
                      },
                    ]
                  : []),
              ],
            },
            {
              title: t('pages.administration.activeSessions.networkDevice'),
              rows: [
                { label: t('shared.ipAddress'), value: viewing.ip ?? '—' },
                { label: t('shared.device'), value: viewing.deviceLabel },
                { label: t('pages.administration.activeSessions.role'), value: viewing.roleName },
                {
                  label: t('pages.administration.activeSessions.branch'),
                  value: viewing.branchName,
                },
              ],
            },
          ]}
        >
          <Collapsible open={techDetailsOpen} onOpenChange={setTechDetailsOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ChevronRight
                className={`size-4 transition-transform ${techDetailsOpen ? 'rotate-90' : ''}`}
              />
              {t('pages.administration.activeSessions.technicalDetails')}
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
