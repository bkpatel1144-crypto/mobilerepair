import { Sparkles, ArrowRight, type LucideIcon } from 'lucide-react'
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
  Tooltip,
} from 'recharts'
import { cn } from '@/lib/utils'
import { GROUP_ICON_TONE } from '@/components/dashboard/group-tones'
import type { WidgetGroupKey } from '@/config/dashboard-widgets'
import { useTranslation } from 'react-i18next'

/**
 * The dashboard's visual vocabulary, shared by the real Dashboard and the Role Configure preview.
 *
 * One set of components deliberately. The preview exists to show an administrator what a role
 * will get, so the moment the two are built separately the preview becomes a drawing of a
 * dashboard rather than a picture of it — and this codebase has already paid for that mistake
 * twice, with the device PIN field and with the two long forms. Same components, different data:
 * the preview passes the sample figures, the Dashboard passes what the shop actually did.
 */

/** One titled band of the dashboard — Personal, Quick Actions, KPI Cards, and so on. */
export function WidgetSection({
  groupKey,
  icon: Icon,
  title,
  count,
  action,
  children,
}: {
  groupKey: WidgetGroupKey
  icon: LucideIcon
  title: string
  count: number
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <section className="rounded-xl border bg-muted/20 p-3">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            GROUP_ICON_TONE[groupKey]
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            {t('pages.administration.dashboardLandingTab.nWidgets', { count })}
          </p>
        </div>
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {children}
    </section>
  )
}

/** A widget the catalogue lists but this build does not draw yet. */
export function ComingSoonCard({ label }: { label: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-dashed p-3">
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

export function WelcomeBanner({
  name,
  subtitle,
  greetingKey = 'pages.dashboard.dashboard.goodMorning',
}: {
  name: React.ReactNode
  subtitle: string
  /** The real Dashboard passes morning/afternoon/evening; the preview leaves the default. */
  greetingKey?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border bg-gradient-to-br from-teal-50 to-background p-4 dark:from-teal-500/10">
      <p className="text-lg font-bold">
        {t(greetingKey)}, <span className="text-teal-600 dark:text-teal-400">{name}</span> 👋
      </p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}

export function QuickActionPill({
  label,
  icon: Icon,
  interactive,
}: {
  label: string
  icon: LucideIcon
  /** False in the preview, where the pill is a picture rather than a control. */
  interactive?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex w-full items-center gap-2 rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-medium text-white',
        interactive && 'transition-opacity hover:opacity-90'
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      <ArrowRight className="ml-auto size-3.5 shrink-0 opacity-70" />
    </span>
  )
}

export function KpiTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: React.ReactNode
  icon: LucideIcon
  tone?: string
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      </div>
      <p className={cn('mt-1 truncate text-xl font-bold tabular-nums', tone)}>{value}</p>
    </div>
  )
}

function PanelShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-card pb-3">
      <div className="flex items-start justify-between gap-2 px-3 pt-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export interface DonutSlice {
  status: string
  count: number
  hex: string
}

