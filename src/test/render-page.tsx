// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthContext, type AuthContextValue } from '@/contexts/auth-context'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import hi from '@/locales/hi.json'
import gu from '@/locales/gu.json'
import type { UserDoc } from '@/types/firestore'

/**
 * Renders one app page with the providers `App.tsx` wraps everything in, so a page can be
 * exercised without Firebase, a login, or a network.
 *
 * The point is narrow and worth stating: this catches translation keys leaking to the screen.
 * A wrong or unwrapped key is a perfectly valid string, so tsc and eslint see nothing and the
 * only symptom is a dotted path appearing where a label should be. Rendering the landing page
 * found exactly that in two places — the marketing timeline and the whole FAQ — after every
 * static check had passed.
 *
 * Data comes back empty on purpose. Empty is where the labels live: page titles, column headers,
 * filter chips, empty-state copy. A page full of rows would hide them behind data.
 */

const PROFILE: UserDoc = {
  companyId: 'test-company',
  fullName: 'Test Owner',
  email: 'owner@test.local',
  mobile: '9999999999',
  roleId: 'owner',
  roleName: 'Owner',
  roleCode: 'OWNER',
  branchId: 'main',
  status: 'active',
  createdById: 'test-uid',
  createdByName: 'Test Owner',
  protected: false,
  createdAt: null as never,
  updatedAt: null as never,
} as UserDoc

const AUTH: AuthContextValue = {
  // Only the fields the pages read; `as never` keeps this from needing a whole FirebaseUser.
  user: { uid: 'test-uid', email: 'owner@test.local' } as never,
  profile: PROFILE,
  loading: false,
  profileLoading: false,
  logOut: async () => {},
}

let ready = false

/** Initialises i18next once per file with all three bundles. */
export async function initTestI18n(lng: 'en' | 'hi' | 'gu' = 'en') {
  if (!ready) {
    await i18next.use(initReactI18next).init({
      lng,
      fallbackLng: 'en',
      resources: {
        en: { translation: en },
        hi: { translation: hi },
        gu: { translation: gu },
      },
      interpolation: { escapeValue: false },
    })
    ready = true
  }
  await i18next.changeLanguage(lng)
}

export function renderPage(ui: React.ReactNode, route = '/app') {
  // `retry: false` so a hook whose query rejects (no Firebase here) settles immediately instead
  // of holding the render in a loading state for the default retry/backoff schedule.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthContext.Provider value={AUTH}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </AuthContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

/**
 * Matches a translation key that reached the screen — `pages.masters.uom.unitsOfMeasure` where
 * "Units of Measure" belongs. Anchored on the namespaces the locale files actually use, so a
 * genuine sentence containing a dot is not mistaken for one.
 */
export const LEAKED_KEY =
  /\b(pages|components|shared|common|nav|shell|errors|months)\.[a-zA-Z0-9]+\.[a-zA-Z0-9.]+/
