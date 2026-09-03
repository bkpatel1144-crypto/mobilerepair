import { useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
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
          if (snap.exists()) {
            const data = snap.data() as UserDoc
            setProfile(data)
            setProfileFetching(false)
            cacheProfile(uid, data)
          } else {
            scheduleRetry()
          }
        } catch (err) {
          console.error('[AuthProvider] retry read of profile failed:', err)
          giveUp()
        }
      }, PROFILE_NOT_FOUND_RETRY_DELAY_MS)
    }

    // Live-subscribed, not a one-off get() — if an admin changes this user's role or a company
    // setting elsewhere, permission checks derived from `profile` update without a re-login.
    const unsubscribeProfile = onSnapshot(
      doc(db, userDoc(uid)),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserDoc
          setProfile(data)
          setProfileFetching(false)
          cacheProfile(uid, data)
        } else {
          // Deliberately does *not* clear `profile` here — if a cached copy was seeded at
          // mount, it stays visible (and correct, in the common case) while this retries in
          // the background, rather than blanking a screen that's very likely already right.
          scheduleRetry()
        }
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
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, logOut: firebaseLogOut }}>
      {children}
    </AuthContext.Provider>
  )
}
