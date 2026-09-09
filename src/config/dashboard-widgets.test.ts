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

  it('enables exactly the 26 the export enables for OWNER', () => {
    const expected = exportedWidgets
      .filter((w) => w.visible)
      .map((w) => w.key)
      .sort()
    expect(Object.keys(allWidgetsEnabled()).sort()).toEqual(expected)
    // Stated outright, because the screenshots show "26 active" and "26 widgets" in three places.
    expect(expected).toHaveLength(26)
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

  it('never enables a widget the product has not built', () => {
    // An enabled-but-unbuilt widget puts a toggle in Role Configure that changes nothing on the
    // Dashboard, which is worse than not offering it at all.
    const enabled = new Set(Object.keys(allWidgetsEnabled()))
    const unbuilt = DASHBOARD_WIDGETS.filter((w) => !w.available && enabled.has(w.key))
    expect(unbuilt.map((w) => w.key)).toEqual([])
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
