/**
 * Turns whatever a failed query threw into a line a shop owner can act on.
 *
 * Lives in `lib/` rather than beside `ErrorState` so that component file only exports a
 * component (the `react-refresh/only-export-components` rule), and so non-UI callers can reuse
 * it without importing a component.
 */

/** Firestore error codes worth translating. Anything else falls through to the raw message — a
 * specific-but-technical message beats a friendly-but-useless one when someone has to report it. */
const FIRESTORE_MESSAGES: Record<string, string> = {
  'permission-denied':
    "You don't have access to this data, or the project's security rules haven't been deployed yet.",
  unavailable: "Couldn't reach the database. Check your internet connection and try again.",
  unauthenticated: 'Your session expired. Sign out and sign back in to continue.',
  'not-found': 'That data no longer exists — it may have been deleted from another device.',
  'failed-precondition':
    'This query needs a Firestore index that has not been created yet. See firestore.indexes.json.',
  'resource-exhausted': 'The database is over its usage quota. Try again shortly.',
  cancelled: 'The request was cancelled before it finished.',
  'deadline-exceeded': 'The database took too long to respond. Try again.',
}

export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const raw = String((error as { code: unknown }).code)
    // FirebaseError codes arrive as either "permission-denied" or "firestore/permission-denied".
    const code = raw.includes('/') ? raw.slice(raw.indexOf('/') + 1) : raw
    const friendly = FIRESTORE_MESSAGES[code]
    if (friendly) return friendly
  }
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong while loading this data.'
}
