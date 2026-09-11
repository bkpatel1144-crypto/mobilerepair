import type {
  AttributeEntity,
  AttributeDataType,
  ItemAttributeWithId,
} from '@/hooks/use-item-attributes'

/**
 * The values a form captures for the custom attributes defined in Masters > Attributes.
 *
 * Keyed by the attribute's `code`, never by its name or its document id. The name is a label a
 * shopkeeper renames freely ("Colour" → "Color"), and the id means nothing to anyone reading the
 * stored document; the code is the stable handle the Attributes screen auto-generates and shows
 * as AUTO-GENERATED for exactly this reason.
 *
 * Pure on purpose — validation is the part that has to be right, and it should be testable
 * without rendering a form.
 */

export type AttributeValue = string | number | boolean | null

export type AttributeValues = Record<string, AttributeValue>

/** The active attributes that apply to one kind of form, in the order the master lists them. */
export function attributesFor(
  attributes: ItemAttributeWithId[] | undefined,
  entity: AttributeEntity
): ItemAttributeWithId[] {
  return (attributes ?? []).filter((a) => a.appliesTo === entity && a.status === 'active')
}

/**
 * Is this value absent?
 *
 * `false` is a real answer for a boolean and `0` is a real answer for a number — neither is
 * blank. Treating them as blank would make a mandatory "Refurbished? No" impossible to save.
 */
export function isBlankAttributeValue(value: AttributeValue | undefined): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  return false
}

/** A form control's raw output as the type the attribute declares. Blank stays blank rather than
 *  becoming `0` or `false`, so "not filled in" survives the round trip. */
export function coerceAttributeValue(dataType: AttributeDataType, raw: unknown): AttributeValue {
  if (dataType === 'boolean') return raw === true
  if (raw === null || raw === undefined) return null
  if (dataType === 'number') {
    const text = String(raw).trim()
    if (!text) return null
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : null
  }
  const text = String(raw)
  return text.trim() === '' ? null : text
}

/**
 * The mandatory attributes left blank, as their codes.
 *
 * A `select` whose stored value is no longer one of its choices counts as filled — the shopkeeper
 * answered the question, and the master changed afterwards. Refusing the save would trap an item
 * that cannot be edited without also editing the attribute.
 */
export function missingMandatoryAttributes(
  attributes: ItemAttributeWithId[],
  values: AttributeValues
): string[] {
  return attributes
    .filter((a) => a.mandatory && isBlankAttributeValue(values[a.code]))
    .map((a) => a.code)
}

/**
 * What actually gets written: known codes only, blanks dropped.
 *
 * Dropping blanks rather than storing `null` keeps a document from growing a key for every
 * attribute anyone ever defined, and means "has no value" and "the attribute did not exist yet"
 * read identically — which is true, and is what every screen showing these values assumes.
 */
export function cleanAttributeValues(
  attributes: ItemAttributeWithId[],
  values: AttributeValues
): AttributeValues {
  const out: AttributeValues = {}
  for (const attribute of attributes) {
    const value = values[attribute.code]
    if (!isBlankAttributeValue(value)) out[attribute.code] = value as AttributeValue
  }
  return out
}

/** Stored values back into the shape a form holds — every defined attribute present, so a control
 *  is never switched from uncontrolled to controlled halfway through editing. */
export function attributeValuesToDraft(
  attributes: ItemAttributeWithId[],
  stored: AttributeValues | undefined
): AttributeValues {
  const out: AttributeValues = {}
  for (const attribute of attributes) {
    const value = stored?.[attribute.code]
    out[attribute.code] = value === undefined ? (attribute.dataType === 'boolean' ? false : null) : value
  }
  return out
}

/** One value as a human reads it — for a list column or a detail drawer. */
export function formatAttributeValue(
  attribute: Pick<ItemAttributeWithId, 'dataType'>,
  value: AttributeValue | undefined,
  labels: { yes: string; no: string }
): string {
  if (isBlankAttributeValue(value)) return '—'
  if (attribute.dataType === 'boolean') return value ? labels.yes : labels.no
  return String(value)
}

/**
 * Stored values as `{ label, value }` rows for a detail drawer.
 *
 * Only attributes that actually have a value — a drawer listing every attribute the company ever
 * defined, most of them blank, buries the ones that were filled in. Values are read by code, so
 * renaming the attribute relabels the row rather than orphaning it.
 */
export function attributeRows(
  attributes: ItemAttributeWithId[],
  values: AttributeValues | undefined,
  labels: { yes: string; no: string }
): { label: string; value: string }[] {
  return attributes
    .filter((a) => !isBlankAttributeValue(values?.[a.code]))
    .map((a) => ({ label: a.name, value: formatAttributeValue(a, values?.[a.code], labels) }))
}
