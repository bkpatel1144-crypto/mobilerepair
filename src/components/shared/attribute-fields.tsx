import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormGrid } from '@/components/shared/form-section'
import { coerceAttributeValue, type AttributeValues } from '@/lib/attribute-values'
import type { ItemAttributeWithId } from '@/hooks/use-item-attributes'
import { cn } from '@/lib/utils'

/**
 * The custom fields a company defined in Masters > Attributes, rendered on whichever form they
 * apply to.
 *
 * Before this, Attributes stored a data type and a Mandatory flag that nothing read: Create Item
 * asked the shopkeeper to type variant attributes as free text, which is the exact problem the
 * master was built to solve. This is the other half of that screen.
 *
 * Renders nothing at all when a company has defined no attributes for this form — an empty
 * "Additional Details" card on every form in the app would be worse than the free-text box it
 * replaces.
 */
export function AttributeFields({
  attributes,
  values,
  onChange,
  missing,
  className,
}: {
  attributes: ItemAttributeWithId[]
  values: AttributeValues
  onChange: (code: string, value: AttributeValues[string]) => void
  /** Codes of mandatory attributes the submit found blank. */
  missing?: string[]
  className?: string
}) {
  const { t } = useTranslation()
  if (attributes.length === 0) return null

  return (
    <FormGrid className={className}>
      {attributes.map((attribute) => {
        const value = values[attribute.code]
        const isMissing = missing?.includes(attribute.code) === true
        const fieldId = `attr-${attribute.code}`

        // A boolean is a question, not a blank to fill — it gets the whole row as a checkbox
        // rather than a label above an empty-looking control.
        if (attribute.dataType === 'boolean') {
          return (
            <label
              key={attribute.code}
              className="flex items-center gap-2 self-end pb-2 text-sm"
              htmlFor={fieldId}
            >
              <Checkbox
                id={fieldId}
                checked={value === true}
                onCheckedChange={(v) => onChange(attribute.code, v === true)}
              />
              <span className="min-w-0">
                {attribute.name}
                {attribute.mandatory && <span className="text-red-600"> *</span>}
              </span>
            </label>
          )
        }

        return (
          <div key={attribute.code} className="space-y-1.5">
            <Label htmlFor={fieldId}>
              {attribute.name}
              {attribute.mandatory && <span className="text-red-600"> *</span>}
            </Label>

            {attribute.dataType === 'select' ? (
              <Select
                value={typeof value === 'string' && value ? value : ''}
                onValueChange={(v) => onChange(attribute.code, v || null)}
              >
                <SelectTrigger
                  id={fieldId}
                  className={cn('w-full', isMissing && 'border-red-500')}
                  aria-invalid={isMissing || undefined}
                >
                  <SelectValue placeholder={t('shared.select')} />
                </SelectTrigger>
                <SelectContent>
                  {attribute.values.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                  {/* A value the master no longer offers still has to be shown, or editing an
                   * older record would silently blank it. */}
                  {typeof value === 'string' && value && !attribute.values.includes(value) && (
                    <SelectItem value={value}>{value}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={fieldId}
                type={
                  attribute.dataType === 'number'
                    ? 'number'
                    : attribute.dataType === 'date'
                      ? 'date'
                      : 'text'
                }
                inputMode={attribute.dataType === 'number' ? 'decimal' : undefined}
                value={value === null || value === undefined ? '' : String(value)}
                onChange={(e) =>
                  onChange(attribute.code, coerceAttributeValue(attribute.dataType, e.target.value))
                }
                className={cn(isMissing && 'border-red-500')}
                aria-invalid={isMissing || undefined}
              />
            )}

            {isMissing && (
              <p className="text-xs text-red-600">{t('shared.thisFieldIsRequired')}</p>
            )}
          </div>
        )
      })}
    </FormGrid>
  )
}
