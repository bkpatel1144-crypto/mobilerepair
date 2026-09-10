import { describe, expect, it } from 'vitest'
import { DASHBOARD_WIDGETS, WIDGET_GROUPS, allWidgetsEnabled, widgetsInGroup } from './dashboard-widgets'
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
    // The counts on each group header in the Widget Library screenshots: added / total.
    ['personal', 1, 2],
    ['quick', 4, 5],
    ['kpi', 16, 19],
    ['chart', 4, 5],
    ['list', 1, 3],
  ] as const)('%s group shows %i / %i added', (group, added, total) => {
    const widgets = widgetsInGroup(group)
    expect(widgets, `${group} total`).toHaveLength(total)
    expect(widgets.filter((w) => w.available), `${group} added`).toHaveLength(added)
  })

  it('marks exactly the 26 the export enables as built', () => {
    // `available` no longer decides whether a widget can be chosen — only whether it draws
    // itself or draws the placeholder. It still has to match the export.
    const built = DASHBOARD_WIDGETS.filter((w) => w.available).map((w) => w.key).sort()
    const expected = exportedWidgets.filter((w) => w.visible).map((w) => w.key).sort()
    expect(built).toEqual(expected)
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
