import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, X, UserPlus, Plus, ScanLine, UserX, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormError } from '@/components/shared/form-error'
import { SearchSelect } from '@/components/shared/search-select'
import { MultiSelectPopover } from '@/components/shared/multi-select-popover'
import { RouteFallback } from '@/components/shared/route-fallback'
import { PatternLockPicker, PatternLockPreview, PatternReplayPopover } from '@/components/shared/pattern-lock'
import { ScanTextModal } from '@/components/shared/scan-text-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useBreadcrumbExtra } from '@/contexts/breadcrumb-context'
import { useAuth } from '@/hooks/use-auth'
import { useParties, useCreateParty } from '@/hooks/use-parties'
import { useItems, useCreateItem, nextItemCode } from '@/hooks/use-items'
import { useAllServiceOptions, useCreateServiceOption } from '@/hooks/use-service-options'
import { useUsers } from '@/hooks/use-users'
import { useCreateJobCard } from '@/hooks/use-job-cards'
import { useFormSchema, blankFormSchema } from '@/hooks/use-form-schema'
import { uploadJobCardImage } from '@/lib/job-card-images'
import { getInitials } from '@/lib/utils'
import { deviceTypeIcon } from '@/config/service-options'
import { buildPath } from '@/config/nav'

const ADVANCE_QUICK_AMOUNTS = [0, 100, 200, 500, 1000]
const COST_QUICK_AMOUNTS = [200, 500, 1000, 1500, 2000, 3000, 5000]

const DRAFT_KEY = 'aim-create-job-card-draft'

/** Everything worth restoring after an accidental navigation away or a reload — a lightweight
 * per-viewer convenience (same pattern, and the same "Draft saved at TIME / Clear Draft" UI, as
 * `create-user-page.tsx`'s own draft), not a synced/shared draft. Pending image `File`s aren't
 * serializable and are deliberately left out — an honest limitation, same as any browser draft. */
interface JobCardDraft {
  customerId: string | null
  alternativeMobile: string
  deviceTypeId: string | undefined
  brandId: string | null
  model: string
  imei: string
  imei2: string
  serialNo: string
  devicePinPattern: string
  pinIsPattern: boolean
  problemIds: string[]
  serviceItemsSelected: { itemId: string; itemName: string; price: number }[]
  estimatedCost: number
  advanceReceived: number
  itemsReceived: string[]
  itemsReturned: string[]
  assignedToId: string | null
  remark: string
}

function readDraft(): Partial<JobCardDraft> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * The real, functional Create Job Card form — reads `formSchemas/jobCard` (Phase 4) for which
 * non-locked fields are currently visible/required, same as the Workflow Designer's own
 * live-preview pane, so a field toggled off there actually disappears here too. Structurally
 * locked fields (Customer, Device Type, Problems, Received By) always render — see
 * `job-card-form-fields.ts`.
 */
