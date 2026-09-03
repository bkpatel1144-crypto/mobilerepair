import { addDoc, collection, doc, getDoc, serverTimestamp, type WriteBatch } from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { db } from '@/lib/firebase'
import { auditLogCollection, branchDoc } from '@/lib/firestore-paths'
import type { AuditLogDoc, AuditResult, BranchDoc, UserDoc } from '@/types/firestore'

/**
 * The one place every mutation in the app (since Phase 2) writes its `auditLog` entry from —
 * per BUILD_PLAN.md Phase 8's own instruction to retrofit every existing write path with a
 * shared `logAudit()` call, now that this collection has a real page (System Audit) reading it.
 *
 * Always called with the SAME `WriteBatch` the real mutation is about to commit, never a
 * separate `commit()` — an audit entry exists **iff** the write it's recording actually landed,
 * the same atomicity guarantee every cross-collection write in this app has followed since
 * Phase 6 (a receipt + a job's `paidAmount`, a sale + a purchase's `status`, etc.). This is also
 * why every `result` this file ever writes for a *mutation* audit entry is `'success'` — a write
 * that failed never reaches `batch.commit()` at all, so there's structurally no "failed mutation"
 * audit row to produce. `'unauthorized'`/`'blocked'` only ever come from `src/lib/auth.ts`'s own
 * login-attempt logging (see there), which is the one case where "the write" is really "record
 * that a login was rejected," not a normal CRUD mutation.
 */

// ---- Client IP (best-effort, advisory only — see `ip-enforcement.ts`'s own doc comment for why
// nothing server-side can make this authoritative in a project with no server component). Cached
// module-level so every audit-log write in one page session doesn't re-fetch it. ----
let ipCache: Promise<string | null> | null = null
export function getClientIp(): Promise<string | null> {
  if (!ipCache) {
    ipCache = fetch('https://api.ipify.org?format=json')
      .then((r) => r.json())
      .then((d: { ip?: string }) => d.ip ?? null)
      .catch(() => null)
      // Don't let one transient failure (a network blip, the free API rate-limiting a page that's
      // made many calls) poison every audit-log write for the rest of this page's lifetime with a
      // permanent `ip: null`. Only a *successful* lookup is worth caching; a failed one clears
      // itself so the next call gets a fresh attempt instead of reusing the same failure forever.
      .then((ip) => {
        if (ip == null) ipCache = null
        return ip
      })
  }
  return ipCache
}

// ---- Branch name (every company has exactly one branch, "Main Branch," until Phase 10 builds
// real Branch Management) — cached per `branchId` so this is one `getDoc` per branch per page
// session, not one per audit-log write. ----
const branchNameCache = new Map<string, string>()
async function getBranchName(companyId: string, branchId: string): Promise<string> {
  const cached = branchNameCache.get(branchId)
  if (cached) return cached
  try {
    const snap = await getDoc(doc(db, branchDoc(companyId, branchId)))
    const name = snap.exists() ? (snap.data() as BranchDoc).name : 'Main Branch'
    branchNameCache.set(branchId, name)
    return name
  } catch {
    return 'Main Branch'
  }
}

export interface AuditContext {
  companyId: string
  uid: string
  userName: string
  roleName: string
  branchId: string
}

/** Builds an `AuditContext` from `useAuth()`'s own `user`/`profile` pair — the shape every
 * mutation hook already has in scope, so a call site never has to hand-assemble this. */
export function auditContextFrom(user: FirebaseUser, profile: UserDoc): AuditContext {
  return {
    companyId: profile.companyId,
    uid: user.uid,
    userName: profile.fullName,
    roleName: profile.roleName,
    branchId: profile.branchId,
  }
}

export interface AuditInput {
  /** Human label for the table's own "Action" column — "Create", "Update", "Void", "Take Job",
   * "Generate Bill", "Login", etc. Specific enough to read on its own, not just "Update". */
  action: string
  /** `PERMISSION_SCHEMA` section key ("service", "finance", "masters", ...), plus `"auth"` for
   * login/signup events that don't belong to any real module. */
  module: string
  entityType: string
  entityId?: string | null
  entityLabel: string
  targetLabel?: string
  /** Matches BUILD_PLAN.md's own critical-action list (Job Costing Create, Second Hand Device
   * Sale/Purchase Create, Payment Receipt Create, Job Card Bill) and its own "extend sensibly"
   * instruction — also true for anything that changes who can access what (Role/User writes) or
   * reverses money already recorded (Void Receipt). */
  critical?: boolean
  result?: AuditResult
  details?: Record<string, unknown>
}

/** Adds one `auditLog` document to `batch` — does not commit it (the caller's own
 * `batch.commit()`, right after, is what makes this atomic with the real write). */
