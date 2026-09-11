import { useState } from 'react'
import { Sliders, Plus, Pencil, Trash2, RefreshCw, Search, CheckCircle2 } from 'lucide-react'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { slugifyCode } from '@/lib/utils'
import {
  useItemAttributes,
  useCreateItemAttribute,
  useUpdateItemAttribute,
  useDeleteItemAttribute,
  type AttributeDataType,
  type AttributeEntity,
  type ItemAttributeWithId,
} from '@/hooks/use-item-attributes'
import { useItems } from '@/hooks/use-items'
import { usePermissions } from '@/hooks/use-permissions'
import { useTranslation } from 'react-i18next'

const ENTITIES: AttributeEntity[] = ['item', 'party', 'jobCard']
const DATA_TYPES: AttributeDataType[] = ['text', 'number', 'date', 'boolean', 'select']

/**
 * Masters > Attributes — the custom fields a shop adds to its own records.
 *
 * An attribute is a *field definition*, not a list of colours: a name, a stable code, the kind
 * of record it attaches to, the kind of value it holds, and whether the form refuses to save
 * without it. `select` is the one data type that also carries a list of choices.
 *
 * The first version of this screen was a name plus a comma-separated list of values — only the
 * last of those five things. It was built without a reference and was simply the wrong shape.
 *
 * `ItemDoc.variantAttributes` still stores attribute *names* as free text, so Create Item asks
 * the shopkeeper to type them from memory and "Colour", "colour" and "Color" become three
 * different attributes. This is the list they should be chosen from, and the "In use" count is
 * what makes deleting one an informed decision rather than a surprise.
 */
