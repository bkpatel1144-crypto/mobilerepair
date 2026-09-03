import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { DEFAULT_ROLE_SEEDS } from '@/config/default-roles'
import { getCurrentFinancialYear } from '@/lib/financial-year'
import { addDefaultServiceOptionsToBatch } from '@/lib/service-options-seed'
import { addDefaultMastersToBatch } from '@/lib/masters-seed'
import { addDefaultPrintTemplatesToBatch } from '@/lib/print-templates-seed'
import { DEFAULT_WHATSAPP_TEMPLATES } from '@/lib/whatsapp'
import {
  branchesCollection,
  financialYearsCollection,
  ipWhitelistCollection,
  rolesCollection,
  userDoc,
  whatsappConfigDoc,
  backupSettingsDoc,
} from '@/lib/firestore-paths'
import { slugifyCode } from '@/lib/utils'
import { cacheProfile, clearProfileCache } from '@/lib/profile-cache'
import { getClientIp, logLoginEvent, addLoginAuditToBatch, trackPendingAuditWrite, flushPendingAuditWrite } from '@/lib/audit-log'
import { endCurrentSession, startSession, addSessionToBatch } from '@/lib/session-lifecycle'
import { isIpAllowed } from '@/lib/ip-enforcement'
import type { BranchDoc, CompanyDoc, FinancialYearDoc, IpWhitelistDoc, RoleDoc, UserDoc } from '@/types/firestore'

export interface SignUpInput {
  companyName: string
  fullName: string
  email: string
  password: string
}

export interface SignUpResult {
  uid: string
  companyId: string
  branchId: string
}

/**
 * Builds and commits the one bootstrap batch — company/branch/financial year/5 roles/default
 * device types/user profile — shared by both a brand-new signup and `completeAccountSetup()`'s
 * recovery path for an Auth account whose original batch never landed. Per BUILD_PLAN.md Phase
 * 2, this either all exists or none of it does, never a half-created tenant — see
 * firestore.rules' `isBootstrapping()` for how this is allowed to write documents the caller
 * doesn't "belong to" yet (the one moment that's true). Never call this for a uid that might
 * already have a profile doc; both callers are responsible for that check.
 */
