import { Link } from 'react-router-dom'
import { Users, Package, UserCheck, ArrowRight, Bell, FileText } from 'lucide-react'
import {
  AlertList,
  ComparisonBars,
  JobCardListPanel,
  KpiTile,
  NamedList,
  type AlertRow,
} from '@/components/dashboard/widgets'
import { EmptyState } from '@/components/shared/empty-state'
import { useParties } from '@/hooks/use-parties'
import { useItems } from '@/hooks/use-items'
import { useUsers } from '@/hooks/use-users'
import { useJobCards } from '@/hooks/use-job-cards'
import { useSecondHandSales } from '@/hooks/use-second-hand-sales'
import { useSecondHandPurchases } from '@/hooks/use-second-hand-purchases'
import { useAuth } from '@/hooks/use-auth'
import { JOB_STATUSES } from '@/config/workflow-statuses-actions'
import { useTranslation } from 'react-i18next'

/**
 * The eight widgets that used to render "Widget coming soon".
 *
 * Each one is a component rather than a branch inside the Dashboard, so its hook runs only when
 * the widget is actually on: a Technician whose role hides Total Parties does not pay for a read
 * of the parties collection. That is the whole reason these are not folded into
 * `useDashboardStats`, which every dashboard would then load in full.
 *
 * Every figure comes from data this app already holds. Nothing here is a placeholder with a
 * plausible number in it — where a source genuinely did not exist, the widget was built against
 * the thing the shop can actually act on instead, and the doc comment says which.
 */

const PIPELINE_STATUSES = ['pending', 'inQueue', 'inProgress', 'onHold', 'techDone', 'ready']

/** Job cards older than this and still unfinished are worth flagging. */
const STALE_DAYS = 7

export function PartiesTotalWidget({ label }: { label: string }) {
  const { data: parties = [] } = useParties()
  return <KpiTile label={label} value={parties.length} icon={Users} />
}

export function ItemsTotalWidget({ label }: { label: string }) {
  const { data: items = [] } = useItems()
  return <KpiTile label={label} value={items.length} icon={Package} />
}

export function ActiveUsersWidget({ label }: { label: string }) {
  const { data: users = [] } = useUsers()
  return (
    <KpiTile
      label={label}
      value={users.filter((u) => u.status === 'active').length}
      icon={UserCheck}
      tone="text-teal-600 dark:text-teal-400"
    />
  )
}

export function MyJobCardsWidget({ label }: { label: string }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: jobs = [] } = useJobCards()
  // `useJobCards` already sorts newest first.
  const mine = jobs.filter((j) => j.assignedToId === user?.uid).slice(0, 10)
  return (
    <JobCardListPanel
      title={label}
      rows={mine.map((job) => ({
        id: job.id,
        number: job.jobNumber,
        customer: job.customerName,
        status: JOB_STATUSES.find((s) => s.key === job.status)?.label ?? job.status,
        href: `/app/service/job-cards/${job.id}`,
      }))}
      trailing={
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
          {mine.length}
        </span>
      }
      renderRow={(row, content) => (
        <Link to={row.href!} className="block hover:bg-muted/40">
          {content}
        </Link>
      )}
      empty={
        <EmptyState
          icon={FileText}
          title={t('pages.dashboard.dashboard.nothingAssignedToYou')}
          description={t('pages.dashboard.dashboard.jobCardsAssignedToYouAppearHere')}
        />
      }
    />
  )
}

export function RecentPartiesWidget({ label }: { label: string }) {
  const { t } = useTranslation()
  const { data: parties = [] } = useParties()
  const recent = [...parties]
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
    .slice(0, 5)
  return (
    <NamedList
      title={label}
      rows={recent.map((party) => ({
        id: party.id,
        name: party.name,
        detail: `${party.type === 'supplier' ? t('common.supplier') : t('common.customer')} · ${party.mobile}`,
      }))}
      trailing={
        <Link
          to="/app/masters/parties"
          className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
        >
          {t('pages.dashboard.dashboard.viewAll')}
          <ArrowRight className="size-3.5" />
        </Link>
      }
      empty={
        <EmptyState
          icon={Users}
          title={t('pages.dashboard.dashboard.noPartiesYet')}
          description={t('pages.dashboard.dashboard.theFiveNewestPartiesAppear')}
        />
      }
    />
  )
}

