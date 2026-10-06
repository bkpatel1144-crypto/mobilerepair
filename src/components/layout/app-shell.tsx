import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { CommandPalette } from '@/components/layout/command-palette'
import { BreadcrumbExtraProvider } from '@/contexts/breadcrumb-provider'
import { useIsMobile } from '@/hooks/use-media-query'
import { useSessionHeartbeat } from '@/hooks/use-sessions'
import { OfflineBanner } from '@/components/shared/offline-banner'

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

  /**
   * The application owns the viewport; the window must never scroll.
   *
   * The shell is `h-dvh overflow-hidden` with the content pane scrolling inside it, and every
   * box in that chain measures correctly — shell 900, column 900, main 844 with
   * `overflow-y: auto`. The document still gained 166px and scrolled, so you could scroll the
   * whole application off the top of the screen and land on blank page, which is what it
   * looked like: a sidebar cut off partway down with white underneath.
   *
   * I could not find the element contributing that height — nothing unclipped reaches past the
   * viewport, and hiding the content column removes it. Rather than keep guessing, this states
   * the invariant the layout already depends on in the one place that can enforce it: while the
   * shell is mounted, the root does not scroll. Scoped to an attribute and removed on unmount,
   * because the marketing site in the same document very much does scroll.
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-app-shell', '')
    return () => document.documentElement.removeAttribute('data-app-shell')
  }, [])

  return (
    <BreadcrumbExtraProvider>
      {/* Sidebar is a full-height column *beside* the header, not underneath it — the header
       * used to span the full width with the wordmark and hamburger in it, which is not how the
       * reference app is built (see SCREENS_NOTES.md's capture: the sidebar owns the wordmark,
       * its own collapse toggle and a nav search, and runs floor to ceiling). */}
      <div data-chrome-surface="shell" className="flex h-dvh overflow-hidden">
        <AppSidebar
          collapsed={collapsed}
          onExpandRequest={() => setCollapsed(false)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
        <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
        {/* `min-w-0`: without it this flex child floors at its content's min-content width, so a
         * wide table inside a page would push the whole column out and scroll the app sideways
         * instead of scrolling within its own container. */}
        {/* `min-h-0` is as load-bearing here as `min-w-0`, and for the mirrored reason.
         *
         * A flex child's `min-height` defaults to `auto`, which means "never shrink below your
         * content". So this column grew to whatever the page inside it needed, `main`'s
         * `overflow-y-auto` never had a constrained height to scroll within, and the document
         * itself scrolled instead — past the end of the application, onto blank page. On a long
         * job card the shell ended partway down and the rest of the screen was empty white.
         *
         * `min-w-0` was already here for the horizontal version of exactly this. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={handleMenuClick} onSearchClick={() => setCommandOpen(true)} />
          {/* Above the scroll container, so it stays put rather than scrolling away from someone
           * who is about to press Save on a form that cannot work. */}
          <OfflineBanner />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      </div>
    </BreadcrumbExtraProvider>
  )
}
