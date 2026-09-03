import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Plus, RefreshCw, Printer, Pencil, Wrench, Undo2, ChevronDown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { FormModal } from '@/components/shared/form-modal'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useSecondHandPurchases,
  useSetSecondHandPurchaseStatus,
  useUpdateSecondHandPurchase,
  secondHandPurchasesQueryKey,
  deviceLabel,
  type SecondHandPurchaseWithId,
} from '@/hooks/use-second-hand-purchases'
import type { ConditionGrade } from '@/types/firestore'
import type { SecondHandSaleWithId } from '@/hooks/use-second-hand-sales'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { crudKey, specialActionKey } from '@/config/permission-schema'
import { useCompany } from '@/hooks/use-company'
import { usePrintTemplatesFor } from '@/hooks/use-print-templates'
import { renderPrintHtml, openPrintWindow } from '@/lib/print-render'
import { secondHandPurchaseReceiptContext, secondHandSaleInvoiceContext, secondHandDeviceLabelContext } from '@/lib/print-contexts'
import { formatTimestamp } from '@/lib/utils'
import { dateRangeBounds } from '@/lib/date-range'
import { buildPath } from '@/config/nav'
import { purchaseDetailSections, purchaseTimeline, PURCHASE_STATUS_LABEL, PURCHASE_STATUS_TONE } from './purchase-detail-sections'

export function DevicePurchasePage() {
  const { data: purchases = [], isLoading } = useSecondHandPurchases()
  const { canDo } = usePermissions()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const setStatus = useSetSecondHandPurchaseStatus()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [viewing, setViewing] = useState<SecondHandPurchaseWithId | null>(null)
  const [editing, setEditing] = useState<SecondHandPurchaseWithId | null>(null)
  const [confirmingReturn, setConfirmingReturn] = useState(false)

  const bounds = dateRangeBounds(dateRange)
  const filtered = purchases
    .filter((p) => !bounds || ((p.createdAt?.toDate?.() ?? new Date(0)) >= bounds.from && (p.createdAt?.toDate?.() ?? new Date(0)) <= bounds.to))
    .filter((p) =>
      search.trim()
        ? `${p.purchaseNumber} ${p.brandName ?? ''} ${p.model ?? ''} ${p.sellerName}`.toLowerCase().includes(search.toLowerCase())
        : true
    )

  const canCreate = canDo(crudKey('second-hand-device', 'purchases', 'create'))
  const canEdit = canDo(crudKey('second-hand-device', 'purchases', 'update'))
  const canRefurb = canEdit || canDo(specialActionKey('second-hand-device', 'sendToRefurb'))
  const canReturn = canEdit || canDo(specialActionKey('second-hand-device', 'returnToSeller'))

  const columns: DataTableColumn<SecondHandPurchaseWithId>[] = [
    {
      key: 'purchaseNumber',
      header: 'Purchase #',
      render: (p) => (
        <div>
          <p className="font-semibold">{p.purchaseNumber}</p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(p.purchaseDate, false)}</p>
        </div>
      ),
    },
    { key: 'device', header: 'Device', render: (p) => deviceLabel(p) },
    { key: 'seller', header: 'Seller', hideOnMobile: true, render: (p) => p.sellerName },
    { key: 'price', header: 'Purchase Price', sortValue: (p) => p.purchasePrice, render: (p) => `₹${p.purchasePrice}` },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={PURCHASE_STATUS_LABEL[p.status]} tone={PURCHASE_STATUS_TONE[p.status]} /> },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={Smartphone}
        title="Device Purchase"
        subtitle="Buy used mobiles, laptops & other devices from sellers"
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: secondHandPurchasesQueryKey(profile?.companyId) })}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            {canCreate && (
              <Button type="button" onClick={() => navigate(`${buildPath('second-hand-device', 'purchase')}/create`)}>
                <Plus className="size-4" />
                New Purchase
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total Purchased" value={purchases.length} icon={Smartphone} />
        <StatCard label="In Stock" value={purchases.filter((p) => p.status === 'inStock').length} tone="success" />
        <StatCard label="In Refurb" value={purchases.filter((p) => p.status === 'inRefurb').length} tone="warning" />
        <StatCard label="Sold" value={purchases.filter((p) => p.status === 'sold').length} tone="info" />
        <StatCard label="Returned" value={purchases.filter((p) => p.status === 'returnedToSeller').length} tone="danger" />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Receipt/invoice #, brand, model..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={Smartphone} title="No purchases yet" description="Record your first device purchase above." />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={Smartphone}
          title={viewing.purchaseNumber}
          subtitle={deviceLabel(viewing)}
          badges={<StatusBadge status={PURCHASE_STATUS_LABEL[viewing.status]} tone={PURCHASE_STATUS_TONE[viewing.status]} />}
          actions={
            <>
              {canEdit && viewing.status !== 'sold' && viewing.status !== 'returnedToSeller' && (
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(viewing)}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              )}
              {canRefurb && viewing.status === 'inStock' && (
                <Button type="button" variant="outline" size="sm" onClick={() => setStatus.mutate({ id: viewing.id, status: 'inRefurb', purchaseNumber: viewing.purchaseNumber })}>
                  <Wrench className="size-3.5" />
                  Send to Refurb
                </Button>
              )}
              {canReturn && (viewing.status === 'inStock' || viewing.status === 'inRefurb') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  onClick={() => setConfirmingReturn(true)}
                >
                  <Undo2 className="size-3.5" />
                  Return to Seller
                </Button>
              )}
              <PrintButtonGroup purchase={viewing} />
            </>
          }
          sections={purchaseDetailSections(viewing)}
          timeline={purchaseTimeline(viewing)}
        />
      )}

      {editing && <EditPurchaseModal purchase={editing} onClose={() => setEditing(null)} />}

      {viewing && (
        <ConfirmDialog
          open={confirmingReturn}
          onOpenChange={setConfirmingReturn}
          title={`Return "${viewing.purchaseNumber}" to seller?`}
          message="This is a terminal status — the purchase can no longer be edited, sent to refurb, or sold afterward. No refund/reversal of the purchase price is recorded automatically."
          confirmLabel="Return to Seller"
          isPending={setStatus.isPending}
          onConfirm={() =>
            setStatus.mutate(
              { id: viewing.id, status: 'returnedToSeller', purchaseNumber: viewing.purchaseNumber },
              { onSuccess: () => setConfirmingReturn(false) }
            )
          }
        />
      )}
    </div>
  )
}

