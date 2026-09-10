import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ScanLine,
  Plus,
  UserPlus,
  PackagePlus,
  FileText,
  Activity,
  Wrench,
  IndianRupee,
  AlertTriangle,
  Clock,
  XCircle,
  ListOrdered,
  PauseCircle,
  CheckCircle2,
  PackageCheck,
  Truck,
  Lock,
  Undo2,
  LayoutDashboard,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, type StatTone } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { ScrollRow } from '@/components/shared/scroll-row'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { ScanJobCardModal } from '@/components/shared/scan-job-card-modal'
import { DASHBOARD_WIDGETS, widgetsInOrder } from '@/config/dashboard-widgets'
import { useWidgetLabels } from '@/hooks/use-widget-labels'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { toneFromStatus } from '@/lib/status-tone'
import { useTranslation } from 'react-i18next'

/**
 * Every tile, chart and list here is gated on the current role's `visibleWidgets`, keyed by the
 * `DASHBOARD_WIDGETS` catalogue.
 *
 * That gate is the point of this file's last rewrite. `visibleWidgets` was written at signup,
 * editable on Role Configure's "Dashboard & Landing" tab and saved to Firestore — and read by
 * nothing at all. Every user saw every widget, so the Technician role's "hide Revenue and
 * Outstanding" had never once taken effect, and the whole tab was decorative. Nothing failed
 * loudly, because `visibleWidgets` is a `Record<string, boolean>`: no key it holds and no key it
 * omits is a type error.
 *
 * Three widgets the catalogue advertises were also missing outright — Job Cards Trend, Jobs by
 * Technician and Recent Job Cards. `dashboard-widgets-rendered.test.tsx` now renders this page
 * and asserts a `data-widget` node exists for every catalogue entry marked `available`, so a
 * widget cannot be advertised in the Widget Library without being on the screen.
 */

// Tailwind's compiler needs literal class strings, not template interpolation — these hex values
// intentionally mirror the same tones (emerald/amber/red/blue/purple/neutral) `status-tone.ts`
// already maps status labels to, just as raw colors since recharts needs an actual fill string.
const CHART_TONE_HEX: Record<string, string> = {
  success: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#2563eb',
  purple: '#9333ea',
  neutral: '#6b7280',
}

/** A widget the catalogue lists but the product has not built, shown as the reference shows it:
 *  a dashed card that says so, rather than a gap where a chosen widget should be. */
