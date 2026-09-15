import { useState } from 'react'
import { Users, User, Truck, UserCog, Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { useItemAttributes } from '@/hooks/use-item-attributes'
import { attributeRows, attributesFor } from '@/lib/attribute-values'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { PartyFormModal } from '@/components/shared/party-form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { useParties, useSetPartyStatus, type PartyWithId } from '@/hooks/use-parties'
import { usePartyCategories } from '@/hooks/use-party-categories'
import { usePermissions } from '@/hooks/use-permissions'
import { formatTimestamp } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

type PartyTypeFilter = 'all' | 'customer' | 'supplier' | 'both'

export function PartiesPage() {
  const { t } = useTranslation()
  const { data: parties = [], isLoading, error: loadError, refetch } = useParties()
  const { data: categories = [] } = usePartyCategories()
  const { canDo } = usePermissions()
  const canManage = canDo('MASTERS_PARTIES_UPDATE')

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<PartyTypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState<PartyWithId | 'new' | null>(null)
  const [viewing, setViewing] = useState<PartyWithId | null>(null)
  const { data: allAttributes = [] } = useItemAttributes()
  const partyAttributeRows = attributeRows(
    attributesFor(allAttributes, 'party'),
    viewing?.attributes,
    { yes: t('common.yes'), no: t('common.no') }
  )

  const activeParties = parties.filter((p) => p.status !== 'deleted')

  const filtered = activeParties
    .filter((p) => {
      if (typeFilter === 'all') return true
      if (typeFilter === 'both') return p.partyTypes.length > 1
      return p.partyTypes.includes(typeFilter) && p.partyTypes.length === 1
    })
    .filter((p) => categoryFilter === 'all' || p.categoryId === categoryFilter)
    .filter((p) =>
      search.trim()
        ? `${p.name} ${p.mobile} ${p.partyNumber}`.toLowerCase().includes(search.toLowerCase())
        : true
    )

  function typeLabel(p: PartyWithId) {
    if (p.partyTypes.length > 1) return t('pages.masters.parties.both')
    return p.partyTypes.includes('supplier') ? 'Supplier' : t('common.customer')
  }

  const columns: DataTableColumn<PartyWithId>[] = [
    {
      key: 'party',
      header: t('common.party'),
      sortValue: (p) => p.name,
      render: (p) => (
        <div>
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.partyNumber}</p>
        </div>
      ),
    },
    { key: 'mobile', header: t('common.mobile'), render: (p) => p.mobile },
    {
      key: 'category',
      header: t('common.category'),
      hideOnMobile: true,
      render: (p) => p.categoryName ?? '—',
    },
    { key: 'type', header: t('common.type'), hideOnMobile: true, render: (p) => typeLabel(p) },
    {
      key: 'status',
      header: t('common.status'),
      render: (p) => (
        <StatusBadge status={p.status === 'active' ? 'Active' : t('common.inactive')} />
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Users}
        title={t('common.parties')}
        subtitle={t('pages.masters.parties.manageCustomersAndSuppliers')}
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              {t('pages.masters.parties.addParty')}
            </Button>
          )
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.masters.parties.searchByNameMobileOrParty')}
      />

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', t('common.all')],
              ['customer', t('common.customers')],
              ['supplier', t('common.suppliers')],
              ['both', t('pages.masters.parties.both')],
            ] as [PartyTypeFilter, string][]
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={typeFilter === key ? 'default' : 'outline'}
              onClick={() => setTypeFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('all')}
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              type="button"
              size="sm"
              variant={categoryFilter === c.id ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        onRowClick={setViewing}
        emptyState={
          <EmptyState
            icon={Users}
            title={t('pages.masters.parties.noPartiesFound')}
            description={t('pages.masters.parties.addYourFirstCustomerOrSupplier')}
          />
        }
      />

      {editing && <PartyFormModal editing={editing} onClose={() => setEditing(null)} />}

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={
            viewing.partyTypes.includes('supplier') && !viewing.partyTypes.includes('customer')
              ? Truck
              : User
          }
          title={viewing.name}
          subtitle={
            <>
              {viewing.partyNumber} · 📞 {viewing.mobile}
            </>
          }
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
                  onClick={() => {
                    setEditing(viewing)
                    setViewing(null)
                  }}
                >
                  <Pencil className="size-3.5" />
                  {t('common.edit')}
                </Button>
                <PartyDeleteButton party={viewing} onDone={() => setViewing(null)} />
              </>
            )
          }
          sections={[
            {
              title: t('shared.details'),
              icon: UserCog,
              rows: [
                { label: t('common.category'), value: viewing.categoryName ?? '—' },
                { label: t('common.mobile'), value: viewing.mobile },
                ...(viewing.email ? [{ label: t('common.email'), value: viewing.email }] : []),
                ...(viewing.address
                  ? [{ label: t('common.address'), value: viewing.address }]
                  : []),
                ...(viewing.gstNumber
                  ? [{ label: t('pages.masters.parties.gstNumber'), value: viewing.gstNumber }]
                  : []),
                ...(viewing.panNumber
                  ? [{ label: t('pages.masters.parties.panNumber'), value: viewing.panNumber }]
                  : []),
              ],
            },
            {
              title: t('pages.masters.parties.credit'),
              rows: [
                { label: t('pages.masters.parties.creditLimit'), value: `₹${viewing.creditLimit}` },
                { label: t('pages.masters.parties.creditDays'), value: String(viewing.creditDays) },
              ],
            },
            // Only when this party actually carries custom values — an empty card on every
            // party would be worse than no card.
            ...(partyAttributeRows.length > 0
              ? [
                  {
                    title: t('pages.masters.createItem.sections.attributes'),
                    rows: partyAttributeRows,
                  },
                ]
              : []),
          ]}
          timeline={[
            { title: t('common.createdAt'), timestamp: formatTimestamp(viewing.createdAt) },
            { title: t('shared.updated'), timestamp: formatTimestamp(viewing.updatedAt) },
          ]}
        />
      )}
    </div>
  )
}

function PartyDeleteButton({ party, onDone }: { party: PartyWithId; onDone: () => void }) {
  const { t } = useTranslation()
  const setStatus = useSetPartyStatus()
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-3.5" />
        {t('common.delete')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete "${party.name}"?`}
        message={t('pages.masters.parties.thisRemovesThePartyFromEvery')}
        confirmLabel={t('common.delete')}
        isPending={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(
            { id: party.id, status: 'deleted', partyName: party.name },
            {
              onSuccess: () => {
                setConfirming(false)
                onDone()
              },
            }
          )
        }
      />
    </>
  )
}
