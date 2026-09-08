import { ShieldAlert } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { EmptyState } from '@/components/shared/empty-state'
import { RouteFallback } from '@/components/shared/route-fallback'
import { useTranslation } from 'react-i18next'

interface RequireMenuAccessProps {
  menuKey: string
  children: React.ReactNode
}

/**
 * The route-level half of RBAC enforcement — `SidebarNav` hiding an item is a UX nicety, not a
 * security boundary. Someone who types the URL directly (or a role that changes while they're
 * already on the page) must be blocked here too. Firestore rules are the real backstop for
 * data access; this just stops the page from rendering at all.
 */
export function RequireMenuAccess({ menuKey, children }: RequireMenuAccessProps) {
  const { t } = useTranslation()
  const { canView, isLoading } = usePermissions()

  if (isLoading) return <RouteFallback />

  if (!canView(menuKey)) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={ShieldAlert}
          title={t('components.auth.requireMenuAccess.youDonTHaveAccessTo')}
          description={t('components.auth.requireMenuAccess.askAnOwnerOrAdministratorTo')}
        />
      </div>
    )
  }

  return <>{children}</>
}
