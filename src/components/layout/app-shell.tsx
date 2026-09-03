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
      <div className="flex h-dvh flex-col">
        <TopBar onMenuClick={handleMenuClick} onSearchClick={() => setCommandOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar collapsed={collapsed} onExpandRequest={() => setCollapsed(false)} />
          <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    </BreadcrumbExtraProvider>
  )
}
