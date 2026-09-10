import {
  Sparkles,
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
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  PREVIEW_DAYS,
  PREVIEW_JOBCARD_TREND,
  PREVIEW_KPI,
  PREVIEW_MY_JOB_CARDS,
  PREVIEW_RECENT_JOB_CARDS,
  PREVIEW_REVENUE_TOTAL,
  PREVIEW_REVENUE_TREND,
  PREVIEW_STATUS_BREAKDOWN,
  PREVIEW_TOTAL_JOB_CARDS,
  PREVIEW_TECHNICIANS,
  type PreviewJobCard,
} from '@/config/dashboard-preview-data'
import type { DashboardWidgetSpec } from '@/config/dashboard-widgets'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

/**
 * Renders one dashboard widget as it will look for the role being configured.
 *
 * The Dashboard & Landing tab used to be a list of checkboxes. It is a live preview now, matching
 * the reference: an administrator picks widgets by looking at the dashboard they are building
 * rather than at thirty-four labels. Every figure is sample data — see
 * `dashboard-preview-data.ts` for why the real ones would be both wrong and a leak.
 */

const KPI_ICON: Record<string, LucideIcon> = {
  'kpi.revenue': IndianRupee,
  'kpi.outstanding': AlertTriangle,
  'kpi.jobcards.today': Wrench,
  'kpi.jobcards.total': FileText,
  'kpi.jobcards.pipeline': Activity,
  'kpi.jobcards.ready': PackageCheck,
  'kpi.jobcards.delivered': Truck,
  'kpi.jobcards.closed': Lock,
  'kpi.jobcards.pending': Clock,
  'kpi.jobcards.queued': ListOrdered,
  'kpi.jobcards.in_progress': Activity,
  'kpi.jobcards.hold': PauseCircle,
  'kpi.jobcards.tech_done': CheckCircle2,
  'kpi.jobcards.cancelled': XCircle,
  'kpi.jobcards.pending_return': Undo2,
  'kpi.turnaround': Clock,
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

const QUICK_ACTION_ICON: Record<string, LucideIcon> = {
  'quick.scan_jobcard': ScanLine,
  'quick.new_jobcard': Plus,
  'quick.new_party': UserPlus,
  'quick.new_item': PackagePlus,
  'quick.new_invoice': FileText,
}

/** The dashed placeholder the reference shows for a widget it lists but has not shipped. */
function ComingSoon({ label }: { label: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
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

function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
      {status}
    </span>
  )
}

function JobCardRows({ rows }: { rows: PreviewJobCard[] }) {
  return (
    <div>
      {rows.map((job) => (
        <div
          key={job.number}
          className="flex items-center gap-3 border-t px-3 py-2 text-sm first:border-t-0"
        >
          <span className="font-medium tabular-nums">{job.number}</span>
          <span className="truncate text-muted-foreground">{job.customer}</span>
          <span className="ml-auto shrink-0">
            <StatusPill status={job.status} />
          </span>
        </div>
      ))}
    </div>
  )
}

function PanelHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 pt-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function PreviewWidget({ widget }: { widget: DashboardWidgetSpec }) {
  const { t } = useTranslation()

  if (!widget.available) return <ComingSoon label={widget.label} />

  if (widget.key === 'personal.welcome') {
    return (
      <div className="rounded-lg border bg-gradient-to-br from-teal-50 to-background p-4 dark:from-teal-500/10">
        <p className="text-lg font-bold">
          {t('pages.dashboard.dashboard.goodMorning')},{' '}
          <span className="text-teal-600 dark:text-teal-400">
            {t('pages.administration.dashboardLandingTab.previewUser')}
          </span>{' '}
          👋
        </p>
        <p className="text-xs text-muted-foreground">
          {t('pages.dashboard.dashboard.hereSWhatSHappeningIn')}
        </p>
      </div>
    )
  }

  if (widget.group === 'quick') {
    const Icon = QUICK_ACTION_ICON[widget.key] ?? Plus
    return (
      <span className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-medium text-white">
        <Icon className="size-4" />
        {widget.label}
        <ArrowRight className="size-3.5 opacity-70" />
      </span>
    )
  }

  if (widget.group === 'kpi') {
    const Icon = KPI_ICON[widget.key] ?? FileText
    const value = PREVIEW_KPI[widget.key]?.value ?? '—'
    return (
      <div className="rounded-lg border bg-card p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {widget.label}
          </p>
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
        </div>
        <p className={cn('mt-1 text-xl font-bold tabular-nums', KPI_TONE[widget.key])}>{value}</p>
      </div>
    )
  }

  if (widget.key === 'chart.jobcards.by_status') {
    return (
      <div className="rounded-lg border bg-card pb-3">
        <PanelHeading
          title={widget.label}
          subtitle={t('pages.administration.dashboardLandingTab.nTotal', {
            count: PREVIEW_TOTAL_JOB_CARDS,
          })}
        />
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PREVIEW_STATUS_BREAKDOWN}
                dataKey="count"
                nameKey="status"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={1}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {PREVIEW_STATUS_BREAKDOWN.map((slice) => (
                  <Cell key={slice.status} fill={slice.hex} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-3 text-[11px]">
          {PREVIEW_STATUS_BREAKDOWN.map((slice) => (
            <span key={slice.status} className="flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: slice.hex }} />
              {slice.status} <span className="font-semibold">{slice.count}</span>
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (widget.key === 'chart.revenue.trend' || widget.key === 'chart.jobcards.trend') {
    const isRevenue = widget.key === 'chart.revenue.trend'
    const series = isRevenue ? PREVIEW_REVENUE_TREND : PREVIEW_JOBCARD_TREND
    const data = PREVIEW_DAYS.map((date, i) => ({ date, value: series[i] }))
    const colour = isRevenue ? '#10b981' : '#818cf8'
    return (
      <div className="rounded-lg border bg-card pb-2">
        <PanelHeading
          title={widget.label}
          subtitle={
            isRevenue
              ? `${t('common.total')}: ₹${(PREVIEW_REVENUE_TOTAL / 1000).toFixed(1)}K`
              : t('pages.administration.dashboardLandingTab.lastNDays', {
                  count: PREVIEW_DAYS.length,
                })
          }
        />
        <div className="h-52 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${widget.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colour} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={colour} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                minTickGap={0}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v: number) =>
                  isRevenue ? `₹${(v / 1000).toFixed(1)}K` : String(v)
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colour}
                strokeWidth={2}
                fill={`url(#fill-${widget.key})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (widget.key === 'chart.jobcards.by_tech') {
    return (
      <div className="rounded-lg border bg-card pb-3">
        <PanelHeading
          title={widget.label}
          subtitle={`${t('common.completed')} · ${t('shared.inProgress')} · ${t('pages.dashboard.dashboard.inQueue')}`}
        />
        <div className="h-52 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={PREVIEW_TECHNICIANS}
              layout="vertical"
              margin={{ left: 4, right: 16, top: 4, bottom: 0 }}
              barSize={14}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Bar dataKey="completed" stackId="t" fill="#22c55e" isAnimationActive={false} />
              <Bar dataKey="inProgress" stackId="t" fill="#3b82f6" isAnimationActive={false} />
              <Bar dataKey="queued" stackId="t" fill="#f97316" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-3 text-[11px]">
          {[
            [t('common.completed'), '#22c55e'],
            [t('shared.inProgress'), '#3b82f6'],
            [t('pages.dashboard.dashboard.inQueue'), '#f97316'],
          ].map(([label, hex]) => (
            <span key={label} className="flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: hex }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (widget.key === 'list.jobcards.recent' || widget.key === 'list.jobcards.mine') {
    const mine = widget.key === 'list.jobcards.mine'
    const rows = mine ? PREVIEW_MY_JOB_CARDS : PREVIEW_RECENT_JOB_CARDS
    return (
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <p className="text-sm font-semibold">{widget.label}</p>
          {mine ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
              {rows.length}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400">
              {t('pages.dashboard.dashboard.viewAll')}
              <ArrowRight className="size-3.5" />
            </span>
          )}
        </div>
        <JobCardRows rows={rows} />
      </div>
    )
  }

  // Every built widget above is handled; this is the honest fallback rather than a blank box.
  return <ComingSoon label={widget.label} />
}
