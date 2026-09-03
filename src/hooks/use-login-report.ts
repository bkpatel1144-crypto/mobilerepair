import { useMemo } from 'react'
import { useAuditLog, type AuditLogWithId } from '@/hooks/use-audit-log'
import { useSessions, isSessionOnline } from '@/hooks/use-sessions'

export interface LoginReportData {
  loginEvents: AuditLogWithId[]
  onlineRightNow: number
  loginsToday: number
  usersToday: number
  ipAddressesToday: number
  /** Combined `unauthorized` + `blocked` today — see `src/lib/auth.ts`'s own doc comment for why
   * a genuinely wrong-password attempt isn't counted here at all (it's never persisted). */
  failedAttemptsToday: number
  unauthorizedToday: number
  blockedIpsToday: number
  busiestHourLabel: string | null
}

function formatHourRange(hour: number): string {
  const label = (h: number) => {
    const period = h < 12 ? 'AM' : 'PM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12} ${period}`
  }
  return `${label(hour)} – ${label((hour + 1) % 24)}`
}

/** Login Report (`preview (18)`) — a filtered/aggregated view over the same `auditLog` collection
 * System Audit reads, never a second collection. See `src/lib/auth.ts`'s `logIn()` for exactly
 * which login outcomes actually get a row here (`'success'`/`'unauthorized'`/`'blocked'`) and
 * which can't be (a genuinely wrong password/no-such-account attempt). */
export function useLoginReport() {
  const { data: auditLog = [], isLoading: auditLoading } = useAuditLog()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions()

  const data = useMemo<LoginReportData>(() => {
    const loginEvents = auditLog.filter((e) => e.entityType === 'Login')

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    // A just-written `serverTimestamp()` reads back as null locally until the server acks it —
    // same class of bug as the orderBy-excludes-pending-docs issue fixed elsewhere (see
    // PROGRESS.md's Phase 8 notes). Falling back to epoch here would wrongly drop a login event
    // that happened seconds ago (definitely "today") out of every stat on this page the instant
    // it's created. Falling back to "now" instead means a brand-new event is always counted as
    // today, which is the only fallback that can't be wrong.
    const todayEvents = loginEvents.filter((e) => (e.createdAt?.toDate?.() ?? new Date()) >= startOfToday)

    const successToday = todayEvents.filter((e) => e.result === 'success')
    const unauthorizedToday = todayEvents.filter((e) => e.result === 'unauthorized')
    const blockedToday = todayEvents.filter((e) => e.result === 'blocked')
    const ipSetToday = new Set(todayEvents.map((e) => e.ip).filter((ip): ip is string => !!ip))
    const usersToday = new Set(successToday.map((e) => e.performedById)).size

    const hourCounts = new Map<number, number>()
    for (const e of todayEvents) {
      // Same pending-timestamp fallback as above — bucket an unresolved event into the current
      // hour rather than dropping it from "busiest hour" entirely.
      const at = e.createdAt?.toDate?.() ?? new Date()
      hourCounts.set(at.getHours(), (hourCounts.get(at.getHours()) ?? 0) + 1)
    }
    let busiestHour: number | null = null
    let busiestCount = 0
    for (const [hour, count] of hourCounts) {
      if (count > busiestCount) {
        busiestCount = count
        busiestHour = hour
      }
    }

    return {
      loginEvents,
      onlineRightNow: sessions.filter(isSessionOnline).length,
      loginsToday: successToday.length,
      usersToday,
      ipAddressesToday: ipSetToday.size,
      failedAttemptsToday: unauthorizedToday.length + blockedToday.length,
      unauthorizedToday: unauthorizedToday.length,
      blockedIpsToday: new Set(blockedToday.map((e) => e.ip).filter((ip): ip is string => !!ip)).size,
      busiestHourLabel: busiestHour == null ? null : formatHourRange(busiestHour),
    }
  }, [auditLog, sessions])

  return { data, isLoading: auditLoading || sessionsLoading }
}
