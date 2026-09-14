/**
 * Is the browser reporting no connection?
 *
 * Its own module so anything can ask without importing the sequence generator, the Firestore
 * batch helper, or i18n. `useOnlineStatus` is the React-facing version of the same question.
 *
 * `navigator.onLine` is honest about being disconnected and optimistic about being connected — it
 * says "online" on a wifi network with no route out. Every use of this is therefore either to
 * explain a failure or to skip a call that would fail anyway. Never to decide a write succeeded.
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}
