import { useState } from 'react'
import { Sliders, Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatTimestamp } from '@/lib/utils'
import {
  useItemAttributes,
  useCreateItemAttribute,
  useUpdateItemAttribute,
  useDeleteItemAttribute,
  type ItemAttributeWithId,
} from '@/hooks/use-item-attributes'
import { useItems } from '@/hooks/use-items'
import { usePermissions } from '@/hooks/use-permissions'
import { useTranslation } from 'react-i18next'

/**
 * Masters > Attributes — the words item variants are described by.
 *
 * This was half-present already: `ItemDoc.variantAttributes` stored attribute names, and Create
 * Item asked the shopkeeper to type them from memory, so "Colour", "colour" and "Color" became
 * three different attributes and nothing could say which a company actually used. The "In use"
 * count is the point of the screen as much as the list is — deleting an attribute shows you what
 * still names it first.
 */
export function AttributesPage() {
  const { t } = useTranslation()
  const { data: attributes = [], isLoading, error: loadError, refetch } = useItemAttributes()
  const { data: items = [] } = useItems()
  const { canDo } = usePermissions()
  const canManage = canDo('MASTERS_ITEMS_UPDATE')

  const [editing, setEditing] = useState<ItemAttributeWithId | 'new' | null>(null)
  const [deleting, setDeleting] = useState<ItemAttributeWithId | null>(null)
  const [name, setName] = useState('')
  const [values, setValues] = useState('')
  const [error, setError] = useState<string | null>(null)

  const create = useCreateItemAttribute()
  const update = useUpdateItemAttribute()
  const remove = useDeleteItemAttribute()

  /** How many items still name this attribute. Counted from what items actually stored rather
   *  than from a denormalized tally, so it cannot drift. */
  const usageOf = (attr: ItemAttributeWithId) =>
    items.filter((i) =>
      (i.variantAttributes ?? []).some((v) => v.trim().toLowerCase() === attr.name.toLowerCase())
    ).length

  function open(row: ItemAttributeWithId | 'new') {
    setEditing(row)
    setError(null)
    setName(row === 'new' ? '' : row.name)
    setValues(row === 'new' ? '' : row.values.join(', '))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError(t('pages.masters.attributes.aNameIsRequired'))
      return
    }
    const parsed = values
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
    const done = { onSuccess: () => setEditing(null) }
    if (editing === 'new') create.mutate({ name, values: parsed }, done)
    else if (editing) update.mutate({ id: editing.id, name, values: parsed }, done)
  }

  const columns: DataTableColumn<ItemAttributeWithId>[] = [
    {
      key: 'name',
      header: t('common.name'),
      sortValue: (a) => a.name,
      render: (a) => <span className="font-medium">{a.name}</span>,
    },
    {
      key: 'values',
      header: t('pages.masters.attributes.values'),
      render: (a) =>
        a.values.length ? (
          <div className="flex flex-wrap gap-1">
            {a.values.map((v) => (
              <span
                key={v}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {v}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t('pages.masters.attributes.noValuesYet')}
          </span>
        ),
    },
    {
      key: 'inUse',
      header: t('pages.masters.attributes.inUse'),
      hideOnMobile: true,
      sortValue: (a) => usageOf(a),
      render: (a) => {
        const n = usageOf(a)
        return n === 0 ? (
          <span className="text-sm text-muted-foreground">—</span>
        ) : (
          <span className="text-sm font-medium">
            {t('pages.masters.attributes.nItems', { count: n })}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      hideOnMobile: true,
      render: (a) => <StatusBadge status={a.status === 'active' ? 'Active' : t('common.inactive')} dot />,
    },
    {
      key: 'created',
      header: t('common.createdAt'),
      hideOnMobile: true,
      render: (a) => formatTimestamp(a.createdAt as never),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (a) =>
        canManage ? (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={`Edit ${a.name}`}
              onClick={(e) => {
                e.stopPropagation()
                open(a)
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={`Delete ${a.name}`}
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                setDeleting(a)
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null,
    },
  ]

  const inUseCount = attributes.filter((a) => usageOf(a) > 0).length

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Sliders}
        title={t('pages.masters.attributes.attributes')}
        subtitle={t('pages.masters.attributes.theVocabularyItemVariants')}
        actions={
          canManage ? (
            <Button type="button" onClick={() => open('new')}>
              <Plus className="size-4" />
              {t('pages.masters.attributes.addAttribute')}
            </Button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={Sliders}
          label={t('pages.masters.attributes.attributes')}
          value={String(attributes.length)}
          tone="info"
        />
        <StatCard
          icon={Tags}
          label={t('pages.masters.attributes.values')}
          value={String(attributes.reduce((n, a) => n + a.values.length, 0))}
          tone="purple"
        />
        <StatCard
          icon={Plus}
          label={t('pages.masters.attributes.inUse')}
          value={String(inUseCount)}
          tone="success"
        />
      </div>

      <DataTable
        columns={columns}
        data={attributes}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        error={loadError}
        onRetry={() => void refetch()}
        emptyState={
          <EmptyState
            icon={Sliders}
            title={t('pages.masters.attributes.noAttributesYet')}
            description={t('pages.masters.attributes.addColourOrCapacity')}
          />
        }
      />

      {editing && (
        <FormModal
          open
          onOpenChange={(o) => !o && setEditing(null)}
          title={
            editing === 'new'
              ? t('pages.masters.attributes.addAttribute')
              : t('pages.masters.attributes.editAttribute')
          }
          error={error}
          onSubmit={handleSubmit}
          submitLabel={t('common.save')}
          isSubmitting={create.isPending || update.isPending}
        >
          <div className="space-y-1.5">
            <Label htmlFor="attrName">
              {t('common.name')} <span className="text-red-600">*</span>
            </Label>
            <Input
              id="attrName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('pages.masters.attributes.eGColour')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="attrValues">{t('pages.masters.attributes.values')}</Label>
            <Input
              id="attrValues"
              value={values}
              onChange={(e) => setValues(e.target.value)}
              placeholder={t('pages.masters.attributes.eGBlackWhiteBlue')}
            />
            <p className="text-xs text-muted-foreground">
              {t('pages.masters.attributes.separateValuesWithCommas')}
            </p>
          </div>
        </FormModal>
      )}

      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? `${t('common.delete')} "${deleting.name}"?` : ''}
        // Items keep the attribute name they stored, so this never rewrites an item — but it does
        // remove the only place that name was defined, and saying how many still use it is the
        // difference between an informed deletion and a surprise.
        message={
          deleting && usageOf(deleting) > 0
            ? t('pages.masters.attributes.nItemsStillName', { count: usageOf(deleting) })
            : t('pages.masters.attributes.thisPermanentlyDeletes')
        }
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting, { onSuccess: () => setDeleting(null) })
        }}
      />
    </div>
  )
}
