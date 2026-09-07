import { useEffect, useState } from 'react'
import { Plus, Trash2, Monitor, Copy, Check, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { cn } from '@/lib/utils'
import {
  usePrintDevices,
  useCreatePairingCode,
  useRemovePrintDevice,
  isCodeExpired,
  type PrintDeviceWithId,
} from '@/hooks/use-print-devices'

/** Ticks once a second so the code's countdown is live. Kept local to the pending row so the
 * rest of the dialog isn't re-rendered every second. */
function useCountdown(target: number | null): string | null {
  const [, force] = useState(0)
  useEffect(() => {
    if (target === null) return
    const timer = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(timer)
  }, [target])
  if (target === null) return null
  // `new Date().getTime()`, not the bare `Date.now()` — this project's established React
  // Compiler purity fix (see use-job-cards.ts). Reading the clock during render is deliberate
  // here: the interval above forces the re-render, and this is what makes the number tick.
  const remaining = Math.max(0, target - new Date().getTime())
  const m = Math.floor(remaining / 60_000)
  const s = Math.floor((remaining % 60_000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function PairingCode({ code, expiresAt }: { code: string; expiresAt: number | null }) {
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(expiresAt)
  const expired = countdown === '0:00'

  return (
    <div className="rounded-xl border border-dashed p-4 text-center">
      <p className="text-sm text-muted-foreground">
        Enter this code in the Print Agent on the shop PC:
      </p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <code className="rounded-lg bg-teal-50 px-4 py-2 font-mono text-lg font-semibold tracking-wide text-foreground dark:bg-teal-500/10">
          {code}
        </code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Copy pairing code"
          onClick={() => {
            void navigator.clipboard?.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? <Check className="size-4 text-teal-600" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <p className={cn('mt-2 text-xs', expired ? 'text-red-600' : 'text-muted-foreground')}>
        {expired ? 'Code expired — add a device again for a new one.' : `Expires in ${countdown}`}
      </p>
    </div>
  )
}

function DeviceRow({
  device,
  onRemove,
  removing,
}: {
  device: PrintDeviceWithId
  onRemove: () => void
  removing: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const now = new Date().getTime() // see the note in useCountdown
  const expired = isCodeExpired(device, now)
  // An agent heartbeats while it runs; two missed minutes means the shop PC is off or the
  // agent isn't running, which is the thing the user actually needs to see.
  const online =
    device.status === 'paired' && (device.lastSeenAt?.toMillis?.() ?? 0) > now - 2 * 60_000

  // Inline confirmation rather than a second dialog stacked on this one — the row itself turns
  // into the question, so the device being removed is never ambiguous.
  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-300 bg-red-50/60 p-3 dark:border-red-500/40 dark:bg-red-500/10">
        <Monitor className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{device.name ?? 'Waiting for a device…'}</p>
          <p className="text-xs text-muted-foreground">
            It will stop printing the next time it connects. You can pair it again with a new code.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={removing}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={removing}
          onClick={onRemove}
          className="bg-red-600 text-white hover:bg-red-700"
        >
          {removing && <Loader2 className="size-3.5 animate-spin" />}
          Remove
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
      <span className="relative shrink-0">
        <Monitor className="size-4 text-muted-foreground" />
        {online && (
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{device.name ?? 'Waiting for a device…'}</p>
        <p className="text-xs text-muted-foreground">
          {device.status === 'paired'
            ? [device.platform, device.agentVersion && `Agent ${device.agentVersion}`]
                .filter(Boolean)
                .join(' · ') || 'Paired'
            : expired
              ? 'Code expired'
              : 'Code not used yet'}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
          device.status === 'paired'
            ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
            : expired
              ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
              : 'bg-muted text-muted-foreground'
        )}
      >
        {device.status === 'paired'
          ? online
            ? 'Online'
            : 'Offline'
          : expired
            ? 'Expired'
            : 'Pending'}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove ${device.name ?? 'pending device'}`}
        className="text-red-600"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

export function PrintDevicesDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: devices = [], isLoading, error: loadError, refetch } = usePrintDevices()
  const createCode = useCreatePairingCode()
  const remove = useRemovePrintDevice()
  const [removingId, setRemovingId] = useState<string | null>(null)

  // The newest pending row is the one whose code is on screen.
  const pending = devices.find((d) => d.status === 'pending' && !isCodeExpired(d))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="gap-4">
        <div>
          <DialogTitle className="text-lg">Print Devices</DialogTitle>
          <DialogDescription className="mt-1">
            Shop PCs running the Print Agent. Pair one to let it print bills and labels from this
            browser.
          </DialogDescription>
        </div>

        {pending && (
          <PairingCode
            code={pending.pairingCode}
            expiresAt={pending.codeExpiresAt?.toMillis?.() ?? null}
          />
        )}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : loadError ? (
          <ErrorState
            error={loadError}
            onRetry={() => void refetch()}
            title="Couldn't load your print devices"
          />
        ) : devices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No print device paired yet.
          </p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <DeviceRow
                key={d.id}
                device={d}
                removing={removingId === d.id}
                onRemove={async () => {
                  setRemovingId(d.id)
                  try {
                    await remove.mutateAsync(d.id)
                  } finally {
                    setRemovingId(null)
                  }
                }}
              />
            ))}
          </div>
        )}

        <Button
          type="button"
          className="w-full"
          disabled={createCode.isPending}
          onClick={() => createCode.mutate()}
        >
          {createCode.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Add device
        </Button>
      </DialogContent>
    </Dialog>
  )
}
