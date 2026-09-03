import { SidebarNav } from '@/components/layout/sidebar-nav'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  collapsed: boolean
  onExpandRequest: () => void
}

/** Desktop-only fixed sidebar (md and up — the mobile equivalent is a Sheet, see
 * mobile-sidebar.tsx). Collapses to an icon-only rail rather than disappearing entirely, so
 * navigation never requires re-opening a drawer on a desktop-sized screen. */
export function AppSidebar({ collapsed, onExpandRequest }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r bg-sidebar transition-[width] duration-150 md:flex',
        collapsed ? 'w-16' : 'w-[250px]'
      )}
    >
      <SidebarNav collapsed={collapsed} onExpandRequest={onExpandRequest} />
      {!collapsed && (
        <div className="border-t p-3 text-center text-xs text-muted-foreground">© 2025 ERP Pro</div>
      )}
    </aside>
  )
}
