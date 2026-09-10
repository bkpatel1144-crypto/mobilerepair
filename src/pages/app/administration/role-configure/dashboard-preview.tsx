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
  ArrowRight,
  Users,
  Package,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import {
  AlertList,
  ComingSoonCard,
  ComparisonBars,
  JobCardListPanel,
  KpiTile,
  NamedList,
  QuickActionPill,
  StatusDonut,
  TechnicianBars,
  TrendArea,
  WelcomeBanner,
} from '@/components/dashboard/widgets'
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
  PREVIEW_ALERTS,
  PREVIEW_RECENT_PARTIES,
  PREVIEW_SALES_VS_PURCHASE,
} from '@/config/dashboard-preview-data'
import type { DashboardWidgetSpec } from '@/config/dashboard-widgets'
import { useTranslation } from 'react-i18next'

/**
 * One dashboard widget as the role being configured will see it.
 *
 * Every visual here comes from `components/dashboard/widgets.tsx`, the same module the real
 * Dashboard renders from — only the data differs. That is the whole point: a preview built from
 * its own components stops being a picture of the dashboard and becomes a drawing of one, and
 * drifts the first time either side changes.
 *
 * The figures are sample data. Real ones would be both wrong (the preview is for a role, not for
 * the person configuring it) and a leak (this company's revenue on a screen about permissions).
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

const KPI_EXTRA_ICON: Record<string, LucideIcon> = {
  'kpi.parties.total': Users,
  'kpi.items.total': Package,
  'kpi.users.active': UserCheck,
}

export function PreviewWidget({ widget }: { widget: DashboardWidgetSpec }) {
  const { t } = useTranslation()

  if (!widget.available) return <ComingSoonCard label={widget.label} />

  if (widget.key === 'personal.welcome') {
    return (
      <WelcomeBanner
        name={t('pages.administration.dashboardLandingTab.previewUser')}
        subtitle={t('pages.dashboard.dashboard.hereSWhatSHappeningIn')}
      />
    )
  }

  if (widget.group === 'quick') {
    return <QuickActionPill label={widget.label} icon={QUICK_ACTION_ICON[widget.key] ?? Plus} />
  }

  if (widget.key === 'personal.notifications') {
    return <AlertList title={widget.label} rows={PREVIEW_ALERTS} />
  }

  if (widget.group === 'kpi') {
    return (
      <KpiTile
        label={widget.label}
        value={PREVIEW_KPI[widget.key]?.value ?? '—'}
        icon={KPI_ICON[widget.key] ?? KPI_EXTRA_ICON[widget.key] ?? FileText}
        tone={KPI_TONE[widget.key]}
      />
    )
  }

  if (widget.key === 'chart.sales_vs_purchase') {
    return (
      <ComparisonBars
        title={widget.label}
        subtitle={t('pages.dashboard.dashboard.monthlyComparison')}
        rows={PREVIEW_SALES_VS_PURCHASE}
        legend={[
          [t('pages.masters.itemMaster.sales'), '#10b981'],
          [t('pages.masters.itemMaster.purchase'), '#f97316'],
        ]}
        formatValue={(v) => `₹${(v / 1000).toFixed(0)}K`}
      />
    )
  }

  if (widget.key === 'list.parties.recent') {
    return (
      <NamedList
        title={widget.label}
        rows={PREVIEW_RECENT_PARTIES}
        trailing={
          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400">
            {t('pages.dashboard.dashboard.viewAll')}
            <ArrowRight className="size-3.5" />
          </span>
        }
      />
    )
  }

  if (widget.key === 'chart.jobcards.by_status') {
    return (
      <StatusDonut
        title={widget.label}
        subtitle={t('pages.administration.dashboardLandingTab.nTotal', {
          count: PREVIEW_TOTAL_JOB_CARDS,
        })}
        slices={PREVIEW_STATUS_BREAKDOWN}
      />
    )
  }

  if (widget.key === 'chart.revenue.trend') {
    return (
      <TrendArea
        id="preview-revenue"
        title={widget.label}
        subtitle={`${t('common.total')}: ₹${(PREVIEW_REVENUE_TOTAL / 1000).toFixed(1)}K`}
        data={PREVIEW_DAYS.map((date, i) => ({ date, value: PREVIEW_REVENUE_TREND[i] }))}
        colour="#10b981"
        formatValue={(v) => `₹${(v / 1000).toFixed(1)}K`}
      />
    )
  }

  if (widget.key === 'chart.jobcards.trend') {
    return (
      <TrendArea
        id="preview-jobcards"
        title={widget.label}
        subtitle={t('pages.administration.dashboardLandingTab.lastNDays', {
          count: PREVIEW_DAYS.length,
        })}
        data={PREVIEW_DAYS.map((date, i) => ({ date, value: PREVIEW_JOBCARD_TREND[i] }))}
        colour="#818cf8"
      />
    )
  }

  if (widget.key === 'chart.jobcards.by_tech') {
    return (
      <TechnicianBars
        title={widget.label}
        subtitle={`${t('common.completed')} · ${t('shared.inProgress')} · ${t('pages.dashboard.dashboard.inQueue')}`}
        rows={PREVIEW_TECHNICIANS}
        legend={[
          [t('common.completed'), '#22c55e'],
          [t('shared.inProgress'), '#3b82f6'],
          [t('pages.dashboard.dashboard.inQueue'), '#f97316'],
        ]}
      />
    )
  }

  if (widget.key === 'list.jobcards.recent' || widget.key === 'list.jobcards.mine') {
    const mine = widget.key === 'list.jobcards.mine'
    const rows = (mine ? PREVIEW_MY_JOB_CARDS : PREVIEW_RECENT_JOB_CARDS).map((job) => ({
      id: job.number,
      number: job.number,
      customer: job.customer,
      status: job.status,
    }))
    return (
      <JobCardListPanel
        title={widget.label}
        rows={rows}
        trailing={
          mine ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
              {rows.length}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400">
              {t('pages.dashboard.dashboard.viewAll')}
              <ArrowRight className="size-3.5" />
            </span>
          )
        }
      />
    )
  }

  // Every built widget above is handled; this is the honest fallback rather than a blank box.
  return <ComingSoonCard label={widget.label} />
}
