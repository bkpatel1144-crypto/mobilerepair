import { useState } from 'react'
import { Sliders, Plus, Pencil, Trash2, Ban, CheckCircle2, Tag } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatCardGrid } from '@/components/shared/stat-card-grid'
import { FilterBar } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatTimestamp } from '@/lib/utils'
import {
  useItemAttributes,
  useCreateItemAttribute,
  useUpdateItemAttribute,
  useSetItemAttributeStatus,
  useDeleteItemAttribute,
  type ItemAttributeWithId,
} from '@/hooks/use-item-attributes'
import { useItems } from '@/hooks/use-items'
import { usePermissions } from '@/hooks/use-permissions'
import { useTranslation } from 'react-i18next'

/**
 * Masters > Attributes — the vocabulary item variants are defined by.
 *
 * From the client's menu export, and the missing half of a field this app already had:
 * `ItemDoc.variantAttributes` stores attribute names, which the Create Item form was asking the
 * shopkeeper to type from memory. The "In use" column counts items naming each attribute, so
 * deleting one shows what it would orphan.
 */
export function AttributesPage() {
  const { t } = useTranslation()
  const { data: attributes = [], isLoading, error: loadError, refetch } = useItemAttributes()
  const { data: items = [] } = useItems()
  const { canDo } = usePermissions()
  const canManage = canDo('MASTERS_ATTRIBUTES_UPDATE')

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ItemAttributeWithId | 'new' | null>(null)
  const [viewing, setViewing] = useState<ItemAttributeWithId | null>(null)

  const usageOf = (attribute: ItemAttributeWithId) =>
    items.filter((i) => i.variantAttributes.includes(attribute.name)).length

  const filtered = attributes.filter((a) =>
    `${a.name} ${a.code} ${a.values.join(' ')}`.toLowerCase().includes(search.toLowerCase())
  )

  const columns: DataTableColumn<ItemAttributeWithId>[] = [
    {
      key: 'name',
      header: t('common.name'),
      sortValue: (a) => a.name,
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.name}</p>
          <p className="text-xs text-muted-foreground">{a.code}</p>
        </div>
      ),
    },
    {
      key: 'values',
      header: t('pages.masters.attributes.values'),
      render: (a) =>
        a.values.length ? (
          <div className="flex flex-wrap gap-1">
            {a.values.slice(0, 4).map((value) => (
              <span key={value} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {value}
              </span>
            ))}
            {a.values.length > 4 && (
              <span className="text-xs text-muted-foreground">+{a.values.length - 4}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{t('common.none')}</span>
        ),
    },
    {
      key: 'usage',
      header: t('pages.masters.attributes.inUse'),
      hideOnMobile: true,
      sortValue: (a) => usageOf(a),
      render: (a) => usageOf(a),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (a) => (
        <StatusBadge status={a.status === 'active' ? 'Active' : t('common.inactive')} />
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Sliders}
        title={t('pages.masters.attributes.attributes')}
        subtitle={t('pages.masters.attributes.theVocabularyItemVariantsAre')}
        actions={
          canManage && (
            <Button type="button" onClick={() => setEditing('new')}>
              <Plus className="size-4" />
              {t('shared.addNew')}
            </Button>
          )
        }
      />

      <StatCardGrid>
        <StatCard label={t('common.total')} value={attributes.length} icon={Sliders} />
        <StatCard
          label={t('common.active')}
          value={attributes.filter((a) => a.status === 'active').length}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label={t('pages.masters.attributes.values')}
          value={attributes.reduce((n, a) => n + a.values.length, 0)}
          icon={Tag}
          tone="purple"
        />
      </StatCardGrid>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pages.masters.attributes.searchAttributes')}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        onRowClick={setViewing}
        emptyState={
          <EmptyState
            icon={Sliders}
            title={t('pages.masters.attributes.noAttributesYet')}
            description={t('pages.masters.attributes.addColourOrCapacityToStart')}
          />
        }
      />

      {editing && <AttributeModal editing={editing} onClose={() => setEditing(null)} />}

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={Sliders}
          title={viewing.name}
          subtitle={viewing.code}
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
                <AttributeStatusButton attribute={viewing} />
                <AttributeDeleteButton
                  attribute={viewing}
                  inUse={usageOf(viewing)}
                  onDeleted={() => setViewing(null)}
                />
              </>
            )
          }
          sections={[
            {
              title: t('common.details'),
              icon: Sliders,
              rows: [
                { label: t('common.code'), value: viewing.code },
                { label: t('pages.masters.attributes.inUse'), value: usageOf(viewing) },
                {
                  label: t('common.description'),
                  value: viewing.description || '—',
                },
              ],
            },
            {
              title: t('pages.masters.attributes.values'),
              icon: Tag,
              children: viewing.values.length ? (
                <div className="flex flex-wrap gap-1.5 rounded-xl border p-3">
                  {viewing.values.map((value) => (
                    <span key={value} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                      {value}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border p-3 text-sm text-muted-foreground">
                  {t('pages.masters.attributes.noValuesYet')}
                </p>
              ),
            },
          ]}
          timeline={[
            {
              title: t('common.createdAt'),
              timestamp: formatTimestamp(viewing.createdAt),
            },
            {
              title: t('common.updatedAt'),
              timestamp: formatTimestamp(viewing.updatedAt),
            },
          ]}
        />
      )}
    </div>
  )
}

