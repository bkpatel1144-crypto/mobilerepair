import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ServiceOptionWithId } from '@/hooks/use-service-options'

interface AddOptionFormProps {
  placeholder: string
  onCancel: () => void
  /** Brands only — lets a new brand start shared across more than one device type. */
  deviceTypeOptions?: ServiceOptionWithId[]
  /** Models only — every model belongs to exactly one brand. */
  brandOptions?: ServiceOptionWithId[]
  /** Pre-selects a single device type/brand — used by each group's own inline "+", so adding a
   * brand *under* "Smart Watch" starts scoped to Smart Watch without extra clicks. */
  defaultScopeId?: string
  onSubmit: (input: { label: string; deviceTypeIds?: string[]; brandId?: string }) => void
}

/** The inline add row every Service Options section/group shows in place of its "+" button —
 * one shared implementation instead of 8 near-identical modals. */
export function AddOptionForm({
  placeholder,
  onCancel,
  deviceTypeOptions,
  brandOptions,
  defaultScopeId,
  onSubmit,
}: AddOptionFormProps) {
  const [label, setLabel] = useState('')
  const [deviceTypeIds, setDeviceTypeIds] = useState<string[]>(defaultScopeId ? [defaultScopeId] : [])
  const [brandId, setBrandId] = useState<string | undefined>(defaultScopeId)

  function handleSubmit() {
    const trimmed = label.trim()
    if (!trimmed) return
    if (deviceTypeOptions && deviceTypeIds.length === 0) return
    if (brandOptions && !brandId) return
    onSubmit({
      label: trimmed,
      ...(deviceTypeOptions ? { deviceTypeIds } : {}),
      ...(brandOptions ? { brandId } : {}),
    })
  }

  return (
    <div className="space-y-2 rounded-md border border-dashed bg-muted/20 p-3">
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={placeholder}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && !deviceTypeOptions && handleSubmit()}
      />

      {deviceTypeOptions && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Device type(s) — check more than one to share this brand</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {deviceTypeOptions.map((dt) => (
              <label key={dt.id} className="flex items-center gap-1.5 text-sm">
                <Checkbox
                  checked={deviceTypeIds.includes(dt.id)}
                  onCheckedChange={() =>
                    setDeviceTypeIds((prev) =>
                      prev.includes(dt.id) ? prev.filter((id) => id !== dt.id) : [...prev, dt.id]
                    )
                  }
                />
                {dt.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {brandOptions && (
        <Select value={brandId} onValueChange={(v) => v && setBrandId(v)}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Select brand..." />
          </SelectTrigger>
          <SelectContent>
            {brandOptions.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit}>
          Add
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