export function CreateJobCardPage() {
  useBreadcrumbExtra('Create')
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { data: schema, isLoading: schemaLoading } = useFormSchema('jobCard')
  const { data: parties = [] } = useParties()
  const { data: items = [] } = useItems()
  const { data: options, isLoading: optionsLoading } = useAllServiceOptions()
  const { data: users = [] } = useUsers()
  const createParty = useCreateParty()
  const createItem = useCreateItem()
  const createServiceOption = useCreateServiceOption('problems')
  const createCustomerItem = useCreateServiceOption('customerItems')
  const createBrand = useCreateServiceOption('brands')
  const createModel = useCreateServiceOption('models')
  const createJobCard = useCreateJobCard()

  // Controlled open-state for the pickers that also get an adjacent "+" icon button — matches
  // `preview (9)`/`(10)`'s separate search-box-plus-square-button chrome, without duplicating
  // each picker's own add-new logic: the external button just opens the same popover.
  const [deviceTypeOpen, setDeviceTypeOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [problemsOpen, setProblemsOpen] = useState(false)
  const [serviceItemsOpen, setServiceItemsOpen] = useState(false)
  const [itemsReceivedOpen, setItemsReceivedOpen] = useState(false)
  const [itemsReturnedOpen, setItemsReturnedOpen] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [draft] = useState<Partial<JobCardDraft>>(readDraft)

  const [customerId, setCustomerId] = useState<string | null>(draft.customerId ?? null)
  const [quickAddCustomer, setQuickAddCustomer] = useState<{ name: string; mobile: string } | null>(null)
  const [alternativeMobile, setAlternativeMobile] = useState(draft.alternativeMobile ?? '')

  const [deviceTypeId, setDeviceTypeId] = useState<string | undefined>(draft.deviceTypeId)
  const [brandId, setBrandId] = useState<string | null>(draft.brandId ?? null)
  const [model, setModel] = useState(draft.model ?? '')
  const [imei, setImei] = useState(draft.imei ?? '')
  const [imei2, setImei2] = useState(draft.imei2 ?? '')
  const [serialNo, setSerialNo] = useState(draft.serialNo ?? '')
  const [devicePinPattern, setDevicePinPattern] = useState(draft.devicePinPattern ?? '')
  const [pinIsPattern, setPinIsPattern] = useState(draft.pinIsPattern ?? false)
  const [scanningField, setScanningField] = useState<'imei' | 'serialNo' | null>(null)

  const [problemIds, setProblemIds] = useState<string[]>(draft.problemIds ?? [])
  const [serviceItemsSelected, setServiceItemsSelected] = useState<{ itemId: string; itemName: string; price: number }[]>(
    draft.serviceItemsSelected ?? []
  )
  const [estimatedCost, setEstimatedCost] = useState(draft.estimatedCost ?? 0)
  const [advanceReceived, setAdvanceReceived] = useState(draft.advanceReceived ?? 0)
  const [itemsReceived, setItemsReceived] = useState<string[]>(draft.itemsReceived ?? [])
  const [itemsReturned, setItemsReturned] = useState<string[]>(draft.itemsReturned ?? [])
  const [assignedToId, setAssignedToId] = useState<string | null>(draft.assignedToId ?? null)
  const [remark, setRemark] = useState(draft.remark ?? '')
  const [pendingImages, setPendingImages] = useState<File[]>([])

  // Autosave the draft to localStorage — same lightweight per-viewer convenience, and the same
  // "Draft saved at TIME" UI, as `create-user-page.tsx`'s own draft. Debounced so it isn't
  // writing on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const toSave: JobCardDraft = {
        customerId,
        alternativeMobile,
        deviceTypeId,
        brandId,
        model,
        imei,
        imei2,
        serialNo,
        devicePinPattern,
        pinIsPattern,
        problemIds,
        serviceItemsSelected,
        estimatedCost,
        advanceReceived,
        itemsReceived,
        itemsReturned,
        assignedToId,
        remark,
      }
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(toSave))
        setSavedAt(new Date())
      } catch {
        // Storage can throw in a private window with site data blocked — draft simply won't
        // persist across a reload in that case, which is an acceptable degradation.
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [
    customerId,
    alternativeMobile,
    deviceTypeId,
    brandId,
    model,
    imei,
    imei2,
    serialNo,
    devicePinPattern,
    pinIsPattern,
    problemIds,
    serviceItemsSelected,
    estimatedCost,
    advanceReceived,
    itemsReceived,
    itemsReturned,
    assignedToId,
    remark,
  ])

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
    setSavedAt(null)
    setCustomerId(null)
    setAlternativeMobile('')
    setDeviceTypeId(undefined)
    setBrandId(null)
    setModel('')
    setImei('')
    setImei2('')
    setSerialNo('')
    setDevicePinPattern('')
    setPinIsPattern(false)
    setProblemIds([])
    setServiceItemsSelected([])
    setEstimatedCost(0)
    setAdvanceReceived(0)
    setItemsReceived([])
    setItemsReturned([])
    setAssignedToId(null)
    setRemark('')
  }

  if (schemaLoading || optionsLoading) return <RouteFallback />

  // A company that has never saved a Job Card Form config yet has no `formSchemas/jobCard` doc
  // at all — falling back to `{}` here (rather than the same `blankFormSchema` the Workflow
  // Designer's own builder uses as its baseline) silently ignored every field's declared
  // `defaultVisible`/`defaultRequired` from `job-card-form-fields.ts`, showing every optional
  // field regardless and never marking Brand/Model required by default.
  const fields = schema?.fields ?? blankFormSchema('jobCard').fields
  const isVisible = (key: string) => fields[key]?.visible !== false
  const isRequired = (key: string) => fields[key]?.required === true

  const serviceItemOptions = items.filter((i) => i.type === 'service')
  const brandsForDeviceType = deviceTypeId
    ? options.brands.filter((b) => b.deviceTypeIds?.includes(deviceTypeId))
    : []
  const modelsForBrand = brandId ? options.models.filter((m) => m.brandId === brandId) : []
  // `model` itself is stored as plain text (matches `JobCardDoc.model: string | null`) — this
  // just resolves which catalog entry (if any) it currently matches, so the picker can show it
  // selected/checked the same way Brand does.
  const selectedModelOption = modelsForBrand.find((m) => m.label === model)

  async function handleSubmit() {
    setFormError(null)

    let finalCustomerId = customerId
    let finalCustomerName: string
    let finalCustomerMobile: string

    if (!finalCustomerId && quickAddCustomer) {
      if (!quickAddCustomer.name.trim() || !/^\d{10}$/.test(quickAddCustomer.mobile)) {
        setFormError('Enter the new customer\'s name and a valid 10-digit mobile number.')
        return
      }
    } else if (!finalCustomerId) {
      setFormError('Select or add a customer.')
      return
    }
    if (isVisible('deviceType') && !deviceTypeId) {
      setFormError('Select a device type.')
      return
    }
    if (problemIds.length === 0) {
      setFormError('Select at least one problem.')
      return
    }
    if (isVisible('brand') && isRequired('brand') && !brandId) {
      setFormError('Select a brand.')
      return
    }
    if (isVisible('model') && isRequired('model') && !model.trim()) {
      setFormError('Enter the model.')
      return
    }

    setSubmitting(true)
    try {
      if (!finalCustomerId && quickAddCustomer) {
        const created = await createParty.mutateAsync({ name: quickAddCustomer.name, mobile: quickAddCustomer.mobile })
        finalCustomerId = created.id
        finalCustomerName = created.name
        finalCustomerMobile = created.mobile
      } else {
        const party = parties.find((p) => p.id === finalCustomerId)!
        finalCustomerName = party.name
        finalCustomerMobile = party.mobile
      }

      const deviceType = options.deviceTypes.find((d) => d.id === deviceTypeId)
      const brand = options.brands.find((b) => b.id === brandId)
      const assignedUser = users.find((u) => u.id === assignedToId)

      const tempJobId = crypto.randomUUID()
      const imageUrls: string[] = []
      for (const file of pendingImages) {
        imageUrls.push(await uploadJobCardImage(profile!.companyId, tempJobId, file))
      }

      const result = await createJobCard.mutateAsync({
        branchId: profile!.branchId,
        customerId: finalCustomerId!,
        customerName: finalCustomerName,
        customerMobile: finalCustomerMobile,
        alternativeMobile: alternativeMobile || null,
        deviceTypeId: deviceTypeId ?? null,
        deviceTypeName: deviceType?.label ?? null,
        brandId: brandId ?? null,
        brandName: brand?.label ?? null,
        model: model || null,
        imei: imei || null,
        imei2: imei2 || null,
        serialNo: serialNo || null,
        devicePinPattern: devicePinPattern || null,
        problemIds,
        problemLabels: options.problems.filter((p) => problemIds.includes(p.id)).map((p) => p.label),
        remark: remark || null,
        serviceItems: serviceItemsSelected,
        estimatedCost,
        advanceReceived,
        itemsReceived: options.customerItems.filter((c) => itemsReceived.includes(c.id)).map((c) => c.label),
        itemsReturned: options.customerItems.filter((c) => itemsReturned.includes(c.id)).map((c) => c.label),
        assignedToId: assignedToId ?? null,
        assignedToName: assignedUser?.fullName ?? null,
        imageUrls,
      })

      localStorage.removeItem(DRAFT_KEY)
      navigate(buildPath('service', 'job-cards') + `/${result.id}`)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the job card. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Create Job Card</h1>
          <p className="text-sm text-muted-foreground">
            Create a new service job card for customer device repair and tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <Clock className="size-3.5" />
              Draft saved at{' '}
              {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {savedAt && (
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingClear(true)}>
              <Trash2 className="size-3.5" />
              Clear Draft
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft />
            Back
          </Button>
        </div>
      </div>

      <FormError message={formError} />

      <div className="rounded-lg border bg-card p-4 sm:p-6">
      <div className="grid gap-x-4 gap-y-4 lg:grid-cols-2">
        {/* LEFT COLUMN — Customer / Device / Repair info (job-card-form-fields.ts sections
         * `customerInformation` + `deviceInformation` + `repairInformation`). Its own
         * independent vertical stack, not row-paired with the right column — matches the
         * reference exactly: the left column simply ends after Service Items, with the right
         * column continuing further down on its own. */}
        <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>
            Customer <span className="text-red-600">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchSelect
                options={parties.map((p) => ({ id: p.id, label: p.name, helper: p.mobile }))}
                value={customerId}
                onChange={(id) => {
                  setCustomerId(id)
                  if (id) setQuickAddCustomer(null)
                }}
                placeholder="Search customer by name or mobile..."
                onCreateNew={(query) => setQuickAddCustomer({ name: query, mobile: '' })}
                open={customerOpen}
                onOpenChange={setCustomerOpen}
              />
            </div>
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setCustomerOpen(true)}>
              <UserPlus className="size-4" />
            </Button>
          </div>
          {quickAddCustomer && !customerId && (
            <div className="flex gap-2 rounded-md border border-dashed p-2">
              <Input
                value={quickAddCustomer.name}
                onChange={(e) => setQuickAddCustomer({ ...quickAddCustomer, name: e.target.value })}
                placeholder="Customer name"
                className="h-8 text-sm"
              />
              <Input
                value={quickAddCustomer.mobile}
                onChange={(e) => setQuickAddCustomer({ ...quickAddCustomer, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit mobile"
                className="h-8 text-sm"
              />
              <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setQuickAddCustomer(null)}>
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {isVisible('alternativeMobile') && (
          <div className="space-y-1.5">
            <Label>
              Alternative Mobile <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              value={alternativeMobile}
              onChange={(e) => setAlternativeMobile(e.target.value)}
              placeholder="Alternate number (optional)"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4">
          <div className="space-y-1.5">
            <Label>
              Device Type <span className="text-red-600">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchSelect
                  options={options.deviceTypes.map((dt) => ({ id: dt.id, label: dt.label, icon: deviceTypeIcon(dt.label) }))}
                  value={deviceTypeId ?? null}
                  onChange={(id) => {
                    setDeviceTypeId(id ?? undefined)
                    setBrandId(null)
                  }}
                  placeholder="Search device type..."
                  open={deviceTypeOpen}
                  onOpenChange={setDeviceTypeOpen}
                />
              </div>
              <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setDeviceTypeOpen(true)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {isVisible('brand') && (
            <div className="space-y-1.5">
              <Label>
                Brand{' '}
                {isRequired('brand') ? (
                  <span className="text-red-600">*</span>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                )}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchSelect
                    options={brandsForDeviceType.map((b) => ({ id: b.id, label: b.label }))}
                    value={brandId}
                    onChange={(id) => {
                      setBrandId(id)
                      setModel('')
                    }}
                    placeholder={deviceTypeId ? 'Select brand...' : 'Pick a device type first'}
                    disabled={!deviceTypeId}
                    open={brandOpen}
                    onOpenChange={setBrandOpen}
                    onCreateNew={
                      deviceTypeId
                        ? (label) =>
                            createBrand.mutate(
                              { label, deviceTypeIds: [deviceTypeId], existingCount: options.brands.length },
                              { onSuccess: (id) => setBrandId(id) }
                            )
                        : undefined
                    }
                  />
                </div>
                <Button type="button" variant="outline" size="icon" className="shrink-0" disabled={!deviceTypeId} onClick={() => setBrandOpen(true)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4">
          {isVisible('model') && (
            <div className="space-y-1.5">
              <Label>
                Model{' '}
                {isRequired('model') ? (
                  <span className="text-red-600">*</span>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                )}
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchSelect
                    options={modelsForBrand.map((m) => ({ id: m.id, label: m.label }))}
                    value={selectedModelOption?.id ?? null}
                    onChange={(id) => {
                      const m = modelsForBrand.find((x) => x.id === id)
                      setModel(m?.label ?? '')
                    }}
                    placeholder={brandId ? 'Enter model name...' : 'Pick a brand first'}
                    disabled={!brandId}
                    open={modelOpen}
                    onOpenChange={setModelOpen}
                    onCreateNew={
                      brandId
                        ? (label) =>
                            createModel.mutate(
                              { label, brandId, existingCount: options.models.length },
                              { onSuccess: () => setModel(label) }
                            )
                        : undefined
                    }
                  />
                </div>
                <Button type="button" variant="outline" size="icon" className="shrink-0" disabled={!brandId} onClick={() => setModelOpen(true)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {isVisible('imei') && (
            <div className="space-y-1.5">
              <Label>
                IMEI <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              </Label>
              <div className="flex gap-2">
                <Input id="imei" value={imei} onChange={(e) => setImei(e.target.value)} placeholder="15-digit IMEI (optional)" className="flex-1" />
                <Button type="button" variant="outline" size="icon" className="shrink-0" title="Scan IMEI" onClick={() => setScanningField('imei')}>
                  <ScanLine className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {(isVisible('imei2') || isVisible('serialNo')) && (
          <div className="grid grid-cols-2 gap-x-4">
            {isVisible('imei2') && (
              <div className="space-y-1.5">
                <Label>
                  IMEI 2 <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </Label>
                <Input value={imei2} onChange={(e) => setImei2(e.target.value)} placeholder="Second IMEI (optional)" />
              </div>
            )}

            {isVisible('serialNo') && (
              <div className="space-y-1.5">
                <Label>
                  Serial No <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input id="serialNo" value={serialNo} onChange={(e) => setSerialNo(e.target.value)} placeholder="Serial number (optional)" className="flex-1" />
                  <Button type="button" variant="outline" size="icon" className="shrink-0" title="Scan Serial No" onClick={() => setScanningField('serialNo')}>
                    <ScanLine className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isVisible('devicePinPattern') && (
          <div className="space-y-1.5">
            <Label>
              Device PIN / Pattern <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <div className="flex gap-2">
              {pinIsPattern && devicePinPattern ? (
                <div className="flex h-8 flex-1 items-center gap-2 rounded-lg border bg-muted/30 px-2.5 text-sm">
                  <PatternReplayPopover value={devicePinPattern}>
                    <span className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline">
                      <PatternLockPreview value={devicePinPattern} />
                      Pattern drawn
                    </span>
                  </PatternReplayPopover>
                  <button
                    type="button"
                    className="ml-auto font-medium text-red-600 hover:underline dark:text-red-400"
                    onClick={() => {
                      setDevicePinPattern('')
                      setPinIsPattern(false)
                    }}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <Input
                  value={devicePinPattern}
                  onChange={(e) => {
                    setDevicePinPattern(e.target.value)
                    setPinIsPattern(false)
                  }}
                  placeholder="e.g. 1234 or tap Draw"
                  className="flex-1"
                />
              )}
              <PatternLockPicker
                value={pinIsPattern ? devicePinPattern : ''}
                onChange={(v) => {
                  setDevicePinPattern(v)
                  setPinIsPattern(!!v)
                }}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>
            Problems <span className="text-red-600">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <MultiSelectPopover
                options={options.problems.map((p) => ({ id: p.id, label: p.label }))}
                selectedIds={problemIds}
                onChange={setProblemIds}
                placeholder="Select problems..."
                open={problemsOpen}
                onOpenChange={setProblemsOpen}
                onCreateNew={(label) =>
                  createServiceOption.mutate(
                    { label, existingCount: options.problems.length },
                    { onSuccess: (id) => setProblemIds((prev) => [...prev, id]) }
                  )
                }
              />
            </div>
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setProblemsOpen(true)}>
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {isVisible('serviceItems') && (
          <div className="space-y-1.5">
            <Label>
              Service Items <span className="text-xs font-normal text-muted-foreground">(Optional — adds to estimated cost)</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchSelect
                  options={serviceItemOptions.map((i) => ({ id: i.id, label: i.name, helper: i.sellingPrice ? `₹${i.sellingPrice}` : undefined }))}
                  value={null}
                  onChange={(id) => {
                    const item = serviceItemOptions.find((i) => i.id === id)
                    if (!item) return
                    setServiceItemsSelected((prev) => [...prev, { itemId: item.id, itemName: item.name, price: item.sellingPrice ?? 0 }])
                    setEstimatedCost((prev) => prev + (item.sellingPrice ?? 0))
                  }}
                  placeholder="Add items from catalog"
                  open={serviceItemsOpen}
                  onOpenChange={setServiceItemsOpen}
                  onCreateNew={(name) =>
                    createItem.mutate(
                      { name, type: 'service', itemCode: nextItemCode(items, 'service') },
                      {
                        onSuccess: (item) =>
                          setServiceItemsSelected((prev) => [...prev, { itemId: item.id!, itemName: item.name, price: 0 }]),
                      }
                    )
                  }
                />
              </div>
              <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setServiceItemsOpen(true)}>
                <Plus className="size-4" />
              </Button>
            </div>
            {serviceItemsSelected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {serviceItemsSelected.map((si, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-2 text-xs">
                    {si.itemName} · ₹{si.price}
                    <button
                      type="button"
                      onClick={() => {
                        setServiceItemsSelected((prev) => prev.filter((_, idx) => idx !== i))
                        setEstimatedCost((prev) => Math.max(0, prev - si.price))
                      }}
                      className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        </div>

        {/* RIGHT COLUMN — Financial / Accessories / Internal details / Images (sections
         * `financial` + `accessories` + `internalDetails` + `images`). Independent stack, same
         * reasoning as the left column above. The vertical rule lives here as a plain
         * `border-left` (not the parent's `divide-x`, which applies its border via a
         * negative-margin trick meant for gap-less flex/block layouts — inside a CSS Grid that
         * already has its own `gap-x-8`, that negative margin pulled this column left into the
         * gap, visually overlapping the left column's own inputs/buttons). A grid's `gap` is
         * real empty space, so a plain border here — no margin compensation needed — sits
         * cleanly in the middle of it instead. */}
        <div className="space-y-4 lg:border-l lg:border-border lg:pl-6">
        {(isVisible('estimatedCost') || isVisible('advanceReceived')) && (
          <div className="grid grid-cols-2 gap-x-4">
            {isVisible('estimatedCost') && (
              <div className="space-y-1.5">
                <Label>
                  Estimated Cost <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </Label>
                <Input type="number" min={0} value={estimatedCost} onChange={(e) => setEstimatedCost(Number(e.target.value) || 0)} />
                <div className="flex flex-wrap gap-1">
                  {COST_QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setEstimatedCost(amt)}
                      className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isVisible('advanceReceived') && (
              <div className="space-y-1.5">
                <Label>
                  Advance Received <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </Label>
                <Input type="number" min={0} value={advanceReceived} onChange={(e) => setAdvanceReceived(Number(e.target.value) || 0)} />
                <div className="flex flex-wrap gap-1">
                  {ADVANCE_QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdvanceReceived(amt)}
                      className={
                        'rounded-full border px-2 py-0.5 text-xs ' +
                        (advanceReceived === amt
                          ? 'border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
                          : 'text-muted-foreground hover:bg-muted')
                      }
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isVisible('itemsReceived') && (
          <div className="space-y-1.5">
            <Label>
              Items received <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <MultiSelectPopover
                  options={options.customerItems.map((c) => ({ id: c.id, label: c.label }))}
                  selectedIds={itemsReceived}
                  onChange={setItemsReceived}
                  placeholder="Select items received with device..."
                  open={itemsReceivedOpen}
                  onOpenChange={setItemsReceivedOpen}
                  onCreateNew={(label) =>
                    createCustomerItem.mutate(
                      { label, existingCount: options.customerItems.length },
                      { onSuccess: (id) => setItemsReceived((prev) => [...prev, id]) }
                    )
                  }
                />
              </div>
              <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setItemsReceivedOpen(true)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {isVisible('itemsReturned') && (
          <div className="space-y-1.5">
            <Label>
              Items returned <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <MultiSelectPopover
                  options={options.customerItems.map((c) => ({ id: c.id, label: c.label }))}
                  selectedIds={itemsReturned}
                  onChange={setItemsReturned}
                  placeholder="Select items returned to customer..."
                  open={itemsReturnedOpen}
                  onOpenChange={setItemsReturnedOpen}
                  onCreateNew={(label) =>
                    createCustomerItem.mutate(
                      { label, existingCount: options.customerItems.length },
                      { onSuccess: (id) => setItemsReturned((prev) => [...prev, id]) }
                    )
                  }
                />
              </div>
              <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setItemsReturnedOpen(true)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4">
          <div className="space-y-1.5">
            <Label>
              Received By <span className="text-red-600">*</span>
            </Label>
            <SearchSelect
              options={
                profile
                  ? [{ id: user?.uid ?? 'me', label: profile.fullName, avatarLabel: getInitials(profile.fullName) }]
                  : []
              }
              value={profile ? (user?.uid ?? 'me') : null}
              onChange={() => {}}
              placeholder="—"
              disabled
            />
          </div>

          {isVisible('assignTo') && (
            <div className="space-y-1.5">
              <Label>
                Assign To <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              </Label>
              <SearchSelect
                options={[
                  { id: '__unassigned__', label: '— Not Assigned —', icon: UserX },
                  ...users.map((u) => ({
                    id: u.id,
                    label: u.fullName,
                    helper: u.roleName,
                    avatarLabel: getInitials(u.fullName),
                  })),
                ]}
                value={assignedToId ?? '__unassigned__'}
                onChange={(id) => setAssignedToId(id === '__unassigned__' || !id ? null : id)}
                placeholder="Search user..."
              />
            </div>
          )}
        </div>

        {isVisible('remark') && (
          <div className="space-y-1.5">
            <Label>
              Remark <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Any additional note about the device / job..." rows={3} />
          </div>
        )}

        {isVisible('images') && (
          <div className="space-y-1.5">
            <Label>Add Images</Label>
            <p className="text-xs text-muted-foreground">They will be uploaded when you create the job card.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed py-6 text-muted-foreground hover:bg-muted/40">
              <ImagePlus className="size-5" />
              <span className="text-sm">Add Images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setPendingImages((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
              />
            </label>
            {pendingImages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pendingImages.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-2 text-xs">
                    {f.name}
                    <button
                      type="button"
                      onClick={() => setPendingImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={submitting || !user}>
          {submitting ? 'Creating…' : 'Create Job Card'}
        </Button>
      </div>
      </div>

      <ScanTextModal
        open={scanningField != null}
        onOpenChange={(open) => !open && setScanningField(null)}
        title={scanningField === 'imei' ? 'Scan IMEI' : 'Scan Serial No'}
        description="Point the camera at the barcode or QR on the device or its box"
        onScanned={(text) => {
          if (scanningField === 'imei') setImei(text)
          else if (scanningField === 'serialNo') setSerialNo(text)
        }}
      />

      <ConfirmDialog
        open={confirmingClear}
        onOpenChange={setConfirmingClear}
        title="Clear this draft?"
        message="Every field you've filled in so far will be wiped, including the autosaved copy. This cannot be undone."
        confirmLabel="Clear Draft"
        onConfirm={() => {
          clearDraft()
          setConfirmingClear(false)
        }}
      />
    </div>
  )
}
