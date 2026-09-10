import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_WIDGETS,
  WIDGET_GROUPS,
  allWidgetsEnabled,
  widgetsInGroup,
} from './dashboard-widgets'
import dashboardExport from '../../data/dashboard.json'

/**
 * Holds the widget catalogue to the client's reference export.
 *
 * The keys are the storage format for a role's dashboard config, so a mismatch is not cosmetic:
 * a config written by one system is unreadable by the other. The catalogue this replaced used
 * invented keys (`totalJobCards` for the reference's `kpi.jobcards.total`) and was missing
 * sixteen widgets, several of which the Dashboard was already rendering with no way to switch
 * them off.
 */

const exportedWidgets = (
  dashboardExport as { data: { dashboardConfig: { widgets: { key: string; visible: boolean }[] } } }
).data.dashboardConfig.widgets

describe('widget catalogue matches the reference', () => {
  it('defines every key the export enables', () => {
    const catalogue = new Set(DASHBOARD_WIDGETS.map((w) => w.key))
    const missing = exportedWidgets.filter((w) => !catalogue.has(w.key)).map((w) => w.key)
    expect(missing, 'these keys are in the export but not in the catalogue').toEqual([])
  })

  it('enables all 34, with the 26 built ones among them', () => {
    // "Show all" means all thirty-four. The reference's own header reads "34 / 34" and its
    // library footer "34 active"; the eight it has not built render as "Widget coming soon"
    // rather than being unselectable. The export's 26 are the ones with a real implementation,
    // and they must all still be in the set.
    const enabled = Object.keys(allWidgetsEnabled())
    expect(enabled).toHaveLength(34)
    const built = exportedWidgets.filter((w) => w.visible).map((w) => w.key)
    expect(built).toHaveLength(26)
    expect(built.filter((key) => !enabled.includes(key))).toEqual([])
  })

  it('offers 34 widgets across the five groups the library shows', () => {
    expect(DASHBOARD_WIDGETS).toHaveLength(34)
    expect(WIDGET_GROUPS.map((g) => g.key)).toEqual(['personal', 'quick', 'kpi', 'chart', 'list'])
  })

  it.each([
    // The group totals from the Widget Library screenshots. Every one is fully built now, so
    // added and total are the same number — the screenshots' own "2 / 2", "5 / 5", "19 / 19",
    // "5 / 5", "3 / 3".
    ['personal', 2],
    ['quick', 5],
    ['kpi', 19],
    ['chart', 5],
    ['list', 3],
  ] as const)('%s group holds %i widgets, all built', (group, total) => {
    const widgets = widgetsInGroup(group)
    expect(widgets, `${group} total`).toHaveLength(total)
    expect(
      widgets.filter((w) => w.available),
      `${group} built`
    ).toHaveLength(total)
  })

  it('has no widget left unbuilt', () => {
    // Every one of the thirty-four draws real data now. `available: false` meant a "Widget
    // coming soon" placeholder, and the eight that carried it — Notifications, New Invoice,
    // Total Parties, Total Items, Active Users, Sales vs Purchase, My Job Cards and Recent
    // Parties — were each built against a source this app already holds.
    expect(DASHBOARD_WIDGETS.filter((w) => !w.available).map((w) => w.key)).toEqual([])
  })

  it('still covers everything the export enables', () => {
    const built = DASHBOARD_WIDGETS.filter((w) => w.available).map((w) => w.key)
    const expected = exportedWidgets.filter((w) => w.visible).map((w) => w.key)
    expect(expected.filter((key) => !built.includes(key))).toEqual([])
  })

  it('has no duplicate keys and no blank copy', () => {
    const keys = DASHBOARD_WIDGETS.map((w) => w.key)
    expect(new Set(keys).size, 'duplicate widget key').toBe(keys.length)
    expect(DASHBOARD_WIDGETS.filter((w) => !w.label.trim() || !w.description.trim())).toEqual([])
  })

  it('every group in the catalogue is a declared group', () => {
    const declared = new Set(WIDGET_GROUPS.map((g) => g.key))
    expect(DASHBOARD_WIDGETS.filter((w) => !declared.has(w.group)).map((w) => w.key)).toEqual([])
  })
})
