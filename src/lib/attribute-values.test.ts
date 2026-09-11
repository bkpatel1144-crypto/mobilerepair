import { describe, expect, it } from 'vitest'
import {
  attributeRows,
  attributesFor,
  attributeValuesToDraft,
  cleanAttributeValues,
  coerceAttributeValue,
  formatAttributeValue,
  isBlankAttributeValue,
  missingMandatoryAttributes,
} from './attribute-values'
import type { ItemAttributeWithId } from '@/hooks/use-item-attributes'

function attribute(patch: Partial<ItemAttributeWithId>): ItemAttributeWithId {
  return {
    id: patch.code ?? 'x',
    name: 'Colour',
    code: 'COLOUR',
    appliesTo: 'item',
    dataType: 'text',
    mandatory: false,
    values: [],
    status: 'active',
    createdById: 'u',
    createdByName: 'U',
    createdAt: null,
    updatedAt: null,
    ...patch,
  }
}

const LABELS = { yes: 'Yes', no: 'No' }

describe('attributesFor', () => {
  it('keeps only the active attributes for that entity', () => {
    const all = [
      attribute({ code: 'A', appliesTo: 'item' }),
      attribute({ code: 'B', appliesTo: 'party' }),
      attribute({ code: 'C', appliesTo: 'item', status: 'disabled' }),
    ]
    expect(attributesFor(all, 'item').map((a) => a.code)).toEqual(['A'])
    expect(attributesFor(all, 'party').map((a) => a.code)).toEqual(['B'])
  })

  it('survives an attribute list that has not loaded', () => {
    expect(attributesFor(undefined, 'item')).toEqual([])
  })
})

describe('isBlankAttributeValue', () => {
  it('treats absent and whitespace as blank', () => {
    expect(isBlankAttributeValue(null)).toBe(true)
    expect(isBlankAttributeValue(undefined)).toBe(true)
    expect(isBlankAttributeValue('   ')).toBe(true)
  })

  // The whole point: a mandatory "Refurbished? No" and a price of ₹0 must both be savable.
  it('does not treat false or zero as blank', () => {
    expect(isBlankAttributeValue(false)).toBe(false)
    expect(isBlankAttributeValue(0)).toBe(false)
  })
})

describe('coerceAttributeValue', () => {
  it('reads numbers as numbers and blank as absent, not as zero', () => {
    expect(coerceAttributeValue('number', '12')).toBe(12)
    expect(coerceAttributeValue('number', '')).toBe(null)
    expect(coerceAttributeValue('number', 'abc')).toBe(null)
    expect(coerceAttributeValue('number', '0')).toBe(0)
  })

  it('reads a checkbox as a real boolean either way', () => {
    expect(coerceAttributeValue('boolean', true)).toBe(true)
    expect(coerceAttributeValue('boolean', false)).toBe(false)
    expect(coerceAttributeValue('boolean', undefined)).toBe(false)
  })

  it('keeps text and dates as given, blank as absent', () => {
    expect(coerceAttributeValue('text', ' Black ')).toBe(' Black ')
    expect(coerceAttributeValue('date', '2026-09-11')).toBe('2026-09-11')
    expect(coerceAttributeValue('select', '')).toBe(null)
  })
})

describe('missingMandatoryAttributes', () => {
  it('names the mandatory ones left blank and no others', () => {
    const attributes = [
      attribute({ code: 'COLOUR', mandatory: true }),
      attribute({ code: 'SIZE', mandatory: true }),
      attribute({ code: 'NOTE', mandatory: false }),
    ]
    const missing = missingMandatoryAttributes(attributes, { COLOUR: 'Black', SIZE: null })
    expect(missing).toEqual(['SIZE'])
  })

  it('accepts false for a mandatory boolean', () => {
    const attributes = [attribute({ code: 'REFURB', dataType: 'boolean', mandatory: true })]
    expect(missingMandatoryAttributes(attributes, { REFURB: false })).toEqual([])
  })

  // A master edited after the fact must not make an existing record unsaveable.
  it('accepts a select value the master no longer offers', () => {
    const attributes = [
      attribute({ code: 'COLOUR', dataType: 'select', values: ['Black'], mandatory: true }),
    ]
    expect(missingMandatoryAttributes(attributes, { COLOUR: 'Gold' })).toEqual([])
  })
})

describe('cleanAttributeValues', () => {
  it('writes known codes only, and drops blanks rather than storing null', () => {
    const attributes = [attribute({ code: 'COLOUR' }), attribute({ code: 'SIZE' })]
    const cleaned = cleanAttributeValues(attributes, {
      COLOUR: 'Black',
      SIZE: '  ',
      STRAY: 'should not be written',
    })
    expect(cleaned).toEqual({ COLOUR: 'Black' })
  })

  it('keeps false and zero', () => {
    const attributes = [
      attribute({ code: 'REFURB', dataType: 'boolean' }),
      attribute({ code: 'QTY', dataType: 'number' }),
    ]
    expect(cleanAttributeValues(attributes, { REFURB: false, QTY: 0 })).toEqual({
      REFURB: false,
      QTY: 0,
    })
  })
})

describe('attributeValuesToDraft', () => {
  it('gives every attribute a key so no control switches from uncontrolled to controlled', () => {
    const attributes = [
      attribute({ code: 'COLOUR' }),
      attribute({ code: 'REFURB', dataType: 'boolean' }),
    ]
    expect(attributeValuesToDraft(attributes, { COLOUR: 'Black' })).toEqual({
      COLOUR: 'Black',
      REFURB: false,
    })
  })

  it('handles a record saved before any attribute existed', () => {
    const attributes = [attribute({ code: 'COLOUR' })]
    expect(attributeValuesToDraft(attributes, undefined)).toEqual({ COLOUR: null })
  })
})

describe('formatAttributeValue', () => {
  it('renders booleans as words and blanks as a dash', () => {
    expect(formatAttributeValue({ dataType: 'boolean' }, true, LABELS)).toBe('Yes')
    expect(formatAttributeValue({ dataType: 'boolean' }, false, LABELS)).toBe('No')
    expect(formatAttributeValue({ dataType: 'text' }, null, LABELS)).toBe('—')
    expect(formatAttributeValue({ dataType: 'number' }, 0, LABELS)).toBe('0')
  })
})

describe('attributeRows', () => {
  it('lists only the attributes that were filled in, labelled by current name', () => {
    const attributes = [
      attribute({ code: 'COLOUR', name: 'Colour' }),
      attribute({ code: 'SIZE', name: 'Size' }),
      attribute({ code: 'REFURB', name: 'Refurbished', dataType: 'boolean' }),
    ]
    expect(attributeRows(attributes, { COLOUR: 'Black', REFURB: false }, LABELS)).toEqual([
      { label: 'Colour', value: 'Black' },
      { label: 'Refurbished', value: 'No' },
    ])
  })

  it('is empty for a record saved before any attribute existed', () => {
    expect(attributeRows([attribute({ code: 'COLOUR' })], undefined, LABELS)).toEqual([])
  })
})
