import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PanelLeft, Search } from 'lucide-react'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

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
  const [filter, setFilter] = useState('')

  const toggle = (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onToggleCollapse}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!collapsed}
    >
      <PanelLeft className="size-4.5" />
    </Button>
  )

  return (
    <aside
      className={cn(
        'hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-150 md:flex',
        collapsed ? 'w-16' : 'w-[250px]'
      )}
    >
      {/* Wordmark + collapse toggle. Collapsed, the wordmark gives way so the toggle can centre
       * in the rail — otherwise the two fight over 64px and both end up clipped. */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2 border-b px-3',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <Link to="/app/dashboard" className="text-base font-bold tracking-tight">
            aim
          </Link>
        )}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={toggle} />
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        ) : (
          toggle
        )}
      </div>

      {/* Nav search. Hidden in the rail — there is nowhere to show results, and clicking the
       * magnifier to expand first would be a worse affordance than the section icons already
       * sitting right there. */}
      {!collapsed && (
        <div className="shrink-0 px-3 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search..."
              aria-label="Search navigation"
              className="h-8 bg-background pl-8"
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
