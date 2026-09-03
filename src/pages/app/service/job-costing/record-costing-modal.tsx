import { useState } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchSelect } from '@/components/shared/search-select'
import { useSaveJobCosting } from '@/hooks/use-job-costing'
import { useParties, useCreateParty } from '@/hooks/use-parties'
import { cn } from '@/lib/utils'
import type { JobCardWithId } from '@/hooks/use-job-cards'
import type { JobCostingDoc } from '@/types/firestore'

type CostItem = JobCostingDoc['costItems'][number]
const COST_TYPES: { key: CostItem['type']; label: string }[] = [
  { key: 'part', label: 'Part' },
  { key: 'labor', label: 'Labor' },
  { key: 'overhead', label: 'Overhead' },
  { key: 'other', label: 'Other' },
]

function costItemsFromJob(job: JobCardWithId): CostItem[] {
  return job.partsUsed.map((p) => ({
    id: p.id,
    type: 'part',
    itemId: p.itemId,
    itemName: p.itemName,
    supplier: null,
    rate: p.rate,
    cost: 0,
    qty: p.qty,
    linked: true,
  }))
}

/** "Record Actual Costing" — matches `preview (37)` exactly: read-only reference table of the
 * job's own parts, an editable cost-entry card per item (rate locked once `linked`), a running
 * Bill/Cost/Profit summary, and the over-cost warning banner. */
export function RecordCostingModal({
  job,
  existing,
  onClose,
}: {
  job: JobCardWithId
  existing: JobCostingDoc | null
  onClose: () => void
}) {
  const [costItems, setCostItems] = useState<CostItem[]>(existing?.costItems ?? costItemsFromJob(job))
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const saveCosting = useSaveJobCosting()
  const { data: parties = [] } = useParties()
  const createParty = useCreateParty()
  // Same "no strict type set yet still counts" fallback the Second Hand Device seller picker
  // uses — Supplier Report (Phase 9) reads this same free-text name, not a partyId reference, so
  // picking an existing party here is a convenience/autocomplete, never a hard link.
  const suppliers = parties.filter((p) => p.partyTypes.includes('supplier') || p.partyTypes.length === 0)

  // A typed-in supplier name becomes a real Party (same call the Second Hand Device seller
  // quick-add makes) rather than just a bare string nowhere else can find — otherwise it could
  // never appear as a `SearchSelect` option again (that component only recognizes a `value` that
  // matches one of its own `options[].id`), so the very row you just filled in would render back
  // as its own empty placeholder the instant this closes and reopens.
  async function handleCreateSupplier(itemId: string, name: string) {
    if (!name.trim()) return
    const created = await createParty.mutateAsync({ name: name.trim(), mobile: '', partyTypes: ['supplier'] })
    updateItem(itemId, { supplier: created.name })
  }

  const billAmount = job.finalAmount ?? job.estimatedCost
  const totalCost = costItems.reduce((sum, c) => sum + c.cost * c.qty, 0)
  const profit = billAmount - totalCost
  const profitPct = billAmount > 0 ? Math.round((profit / billAmount) * 100) : 0
  const anyOverCost = costItems.some((c) => c.rate != null && c.cost > c.rate)

  function updateItem(id: string, patch: Partial<CostItem>) {
    setCostItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  function addCostItem() {
    setCostItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: 'labor', itemId: null, itemName: '', supplier: null, rate: null, cost: 0, qty: 1, linked: false },
    ])
  }

  async function handleSave() {
    await saveCosting.mutateAsync({
      jobId: job.id,
      jobNumber: job.jobNumber,
      costItems,
      totalCost,
      billAmount,
      profit,
      notes: notes || null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-background p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="flex size-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">₹</span>
              Record Actual Costing
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            {job.partsUsed.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="size-4" />
                  {job.partsUsed.length} Part(s) from Job (reference)
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.partsUsed.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.itemName}</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>₹{p.rate}</TableCell>
                        <TableCell>{p.qty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {costItems.map((item) => {
              const requiresCost = item.linked && item.cost === 0
              return (
                <div
                  key={item.id}
                  className={cn('space-y-2 rounded-lg border p-3', requiresCost ? 'border-red-300' : 'border-border')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {COST_TYPES.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => updateItem(item.id, { type: t.key })}
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs',
                            item.type === t.key ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400' : 'text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        item.linked
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                          : requiresCost
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                            : ''
                      )}
                    >
                      {item.linked ? '🔒 Linked' : requiresCost ? '⚠ Cost required' : ''}
                    </span>
                  </div>
                  <Input
                    value={item.itemName}
                    onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                    placeholder="Item name"
                    disabled={item.linked}
                  />
                  <SearchSelect
                    options={suppliers.map((p) => ({ id: p.name, label: p.name, helper: p.mobile }))}
                    value={item.supplier}
                    onChange={(name) => updateItem(item.id, { supplier: name })}
                    placeholder="Search supplier..."
                    onCreateNew={(query) => handleCreateSupplier(item.id, query)}
                  />
                  <div className="grid grid-cols-4 items-center gap-2">
                    <Input value={item.rate ?? ''} placeholder="Rate" disabled />
                    <Input
                      type="number"
                      value={item.cost}
                      onChange={(e) => updateItem(item.id, { cost: Number(e.target.value) || 0 })}
                      placeholder="Cost ₹"
                      className={cn(requiresCost && 'border-red-400')}
                    />
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) || 1 })}
                    />
                    <span className="text-right text-sm font-medium">= ₹{item.cost * item.qty}</span>
                  </div>
                </div>
              )
            })}

            <button type="button" onClick={addCostItem} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-sm text-teal-700 hover:bg-muted/40 dark:text-teal-400">
              <Plus className="size-4" />
              Add Cost Item
            </button>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">Job Card: {job.jobNumber}</p>
              <p className="text-muted-foreground">Technician: {job.assignedToName ?? '—'}</p>
              <p className="text-muted-foreground">Device: {[job.brandName, job.model].filter(Boolean).join(' ')}</p>
            </div>
            <div className="space-y-1.5 rounded-lg border p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Bill Amount</span><span className="font-medium">₹{billAmount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Cost</span><span className="font-medium">₹{totalCost}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit</span>
                <span className={cn('font-medium', profit < 0 ? 'text-red-600' : 'text-teal-600')}>
                  ₹{profit} ({profitPct}%)
                </span>
              </div>
            </div>
            {anyOverCost && (
              <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
                ⚠ Actual cost exceeds original rate on some parts.
              </p>
            )}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Notes (Optional)</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." rows={2} />
            </div>
            <Button type="button" className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={saveCosting.isPending}>
              {saveCosting.isPending ? 'Saving…' : 'Save Costing'}
            </Button>
            <button type="button" onClick={onClose} className="w-full text-center text-sm text-muted-foreground hover:underline">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
