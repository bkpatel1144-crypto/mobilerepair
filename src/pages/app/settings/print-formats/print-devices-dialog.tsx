import { useState } from 'react'
import { Plus, Trash2, Info } from 'lucide-react'
import { FormModal } from '@/components/shared/form-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrintDevices, useSavePrintDevices, type PrintDevice } from '@/hooks/use-print-devices'
import { Monitor } from 'lucide-react'

/** Printer profiles, shared company-wide. See `usePrintDevices` — these are notes about
 * hardware, not connections to it; the banner says so rather than letting the screen imply
 * the app can address a printer directly. */
export function PrintDevicesDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: saved = [], isLoading } = usePrintDevices()
  const save = useSavePrintDevices()
  const [draft, setDraft] = useState<PrintDevice[] | null>(null)

  const devices = draft ?? saved
  const dirty = draft !== null

  function update(id: string, patch: Partial<PrintDevice>) {
    setDraft(devices.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => {
        if (!o) setDraft(null)
        onOpenChange(o)
      }}
      title="Print Devices"
      description="Note which printer each format is meant for."
      submitLabel={save.isPending ? 'Saving…' : 'Save Devices'}
      submitDisabled={!dirty || save.isPending}
      isSubmitting={save.isPending}
      onSubmit={async () => {
        await save.mutateAsync(devices)
        setDraft(null)
        onOpenChange(false)
      }}
    >
      <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          Saved for reference only. Printing always goes through your browser's own print dialog,
          where you choose the printer — a web app has no way to address one directly.
        </span>
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="No devices noted yet"
          description="Add the printers this shop uses so everyone knows which is which."
        />
      ) : (
        <div className="space-y-3">
          {devices.map((d) => (
            <div key={d.id} className="space-y-2 rounded-lg border p-3">
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(9rem,1fr))]">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={d.name}
                    onChange={(e) => update(d.id, { name: e.target.value })}
                    placeholder="Counter printer"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Paper</Label>
                  <Input
                    value={d.paper}
                    onChange={(e) => update(d.id, { paper: e.target.value })}
                    placeholder="58mm"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    value={d.notes}
                    onChange={(e) => update(d.id, { notes: e.target.value })}
                    placeholder="Front desk, used for job cards"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${d.name || 'device'}`}
                  className="text-red-600"
                  onClick={() => setDraft(devices.filter((x) => x.id !== d.id))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          setDraft([...devices, { id: crypto.randomUUID(), name: '', paper: '', notes: '' }])
        }
      >
        <Plus className="size-4" />
        Add Device
      </Button>
    </FormModal>
  )
}
