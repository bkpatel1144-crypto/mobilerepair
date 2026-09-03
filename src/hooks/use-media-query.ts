import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [trackedQuery, setTrackedQuery] = useState(query)
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  // "Adjusting state during rendering" (react.dev) rather than syncing it from an effect body —
  // keeps this hook correct if `query` itself ever changes, without the effect-body setState
  // cascading-render footgun react-hooks/set-state-in-effect flags.
  if (query !== trackedQuery) {
    setTrackedQuery(query)
    setMatches(window.matchMedia(query).matches)
  }

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** Matches Tailwind's `md` breakpoint — the app shell's own mobile/desktop split. */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}
