import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Trash2,
  Package,
  FolderTree,
  Ruler,
  IndianRupee,
  Boxes,
  Shuffle,
  Tags,
  Puzzle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormError } from '@/components/shared/form-error'
import { FormSection } from '@/components/shared/form-section'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  useItems,
  useCreateItem,
  useUpdateItem,
  nextItemCode,
  type ItemRow,
} from '@/hooks/use-items'
import { useItemCategories } from '@/hooks/use-item-categories'
import { useUoms } from '@/hooks/use-uom'
import {
  TAX_CATEGORIES,
  TRACKING_TYPES,
  defaultLob,
  emptyGstRates,
  emptyReorder,
  taxPercentOf,
  DEFAULT_UOM,
} from '@/lib/item-defaults'
import { AttributeFields } from '@/components/shared/attribute-fields'
import { MultiSelectPopover } from '@/components/shared/multi-select-popover'
import { useItemAttributes } from '@/hooks/use-item-attributes'
import {
  attributesFor,
  attributeValuesToDraft,
  cleanAttributeValues,
  missingMandatoryAttributes,
  type AttributeValues,
} from '@/lib/attribute-values'
import { buildPath } from '@/config/nav'
import type {
  ItemGstRates,
  ItemLobConfig,
  ItemReorderSettings,
  ItemType,
  ItemUomRef,
  TaxCategory,
  TrackingType,
} from '@/types/firestore'
import { useTranslation } from 'react-i18next'

/**
 * Create / edit one item, on its own page.
 *
 * Replaces a modal that collected twelve of the thirty-five fields the client's export carries —
 * no tax category, no split GST, no tracking type, no reorder levels, no per-line-of-business
 * terms, no sub-category, no purchase or sales unit. Those fields were not merely unexposed:
 * nothing wrote them, so every item this app created was missing them.
 *
 * A page rather than a modal because thirty-five fields in a dialog is a scroll trap on a phone,
 * and because the draft can then survive a navigation the way Create Job Card's does.
 */

const DRAFT_KEY = 'aim-create-item-draft'

interface ItemDraft {
  name: string
  itemCode: string
  type: ItemType
  description: string
  categoryId: string
  subCategoryId: string
  primaryUomId: string
  purchaseUomId: string
  salesUomId: string
  taxCategory: TaxCategory
  gstRates: ItemGstRates
  sellingPrice: string
  purchasePrice: string
  mrp: string
  stockTracked: boolean
  trackingType: TrackingType
  shelfLifeDays: string
  reorder: ItemReorderSettings
  hasVariants: boolean
  variantAttributes: string
  attributes: AttributeValues
  lob: ItemLobConfig
}

const NONE = 'none'

function emptyDraft(): ItemDraft {
  return {
    name: '',
    itemCode: '',
    type: 'part',
    description: '',
    categoryId: NONE,
    subCategoryId: NONE,
    primaryUomId: NONE,
    purchaseUomId: NONE,
    salesUomId: NONE,
    taxCategory: 'GST_18',
    gstRates: emptyGstRates(),
    sellingPrice: '',
    purchasePrice: '',
    mrp: '',
    stockTracked: true,
    trackingType: 'NONE',
    shelfLifeDays: '',
    reorder: emptyReorder(),
    hasVariants: false,
    variantAttributes: '',
    attributes: {},
    lob: defaultLob(false),
  }
}

/** An existing item, as the form's own draft shape. */
function draftFrom(item: ItemRow): ItemDraft {
  return {
    name: item.name,
    itemCode: item.itemCode,
    type: item.type,
    description: item.description ?? '',
    categoryId: item.categoryId ?? NONE,
    subCategoryId: item.subCategoryId ?? NONE,
    primaryUomId: item.primaryUom.id ?? NONE,
    purchaseUomId: item.purchaseUom?.id ?? NONE,
    salesUomId: item.salesUom?.id ?? NONE,
    taxCategory: item.taxCategory,
    gstRates: item.gstRates,
    sellingPrice: item.sellingPrice != null ? String(item.sellingPrice) : '',
    purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : '',
    mrp: item.mrp != null ? String(item.mrp) : '',
    stockTracked: item.stockTracked,
    trackingType: item.trackingType,
    shelfLifeDays: item.shelfLifeDays != null ? String(item.shelfLifeDays) : '',
    reorder: item.reorder,
    hasVariants: item.hasVariants,
    variantAttributes: item.variantAttributes.join(', '),
    attributes: item.attributes,
    lob: item.lob,
  }
}

