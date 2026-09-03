import { UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

/** Shown by `ProtectedRoute` in place of the app shell for a `status: 'disabled'` account.
 *
 * This is the backstop for the exact same race `IpBlockedScreen` already guards against:
 * `signInWithEmailAndPassword` flips Firebase's global auth state (and `GuestOnlyRoute`'s own
 * reactive redirect to `/app/dashboard`) the instant credentials check out — *before* `logIn()`'s
 * own async profile-status check gets a chance to run and reject the attempt from the login form
 * itself. Without this, a disabled account could catch a real, if brief, glimpse of the app shell
 * on a fast connection. `ProtectedRoute` checking `profile.status` directly means the app content
 * itself is never rendered for a disabled account regardless of which check "wins" that race —
 * matches BUILD_PLAN.md's own "gated both client-side and server-side, never one without the
 * other" bar (see `firestore.rules`' `belongsToCompany()` for the matching server-side half). */
export function AccountDisabledScreen() {
  const { logOut } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
        <UserX className="size-7" />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">This account has been disabled</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Contact your Owner or Administrator if you believe this is a mistake.
        </p>
      </div>
      <Button type="button" variant="outline" onClick={() => logOut()}>
        Sign Out
      </Button>
    </div>
  )
}
