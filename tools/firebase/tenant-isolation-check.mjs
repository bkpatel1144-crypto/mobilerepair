/**
 * Can one shop read another shop's data?
 *
 *   node --env-file=.env.local tools/firebase/tenant-isolation-check.mjs <emailA> <emailB> <password>
 *
 * This is the question that decides whether a multi-tenant app can go to production, and it is
 * the one thing no amount of UI testing can answer: the browser only ever asks for its own
 * company's documents, so a ruleset that would happily serve someone else's is invisible from
 * the front end. Here we sign in as shop A and ask for shop B's documents by path.
 *
 * Every collection the app writes is tried, because rules are written per-collection and a
 * single `allow read: if true` in one of them leaks that one. A pass means the read was denied;
 * a failure means one shop can read another's customers, job cards, or money.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { initializeFirestore, collection, doc, getDoc, getDocs } from 'firebase/firestore'

const [emailA, emailB, password] = process.argv.slice(2)
if (!emailA || !emailB || !password) {
  console.error(
    'usage: node --env-file=.env.local tools/firebase/tenant-isolation-check.mjs <emailA> <emailB> <password>'
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
const auth = getAuth(app)

async function companyOf(email) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const snap = await getDoc(doc(db, 'users', cred.user.uid))
  if (!snap.exists()) throw new Error(`${email} has no user document`)
  return { uid: cred.user.uid, companyId: snap.data().companyId }
}

const b = await companyOf(emailB)
await signOut(auth)
const a = await companyOf(emailA)
console.log(`signed in as A (company ${a.companyId}); probing B (company ${b.companyId})\n`)
if (a.companyId === b.companyId) {
  console.error('!! both accounts are in the same company — this proves nothing')
  process.exit(1)
}

const COLLECTIONS = [
  'jobCards',
  'parties',
  'items',
  'receipts',
  'purchases',
  'itemAttributes',
  'itemCategories',
  'uoms',
  'paymentModes',
  'partyCategories',
  'roles',
  'users',
  'auditLogs',
  'jobCostings',
  'secondHandPurchases',
  'secondHandSales',
  'expenses',
  'branches',
  'sequences',
]

let leaks = 0
let denied = 0
for (const name of COLLECTIONS) {
  const path = `companies/${b.companyId}/${name}`
  try {
    const snap = await getDocs(collection(db, path))
    // An empty result is still a successful read — the rules allowed the query.
    console.log(`LEAK   ${name}: read allowed, ${snap.size} document(s) returned`)
    leaks += 1
  } catch (err) {
    const code = err?.code ?? String(err)
    if (code === 'permission-denied') {
      denied += 1
    } else {
      console.log(`?      ${name}: ${code}`)
    }
  }
}

// The company document itself, and B's own user record.
for (const [label, path] of [
  ['company document', `companies/${b.companyId}`],
  ["B's user record", `users/${b.uid}`],
]) {
  try {
    const snap = await getDoc(doc(db, path))
    console.log(`LEAK   ${label}: read allowed, exists=${snap.exists()}`)
    leaks += 1
  } catch (err) {
    if ((err?.code ?? '') === 'permission-denied') denied += 1
    else console.log(`?      ${label}: ${err?.code ?? err}`)
  }
}

console.log(`\nprobed ${COLLECTIONS.length + 2} paths — ${denied} denied, ${leaks} readable`)
console.log(
  leaks === 0
    ? 'no cross-tenant reads: one shop cannot see another shop\'s data'
    : `!! ${leaks} PATH(S) LEAK ACROSS TENANTS`
)
process.exit(leaks ? 1 : 0)
