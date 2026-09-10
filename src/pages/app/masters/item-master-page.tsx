import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Wrench, Plus, Pencil, Ban, CheckCircle2, Boxes, IndianRupee } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useItems, useSetItemStatus, type ItemRow } from '@/hooks/use-items'
import { useItemCategories } from '@/hooks/use-item-categories'
import { usePermissions } from '@/hooks/use-permissions'
import { TAX_CATEGORIES, TRACKING_TYPES, taxPercentOf } from '@/lib/item-defaults'
import { LoadDefaultsButton } from '@/components/shared/load-defaults-button'
import { buildPath } from '@/config/nav'
import type { ItemType } from '@/types/firestore'
import { useTranslation } from 'react-i18next'

const TYPE_LABEL: Record<ItemType, string> = {
  service: 'pages.masters.itemMaster.service',
  part: 'pages.service.recordCostingModal.part',
  product: 'pages.masters.itemMaster.product',
}

const ALL = 'all'

/** Every filter the item shape supports. Kept as one object so "Clear" is one assignment and a
 *  new filter cannot be forgotten in the reset. */
interface ItemFilters {
  type: 'all' | ItemType
  categoryId: string
  taxCategory: string
  tracking: string
  stock: 'all' | 'tracked' | 'untracked'
  lob: 'all' | 'sales' | 'purchase' | 'production' | 'servicePos' | 'ecommerce'
  status: 'all' | 'active' | 'disabled'
}

const NO_FILTERS: ItemFilters = {
  type: ALL,
  categoryId: ALL,
  taxCategory: ALL,
  tracking: ALL,
  stock: ALL,
  lob: ALL,
  status: ALL,
}

