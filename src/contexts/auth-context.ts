import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { UserDoc } from '@/types/firestore'

export interface AuthContextValue {
  /** The raw Firebase Auth user — null until resolved, or if signed out. */
  user: FirebaseUser | null
  /** The Firestore users/{uid} profile doc — companyId, roleId, branch, etc. `null` while
   * still resolving (see `profileLoading`) or once genuinely confirmed absent. */
  profile: UserDoc | null
  /** True until the *first* auth-state resolution completes — use this, not `!user`, to avoid
   * a flash of "logged out" UI while Firebase is still restoring a persisted session. */
  loading: boolean
  /** True while the profile doc is actively being fetched/retried for a known-signed-in user.
   * Distinct from `profile === null`, which is also true once loading genuinely concludes
   * there's no profile — callers that need to tell "still resolving" apart from "confirmed
   * absent" (like `usePermissions()`) must check this, not just `!profile`. */
  profileLoading: boolean
  logOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
