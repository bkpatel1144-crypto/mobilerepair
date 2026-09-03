import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, AlertCircle, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CameraScanFrame } from '@/components/shared/camera-scan-frame'
import { useAuth } from '@/hooks/use-auth'
import { findJobCardIdByNumber, extractJobNumberOrId } from '@/lib/job-card-lookup'
import { buildPath } from '@/config/nav'

interface ScanJobCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Real camera-based QR scanner for jumping straight to a job card by its printed label (see
 * BUILD_PLAN.md's Print Label / Barcode Label formats) — decodes with `jsqr` (`CameraScanFrame`)
 * against a live video feed, not a decorative stand-in. Matches the reference app's own copy
 * ("Just point — it auto-focuses, zooms and locks on instantly") and camera-unavailable state.
 */
export function ScanJobCardModal({ open, onOpenChange }: ScanJobCardModalProps) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null)
  const lookupInFlight = useRef(false)

  // Not wrapped in `useCallback` — this project's React Compiler auto-memoizes based on actual
  // usage (`profile` as a whole), which previously conflicted with a narrower manual dep array
  // (`profile?.companyId`) and made the compiler bail out of optimizing this component entirely.
  function handleDecode(text: string) {
    if (lookupInFlight.current) return
    lookupInFlight.current = true
    setNotFoundCode(null)
    void (async () => {
      const { jobNumber, rawId } = extractJobNumberOrId(text)
      let id = rawId ?? null
      if (!id && jobNumber && profile?.companyId) {
        id = await findJobCardIdByNumber(profile.companyId, jobNumber)
      }
      if (id) {
        onOpenChange(false)
        navigate(`${buildPath('service', 'job-cards')}/${id}`)
      } else {
        setNotFoundCode(jobNumber ?? text)
      }
      lookupInFlight.current = false
    })()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setNotFoundCode(null)
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
              <QrCode className="size-5" />
            </span>
            <div>
              <DialogTitle>Scan Job Card</DialogTitle>
              <DialogDescription>
                Just point — it auto-focuses, zooms and locks on instantly
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && (
          <div className="relative">
            <CameraScanFrame key={open ? 'open' : 'closed'} onDecode={handleDecode} />
            {notFoundCode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black px-4 text-center text-white">
                <AlertCircle className="size-8 text-amber-500" />
                <p className="font-medium">No job card found</p>
                <p className="text-sm text-white/70">
                  "{notFoundCode}" doesn't match any job card. Point at the label again.
                </p>
              </div>
            )}
          </div>
        )}

        <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
          <X className="size-4" />
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
