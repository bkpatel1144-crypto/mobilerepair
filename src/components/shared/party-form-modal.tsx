import { useState } from 'react'
import { FormModal } from '@/components/shared/form-modal'
import { AttributeFields } from '@/components/shared/attribute-fields'
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
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useItemAttributes } from '@/hooks/use-item-attributes'
import {
  attributesFor,
  attributeValuesToDraft,
  cleanAttributeValues,
  missingMandatoryAttributes,
  type AttributeValues,
} from '@/lib/attribute-values'
import {
  useCreateParty,
  useUpdateParty,
  type PartyWithId,
  type CreatePartyInput,
} from '@/hooks/use-parties'
import { usePartyCategories } from '@/hooks/use-party-categories'
import { useTranslation } from 'react-i18next'

/**
 * The real Add/Edit Party form, as a modal any picker can open.
 *
 * Every customer and supplier dropdown in the app used to create a party from a single typed
 * name — no mobile number, no category, no GST. The client put it plainly: choosing "add" in a
 * dropdown should open the form that Masters > Parties opens, fill it in properly, and then
 * select what was created. A party with only a name is not a party a repair shop can invoice,
 * call, or look up later.
 *
 * So the form lives here rather than inside the Parties page, and the page uses it like everyone
 * else. `defaultName` carries across what was already typed into the dropdown, and
 * `defaultPartyTypes` means a supplier picker opens a supplier form rather than a customer one.
 */
