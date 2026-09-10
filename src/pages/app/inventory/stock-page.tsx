import { useState } from 'react'
import { Boxes, Package, AlertTriangle, Layers, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useItems, type ItemRow } from '@/hooks/use-items'
import { useItemCategories } from '@/hooks/use-item-categories'
import { TRACKING_TYPES } from '@/lib/item-defaults'
import { buildPath } from '@/config/nav'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

/**
 * Inventory > Stock — every stock-tracked item and the levels it should be held at.
 *
 * Deliberately the reorder view rather than an on-hand quantity view. This app records what an
 * item's minimum, reorder point, reorder quantity and maximum *are* — that is what Create Item
 * collects — but it does not yet record stock movements, so there is no honest number to put in
 * an "on hand" column. Inventing one, or showing a zero that looks like a real balance, would be
 * worse than showing the levels a shopkeeper actually set and can act on.
 *
 * The list is a view over Item Master, not a second collection: there is one definition of an
 * item, and a stock screen that kept its own copy would be a second source of truth for the
 * same reorder point.
 */

const ALL = 'all'

export function StockPage() {
  const { t } = useTranslation()
  const { data: items = [], isLoading, error: loadError, refetch } = useItems()
  const { data: categories = [] } = useItemCategories()

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(ALL)
  const [tracking, setTracking] = useState(ALL)
  const [viewing, setViewing] = useState<ItemRow | null>(null)

  const tracked = items.filter((i) => i.stockTracked)
  const needsReorder = (item: ItemRow) =>
    item.reorder.reorderPoint > 0 && item.reorder.minStock <= item.reorder.reorderPoint

  const filtered = tracked
    .filter((i) => categoryId === ALL || i.categoryId === categoryId)
    .filter((i) => tracking === ALL || i.trackingType === tracking)
    .filter((i) =>
      `${i.name} ${i.itemCode} ${i.categoryName ?? ''}`.toLowerCase().includes(search.toLowerCase())
    )

  const columns: DataTableColumn<ItemRow>[] = [
    {
      key: 'item',
      header: t('common.item'),
      sortValue: (i) => i.name,
      render: (i) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{i.name}</p>
          <p className="text-xs text-muted-foreground">{i.itemCode}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: t('common.category'),
      hideOnMobile: true,
      render: (i) => i.categoryName ?? '—',
    },
    { key: 'uom', header: t('shared.uom'), hideOnMobile: true, render: (i) => i.primaryUom.symbol },
    {
      key: 'tracking',
      header: t('pages.masters.createItem.trackingType'),
      hideOnMobile: true,
      render: (i) => TRACKING_TYPES.find((tt) => tt.value === i.trackingType)?.label ?? '—',
    },
    {
      key: 'min',
      header: t('pages.masters.createItem.minStock'),
      sortValue: (i) => i.reorder.minStock,
      render: (i) => <span className="tabular-nums">{i.reorder.minStock}</span>,
    },
    {
      key: 'reorderPoint',
      header: t('pages.masters.createItem.reorderPoint'),
      sortValue: (i) => i.reorder.reorderPoint,
      render: (i) => (
        <span className={cn('tabular-nums', needsReorder(i) && 'font-semibold text-amber-600')}>
          {i.reorder.reorderPoint}
        </span>
      ),
    },
    {
      key: 'max',
      header: t('pages.masters.createItem.maxStock'),
      hideOnMobile: true,
      sortValue: (i) => i.reorder.maxStock,
      render: (i) => <span className="tabular-nums">{i.reorder.maxStock}</span>,
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Boxes}
        title={t('pages.inventory.stock.stock')}
        subtitle={t('pages.inventory.stock.stockTrackedItemsAndTheirLevels')}
        actions={
          <Button
            type="button"
            variant="outline"
            render={<Link to={buildPath('masters', 'items')} />}
          >
            {t('pages.inventory.stock.openItemMaster')}
            <ArrowRight className="size-4" />
          </Button>
        }
      />

      <StatCardGrid>
        <StatCard label={t('pages.inventory.stock.tracked')} value={tracked.length} icon={Boxes} />
        <StatCard
          label={t('pages.masters.itemMaster.notTracked')}
          value={items.length - tracked.length}
          icon={Package}
        />
        <StatCard
          label={t('pages.inventory.stock.atReorderPoint')}
          value={tracked.filter(needsReorder).length}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label={t('pages.masters.createItem.sections.variants')}
          value={tracked.filter((i) => i.hasVariants).length}
          icon={Layers}
          tone="purple"
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.masters.itemMaster.searchItems')}
      >
        <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('common.allCategories')}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tracking} onValueChange={(v) => v && setTracking(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('pages.masters.itemMaster.allTracking')}</SelectItem>
            {TRACKING_TYPES.map((tt) => (
              <SelectItem key={tt.value} value={tt.value}>
                {tt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(i) => i.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        onRowClick={setViewing}
        emptyState={
          <EmptyState
            icon={Boxes}
            title={t('pages.inventory.stock.nothingIsStockTracked')}
            description={t('pages.inventory.stock.turnOnStockTrackedOnAnItem')}
          />
        }
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={Boxes}
          title={viewing.name}
          subtitle={viewing.itemCode}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<Link to={`${buildPath('masters', 'items')}/${viewing.id}/edit`} />}
            >
              {t('common.edit')}
              <ArrowRight className="size-3.5" />
            </Button>
          }
          sections={[
            {
              title: t('pages.masters.itemMaster.inventory'),
              icon: Boxes,
              rows: [
                {
                  label: t('pages.masters.createItem.trackingType'),
                  value:
                    TRACKING_TYPES.find((tt) => tt.value === viewing.trackingType)?.label ?? '—',
                },
                {
                  label: t('pages.masters.createItem.shelfLifeDays'),
                  value: viewing.shelfLifeDays ?? '—',
                },
                {
                  label: t('pages.masters.createItem.minStock'),
                  value: viewing.reorder.minStock,
                },
                {
                  label: t('pages.masters.createItem.reorderPoint'),
                  value: viewing.reorder.reorderPoint,
                  tone: needsReorder(viewing) ? 'warning' : undefined,
                },
                {
                  label: t('pages.masters.createItem.reorderQty'),
                  value: viewing.reorder.reorderQty,
                },
                { label: t('pages.masters.createItem.maxStock'), value: viewing.reorder.maxStock },
              ],
            },
            {
              title: t('pages.masters.itemMaster.classification'),
              icon: Package,
              rows: [
                { label: t('common.category'), value: viewing.categoryName ?? '—' },
                {
                  label: t('pages.masters.itemMaster.primaryUom'),
                  value: `${viewing.primaryUom.name} (${viewing.primaryUom.symbol})`,
                },
              ],
            },
          ]}
        />
      )}
    </div>
  )
}