export function SalesVsPurchaseWidget({ label }: { label: string }) {
  const { t } = useTranslation()
  const { data: sales = [] } = useSecondHandSales()
  const { data: purchases = [] } = useSecondHandPurchases()

  // Second-hand trade, which is the one place this app records both a sale price and a purchase
  // price for the same kind of thing. Service revenue has no purchase side to compare against,
  // so folding it in would make the two bars measure different things.
  const byMonth = new Map<string, { month: string; sales: number; purchase: number }>()
  const bucket = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth.has(key)) {
      byMonth.set(key, {
        month: date.toLocaleDateString('en-IN', { month: 'short' }),
        sales: 0,
        purchase: 0,
      })
    }
    return byMonth.get(key)!
  }
  for (const sale of sales) {
    const date = sale.createdAt?.toDate?.()
    if (date) bucket(date).sales += sale.salePrice ?? 0
  }
  for (const purchase of purchases) {
    const date = purchase.createdAt?.toDate?.()
    if (date) bucket(date).purchase += purchase.purchasePrice ?? 0
  }
  const rows = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, value]) => value)

  return (
    <ComparisonBars
      title={label}
      subtitle={t('pages.dashboard.dashboard.monthlyComparison')}
      rows={rows}
      legend={[
        [t('pages.masters.itemMaster.sales'), '#10b981'],
        [t('pages.masters.itemMaster.purchase'), '#f97316'],
      ]}
      formatValue={(v) => `₹${v}`}
      empty={
        <EmptyState
          icon={Package}
          title={t('pages.dashboard.dashboard.noDeviceTradeYet')}
          description={t('pages.dashboard.dashboard.thisChartFillsInOnceDevices')}
        />
      }
    />
  )
}

/**
 * Notifications, derived from the shop's own state.
 *
 * There is no notifications collection and no server to write one from, so rather than ship an
 * empty box the widget reports the conditions this app can already detect and a shopkeeper can
 * actually act on: work stalled, work on hold, and stock at its reorder point. Each row links to
 * the screen where it is dealt with.
 */
export function NotificationsWidget({ label }: { label: string }) {
  const { t } = useTranslation()
  const { data: jobs = [] } = useJobCards()
  const { data: items = [] } = useItems()

  // Not the bare `Date.now()` — the React Compiler treats it as impure in a render body. Same
  // established workaround as `use-job-cards.ts`.
  const now = new Date().getTime()
  const onHold = jobs.filter((j) => j.status === 'onHold').length
  const stale = jobs.filter((j) => {
    if (!PIPELINE_STATUSES.includes(j.status)) return false
    const created = j.createdAt?.toMillis?.()
    return !!created && now - created > STALE_DAYS * 24 * 60 * 60 * 1000
  }).length
  const pendingReturn = jobs.filter((j) => j.status === 'pendingReturn').length
  const lowStock = items.filter(
    (i) =>
      i.stockTracked && i.reorder.reorderPoint > 0 && i.reorder.minStock <= i.reorder.reorderPoint
  ).length

  const rows: AlertRow[] = []
  if (onHold)
    rows.push({
      id: 'hold',
      tone: 'warning',
      text: t('pages.dashboard.dashboard.nJobCardsOnHold', { count: onHold }),
      href: '/app/service/job-cards',
    })
  if (stale)
    rows.push({
      id: 'stale',
      tone: 'danger',
      text: t('pages.dashboard.dashboard.nJobCardsOlderThanDays', {
        count: stale,
        days: STALE_DAYS,
      }),
      href: '/app/service/job-cards',
    })
  if (pendingReturn)
    rows.push({
      id: 'return',
      tone: 'warning',
      text: t('pages.dashboard.dashboard.nDevicesAwaitingReturn', { count: pendingReturn }),
      href: '/app/service/job-cards',
    })
  if (lowStock)
    rows.push({
      id: 'stock',
      tone: 'info',
      text: t('pages.dashboard.dashboard.nItemsAtReorderPoint', { count: lowStock }),
      href: '/app/masters/items',
    })

  return (
    <AlertList
      title={label}
      rows={rows}
      renderRow={(row, content) => (
        <Link to={row.href!} className="block hover:bg-muted/40">
          {content}
        </Link>
      )}
      empty={
        <EmptyState
          icon={Bell}
          title={t('pages.dashboard.dashboard.nothingNeedsAttention')}
          description={t('pages.dashboard.dashboard.alertsAppearHereWhenWork')}
        />
      }
    />
  )
}