export function AttributesPage() {
  const { t } = useTranslation()
  const { data: attributes = [], isLoading, error: loadError, refetch } = useItemAttributes()
  const { data: items = [] } = useItems()
  const { canDo } = usePermissions()
  const canManage = canDo('MASTERS_ITEMS_UPDATE')

  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState<AttributeEntity | 'all'>('all')
  const [editing, setEditing] = useState<ItemAttributeWithId | 'new' | null>(null)
  const [deleting, setDeleting] = useState<ItemAttributeWithId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  // Whether the code is still following the name. Once someone types their own it stops — which
  // is why this is a flag rather than "is the code field empty".
  const [codeTouched, setCodeTouched] = useState(false)
  const [appliesTo, setAppliesTo] = useState<AttributeEntity>('item')
  const [dataType, setDataType] = useState<AttributeDataType>('text')
  const [mandatory, setMandatory] = useState(false)
  const [values, setValues] = useState('')

  const create = useCreateItemAttribute()
  const update = useUpdateItemAttribute()
  const remove = useDeleteItemAttribute()

  /** How many items still name this attribute, counted from what items actually stored rather
   *  than from a tally that could drift. */
  const usageOf = (attr: ItemAttributeWithId) =>
    items.filter((i) =>
      (i.variantAttributes ?? []).some((v) => v.trim().toLowerCase() === attr.name.toLowerCase())
    ).length

  const q = search.trim().toLowerCase()
  const rows = attributes
    .filter((a) => entityFilter === 'all' || (a.appliesTo ?? 'item') === entityFilter)
    .filter(
      (a) => !q || a.name.toLowerCase().includes(q) || (a.code ?? '').toLowerCase().includes(q)
    )

  function open(row: ItemAttributeWithId | 'new') {
    setEditing(row)
    setError(null)
    setName(row === 'new' ? '' : row.name)
    setCode(row === 'new' ? '' : (row.code ?? ''))
    setCodeTouched(row !== 'new')
    setAppliesTo(row === 'new' ? 'item' : (row.appliesTo ?? 'item'))
    setDataType(row === 'new' ? 'text' : (row.dataType ?? 'text'))
    setMandatory(row === 'new' ? false : (row.mandatory ?? false))
    setValues(row === 'new' ? '' : row.values.join(', '))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError(t('pages.masters.attributes.aNameIsRequired'))
      return
    }
    const finalCode = (code.trim() || slugifyCode(name)).toUpperCase()
    // A code is only worth having if it identifies one attribute.
    const clash = attributes.find(
      (a) => (a.code ?? '').toUpperCase() === finalCode && (editing === 'new' || a.id !== editing?.id)
    )
    if (clash) {
      setError(t('pages.masters.attributes.thatCodeIsTaken', { name: clash.name }))
      return
    }

    const payload = {
      name,
      code: finalCode,
      appliesTo,
      dataType,
      mandatory,
      values:
        dataType === 'select'
          ? values
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
    }
    const done = { onSuccess: () => setEditing(null) }
    if (editing === 'new') create.mutate(payload, done)
    else if (editing) update.mutate({ id: editing.id, ...payload }, done)
  }

  const columns: DataTableColumn<ItemAttributeWithId>[] = [
    {
      key: 'name',
      header: t('common.name'),
      sortValue: (a) => a.name,
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.name}</p>
          {a.code && <p className="font-mono text-xs text-muted-foreground">{a.code}</p>}
        </div>
      ),
    },
    {
      key: 'appliesTo',
      header: t('pages.masters.attributes.appliesTo'),
      hideOnMobile: true,
      render: (a) => t(`pages.masters.attributes.entity.${a.appliesTo ?? 'item'}`),
    },
    {
      key: 'dataType',
      header: t('pages.masters.attributes.dataType'),
      hideOnMobile: true,
      render: (a) => (
        <div className="min-w-0">
          <span>{t(`pages.masters.attributes.type.${a.dataType ?? 'text'}`)}</span>
          {(a.dataType ?? 'text') === 'select' && a.values.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">{a.values.join(', ')}</p>
          )}
        </div>
      ),
    },
    {
      key: 'mandatory',
      header: t('pages.masters.attributes.mandatory'),
      hideOnMobile: true,
      render: (a) =>
        a.mandatory ? (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            {t('common.yes')}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
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
      render: (a) => (
        <StatusBadge status={a.status === 'active' ? 'Active' : t('common.inactive')} dot />
      ),
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

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{t('pages.masters.attributes.attributes')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('pages.masters.attributes.dynamicProductItemAttributes')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="size-4" />
            {t('common.refresh')}
          </Button>
          {canManage && (
            <Button type="button" onClick={() => open('new')}>
              <Plus className="size-4" />
              {t('pages.masters.attributes.addAttribute')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard icon={Sliders} label={t('common.total')} value={String(attributes.length)} />
        <StatCard
          icon={CheckCircle2}
          label={t('common.active')}
          value={String(attributes.filter((a) => a.status === 'active').length)}
          tone="success"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pages.masters.attributes.searchAttributes')}
            className="pl-8"
          />
        </div>
        <Select
          value={entityFilter}
          onValueChange={(v) => v && setEntityFilter(v as AttributeEntity | 'all')}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pages.masters.attributes.allEntities')}</SelectItem>
            {ENTITIES.map((e) => (
              <SelectItem key={e} value={e}>
                {t(`pages.masters.attributes.entity.${e}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
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
          submitLabel={editing === 'new' ? t('common.create') : t('common.save')}
          isSubmitting={create.isPending || update.isPending}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="attrName">
                {t('common.name')} <span className="text-red-600">*</span>
              </Label>
              <Input
                id="attrName"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  // The code follows the name until someone types their own.
                  if (!codeTouched) setCode(slugifyCode(e.target.value))
                }}
                placeholder={t('pages.masters.attributes.eGColorRam')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attrCode">
                {t('common.code')} <span className="text-red-600">*</span>
              </Label>
              <Input
                id="attrCode"
                value={code}
                onChange={(e) => {
                  setCodeTouched(true)
                  setCode(e.target.value.toUpperCase())
                }}
                placeholder={t('pages.masters.attributes.autoGenerated')}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {t('pages.masters.attributes.appliesTo')} <span className="text-red-600">*</span>
              </Label>
              <Select
                value={appliesTo}
                onValueChange={(v) => v && setAppliesTo(v as AttributeEntity)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITIES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {t(`pages.masters.attributes.entity.${e}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                {t('pages.masters.attributes.dataType')} <span className="text-red-600">*</span>
              </Label>
              <Select
                value={dataType}
                onValueChange={(v) => v && setDataType(v as AttributeDataType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {t(`pages.masters.attributes.type.${d}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Only a dropdown needs a list of choices; on the other types it would be a field with
           * nothing to do. */}
          {dataType === 'select' && (
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
          )}

          <label className="flex items-start gap-2.5 rounded-lg border p-3">
            <Checkbox
              checked={mandatory}
              onCheckedChange={(v) => setMandatory(v === true)}
              className="mt-0.5"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">
                {t('pages.masters.attributes.mandatory')}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t('pages.masters.attributes.requireThisFieldWhenCreating')}
              </span>
            </span>
          </label>
        </FormModal>
      )}

      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? `${t('common.delete')} "${deleting.name}"?` : ''}
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
