import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, X, ScanLine, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormError } from '@/components/shared/form-error'
import { SearchSelect } from '@/components/shared/search-select'
import { PatternLockPicker, PatternLockPreview } from '@/components/shared/pattern-lock'
import { ScanTextModal } from '@/components/shared/scan-text-modal'
import { useBreadcrumbExtra } from '@/contexts/breadcrumb-context'
import { useAuth } from '@/hooks/use-auth'
import { useParties, useCreateParty } from '@/hooks/use-parties'
import { useUsers } from '@/hooks/use-users'
import { useAllServiceOptions, useCreateServiceOption } from '@/hooks/use-service-options'
import { useCreateSecondHandPurchase } from '@/hooks/use-second-hand-purchases'
import { uploadSecondHandDeviceImage } from '@/lib/second-hand-device-images'
import { deviceTypeIcon } from '@/config/service-options'
import { buildPath } from '@/config/nav'
import type { AccountLockStatus, ConditionGrade } from '@/types/firestore'

const NETWORK_OPTIONS = ['—', '2G', '3G', '4G', '5G', 'WiFi Only']
const ACCESSORIES_OPTIONS = ['—', 'Charger only', 'Charger, box, cable', 'Charger, box, cable, earphones', 'Box only']

export function CreateSecondHandPurchasePage() {
  useBreadcrumbExtra('Create')
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { data: parties = [] } = useParties()
  const { data: users = [] } = useUsers()
  const { data: options, isLoading: optionsLoading } = useAllServiceOptions()
  const createParty = useCreateParty()
  const createBrand = useCreateServiceOption('brands')
  const createModel = useCreateServiceOption('models')
  const createPurchase = useCreateSecondHandPurchase()

  const [deviceTypeOpen, setDeviceTypeOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [sellerOpen, setSellerOpen] = useState(false)
  const [scanningField, setScanningField] = useState<'imei' | 'imei2' | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [deviceTypeId, setDeviceTypeId] = useState<string | undefined>()
  const [brandId, setBrandId] = useState<string | null>(null)
  const [model, setModel] = useState('')
  const [imei, setImei] = useState('')
  const [imei2, setImei2] = useState('')
  const [devicePinPattern, setDevicePinPattern] = useState('')
  const [ram, setRam] = useState('')
  const [storage, setStorage] = useState('')
  const [colour, setColour] = useState('')
  const [batteryHealthPercent, setBatteryHealthPercent] = useState<number | ''>('')
  const [network, setNetwork] = useState('—')
  const [originalInvoiceDate, setOriginalInvoiceDate] = useState('')
  const [warrantyLeftMonths, setWarrantyLeftMonths] = useState<number | ''>('')
  const [dualSim, setDualSim] = useState(false)
  const [hasBox, setHasBox] = useState(false)
  const [hasBill, setHasBill] = useState(false)
  const [conditionGrade, setConditionGrade] = useState<ConditionGrade>('B')
  const [accountLockStatus, setAccountLockStatus] = useState<AccountLockStatus>('notChecked')
  const [accessoriesIncluded, setAccessoriesIncluded] = useState('—')
  const [conditionNotes, setConditionNotes] = useState('')
  const [pendingImages, setPendingImages] = useState<File[]>([])

  const [sellerId, setSellerId] = useState<string | null>(null)
  const [quickAddSeller, setQuickAddSeller] = useState<{ name: string; mobile: string } | null>(null)
  const [idProofType, setIdProofType] = useState('Not Captured')
  const [idProofNumber, setIdProofNumber] = useState('')
  const [pendingIdProofPhoto, setPendingIdProofPhoto] = useState<File | null>(null)
  const [imeiCheckedClean, setImeiCheckedClean] = useState(false)
  const [sellerDeclaredNotStolen, setSellerDeclaredNotStolen] = useState(false)

  const [purchasePrice, setPurchasePrice] = useState<number | ''>('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card'>('cash')
  const [amountPaid, setAmountPaid] = useState<number | ''>('')
  const [purchasedById, setPurchasedById] = useState<string | null>(null)
  const [expectedSalePrice, setExpectedSalePrice] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  if (optionsLoading || !options) return null

  const brandsForDeviceType = deviceTypeId ? options.brands.filter((b) => b.deviceTypeIds?.includes(deviceTypeId)) : []
  const modelsForBrand = brandId ? options.models.filter((m) => m.brandId === brandId) : []
  const sellers = parties.filter((p) => p.partyTypes.includes('supplier') || p.partyTypes.length === 0)

  async function handleSubmit() {
    setFormError(null)
    let finalSellerId = sellerId
    let finalSellerName: string

    if (!finalSellerId && !quickAddSeller) {
      setFormError('Select or add a seller.')
      return
    }
    if (!deviceTypeId) {
      setFormError('Select a device type.')
      return
    }
    if (purchasePrice === '' || Number(purchasePrice) <= 0) {
      setFormError('Enter a purchase price greater than 0.')
      return
    }

    setSubmitting(true)
    try {
      if (!finalSellerId && quickAddSeller) {
        const created = await createParty.mutateAsync({
          name: quickAddSeller.name,
          mobile: quickAddSeller.mobile,
          partyTypes: ['supplier'],
        })
        finalSellerId = created.id
        finalSellerName = created.name
      } else {
        const party = parties.find((p) => p.id === finalSellerId)!
        finalSellerName = party.name
      }

      const deviceType = options.deviceTypes.find((d) => d.id === deviceTypeId)
      const brand = options.brands.find((b) => b.id === brandId)
      const purchasedByUser = users.find((u) => u.id === purchasedById)

      const tempId = crypto.randomUUID()
      const imageUrls: string[] = []
      for (const file of pendingImages) {
        imageUrls.push(await uploadSecondHandDeviceImage(profile!.companyId, tempId, file))
      }
      const idProofPhotoUrl = pendingIdProofPhoto
        ? await uploadSecondHandDeviceImage(profile!.companyId, tempId, pendingIdProofPhoto)
        : null

      await createPurchase.mutateAsync({
        deviceTypeId: deviceTypeId ?? null,
        deviceTypeName: deviceType?.label ?? null,
        brandId: brandId ?? null,
        brandName: brand?.label ?? null,
        model: model || null,
        imei: imei || null,
        imei2: imei2 || null,
        devicePinPattern: devicePinPattern || null,
        ram: ram || null,
        storage: storage || null,
        colour: colour || null,
        batteryHealthPercent: batteryHealthPercent === '' ? null : Number(batteryHealthPercent),
        network: network === '—' ? null : network,
        originalInvoiceDate: originalInvoiceDate ? new Date(originalInvoiceDate) : null,
        warrantyLeftMonths: warrantyLeftMonths === '' ? null : Number(warrantyLeftMonths),
        dualSim,
        hasBox,
        hasBill,
        conditionGrade,
        accountLockStatus,
        accessoriesIncluded: accessoriesIncluded === '—' ? null : accessoriesIncluded,
        conditionNotes: conditionNotes || null,
        imageUrls,
        sellerId: finalSellerId!,
        sellerName: finalSellerName,
        idProofType: idProofType === 'Not Captured' ? null : idProofType,
        idProofNumber: idProofNumber || null,
        idProofPhotoUrl,
        imeiCheckedClean,
        sellerDeclaredNotStolen,
        purchasePrice: Number(purchasePrice),
        purchaseDate: new Date(purchaseDate),
        paymentMode,
        amountPaid: amountPaid === '' ? Number(purchasePrice) : Number(amountPaid),
        purchasedById: purchasedById ?? user!.uid,
        purchasedByName: purchasedByUser?.fullName ?? profile!.fullName,
        expectedSalePrice: expectedSalePrice === '' ? null : Number(expectedSalePrice),
        notes: notes || null,
      })

      navigate(buildPath('second-hand-device', 'purchase'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const paidInFull = amountPaid !== '' && purchasePrice !== '' && Number(amountPaid) >= Number(purchasePrice)

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-24 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Buy Second Hand Device</h1>
          <p className="text-sm text-muted-foreground">
            Record a second hand device purchase from a seller — added to stock immediately.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      {formError && <FormError message={formError} />}

      <div className="space-y-4 rounded-lg border p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">📋 Device Details</h2>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="space-y-1.5">
            <Label>Device Type <span className="text-red-600">*</span></Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchSelect
                  options={options.deviceTypes.map((dt) => ({ id: dt.id, label: dt.label, icon: deviceTypeIcon(dt.label) }))}
                  value={deviceTypeId ?? null}
                  onChange={(id) => { setDeviceTypeId(id ?? undefined); setBrandId(null); setModel('') }}
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

          <div className="space-y-1.5">
            <Label>Brand <span className="text-red-600">*</span></Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchSelect
                  options={brandsForDeviceType.map((b) => ({ id: b.id, label: b.label }))}
                  value={brandId}
                  onChange={(id) => { setBrandId(id); setModel('') }}
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

          <div className="space-y-1.5">
            <Label>Model <span className="text-red-600">*</span></Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchSelect
                  options={modelsForBrand.map((m) => ({ id: m.id, label: m.label }))}
                  value={modelsForBrand.find((m) => m.label === model)?.id ?? null}
                  onChange={(id) => setModel(modelsForBrand.find((m) => m.id === id)?.label ?? '')}
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

          <div className="space-y-1.5">
            <Label>IMEI <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <div className="flex gap-2">
              <Input value={imei} onChange={(e) => setImei(e.target.value)} placeholder="15-digit IMEI (optional)" className="flex-1" />
              <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setScanningField('imei')}>
                <ScanLine className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>IMEI 2 <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <div className="flex gap-2">
              <Input value={imei2} onChange={(e) => setImei2(e.target.value)} placeholder="Second IMEI (dual SIM)" className="flex-1" />
              <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setScanningField('imei2')}>
                <ScanLine className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Device PIN / Pattern <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <div className="flex items-center gap-2">
              {devicePinPattern ? (
                <>
                  <PatternLockPreview value={devicePinPattern} />
                  <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setDevicePinPattern('')}>
                    Clear
                  </button>
                </>
              ) : (
                <span className="flex-1 text-sm text-muted-foreground">No pattern drawn</span>
              )}
              <PatternLockPicker value={devicePinPattern} onChange={setDevicePinPattern} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>RAM <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input value={ram} onChange={(e) => setRam(e.target.value)} placeholder="e.g. 8 GB" />
          </div>
          <div className="space-y-1.5">
            <Label>Storage / ROM <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="e.g. 128 GB" />
          </div>
          <div className="space-y-1.5">
            <Label>Colour <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input value={colour} onChange={(e) => setColour(e.target.value)} placeholder="e.g. Midnight Black" />
          </div>
          <div className="space-y-1.5">
            <Label>Battery Health % <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input type="number" min={0} max={100} value={batteryHealthPercent} onChange={(e) => setBatteryHealthPercent(e.target.value === '' ? '' : Number(e.target.value))} placeholder="—" />
          </div>
          <div className="space-y-1.5">
            <Label>Network <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Select value={network} onValueChange={(v) => v && setNetwork(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{NETWORK_OPTIONS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Original Invoice Date <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input type="date" value={originalInvoiceDate} onChange={(e) => setOriginalInvoiceDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Warranty Left (months) <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input type="number" min={0} value={warrantyLeftMonths} onChange={(e) => setWarrantyLeftMonths(e.target.value === '' ? '' : Number(e.target.value))} placeholder="—" />
          </div>
          <div className="space-y-1.5">
            <Label>Condition Grade</Label>
            <Select value={conditionGrade} onValueChange={(v) => v && setConditionGrade(v as ConditionGrade)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A — Excellent</SelectItem>
                <SelectItem value="B">B — Good</SelectItem>
                <SelectItem value="C">C — Fair</SelectItem>
                <SelectItem value="D">D — Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Account Lock (iCloud / Google)</Label>
            <Select value={accountLockStatus} onValueChange={(v) => v && setAccountLockStatus(v as AccountLockStatus)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="notChecked">Not checked</SelectItem>
                <SelectItem value="clean">Clean — no lock</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-1.5"><Checkbox checked={dualSim} onCheckedChange={(v) => setDualSim(v === true)} /> Dual SIM</label>
          <label className="flex items-center gap-1.5"><Checkbox checked={hasBox} onCheckedChange={(v) => setHasBox(v === true)} /> Box</label>
          <label className="flex items-center gap-1.5"><Checkbox checked={hasBill} onCheckedChange={(v) => setHasBill(v === true)} /> Bill</label>
        </div>

        <div className="space-y-1.5">
          <Label>Accessories Included <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
          <Select value={accessoriesIncluded} onValueChange={(v) => v && setAccessoriesIncluded(v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{ACCESSORIES_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Condition Notes <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
          <Textarea value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} placeholder="e.g. Minor scratches on back panel" rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Device Photos <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed py-6 text-muted-foreground hover:bg-muted/40">
            <ImagePlus className="size-5" />
            <span className="text-sm">Add Photos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setPendingImages((prev) => [...prev, ...Array.from(e.target.files ?? [])])} />
          </label>
          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pendingImages.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-2 text-xs">
                  {f.name}
                  <button type="button" onClick={() => setPendingImages((prev) => prev.filter((_, idx) => idx !== i))} className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">✓ Seller &amp; ID Verification</h2>

        <div className="space-y-1.5">
          <Label>Seller <span className="text-red-600">*</span></Label>
          <SearchSelect
            options={sellers.map((p) => ({ id: p.id, label: p.name, helper: p.mobile }))}
            value={sellerId}
            onChange={(id) => { setSellerId(id); if (id) setQuickAddSeller(null) }}
            placeholder="Search seller by name or mobile..."
            open={sellerOpen}
            onOpenChange={setSellerOpen}
            onCreateNew={(query) => setQuickAddSeller({ name: query, mobile: '' })}
          />
          {quickAddSeller && !sellerId && (
            <div className="flex gap-2 rounded-md border border-dashed p-2">
              <Input value={quickAddSeller.name} onChange={(e) => setQuickAddSeller({ ...quickAddSeller, name: e.target.value })} placeholder="Seller name" className="h-8 text-sm" />
              <Input
                value={quickAddSeller.mobile}
                onChange={(e) => setQuickAddSeller({ ...quickAddSeller, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit mobile"
                className="h-8 text-sm"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="space-y-1.5">
            <Label>ID Proof Type</Label>
            <Select value={idProofType} onValueChange={(v) => v && setIdProofType(v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Captured">Not Captured</SelectItem>
                <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                <SelectItem value="PAN Card">PAN Card</SelectItem>
                <SelectItem value="Driving Licence">Driving Licence</SelectItem>
                <SelectItem value="Voter ID">Voter ID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>ID Proof Number <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input value={idProofNumber} onChange={(e) => setIdProofNumber(e.target.value)} placeholder="9876543210" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>ID Proof Photo <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed py-6 text-muted-foreground hover:bg-muted/40">
            <ImagePlus className="size-5" />
            <span className="text-sm">{pendingIdProofPhoto ? pendingIdProofPhoto.name : 'Capture / Upload ID proof photo'}</span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPendingIdProofPhoto(e.target.files?.[0] ?? null)} />
          </label>
          <p className="text-xs text-muted-foreground">On mobile this opens the camera directly. Saved against this seller for records.</p>
        </div>

        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-1.5">
            <Checkbox checked={imeiCheckedClean} onCheckedChange={(v) => setImeiCheckedClean(v === true)} />
            IMEI checked against CEIR / blocked-device list
          </label>
          <label className="flex items-center gap-1.5">
            <Checkbox checked={sellerDeclaredNotStolen} onCheckedChange={(v) => setSellerDeclaredNotStolen(v === true)} />
            Seller declared the device is theirs to sell and not stolen
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">₹ Purchase Details</h2>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="purchasePrice">Purchase Price <span className="text-red-600">*</span></Label>
            <Input id="purchasePrice" type="number" min={0} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Date of Purchase</Label>
            <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Mode</Label>
            <Select value={paymentMode} onValueChange={(v) => v && setPaymentMode(v as typeof paymentMode)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount Paid <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input type="number" min={0} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))} />
            {paidInFull && <p className="text-xs text-emerald-600">Paid in full.</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Purchased By <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Select value={purchasedById ?? '__self__'} onValueChange={(v) => setPurchasedById(v === '__self__' ? null : v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__self__">Whoever is logged in</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Expected Sale Price <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
            <Input type="number" min={0} value={expectedSalePrice} onChange={(e) => setExpectedSalePrice(e.target.value === '' ? '' : Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">What you plan to sell this device for. Shows on the Sale screen.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Notes <span className="text-xs font-normal text-muted-foreground">(Optional)</span></Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Purchase'}
        </Button>
      </div>

      <ScanTextModal
        open={scanningField != null}
        onOpenChange={(open) => !open && setScanningField(null)}
        title={scanningField === 'imei' ? 'Scan IMEI' : 'Scan IMEI 2'}
        description="Point the camera at the barcode or QR on the device or its box"
        onScanned={(text) => {
          if (scanningField === 'imei') setImei(text)
          else if (scanningField === 'imei2') setImei2(text)
        }}
      />
    </div>
  )
}
