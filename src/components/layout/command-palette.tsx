import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { DASHBOARD_NAV, NAV_SECTIONS, buildPath } from '@/config/nav'
import { Lock } from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Real Ctrl+K / Cmd+K navigation — jump to any (unlocked) page in the app by name, without
 * digging through the sidebar. Registered globally in AppShell. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  function go(path: string) {
    navigate(path)
    onOpenChange(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Jump to any page"
    >
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No matching page.</CommandEmpty>
        <CommandGroup heading="General">
          <CommandItem onSelect={() => go('/app/dashboard')}>
            <DASHBOARD_NAV.icon />
            {DASHBOARD_NAV.label}
          </CommandItem>
        </CommandGroup>
        {NAV_SECTIONS.map((section) => (
          <CommandGroup key={section.key} heading={section.label}>
            {section.children.map((leaf) =>
              leaf.locked ? (
                <CommandItem key={leaf.slug} disabled>
                  <Lock />
                  {leaf.label}
                </CommandItem>
              ) : (
                <CommandItem key={leaf.slug} onSelect={() => go(buildPath(section.key, leaf.slug))}>
                  <section.icon />
                  {leaf.label}
                </CommandItem>
              )
            )}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
