import { useTranslation } from 'react-i18next'

/**
 * Translated Widget Library copy, resolved from a widget's key rather than from the English
 * string in `dashboard-widgets.ts` — the same arrangement `useNavLabels` uses, and for the same
 * reason: the catalogue keeps its English text as what a developer reads and as the fallback,
 * while the locale files key off the identifier that is also the storage format in a role's
 * `visibleWidgets`. Renaming a widget's display text therefore cannot orphan its translation.
 *
 * Widget keys contain dots (`kpi.jobcards.total`), which *is* i18next's key separator, so they are
 * flattened to underscores here. `widgets.labels.kpi_jobcards_total` is one leaf; the dotted form
 * would silently become three levels of nesting.
 *
 * Only the five group headings are translated today. The 34 labels and descriptions fall back to
 * the catalogue's English until that batch is added — `defaultValue` means adding it later is a
 * locale-file change with no component to touch.
 */
export function useWidgetLabels() {
  const { t } = useTranslation()
  const flat = (key: string) => key.replace(/\./g, '_')

  return {
    group: (groupKey: string, fallback: string) =>
      t(`widgets.groups.${groupKey}`, { defaultValue: fallback }),
    label: (widgetKey: string, fallback: string) =>
      t(`widgets.labels.${flat(widgetKey)}`, { defaultValue: fallback }),
    description: (widgetKey: string, fallback: string) =>
      t(`widgets.descriptions.${flat(widgetKey)}`, { defaultValue: fallback }),
  }
}
