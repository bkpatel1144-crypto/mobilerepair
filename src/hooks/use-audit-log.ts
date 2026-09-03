import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { auditLogCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import type { AuditLogDoc } from '@/types/firestore'

export interface AuditLogWithId extends AuditLogDoc { id: string }

export function auditLogQueryKey(companyId: string | undefined) {
  return ['auditLog', companyId] as const
}

/** Backs both System Audit (`preview (16)`/`(17)`) and Login Report (`preview (18)`, filtered to
 * `entityType === 'Login'` — see `use-login-report.ts`) — one trail, two views over it, same
 * "derive views over an existing collection, don't duplicate data" convention this app has
 * followed since Phase 6's Party Ledger/Cash Book. Fetches the whole collection and sorts
 * client-side, same "small data volumes, compute client-side" convention every other list hook
 * in this app uses (a single shop's real event volume never approaches a size where this
 * matters) — deliberately NOT a server-side `orderBy('createdAt')`, because `createdAt` is a
 * `serverTimestamp()` sentinel that reads back as `null` locally until the server acknowledges
 * it, and Firestore's query engine *excludes* a document entirely from an `orderBy()`-sorted
 * result while its sort field is null. An event logged moments ago (routinely true right after
 * this exact page's own triggering action — a login, a job card create) would otherwise vanish
 * from the trail until that round trip completes. */
export function useAuditLog() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: auditLogQueryKey(companyId),
    queryFn: async () => {
      const snap = await getDocs(collection(db, auditLogCollection(companyId!)))
      const now = new Date().getTime() // not the bare `Date.now()` call — see this project's own established React Compiler purity fix
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as AuditLogDoc) }))
        .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? now) - (a.createdAt?.toDate?.()?.getTime() ?? now))
        .slice(0, 500)
    },
    enabled: !!companyId,
    staleTime: 15_000,
  })
}
