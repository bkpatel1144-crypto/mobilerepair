import { useState } from 'react'
import { Package, Plus, Trash2, ShieldCheck, Check } from 'lucide-react'
import { FormModal } from '@/components/shared/form-modal'
import { SearchSelect } from '@/components/shared/search-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useItems, useCreateItem, nextItemCode } from '@/hooks/use-items'
import { useParties, useCreateParty } from '@/hooks/use-parties'
import { useEditBill, billTotals } from '@/hooks/use-edit-bill'
import type { JobCardWithId } from '@/hooks/use-job-cards'
import type { PartUsed } from '@/types/firestore'
import { useTranslation } from 'react-i18next'

const WARRANTY_UNITS = ['days', 'months', 'years'] as const

/**
 * Edit Bill — the only way to change what a billed job comes to.
 *
 * Parts stop being addable on the job card the moment a bill exists, because `addPart` moved
 * `partsCost` without moving `finalAmount` and the shop silently ate the difference. Everything
 * that used to happen there happens here instead, where the parts and the total are recomputed
 * from one list and cannot drift apart, and where lowering a bill below what the customer has
 * already paid issues them a refund rather than leaving the books wrong.
 *
 * Per-part supplier and warranty are captured here rather than only at intake because a shop
 * usually learns both *after* the repair: which supplier the part actually came from, and what
 * guarantee they gave on it.
 */
