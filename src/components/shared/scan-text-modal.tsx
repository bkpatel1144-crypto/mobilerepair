import { QrCode, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CameraScanFrame } from '@/components/shared/camera-scan-frame'

interface ScanTextModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onScanned: (text: string) => void
}

/** Real camera-based barcode/QR scanner for a single text field — IMEI, Serial No — that fills
 * the field with whatever it decodes and closes, rather than the honest-but-fake "just focuses
 * the input" stub this replaced. Shares its camera/decode plumbing with `ScanJobCardModal` via
 * `CameraScanFrame`; the only difference is what happens with the decoded text. */
export function ScanTextModal({ open, onOpenChange, title, description, onScanned }: ScanTextModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
              <QrCode className="size-5" />
            </span>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && (
          <CameraScanFrame
            key={open ? 'open' : 'closed'}
            onDecode={(text) => {
              onScanned(text)
              onOpenChange(false)
            }}
          />
        )}

        <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
          <X className="size-4" />
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
