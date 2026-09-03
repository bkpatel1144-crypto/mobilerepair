import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Search, X, Plus, Check, Package, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SearchSelectOption {
  id: string
  label: string
  /** Shown as small grey text under the label — e.g. a customer's mobile number, or a user's
   * role name. */
  helper?: string
  icon?: LucideIcon
  /** Renders a filled circular avatar (initials) instead of the square icon box — for people
   * pickers (Assign To, Handover To) rather than catalog-style pickers (Device Type, Brand). */
  avatarLabel?: string
}

interface SearchSelectProps {
  options: SearchSelectOption[]
  value: string | null
  onChange: (id: string | null) => void
  placeholder: string
  disabled?: boolean
  /** Shows a pinned "+ Add New" row at the bottom of the list — used by Customer/Device
   * Type/Brand to quick-create without leaving the job card form. Always visible (not
   * conditional on the search text), matching `preview (9)`'s own dropdown chrome. */
  onCreateNew?: (label: string) => void
  /** Externally controlled open state — lets a field's own adjacent "+" icon button (outside
   * this component) open the same picker instead of duplicating its dropdown/add logic. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Search-with-add combobox — matches `preview (9)`/`(10)`'s "🔍 Search customer by name or
 * mobile..." + per-option icon + pinned "+ Add New" pattern for Customer/Device Type/Brand. One
 * implementation, reused for every such field rather than a bespoke one per picker. */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  onCreateNew,
  open: controlledOpen,
  onOpenChange,
}: SearchSelectProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const [query, setQuery] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const selected = options.find((o) => o.id === value)

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.helper?.toLowerCase().includes(query.toLowerCase())
      )
    : options

  function select(id: string) {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  function handleCreate() {
    if (!onCreateNew || !newLabel.trim()) return
    onCreateNew(newLabel.trim())
    setNewLabel('')
    setQuery('')
    setOpen(false)
  }

  const SelectedIcon = selected?.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-8 w-full items-center gap-2 rounded-md border bg-background px-2.5 text-sm disabled:opacity-50',
              !selected && 'text-muted-foreground'
            )}
          >
            {selected?.avatarLabel ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[9px] font-semibold text-white">
                {selected.avatarLabel}
              </span>
            ) : SelectedIcon ? (
              <SelectedIcon className="size-4 shrink-0" />
            ) : (
              <Search className="size-4 shrink-0" />
            )}
            <span className="flex-1 truncate text-left">{selected ? selected.label : placeholder}</span>
            {selected && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(null)
                }}
                className="rounded-full p-0.5 hover:bg-muted"
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <PopoverContent className="w-(--anchor-width) min-w-72 p-1" align="start">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search..."
          autoFocus
          className="mb-1 h-8 text-sm"
        />
        <div className="max-h-56 overflow-y-auto">
          {filtered.map((opt) => {
            const isSelected = opt.id === value
            const Icon = opt.icon ?? Package
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => select(opt.id)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                {opt.avatarLabel ? (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[10px] font-semibold text-white">
                    {opt.avatarLabel}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-md border',
                      isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-input text-muted-foreground'
                    )}
                  >
                    {isSelected ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{opt.label}</span>
                  {opt.helper && <span className="block truncate text-xs text-muted-foreground">{opt.helper}</span>}
                </span>
                {opt.avatarLabel && isSelected && <Check className="size-4 shrink-0 text-teal-600" />}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No matches.</p>
          )}
        </div>
        {onCreateNew && (
          <div className="flex gap-1 border-t p-1.5">
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
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
