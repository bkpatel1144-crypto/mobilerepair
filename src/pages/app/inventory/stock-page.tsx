import { useState } from 'react'
import {
  Boxes,
  RefreshCw,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  IndianRupee,
  PackageX,
} from 'lucide-react'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStock, stockSummary, type StockRow } from '@/hooks/use-stock'
import { buildPath } from '@/config/nav'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

const STATE_STYLES: Record<StockRow['state'], string> = {
  out: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  low: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
}

/**
 * Inventory > Stock — what the shop is holding right now.
 *
 * The quantity is derived, not stored: General Purchase says it "feeds inventory stock" and a
 * job card records the parts it fitted, so on-hand is what came in minus what went out. Both
 * halves are shown beside the total so a surprising number can be explained rather than merely
 * disbelieved — a lone "3" tells a shopkeeper nothing about why.
 */
export function StockPage() {
  const { t } = useTranslation()
  const { rows, isLoading, error, refetch } = useStock()
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()
  const filtered = q
    ? rows.filter(
        (r) =>
          r.item.name.toLowerCase().includes(q) || r.item.itemCode.toLowerCase().includes(q)
      )
    : rows
  const summary = stockSummary(filtered)

  const columns: DataTableColumn<StockRow>[] = [
    {
      key: 'item',
      header: t('common.item'),
      sortValue: (r) => r.item.name,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.item.name}</p>
          <p className="text-xs text-muted-foreground">{r.item.itemCode}</p>
        </div>
      ),
    },
    {
      key: 'purchased',
      header: t('pages.inventory.stock.purchased'),
      hideOnMobile: true,
      sortValue: (r) => r.purchased,
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <ArrowDownToLine className="size-3.5 text-emerald-600" />
          {r.purchased}
        </span>
      ),
    },
    {
      key: 'consumed',
      header: t('pages.inventory.stock.usedOnJobs'),
      hideOnMobile: true,
      sortValue: (r) => r.consumed,
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-sm">
          <ArrowUpFromLine className="size-3.5 text-amber-600" />
          {r.consumed}
        </span>
      ),
    },
    {
      key: 'onHand',
      header: t('pages.inventory.stock.onHand'),
      sortValue: (r) => r.onHand,
      render: (r) => <span className="text-base font-semibold">{r.onHand}</span>,
    },
    {
      key: 'reorder',
      header: t('pages.inventory.stock.reorderPoint'),
      hideOnMobile: true,
      sortValue: (r) => r.reorderPoint,
      render: (r) =>
        r.reorderPoint > 0 ? (
          <span className="text-sm">{r.reorderPoint}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'value',
      header: t('pages.inventory.stock.value'),
      hideOnMobile: true,
      sortValue: (r) => r.value,
      render: (r) => <span className="text-sm">{money(r.value)}</span>,
    },
    {
      key: 'state',
      header: t('common.status'),
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_STYLES[r.state]}`}
        >
          {t(`pages.inventory.stock.state.${r.state}`)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{t('pages.inventory.stock.stock')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('pages.inventory.stock.whatIsOnTheShelf')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={refetch}>
            <RefreshCw className="size-4" />
            {t('common.refresh')}
          </Button>
          <Button type="button" variant="outline" render={<Link to={buildPath('masters', 'items')} />}>
            {t('pages.inventory.stock.openItemMaster')}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Boxes}
          label={t('pages.inventory.stock.tracked')}
          value={String(summary.tracked)}
        />
        <StatCard
          icon={AlertTriangle}
          label={t('pages.inventory.stock.lowStock')}
          value={String(summary.low)}
          tone="warning"
        />
        <StatCard
          icon={PackageX}
          label={t('pages.inventory.stock.outOfStock')}
          value={String(summary.out)}
          tone="danger"
        />
        <StatCard
          icon={IndianRupee}
          label={t('pages.inventory.stock.stockValue')}
          value={money(summary.value)}
          tone="info"
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('pages.inventory.stock.searchItems')}
          className="pl-8"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(r) => r.item.id}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyState={
          <EmptyState
            icon={Boxes}
            title={t('pages.inventory.stock.nothingIsStockTracked')}
            description={t('pages.inventory.stock.turnOnStockTracked')}
            action={
              <Button type="button" variant="outline" render={<Link to={buildPath('masters', 'items')} />}>
                {t('pages.inventory.stock.openItemMaster')}
              </Button>
            }
          />
        }
      />

      <p className="text-xs text-muted-foreground">
        {t('pages.inventory.stock.onHandIsDerived')}
      </p>
    </div>
  )
}
