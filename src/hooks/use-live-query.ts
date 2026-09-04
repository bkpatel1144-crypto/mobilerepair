import { useEffect } from 'react'
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { onSnapshot, type DocumentData, type Query, type DocumentReference } from 'firebase/firestore'

/**
 * A TanStack Query backed by a Firestore `onSnapshot` listener instead of a one-shot `getDocs`.
 *
 * The app was built on one-shot reads: a list refreshed only when *you* mutated it (the
 * mutation's own `invalidateQueries`) or when you pressed Refresh. In a shop where a technician,
 * a salesman and the owner are all in the app at once, that means everyone is looking at a
 * snapshot from whenever their page last loaded — a job card someone else just took is simply
 * absent, with nothing on screen to suggest it. Live listeners are what make it behave like one
 * shared system rather than three stale copies.
 *
 * Why still route through TanStack Query rather than useState: every caller, mutation and
 * `invalidateQueries` in the app already keys off the query cache, and the pages read
 * `isLoading`/`error` off it. Pushing snapshots *into* the cache keeps all of that working
 * untouched and means a hook can be converted one at a time.
 *
 * Cost note: a listener bills the initial read of every matching document, then only documents
 * that actually change. For per-tenant collections of this size that is cheaper over a session
 * than re-reading the whole collection on every invalidation, which is what the one-shot path
 * did on each mutation.
 */
export function useLiveQuery<T>(
  queryKey: QueryKey,
  source: Query<DocumentData> | null,
  map: (snapshot: DocumentData[]) => T,
  enabled = true
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !source) return
    const unsubscribe = onSnapshot(
      source,
      (snap) => {
        queryClient.setQueryData(
          queryKey,
          map(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        )
      },
      (error) => {
        // Surface it the same way a failed fetch would, so the page's own ErrorState renders
        // rather than the list silently freezing on its last good value.
        queryClient.setQueryData(queryKey, () => {
          throw error
        })
        queryClient.getQueryCache().find({ queryKey })?.setState({ error, status: 'error' })
      }
    )
    return unsubscribe
    // `map` is intentionally omitted: callers pass an inline arrow, so including it would tear
    // down and re-establish the listener on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // `queryKey.join` rather than JSON.stringify: the React Compiler treats the latter as
    // impure and refuses to compile the component. A joined key is enough here — every key
    // in this app is a flat array of strings.
  }, [queryClient, enabled, queryKey.join('|'), !!source])

  return useQuery({
    queryKey,
    // The listener is the only writer. This resolves once from whatever the listener has already
    // put in the cache; if nothing is there yet it stays pending until the first snapshot lands.
    queryFn: () => new Promise<T>(() => {}),
    enabled: enabled && !!source,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  })
}

/** Single-document variant of `useLiveQuery`. */
export function useLiveDoc<T>(
  queryKey: QueryKey,
  ref: DocumentReference<DocumentData> | null,
  map: (data: DocumentData | null) => T,
  enabled = true
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !ref) return
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        queryClient.setQueryData(queryKey, map(snap.exists() ? { id: snap.id, ...snap.data() } : null))
      },
      (error) => {
        queryClient.getQueryCache().find({ queryKey })?.setState({ error, status: 'error' })
      }
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, enabled, queryKey.join('|'), ref?.path])

  return useQuery({
    queryKey,
    queryFn: () => new Promise<T>(() => {}),
    enabled: enabled && !!ref,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  })
}
