import { DASHBOARD_WIDGETS } from '@/config/dashboard-widgets'

/**
 * Reads a role's `visibleWidgets` map whichever key format it was saved in.
 *
 * The catalogue used to have eighteen flat keys of its own — `totalJobCards`, `revenue`,
 * `revenueTrendChart` — before it was rebuilt against the client's export, which spells them
 * `kpi.jobcards.total`, `kpi.revenue`, `chart.revenue.trend`. Every role saved before that
 * rebuild still holds the old ones, and because `visibleWidgets` is a
 * `Record<string, boolean>` nothing complained.
 *
 * What it produced instead was two screens disagreeing about the same role. The Dashboard treats
 * an absent key as visible, so an old role's dashboard looked complete. The Dashboard & Landing
 * tab treated an absent key as *off*, so opening it showed every widget unticked and an empty
 * preview — which is what a shopkeeper reported: "why is this empty every time".
 *
 * Both now read through here, so an old map is understood, and the next save rewrites it in the
 * current keys.
 */

/**
 * Old key -> current key.
 *
 * Two pairs are worth a note. The old catalogue had `totalJobCards` (job cards in the selected
 * range) and `allJobCards` (every job card), and the new one has `kpi.jobcards.total` (every job
 * card) and `kpi.jobcards.today` (the selected range) — the labels swapped sides. These are
 * mapped by *label*, so a role that was showing a tile called "Total Job Cards" still shows one:
 * the alternative is a mapping that reads correctly in the code and moves a tile the shopkeeper
 * chose.
 */
const LEGACY_WIDGET_KEYS: Record<string, string> = {
  totalJobCards: 'kpi.jobcards.total',
  allJobCards: 'kpi.jobcards.today',
  totalInPipeline: 'kpi.jobcards.pipeline',
  revenue: 'kpi.revenue',
  outstanding: 'kpi.outstanding',
  inProgress: 'kpi.jobcards.in_progress',
  pending: 'kpi.jobcards.pending',
  avgTurnaround: 'kpi.turnaround',
  cancelled: 'kpi.jobcards.cancelled',
  inQueue: 'kpi.jobcards.queued',
  onHold: 'kpi.jobcards.hold',
  techDone: 'kpi.jobcards.tech_done',
  ready: 'kpi.jobcards.ready',
  delivered: 'kpi.jobcards.delivered',
  closed: 'kpi.jobcards.closed',
  pendingReturn: 'kpi.jobcards.pending_return',
  jobCardsByStatusChart: 'chart.jobcards.by_status',
  revenueTrendChart: 'chart.revenue.trend',
}

const CATALOGUE_KEYS = new Set(DASHBOARD_WIDGETS.map((w) => w.key))

/** Is this map still in the pre-rebuild key format? */
export function isLegacyWidgetMap(stored: Record<string, boolean> | undefined | null): boolean {
  if (!stored) return false
  const keys = Object.keys(stored)
  if (!keys.length) return false
  return (
    keys.some((key) => LEGACY_WIDGET_KEYS[key] !== undefined) &&
    !keys.some((key) => CATALOGUE_KEYS.has(key))
  )
}

/**
 * A `visibleWidgets` map in the current keys.
 *
 * A current key passes through. A recognised old key is translated. Anything else is dropped —
 * it can only be a widget this app no longer has, and carrying it forward would inflate the
 * counters that run over the stored map.
 */
export function normalizeVisibleWidgets(
  stored: Record<string, boolean> | undefined | null
): Record<string, boolean> {
  if (!stored) return {}
  const out: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(stored)) {
    if (CATALOGUE_KEYS.has(key)) {
      out[key] = value
      continue
    }
    const mapped = LEGACY_WIDGET_KEYS[key]
    if (mapped) out[mapped] = value
  }
  return out
}

/**
 * Is this widget shown, given a role's stored map?
 *
 * The single rule both the Dashboard and the Role Configure tab use, which is the point of it
 * existing: they had `=== true` on one side and `!== false` on the other and therefore showed
 * different dashboards for the same role.
 *
 * Absent means visible. A role document lists the widgets that existed when it was saved, so
 * keying off `=== true` would make every widget added later invisible until someone re-saved
 * each role by hand. Hiding is always explicit.
 */
export function widgetIsOn(
  visibleWidgets: Record<string, boolean> | undefined | null,
  key: string
): boolean {
  if (!CATALOGUE_KEYS.has(key)) return false
  return normalizeVisibleWidgets(visibleWidgets)[key] !== false
}
