import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** e.g. "Draft saved 05:30 AM" / "Saved 05:27 AM" — the autosave indicator pattern used in
   * nearly every create/edit modal in the reference app. */
  autosaveLabel?: string
  onClear?: () => void
  clearLabel?: string
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  submitDisabled?: boolean
  className?: string
}

/** Centered on desktop, full-screen on mobile (BUILD_PLAN.md's mobile-first rule for modals).
 * `children` is just the field layout — this component owns the header, autosave/clear row,
 * and the Cancel/submit footer so every create/edit form in the app looks the same. */
export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  autosaveLabel,
  onClear,
  clearLabel = 'Clear',
  children,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting,
  submitDisabled,
  className,
}: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'inset-0 top-0 left-0 h-full max-w-full translate-x-0 translate-y-0 overflow-y-auto rounded-none',
          'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription className="mt-1">{description}</DialogDescription>}
          </div>
          {(autosaveLabel || onClear) && (
            <div className="mr-6 flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              {autosaveLabel && <span>{autosaveLabel}</span>}
              {onClear && (
                <button type="button" onClick={onClear} className="underline hover:text-foreground">
                  {clearLabel}
                </button>
              )}
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="contents">
          <div className="space-y-4">{children}</div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting || submitDisabled}>
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