export function StatusDonut({
  title,
  subtitle,
  slices,
  empty,
}: {
  title: string
  subtitle: string
  slices: DonutSlice[]
  /** Shown instead of the chart when the shop has no job cards yet. */
  empty?: React.ReactNode
}) {
  return (
    <PanelShell title={title} subtitle={subtitle}>
      {slices.length === 0 ? (
        <div className="px-3 pt-3">{empty}</div>
      ) : (
        <>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="count"
                  nameKey="status"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={1}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.status} fill={slice.hex} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-3 text-[11px]">
            {slices.map((slice) => (
              <span key={slice.status} className="flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: slice.hex }} />
                {slice.status} <span className="font-semibold">{slice.count}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </PanelShell>
  )
}

export function TrendArea({
  id,
  title,
  subtitle,
  data,
  colour,
  formatValue,
  empty,
}: {
  /** Unique per chart — two gradients sharing an id makes the second one invisible. */
  id: string
  title: string
  subtitle: string
  data: { date: string; value: number }[]
  colour: string
  formatValue?: (value: number) => string
  empty?: React.ReactNode
}) {
  return (
    <PanelShell title={title} subtitle={subtitle}>
      {data.length === 0 ? (
        <div className="px-3 pt-3">{empty}</div>
      ) : (
        <div className="h-52 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colour} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={colour} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={formatValue}
              />
              <Tooltip formatter={(v: unknown) => formatValue?.(Number(v)) ?? String(v)} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colour}
                strokeWidth={2}
                fill={`url(#fill-${id})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </PanelShell>
  )
}

export function TechnicianBars({
  title,
  subtitle,
  rows,
  legend,
  empty,
}: {
  title: string
  subtitle: string
  rows: { name: string; completed: number; inProgress: number; queued: number }[]
  legend: [string, string][]
  empty?: React.ReactNode
}) {
  return (
    <PanelShell title={title} subtitle={subtitle}>
      {rows.length === 0 ? (
        <div className="px-3 pt-3">{empty}</div>
      ) : (
        <>
          <div className="h-52 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ left: 4, right: 16, top: 4, bottom: 0 }}
                barSize={14}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip />
                <Bar dataKey="completed" stackId="t" fill="#22c55e" isAnimationActive={false} />
                <Bar dataKey="inProgress" stackId="t" fill="#3b82f6" isAnimationActive={false} />
                <Bar dataKey="queued" stackId="t" fill="#f97316" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[11px]">
            {legend.map(([label, hex]) => (
              <span key={label} className="flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: hex }} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </PanelShell>
  )
}

export interface AlertRow {
  id: string
  tone: 'info' | 'warning' | 'danger'
  text: string
  href?: string
}

const ALERT_TONE: Record<AlertRow['tone'], string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

/** Notifications: what in the shop's own state needs someone's attention. */
export function AlertList({
  title,
  rows,
  empty,
  renderRow,
}: {
  title: string
  rows: AlertRow[]
  empty?: React.ReactNode
  renderRow?: (row: AlertRow, content: React.ReactNode) => React.ReactNode
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <p className="px-3 py-2.5 text-sm font-semibold">{title}</p>
      {rows.length === 0 ? (
        <div className="px-3 pb-3">{empty}</div>
      ) : (
        rows.map((row) => {
          const content = (
            <div className="flex items-center gap-2.5 border-t px-3 py-2 text-sm">
              <span className={cn('size-2 shrink-0 rounded-full', ALERT_TONE[row.tone])} />
              <span className="min-w-0 truncate">{row.text}</span>
            </div>
          )
          return <div key={row.id}>{renderRow ? renderRow(row, content) : content}</div>
        })
      )}
    </div>
  )
}

export interface NamedRow {
  id: string
  name: string
  detail: string
  href?: string
}

/** Recent Parties: a plain name-and-detail list. */
export function NamedList({
  title,
  rows,
  trailing,
  empty,
  renderRow,
}: {
  title: string
  rows: NamedRow[]
  trailing?: React.ReactNode
  empty?: React.ReactNode
  renderRow?: (row: NamedRow, content: React.ReactNode) => React.ReactNode
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="text-sm font-semibold">{title}</p>
        {trailing}
      </div>
      {rows.length === 0 ? (
        <div className="px-3 pb-3">{empty}</div>
      ) : (
        rows.map((row) => {
          const content = (
            <div className="flex items-center gap-3 border-t px-3 py-2 text-sm">
              <span className="truncate font-medium">{row.name}</span>
              <span className="ml-auto shrink-0 truncate text-xs text-muted-foreground">
                {row.detail}
              </span>
            </div>
          )
          return <div key={row.id}>{renderRow ? renderRow(row, content) : content}</div>
        })
      )}
    </div>
  )
}

/** Sales vs Purchase: two bars per month, side by side. */
export function ComparisonBars({
  title,
  subtitle,
  rows,
  legend,
  formatValue,
  empty,
}: {
  title: string
  subtitle: string
  rows: { month: string; sales: number; purchase: number }[]
  legend: [string, string][]
  formatValue?: (value: number) => string
  empty?: React.ReactNode
}) {
  return (
    <PanelShell title={title} subtitle={subtitle}>
      {rows.length === 0 ? (
        <div className="px-3 pt-3">{empty}</div>
      ) : (
        <>
          <div className="h-52 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ left: 4, right: 12, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={formatValue}
                />
                <Tooltip formatter={(v: unknown) => formatValue?.(Number(v)) ?? String(v)} />
                <Bar
                  dataKey="sales"
                  fill="#10b981"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="purchase"
                  fill="#f97316"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[11px]">
            {legend.map(([label, hex]) => (
              <span key={label} className="flex items-center gap-1">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: hex }} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </PanelShell>
  )
}

export interface JobCardRow {
  id: string
  number: string
  customer: string
  status: string
  href?: string
}

export function JobCardListPanel({
  title,
  rows,
  trailing,
  renderRow,
  empty,
}: {
  title: string
  rows: JobCardRow[]
  trailing?: React.ReactNode
  /** Wraps each row — a link on the real Dashboard, nothing in the preview. */
  renderRow?: (row: JobCardRow, content: React.ReactNode) => React.ReactNode
  empty?: React.ReactNode
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="text-sm font-semibold">{title}</p>
        {trailing}
      </div>
      {rows.length === 0 ? (
        <div className="px-3 pb-3">{empty}</div>
      ) : (
        rows.map((row) => {
          const content = (
            <div className="flex items-center gap-3 border-t px-3 py-2 text-sm">
              <span className="font-medium tabular-nums">{row.number}</span>
              <span className="truncate text-muted-foreground">{row.customer}</span>
              <span className="ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                {row.status}
              </span>
            </div>
          )
          return <div key={row.id}>{renderRow ? renderRow(row, content) : content}</div>
        })
      )}
    </div>
  )
}
