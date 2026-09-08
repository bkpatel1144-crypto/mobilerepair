import { useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, onSnapshot, type DocumentSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { userDoc } from '@/lib/firestore-paths'
import { logOut as firebaseLogOut } from '@/lib/auth'
import { cacheProfile, clearProfileCache, readCachedProfile } from '@/lib/profile-cache'
import { AuthContext } from '@/contexts/auth-context'
import type { UserDoc } from '@/types/firestore'

// Fallback for when no local cache is available (a different browser/device, or a cleared
// cache) — a signed-in user's own profile doc reporting "not found" is treated as a transient
// propagation race, not a real deleted-account signal, until retried this many times. Sized
// generously since the only cost of over-provisioning is a longer loading spinner in an already
// rare edge case, versus the alternative of confidently showing the wrong thing. In the common
// case (see profile-cache.ts) this fallback never even gets exercised.
const PROFILE_NOT_FOUND_MAX_RETRIES = 12
const PROFILE_NOT_FOUND_RETRY_DELAY_MS = 800

/**
 * Resolves which company the app should be showing, and rewrites `companyId` to it.
 *
 * This is the entire company switcher. Every hook, path helper, mutation and audit entry in the
 * app already reads `profile.companyId`; overwriting it here means none of them had to learn
 * that more than one company can exist. `homeCompanyId` keeps the original, which is what
 * firestore.rules can always fall back to.
 *
 * Guarded rather than trusting: an `activeCompanyId` pointing at a company no longer in
 * `companyIds` is ignored, so a stale value left behind by a removed membership can't send every
 * subsequent read at a company this user cannot open.
 */
function withActiveCompany(data: UserDoc): UserDoc {
  const memberships = data.companyIds?.length ? data.companyIds : [data.companyId]
  const active =
    data.activeCompanyId && memberships.includes(data.activeCompanyId)
      ? data.activeCompanyId
      : data.companyId
  // Role and branch are per company — see `UserDoc.memberships`. Without this swap a switch
  // would leave `roleId` pointing at a role document in the company just left, and
  // `usePermissions()` would resolve it to nothing and lock the user out of their own shop.
  const membership = data.memberships?.[active]
  return {
    ...data,
    companyId: active,
    companyIds: memberships,
    homeCompanyId: data.companyId,
    ...(membership
      ? {
          roleId: membership.roleId,
          roleName: membership.roleName,
          roleCode: membership.roleCode,
          branchId: membership.branchId,
        }
      : {}),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)
  // Only meaningful while `user` exists — derived `profileLoading` below folds in `!!user` so
  // callers never see "loading" for a signed-out user just because this happens to be stale.
  const [profileFetching, setProfileFetching] = useState(true)
  // Tracks which uid we've last (re)initialized state for, so a *newly* signed-in user (as
  // opposed to the same user re-rendering) gets a fresh cache-seed + loading flag. Deliberately
  // adjusted during render (react.dev's "resetting state when a dependency changes" pattern),
  // not from inside the effect below — the effect's own setState calls all happen inside async
  // callbacks (onSnapshot/setTimeout), which is the part that actually needs to run as a
  // reaction to an external system, not synchronously during the effect body itself.
  const [initializedForUid, setInitializedForUid] = useState<string | null>(null)
  const currentUid = user?.uid ?? null
  if (currentUid !== initializedForUid) {
    setInitializedForUid(currentUid)
    if (currentUid) {
      // Seed instantly from whatever this browser last saw for this uid — no network round
      // trip needed, so a reload right after signup (this session's own prior write) never has
      // to wait on Firestore at all. The listener below still confirms/corrects it shortly.
      const cached = readCachedProfile(currentUid)
      setProfile(cached)
      // A cache hit already gives every consumer (usePermissions, the top bar, …) something
      // real to work with — no reason to show a loading state while the listener merely
      // confirms it in the background. Only a genuine cache miss is "loading."
      setProfileFetching(!cached)
    } else {
      setProfile(null)
      setProfileFetching(false)
    }
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
      if (!firebaseUser) setProfile(null)
    })
    return unsubscribeAuth
  }, [])

  useEffect(() => {
    if (!user) return

    const uid = user.uid
    let cancelled = false
    let retries = 0

    function giveUp() {
      if (cancelled) return
      setProfile(null)
      setProfileFetching(false)
      clearProfileCache(uid)
    }

    /**
     * Publishes a profile snapshot, but only one the server has acknowledged. Returns whether it
     * did, so both callers below can fall through to a retry on the same terms.
     *
     * A snapshot carrying this client's own not-yet-acknowledged writes is not an answer about
     * what exists — and publishing it anyway is what made every brand-new Owner land on an empty
     * sidebar and "You don't have access to this page".
     *
     * `persistentLocalCache` applies writes to IndexedDB before the server accepts them, so
     * signup's ~200-document batch produced a complete-looking profile while the commit was still
     * in flight. Publishing it enabled `usePermissions`'s role query, which read `roles/{roleId}`
     * *from the server* — where the batch had not landed yet. It came back missing, and with a
     * five-minute `staleTime` and nothing to trigger a refetch, that one lost race denied every
     * route and emptied the sidebar for the rest of the session. A reload fixed it, which is
     * exactly the signature of a cached answer rather than a real permission problem.
     *
     * Waiting for the acknowledgement costs the tail of one round trip on a fresh signup and
     * nothing on a reload (the cache seed at mount already covers that). It also stops a
     * *rejected* batch from writing a profile the server never accepted into `localStorage`, where
     * it would outlive the session that created it.
     */
    function publishIfConfirmed(snap: DocumentSnapshot): boolean {
      if (!snap.exists() || snap.metadata.hasPendingWrites) return false
      const data = withActiveCompany(snap.data() as UserDoc)
      setProfile(data)
      setProfileFetching(false)
      cacheProfile(uid, data)
      return true
    }

    function scheduleRetry() {
      if (cancelled) return
      if (retries >= PROFILE_NOT_FOUND_MAX_RETRIES) {
        giveUp()
        return
      }
      retries++
      setTimeout(async () => {
        if (cancelled) return
        try {
          const snap = await getDoc(doc(db, userDoc(uid)))
          if (cancelled) return
          if (!publishIfConfirmed(snap)) scheduleRetry()
        } catch (err) {
          console.error('[AuthProvider] retry read of profile failed:', err)
          giveUp()
        }
      }, PROFILE_NOT_FOUND_RETRY_DELAY_MS)
    }

    // Live-subscribed, not a one-off get() — if an admin changes this user's role or a company
    // setting elsewhere, permission checks derived from `profile` update without a re-login.
    //
    // `includeMetadataChanges` because the handler below waits for the server to acknowledge this
    // document, and an acknowledgement changes only metadata. Without it, a snapshot skipped for
    // `hasPendingWrites` would never be followed by a confirmed one — the content is identical, so
    // the default listener has nothing to report — and the profile would only ever arrive via
    // `scheduleRetry()`'s slower polling.
    const unsubscribeProfile = onSnapshot(
      doc(db, userDoc(uid)),
      { includeMetadataChanges: true },
      (snap) => {
        // Not published yet means either the document isn't there or the server hasn't confirmed
        // it — retry either way. Deliberately does *not* clear `profile`: if a cached copy was
        // seeded at mount it stays visible (and correct, in the common case) while this retries in
        // the background, rather than blanking a screen that's very likely already right.
        if (!publishIfConfirmed(snap)) scheduleRetry()
      },
      (err) => {
        console.error('[AuthProvider] profile onSnapshot error:', err)
        giveUp()
      }
    )

    return () => {
      cancelled = true
      unsubscribeProfile()
    }
  }, [user])

  const profileLoading = !!user && profileFetching

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, profileLoading, logOut: firebaseLogOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
