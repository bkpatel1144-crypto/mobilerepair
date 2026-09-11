import { CloudOff, WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/**
 * The strip across the top of the app when the connection has gone.
 *
 * Not a toast: a toast is gone in four seconds, and being offline is a state that lasts. It says
 * what still works as well as what does not, because "You're offline" on its own reads as "the
 * app is dead" when in fact every screen already loaded still opens — Firestore's persistent
 * cache is on.
 */
export function OfflineBanner() {
  const online = useOnlineStatus()
  const { t } = useTranslation()
  if (online) return null

  return (
    <div
      role="status"
      className="flex items-start gap-2 border-b border-amber-300 bg-amber-100 px-3 py-2 text-sm text-amber-900 sm:px-4 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200"
    >
      <CloudOff className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0">
        <span className="font-semibold">{t('shared.offlineTitle')}</span>{' '}
        <span className="opacity-90">{t('shared.offlineExplained')}</span>
      </p>
    </div>
  )
}

/** The same state as a compact chip, for the top bar where the banner would be too much. */
export function OfflineChip({ className }: { className?: string }) {
  const online = useOnlineStatus()
  const { t } = useTranslation()
  if (online) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
        className
      )}
    >
      <WifiOff className="size-3" />
      {t('shared.offline')}
    </span>
  )
}

/**
 * Shown on a form whose save cannot work without a connection, so it is known before the form is
 * filled in rather than after Save is pressed.
 */
export function OfflineNotice({ className }: { className?: string }) {
  const online = useOnlineStatus()
  const { t } = useTranslation()
  if (online) return null

  return (
    <p
      role="status"
      className={cn(
        'flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-300',
        className
      )}
    >
      <WifiOff className="mt-0.5 size-4 shrink-0" />
      <span>{t('shared.offlineCannotCreate')}</span>
    </p>
  )
}
