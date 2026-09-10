import { describe, expect, it } from 'vitest'
import { NAV_SECTIONS } from './nav'
import { TOTAL_MENU_COUNT } from './menu-count'
import { REFERENCE_MENU_SLUGS, PERMISSION_CATALOGUE } from './permission-catalogue'
import menuStructure from '../../data/menu-structure.json'

/**
 * Holds this app's navigation to the client's full menu structure.
 *
 * The count was questioned for several rounds: their Role Configure screenshot reads "57" while
 * this app reported 52. `data/menus.json` — the OWNER role's assigned menus — lists 52, and the
 * five it does not carry turned out to be Purchase, its General Purchase leaf, Inventory, its
 * Stock leaf, and Masters > Attributes. `data/menu-structure.json` is the client's own listing
 * of all ten modules and forty-seven leaves; 10 + 47 = 57, and this test is what says so.
 *
 * `REFERENCE_MENU_SLUGS` is generated from the same map the permission catalogue and the role
 * seeds are built from, so this cannot pass by agreeing with a stale copy of the mapping.
 */

interface MenuNode {
  key: string
  label: string
  permission: string
  children: { key: string; label: string; permission: string }[]
}

const structure = (menuStructure as { menus: MenuNode[] }).menus
const referenceSlugs = [...structure.map((m) => m.key), ...structure.flatMap((m) => m.children.map((c) => c.key))]

describe('navigation matches the client menu structure', () => {
  it('covers every menu the structure lists', () => {
    const ours = new Set(REFERENCE_MENU_SLUGS)
    expect(referenceSlugs.filter((slug) => !ours.has(slug))).toEqual([])
  })

  it('has no menu the structure does not list', () => {
    const theirs = new Set(referenceSlugs)
    expect(REFERENCE_MENU_SLUGS.filter((slug) => !theirs.has(slug))).toEqual([])
  })

  it('counts 57 either way — 10 modules and 47 leaves', () => {
    expect(referenceSlugs).toHaveLength(57)
    expect(REFERENCE_MENU_SLUGS).toHaveLength(57)
    expect(NAV_SECTIONS).toHaveLength(10)
    expect(NAV_SECTIONS.flatMap((s) => s.children.filter((l) => !l.locked))).toHaveLength(47)
    // The badge on Role Configure reads against this, and 57 is the client's own number.
    expect(TOTAL_MENU_COUNT).toBe(57)
  })

  it('spells every menu the way the structure spells it', () => {
    // Matching slugs is not the same as the sidebar reading right: this app shipped "Payables"
    // where the structure says "Customer Payables", and only a browser caught it.
    //
    // A nav slug is this app's route segment ("options", "pnl"), not the structure's key
    // ("service-options", "profit-loss"), so the comparison goes through the catalogue's own
    // navSlug -> refSlug pairs — the same mapping the permissions are generated from, so this
    // cannot pass by agreeing with a stale copy of it. A trailing parenthetical may be dropped:
    // "General Purchase (Parts & Stock)" describes the menu, it is not room the sidebar has.
    const refSlugFor = new Map<string, string>()
    for (const mod of PERMISSION_CATALOGUE) {
      for (const f of mod.features) refSlugFor.set(`${mod.sectionKey}/${f.navSlug}`, f.refSlug)
    }
    const label = new Map<string, string>()
    for (const m of structure) {
      label.set(m.key, m.label)
      for (const c of m.children) label.set(c.key, c.label.replace(/ \(.*\)$/, ''))
    }

    const wrong: string[] = []
    let checked = 0
    for (const section of NAV_SECTIONS) {
      const want = label.get(section.key)
      if (!want) {
        wrong.push(`section ${section.key} is not in the structure`)
        continue
      }
      checked += 1
      if (section.label !== want) wrong.push(`${section.key}: "${section.label}" should be "${want}"`)
      for (const leaf of section.children.filter((l) => !l.locked)) {
        const ref = refSlugFor.get(`${section.key}/${leaf.slug}`)
        if (!ref) {
          wrong.push(`${section.key}/${leaf.slug} maps to no reference menu`)
          continue
        }
        checked += 1
        const w = label.get(ref)
        if (w && leaf.label !== w) wrong.push(`${section.key}/${leaf.slug}: "${leaf.label}" should be "${w}"`)
      }
    }
    // A comparison that looked at nothing must not read as agreement.
    expect(checked).toBe(57)
    expect(wrong).toEqual([])
  })

  it('defines every permission the structure names on a menu', () => {
    // Each menu row names the permission that reveals it. A row whose permission is not in the
    // catalogue would be a menu no role could ever be granted.
    const known = new Set(
      PERMISSION_CATALOGUE.flatMap((m) => [
        m.moduleAccess.key,
        ...m.features.flatMap((f) => f.permissions.map((p) => p.key)),
      ])
    )
    const named = [
      ...structure.map((m) => m.permission),
      ...structure.flatMap((m) => m.children.map((c) => c.permission)),
    ]
    expect(named.filter((key) => !known.has(key))).toEqual([])
  })
})
