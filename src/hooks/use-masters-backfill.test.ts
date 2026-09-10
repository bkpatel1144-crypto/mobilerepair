import { describe, expect, it } from 'vitest'
import { categoryDrift } from './use-masters-backfill'
import { SEED_CATEGORIES } from '@/lib/masters-seed-data'
import type { ItemCategoryWithId } from '@/hooks/use-item-categories'

/**
 * Pins what the backfill will and will not touch on a company that already exists.
 *
 * The risk here is not that it does too little — it is that it overwrites a shopkeeper's own
 * work. This runs against live tenants with real data in them, so "a custom category is never
 * touched" has to be a test, not a comment.
 */

const seedIndex = new Map(SEED_CATEGORIES.map((c) => [c.code, c]))

/** A category exactly as the current seed would write it. */
function asSeeded(code: string, overrides: Partial<ItemCategoryWithId> = {}): ItemCategoryWithId {
  const seed = seedIndex.get(code)!
  return {
    id: `id-${code}`,
    name: seed.name,
    code: seed.code,
    type: seed.type,
    parentId: null,
    description: seed.description,
    icon: seed.icon,
    color: seed.color,
    displayOrder: seed.displayOrder,
    applicableAttributes: seed.applicableAttributes,
    settings: seed.settings,
    isSystem: seed.isSystem,
    level: seed.level,
    path: seed.path,
    source: 'system',
    status: 'active',
    createdAt: null as never,
    updatedAt: null as never,
    ...overrides,
  }
}

describe('categoryDrift', () => {
  it('reports nothing for a category already matching the catalogue', () => {
    expect(categoryDrift(asSeeded('ACCESSORIES'), seedIndex)).toBeNull()
  })

  it('catches the mis-typed categories the old mapping produced', () => {
    // The exact defect on every tenant seeded before today: `FINISHED_GOODS` and `CONSUMABLES`
    // both fell through to Raw Material.
    const wrong = asSeeded('ACCESSORIES', { type: 'Raw Material' })
    expect(categoryDrift(wrong, seedIndex)).toMatchObject({ type: 'Finished Goods' })

    const consumable = asSeeded('CONS_ADHESIVE', { type: 'Raw Material' })
    expect(categoryDrift(consumable, seedIndex)).toMatchObject({ type: 'Consumables' })
  })

  it('catches a sub-category left at level 0 with a bare path', () => {
    // What the export itself stores, and what an older seed copied verbatim.
    const flat = asSeeded('SPARE_BATTERIES', { level: 0, path: 'SPARE_BATTERIES' })
    const fix = categoryDrift(flat, seedIndex)
    expect(fix?.level).toBe(1)
    expect(fix?.path).toBe('SPARE_PARTS/SPARE_BATTERIES')
  })

  it('reports nothing for a code the catalogue does not define', () => {
    // A category the shopkeeper invented. Not ours to correct.
    const custom = asSeeded('SPARE_PARTS', { code: 'MY_OWN_CATEGORY', type: 'Raw Material' })
    expect(categoryDrift(custom, seedIndex)).toBeNull()
  })

  it('never proposes changing a name or description', () => {
    // Those are the fields a shopkeeper is most likely to have edited, and the backfill is not
    // allowed to undo that even on a system row.
    const renamed = asSeeded('ACCESSORIES', {
      name: 'My Accessories',
      description: 'my own wording',
      type: 'Raw Material',
    })
    const fix = categoryDrift(renamed, seedIndex)!
    expect(fix).not.toHaveProperty('name')
    expect(fix).not.toHaveProperty('description')
  })

  it('is not vacuous — the catalogue really does define these codes', () => {
    expect(seedIndex.size).toBe(27)
    expect(seedIndex.get('ACCESSORIES')?.type).toBe('Finished Goods')
  })
})
