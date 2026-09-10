import { NAV_SECTIONS, menuKey } from '@/config/nav'
import type { MenuPermissions } from '@/types/firestore'

/**
 * How many menus a role holds, counted the way the client's export counts them.
 *
 * Their `assignedMenus` lists module rows alongside leaf rows: the Accountant's 19 is 15 leaves
 * plus the four modules those leaves sit under. This app stores only leaves — a section appears
 * in the sidebar when any of its children does, so a separate "module visible" flag would be a
 * second source of truth for the same fact — and so it was reporting 15 where the reference
 * reports 19 for an identical role.
 *
 * The module rows are therefore derived rather than stored: a module counts when at least one of
 * its leaves does. That makes the two systems' numerators comparable, which is the point of the
 * badge.
 *
 * The denominators still differ — 52 here against the reference's 57 — because their instance
 * has five menus for features this product has no screens for. Reporting 52 is honest; padding it
 * to 57 with menus that lead nowhere would not be.
 */

export const ALL_LEAF_KEYS = NAV_SECTIONS.flatMap((section) =>
  section.children.filter((leaf) => !leaf.locked).map((leaf) => menuKey(section.key, leaf.slug))
)

/** Leaves plus modules — 8 + 44 today. */
export const TOTAL_MENU_COUNT = ALL_LEAF_KEYS.length + NAV_SECTIONS.length

/** Leaves a role holds, plus every module implied by them. */
export function countMenus(menuPermissions: MenuPermissions): number {
  const leaves = ALL_LEAF_KEYS.filter((key) => menuPermissions[key] === true).length
  const modules = NAV_SECTIONS.filter((section) =>
    section.children.some(
      (leaf) => !leaf.locked && menuPermissions[menuKey(section.key, leaf.slug)] === true
    )
  ).length
  return leaves + modules
}
