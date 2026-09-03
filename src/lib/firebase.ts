import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

for (const key of requiredEnvVars) {
  if (!import.meta.env[key]) {
    // Fail loudly in dev rather than let Firebase throw a cryptic error later.
    console.error(
      `[firebase] Missing env var ${key}. Copy .env.local.example to .env.local and fill in your Firebase project's config.`
    )
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// IMPORTANT: this project's Firestore may be a *named* (non-default) database — see
// BUILD_PLAN.md §1. `getFirestore(app)` alone only ever talks to the database literally named
// "(default)". If VITE_FIREBASE_DATABASE_ID is unset, we fall back to "(default)" explicitly
// rather than omitting the argument, so this behavior is never accidental.
//
// `persistentLocalCache` (IndexedDB-backed, multi-tab aware) rather than the default
// memory-only cache: found via live testing that signup's multi-document batch write
// (company + branch + financial year + 5 roles + user profile, ~1-2s round trip on a real
// network) is vulnerable to being silently lost — not just delayed — if the tab reloads or
// closes before the write's server ack comes back, since an in-flight write held only in memory
// is abandoned along with the JS context that started it. With persistence on, `commit()`
// enqueues the mutation to IndexedDB before attempting the network call, so the SDK resumes and
// replays it automatically once the page (or a new tab) reconnects — turning a rare "Auth
// account exists but all its company/role/profile data is gone" failure into a purely cosmetic
// delay. `persistentMultipleTabManager` avoids the alternative failure mode where a second
// open tab would otherwise fight the first for the same IndexedDB lock.
export const db = initializeFirestore(
  app,
  { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
  import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
)

export const storage = getStorage(app)