function AttributeModal({
  editing,
  onClose,
}: {
  editing: ItemAttributeWithId | 'new'
  onClose: () => void
}) {
  const { t } = useTranslation()
  const isNew = editing === 'new'
  const create = useCreateItemAttribute()
  const update = useUpdateItemAttribute()

  const [name, setName] = useState(isNew ? '' : editing.name)
  // Comma-separated while editing: a chip editor for three values is more machinery than the
  // job needs, and a comma is how a shopkeeper writes a list anyway.
  const [values, setValues] = useState(isNew ? '' : editing.values.join(', '))
  const [description, setDescription] = useState(isNew ? '' : (editing.description ?? ''))
  const [error, setError] = useState<string | null>(null)

  const parsed = values
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? t('pages.masters.attributes.addAttribute') : t('common.edit')}
      error={error}
      isSubmitting={create.isPending || update.isPending}
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        if (!name.trim()) {
          setError(t('pages.masters.attributes.aNameIsRequired'))
          return
        }
        const input = { name: name.trim(), values: parsed, description: description.trim() || null }
        const done = { onSuccess: onClose, onError: (e: Error) => setError(e.message) }
        if (isNew) create.mutate(input, done)
        else update.mutate({ id: editing.id, ...input }, done)
      }}
    >
      <div className="space-y-1.5">
        <Label>
          {t('common.name')} <span className="text-red-600">*</span>
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('pages.masters.attributes.eGColour')}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t('pages.masters.attributes.values')}</Label>
        <Input
          value={values}
          onChange={(e) => setValues(e.target.value)}
          placeholder={t('pages.masters.attributes.eGBlackWhiteBlue')}
        />
        <p className="text-xs text-muted-foreground">
          {t('pages.masters.createItem.separateWithCommas')}
          {parsed.length > 0 && ` · ${parsed.length}`}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>{t('common.description')}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t('shared.optionalNotes')}
        />
      </div>
    </FormModal>
  )
}

function AttributeStatusButton({ attribute }: { attribute: ItemAttributeWithId }) {
  const { t } = useTranslation()
  const setStatus = useSetItemAttributeStatus()
  const [confirming, setConfirming] = useState(false)
  const willDeactivate = attribute.status === 'active'

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        {willDeactivate ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
        {willDeactivate ? t('common.deactivate') : t('common.activate')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${willDeactivate ? t('common.deactivate') : t('common.activate')} "${attribute.name}"?`}
        message={t('pages.masters.attributes.aDeactivatedAttributeIsNotOffered')}
        confirmLabel={willDeactivate ? t('common.deactivate') : t('common.activate')}
        destructive={willDeactivate}
        isPending={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(
            {
              id: attribute.id,
              status: willDeactivate ? 'disabled' : 'active',
              name: attribute.name,
            },
            { onSuccess: () => setConfirming(false) }
          )
        }
      />
    </>
  )
}

function AttributeDeleteButton({
  attribute,
  inUse,
  onDeleted,
}: {
  attribute: ItemAttributeWithId
  inUse: number
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const remove = useDeleteItemAttribute()
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
        title={`${t('common.delete')} "${attribute.name}"?`}
        message={
          inUse
            ? t('pages.masters.attributes.nItemsStillNameThisAttribute', { count: inUse })
            : t('pages.masters.attributes.thisPermanentlyDeletesTheAttribute')
        }
        confirmLabel={t('common.delete')}
        destructive
        isPending={remove.isPending}
        onConfirm={() =>
          remove.mutate(attribute, {
            onSuccess: () => {
              setConfirming(false)
              onDeleted()
            },
          })
        }
      />
    </>
  )
}
