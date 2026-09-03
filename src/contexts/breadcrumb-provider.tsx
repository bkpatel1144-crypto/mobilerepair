import { useMemo, useState } from 'react'
import { BreadcrumbExtraContext } from '@/contexts/breadcrumb-context'

/** Wraps the authenticated shell once (`AppShell`) so `TopBar` can read the current page's
 * trailing breadcrumb crumb, and any page can set one via `useBreadcrumbExtra`. Route-derived
 * section/leaf crumbs ("Dashboard > Service > Job Cards") come from `findNavEntry` regardless —
 * this only supplies the extra crumb a route pattern alone can't know, like a job's own number
 * or a role's own name, matching the reference app's own multi-level breadcrumbs exactly. */
export function BreadcrumbExtraProvider({ children }: { children: React.ReactNode }) {
  const [extra, setExtra] = useState<string | null>(null)
  const value = useMemo(() => ({ extra, setExtra }), [extra])
  return <BreadcrumbExtraContext.Provider value={value}>{children}</BreadcrumbExtraContext.Provider>
}
