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
  Users,
  User,
  Zap,
  Gauge,
  BarChart3,
  ListChecks,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { ScanJobCardModal } from '@/components/shared/scan-job-card-modal'
import {
  ComingSoonCard,
  JobCardListPanel,
  KpiTile,
  QuickActionPill,
  StatusDonut,
  TechnicianBars,
  TrendArea,
  WelcomeBanner,
  WidgetSection,
  type JobCardRow,
} from '@/components/dashboard/widgets'
import {
  WIDGET_GROUPS,
  widgetsInOrder,
  type DashboardWidgetSpec,
  type WidgetGroupKey,
} from '@/config/dashboard-widgets'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { useWidgetLabels } from '@/hooks/use-widget-labels'
import {
  ActiveUsersWidget,
  ItemsTotalWidget,
  MyJobCardsWidget,
  NotificationsWidget,
  PartiesTotalWidget,
  RecentPartiesWidget,
  SalesVsPurchaseWidget,
} from './dashboard-extra-widgets'
import { toneFromStatus } from '@/lib/status-tone'
import { useTranslation } from 'react-i18next'

/**
 * The Dashboard, in the same grouped sections the Role Configure preview shows.
 *
 * The two used to be different screens — a flat page of tiles here, a sectioned preview there —
 * so an administrator would arrange a role's dashboard and then see something else on signing in
 * as that role. They render from one set of components now
 * (`components/dashboard/widgets.tsx`): the preview passes sample figures, this passes what the
 * shop actually did. Building them separately is the mistake this codebase has already paid for
 * twice, with the device PIN field and with the two long forms.
 *
 * Every widget is gated on the role's `visibleWidgets` and ordered by its `widgetOrder`. One the
 * role switched on that this build has not finished draws a "Widget coming soon" card rather
 * than silently vanishing — otherwise the preview would be lying about what the role gets.
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

const GROUP_ICON: Record<WidgetGroupKey, LucideIcon> = {
  personal: User,
  quick: Zap,
  kpi: Gauge,
  chart: BarChart3,
  list: ListChecks,
}

const KPI_TONE: Record<string, string> = {
  'kpi.revenue': 'text-emerald-600 dark:text-emerald-400',
  'kpi.outstanding': 'text-red-600 dark:text-red-400',
  'kpi.jobcards.today': 'text-purple-600 dark:text-purple-400',
  'kpi.jobcards.pipeline': 'text-blue-600 dark:text-blue-400',
  'kpi.jobcards.ready': 'text-emerald-600 dark:text-emerald-400',
  'kpi.jobcards.delivered': 'text-purple-600 dark:text-purple-400',
  'kpi.jobcards.queued': 'text-orange-600 dark:text-orange-400',
  'kpi.jobcards.in_progress': 'text-blue-600 dark:text-blue-400',
  'kpi.jobcards.hold': 'text-amber-600 dark:text-amber-400',
  'kpi.jobcards.cancelled': 'text-red-600 dark:text-red-400',
  'kpi.turnaround': 'text-teal-600 dark:text-teal-400',
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'pages.dashboard.dashboard.goodMorning'
  if (hour < 17) return 'pages.dashboard.dashboard.goodAfternoon'
  return 'pages.dashboard.dashboard.goodEvening'
}

/** The chosen range in words, appended to the Period Job Cards tile's label. */
const RANGE_LABEL_KEY: Record<DateRangeKey | 'all', string> = {
  all: 'common.allTime',
  today: 'common.today',
  yesterday: 'common.yesterday',
  week: 'common.thisWeek',
  month: 'common.thisMonth',
  year: 'common.thisYear',
  custom: 'common.customRange',
}

/** How wide each group's widgets sit in the twelve-column section grid. */
const GROUP_SPAN: Record<WidgetGroupKey, string> = {
  personal: 'col-span-12',
  quick: 'col-span-6 md:col-span-3',
  kpi: 'col-span-6 sm:col-span-4 lg:col-span-2',
  chart: 'col-span-12 lg:col-span-6',
  list: 'col-span-12',
}

