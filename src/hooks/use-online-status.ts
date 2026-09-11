import { useSyncExternalStore } from 'react'

/**
 * Is the browser online?
 *
 * The app is client-SDK-only with `persistentLocalCache` switched on, so **reading** already
 * works offline — a job card opened yesterday still opens today with no connection. What does
 * not work is anything that needs a number: `getNextSequence()` is a `runTransaction()`, and a
 * transaction cannot complete without a server round trip. Eleven hooks call it.
 *
 * Before this, that failed with no explanation. This is a shop counter, where losing the line is
 * normal, not an edge case, and a save that quietly does nothing is the worst possible answer.
 *
 * `useSyncExternalStore` rather than `useState` + an effect: the React Compiler rejects
 * `setState` in an effect, and this is exactly the external-store case the hook exists for.
 */

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

function getSnapshot() {
  return navigator.onLine
}

/** Server-render and any environment without a navigator assume online — an app that opened
 *  claiming to be offline before it had a chance to check would be wrong far more often. */
function getServerSnapshot() {
  return true
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * `navigator.onLine` is honest about being disconnected and optimistic about being connected: it
 * reports true for a machine on a wifi network whose router has no route to the internet. That
 * is acceptable here because it is only used to *explain* a failure and to disable an action
 * that would fail anyway — never to decide that a write succeeded.
 */
export const ONLINE_STATUS_IS_ADVISORY = true
