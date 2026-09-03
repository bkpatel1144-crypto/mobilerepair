import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button for anything that deletes/reverses/locks someone out — the default,
   * since every call site of this component is exactly that kind of action. Set `false` for a
   * confirm that isn't itself dangerous (e.g. "this changes what every print button emits"). */
  destructive?: boolean
  isPending?: boolean
  onConfirm: () => void
}

/** The one "Are you sure?" dialog every delete/void/cancel/deactivate/lock action in the app
 * routes through (Phase 11) — a real, if last-minute, catch for a fat-fingered click before
 * something irreversible (most `useDelete*` hooks are hard Firestore deletes, not soft ones)
 * or hard-to-undo (voiding a receipt, deactivating a teammate's account, activating a different
 * financial year) actually happens. Deliberately not `FormModal`: that component requires a
 * `children` field layout and a `<form>`/`type="submit"` wrapper neither of which a bare
 * confirmation needs — this one is just title + message + Cancel/Confirm, sized like a normal
 * centered dialog rather than FormModal's mobile-fullscreen sheet. `Restore Live Data` (Settings
 * → Backup & Restore) is the one exception in the app that needs a *stronger* confirm than this
 * (typing a literal phrase) and keeps its own bespoke modal for that reason. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  isPending,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Please wait…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
