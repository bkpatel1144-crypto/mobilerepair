import type { WriteBatch } from 'firebase/firestore'
import { isOffline } from '@/lib/connection'

/**
 * Commits a batch without hanging when there is no connection.
 *
 * This is the part of offline writing that is easy to get wrong. Firestore's `batch.commit()`
 * resolves when the **server** acknowledges the write — so with no connection the promise simply
 * never settles. The write itself is fine: it goes into Firestore's durable local queue, every
 * query in the app sees it immediately, and it syncs on reconnect. But a mutation that awaits
 * that promise sits pending forever, so the form never closes and the spinner never stops. From
 * the counter it looks exactly like the freeze that Phase 15a existed to remove.
 *
 * So offline the commit is started and deliberately not awaited. That is not fire-and-forget:
 * the queue is persisted to IndexedDB and survives a reload, which is the whole point of
 * `persistentLocalCache`. What is given up is the ability to report a failure — and offline
 * there is no failure to report yet.
 *
 * Online the promise is awaited as before, so a real permission error or a rules rejection still
 * surfaces to the user rather than disappearing.
 */
export async function commitBatch(batch: WriteBatch): Promise<void> {
  const committed = batch.commit()
  if (!isOffline()) {
    await committed
    return
  }
  // Swallowed on purpose: with no connection there is nothing to report, and an unhandled
  // rejection here would surface as a console error on a write that is going to succeed.
  void committed.catch(() => {})
}
