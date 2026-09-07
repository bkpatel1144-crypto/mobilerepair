import { useTranslation } from 'react-i18next'
import { DASHBOARD_NAV } from '@/config/nav'

/**
 * Translated navigation labels, resolved from a section key and slug rather than from the English
 * string in `nav.ts`.
 *
 * Keying off the slug is what makes this safe to rename around: `nav.ts` keeps its English labels
 * as the fallback and as what a developer reads, while the locale files key off the identifier
 * that also builds the route and the permission key. Renaming a menu's display text therefore
 * can't silently orphan its translation.
 *
 * The `/` inside an item key ("sales/invoices") is not i18next's key separator — that is `.` —
 * so the flat, slash-joined shape matches `menuKey()` and the permission matrix exactly.
 */
export function useNavLabels() {
  const { t } = useTranslation()

  return {
    dashboard: t('nav.dashboard', { defaultValue: DASHBOARD_NAV.label }),
    /** `fallback` is the English label from nav.ts, used if a locale is missing this key. */
    section: (sectionKey: string, fallback: string) =>
      t(`nav.sections.${sectionKey}`, { defaultValue: fallback }),
    item: (sectionKey: string, slug: string, fallback: string) =>
      t(`nav.items.${sectionKey}/${slug}`, { defaultValue: fallback }),
  }
}
