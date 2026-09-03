import { createContext, useContext, useEffect } from 'react'

export interface BreadcrumbExtraContextValue {
  extra: string | null
  setExtra: (label: string | null) => void
}

export const BreadcrumbExtraContext = createContext<BreadcrumbExtraContextValue | null>(null)

function useBreadcrumbExtraContext() {
  const ctx = useContext(BreadcrumbExtraContext)
  if (!ctx) throw new Error('useBreadcrumbExtra must be used within BreadcrumbExtraProvider')
  return ctx
}

/** Call from a page to set (or clear, by passing `null`) the trailing breadcrumb crumb while
 * it's mounted — e.g. `useBreadcrumbExtra('Create')`, or `useBreadcrumbExtra(role?.name ?? null)`
 * once a role/job/etc. has loaded. Automatically clears itself on unmount so navigating away
 * never leaves a stale crumb showing on the next page. */
export function useBreadcrumbExtra(label: string | null) {
  const { setExtra } = useBreadcrumbExtraContext()
  useEffect(() => {
    setExtra(label)
    return () => setExtra(null)
  }, [label, setExtra])
}

/** `TopBar`'s own read side — separate from the setter hook so it doesn't accidentally reset
 * the value it's meant to just be displaying. */
export function useBreadcrumbExtraValue(): string | null {
  return useBreadcrumbExtraContext().extra
}
