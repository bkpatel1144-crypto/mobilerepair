import { useState } from 'react'
import { Search } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Input } from '@/components/ui/input'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Under md, the sidebar is this slide-in drawer instead of the fixed rail — BUILD_PLAN.md's
 * "sidebar becomes a slide-in drawer under ~768px" rule. Carries the same wordmark + nav search
 * as the desktop rail so the two aren't two different navigations. */
export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const [filter, setFilter] = useState('')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 max-w-[85vw] flex-col gap-0 p-0">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <span className="text-lg font-bold tracking-tight">aim</span>
        </div>

        <div className="shrink-0 px-3 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search..."
              aria-label="Search navigation"
              className="h-9 bg-background pl-8"
            />
          </div>
        </div>

        <SidebarNav onNavigate={() => onOpenChange(false)} filter={filter} />

        <div className="shrink-0 border-t p-3 text-center text-xs text-muted-foreground">
          © 2025 ERP Pro
        </div>
      </SheetContent>
    </Sheet>
  )
}