export function DashboardPage() {
  const { t } = useTranslation()
  const widgetText = useWidgetLabels()
  const [range, setRange] = useState<DateRangeKey | 'all'>('all')
  const [scanOpen, setScanOpen] = useState(false)
  const { data: stats, isLoading, error: loadError, refetch } = useDashboardStats(range)
  const { profile } = useAuth()
  const { canSeeWidget, widgetOrder, isLoading: permissionsLoading } = usePermissions()

  const visible = widgetsInOrder(widgetOrder).filter((w) => canSeeWidget(w.key))

  const quickAction: Record<string, { label: string; icon: LucideIcon; to?: string }> = {
    'quick.scan_jobcard': { label: t('shared.scanJobCard'), icon: ScanLine },
    'quick.new_jobcard': {
      label: t('pages.dashboard.dashboard.newJobCard'),
      icon: Plus,
      to: '/app/service/job-cards/create',
    },
    'quick.new_party': {
      label: t('pages.dashboard.dashboard.newParty'),
      icon: UserPlus,
      to: '/app/masters/parties',
    },
    'quick.new_item': {
      label: t('pages.dashboard.dashboard.newItem'),
      icon: PackagePlus,
      to: '/app/masters/items',
    },
    // There is no invoices collection: a bill *is* a job card that has been through the
    // `generateBill` action (see `sales-invoices-page.tsx`). So "New Invoice" goes where a bill
    // is actually raised, rather than to a create screen that cannot exist.
    'quick.new_invoice': {
      label: t('pages.dashboard.dashboard.newInvoice'),
      icon: FileText,
      to: '/app/service/job-cards',
    },
  }

  const kpi: Record<string, { label: string; value: React.ReactNode; icon: LucideIcon }> = {
    'kpi.jobcards.total': {
      label: t('pages.dashboard.dashboard.totalJobCards'),
      value: stats.totalJobCards,
      icon: FileText,
    },
    'kpi.jobcards.pipeline': {
      label: t('pages.dashboard.dashboard.totalInPipeline'),
      value: stats.totalInPipeline,
      icon: Activity,
    },
    'kpi.jobcards.today': {
      label: `${t('pages.dashboard.dashboard.periodJobCards')} · ${t(RANGE_LABEL_KEY[range])}`,
      value: stats.periodJobCards,
      icon: Wrench,
    },
    'kpi.revenue': { label: t('shared.revenue'), value: `₹${stats.revenue}`, icon: IndianRupee },
    'kpi.outstanding': {
      label: t('pages.dashboard.dashboard.outstanding'),
      value: `₹${stats.outstanding}`,
      icon: AlertTriangle,
    },
    'kpi.jobcards.in_progress': {
      label: t('shared.inProgress'),
      value: stats.inProgress,
      icon: Activity,
    },
    'kpi.jobcards.pending': {
      label: t('pages.dashboard.dashboard.pending'),
      value: stats.pending,
      icon: Clock,
    },
    'kpi.turnaround': {
      label: t('pages.dashboard.dashboard.avgTurnaround'),
      value: stats.avgTurnaroundLabel ?? '—',
      icon: Clock,
    },
    'kpi.jobcards.cancelled': {
      label: t('pages.dashboard.dashboard.cancelled'),
      value: stats.cancelled,
      icon: XCircle,
    },
    'kpi.jobcards.queued': {
      label: t('pages.dashboard.dashboard.inQueue'),
      value: stats.inQueue,
      icon: ListOrdered,
    },
    'kpi.jobcards.hold': {
      label: t('pages.dashboard.dashboard.onHold'),
      value: stats.onHold,
      icon: PauseCircle,
    },
    'kpi.jobcards.tech_done': {
      label: t('pages.dashboard.dashboard.techDone'),
      value: stats.techDone,
      icon: CheckCircle2,
    },
    'kpi.jobcards.ready': {
      label: t('pages.dashboard.dashboard.ready'),
      value: stats.ready,
      icon: PackageCheck,
    },
    'kpi.jobcards.delivered': {
      label: t('pages.dashboard.dashboard.delivered'),
      value: stats.delivered,
      icon: Truck,
    },
    'kpi.jobcards.closed': { label: t('shared.closed'), value: stats.closed, icon: Lock },
    'kpi.jobcards.pending_return': {
      label: t('pages.dashboard.dashboard.pendingReturn'),
      value: stats.pendingReturn,
      icon: Undo2,
    },
  }

  const recentRows: JobCardRow[] = stats.recentJobCards.map((job) => ({
    id: job.id,
    number: job.jobNumber,
    customer: job.customerName,
    status: job.statusLabel,
    href: `/app/service/job-cards/${job.id}`,
  }))

  function renderWidget(widget: DashboardWidgetSpec) {
    if (!widget.available) {
      return <ComingSoonCard label={widgetText.label(widget.key, widget.label)} />
    }

    switch (widget.key) {
      case 'personal.welcome':
        return (
          <WelcomeBanner
            greetingKey={greeting()}
            name={
              isLoading ? (
                <Skeleton className="inline-block h-5 w-32 align-middle" />
              ) : (
                (profile?.fullName ?? 'there')
              )
            }
            subtitle={t('pages.dashboard.dashboard.hereSWhatSHappeningIn')}
          />
        )

      case 'chart.jobcards.by_status':
        return (
          <StatusDonut
            title={t('pages.dashboard.dashboard.jobCardsByStatus')}
            subtitle={t('pages.administration.dashboardLandingTab.nTotal', {
              count: stats.jobCardsByStatus.reduce((n, s) => n + s.count, 0),
            })}
            slices={stats.jobCardsByStatus.map((s) => ({
              status: s.status,
              count: s.count,
              hex: CHART_TONE_HEX[toneFromStatus(s.status)],
            }))}
            empty={
              <EmptyState
                icon={FileText}
                title={t('pages.dashboard.dashboard.noJobCardsYet')}
                description={t('pages.dashboard.dashboard.thisChartFillsInOnceJob')}
              />
            }
          />
        )

      case 'chart.revenue.trend':
        return (
          <TrendArea
            id="revenue"
            title={t('pages.dashboard.dashboard.revenueTrend')}
            subtitle={`${t('common.total')}: ₹${stats.revenueTrend.reduce((n, d) => n + d.revenue, 0)}`}
            data={stats.revenueTrend.map((d) => ({ date: d.date, value: d.revenue }))}
            colour="#10b981"
            formatValue={(v) => `₹${v}`}
            empty={
              <EmptyState
                icon={IndianRupee}
                title={t('pages.dashboard.dashboard.noRevenueYet')}
                description={t('pages.dashboard.dashboard.thisChartFillsInOnceBills')}
              />
            }
          />
        )

      case 'chart.jobcards.trend':
        return (
          <TrendArea
            id="jobcards"
            title={t('pages.dashboard.dashboard.jobCardsTrend')}
            subtitle={t('pages.administration.dashboardLandingTab.lastNDays', {
              count: stats.jobCardTrend.length,
            })}
            data={stats.jobCardTrend.map((d) => ({ date: d.date, value: d.count }))}
            colour="#818cf8"
            empty={
              <EmptyState
                icon={FileText}
                title={t('pages.dashboard.dashboard.noJobCardsYet')}
                description={t('pages.dashboard.dashboard.thisChartFillsInAsJobCards')}
              />
            }
          />
        )

      case 'chart.jobcards.by_tech':
        return (
          <TechnicianBars
            title={t('pages.dashboard.dashboard.jobsByTechnician')}
            subtitle={t('pages.dashboard.dashboard.workloadPerTechnician')}
            // One bar per technician, from the job count this app actually tracks. The
            // completed/in-progress/queued split the reference draws is not recorded per
            // technician here, and inventing the three numbers would be worse than one true one.
            rows={stats.jobsByTechnician.map((row) => ({
              name: row.name,
              completed: row.count,
              inProgress: 0,
              queued: 0,
            }))}
            legend={[[t('common.jobCards'), '#22c55e']]}
            empty={
              <EmptyState
                icon={Users}
                title={t('pages.dashboard.dashboard.noJobsAssignedYet')}
                description={t('pages.dashboard.dashboard.thisChartFillsInOnceJobsAreAssigned')}
              />
            }
          />
        )

      case 'list.jobcards.recent':
        return (
          <JobCardListPanel
            title={t('pages.dashboard.dashboard.recentJobCards')}
            rows={recentRows}
            trailing={
              <Link
                to="/app/service/job-cards"
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
              >
                {t('pages.dashboard.dashboard.viewAll')}
                <ArrowRight className="size-3.5" />
              </Link>
            }
            renderRow={(row, content) => (
              <Link to={row.href!} className="block hover:bg-muted/40">
                {content}
              </Link>
            )}
            empty={
              <EmptyState
                icon={FileText}
                title={t('pages.dashboard.dashboard.noJobCardsYet')}
                description={t('pages.dashboard.dashboard.theTenNewestJobCardsAppear')}
              />
            }
          />
        )

      case 'personal.notifications':
        return <NotificationsWidget label={widgetText.label(widget.key, widget.label)} />

      case 'kpi.parties.total':
        return <PartiesTotalWidget label={widgetText.label(widget.key, widget.label)} />

      case 'kpi.items.total':
        return <ItemsTotalWidget label={widgetText.label(widget.key, widget.label)} />

      case 'kpi.users.active':
        return <ActiveUsersWidget label={widgetText.label(widget.key, widget.label)} />

      case 'chart.sales_vs_purchase':
        return <SalesVsPurchaseWidget label={widgetText.label(widget.key, widget.label)} />

      case 'list.jobcards.mine':
        return <MyJobCardsWidget label={widgetText.label(widget.key, widget.label)} />

      case 'list.parties.recent':
        return <RecentPartiesWidget label={widgetText.label(widget.key, widget.label)} />

      default: {
        if (widget.group === 'quick') {
          const action = quickAction[widget.key]
          if (!action) return <ComingSoonCard label={widget.label} />
          const pill = <QuickActionPill label={action.label} icon={action.icon} interactive />
          return action.to ? (
            <Link to={action.to} className="block">
              {pill}
            </Link>
          ) : (
            <button type="button" onClick={() => setScanOpen(true)} className="block w-full">
              {pill}
            </button>
          )
        }
        if (widget.group === 'kpi') {
          const tile = kpi[widget.key]
          if (!tile) return <ComingSoonCard label={widget.label} />
          return (
            <KpiTile
              label={tile.label}
              value={tile.value}
              icon={tile.icon}
              tone={KPI_TONE[widget.key]}
            />
          )
        }
        return <ComingSoonCard label={widgetText.label(widget.key, widget.label)} />
      }
    }
  }

  // Held behind a skeleton rather than rendered optimistically. Job cards and receipts come from
  // the persistent cache and can resolve before the role document does, so rendering first and
  // hiding after would flash a real Revenue figure at a Technician whose role hides it.
  if (permissionsLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
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
      ) : visible.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title={t('pages.dashboard.dashboard.noWidgetsEnabled')}
          description={t('pages.dashboard.dashboard.yourRoleHasEveryDashboardWidget')}
        />
      ) : (
        WIDGET_GROUPS.map((group) => {
          const inGroup = visible.filter((w) => w.group === group.key)
          if (!inGroup.length) return null
          return (
            <WidgetSection
              key={group.key}
              groupKey={group.key}
              icon={GROUP_ICON[group.key]}
              title={widgetText.group(group.key, group.label)}
              count={inGroup.length}
            >
              <div className="grid grid-cols-12 gap-2.5">
                {inGroup.map((widget) => (
                  <div
                    key={widget.key}
                    data-widget={widget.key}
                    className={`min-w-0 ${GROUP_SPAN[group.key]}`}
                  >
                    {renderWidget(widget)}
                  </div>
                ))}
              </div>
            </WidgetSection>
          )
        })
      )}

      <ScanJobCardModal open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  )
}
