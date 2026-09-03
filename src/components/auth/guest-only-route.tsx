import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { RouteFallback } from '@/components/shared/route-fallback'

/** Guards `/login`, `/signup`, `/forgot-password` — bounces an already-signed-in user straight
 * to the dashboard rather than showing them a login form again.
 *
 * Gates on `profileLoading`, not just `user`: Firebase Auth signs a new account in (flipping
 * `user`) the moment `createUserWithEmailAndPassword` resolves, which is well before signUp()'s
 * own multi-document Firestore batch (company/branch/roles/profile) has committed. Redirecting
 * on bare `user` truthiness used to yank the signup form away mid-write, landing the new Owner
 * on a dashboard whose permissions hadn't loaded yet — and, worse, put them one hard-reload away
 * from navigating off the very page whose still-running JS was the only thing waiting on that
 * write. Waiting for `profileLoading` to clear keeps them here (the signup form already shows
 * its own "Creating account…" pending state) until there's an actual profile to route them to.
 */
export function GuestOnlyRoute() {
  const { user, loading, profileLoading } = useAuth()

  if (loading) return <RouteFallback />
  if (user && profileLoading) return <RouteFallback />
  if (user) return <Navigate to="/app/dashboard" replace />

  return <Outlet />
}
