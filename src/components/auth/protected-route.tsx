import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useIpAccessCheck } from '@/hooks/use-ip-whitelist'
import { RouteFallback } from '@/components/shared/route-fallback'
import { IpBlockedScreen } from '@/components/auth/ip-blocked-screen'
import { AccountDisabledScreen } from '@/components/auth/account-disabled-screen'

/** Guards `/app/*` — redirects to `/login` (preserving the attempted destination) if signed
 * out. Waits for the *first* auth-state resolution before deciding anything, so a page reload
 * on a persisted session never flashes a redirect to /login before bouncing back.
 *
 * Also redirects to `/complete-setup` for a signed-in user whose profile doc is confirmed
 * absent (`profileLoading` false, `profile` still null) — `profileLoading` only clears this way
 * once `auth-provider.tsx`'s full retry budget has genuinely given up, not while a fresh
 * signup's write is still plausibly in flight, so this doesn't fire for the ordinary "just
 * loading" case. */
export function ProtectedRoute() {
  const { user, loading, profile, profileLoading } = useAuth()
  const { blocked, myIp } = useIpAccessCheck()
  const location = useLocation()

  if (loading) return <RouteFallback />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (profileLoading) return <RouteFallback />
  if (!profile && location.pathname !== '/complete-setup') {
    return <Navigate to="/complete-setup" replace />
  }
  // Backstop for a race `logIn()`'s own disabled-account check can lose: Firebase Auth flips
  // global auth state (and `GuestOnlyRoute`'s reactive redirect here) the instant credentials
  // check out, which can beat `logIn()`'s own async profile-status read and sign-out — see
  // `AccountDisabledScreen`'s own doc comment. Checking `profile.status` directly here means the
  // app shell itself is never rendered for a disabled account regardless of which check wins.
  if (profile && profile.status === 'disabled') return <AccountDisabledScreen />
  // Advisory-only IP Whitelist gate (see `ip-enforcement.ts`) — checked continuously, not just
  // at login, so a mid-session whitelist change or network switch takes effect without a
  // sign-out/sign-in round trip. Never applies to an Owner (`useIpAccessCheck` itself exempts
  // that role) — a misconfigured whitelist can never lock a company's own admin out.
  if (profile && blocked) return <IpBlockedScreen ip={myIp} />

  return <Outlet />
}
