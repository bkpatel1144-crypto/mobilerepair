import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, RefreshCw, DollarSign } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { FilterBar, type DateRangeKey } from '@/components/shared/filter-bar'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SearchSelect } from '@/components/shared/search-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  useSecondHandPurchases,
  secondHandPurchasesQueryKey,
  deviceLabel,
  type SecondHandPurchaseWithId,
} from '@/hooks/use-second-hand-purchases'
import { useSecondHandSales, useCreateSecondHandSale, secondHandSalesQueryKey } from '@/hooks/use-second-hand-sales'
import { useParties, useCreateParty } from '@/hooks/use-parties'
import { useAuth } from '@/hooks/use-auth'
import { dateRangeBounds } from '@/lib/date-range'
import { purchaseDetailSections, purchaseTimeline } from './purchase-detail-sections'

export function DeviceSalePage() {
  const { data: purchases = [], isLoading } = useSecondHandPurchases()
  const { data: sales = [] } = useSecondHandSales()
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeKey | 'all'>('all')
  const [viewing, setViewing] = useState<SecondHandPurchaseWithId | null>(null)
  const [selling, setSelling] = useState<SecondHandPurchaseWithId | null>(null)

  const availableToSell = purchases.filter((p) => p.status === 'inStock')
  const inRefurb = purchases.filter((p) => p.status === 'inRefurb')
  const sold = purchases.filter((p) => p.status === 'sold')
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0)

  const bounds = dateRangeBounds(dateRange)
  const filtered = availableToSell
    .filter((p) => !bounds || ((p.createdAt?.toDate?.() ?? new Date(0)) >= bounds.from && (p.createdAt?.toDate?.() ?? new Date(0)) <= bounds.to))
    .filter((p) => (search.trim() ? `${p.purchaseNumber} ${deviceLabel(p)} ${p.imei ?? ''}`.toLowerCase().includes(search.toLowerCase()) : true))

  const columns: DataTableColumn<SecondHandPurchaseWithId>[] = [
    { key: 'purchaseNumber', header: 'Purchase #', render: (p) => p.purchaseNumber },
    { key: 'device', header: 'Device', render: (p) => <><p className="font-medium">{deviceLabel(p)}</p><p className="text-xs text-muted-foreground">Grade {p.conditionGrade}</p></> },
    { key: 'expectedSalePrice', header: 'Expected Sale Price', render: (p) => (p.expectedSalePrice != null ? `₹${p.expectedSalePrice}` : '—') },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); setSelling(p) }}>
          Sell
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        icon={ShoppingBag}
        title="Device Sale"
        subtitle="Sell devices from stock to a buyer"
        actions={
          <Button type="button" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: secondHandPurchasesQueryKey(profile?.companyId) })}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Available to Sell" value={availableToSell.length} icon={ShoppingBag} tone="success" />
        <StatCard label="In Refurb" value={inRefurb.length} tone="warning" />
        <StatCard label="Sold" value={sold.length} tone="info" />
        <StatCard label="Total Profit" value={`₹${totalProfit}`} icon={DollarSign} tone={totalProfit >= 0 ? 'success' : 'danger'} />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search receipt # / IMEI / brand..."
        dateRange={dateRange === 'all' ? undefined : dateRange}
        onDateRangeChange={setDateRange}
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        onRowClick={setViewing}
        emptyState={<EmptyState icon={ShoppingBag} title="Nothing available to sell" description="Devices you purchase show up here once in stock." />}
      />

      {viewing && (
        <DetailDrawer
          open
          onOpenChange={(open) => !open && setViewing(null)}
          icon={ShoppingBag}
          title={viewing.purchaseNumber}
          subtitle={deviceLabel(viewing)}
          badges={<StatusBadge status="Available to Sell" tone="success" />}
          sections={purchaseDetailSections(viewing)}
          timeline={purchaseTimeline(viewing)}
        />
      )}

      {selling && <SellDeviceModal purchase={selling} onClose={() => setSelling(null)} />}
    </div>
  )
}