export function ItemMasterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: items = [], isLoading, error: loadError, refetch } = useItems()
  const { data: categories = [] } = useItemCategories()
  const { canDo } = usePermissions()
  const canManage = canDo('MASTERS_ITEMS_UPDATE')

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ItemFilters>(NO_FILTERS)
  const [viewing, setViewing] = useState<ItemRow | null>(null)

  const setFilter = <K extends keyof ItemFilters>(key: K, value: ItemFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== ALL).length

  const filtered = items
    .filter((i) => filters.type === ALL || i.type === filters.type)
    .filter((i) => filters.categoryId === ALL || i.categoryId === filters.categoryId)
    .filter((i) => filters.taxCategory === ALL || i.taxCategory === filters.taxCategory)
    .filter((i) => filters.tracking === ALL || i.trackingType === filters.tracking)
    .filter(
      (i) =>
        filters.stock === ALL || (filters.stock === 'tracked' ? i.stockTracked : !i.stockTracked)
    )
    .filter((i) => filters.lob === ALL || i.lob[filters.lob].isActive)
    .filter((i) => filters.status === ALL || i.status === filters.status)
    .filter((i) =>
      // Code and category too, not just the name: a shopkeeper looking for "SRV009" or for
      // everything under "Spare Parts" was getting no results from a name-only match.
      `${i.name} ${i.itemCode} ${i.categoryName ?? ''} ${i.description ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )

  const columns: DataTableColumn<ItemRow>[] = [
    {
      key: 'item',
      header: t('common.item'),
      sortValue: (i) => i.name,
      render: (i) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {i.type === 'service' ? <Wrench className="size-4" /> : <Package className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{i.name}</p>
            <p className="text-xs text-muted-foreground">{i.itemCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: t('common.category'),
      hideOnMobile: true,
      render: (i) => (
        <div className="min-w-0">
          <p className="truncate">{i.categoryName ?? '—'}</p>
          {i.subCategoryName && (
            <p className="truncate text-xs text-muted-foreground">{i.subCategoryName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: t('common.type'),
      render: (i) => (
        <span
          className={
            'rounded-full px-2 py-0.5 text-xs font-medium ' +
            (i.type === 'service'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400')
          }
        >
          {t(TYPE_LABEL[i.type])}
        </span>
      ),
    },
    {
      key: 'uom',
      header: t('shared.uom'),
      hideOnMobile: true,
      render: (i) => i.primaryUom.symbol,
    },
    {
      key: 'tax',
      header: t('common.tax'),
      hideOnMobile: true,
      sortValue: (i) => taxPercentOf(i.taxCategory),
      render: (i) => `${taxPercentOf(i.taxCategory)}%`,
    },
    {
      key: 'sellingPrice',
      header: t('common.sellingPrice'),
      hideOnMobile: true,
      sortValue: (i) => i.sellingPrice ?? -1,
      render: (i) => (i.sellingPrice != null ? `₹${i.sellingPrice}` : '—'),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (i) => (
        <StatusBadge status={i.status === 'active' ? 'Active' : t('common.inactive')} />
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Package}
        title={t('pages.masters.itemMaster.itemMaster')}
        subtitle={t('pages.masters.itemMaster.productsServicesAndSparePartsCatalog')}
        actions={
          canManage && (
            <>
              {/* Only renders when the company is actually behind the catalogue. */}
              <LoadDefaultsButton variant="outline" />
              <Button
                type="button"
                onClick={() => navigate(`${buildPath('masters', 'items')}/create`)}
              >
                <Plus className="size-4" />
                {t('shared.addNew')}
              </Button>
            </>
          )
        }
      />

      <StatCardGrid>
        <StatCard label={t('common.total')} value={items.length} icon={Package} />
        <StatCard
          label={t('common.active')}
          icon={CheckCircle2}
          value={items.filter((i) => i.status === 'active').length}
          tone="success"
        />
        <StatCard
          label={t('shared.services')}
          icon={Wrench}
          value={items.filter((i) => i.type === 'service').length}
        />
        <StatCard
          label={t('pages.masters.itemMaster.stockTracked')}
          icon={Boxes}
          value={items.filter((i) => i.stockTracked).length}
          tone="info"
        />
        <StatCard
          label={t('pages.masters.itemMaster.sales')}
          icon={IndianRupee}
          value={items.filter((i) => i.lob.sales.isActive).length}
          tone="purple"
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.masters.itemMaster.searchItems')}
      >
        <Select value={filters.type} onValueChange={(v) => v && setFilter('type', v as ItemType)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('common.allTypes')}</SelectItem>
            <SelectItem value="service">{t('shared.service')}</SelectItem>
            <SelectItem value="part">{t('common.part')}</SelectItem>
            <SelectItem value="product">{t('pages.masters.itemMaster.product')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.categoryId} onValueChange={(v) => v && setFilter('categoryId', v)}>
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

        <Select value={filters.taxCategory} onValueChange={(v) => v && setFilter('taxCategory', v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('pages.masters.itemMaster.allTaxes')}</SelectItem>
            {TAX_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.tracking} onValueChange={(v) => v && setFilter('tracking', v)}>
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

        <Select
          value={filters.stock}
          onValueChange={(v) => v && setFilter('stock', v as ItemFilters['stock'])}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('pages.masters.itemMaster.allStock')}</SelectItem>
            <SelectItem value="tracked">{t('pages.masters.itemMaster.stockTracked')}</SelectItem>
            <SelectItem value="untracked">{t('pages.masters.itemMaster.notTracked')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.lob}
          onValueChange={(v) => v && setFilter('lob', v as ItemFilters['lob'])}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('pages.masters.itemMaster.allLines')}</SelectItem>
            <SelectItem value="sales">{t('pages.masters.itemMaster.sales')}</SelectItem>
            <SelectItem value="purchase">{t('pages.masters.itemMaster.purchase')}</SelectItem>
            <SelectItem value="production">{t('pages.masters.itemMaster.production')}</SelectItem>
            <SelectItem value="servicePos">{t('pages.masters.itemMaster.servicePos')}</SelectItem>
            <SelectItem value="ecommerce">{t('pages.masters.createItem.ecommerce')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => v && setFilter('status', v as ItemFilters['status'])}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('common.allStatuses')}</SelectItem>
            <SelectItem value="active">{t('common.active')}</SelectItem>
            <SelectItem value="disabled">{t('common.inactive')}</SelectItem>
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setFilters(NO_FILTERS)}>
            {t('common.clear')} ({activeFilterCount})
          </Button>
        )}
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
            icon={Package}
            title={t('pages.masters.itemMaster.noItemsYet')}
            description={
              canManage
                ? t('components.shared.loadDefaults.yourItemMasterIsEmpty')
                : t('pages.masters.itemMaster.addYourFirstItemAbove')
            }
            action={canManage ? <LoadDefaultsButton /> : undefined}
          />
        }
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={viewing.type === 'service' ? Wrench : Package}
          title={viewing.name}
          subtitle={viewing.itemCode}
          badges={
            <StatusBadge status={viewing.status === 'active' ? 'Active' : t('common.inactive')} />
          }
          actions={
            canManage && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`${buildPath('masters', 'items')}/${viewing.id}/edit`)}
                >
                  <Pencil className="size-3.5" />
                  {t('common.edit')}
                </Button>
                <ItemStatusButton item={viewing} />
              </>
            )
          }
          sections={[
            {
              title: t('pages.masters.itemMaster.classification'),
              rows: [
                { label: t('common.type'), value: t(TYPE_LABEL[viewing.type]).toUpperCase() },
                { label: t('pages.masters.itemMaster.nature'), value: viewing.nature },
                { label: t('common.category'), value: viewing.categoryName ?? '—' },
                {
                  label: t('pages.masters.createItem.subCategory'),
                  value: viewing.subCategoryName ?? '—',
                },
              ],
            },
            {
              title: t('pages.masters.createItem.sections.units'),
              rows: [
                {
                  label: t('pages.masters.itemMaster.primaryUom'),
                  value: `${viewing.primaryUom.name} (${viewing.primaryUom.symbol})`,
                },
                {
                  label: t('pages.masters.createItem.purchaseUom'),
                  value: viewing.purchaseUom
                    ? `${viewing.purchaseUom.name} (${viewing.purchaseUom.symbol})`
                    : t('pages.masters.createItem.sameAsPrimary'),
                },
                {
                  label: t('pages.masters.createItem.salesUom'),
                  value: viewing.salesUom
                    ? `${viewing.salesUom.name} (${viewing.salesUom.symbol})`
                    : t('pages.masters.createItem.sameAsPrimary'),
                },
              ],
            },
            {
              title: t('pages.masters.itemMaster.pricing'),
              rows: [
                {
                  label: t('pages.masters.createItem.taxCategory'),
                  value: `${TAX_CATEGORIES.find((c) => c.value === viewing.taxCategory)?.label ?? viewing.taxCategory}`,
                },
                {
                  label: t('pages.masters.itemMaster.gst'),
                  value: `CGST ${viewing.gstRates.cgst}% · SGST ${viewing.gstRates.sgst}% · IGST ${viewing.gstRates.igst}% · Cess ${viewing.gstRates.cess}%`,
                },
                {
                  label: t('common.sellingPrice'),
                  value: viewing.sellingPrice != null ? `₹${viewing.sellingPrice}` : '—',
                },
                {
                  label: t('common.purchasePrice'),
                  value: viewing.purchasePrice != null ? `₹${viewing.purchasePrice}` : '—',
                },
                {
                  label: t('pages.masters.itemMaster.mrp'),
                  value: viewing.mrp != null ? `₹${viewing.mrp}` : '—',
                },
              ],
            },
            {
              title: t('pages.masters.itemMaster.inventory'),
              rows: [
                {
                  label: t('pages.masters.itemMaster.stockTracked'),
                  value: viewing.stockTracked ? t('common.yes') : t('common.no'),
                },
                ...(viewing.stockTracked
                  ? [
                      {
                        label: t('pages.masters.createItem.trackingType'),
                        value:
                          TRACKING_TYPES.find((tt) => tt.value === viewing.trackingType)?.label ??
                          viewing.trackingType,
                      },
                      {
                        label: t('pages.masters.createItem.shelfLifeDays'),
                        value: viewing.shelfLifeDays != null ? String(viewing.shelfLifeDays) : '—',
                      },
                      {
                        label: t('pages.masters.createItem.minStock'),
                        value: String(viewing.reorder.minStock),
                      },
                      {
                        label: t('pages.masters.createItem.reorderPoint'),
                        value: String(viewing.reorder.reorderPoint),
                      },
                      {
                        label: t('pages.masters.createItem.reorderQty'),
                        value: String(viewing.reorder.reorderQty),
                      },
                      {
                        label: t('pages.masters.createItem.maxStock'),
                        value: String(viewing.reorder.maxStock),
                      },
                    ]
                  : []),
              ],
            },
            ...(viewing.hasVariants
              ? [
                  {
                    title: t('pages.masters.createItem.sections.variants'),
                    rows: [
                      {
                        label: t('pages.masters.createItem.variantAttributes'),
                        value: viewing.variantAttributes.join(', ') || '—',
                      },
                    ],
                  },
                ]
              : []),
            {
              title: t('pages.masters.createItem.sections.lob'),
              children: (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        [t('pages.masters.itemMaster.sales'), viewing.lob.sales.isActive],
                        [t('pages.masters.itemMaster.purchase'), viewing.lob.purchase.isActive],
                        [t('pages.masters.itemMaster.production'), viewing.lob.production.isActive],
                        [t('pages.masters.itemMaster.servicePos'), viewing.lob.servicePos.isActive],
                        [t('pages.masters.createItem.ecommerce'), viewing.lob.ecommerce.isActive],
                      ] as const
                    ).map(([label, on]) => (
                      <span
                        key={label}
                        className={
                          'rounded-full px-2 py-0.5 text-xs font-medium ' +
                          (on
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-secondary text-muted-foreground')
                        }
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <dl className="space-y-1 text-xs text-muted-foreground">
                    {viewing.lob.sales.isActive && (
                      <div>
                        {t('pages.masters.createItem.maxDiscount')}:{' '}
                        {viewing.lob.sales.allowDiscount
                          ? `${viewing.lob.sales.maxDiscountPercent}%`
                          : t('common.no')}
                      </div>
                    )}
                    {viewing.lob.purchase.isActive && (
                      <div>
                        {t('pages.masters.createItem.leadTimeDays')}:{' '}
                        {viewing.lob.purchase.leadTimeDays}
                      </div>
                    )}
                    {viewing.lob.production.isActive && (
                      <div>
                        {t('pages.masters.createItem.bomItem')}:{' '}
                        {viewing.lob.production.isBomItem ? t('common.yes') : t('common.no')}
                      </div>
                    )}
                  </dl>
                </div>
              ),
            },
            ...(viewing.description
              ? [
                  {
                    title: t('shared.description'),
                    children: (
                      <p className="text-sm text-muted-foreground">{viewing.description}</p>
                    ),
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  )
}

function ItemStatusButton({ item }: { item: ItemRow }) {
  const { t } = useTranslation()
  const setStatus = useSetItemStatus()
  const [confirming, setConfirming] = useState(false)
  const willDeactivate = item.status === 'active'

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        {willDeactivate ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
        {willDeactivate ? t('common.deactivate') : t('common.activate')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${willDeactivate ? t('common.deactivate') : t('common.activate')} "${item.name}"?`}
        message={
          willDeactivate
            ? t('pages.masters.itemMaster.deactivatedItemsNoLongerAppear')
            : t('pages.masters.itemMaster.thisItemWillBecomeSelectableAgain')
        }
        confirmLabel={willDeactivate ? t('common.deactivate') : t('common.activate')}
        destructive={willDeactivate}
        isPending={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(
            { id: item.id, status: willDeactivate ? 'disabled' : 'active', itemName: item.name },
            { onSuccess: () => setConfirming(false) }
          )
        }
      />
    </>
  )
}
