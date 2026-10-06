import { useState } from 'react'
import { Search } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { COMPANY } from '@/config/company'
import { useCompany } from '@/hooks/use-company'
import { Skeleton } from '@/components/ui/skeleton'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Under md, the sidebar is this slide-in drawer instead of the fixed rail — BUILD_PLAN.md's
 * "sidebar becomes a slide-in drawer under ~768px" rule. Carries the same company name + nav
 * search as the desktop rail so the two aren't two different navigations. */
export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const { t } = useTranslation()
  const { data: company, isLoading } = useCompany()
  const [filter, setFilter] = useState('')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 max-w-[85vw] flex-col gap-0 p-0">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          {isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <span
              className="truncate text-lg font-bold tracking-tight"
              title={company?.name ?? undefined}
            >
              {company?.name ?? t('shell.appName')}
            </span>
          )}
        </div>

        <div className="shrink-0 px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('shared.search')}
              aria-label={t('shared.searchNavigation')}
              className="h-10 rounded-full bg-sidebar-accent/40 pl-9 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            />
          </div>
        </div>

        <SidebarNav onNavigate={() => onOpenChange(false)} filter={filter} />

        <div className="shrink-0 border-t p-3 text-center text-xs text-muted-foreground">
          {/* The product's own name and the current year, not a hardcoded "2025 ERP Pro" —
           * a scaffold leftover that sat under the menu on every screen in the app. Same source
           * as the marketing footer, so the two cannot drift apart. */}
          {t('marketing.footer.copyright', {
            year: new Date().getFullYear(),
            company: COMPANY.legalName,
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
