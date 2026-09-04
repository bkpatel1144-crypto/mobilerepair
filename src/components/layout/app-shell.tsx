import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { CommandPalette } from '@/components/layout/command-palette'
import { BreadcrumbExtraProvider } from '@/contexts/breadcrumb-provider'
import { useIsMobile } from '@/hooks/use-media-query'
import { useSessionHeartbeat } from '@/hooks/use-sessions'

export function AppShell() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  // Keeps this session's own `lastActivityAt` moving forward while the app shell stays mounted —
  // see the hook's own doc comment. Every authenticated screen renders under this shell, so one
  // call here covers Active Sessions' "Currently Online" stat for the whole app.
  useSessionHeartbeat()

  function handleMenuClick() {
    if (isMobile) setMobileOpen((o) => !o)
    else setCollapsed((c) => !c)
  }

  return (
    <BreadcrumbExtraProvider>
      {/* Sidebar is a full-height column *beside* the header, not underneath it — the header
       * used to span the full width with the wordmark and hamburger in it, which is not how the
       * reference app is built (see SCREENS_NOTES.md's capture: the sidebar owns the wordmark,
       * its own collapse toggle and a nav search, and runs floor to ceiling). */}
      <div className="flex h-dvh overflow-hidden">
        <AppSidebar
          collapsed={collapsed}
          onExpandRequest={() => setCollapsed(false)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
        <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
        {/* `min-w-0`: without it this flex child floors at its content's min-content width, so a
         * wide table inside a page would push the whole column out and scroll the app sideways
         * instead of scrolling within its own container. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={handleMenuClick} onSearchClick={() => setCommandOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    </BreadcrumbExtraProvider>
  )
}