function SellDeviceModal({ purchase, onClose }: { purchase: SecondHandPurchaseWithId; onClose: () => void }) {
  const { data: parties = [] } = useParties()
  const createParty = useCreateParty()
  const createSale = useCreateSecondHandSale()

  const [buyerId, setBuyerId] = useState<string | null>(null)
  const [quickAddBuyer, setQuickAddBuyer] = useState<{ name: string; mobile: string } | null>(null)
  const [salePrice, setSalePrice] = useState<number>(purchase.expectedSalePrice ?? 0)
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card'>('cash')
  const [warrantyDays, setWarrantyDays] = useState(0)
  const [accessoriesGiven, setAccessoriesGiven] = useState(purchase.accessoriesIncluded ?? '')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { profile } = useAuth()

  async function handleConfirm() {
    setError(null)
    let finalBuyerId = buyerId
    let finalBuyerName: string
    if (!finalBuyerId && !quickAddBuyer) {
      setError('Select or add a buyer.')
      return
    }
    if (salePrice <= 0) {
      setError('Enter a sale price greater than 0.')
      return
    }
    try {
      if (!finalBuyerId && quickAddBuyer) {
        const created = await createParty.mutateAsync({ name: quickAddBuyer.name, mobile: quickAddBuyer.mobile })
        finalBuyerId = created.id
        finalBuyerName = created.name
      } else {
        finalBuyerName = parties.find((p) => p.id === finalBuyerId)!.name
      }
      await createSale.mutateAsync({
        purchase,
        buyerId: finalBuyerId!,
        buyerName: finalBuyerName,
        salePrice,
        paymentMode,
        warrantyDays,
        accessoriesGiven: accessoriesGiven.trim() || null,
        notes: notes.trim() || null,
      })
      queryClient.invalidateQueries({ queryKey: secondHandSalesQueryKey(profile?.companyId) })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sell {deviceLabel(purchase)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 rounded-md bg-muted/40 p-3 text-sm">
          <p className="font-medium">📱 Device Purchased</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
            <span>Device: {deviceLabel(purchase)}</span>
            <span>Condition: Grade {purchase.conditionGrade}</span>
            <span>IMEI/Serial: {purchase.imei ?? '—'}</span>
            <span>Expected Sale Price: ₹{purchase.expectedSalePrice ?? 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Buyer *</Label>
            <SearchSelect
              options={parties.map((p) => ({ id: p.id, label: p.name, helper: p.mobile }))}
              value={buyerId}
              onChange={(id) => { setBuyerId(id); if (id) setQuickAddBuyer(null) }}
              placeholder="Search buyer..."
              onCreateNew={(query) => setQuickAddBuyer({ name: query, mobile: '' })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salePrice">Sale Price *</Label>
            <Input id="salePrice" type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value) || 0)} />
          </div>
        </div>
        {quickAddBuyer && !buyerId && (
          <div className="flex gap-2 rounded-md border border-dashed p-2">
            <Input value={quickAddBuyer.name} onChange={(e) => setQuickAddBuyer({ ...quickAddBuyer, name: e.target.value })} placeholder="Buyer name" className="h-8 text-sm" />
            <Input
              value={quickAddBuyer.mobile}
              onChange={(e) => setQuickAddBuyer({ ...quickAddBuyer, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              placeholder="10-digit mobile"
              className="h-8 text-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
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
            <Label>Warranty (Days)</Label>
            <Input type="number" min={0} value={warrantyDays} onChange={(e) => setWarrantyDays(Number(e.target.value) || 0)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Accessories Given to Buyer</Label>
          <Input value={accessoriesGiven} onChange={(e) => setAccessoriesGiven(e.target.value)} placeholder="Charger, box, cable..." />
          <p className="text-xs text-muted-foreground">Defaults to what was purchased with the device — edit if you're keeping anything back or adding something new.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Notes (Optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Screen protector applied before handover" rows={2} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleConfirm} disabled={createSale.isPending}>
            {createSale.isPending ? 'Saving…' : 'Confirm Sale'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
