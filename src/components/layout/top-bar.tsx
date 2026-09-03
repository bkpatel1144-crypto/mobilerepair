import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Maximize,
  Minimize,
  Moon,
  Sun,
  Languages,
  Bell,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useBreadcrumbExtraValue } from '@/contexts/breadcrumb-context'
import { getInitials } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/hooks/use-auth'
import { findNavEntry } from '@/config/nav'
import { EmptyState } from '@/components/shared/empty-state'

interface TopBarProps {
  onMenuClick: () => void
  onSearchClick: () => void
}

export function TopBar({ onMenuClick, onSearchClick }: TopBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { profile, logOut } = useAuth()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const entry = findNavEntry(location.pathname)
  const breadcrumbExtra = useBreadcrumbExtraValue()

  async function handleLogOut() {
    await logOut()
    navigate('/login', { replace: true })
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    } else {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 sm:px-4">
      <Button variant="ghost" size="icon-sm" onClick={onMenuClick} aria-label="Toggle navigation">
        <Menu className="size-5" />
      </Button>

      <Link to="/app/dashboard" className="text-base font-bold">
        aim
      </Link>

      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/app/dashboard" />}>Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {entry?.section && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{entry.section.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {entry?.leaf && entry.section && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{entry.leaf.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {/* A page-set crumb (a job's own number, a role's own name) wins over the raw url
           * segment `findNavEntry` would otherwise humanize — see breadcrumb-context.ts.
           * `Boolean(...)`, not a bare `||` — `entry.extraCrumbs.length` is `0` (a real, falsy
           * *number*) on every leaf page with no extra crumb, and `0 && x` short-circuits to
           * that `0` itself rather than `false`; React renders a lone `0` as a text node instead
           * of nothing, since `0` (unlike `false`/`null`/`undefined`) is a valid JSX child. This
           * silently put a stray "0" after the page title in the breadcrumb of nearly every
           * screen in the app — caught only now, via a side-by-side screenshot review. */}
          {Boolean(breadcrumbExtra || entry?.extraCrumbs?.length) && entry?.leaf && entry.section && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{breadcrumbExtra ?? entry.extraCrumbs.join(' / ')}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onSearchClick}
          className="hidden items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted sm:flex"
        >
          <Search className="size-4" />
          <span>Search...</span>
          <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            Ctrl K
          </kbd>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onSearchClick}
          className="sm:hidden"
          aria-label="Search"
        >
          <Search className="size-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleFullscreen}
          className="hidden sm:inline-flex"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize className="size-4.5" /> : <Maximize className="size-4.5" />}
        </Button>

        <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden sm:inline-flex"
                aria-label="Language"
              />
            }
          >
            <Languages className="size-4.5" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 text-sm text-muted-foreground">
            Multi-language support is coming soon.
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Notifications" />}
          >
            <Bell className="size-4.5" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0">
            <EmptyState icon={Bell} title="No notifications yet" className="py-8" />
          </PopoverContent>
        </Popover>

        {/* Skeleton while the profile doc is still loading (brand new session, or the brief
         * gap right after signup while the seeding batch commits) — an honest "not loaded
         * yet" state, never fake data. */}
        {profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="ml-1 flex items-center gap-2 rounded-md pl-1 hover:bg-muted"
                />
              }
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                {getInitials(profile.fullName)}
              </span>
              <div className="hidden flex-col items-start md:flex">
                <span className="max-w-32 truncate text-sm font-medium">{profile.fullName}</span>
                <span className="text-xs text-muted-foreground">{profile.roleName}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Base UI requires GroupLabel (DropdownMenuLabel) to live inside a Menu.Group
               * (DropdownMenuGroup) — unlike the classic Radix-based shadcn recipe, where a
               * bare Label needed no wrapper. Omitting it throws "MenuGroupContext is missing"
               * and crashes the whole menu the moment it opens; caught here via a real
               * browser test against this exact TopBar. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">{profile.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <UserIcon />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="ml-1 flex items-center gap-2 pl-1">
            <Skeleton className="size-8 rounded-full" />
            <div className="hidden flex-col gap-1 md:flex">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
