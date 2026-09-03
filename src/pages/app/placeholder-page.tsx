import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import type { LucideIcon } from 'lucide-react'

interface PlaceholderPageProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  phase: string
}

/** Every sidebar destination routes somewhere real today, even before its module is built —
 * this is that "somewhere", so navigation, breadcrumbs, and the sidebar's active state are all
 * fully wired and demonstrable from Phase 1 on. Feature phases replace this with the real page,
 * they don't add a new route. */
export function PlaceholderPage({ icon: Icon, title, subtitle, phase }: PlaceholderPageProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader icon={Icon} title={title} subtitle={subtitle} />
      <div className="rounded-lg border border-dashed">
        <EmptyState
          icon={Construction}
          title={`${title} is built in ${phase}`}
          description="See BUILD_PLAN.md for what this screen will do and which reference screenshots it must match."
        />
      </div>
    </div>
  )
}
