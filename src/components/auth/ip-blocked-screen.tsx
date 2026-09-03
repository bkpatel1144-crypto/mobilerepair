import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

/** Shown by `ProtectedRoute` in place of the app shell when `useIpAccessCheck()` reports the
 * current (non-Owner) session's detected IP doesn't match the company's active IP Whitelist.
 * Deliberately upfront about this being advisory (see `ip-enforcement.ts`) rather than presenting
 * it as an unbreakable wall — an Owner can always fix the whitelist from a trusted network. */
export function IpBlockedScreen({ ip }: { ip: string | null }) {
  const { logOut } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
        <ShieldAlert className="size-7" />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Access blocked from this network</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account's role requires signing in from a whitelisted IP address.
          {ip ? ` Your current IP (${ip}) isn't on the list.` : ' Your current IP could not be detected.'}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Ask an Owner to add your IP under Administration → IP Whitelist, or connect from an
          already-whitelisted network.
        </p>
      </div>
      <Button type="button" variant="outline" onClick={() => logOut()}>
        Sign Out
      </Button>
    </div>
  )
}
