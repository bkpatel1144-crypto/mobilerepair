import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/** How long the spin runs at minimum, even when the refetch resolves sooner. */
const MIN_SPIN_MS = 600

/**
 * Reloads the data on the screen the user is looking at, and nothing else.
 *
 * `type: 'active'` is the whole trick. TanStack Query counts a query as active only while a
 * mounted component is observing it, so this refetches exactly what the current page has asked
 * for and leaves every cached query from other pages alone. That is the behaviour asked for —
 * refresh this page, not the whole app — and it needs no per-page wiring or list of query keys to
 * keep in step with the routes.
 *
 * It replaces a `Refresh` button that each of nineteen pages built for itself, every one calling
 * `invalidateQueries` with its own key. Those worked, but reported nothing: no spinner, no
 * disabled state, no change on screen when the data came back identical. A button that gives no
 * feedback is indistinguishable from a broken one, which is exactly how it was described.
 *
 * Hence the floor on the spin. A warm refetch can resolve in 30ms, and an icon that turns for
 * 30ms reads as a flicker rather than an action — the animation exists to confirm the tap
 * happened, so it has to last long enough to be seen.
 */
export function useRefresh() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Guards against a second tap while one is in flight, which would restart the spin and make
  // the first result look like it never arrived.
  const inFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setIsRefreshing(true)
    const startedAt = Date.now()
    try {
      await queryClient.refetchQueries({ type: 'active' })
    } finally {
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, MIN_SPIN_MS - elapsed)
      setTimeout(() => {
        setIsRefreshing(false)
        inFlight.current = false
      }, remaining)
    }
  }, [queryClient])

  return { refresh, isRefreshing }
}
