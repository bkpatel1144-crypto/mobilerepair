import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SidebarNav } from '@/components/layout/sidebar-nav'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Under md, the sidebar is this slide-in drawer instead of the fixed rail — BUILD_PLAN.md's
 * "sidebar becomes a slide-in drawer under ~768px" rule. */
export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 max-w-[85vw] flex-col gap-0 p-0">
        <div className="flex items-center gap-2 border-b p-4">
          <span className="text-lg font-bold">aim</span>
        </div>
        <SidebarNav onNavigate={() => onOpenChange(false)} />
        <div className="border-t p-3 text-center text-xs text-muted-foreground">© 2025 ERP Pro</div>
      </SheetContent>
    </Sheet>
  )
}
