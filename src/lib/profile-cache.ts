import type { UserDoc } from '@/types/firestore'

/**
 * A per-viewer localStorage cache of the signed-in user's own profile doc, keyed by uid.
 * Exists to close a real race found via live testing: a hard page reload very soon after a
 * fresh signup can hit a brand-new Firestore connection that takes several seconds to reflect
 * a just-written document (see auth-provider.tsx's retry logic, which remains as a fallback
 * for when no cache is available — a different browser/device, or a cleared cache). Reading
 * this cache is instant and needs no network round-trip, so seeding AuthProvider's initial
 * state from it eliminates the race for the common case entirely rather than just waiting it
 * out. The live onSnapshot listener still confirms/corrects this in the background.
 *
 * Note: `JSON.stringify`/`parse` round-trips a Firestore `Timestamp` into a plain object (it
 * has a `toJSON()`, but the parsed result has no `toDate()`) — fine today since nothing reads
 * `profile.createdAt`/`updatedAt` from the cached copy, but worth knowing before something does.
 */

const PREFIX = 'aim-profile-cache:'

export function cacheProfile(uid: string, profile: UserDoc) {
  try {
    localStorage.setItem(PREFIX + uid, JSON.stringify(profile))
  } catch {
    // Best-effort only — a private window or blocked site data just means no cache this time,
    // falling back to the normal listener/retry path.
  }
}

export function readCachedProfile(uid: string): UserDoc | null {
  try {
    const raw = localStorage.getItem(PREFIX + uid)
    return raw ? (JSON.parse(raw) as UserDoc) : null
  } catch {
    return null
  }
}

export function clearProfileCache(uid: string) {
  try {
    localStorage.removeItem(PREFIX + uid)
  } catch {
    // Nothing more to do — worst case a stale entry lingers until overwritten.
  }
}
