import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PanelLeft, Search } from 'lucide-react'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useCompany } from '@/hooks/use-company'
import { Skeleton } from '@/components/ui/skeleton'

interface AppSidebarProps {
  collapsed: boolean
  onExpandRequest: () => void
  onToggleCollapse: () => void
}

/**
 * Desktop-only fixed sidebar (md and up — the mobile equivalent is a Sheet, see
 * mobile-sidebar.tsx). Collapses to an icon-only rail rather than disappearing entirely, so
 * navigation never requires re-opening a drawer on a desktop-sized screen.
 *
 * Owns the "aim" wordmark, the collapse toggle and the nav search, all of which the reference
 * app puts *inside* the sidebar rather than in the top bar (see SCREENS_NOTES.md's own capture
 * of this screen). That also means the sidebar is a full-height column with the header sitting
 * beside it, not underneath it — see `app-shell.tsx`.
 */
export function AppSidebar({ collapsed, onExpandRequest, onToggleCollapse }: AppSidebarProps) {
  const { t } = useTranslation()
  const { data: company, isLoading } = useCompany()
  const [filter, setFilter] = useState('')

  const toggle = (
    <Button
      variant="ghost"
      size="icon-sm"
      className="shrink-0"
      onClick={onToggleCollapse}
      aria-label={collapsed ? 'Expand sidebar' : t('components.layout.appSidebar.collapseSidebar')}
      aria-expanded={!collapsed}
    >
      <PanelLeft className="size-4.5" />
    </Button>
  )

  return (
    <aside
      className={cn(
        'hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-150 md:flex',
        collapsed ? 'w-16' : 'w-[270px]'
      )}
    >
      {/* Company name + collapse toggle. Collapsed, the name gives way so the toggle can centre
       * in the rail — otherwise the two fight over 64px and both end up clipped.
       *
       * The name comes from the *active* company: `auth-provider` rewrites `profile.companyId`
       * to whichever company the user has switched into, so this follows a switch without any
       * extra wiring. Falls back to the "aim" wordmark only before the company has loaded or if
       * there genuinely isn't one — never to an empty header. */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-2 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <Link
            to="/app/dashboard"
            // `min-w-0` is what makes `truncate` work here: without it the flex item refuses to
            // shrink below its content and a long shop name pushes the toggle off the rail.
            className="min-w-0 text-lg font-bold tracking-tight"
            title={company?.name ?? undefined}
          >
            {isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <span className="block truncate">{company?.name ?? t('shell.appName')}</span>
            )}
          </Link>
        )}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={toggle} />
            <TooltipContent side="right">
              {t('components.layout.appSidebar.expandSidebar')}
            </TooltipContent>
          </Tooltip>
        ) : (
          toggle
        )}
      </div>

      {/* Nav search. Hidden in the rail — there is nowhere to show results, and clicking the
       * magnifier to expand first would be a worse affordance than the section icons already
       * sitting right there. */}
      {!collapsed && (
        <div className="shrink-0 px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('shared.search')}
              aria-label={t('shared.searchNavigation')}
              className="h-10 rounded-full border-sidebar-border bg-background pl-9"
            />
          </div>
        </div>
      )}

      <SidebarNav collapsed={collapsed} onExpandRequest={onExpandRequest} filter={filter} />

      {!collapsed && (
        <div className="shrink-0 border-t p-3 text-center text-xs text-muted-foreground">
          © 2025 ERP Pro
        </div>
      )}
    </aside>
  )
}