function ComingSoonWidget({ widgetKey, label }: { widgetKey: string; label: string }) {
  const { t } = useTranslation()
  return (
    <div
      data-widget={widgetKey}
      className="flex min-w-0 items-center gap-3 rounded-lg border border-dashed p-3"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {t('pages.administration.dashboardLandingTab.widgetComingSoon')}
        </p>
      </div>
    </div>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'pages.dashboard.dashboard.goodMorning'
  if (hour < 17) return 'pages.dashboard.dashboard.goodAfternoon'
  return 'pages.dashboard.dashboard.goodEvening'
}

/** The chosen range, in words, shown as the Period Job Cards tile's sublabel. The reference
 *  adapts the tile's own label instead; a sublabel says the same thing without a label that
 *  changes length every time a chip is tapped. */
const RANGE_LABEL_KEY: Record<DateRangeKey | 'all', string> = {
  all: 'common.allTime',
  today: 'common.today',
  yesterday: 'common.yesterday',
  week: 'common.thisWeek',
  month: 'common.thisMonth',
  year: 'common.thisYear',
  custom: 'common.customRange',
}

/** A panel that holds one chart or list widget, carrying its `data-widget` key. */
function WidgetPanel({
  widgetKey,
  title,
  action,
  children,
  className,
}: {
  widgetKey: string
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div data-widget={widgetKey} className={`min-w-0 rounded-lg border p-4 ${className ?? ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const widgetText = useWidgetLabels()
  const [range, setRange] = useState<DateRangeKey | 'all'>('all')
  const [scanOpen, setScanOpen] = useState(false)
  const { data: stats, isLoading, error: loadError, refetch } = useDashboardStats(range)
  const { profile } = useAuth()
  const { canSeeWidget, widgetOrder, isLoading: permissionsLoading } = usePermissions()

  // The role's chosen arrangement. `widgetsInOrder` falls back to the catalogue for anything the
  // role never placed, so a widget added after the role was saved still has a position.
  const orderIndex = new Map(widgetsInOrder(widgetOrder).map((w, i) => [w.key, i]))
  const byRoleOrder = (a: string, b: string) =>
    (orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER)

  const quickActions: {
    widgetKey: string
    label: string
    icon: LucideIcon
    tone: string
    to?: string
    onClick?: () => void
  }[] = [
    {
      widgetKey: 'quick.scan_jobcard',
      label: t('shared.scanJobCard'),
      icon: ScanLine,
      tone: 'bg-muted text-foreground',
      onClick: () => setScanOpen(true),
    },
    {
      widgetKey: 'quick.new_jobcard',
      label: t('pages.dashboard.dashboard.newJobCard'),
      icon: Plus,
      tone: 'bg-teal-600 text-white',
      to: '/app/service/job-cards/create',
    },
    {
      widgetKey: 'quick.new_party',
      label: t('pages.dashboard.dashboard.newParty'),
      icon: UserPlus,
      tone: 'bg-blue-600 text-white',
      to: '/app/masters/parties',
    },
    {
      widgetKey: 'quick.new_item',
      label: t('pages.dashboard.dashboard.newItem'),
      icon: PackagePlus,
      tone: 'bg-purple-600 text-white',
      to: '/app/masters/items',
    },
  ]

  // Declarative rather than sixteen near-identical JSX blocks, so the widget key sits beside the
  // value it gates and a new KPI is one entry rather than a block to copy and edit.
  const kpis: {
    widgetKey: string
    label: string
    value: React.ReactNode
    icon: LucideIcon
    tone?: StatTone
    sublabel?: string
  }[] = [
    {
      widgetKey: 'kpi.jobcards.total',
      label: t('pages.dashboard.dashboard.totalJobCards'),
      value: stats.totalJobCards,
      icon: FileText,
    },
    {
      widgetKey: 'kpi.jobcards.pipeline',
      label: t('pages.dashboard.dashboard.totalInPipeline'),
      value: stats.totalInPipeline,
      icon: Activity,
      tone: 'info',
    },
    {
      widgetKey: 'kpi.jobcards.today',
      label: t('pages.dashboard.dashboard.periodJobCards'),
      value: stats.periodJobCards,
      icon: Wrench,
      tone: 'purple',
      sublabel: t(RANGE_LABEL_KEY[range]),
    },
    {
      widgetKey: 'kpi.revenue',
      label: t('shared.revenue'),
      value: `₹${stats.revenue}`,
      icon: IndianRupee,
      tone: 'success',
    },
    {
      widgetKey: 'kpi.outstanding',
      label: t('pages.dashboard.dashboard.outstanding'),
      value: `₹${stats.outstanding}`,
      icon: AlertTriangle,
      tone: 'warning',
    },
    {
      widgetKey: 'kpi.jobcards.in_progress',
      label: t('shared.inProgress'),
      value: stats.inProgress,
      icon: Activity,
      tone: 'info',
    },
    {
      widgetKey: 'kpi.jobcards.pending',
      label: t('pages.dashboard.dashboard.pending'),
      value: stats.pending,
      icon: Clock,
      tone: 'warning',
    },
    {
      widgetKey: 'kpi.turnaround',
      label: t('pages.dashboard.dashboard.avgTurnaround'),
      value: stats.avgTurnaroundLabel ?? '—',
      icon: Clock,
    },
    {
      widgetKey: 'kpi.jobcards.cancelled',
      label: t('pages.dashboard.dashboard.cancelled'),
      value: stats.cancelled,
      icon: XCircle,
      tone: 'danger',
    },
    {
      widgetKey: 'kpi.jobcards.queued',
      label: t('pages.dashboard.dashboard.inQueue'),
      value: stats.inQueue,
      icon: ListOrdered,
      tone: 'warning',
    },
    {
      widgetKey: 'kpi.jobcards.hold',
      label: t('pages.dashboard.dashboard.onHold'),
      value: stats.onHold,
      icon: PauseCircle,
      tone: 'warning',
    },
    {
      widgetKey: 'kpi.jobcards.tech_done',
      label: t('pages.dashboard.dashboard.techDone'),
      value: stats.techDone,
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      widgetKey: 'kpi.jobcards.ready',
      label: t('pages.dashboard.dashboard.ready'),
      value: stats.ready,
      icon: PackageCheck,
      tone: 'success',
    },
    {
      widgetKey: 'kpi.jobcards.delivered',
      label: t('pages.dashboard.dashboard.delivered'),
      value: stats.delivered,
      icon: Truck,
      tone: 'purple',
    },
    {
      widgetKey: 'kpi.jobcards.closed',
      label: t('shared.closed'),
      value: stats.closed,
      icon: Lock,
    },
    {
      widgetKey: 'kpi.jobcards.pending_return',
      label: t('pages.dashboard.dashboard.pendingReturn'),
      value: stats.pendingReturn,
      icon: Undo2,
      tone: 'warning',
    },
  ]

  const visibleActions = quickActions
    .filter((a) => canSeeWidget(a.widgetKey))
    .sort((a, b) => byRoleOrder(a.widgetKey, b.widgetKey))
  const visibleKpis = kpis
    .filter((k) => canSeeWidget(k.widgetKey))
    .sort((a, b) => byRoleOrder(a.widgetKey, b.widgetKey))
  const charts = [
    'chart.jobcards.by_status',
    'chart.revenue.trend',
    'chart.jobcards.trend',
    'chart.jobcards.by_tech',
  ]
    .filter((key) => canSeeWidget(key))
    .sort(byRoleOrder)
  const comingSoon = DASHBOARD_WIDGETS.filter((w) => !w.available && canSeeWidget(w.key)).sort(
    (a, b) => byRoleOrder(a.key, b.key)
  )
  const showWelcome = canSeeWidget('personal.welcome')
  const showRecent = canSeeWidget('list.jobcards.recent')
  const nothingVisible =
    !showWelcome &&
    !showRecent &&
    !visibleActions.length &&
    !visibleKpis.length &&
    !charts.length &&
    !comingSoon.length

  // Held behind a skeleton rather than rendered optimistically. Job cards and receipts come from
  // the persistent cache and can resolve before the role document does, so rendering first and
  // hiding after would flash a real Revenue figure at a Technician whose role hides it.
  if (permissionsLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {showWelcome && (
        <div
          data-widget="personal.welcome"
          className="rounded-lg border bg-gradient-to-br from-teal-50 to-background p-5 dark:from-teal-500/10"
        >
          <h1 className="text-xl font-bold">
            {t(greeting())},{' '}
            {isLoading ? (
              <Skeleton className="inline-block h-6 w-32 align-middle" />
            ) : (
              <span className="text-teal-600 dark:text-teal-400">
                {profile?.fullName ?? 'there'}
              </span>
            )}{' '}
            👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('pages.dashboard.dashboard.hereSWhatSHappeningIn')}
          </p>
        </div>
      )}

      {visibleActions.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {visibleActions.map((action) =>
            action.to ? (
              <Link
                key={action.widgetKey}
                data-widget={action.widgetKey}
                to={action.to}
                className="flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${action.tone}`}
                >
                  <action.icon className="size-4" />
                </span>
                <span className="truncate">{action.label}</span>
              </Link>
            ) : (
              <button
                key={action.widgetKey}
                data-widget={action.widgetKey}
                type="button"
                onClick={action.onClick}
                className="flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted"
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${action.tone}`}
                >
                  <action.icon className="size-4" />
                </span>
                <span className="truncate">{action.label}</span>
              </button>
            )
          )}
        </div>
      )}

      <FilterBar dateRange={range === 'all' ? undefined : range} onDateRangeChange={setRange}>
        <Button
          type="button"
          size="sm"
          variant={range === 'all' ? 'default' : 'outline'}
          onClick={() => setRange('all')}
        >
          {t('common.allTime')}
        </Button>
      </FilterBar>

      {/* `stats` is derived in a useMemo, so a failed `jobCards` read still yields a complete
       * object of zeros — every tile would read "0" and both charts would show their "no data
       * yet" empty state, i.e. a confident, fabricated "your shop did nothing". BUILD_PLAN's
       * "no fake numbers" bar means showing the failure instead. */}
      {loadError ? (
        <ErrorState
          error={loadError}
          onRetry={() => void refetch()}
          title={t('pages.dashboard.dashboard.couldnTLoadYourDashboard')}
        />
      ) : nothingVisible ? (
        <EmptyState
          icon={LayoutDashboard}
          title={t('pages.dashboard.dashboard.noWidgetsEnabled')}
          description={t('pages.dashboard.dashboard.yourRoleHasEveryDashboardWidget')}
        />
      ) : (
        <>
          {visibleKpis.length > 0 && (
            <StatCardGrid>
              {visibleKpis.map((kpi) => (
                <StatCard
                  key={kpi.widgetKey}
                  widgetKey={kpi.widgetKey}
                  label={kpi.label}
                  value={kpi.value}
                  icon={kpi.icon}
                  tone={kpi.tone}
                  sublabel={kpi.sublabel}
                />
              ))}
            </StatCardGrid>
          )}

          {charts.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {charts.includes('chart.jobcards.by_status') && (
                <WidgetPanel
                  widgetKey="chart.jobcards.by_status"
                  title={t('pages.dashboard.dashboard.jobCardsByStatus')}
                >
                  {stats.jobCardsByStatus.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title={t('pages.dashboard.dashboard.noJobCardsYet')}
                      description={t('pages.dashboard.dashboard.thisChartFillsInOnceJob')}
                    />
                  ) : (
                    <div className="relative h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.jobCardsByStatus}
                            dataKey="count"
                            nameKey="status"
                            innerRadius="65%"
                            outerRadius="90%"
                            paddingAngle={2}
                            strokeWidth={0}
                          >
                            {stats.jobCardsByStatus.map((entry) => (
                              <Cell
                                key={entry.status}
                                fill={CHART_TONE_HEX[toneFromStatus(entry.status)]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold tabular-nums">
                          {stats.jobCardsByStatus.reduce((sum, s) => sum + s.count, 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t('common.total').toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
                        {stats.jobCardsByStatus.map((s) => (
                          <span key={s.status} className="flex items-center gap-1.5">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: CHART_TONE_HEX[toneFromStatus(s.status)] }}
                            />
                            {s.status} ({s.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </WidgetPanel>
              )}

              {charts.includes('chart.revenue.trend') && (
                <WidgetPanel
                  widgetKey="chart.revenue.trend"
                  title={t('pages.dashboard.dashboard.revenueTrend')}
                >
                  {stats.revenueTrend.length === 0 ? (
                    <EmptyState
                      icon={IndianRupee}
                      title={t('pages.dashboard.dashboard.noRevenueYet')}
                      description={t('pages.dashboard.dashboard.thisChartFillsInOnceBills')}
                    />
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={stats.revenueTrend}
                          margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            className="stroke-border"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => `₹${v}`}
                            width={56}
                          />
                          <Tooltip
                            formatter={(v: unknown) =>
                              [`₹${String(v)}`, t('common.revenue')] as [string, string]
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#059669"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </WidgetPanel>
              )}

              {charts.includes('chart.jobcards.trend') && (
                <WidgetPanel
                  widgetKey="chart.jobcards.trend"
                  title={t('pages.dashboard.dashboard.jobCardsTrend')}
                >
                  {stats.jobCardTrend.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title={t('pages.dashboard.dashboard.noJobCardsYet')}
                      description={t('pages.dashboard.dashboard.thisChartFillsInAsJobCards')}
                    />
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.jobCardTrend}
                          margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            className="stroke-border"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                            width={32}
                          />
                          <Tooltip
                            formatter={(v: unknown) =>
                              [String(v), t('common.jobCards')] as [string, string]
                            }
                          />
                          <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </WidgetPanel>
              )}

              {charts.includes('chart.jobcards.by_tech') && (
                <WidgetPanel
                  widgetKey="chart.jobcards.by_tech"
                  title={t('pages.dashboard.dashboard.jobsByTechnician')}
                >
                  {stats.jobsByTechnician.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title={t('pages.dashboard.dashboard.noJobsAssignedYet')}
                      description={t(
                        'pages.dashboard.dashboard.thisChartFillsInOnceJobsAreAssigned'
                      )}
                    />
                  ) : (
                    <div className="h-64">
                      {/* Horizontal bars: technician names are long enough to overlap as x-axis
                       * ticks on a phone, and a name reads more naturally beside its bar. */}
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stats.jobsByTechnician}
                          layout="vertical"
                          margin={{ left: 0, right: 16, top: 8, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            className="stroke-border"
                          />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            width={96}
                          />
                          <Tooltip
                            formatter={(v: unknown) =>
                              [String(v), t('common.jobCards')] as [string, string]
                            }
                          />
                          <Bar dataKey="count" fill="#9333ea" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </WidgetPanel>
              )}
            </div>
          )}

          {/* Widgets the role switched on that this build does not draw yet. The reference shows
           * them too; leaving them out would make the Role Configure preview a lie about what
           * the role actually gets. */}
          {comingSoon.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((widget) => (
                <ComingSoonWidget
                  key={widget.key}
                  widgetKey={widget.key}
                  label={widgetText.label(widget.key, widget.label)}
                />
              ))}
            </div>
          )}

          {showRecent && (
            <WidgetPanel
              widgetKey="list.jobcards.recent"
              title={t('pages.dashboard.dashboard.recentJobCards')}
              action={
                <Link
                  to="/app/service/job-cards"
                  className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
                >
                  {t('pages.dashboard.dashboard.viewAll')}
                </Link>
              }
            >
              {stats.recentJobCards.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={t('pages.dashboard.dashboard.noJobCardsYet')}
                  description={t('pages.dashboard.dashboard.theTenNewestJobCardsAppear')}
                />
              ) : (
                // Swipeable cards on a phone, a wrapping card grid from `sm` — the same treatment
                // every other list on mobile got, rather than ten table rows squeezed to 375px.
                <ScrollRow className="[&>*]:w-[15rem] sm:[&>*]:w-auto sm:[&>*]:basis-[16rem] sm:[&>*]:flex-1">
                  {stats.recentJobCards.map((job) => (
                    <Link
                      key={job.id}
                      to={`/app/service/job-cards/${job.id}`}
                      className="flex min-w-0 flex-col gap-1.5 rounded-lg border bg-card p-3 transition-colors hover:border-teal-600/60"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{job.jobNumber}</span>
                        <StatusBadge status={job.statusLabel} />
                      </div>
                      <span className="truncate text-sm">{job.customerName}</span>
                      {job.device && (
                        <span className="truncate text-xs text-muted-foreground">{job.device}</span>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                        <span>{job.createdLabel ?? '—'}</span>
                        <span className="font-semibold text-foreground tabular-nums">
                          ₹{job.amount}
                        </span>
                      </div>
                    </Link>
                  ))}
                </ScrollRow>
              )}
            </WidgetPanel>
          )}
        </>
      )}

      <ScanJobCardModal open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  )
}
