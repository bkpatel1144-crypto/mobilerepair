/**
 * Lists the `ZZ …` companies left behind by browser probes.
 *
 *   node --env-file=.env.local tools/firebase/list-probe-companies.mjs <email> <password>
 *
 * Read-only on purpose. Every probe that drives a real signup leaves a real tenant behind, and
 * they accumulate in the same project the shop will be using. This says how many there are and
 * what they are called; deleting them is a console job, because a client-SDK script cannot
 * remove an Auth user and would leave a signed-up account pointing at a company that is gone —
 * which is worse than the clutter.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeFirestore, collection, getDocs, query } from 'firebase/firestore'

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error(
    'usage: node --env-file=.env.local tools/firebase/list-probe-companies.mjs <email> <password>'
  )
  process.exit(1)
}

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
})
const db = initializeFirestore(app, {}, process.env.VITE_FIREBASE_DATABASE_ID || 'mobilerepairing')

await signInWithEmailAndPassword(getAuth(app), email, password)

// `companies` has no list rule for a normal user — this only works for an account that can read
// it, and reports honestly when it cannot rather than pretending the project is clean.
try {
  const snap = await getDocs(query(collection(db, 'companies')))
  const all = snap.docs.map((d) => ({ id: d.id, name: d.data().name ?? '' }))
  const probes = all.filter((c) => /^ZZ /.test(c.name))
  console.log(`${all.length} companies total, ${probes.length} left by probes:\n`)
  for (const c of probes) console.log(`  ${c.id}  ${c.name}`)
  console.log(
    probes.length
      ? '\nDelete these from the Firebase console (Firestore > companies), and their sign-in\n' +
          'accounts from Authentication. Both halves, or a real login is left pointing at nothing.'
      : '\nNothing to clean up.'
  )
} catch (err) {
  console.log('could not list companies:', err.code ?? String(err))
  console.log('Expected — `companies` is not listable by a normal tenant, which is the point.')
  console.log('Use the Firebase console: Firestore > companies, filter by name starting "ZZ ".')
}
process.exit(0)
