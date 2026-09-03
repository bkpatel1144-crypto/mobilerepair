import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { sessionsCollection } from '@/lib/firestore-paths'
import { useAuth } from '@/hooks/use-auth'
import { getCurrentSessionId, heartbeatCurrentSession } from '@/lib/session-lifecycle'
import type { SessionDoc } from '@/types/firestore'

export interface SessionWithId extends SessionDoc { id: string }

/** "Online" = active within the last 5 minutes and not explicitly signed out — matches the
 * heartbeat interval below closely enough that a genuinely open tab never flickers in and out of
 * this window between beats. "Idle" (`preview (20)`'s own "Idle (30m+)" stat) is a session that's
 * gone quiet for 30+ minutes but hasn't hit its 24h `expiresAt` yet. */
const ONLINE_WINDOW_MS = 5 * 60 * 1000
const IDLE_THRESHOLD_MS = 30 * 60 * 1000
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000

export function sessionsQueryKey(companyId: string | undefined) {
  return ['sessions', companyId] as const
}

export function useSessions() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  return useQuery({
    queryKey: sessionsQueryKey(companyId),
    queryFn: async () => {
      // No server-side `orderBy` here, deliberately — a session doc's `signedInAt` is a
      // `serverTimestamp()` sentinel that reads back as `null` locally until the server
      // acknowledges it, and Firestore's query engine *excludes* a document entirely from an
      // `orderBy()`-sorted result while its sort field is null. A session created moments ago
      // (the overwhelmingly common case right after this exact page's own signup/login) would
      // otherwise vanish from "Active Sessions" until that round trip completes and something
      // happens to trigger a refetch — sort client-side instead, which simply treats a
      // not-yet-resolved timestamp as "now" rather than dropping the row.
      const snap = await getDocs(collection(db, sessionsCollection(companyId!)))
      const sessions = snap.docs.map((d) => ({ id: d.id, ...(d.data() as SessionDoc) }))
      const now = new Date().getTime() // not the bare `Date.now()` call — see this project's own established React Compiler purity fix
      return sessions.sort((a, b) => (b.signedInAt?.toDate?.()?.getTime() ?? now) - (a.signedInAt?.toDate?.()?.getTime() ?? now))
    },
    enabled: !!companyId,
    // Sessions change on their own (heartbeats, expiry) even with nobody clicking anything on
    // this exact page — a shorter stale window keeps "Currently Online" honest without a live
    // listener this app-wide a feature doesn't otherwise need.
    staleTime: 30_000,
  })
}

function minutesSince(ts: SessionDoc['lastActivityAt']): number {
  const at = ts?.toDate?.()
  if (!at) return Infinity
  return (Date.now() - at.getTime()) / 60_000
}

export function isSessionActive(session: SessionDoc): boolean {
  if (session.endedAt) return false
  const expiresAt = session.expiresAt?.toDate?.()
  if (expiresAt && expiresAt.getTime() < Date.now()) return false
  return true
}

export function isSessionOnline(session: SessionDoc): boolean {
  return isSessionActive(session) && minutesSince(session.lastActivityAt) * 60_000 < ONLINE_WINDOW_MS
}

export function isSessionIdle(session: SessionDoc): boolean {
  return isSessionActive(session) && minutesSince(session.lastActivityAt) * 60_000 >= IDLE_THRESHOLD_MS
}

export function isCurrentSession(session: SessionWithId): boolean {
  return session.id === getCurrentSessionId()
}

/** Mounted once in `AppShell` — keeps the current tab's own session doc's `lastActivityAt`
 * moving forward every couple of minutes for as long as the app stays open, so "Currently
 * Online" reflects a tab that's genuinely still there, not just one that signed in once and was
 * forgotten. Fires once immediately on mount, then on the interval — never on every route change
 * (that would be a write per navigation for zero real benefit at this app's actual traffic). */
export function useSessionHeartbeat() {
  const { profile } = useAuth()
  const companyId = profile?.companyId

  useEffect(() => {
    if (!companyId) return
    void heartbeatCurrentSession(companyId)
    const id = setInterval(() => void heartbeatCurrentSession(companyId), HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(id)
  }, [companyId])
}
