import { collection, doc, getDoc, serverTimestamp, Timestamp, writeBatch, type WriteBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { branchDoc, sessionDoc, sessionsCollection } from '@/lib/firestore-paths'
import { getClientIp } from '@/lib/audit-log'
import { deviceLabelFromUserAgent } from '@/lib/user-agent'
import type { BranchDoc, SessionDoc } from '@/types/firestore'

/**
 * Creates/ends the `sessions` doc backing Active Sessions (`preview (20)`) — called from
 * `src/lib/auth.ts` on every successful login/signup, and on explicit logout. The doc's own
 * Firestore id (not a separately-minted token) is what `sessionStorage` stashes to answer "is
 * this row my current session" — see `SessionDoc`'s own doc comment.
 */

const CURRENT_SESSION_STORAGE_KEY = 'aim-current-session-id'

// A fixed 24h session length is a placeholder for "Auto-expires on" — there's no server-issued
// token this project could mirror the real expiry of (Firebase ID tokens refresh silently client-
// side and don't actually end a session at any fixed point), so this is the closest honest stand-
// in: long enough not to be disruptive, short enough that a truly abandoned session doesn't read
// as "online" forever.
const SESSION_LENGTH_MS = 24 * 60 * 60 * 1000

function persistCurrentSessionId(id: string) {
  try {
    sessionStorage.setItem(CURRENT_SESSION_STORAGE_KEY, id)
  } catch {
    // Private-window/site-data-blocked case — "this is your current session" simply won't
    // highlight for this tab; every other Sessions feature still works.
  }
}

/** Synchronous — takes an already-resolved `ip`/`branchName` rather than fetching them itself,
 * so a caller that already has a batch open (`seedTenantForUser()`'s own bootstrap batch) can add
 * this session doc to *that same* atomic commit instead of a separate, later write.
 *
 * This matters for more than tidiness: `GuestOnlyRoute` redirects a freshly-signed-up Owner to
 * `/app/dashboard` the moment their `users/{uid}` profile doc becomes visible via its own
 * real-time listener — a completely independent code path from whatever `signUp()`'s own JS
 * does next. A session write that happened as a separate `await` *after* the bootstrap batch
 * resolved was consistently landing 1-3s *after* that redirect already fired (this project's own
 * documented Firestore round-trip latency), so a same-tab observer (a test, or a fast-clicking
 * real user) could reach Active Sessions before the row existed. Writing it into the *same* batch
 * means it's guaranteed visible at the exact moment the profile that unblocks the redirect is. */
export function addSessionToBatch(
  batch: WriteBatch,
  companyId: string,
  input: { userId: string; userName: string; roleName: string; branchName: string; ip: string | null }
): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const ref = doc(collection(db, sessionsCollection(companyId)))
  const now = serverTimestamp()
  const data: SessionDoc = {
    userId: input.userId,
    userName: input.userName,
    roleName: input.roleName,
    branchName: input.branchName,
    ip: input.ip,
    userAgent: ua,
    deviceLabel: deviceLabelFromUserAgent(ua),
    signedInAt: now as never,
    lastActivityAt: now as never,
    expiresAt: Timestamp.fromMillis(Date.now() + SESSION_LENGTH_MS),
    endedAt: null,
  }
  batch.set(ref, data)
  persistCurrentSessionId(ref.id)
  return ref.id
}

/** Convenience wrapper for `logIn()` — resolves ip/branch itself and commits its own batch,
 * since a login has no other in-flight batch to piggyback on and (unlike signup) its own
 * `navigate()` call genuinely awaits `logIn()`'s full completion, so there's no equivalent race
 * to design around. */
export async function startSession(
  companyId: string,
  userId: string,
  userName: string,
  roleName: string,
  branchId: string
): Promise<void> {
  const [ip, branchSnap] = await Promise.all([
    getClientIp(),
    getDoc(doc(db, branchDoc(companyId, branchId))),
  ])
  const branchName = branchSnap.exists() ? (branchSnap.data() as BranchDoc).name : 'Main Branch'
  const batch = writeBatch(db)
  addSessionToBatch(batch, companyId, { userId, userName, roleName, branchName, ip })
  await batch.commit()
}

export function getCurrentSessionId(): string | null {
  try {
    return sessionStorage.getItem(CURRENT_SESSION_STORAGE_KEY)
  } catch {
    return null
  }
}

/** Best-effort — a session doc that fails to close just ages out on its own once
 * `lastActivityAt` stops advancing (dropping out of "Currently Online"), same as any browser
 * crash/force-close would anyway. */
export async function endCurrentSession(companyId: string): Promise<void> {
  const sessionId = getCurrentSessionId()
  if (sessionId) {
    try {
      await writeBatch(db)
        .update(doc(db, sessionDoc(companyId, sessionId)), { endedAt: serverTimestamp() })
        .commit()
    } catch {
      // See doc comment above.
    }
  }
  try {
    sessionStorage.removeItem(CURRENT_SESSION_STORAGE_KEY)
  } catch {
    // Nothing to clean up if it never got set.
  }
}

/** Bumps `lastActivityAt` on the current session — called on a throttled interval by
 * `useSessionHeartbeat()` while the app shell is mounted. Silently a no-op with no session
 * recorded (e.g. mid-recovery-flow before `startSession` has ever run). */
export async function heartbeatCurrentSession(companyId: string): Promise<void> {
  const sessionId = getCurrentSessionId()
  if (!sessionId) return
  try {
    await writeBatch(db)
      .update(doc(db, sessionDoc(companyId, sessionId)), { lastActivityAt: serverTimestamp() })
      .commit()
  } catch {
    // A heartbeat that fails once just tries again next interval — not worth surfacing.
  }
}