/** A number input's string back to a number, treating blank as absent rather than as zero — the
 *  difference between "no MRP set" and "MRP is ₹0", which the list column renders differently. */
function num(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function numOr0(value: string): number {
  return num(value) ?? 0
}

/**
 * Create / edit an item — the route at `masters/items/create`, and the same form opened as a
 * modal from any part or service picker.
 *
 * One component rather than a page and a cut-down "quick add": an item carries thirty-nine
 * fields and the pickers used to create one from a name alone, leaving a part with no price, no
 * tax category and no unit. Per the client, choosing add in a dropdown opens the real form.
 *
 * `onSaved` is what puts it in modal mode. In that mode there is no draft autosave — a draft
 * keyed to the page would be restored the next time someone opened the page proper — and saving
 * hands the new item back to whichever picker opened it instead of navigating.
 */
export function CreateItemPage({
  defaultName,
  onSaved,
  onCancel,
}: {
  /** Prefills the name — what was typed into the picker before pressing Add. */
  defaultName?: string
  /** Set to open as a modal. Receives the saved item so the picker can select it. */
  onSaved?: (item: { id: string; name: string }) => void
  onCancel?: () => void
} = {}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { itemId } = useParams<{ itemId: string }>()
  const asModal = !!onSaved
  const isEdit = !!itemId && !asModal

  const { data: items = [] } = useItems()
  const { data: categories = [] } = useItemCategories()
  const { data: uoms = [] } = useUoms()
  const { data: allAttributes = [] } = useItemAttributes()
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()

  const existing = isEdit ? items.find((i) => i.id === itemId) : undefined

  const [draft, setDraft] = useState<ItemDraft>(() => {
    if (asModal) return { ...emptyDraft(), name: defaultName ?? '' }
    if (isEdit) return emptyDraft()
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY)
      if (saved) return { ...emptyDraft(), ...(JSON.parse(saved) as Partial<ItemDraft>) }
    } catch {
      // A corrupt draft is not worth a broken form.
    }
    return emptyDraft()
  })
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  /** Codes of mandatory attributes the last submit found blank. */
  const [missingAttributes, setMissingAttributes] = useState<string[]>([])

  // Fill the form once the item being edited arrives, adjusting state during render rather than
  // in an effect. This is the case React documents for it — state derived from a prop that has
  // changed — and it re-renders before committing, so the fields are never briefly blank. An
  // effect would set state after paint, which is both a visible flash and a cascading render the
  // React Compiler lint rejects.
  //
  // Guarded on the id rather than run once, because `useItems` streams: on a hard reload of this
  // URL the list is empty on the first render and the item arrives a moment later.
  if (existing && loadedId !== existing.id) {
    setLoadedId(existing.id)
    setDraft(draftFrom(existing))
  }

  // Autosave, new items only — an edit draft that outlived the page would silently reapply itself
  // to whichever item was opened next.
  useEffect(() => {
    if (isEdit || asModal) return
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
        setSavedAt(new Date())
      } catch {
        // Private mode, quota — a draft is a convenience, not a requirement.
      }
    }, 800)
    return () => window.clearTimeout(id)
  }, [draft, isEdit, asModal])

  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const itemAttributes = attributesFor(allAttributes, 'item')
  // Every defined attribute gets a key, so no control flips from uncontrolled to controlled when
  // an older item (saved before the attribute existed) is opened for editing.
  const attributeDraft = attributeValuesToDraft(itemAttributes, draft.attributes)

  const selectedVariantAttributes = draft.variantAttributes
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  // A name the master no longer defines is still offered, and marked, so editing an older item
  // cannot quietly drop it.
  const variantAttributeOptions = [
    ...itemAttributes.map((a) => ({ id: a.name, label: a.name })),
    ...selectedVariantAttributes
      .filter((name) => !itemAttributes.some((a) => a.name === name))
      .map((name) => ({
        id: name,
        label: `${name} (${t('pages.masters.createItem.keptFromBefore')})`,
      })),
  ]

  const isService = draft.type === 'service'
  const rootCategories = categories.filter((c) => !c.parentId)
  const subCategories = categories.filter(
    (c) => draft.categoryId !== NONE && c.parentId === draft.categoryId
  )

  const uomRefFor = (id: string): ItemUomRef | null => {
    if (id === NONE) return null
    const found = uoms.find((u) => u.id === id)
    if (!found) return null
    return { id: found.id, code: found.code, name: found.name, symbol: found.symbol ?? found.code }
  }

  const suggestedCode = isEdit ? draft.itemCode : nextItemCode(items, draft.type)

  async function handleSubmit() {
    setFormError(null)
    if (!draft.name.trim()) {
      setFormError(t('pages.masters.createItem.anItemNameIsRequired'))
      return
    }
    // Masters > Attributes marks an attribute Mandatory; until Phase 12 that flag was stored and
    // read by nothing. This is where it means something.
    const missing = missingMandatoryAttributes(itemAttributes, draft.attributes)
    setMissingAttributes(missing)
    if (missing.length > 0) {
      setFormError(t('pages.masters.createItem.fillTheRequiredAttributes'))
      return
    }
    setSubmitting(true)
    try {
      const category = categories.find((c) => c.id === draft.categoryId)
      const subCategory = categories.find((c) => c.id === draft.subCategoryId)
      const primaryUom = uomRefFor(draft.primaryUomId) ?? DEFAULT_UOM
      const payload = {
        name: draft.name.trim(),
        itemCode: draft.itemCode.trim() || suggestedCode,
        type: draft.type,
        nature: (isService ? 'Service' : 'Goods') as 'Service' | 'Goods',
        categoryId: category?.id ?? null,
        categoryName: category?.name ?? null,
        subCategoryId: subCategory?.id ?? null,
        subCategoryName: subCategory?.name ?? null,
        primaryUom,
        purchaseUom: uomRefFor(draft.purchaseUomId),
        salesUom: uomRefFor(draft.salesUomId),
        taxCategory: draft.taxCategory,
        gstRates: draft.gstRates,
        gstPercent: taxPercentOf(draft.taxCategory),
        sellingPrice: num(draft.sellingPrice),
        purchasePrice: num(draft.purchasePrice),
        mrp: num(draft.mrp),
        stockTracked: draft.stockTracked,
        trackingType: draft.trackingType,
        shelfLifeDays: num(draft.shelfLifeDays),
        reorder: draft.reorder,
        hasVariants: draft.hasVariants,
        variantAttributes: draft.variantAttributes
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        attributes: cleanAttributeValues(itemAttributes, draft.attributes),
        lob: draft.lob,
        description: draft.description.trim() || null,
      }
      if (isEdit) {
        await updateItem.mutateAsync({ id: itemId!, ...payload })
      } else {
        const created = await createItem.mutateAsync(payload)
        if (asModal) {
          onSaved?.({ id: created.id!, name: payload.name })
          return
        }
        window.localStorage.removeItem(DRAFT_KEY)
      }
      navigate(buildPath('masters', 'items'))
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : t('pages.masters.createItem.couldNotSaveTheItem')
      )
      setSubmitting(false)
    }
  }

  const setLob = <K extends keyof ItemLobConfig>(key: K, patch: Partial<ItemLobConfig[K]>) =>
    setDraft((prev) => ({ ...prev, lob: { ...prev.lob, [key]: { ...prev.lob[key], ...patch } } }))

  const setReorder = (key: keyof ItemReorderSettings, value: string) =>
    setDraft((prev) => ({ ...prev, reorder: { ...prev.reorder, [key]: numOr0(value) } }))

  const setGst = (key: keyof ItemGstRates, value: string) =>
    setDraft((prev) => ({ ...prev, gstRates: { ...prev.gstRates, [key]: numOr0(value) } }))

  const body = (
    <div className={asModal ? 'space-y-4' : 'mx-auto max-w-3xl space-y-4 p-4 pb-24 sm:p-6'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">
            {isEdit
              ? t('pages.masters.createItem.editItem')
              : t('pages.masters.createItem.createItem')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('pages.masters.createItem.addAProductServiceOrSpare')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && !isEdit && (
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <Clock className="size-3.5" />
              {t('pages.service.createJobCard.draftSavedAt')}{' '}
              {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {savedAt && !isEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmingClear(true)}
            >
              <Trash2 className="size-3.5" />
              {t('pages.service.createJobCard.clearDraft')}
            </Button>
          )}
          {/* The dialog has its own close; two of them in the same corner is one too many. */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={asModal ? 'hidden' : undefined}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft />
            {t('shared.back')}
          </Button>
        </div>
      </div>

      <FormError message={formError} />

      {/* One card, two columns — the Create Job Card layout the client asked for. Left is what
       * the item is; right is what it costs and how it is stocked. Two independent stacks, so
       * neither column has to wait for the other to finish. */}
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2 [&>*]:min-w-0">
          <div className="space-y-6">
            <FormSection flat icon={Package} title={t('pages.masters.createItem.sections.basic')}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>
                    {t('pages.masters.itemMaster.itemName')} <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder={t('pages.masters.createItem.eGDisplayReplacement')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('pages.masters.createItem.itemCode')}</Label>
                  <Input
                    value={draft.itemCode}
                    onChange={(e) => set('itemCode', e.target.value)}
                    placeholder={suggestedCode}
                    disabled={isEdit && existing?.isSystem}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isEdit && existing?.isSystem
                      ? t('pages.masters.createItem.aSeededItemSCodeIsFixed')
                      : t('shared.uniqueIdentifierAutoGeneratedFromName')}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {t('common.type')} <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={draft.type}
                    onValueChange={(v) => {
                      if (!v) return
                      const type = v as ItemType
                      // Defaults that only make sense per type, applied on the switch rather than
                      // silently at save: a service is not stocked and is not purchased.
                      setDraft((prev) => ({
                        ...prev,
                        type,
                        stockTracked: type !== 'service',
                        lob: {
                          ...prev.lob,
                          purchase: { ...prev.lob.purchase, isActive: type !== 'service' },
                        },
                      }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">{t('shared.service')}</SelectItem>
                      <SelectItem value="part">{t('common.part')}</SelectItem>
                      <SelectItem value="product">
                        {t('pages.masters.itemMaster.product')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('pages.masters.itemMaster.nature')}</Label>
                  <Input
                    value={
                      isService
                        ? t('pages.masters.createItem.natureService')
                        : t('pages.masters.createItem.natureGoods')
                    }
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('pages.masters.createItem.followsTheTypeAbove')}
                  </p>
                </div>
                <div>
                  <div className="space-y-1.5">
                    <Label>{t('common.description')}</Label>
                    <Textarea
                      value={draft.description}
                      onChange={(e) => set('description', e.target.value)}
                      rows={2}
                      placeholder={t('shared.optionalNotes')}
                    />
                  </div>
                </div>
              </div>
            </FormSection>
            <FormSection
              flat
              icon={FolderTree}
              title={t('pages.masters.createItem.sections.classification')}
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t('common.category')}</Label>
                  <Select
                    value={draft.categoryId}
                    onValueChange={(v) => {
                      if (!v) return
                      // Clearing the sub-category matters: keeping one that belongs to a different
                      // parent is exactly the kind of orphan the reference data already has.
                      setDraft((prev) => ({ ...prev, categoryId: v, subCategoryId: NONE }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                      {rootCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('pages.masters.createItem.subCategory')}</Label>
                  <Select
                    value={draft.subCategoryId}
                    onValueChange={(v) => v && set('subCategoryId', v)}
                    disabled={!subCategories.length}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>{t('common.none')}</SelectItem>
                      {subCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!subCategories.length && (
                    <p className="text-xs text-muted-foreground">
                      {t('pages.masters.createItem.thisCategoryHasNoSubCategories')}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>
            <FormSection flat icon={Ruler} title={t('pages.masters.createItem.sections.units')}>
              <div className="space-y-4">
                {(
                  [
                    ['primaryUomId', t('pages.masters.itemMaster.primaryUom')],
                    ['purchaseUomId', t('pages.masters.createItem.purchaseUom')],
                    ['salesUomId', t('pages.masters.createItem.salesUom')],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Select value={draft[key]} onValueChange={(v) => v && set(key, v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>
                          {key === 'primaryUomId'
                            ? `${DEFAULT_UOM.name} (${DEFAULT_UOM.symbol})`
                            : t('pages.masters.createItem.sameAsPrimary')}
                        </SelectItem>
                        {uoms.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.symbol ?? u.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </FormSection>
            <FormSection
              flat
              icon={Shuffle}
              title={t('pages.masters.createItem.sections.variants')}
            >
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.hasVariants}
                    onCheckedChange={(v) => set('hasVariants', v === true)}
                  />
                  {t('pages.masters.createItem.thisItemHasVariants')}
                </label>
                {draft.hasVariants && (
                  <div className="space-y-1.5">
                    <Label>{t('pages.masters.createItem.variantAttributes')}</Label>
                    {/* Chosen from Masters > Attributes rather than typed. Typing them is what made
                     * "Colour", "colour" and "Color" three different attributes, which is the whole
                     * reason that master exists. Still stored as names, so no existing item needs
                     * migrating. */}
                    <MultiSelectPopover
                      options={variantAttributeOptions}
                      selectedIds={selectedVariantAttributes}
                      onChange={(ids) => set('variantAttributes', ids.join(', '))}
                      placeholder={t('pages.masters.createItem.chooseVariantAttributes')}
                    />
                    {itemAttributes.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('pages.masters.createItem.defineAttributesFirst')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </FormSection>
          </div>

          <div className="space-y-6">
            <FormSection
              flat
              icon={IndianRupee}
              title={t('pages.masters.createItem.sections.pricing')}
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t('pages.masters.createItem.taxCategory')}</Label>
                  <Select
                    value={draft.taxCategory}
                    onValueChange={(v) => v && set('taxCategory', v as TaxCategory)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('common.rate')}</Label>
                  <Input value={`${taxPercentOf(draft.taxCategory)}%`} disabled />
                  <p className="text-xs text-muted-foreground">
                    {t('pages.masters.createItem.comesFromTheTaxCategory')}
                  </p>
                </div>
                {(
                  [
                    ['cgst', t('pages.masters.createItem.cgstPercent')],
                    ['sgst', t('pages.masters.createItem.sgstPercent')],
                    ['igst', t('pages.masters.createItem.igstPercent')],
                    ['cess', t('pages.masters.createItem.cessPercent')],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={String(draft.gstRates[key])}
                      onChange={(e) => setGst(key, e.target.value)}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label>{t('common.sellingPrice')}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draft.sellingPrice}
                    onChange={(e) => set('sellingPrice', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('common.purchasePrice')}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draft.purchasePrice}
                    onChange={(e) => set('purchasePrice', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('pages.masters.itemMaster.mrp')}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draft.mrp}
                    onChange={(e) => set('mrp', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </FormSection>
            <FormSection flat icon={Boxes} title={t('pages.masters.createItem.sections.inventory')}>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.stockTracked}
                    onCheckedChange={(v) => set('stockTracked', v === true)}
                  />
                  {t('pages.masters.itemMaster.stockTracked')}
                </label>

                {/* The rest of this section is meaningless for something not held in stock, and a
                 * reorder level on a service is a number nobody can act on. */}
                {draft.stockTracked && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>{t('pages.masters.createItem.trackingType')}</Label>
                      <Select
                        value={draft.trackingType}
                        onValueChange={(v) => v && set('trackingType', v as TrackingType)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRACKING_TYPES.map((tt) => (
                            <SelectItem key={tt.value} value={tt.value}>
                              {tt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t('pages.masters.createItem.shelfLifeDays')}</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={draft.shelfLifeDays}
                        onChange={(e) => set('shelfLifeDays', e.target.value)}
                        placeholder={t('common.none')}
                      />
                    </div>
                    {(
                      [
                        ['minStock', t('pages.masters.createItem.minStock')],
                        ['reorderPoint', t('pages.masters.createItem.reorderPoint')],
                        ['reorderQty', t('pages.masters.createItem.reorderQty')],
                        ['maxStock', t('pages.masters.createItem.maxStock')],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <Label>{label}</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={String(draft.reorder[key])}
                          onChange={(e) => setReorder(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormSection>
            {itemAttributes.length > 0 && (
              <FormSection
                flat
                icon={Tags}
                title={t('pages.masters.createItem.sections.attributes')}
                description={t('pages.masters.createItem.attributesDescription')}
              >
                <AttributeFields
                  attributes={itemAttributes}
                  values={attributeDraft}
                  onChange={(code, value) =>
                    setDraft((prev) => ({
                      ...prev,
                      attributes: { ...prev.attributes, [code]: value },
                    }))
                  }
                  missing={missingAttributes}
                />
              </FormSection>
            )}
            <FormSection flat icon={Puzzle} title={t('pages.masters.createItem.sections.lob')}>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.lob.sales.isActive}
                    onCheckedChange={(v) => setLob('sales', { isActive: v === true })}
                  />
                  {t('pages.masters.itemMaster.sales')}
                </label>
                {draft.lob.sales.isActive && (
                  <div className="space-y-4 pl-6">
                    <label className="flex items-center gap-2 self-end pb-2 text-sm">
                      <Checkbox
                        checked={draft.lob.sales.allowDiscount}
                        onCheckedChange={(v) => setLob('sales', { allowDiscount: v === true })}
                      />
                      {t('pages.masters.createItem.allowDiscount')}
                    </label>
                    <div className="space-y-1.5">
                      <Label>{t('pages.masters.createItem.maxDiscount')}</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={String(draft.lob.sales.maxDiscountPercent)}
                        onChange={(e) =>
                          setLob('sales', { maxDiscountPercent: numOr0(e.target.value) })
                        }
                        disabled={!draft.lob.sales.allowDiscount}
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.lob.purchase.isActive}
                    onCheckedChange={(v) => setLob('purchase', { isActive: v === true })}
                  />
                  {t('pages.masters.itemMaster.purchase')}
                </label>
                {draft.lob.purchase.isActive && (
                  <div className="space-y-4 pl-6">
                    <div className="space-y-1.5">
                      <Label>{t('pages.masters.createItem.leadTimeDays')}</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={String(draft.lob.purchase.leadTimeDays)}
                        onChange={(e) =>
                          setLob('purchase', { leadTimeDays: numOr0(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.lob.production.isActive}
                    onCheckedChange={(v) => setLob('production', { isActive: v === true })}
                  />
                  {t('pages.masters.itemMaster.production')}
                </label>
                {draft.lob.production.isActive && (
                  <label className="flex items-center gap-2 pl-6 text-sm">
                    <Checkbox
                      checked={draft.lob.production.isBomItem}
                      onCheckedChange={(v) => setLob('production', { isBomItem: v === true })}
                    />
                    {t('pages.masters.createItem.bomItem')}
                  </label>
                )}

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.lob.servicePos.isActive}
                    onCheckedChange={(v) => setLob('servicePos', { isActive: v === true })}
                  />
                  {t('pages.masters.itemMaster.servicePos')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.lob.ecommerce.isActive}
                    onCheckedChange={(v) => setLob('ecommerce', { isActive: v === true })}
                  />
                  {t('pages.masters.createItem.ecommerce')}
                </label>
              </div>
            </FormSection>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => (asModal ? onCancel?.() : navigate(-1))}
          disabled={submitting}
        >
          {t('common.cancel')}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? t('common.saving')
            : isEdit
              ? t('shared.saveChanges')
              : t('pages.masters.createItem.createItem')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingClear}
        onOpenChange={setConfirmingClear}
        title={t('pages.service.createJobCard.clearDraft')}
        message={t('pages.masters.createItem.thisDiscardsWhatYouHaveTyped')}
        confirmLabel={t('common.discard')}
        onConfirm={() => {
          window.localStorage.removeItem(DRAFT_KEY)
          setDraft(emptyDraft())
          setSavedAt(null)
          setConfirmingClear(false)
        }}
      />
    </div>
  )

  if (!asModal) return body

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent
        className={
          'inset-0 top-0 left-0 h-full max-h-none max-w-full translate-x-0 translate-y-0 overflow-y-auto rounded-none ' +
          'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl'
        }
      >
        {body}
      </DialogContent>
    </Dialog>
  )
}
