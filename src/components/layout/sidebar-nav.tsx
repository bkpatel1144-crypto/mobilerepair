import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Lock } from 'lucide-react'
import {
  DASHBOARD_NAV,
  DASHBOARD_MENU_KEY,
  NAV_SECTIONS,
  buildPath,
  menuKey,
  type NavSection,
} from '@/config/nav'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  /** Icon-only rail mode (desktop collapse). Never true in the mobile sheet. */
  collapsed?: boolean
  /** Expands the section back out of collapsed mode when a section icon is clicked while
   * collapsed — there's nowhere to show sub-items otherwise. */
  onExpandRequest?: () => void
  onNavigate?: () => void
  /** Text from the sidebar's own search box. Matches section and leaf labels. */
  filter?: string
}

/**
 * Accordion behavior matches every screenshot in SCREENS_NOTES.md: expanding one section
 * always collapses whichever was open before — never two sections open at once. Defaults to
 * whichever section contains the current route, so a page refresh doesn't collapse context.
 *
 * Every section/leaf is filtered through `usePermissions()` — BUILD_PLAN.md Phase 3 requires
 * items to *actually disappear* for a role without access, not just be styled differently.
 * A locked (not-yet-built) leaf is a separate concept from a permission and still renders,
 * disabled, for any role that can otherwise see its section.
 */
export function SidebarNav({ collapsed, onExpandRequest, onNavigate, filter }: SidebarNavProps) {
  const location = useLocation()
  const { canView, isLoading } = usePermissions()
  const initialOpen = NAV_SECTIONS.find((s) =>
    s.children.some((c) => location.pathname === buildPath(s.key, c.slug))
  )?.key
  const [openSection, setOpenSection] = useState<string | undefined>(initialOpen)

  const q = (filter ?? '').trim().toLowerCase()
  const filtering = q.length > 0
  const matches = (text: string) => text.toLowerCase().includes(q)
  // While searching, a section shows if it matches by name (all its leaves stay visible, so you
  // can see what's in it) or if any leaf matches (only the matching leaves show). Sections are
  // force-expanded so results are actually readable without a second click on each one.
  const leafMatches = (section: NavSection, leafLabel: string) =>
    !filtering || matches(section.label) || matches(leafLabel)

  function handleSectionClick(section: NavSection) {
    if (collapsed) {
      onExpandRequest?.()
      setOpenSection(section.key)
      return
    }
    setOpenSection((prev) => (prev === section.key ? undefined : section.key))
  }

  if (isLoading) {
    return (
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {canView(DASHBOARD_MENU_KEY) && (!filtering || matches(DASHBOARD_NAV.label)) && (
        <NavItem
          to="/app/dashboard"
          icon={DASHBOARD_NAV.icon}
          label={DASHBOARD_NAV.label}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      )}

      {NAV_SECTIONS.map((section) => {
        // A locked leaf rides along with a section the role can *already* see for some other
        // (real, unlocked) reason — it must never be the sole reason a section appears. Every
        // section currently has at least one unlocked leaf, so this can't hide a section
        // entirely for a role that's actually supposed to see it; it only stops a role with
        // zero genuine permissions in, say, Finance from getting a "Finance" header in their
        // sidebar for nothing but its two not-yet-built placeholder pages.
        const hasRealAccess = section.children.some(
          (leaf) => !leaf.locked && canView(menuKey(section.key, leaf.slug))
        )
        const visibleChildren = (
          hasRealAccess
            ? section.children.filter(
                (leaf) => leaf.locked || canView(menuKey(section.key, leaf.slug))
              )
            : []
        ).filter((leaf) => leafMatches(section, leaf.label))
        if (visibleChildren.length === 0) return null

        // Searching forces every surviving section open — a list of collapsed section headers
        // is not a search result, and the accordion's one-at-a-time rule would hide all but one
        // match anyway.
        const isOpen = (filtering || openSection === section.key) && !collapsed
        const Icon = section.icon
        const sectionButton = (
          <button
            type="button"
            onClick={() => handleSectionClick(section)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate text-left">{section.label}</span>
                <ChevronDown
                  className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                />
              </>
            )}
          </button>
        )

        return (
          <div key={section.key}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger render={sectionButton} />
                <TooltipContent side="right">{section.label}</TooltipContent>
              </Tooltip>
            ) : (
              sectionButton
            )}
            {isOpen && (
              <div className="mt-0.5 mb-1 ml-4 flex flex-col gap-0.5 border-l pl-2.5">
                {visibleChildren.map((leaf) =>
                  leaf.locked ? (
                    <div
                      key={leaf.slug}
                      className="flex cursor-not-allowed items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground/60"
                      title="Not available yet"
                    >
                      <Lock className="size-3.5 shrink-0" />
                      <span className="truncate">{leaf.label}</span>
                    </div>
                  ) : (
                    <NavLeafLink
                      key={leaf.slug}
                      to={buildPath(section.key, leaf.slug)}
                      label={leaf.label}
                      onNavigate={onNavigate}
                    />
                  )
                )}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function NavItem({
  to,
  icon: Icon,
  label,
  collapsed,
  onNavigate,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const link = (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] font-medium transition-colors',
          collapsed && 'justify-center px-0',
          // A filled pill rather than the old 2px left border: the border read as a separate
          // marker stuck to the edge, while the pill reads as the row itself being selected.
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="size-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{label}</span>
              {isActive && <span className="size-1.5 shrink-0 rounded-full bg-current" />}
            </>
          )}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

function NavLeafLink({
  to,
  label,
  onNavigate,
}: {
  to: string
  label: string
  onNavigate?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
          isActive
            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Bullet dot before the active leaf's label — matches the reference sidebar's
           * "• Backup & Restore" marker on the currently-selected sub-item. */}
          {isActive && <span className="size-1.5 shrink-0 rounded-full bg-teal-600" />}
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}