export async function addAuditLogToBatch(
  batch: WriteBatch,
  ctx: AuditContext,
  input: AuditInput
): Promise<void> {
  const [ip, branchName] = await Promise.all([getClientIp(), getBranchName(ctx.companyId, ctx.branchId)])
  const ref = doc(collection(db, auditLogCollection(ctx.companyId)))
  const data: AuditLogDoc = {
    action: input.action,
    module: input.module,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    entityLabel: input.entityLabel,
    targetLabel: input.targetLabel ?? input.entityLabel,
    critical: input.critical ?? false,
    result: input.result ?? 'success',
    details: input.details ?? {},
    performedById: ctx.uid,
    performedByName: ctx.userName,
    performedByRole: ctx.roleName,
    performedByBranch: branchName,
    ip,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    createdAt: serverTimestamp() as never,
  }
  batch.set(ref, data)
}

function buildLoginAuditData(uid: string, profile: UserDoc, result: AuditResult, ip: string | null, note?: string): AuditLogDoc {
  return {
    action: 'Login',
    module: 'auth',
    entityType: 'Login',
    entityId: uid,
    entityLabel: profile.email,
    targetLabel: profile.email,
    critical: result !== 'success',
    result,
    details: note ? { note } : {},
    performedById: uid,
    performedByName: profile.fullName,
    performedByRole: profile.roleName,
    // Skips the branch-name lookup `addAuditLogToBatch` does for ordinary mutations — a login
    // event fires before the app shell (and its usual audit call sites) ever mounts, and
    // Login Report never actually surfaces a branch column, so the extra `getDoc` isn't worth it.
    performedByBranch: '—',
    ip,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    createdAt: serverTimestamp() as never,
  }
}

/** A login attempt is the one audited event that isn't "record this alongside a real write" —
 * the login *is* the event, so this writes standalone rather than joining a batch. Only ever
 * called for an attempt Firebase Auth has already validated (credentials were correct); see
 * `src/lib/auth.ts`'s own doc comment for why a genuinely wrong-password/no-such-account attempt
 * can't be attributed to a tenant and therefore can't be persisted here at all — this file's
 * `result` type (`'success' | 'unauthorized' | 'blocked'`) has no `'failure'` member for exactly
 * that reason. Login Report (`preview (18)`) reads this same `auditLog` collection, filtered to
 * `entityType === 'Login'`, rather than a second collection.
 *
 * Also registers itself as a pending write via `trackPendingAuditWrite` — belt-and-suspenders on
 * top of `logIn()`'s own top-level registration of the whole attempt (see its doc comment for the
 * race this closes); harmless for this function's other caller, `completeAccountSetup()`'s
 * fire-and-forget `'success'` log, which never leads to an immediate sign-out. */
export async function logLoginEvent(
  companyId: string,
  uid: string,
  profile: UserDoc,
  result: AuditResult,
  note?: string
): Promise<void> {
  const write = (async () => {
    const ip = await getClientIp()
    await addDoc(collection(db, auditLogCollection(companyId)), buildLoginAuditData(uid, profile, result, ip, note))
  })()
  trackPendingAuditWrite(write)
  await write
}

// ---- Pending-write tracking — `logOut()` awaits this before calling `firebaseSignOut()`, so a
// rejection's own audit entry always gets a chance to actually reach the server first, regardless
// of how fast the screen reporting the rejection gets dismissed. `logIn()` registers its *entire*
// attempt here from the moment it's called (not just this file's own `logLoginEvent()` write) —
// see its own doc comment for why the write-only version isn't enough on its own: the "Sign Out"
// race can land before `logIn()` has even reached the point of calling `logLoginEvent()` at all. */
let pendingAuditWrite: Promise<unknown> | null = null
export function trackPendingAuditWrite(write: Promise<unknown>): void {
  const settled = write.catch(() => {})
  pendingAuditWrite = settled
  void settled.then(() => {
    if (pendingAuditWrite === settled) pendingAuditWrite = null
  })
}
export async function flushPendingAuditWrite(): Promise<void> {
  if (pendingAuditWrite) await pendingAuditWrite
}

/** Synchronous batch-add sibling of `logLoginEvent()`, for exactly one caller:
 * `seedTenantForUser()`'s own signup batch. See `addSessionToBatch()`'s doc comment in
 * `session-lifecycle.ts` for why a brand-new Owner's login event and session need to land in the
 * *same* atomic write as their profile doc, not a separate `await` afterward — `GuestOnlyRoute`
 * redirects the instant that profile doc's own listener fires, a completely independent code
 * path from whatever `signUp()` does next, and consistently won that race. */
export function addLoginAuditToBatch(batch: WriteBatch, companyId: string, uid: string, profile: UserDoc, ip: string | null): void {
  const ref = doc(collection(db, auditLogCollection(companyId)))
  batch.set(ref, buildLoginAuditData(uid, profile, 'success', ip))
}
