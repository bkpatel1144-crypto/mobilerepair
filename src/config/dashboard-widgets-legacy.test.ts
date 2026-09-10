import { describe, expect, it } from 'vitest'
import {
  isLegacyWidgetMap,
  normalizeVisibleWidgets,
  widgetIsOn,
} from './dashboard-widgets-legacy'
import { DASHBOARD_WIDGETS, allWidgetsEnabled } from './dashboard-widgets'

/**
 * Reproduces the bug a shopkeeper reported — "why is this empty every time" — and pins it shut.
 *
 * A role saved before the catalogue was rebuilt holds the old eighteen keys. The Dashboard read
 * an absent key as visible, so that role's dashboard looked complete; the Dashboard & Landing
 * tab read it as off, so the same role's config screen opened with every widget unticked and an
 * empty preview. Two screens, one role, opposite answers.
 */

/** A role document as it was written before the rebuild. */
const LEGACY_MAP: Record<string, boolean> = {
  totalJobCards: true,
  totalInPipeline: true,
  allJobCards: true,
  revenue: false,
  outstanding: false,
  inProgress: true,
  pending: true,
  avgTurnaround: true,
  cancelled: true,
  inQueue: true,
  onHold: true,
  techDone: true,
  ready: true,
  delivered: true,
  closed: true,
  pendingReturn: true,
  jobCardsByStatusChart: true,
  revenueTrendChart: true,
}

describe('legacy visibleWidgets maps', () => {
  it('recognises an old map', () => {
    expect(isLegacyWidgetMap(LEGACY_MAP)).toBe(true)
    expect(isLegacyWidgetMap(allWidgetsEnabled())).toBe(false)
    expect(isLegacyWidgetMap({})).toBe(false)
    expect(isLegacyWidgetMap(undefined)).toBe(false)
  })

  it('translates every old key to one that exists today', () => {
    const normalized = normalizeVisibleWidgets(LEGACY_MAP)
    const catalogue = new Set(DASHBOARD_WIDGETS.map((w) => w.key))
    expect(Object.keys(normalized)).toHaveLength(Object.keys(LEGACY_MAP).length)
    expect(Object.keys(normalized).filter((k) => !catalogue.has(k))).toEqual([])
  })

  it('keeps what the role deliberately hid', () => {
    // The Technician case: revenue and outstanding were switched off on purpose, and a rename
    // must not quietly switch them back on.
    const normalized = normalizeVisibleWidgets(LEGACY_MAP)
    expect(normalized['kpi.revenue']).toBe(false)
    expect(normalized['kpi.outstanding']).toBe(false)
    expect(widgetIsOn(LEGACY_MAP, 'kpi.revenue')).toBe(false)
    expect(widgetIsOn(LEGACY_MAP, 'kpi.outstanding')).toBe(false)
  })

  it('does not open empty — the bug itself', () => {
    // Every widget the old map had on is on, and the ones added since default to visible.
    const on = DASHBOARD_WIDGETS.filter((w) => widgetIsOn(LEGACY_MAP, w.key))
    expect(on.length).toBe(DASHBOARD_WIDGETS.length - 2) // all but the two it hid
    // Stated the way the report was: the config screen is not blank.
    expect(on.length).toBeGreaterThan(0)
  })

  it('drops a key for a widget this app no longer has', () => {
    expect(normalizeVisibleWidgets({ someWidgetWeDeleted: true })).toEqual({})
    expect(widgetIsOn({ someWidgetWeDeleted: true }, 'someWidgetWeDeleted')).toBe(false)
  })

  it('treats an absent key as visible, and an explicit false as hidden', () => {
    expect(widgetIsOn({}, 'kpi.revenue')).toBe(true)
    expect(widgetIsOn({ 'kpi.revenue': false }, 'kpi.revenue')).toBe(false)
    expect(widgetIsOn(undefined, 'kpi.revenue')).toBe(true)
  })

  it('leaves a current map exactly as it is', () => {
    const current = allWidgetsEnabled()
    expect(normalizeVisibleWidgets(current)).toEqual(current)
  })
})