/** Deliberately a smaller field set than Create — see `useUpdateSecondHandPurchase`'s own doc
 * comment for why device identity/seller/purchase-price terms aren't re-editable here. */
function EditPurchaseModal({ purchase, onClose }: { purchase: SecondHandPurchaseWithId; onClose: () => void }) {
  const updatePurchase = useUpdateSecondHandPurchase()
  const [conditionGrade, setConditionGrade] = useState<ConditionGrade>(purchase.conditionGrade)
  const [conditionNotes, setConditionNotes] = useState(purchase.conditionNotes ?? '')
  const [accessoriesIncluded, setAccessoriesIncluded] = useState(purchase.accessoriesIncluded ?? '')
  const [expectedSalePrice, setExpectedSalePrice] = useState<number | ''>(purchase.expectedSalePrice ?? '')
  const [refurbCost, setRefurbCost] = useState(purchase.refurbCost)
  const [notes, setNotes] = useState(purchase.notes ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await updatePurchase.mutateAsync({
      id: purchase.id,
      purchaseNumber: purchase.purchaseNumber,
      conditionGrade,
      conditionNotes: conditionNotes.trim() || null,
      accessoriesIncluded: accessoriesIncluded.trim() || null,
      expectedSalePrice: expectedSalePrice === '' ? null : Number(expectedSalePrice),
      refurbCost,
      notes: notes.trim() || null,
    })
    onClose()
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Edit ${purchase.purchaseNumber}`}
      onSubmit={handleSubmit}
      submitLabel="Save"
      isSubmitting={updatePurchase.isPending}
    >
      <div className="grid grid-cols-2 gap-3">
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
          <Label>Expected Sale Price</Label>
          <Input type="number" min={0} value={expectedSalePrice} onChange={(e) => setExpectedSalePrice(e.target.value === '' ? '' : Number(e.target.value))} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Refurb Cost</Label>
        <Input type="number" min={0} value={refurbCost} onChange={(e) => setRefurbCost(Number(e.target.value) || 0)} />
        <p className="text-xs text-muted-foreground">Spent so far getting this device sale-ready — subtracted from profit at sale time.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Accessories Included</Label>
        <Input value={accessoriesIncluded} onChange={(e) => setAccessoriesIncluded(e.target.value)} placeholder="Charger, box, cable..." />
      </div>
      <div className="space-y-1.5">
        <Label>Condition Notes</Label>
        <Textarea value={conditionNotes} onChange={(e) => setConditionNotes(e.target.value)} placeholder="e.g. Minor scratches on back panel" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} />
      </div>
    </FormModal>
  )
}

/** "🖶 Print Receipt/Label" + a chevron dropdown, matching `preview (41)`/`(47)`'s own button
 * pair — now a real print pipeline (Phase 10's Print Formats), not the honest-but-fake disabled
 * stub this replaces. Takes either a purchase or a sale (its one caller in each of the three
 * pages that render this always has exactly one of the two on hand). */
export function PrintButtonGroup({ purchase, sale }: { purchase?: SecondHandPurchaseWithId; sale?: SecondHandSaleWithId }) {
  const { data: company } = useCompany()
  const { defaultTemplate: purchaseReceiptTemplate } = usePrintTemplatesFor('secondHandPurchaseReceipt')
  const { defaultTemplate: saleInvoiceTemplate } = usePrintTemplatesFor('secondHandSaleInvoice')
  const { defaultTemplate: labelTemplate } = usePrintTemplatesFor('secondHandDeviceLabel')

  function handlePrintReceiptOrInvoice() {
    if (purchase && purchaseReceiptTemplate) {
      openPrintWindow(renderPrintHtml(purchaseReceiptTemplate, secondHandPurchaseReceiptContext(purchase, company)))
    } else if (sale && saleInvoiceTemplate) {
      openPrintWindow(renderPrintHtml(saleInvoiceTemplate, secondHandSaleInvoiceContext(sale, company)))
    }
  }
  function handlePrintLabel() {
    if (!labelTemplate) return
    const device = purchase
      ? { deviceTypeName: purchase.deviceTypeName, brandName: purchase.brandName, model: purchase.model, imei: purchase.imei, conditionGrade: purchase.conditionGrade, purchaseNumber: purchase.purchaseNumber, price: purchase.purchasePrice }
      : sale
        ? { deviceTypeName: null, brandName: null, model: sale.deviceLabel, imei: null, purchaseNumber: sale.purchaseNumber, price: sale.salePrice }
        : null
    if (!device) return
    openPrintWindow(renderPrintHtml(labelTemplate, secondHandDeviceLabelContext(device, company)))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <Printer className="size-3.5" />
            Print
            <ChevronDown className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePrintReceiptOrInvoice} disabled={purchase ? !purchaseReceiptTemplate : !saleInvoiceTemplate}>
          Print {purchase ? 'Receipt' : 'Invoice'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrintLabel} disabled={!labelTemplate}>
          Print Label
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