async function seedTenantForUser(
  uid: string,
  email: string,
  companyName: string,
  fullName: string
): Promise<SignUpResult> {
  // Kicked off now, alongside everything else below, rather than awaited later — see
  // `addSessionToBatch()`'s own doc comment for why the session/audit-log docs this resolves
  // into need to land in the *same* batch as the profile doc below, not a later separate write.
  const ipPromise = getClientIp()

  const batch = writeBatch(db)
  const now = serverTimestamp() as Timestamp

  const companyRef = doc(collection(db, 'companies'))
  const companyId = companyRef.id
  const companyData: CompanyDoc = {
    name: companyName,
    code: slugifyCode(companyName, 12),
    legalName: companyName,
    gstRegistration: 'Unregistered',
    gstin: null,
    pan: null,
    email,
    phone: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    protected: true,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
  batch.set(companyRef, companyData)

  const branchRef = doc(collection(db, branchesCollection(companyId)))
  const branchId = branchRef.id
  const branchData: BranchDoc = {
    name: 'Main Branch',
    code: 'MAIN',
    type: 'system',
    protected: true,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
  batch.set(branchRef, branchData)

  const fy = getCurrentFinancialYear()
  const fyRef = doc(collection(db, financialYearsCollection(companyId)))
  const fyData: FinancialYearDoc = {
    name: fy.name,
    startDate: Timestamp.fromDate(fy.startDate),
    endDate: Timestamp.fromDate(fy.endDate),
    isActive: true,
    isLocked: false,
    isCurrent: true,
    createdAt: now,
    updatedAt: now,
  }
  batch.set(fyRef, fyData)

  let ownerRoleId = ''
  for (const seed of DEFAULT_ROLE_SEEDS) {
    const roleRef = doc(collection(db, rolesCollection(companyId)))
    if (seed.code === 'OWNER') ownerRoleId = roleRef.id
    const roleData: RoleDoc = {
      name: seed.name,
      code: seed.code,
      type: seed.type,
      protected: seed.protected,
      status: 'active',
      fullAccess: seed.fullAccess,
      menuPermissions: seed.menuPermissions,
      actionPermissions: seed.actionPermissions,
      dashboardConfig: seed.dashboardConfig,
      createdAt: now,
      updatedAt: now,
    }
    batch.set(roleRef, roleData)
  }

  // A brand-new Job Cards module with zero device types/brands/models to pick from is unusable
  // on day one — seed the real-world default dataset (`src/data/default-service-options.json`)
  // instead of a bare device-type list: device types, brands (shared across the device types
  // they actually apply to, exactly like `preview (73)`'s own data), models scoped to their
  // brand, cancel/hold/outstanding reasons, and customer items. An Owner can rename, reorder,
  // add to, or delete any of it afterward via the Service Options page — this only seeds the
  // starting point, same as the 5 default roles or the seeded Main Branch.
  addDefaultServiceOptionsToBatch(batch, companyId, now)

  // Same reasoning, for Phase 7's Masters: Units of Measure, Payment Modes, Party Categories,
  // and Item Categories all seed a real starting dataset rather than launching every new
  // company's Item Master / Parties pages against empty dropdowns.
  addDefaultMastersToBatch(batch, companyId, now)

  // Phase 10: one protected default print template per document type, so every real "Print X"
  // button in the app (Job Card, Second Hand Device receipts/labels, …) has something to
  // actually render from the very first signup, same "real usable defaults" reasoning as above.
  addDefaultPrintTemplatesToBatch(batch, companyId, uid, fullName)

  // Phase 10: a default WhatsApp message per lifecycle event — replaces what was, until now, a
  // single hardcoded message string baked into the Job Card detail page's own WhatsApp button.
  batch.set(doc(db, whatsappConfigDoc(companyId)), {
    countryCode: '91',
    templates: DEFAULT_WHATSAPP_TEMPLATES,
    updatedAt: now,
  })

  // Phase 10: Backup & Restore's scheduler preference — off by default, matching every other
  // opt-in toggle in this app; see `BackupSettingsDoc`'s own doc comment for why this can persist
  // the preference but never actually fire itself unattended in a client-SDK-only project.
  batch.set(doc(db, backupSettingsDoc(companyId)), {
    dailyAutoBackupEnabled: false,
    timeOfDay: '02:00',
    keepForDays: 7,
    updatedAt: now,
  })

  const userRef = doc(db, userDoc(uid))
  const userData: UserDoc = {
    companyId,
    branchId,
    roleId: ownerRoleId,
    roleName: 'Owner',
    roleCode: 'OWNER',
    fullName,
    email,
    mobile: null,
    protected: true,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
  batch.set(userRef, userData)

  // Phase 8: a brand-new Owner's very first sign-in is itself a real login event and a real
  // session — added to this exact same batch (not a separate `await` after `commit()`) so both
  // are guaranteed to exist at the moment `GuestOnlyRoute`'s own listener sees the profile doc
  // above and redirects to the dashboard. `branchName` is known synchronously here (this
  // function is the one place that just decided it's "Main Branch"), so no `getDoc` is needed
  // the way `startSession()`'s own standalone version needs one for a later login.
  const ip = await ipPromise
  addLoginAuditToBatch(batch, companyId, uid, userData, ip)
  addSessionToBatch(batch, companyId, { userId: uid, userName: fullName, roleName: 'Owner', branchName: branchData.name, ip })

  await batch.commit()

  // Written to the local profile cache immediately, not just once AuthProvider's own listener
  // eventually confirms it — closes a real race found via live testing, where a hard reload
  // within ~1s of signup could beat a brand-new Firestore connection to seeing this same
  // document, before AuthProvider ever got a chance to cache it itself.
  cacheProfile(uid, userData)

  return { uid, companyId, branchId }
}

export async function signUp({
  companyName,
  fullName,
  email,
  password,
}: SignUpInput): Promise<SignUpResult> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid

  try {
    await updateProfile(credential.user, { displayName: fullName })
    return await seedTenantForUser(uid, email, companyName, fullName)
  } catch (err) {
    // The Auth account was created but seeding failed (e.g. Firestore rules not yet deployed).
    // Leaving an Auth user with no profile doc would make every future login attempt for this
    // email hit a broken, half-onboarded state — clean it up so the email is free to retry.
    //
    // Note this can no longer fire from an in-flight batch write simply losing a race with a
    // page reload/close — `db` uses `persistentLocalCache` (see firebase.ts), so `commit()`
    // enqueues to IndexedDB and survives that. It's still here for a *genuine* failure (rules
    // rejection, sustained offline, quota) that happens while the tab stays open and the
    // rejection actually reaches this catch. A reload/close mid-write instead leaves an Auth
    // account whose queued write completes later in the background — `completeAccountSetup()`
    // below is the net for the rarer case where even that doesn't land.
    await credential.user.delete().catch(() => {
      // If even delete() fails (e.g. requires-recent-login edge case), there's nothing more we
      // can safely do client-side; the original error is what the caller needs to see anyway.
    })
    throw err
  }
}

/**
 * Recovery path for an Auth account with no profile doc — reachable only via `ProtectedRoute`
 * routing here once `usePermissions`'s retry budget has genuinely exhausted itself (see
 * `auth-provider.tsx`), not while it's still plausibly just slow. Re-runs the same bootstrap
 * batch as `signUp()`, for the already-signed-in `uid`, and — unlike `signUp()` — never deletes
 * the Auth account on failure; this is an *existing* account, so a failed retry here should
 * just let the user try again, not destroy it.
 */
export async function completeAccountSetup(
  uid: string,
  email: string,
  companyName: string,
  fullName: string
): Promise<SignUpResult> {
  // One last direct check immediately before seeding — the caller only gets here after its own
  // retry budget gave up, but re-checking here (rather than trusting that) is the difference
  // between "recover a genuinely orphaned account" and "give a legitimately-provisioned user a
  // confusing second company" if the retry logic's timing were ever off.
  const existing = await getDoc(doc(db, userDoc(uid)))
  if (existing.exists()) {
    const data = existing.data() as UserDoc
    cacheProfile(uid, data)
    await Promise.all([
      logLoginEvent(data.companyId, uid, data, 'success').catch(() => {}),
      startSession(data.companyId, uid, data.fullName, data.roleName, data.branchId).catch(() => {}),
    ])
    return { uid, companyId: data.companyId, branchId: data.branchId }
  }

  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: fullName }).catch(() => {
      // Cosmetic (Auth's own displayName) — a failure here shouldn't block getting the tenant
      // data seeded, which is the part that actually unblocks the user.
    })
  }
  return seedTenantForUser(uid, email, companyName, fullName)
}

