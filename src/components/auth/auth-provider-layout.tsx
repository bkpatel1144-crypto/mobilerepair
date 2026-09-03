import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/contexts/auth-provider'

/**
 * Exists purely so `AuthProvider` (and everything it pulls in — the Firebase SDK, by way of
 * `@/lib/auth` / `@/lib/firebase`) can be lazy-loaded as one unit in App.tsx. Firebase has no
 * business being in the marketing site's (`/`, `/pricing`) initial bundle; only the auth pages
 * and the authenticated app shell actually need it.
 */
export function AuthProviderLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
