import { Info } from 'lucide-react'
import { FormModal } from '@/components/shared/form-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DesignerDraft } from './use-designer-state'

/** Paper, margins and output settings for one template. Everything here is undoable through the
 * designer's own history, because it commits through the same `commit()` an element move does. */
export function PageSetupDialog({
  open,
  onOpenChange,
  draft,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: DesignerDraft
  onChange: (next: Partial<DesignerDraft>) => void
}) {
  const num = (v: string, fallback: number) => {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Page Setup"
      description="Paper size, margins and output settings for this template."
      submitLabel="Done"
      onSubmit={() => onOpenChange(false)}
    >
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold tracking-wide uppercase">Paper</Label>
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(8rem,1fr))]">
          <div className="space-y-1">
            <Label className="text-xs">Width (mm)</Label>
            <Input
              type="number"
              value={draft.paper.width}
              onChange={(e) =>
                onChange({
                  paper: { ...draft.paper, width: num(e.target.value, draft.paper.width) },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height (mm)</Label>
            <Input
              type="number"
              value={draft.paper.height}
              onChange={(e) =>
                onChange({
                  paper: { ...draft.paper, height: num(e.target.value, draft.paper.height) },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Orientation</Label>
            <Select
              value={draft.paper.orientation}
              onValueChange={(v) =>
                v &&
                onChange({ paper: { ...draft.paper, orientation: v as 'portrait' | 'landscape' } })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold tracking-wide uppercase">Margins (mm)</Label>
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(6rem,1fr))]">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side} className="space-y-1">
              <Label className="text-xs capitalize">{side}</Label>
              <Input
                type="number"
                step="0.5"
                value={draft.margins[side]}
                onChange={(e) =>
                  onChange({
                    margins: { ...draft.margins, [side]: num(e.target.value, draft.margins[side]) },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold tracking-wide uppercase">Output</Label>
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(8rem,1fr))]">
          <div className="space-y-1">
            <Label className="text-xs">Copies</Label>
            <Input
              type="number"
              min={1}
              value={draft.settings.copies}
              onChange={(e) =>
                onChange({
                  settings: { ...draft.settings, copies: Math.max(1, num(e.target.value, 1)) },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gap (mm)</Label>
            <Input
              type="number"
              step="0.5"
              value={draft.settings.gapMm}
              onChange={(e) =>
                onChange({
                  settings: { ...draft.settings, gapMm: num(e.target.value, draft.settings.gapMm) },
                })
              }
            />
          </div>
        </div>

        <label className="flex items-center justify-between gap-2 text-sm">
          Duplicate copy
          <Switch
            checked={draft.settings.duplicateCopy}
            onCheckedChange={(v) => onChange({ settings: { ...draft.settings, duplicateCopy: v } })}
          />
        </label>

        {draft.settings.duplicateCopy && (
          <div className="space-y-1">
            <Label className="text-xs">Copy layout</Label>
            <Select
              value={draft.settings.duplicateCopyDirection}
              onValueChange={(v) =>
                v &&
                onChange({
                  settings: {
                    ...draft.settings,
                    duplicateCopyDirection: v as 'stacked' | 'side-by-side',
                  },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stacked">Stacked</SelectItem>
                <SelectItem value="side-by-side">Side by side</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10">
        <p className="flex gap-2 text-xs text-amber-800 dark:text-amber-400">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Saved with the template, but only applied by the Print Agent. These are printer firmware
            commands — printing from this browser uses its own dialog and ignores them.
          </span>
        </p>
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(7rem,1fr))]">
          {(
            [
              ['Labels across', 'ups'],
              ['Print speed', 'printSpeed'],
              ['Print density', 'printDensity'],
            ] as const
          ).map(([label, key]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input
                type="number"
                min={1}
                value={draft.settings[key]}
                onChange={(e) =>
                  onChange({
                    settings: {
                      ...draft.settings,
                      [key]: num(e.target.value, draft.settings[key]),
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </FormModal>
  )
}