/**
 * Beyond authenticating the credentials, this is also where Phase 8's two account-level login
 * gates live: a `status: 'disabled'` account is rejected even with a correct password, and a
 * non-Owner from an IP outside an active whitelist is rejected too (see `ip-enforcement.ts` for
 * why that second one is advisory only, never a real security boundary).
 *
 * Both rejected outcomes, and every accepted login, get a real `auditLog` row
 * (`logLoginEvent()`) — but only ever for an attempt that *reached this point*, i.e. Firebase
 * Auth already confirmed the password was correct. A genuinely wrong password / no-such-account
 * throws straight out of `signInWithEmailAndPassword` with no signed-in principal at all, and
 * this project's tenant-scoped rules model (`belongsToCompany()`) has no way to let an
 * unauthenticated client attribute a write to any specific company without opening a spam-write
 * hole for every tenant at once — so that case is surfaced to the login form directly
 * (`getAuthErrorMessage()`) and never persisted. Documented in PROGRESS.md; Login Report's own
 * "Failed Attempts" stat is scoped accordingly.
 *
 * Deliberately does *not* call `firebaseSignOut()` on a disabled/blocked rejection, even though
 * it's about to `throw` — `signInWithEmailAndPassword` above already flipped Firebase's global
 * auth state the instant it resolved, which `GuestOnlyRoute`'s own reactive redirect can act on
 * *before* this function's own (async, Firestore-round-trip-gated) checks below ever get a
 * chance to run, let alone reject. When that race goes that way, this function's `throw` lands on
 * a login-page component that's already unmounted (its `setFormError` becomes a no-op) — but
 * `ProtectedRoute`'s own backstop (`AccountDisabledScreen`/`IpBlockedScreen`) still catches it,
 * reading the same `profile`/IP-whitelist state directly. Signing out here used to force that
 * backstop screen to disappear moments later (replaced by a bare, message-less login form) —
 * *removing* the auto-signout instead leaves whichever surface caught the rejection as the
 * stable, final state; either screen has its own manual "Sign Out" button for how a rejected
 * user actually leaves.
 *
 * The whole call is registered with `trackPendingAuditWrite()` from the very first synchronous
 * tick — not just the `logLoginEvent()` sub-step — and `logOut()` awaits that before it actually
 * signs out. This matters because the race above can land *before this function has even reached
 * its own whitelist/status check*: `IpBlockedScreen`/`AccountDisabledScreen` render off their own
 * independent reactive read (`useIpAccessCheck()`, `profile.status`), which can resolve, and get
 * "Sign Out" clicked, before this function's own `getDoc`/`getDocs` round trip even starts.
 * Tracking only the inner `logLoginEvent()` write (registered lazily, once this function actually
 * reaches it) would leave that earlier window open — tracking the whole attempt from the top
 * closes it regardless of which stage the race lands in. */
