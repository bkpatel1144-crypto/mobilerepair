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
  ShieldCheck,
  Building2,
  CreditCard,
  Check,
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
import { getInitials, cn } from '@/lib/utils'
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
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/hooks/use-language'
import { LANGUAGES } from '@/lib/i18n'
import { useAuth } from '@/hooks/use-auth'
import { findNavEntry, buildPath } from '@/config/nav'
import { useCompany } from '@/hooks/use-company'
import { useCompanies, useSwitchCompany } from '@/hooks/use-companies'
import { usePermissions } from '@/hooks/use-permissions'
import { ProfileDrawer } from '@/components/layout/profile-drawer'
import { EmptyState } from '@/components/shared/empty-state'

interface TopBarProps {
  onMenuClick: () => void
  onSearchClick: () => void
}

export function TopBar({ onMenuClick, onSearchClick }: TopBarProps) {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { profile, logOut } = useAuth()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { data: company } = useCompany()
  const { data: companies = [] } = useCompanies()
  const switchCompany = useSwitchCompany()
  const { canView } = usePermissions()

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
      {/* Mobile only. On desktop the sidebar is always present and carries its own collapse
       * toggle, so a second nav control up here was redundant; the wordmark moved into the
       * sidebar with it, matching the reference. */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <Link to="/app/dashboard" className="text-base font-bold md:hidden">
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
          {Boolean(breadcrumbExtra || entry?.extraCrumbs?.length) &&
            entry?.leaf &&
            entry.section && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {breadcrumbExtra ?? entry.extraCrumbs.join(' / ')}
                  </BreadcrumbPage>
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

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={t('shell.toggleTheme')}
        >
          {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden sm:inline-flex"
                aria-label={t('shell.language')}
              />
            }
          >
            <Languages className="size-4.5" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{t('shell.languageHint')}</p>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => void setLanguage(l.code)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent',
                  language === l.code && 'bg-accent font-medium'
                )}
              >
                {/* Each language is named in its own script: someone who has landed in the wrong
                 * language cannot read "Gujarati" to get back out of it, but can read
                 * "ગુજરાતી". */}
                <span className="flex-1">{l.nativeLabel}</span>
                <span className="text-xs text-muted-foreground">{l.label}</span>
                {language === l.code && <Check className="size-4 shrink-0" />}
              </button>
            ))}
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
            <DropdownMenuContent align="end" className="w-72">
              {/* Base UI requires GroupLabel (DropdownMenuLabel) to live inside a Menu.Group
               * (DropdownMenuGroup) — unlike the classic Radix-based shadcn recipe, where a
               * bare Label needed no wrapper. Omitting it throws "MenuGroupContext is missing"
               * and crashes the whole menu the moment it opens; caught here via a real
               * browser test against this exact TopBar. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-3 py-1">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                      {getInitials(profile.fullName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{profile.fullName}</p>
                      {/* Mobile over email: for teammate accounts the mobile *is* the login
                       * identifier (see `createTeammateUser`), and email is optional. */}
                      <p className="truncate text-xs text-muted-foreground">
                        {profile.mobile ?? profile.email}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-teal-700 uppercase dark:bg-teal-500/15 dark:text-teal-400">
                        <ShieldCheck className="size-3" />
                        {profile.roleName}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                    Organization
                  </p>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              {/* The switcher lives here rather than in the sidebar because this is already
               * where the account's identity is shown, and switching company is an
               * account-level act, not navigation. With one company it is just a label. */}
              {companies.length <= 1 ? (
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <p className="flex items-center gap-2">
                      <Building2 className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{company?.name ?? '—'}</span>
                    </p>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
              ) : (
                companies.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    disabled={c.id === profile.companyId || switchCompany.isPending}
                    onClick={() => switchCompany.mutate(c.id)}
                  >
                    <Building2 />
                    <span className="truncate">{c.name}</span>
                    {c.id === profile.companyId && (
                      <Check className="ml-auto size-4 text-teal-600 dark:text-teal-400" />
                    )}
                  </DropdownMenuItem>
                ))
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <UserIcon />
                My Profile
              </DropdownMenuItem>
              {canView('settings/billing') && (
                <DropdownMenuItem render={<Link to={buildPath('settings', 'billing')} />}>
                  <CreditCard />
                  Billing &amp; Subscription
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" onClick={handleLogOut}>
                <LogOut />
                Logout
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

      {/* Lives here rather than in AppShell so the dropdown that opens it owns its state — the
       * shell has no other reason to know about the profile. */}
      <ProfileDrawer open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  )
}
