import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, X, Plus, Check, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  id: string
  label: string
  icon?: LucideIcon
}

interface MultiSelectPopoverProps {
  options: MultiSelectOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder: string
  disabled?: boolean
  /** Shows a pinned "+ Add New" row inside the popover footer, alongside "Done" — used by
   * Problems/Items received/returned to quick-add a Service Option without leaving the job
   * card form. */
  onCreateNew?: (label: string) => void
  /** Externally controlled open state — lets a field's own adjacent "+" icon button (outside
   * this component) open the same picker instead of duplicating its dropdown/add logic, same
   * pattern as `SearchSelect`. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Checkbox-list multi-select with per-option icon, removable chips, and a "Done"/"+ Add New"
 * footer — matches `preview (9)`'s Items Received/Returned dropdown exactly. Generalized so
 * every "pick several of these tags" field across the app (Problems, Items Received/Returned,
 * and future Masters/Second-Hand-Device pickers) shares one implementation. */
export function MultiSelectPopover({
  options,
  selectedIds,
  onChange,
  placeholder,
  disabled,
  onCreateNew,
  open: controlledOpen,
  onOpenChange,
}: MultiSelectPopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  const [newLabel, setNewLabel] = useState('')
  const selected = options.filter((o) => selectedIds.includes(o.id))

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  function handleCreate() {
    const trimmed = newLabel.trim()
    if (!trimmed || !onCreateNew) return
    onCreateNew(trimmed)
    setNewLabel('')
  }

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              className="flex h-8 w-full items-center justify-between rounded-md border bg-background px-2.5 text-sm disabled:opacity-50"
            >
              <span className="text-muted-foreground">{placeholder}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          }
        />
        <PopoverContent className="w-(--anchor-width) min-w-72 p-1" align="start">
          <div className="max-h-56 overflow-y-auto">
            {options.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">Nothing here yet.</p>
            )}
            {options.map((opt) => {
              const isSelected = selectedIds.includes(opt.id)
              const Icon = opt.icon ?? Package
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggle(opt.id)}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded border',
                      isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-input'
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                  </span>
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{opt.label}</span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-1 border-t p-1.5">
            {onCreateNew && (
              <>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Add New..."
                  className="h-8 flex-1 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border hover:bg-muted"
                >
                  <Plus className="size-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto flex h-8 shrink-0 items-center rounded-md bg-teal-600 px-3 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Check className="mr-1 size-3.5" />
              Done
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-2 text-xs text-secondary-foreground"
            >
              {opt.label}
              {!disabled && (
                <button type="button" onClick={() => toggle(opt.id)} className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10">
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
