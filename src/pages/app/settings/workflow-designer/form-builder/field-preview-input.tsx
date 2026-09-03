import { useState } from 'react'
import { ScanLine, Search, UserRound, Image as ImageIcon, Plus, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/**
 * Renders what each field *looks* like in the builder's live-preview pane — deliberately inert
 * (no real customer search, no real catalog, nothing submittable), matching the reference app's
 * own blue banner: "Nothing here can be submitted or saved from this preview." Phase 5's real
 * Create Job Card form is a *separate*, fully-functional component that happens to read the
 * same `formSchemas/jobCard` doc this builder writes — this component only needs to look right,
 * not work right.
 */
interface FieldPreviewInputProps {
  type: string
  placeholder?: string
  quickAmounts?: number[]
  quickDates?: string[]
  options?: string[]
  disabled?: boolean
}

export function FieldPreviewInput({
  type,
  placeholder,
  quickAmounts,
  quickDates,
  options,
  disabled,
}: FieldPreviewInputProps) {
  const [amount, setAmount] = useState<number | null>(quickAmounts?.[0] === 0 ? 0 : null)

  const baseInputClasses = cn(
    'flex h-9 w-full items-center rounded-md border bg-background px-3 text-sm text-muted-foreground',
    disabled && 'opacity-60'
  )

  switch (type) {
    case 'search':
      return (
        <div className="flex gap-2">
          <div className={cn(baseInputClasses, 'flex-1 gap-2')}>
            <Search className="size-4 shrink-0" />
            <span className="truncate">{placeholder ?? 'Search...'}</span>
          </div>
          <Button type="button" variant="outline" size="icon" disabled className="shrink-0">
            <Plus className="size-4" />
          </Button>
        </div>
      )
    case 'userPicker':
      return (
        <div className={cn(baseInputClasses, 'gap-2')}>
          <UserRound className="size-4 shrink-0" />
          <span className="truncate">{placeholder ?? 'Search user...'}</span>
        </div>
      )
    case 'scanText':
      return (
        <div className="flex gap-2">
          <div className={cn(baseInputClasses, 'flex-1')}>
            <span className="truncate">{placeholder}</span>
          </div>
          <Button type="button" variant="outline" size="icon" disabled className="shrink-0">
            <ScanLine className="size-4" />
          </Button>
        </div>
      )
    case 'pinPattern':
      return (
        <div className="flex gap-2">
          <div className={cn(baseInputClasses, 'flex-1')}>
            <span className="truncate">{placeholder}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="shrink-0 border-amber-300 text-amber-700 dark:border-amber-500/40 dark:text-amber-400"
          >
            <Grid3x3 className="size-3.5" />
            Draw
          </Button>
        </div>
      )
    case 'multiSelect':
    case 'tags':
      return (
        <div className="flex gap-2">
          <div className={cn(baseInputClasses, 'flex-1')}>
            <span className="truncate">{placeholder}</span>
          </div>
          {type === 'multiSelect' && (
            <Button type="button" variant="outline" size="icon" disabled className="shrink-0">
              <Plus className="size-4" />
            </Button>
          )}
        </div>
      )
    case 'currency':
      return (
        <div className="space-y-1.5">
          <div className={baseInputClasses}>₹ {amount ?? 0}</div>
          <div className="flex flex-wrap gap-1">
            {quickAmounts?.map((amt) => (
              <button
                key={amt}
                type="button"
                disabled={disabled}
                onClick={() => setAmount(amt)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-xs',
                  amount === amt
                    ? 'border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>
      )
    case 'select':
      return (
        <div className={cn(baseInputClasses, 'justify-between')}>
          <span>{options?.[0] ?? 'Select...'}</span>
        </div>
      )
    case 'date':
      return (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <div className={cn(baseInputClasses, 'flex-1')}>dd-mm-yyyy</div>
            <div className={cn(baseInputClasses, 'w-20 justify-center')}>--:--</div>
          </div>
          {quickDates && (
            <div className="flex flex-wrap gap-1">
              {quickDates.map((d) => (
                <span key={d} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      )
    case 'textarea':
      return <Textarea placeholder={placeholder} disabled rows={2} className="resize-none" />
    case 'imageDropzone':
      return (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed py-6 text-muted-foreground">
          <ImageIcon className="size-5" />
          <span className="text-sm">Add Images</span>
        </div>
      )
    case 'text':
    default:
      return <div className={baseInputClasses}>{placeholder ?? ''}</div>
  }
}