export function PartyFormModal({
  editing,
  defaultName,
  defaultPartyTypes,
  onClose,
  onSaved,
}: {
  /** An existing party to edit, or `'new'`. */
  editing: PartyWithId | 'new'
  /** Prefills the name — what was typed into the dropdown before pressing Add. */
  defaultName?: string
  /** Which boxes to tick when creating. A supplier picker should not open a customer form. */
  defaultPartyTypes?: ('customer' | 'supplier')[]
  onClose: () => void
  /** The saved party, so the picker that opened this can select it. */
  onSaved?: (party: PartyWithId) => void
}) {
  const { t } = useTranslation()
  // Categories are loaded here rather than passed in: this opens from a dozen screens now, and
  // every one of them would otherwise have to fetch a master it does not otherwise care about.
  const { data: categories } = usePartyCategories()
  const isNew = editing === 'new'
  const createParty = useCreateParty()
  const updateParty = useUpdateParty()

  const [name, setName] = useState(isNew ? (defaultName ?? '') : editing.name)
  const [mobile, setMobile] = useState(isNew ? '' : editing.mobile)
  const [categoryId, setCategoryId] = useState(isNew ? 'none' : (editing.categoryId ?? 'none'))
  const [isCustomer, setIsCustomer] = useState(
    isNew
      ? (defaultPartyTypes ?? ['customer']).includes('customer')
      : editing.partyTypes.includes('customer')
  )
  const [isSupplier, setIsSupplier] = useState(
    isNew
      ? (defaultPartyTypes ?? ['customer']).includes('supplier')
      : editing.partyTypes.includes('supplier')
  )
  const [showExtra, setShowExtra] = useState(!isNew)
  const [address, setAddress] = useState(isNew ? '' : (editing.address ?? ''))
  const [email, setEmail] = useState(isNew ? '' : (editing.email ?? ''))
  const [gstNumber, setGstNumber] = useState(isNew ? '' : (editing.gstNumber ?? ''))
  const [panNumber, setPanNumber] = useState(isNew ? '' : (editing.panNumber ?? ''))
  const [area, setArea] = useState(isNew ? '' : (editing.area ?? ''))
  const [village, setVillage] = useState(isNew ? '' : (editing.village ?? ''))
  const [taluka, setTaluka] = useState(isNew ? '' : (editing.taluka ?? ''))
  const [district, setDistrict] = useState(isNew ? '' : (editing.district ?? ''))
  const [pincode, setPincode] = useState(isNew ? '' : (editing.pincode ?? ''))

  // Custom fields from Masters > Attributes with `appliesTo: 'party'`.
  const { data: allAttributes = [] } = useItemAttributes()
  const partyAttributes = attributesFor(allAttributes, 'party')
  const [attributes, setAttributes] = useState<AttributeValues>(
    isNew ? {} : (editing.attributes ?? {})
  )
  const [missingAttributes, setMissingAttributes] = useState<string[]>([])
  const attributeDraft = attributeValuesToDraft(partyAttributes, attributes)

  const isPending = createParty.isPending || updateParty.isPending
  const category = (categories ?? []).find((c) => c.id === categoryId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !mobile.trim()) return
    const missing = missingMandatoryAttributes(partyAttributes, attributeDraft)
    setMissingAttributes(missing)
    if (missing.length > 0) return
    const partyTypes: ('customer' | 'supplier')[] = [
      ...(isCustomer ? (['customer'] as const) : []),
      ...(isSupplier ? (['supplier'] as const) : []),
    ]
    const input: CreatePartyInput = {
      name: name.trim(),
      mobile: mobile.trim(),
      partyTypes: partyTypes.length ? partyTypes : ['customer'],
      categoryId: categoryId === 'none' ? null : categoryId,
      categoryName: category?.name ?? null,
      address: address.trim() || null,
      email: email.trim() || null,
      gstNumber: gstNumber.trim() || null,
      panNumber: panNumber.trim() || null,
      area: area.trim() || null,
      village: village.trim() || null,
      taluka: taluka.trim() || null,
      district: district.trim() || null,
      pincode: pincode.trim() || null,
      creditLimit: isNew ? 0 : editing.creditLimit,
      creditDays: category?.defaultCreditDays ?? (isNew ? 0 : editing.creditDays),
      attributes: cleanAttributeValues(partyAttributes, attributeDraft),
    }
    if (isNew) {
      const created = await createParty.mutateAsync(input)
      onSaved?.(created as PartyWithId)
    } else {
      await updateParty.mutateAsync({ ...input, id: editing.id })
      onSaved?.({ ...editing, ...input } as PartyWithId)
    }
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? 'Create Party' : t('pages.masters.parties.editParty')}
      onSubmit={handleSubmit}
      submitLabel={isNew ? 'Create Party' : t('common.save')}
      isSubmitting={isPending}
      className="sm:max-w-xl"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t('pages.masters.parties.partyName')}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('pages.masters.parties.mobile')}</Label>
          <Input
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={t('pages.masters.parties.10DigitMobileNumber')}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t('common.category')}</Label>
          <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('pages.masters.parties.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('common.none')}</SelectItem>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('pages.masters.parties.partyType')}</Label>
          <div className="flex h-8 items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <Checkbox checked={isCustomer} onCheckedChange={(v) => setIsCustomer(v === true)} />
              {t('common.customer')}
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox checked={isSupplier} onCheckedChange={(v) => setIsSupplier(v === true)} />
              {t('common.supplier')}
            </label>
          </div>
        </div>
      </div>

      {partyAttributes.length > 0 && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">{t('pages.masters.createItem.sections.attributes')}</p>
          <AttributeFields
            attributes={partyAttributes}
            values={attributeDraft}
            onChange={(code, value) => setAttributes((prev) => ({ ...prev, [code]: value }))}
            missing={missingAttributes}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowExtra((v) => !v)}
        className="flex items-center gap-1 text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        {showExtra ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        {showExtra ? 'Hide extra details' : t('pages.masters.parties.allOptionalAddWhatYouNeed')}
      </button>

      {showExtra && (
        <div className="space-y-3 rounded-md border border-dashed p-3">
          <div className="space-y-1.5">
            <Label>{t('common.address')}</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('pages.masters.parties.shopHouseAreaCityPincode')}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('common.email')}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('pages.masters.parties.gstNumber2')}</Label>
              <Input
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder={t('pages.masters.parties.27abcde1234f1z5')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('pages.masters.parties.panNumber2')}</Label>
              <Input
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder={t('pages.masters.parties.abcde1234f')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>{t('pages.masters.parties.area')}</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder={t('pages.masters.parties.localityArea')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('pages.masters.parties.village')}</Label>
              <Input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder={t('pages.masters.parties.village')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('pages.masters.parties.taluka')}</Label>
              <Input
                value={taluka}
                onChange={(e) => setTaluka(e.target.value)}
                placeholder={t('pages.masters.parties.taluka')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('pages.masters.parties.district')}</Label>
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t('pages.masters.parties.district')}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t('common.pincode')}</Label>
            <Input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('pages.masters.parties.6DigitPin')}
            />
          </div>
        </div>
      )}
    </FormModal>
  )
}
