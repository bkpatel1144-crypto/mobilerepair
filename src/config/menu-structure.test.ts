import { describe, expect, it } from 'vitest'
import { NAV_SECTIONS, menuKey } from './nav'
import { TOTAL_MENU_COUNT } from './menu-count'
import menuStructure from '../../data/menu-structure.json'

/**
 * Holds the sidebar to the client's own menu structure, which is `data/menu-structure.json`.
 *
 * Their Role Configure screen counts 57 and this app counted 52. The five it was missing are
 * Purchase and its General Purchase leaf, Inventory and its Stock leaf, and Masters > Attributes
 * — ten modules and forty-seven leaves, and 10 + 47 is where 57 comes from. The count is asserted
 * on both sides, so this cannot pass by a menu being dropped here and there at the same time.
 *
 * Slugs are deliberately not compared one to one: this app's slug for a menu is its route segment
 * ("options", "pnl") while the structure's is its key ("service-options", "profit-loss"). What is
 * compared is the shape — how many modules, how many leaves — plus the three menus that were
 * actually missing, by the key the route and the permission are built from.
 */

interface MenuNode {
  key: string
  label: string
  children: { key: string; label: string }[]
}

const structure = (menuStructure as { menus: MenuNode[] }).menus
const ourLeaves = NAV_SECTIONS.flatMap((s) =>
  s.children.filter((l) => !l.locked).map((l) => menuKey(s.key, l.slug))
)

describe('the sidebar matches the client menu structure', () => {
  it('reads 57 on both sides — 10 modules and 47 leaves', () => {
    const theirLeaves = structure.flatMap((m) => m.children)
    expect(structure).toHaveLength(10)
    expect(theirLeaves).toHaveLength(47)

    expect(NAV_SECTIONS).toHaveLength(10)
    expect(ourLeaves).toHaveLength(47)

    // What the Role Configure badge reads against.
    expect(TOTAL_MENU_COUNT).toBe(57)
  })

  it('has the three menus the structure named and this app did not', () => {
    // Named by menu key rather than by counting, so replacing one of them with a different menu
    // cannot keep this green.
    expect(ourLeaves).toContain('purchase/general')
    expect(ourLeaves).toContain('inventory/stock')
    expect(ourLeaves).toContain('masters/attributes')
    expect(NAV_SECTIONS.map((s) => s.key)).toContain('purchase')
    expect(NAV_SECTIONS.map((s) => s.key)).toContain('inventory')
  })

  it('gives every menu in the structure a module to sit under', () => {
    // A module row with no children would be a heading the sidebar never renders, and would make
    // the 10 above a number that means nothing.
    const childless = structure.filter((m) => m.children.length === 0).map((m) => m.key)
    expect(childless).toEqual([])
  })
})