export async function logIn(email: string, password: string): Promise<void> {
  const attempt = performLogIn(email, password)
  trackPendingAuditWrite(attempt)
  return attempt
}

async function performLogIn(email: string, password: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid

  const profileSnap = await getDoc(doc(db, userDoc(uid)))
  if (!profileSnap.exists()) {
    // No profile yet — the same "first batch never landed" case `completeAccountSetup()` exists
    // to recover from. Nothing to check or log against without a companyId; let the caller
    // proceed, `ProtectedRoute`'s own `/complete-setup` redirect picks it up from here.
    return
  }
  const profile = profileSnap.data() as UserDoc
  const companyId = profile.companyId

  if (profile.status !== 'active') {
    await logLoginEvent(companyId, uid, profile, 'unauthorized', `Account status: ${profile.status}`)
    throw new Error('This account has been disabled. Contact your Owner or Administrator.')
  }

  if (profile.roleCode !== 'OWNER') {
    const [ip, whitelistSnap] = await Promise.all([
      getClientIp(),
      getDocs(collection(db, ipWhitelistCollection(companyId))),
    ])
    const entries = whitelistSnap.docs.map((d) => d.data() as IpWhitelistDoc)
    if (!isIpAllowed(ip, entries)) {
      await logLoginEvent(companyId, uid, profile, 'blocked', `IP ${ip ?? 'unknown'} not on the whitelist`)
      throw new Error('Access blocked from this network. Ask an Owner to whitelist your IP address.')
    }
  }

  await Promise.all([
    logLoginEvent(companyId, uid, profile, 'success'),
    startSession(companyId, uid, profile.fullName, profile.roleName, profile.branchId),
  ])
}

export async function logOut() {
  const uid = auth.currentUser?.uid
  if (uid) {
    // Best-effort — a session that fails to close here just ages out on its own once
    // `lastActivityAt` stops advancing (see `endCurrentSession`'s own doc comment).
    await getDoc(doc(db, userDoc(uid)))
      .then((snap) => (snap.exists() ? endCurrentSession((snap.data() as UserDoc).companyId) : undefined))
      .catch(() => {})
  }
  // Give a still-in-flight `logIn()` attempt (see its own doc comment) a chance to actually reach
  // the server before the token it needs gets invalidated below — this is exactly the case when
  // `logOut()` is reached from `AccountDisabledScreen`/`IpBlockedScreen`'s own manual "Sign Out"
  // button, moments after `logIn()` rejected the attempt.
  await flushPendingAuditWrite()
  await firebaseSignOut(auth)
  if (uid) clearProfileCache(uid)
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

/** Firebase Auth error codes → copy a signup/login form can show directly. A plain `Error` with
 * no `.code` (the disabled-account/IP-blocked rejections `logIn()` throws itself, deliberately
 * as ordinary `Error`s rather than fabricating a fake Firebase error code for them) passes its
 * own `.message` straight through instead of falling into the generic default below. */
export function getAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  if (!code && err instanceof Error && err.message) return err.message
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists — try logging in instead.'
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts — please wait a moment and try again.'
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this project yet.'
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
