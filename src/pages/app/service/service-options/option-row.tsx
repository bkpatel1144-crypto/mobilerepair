import { useState } from 'react'
import { GripVertical, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { ServiceOptionWithId } from '@/hooks/use-service-options'

interface OptionRowProps {
  option: ServiceOptionWithId
  index: number
  onRename: (label: string) => void
  onDelete: () => void
  onMove: (direction: 'up' | 'down') => void
  canMoveUp: boolean
  canMoveDown: boolean
}

/** One reorderable row inside a Service Options section/group — matches `preview (73)`'s
 * "⠿ Samsung #1 ✎ 🗑" row pattern. The drag-handle icon is purely visual; reordering is done via
 * the up/down arrows next to it (see `useReorderServiceOption`'s own doc comment for why). */
export function OptionRow({ option, index, onRename, onDelete, onMove, canMoveUp, canMoveDown }: OptionRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(option.label)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function commitRename() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== option.label) onRename(trimmed)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2 border-b py-1.5 pl-6 last:border-0">
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40" />
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          onClick={() => onMove('up')}
          disabled={!canMoveUp}
          className="text-muted-foreground/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          onClick={() => onMove('down')}
          disabled={!canMoveDown}
          className="text-muted-foreground/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronDown className="size-3" />
        </button>
      </div>

      {editing ? (
        <>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setEditing(false)
            }}
            autoFocus
            className="h-7 flex-1 text-sm"
          />
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={commitRename}>
            <Check className="size-3.5 text-teal-600" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setEditing(false)}>
            <X className="size-3.5" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{option.label}</span>
          <span className="text-xs text-muted-foreground/60">#{index + 1}</span>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setConfirmingDelete(true)}>
            <Trash2 className="size-3.5 text-red-600" />
          </Button>
        </>
      )}
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Delete "${option.label}"?`}
        message="Job cards or catalog entries already referencing this will keep a reference to something that no longer exists. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          onDelete()
          setConfirmingDelete(false)
        }}
      />
    </div>
  )
}