export function EditBillModal({
  job,
  onOpenChange,
}: {
  job: JobCardWithId | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { data: items = [] } = useItems()
  const { data: parties = [] } = useParties()
  const createItem = useCreateItem()
  const createParty = useCreateParty()

  // Keyed on the job id so switching rows re-seeds the draft without an effect — the React
  // Compiler forbids setState in render-reaction effects, and a key is what this repo uses.
  return job ? (
    <EditBillForm
      key={job.id}
      job={job}
      items={items}
      parties={parties}
      createItem={createItem}
      createParty={createParty}
      onOpenChange={onOpenChange}
      t={t}
    />
  ) : null
}

type ItemsHook = ReturnType<typeof useItems>['data']
type PartiesHook = ReturnType<typeof useParties>['data']

function EditBillForm({
  job,
  items = [],
  parties = [],
  createItem,
  createParty,
  onOpenChange,
  t,
}: {
  job: JobCardWithId
  items: ItemsHook
  parties: PartiesHook
  createItem: ReturnType<typeof useCreateItem>
  createParty: ReturnType<typeof useCreateParty>
  onOpenChange: (open: boolean) => void
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  const [parts, setParts] = useState<PartUsed[]>(job.partsUsed)
  const [serviceCharge, setServiceCharge] = useState(String(job.serviceCharge ?? 0))
  const [discount, setDiscount] = useState(String(job.discount ?? 0))
  const [warrantyValue, setWarrantyValue] = useState(String(job.billWarranty?.value ?? 0))
  const [warrantyUnit, setWarrantyUnit] = useState<(typeof WARRANTY_UNITS)[number]>(
    job.billWarranty?.unit ?? 'days'
  )
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editBill = useEditBill(job)

  const num = (v: string) => (v.trim() === '' ? 0 : Number(v))
  const totals = billTotals({
    parts,
    serviceCharge: num(serviceCharge),
    discount: num(discount),
    paidAmount: job.paidAmount,
  })

  const supplierOptions = (parties ?? [])
    .filter((p) => p.partyTypes.includes('supplier') || p.partyTypes.length === 0)
    .map((p) => ({ id: p.id, label: p.name, helper: p.mobile }))

  const partOptions = (items ?? [])
    .filter((i) => i.type === 'part' || i.type === 'service')
    .map((i) => ({ id: i.id, label: i.name, helper: i.itemCode }))

  function patchPart(id: string, patch: Partial<PartUsed>) {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function addPart(itemId: string) {
    const item = (items ?? []).find((i) => i.id === itemId)
    if (!item) return
    setParts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        itemId: item.id,
        itemName: item.name,
        itemCode: item.itemCode,
        rate: item.sellingPrice ?? 0,
        qty: 1,
        supplierId: null,
        supplierName: null,
        warranty: null,
      },
    ])
    setAdding(false)
  }

  async function createAndAddPart(name: string) {
    if (!name.trim()) return
    const created = await createItem.mutateAsync({
      name: name.trim(),
      type: 'part',
      itemCode: nextItemCode(items ?? [], 'part'),
    })
    addPart(created.id)
  }

  async function assignNewSupplier(partId: string, name: string) {
    if (!name.trim()) return
    // A typed supplier becomes a real Party, not a loose string: `SearchSelect` only shows a
    // value that matches one of its own option ids, so a bare name would render back empty the
    // moment this modal reopened.
    const created = await createParty.mutateAsync({
      name: name.trim(),
      mobile: '',
      partyTypes: ['supplier'],
    })
    patchPart(partId, { supplierId: created.id, supplierName: created.name })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (parts.length === 0 && num(serviceCharge) === 0) {
      setError(t('pages.sales.editBill.aBillNeedsAtLeastOneLine'))
      return
    }
    const wValue = num(warrantyValue)
    editBill.mutate(
      {
        parts,
        serviceCharge: num(serviceCharge),
        discount: num(discount),
        billWarranty: wValue > 0 ? { value: wValue, unit: warrantyUnit } : null,
        refundMode: 'cash',
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) =>
          setError(err instanceof Error ? err.message : t('pages.sales.editBill.couldNotSaveTheBill')),
      }
    )
  }

  return (
    <FormModal
      open
      onOpenChange={onOpenChange}
      title={t('pages.sales.editBill.editBill')}
      description={`${job.jobNumber} · ${job.customerName}`}
      error={error}
      onSubmit={handleSubmit}
      submitLabel={t('pages.sales.editBill.saveChanges')}
      isSubmitting={editBill.isPending}
      className="sm:max-w-xl"
    >
      <div className="space-y-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Package className="size-4 text-muted-foreground" />
          {t('pages.sales.editBill.parts', { count: parts.length })}
        </h3>

        {parts.map((p) => (
          <div key={p.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="font-medium">{p.itemName}</span>
                  {p.itemCode && (
                    <span className="text-xs text-muted-foreground">{p.itemCode}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹{p.rate} × {p.qty} = <span className="font-medium">₹{p.rate * p.qty}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${p.itemName}`}
                className="shrink-0 text-red-600 hover:bg-red-50"
                onClick={() => setParts((prev) => prev.filter((x) => x.id !== p.id))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Check className="size-3" />
                {t('pages.sales.editBill.supplier')}
              </span>
              <div className="min-w-0 flex-1">
                <SearchSelect
                  options={supplierOptions}
                  value={p.supplierId ?? null}
                  onChange={(id) =>
                    patchPart(p.id, {
                      supplierId: id,
                      supplierName: supplierOptions.find((s) => s.id === id)?.label ?? null,
                    })
                  }
                  onCreateNew={(name) => void assignNewSupplier(p.id, name)}
                  placeholder={t('pages.sales.editBill.searchSupplier')}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <ShieldCheck className="size-3" />
                {t('pages.sales.editBill.warranty')}
              </span>
              <Input
                className="h-8 w-24 text-sm"
                inputMode="numeric"
                placeholder={t('pages.sales.editBill.value')}
                value={p.warranty?.value ? String(p.warranty.value) : ''}
                onChange={(e) =>
                  patchPart(p.id, {
                    warranty: {
                      value: Number(e.target.value) || 0,
                      unit: p.warranty?.unit ?? 'days',
                      until: p.warranty?.until ?? null,
                    },
                  })
                }
              />
              <Select
                value={p.warranty?.unit ?? 'days'}
                onValueChange={(v) =>
                  v &&
                  patchPart(p.id, {
                    warranty: {
                      value: p.warranty?.value ?? 0,
                      unit: v as (typeof WARRANTY_UNITS)[number],
                      until: p.warranty?.until ?? null,
                    },
                  })
                }
              >
                <SelectTrigger className="h-8 w-28 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WARRANTY_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`pages.sales.editBill.units.${u}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="h-8 w-40 text-sm"
                value={p.warranty?.until ?? ''}
                onChange={(e) =>
                  patchPart(p.id, {
                    warranty: {
                      value: p.warranty?.value ?? 0,
                      unit: p.warranty?.unit ?? 'days',
                      until: e.target.value || null,
                    },
                  })
                }
              />
            </div>
          </div>
        ))}

        {adding ? (
          <div className="rounded-lg border border-dashed p-2">
            <SearchSelect
              options={partOptions}
              value={null}
              onChange={(id) => id && addPart(id)}
              onCreateNew={(name) => void createAndAddPart(name)}
              placeholder={t('pages.sales.editBill.searchOrTypePartName')}
            />
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed text-teal-700 dark:text-teal-400"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-4" />
            {t('pages.sales.editBill.addPartsServices')}
          </Button>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="serviceCharge">{t('pages.sales.editBill.serviceCharge')}</Label>
            <Input
              id="serviceCharge"
              inputMode="numeric"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount">{t('pages.sales.editBill.discount')}</Label>
            <Input
              id="discount"
              inputMode="numeric"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billWarranty">{t('pages.sales.editBill.warranty')}</Label>
            <div className="flex gap-1.5">
              <Input
                id="billWarranty"
                inputMode="numeric"
                className="min-w-0 flex-1"
                value={warrantyValue}
                onChange={(e) => setWarrantyValue(e.target.value)}
              />
              <Select
                value={warrantyUnit}
                onValueChange={(v) => v && setWarrantyUnit(v as (typeof WARRANTY_UNITS)[number])}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WARRANTY_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`pages.sales.editBill.units.${u}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <dl className="space-y-1.5 rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t('pages.sales.editBill.partsServices')}</dt>
            <dd>₹{totals.partsTotal}</dd>
          </div>
          <div className="flex items-center justify-between border-t pt-1.5">
            <dt className="font-semibold">{t('common.total')}</dt>
            <dd className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              ₹{totals.total}
            </dd>
          </div>
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <dt>{t('pages.sales.editBill.alreadyPaid')}</dt>
            <dd>− ₹{job.paidAmount}</dd>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <dt>
              {totals.refundDue > 0
                ? t('pages.sales.editBill.refundDue')
                : t('pages.sales.editBill.balanceDue')}
            </dt>
            <dd className={totals.refundDue > 0 ? 'text-amber-600' : undefined}>
              ₹{totals.refundDue > 0 ? totals.refundDue : totals.balanceDue}
            </dd>
          </div>
        </dl>

        {totals.refundDue > 0 && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            {t('pages.sales.editBill.thisWillRecordARefund', { amount: totals.refundDue })}
          </p>
        )}
      </div>
    </FormModal>
  )
}
