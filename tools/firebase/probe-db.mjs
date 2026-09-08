/**
 * Answers one question the browser will not: can this client actually reach the Firestore
 * database, and if not, why?
 *
 * In the browser, a rejected `Listen` stream makes the SDK mark itself offline, and every
 * subsequent read then fails with:
 *
 *   FirebaseError: Failed to get document because the client is offline.
 *
 * That message is a dead end. It blames the network for what was really a deny-all ruleset, a
 * missing database, a wrong database id — or, in this project's case, a billing requirement:
 * named (non-default) Firestore databases need the Blaze plan, and on Spark the backend replies
 *
 *   PERMISSION_DENIED: This API method requires billing to be enabled.
 *
 * which the browser never surfaces. Node does, because gRPC errors come through unmasked.
 *
 * Usage (reads .env.local for the config):
 *   node --env-file=.env.local tools/firebase/probe-db.mjs
 *   node --env-file=.env.local tools/firebase/probe-db.mjs "(default)"
 *
 * How to read the result:
 *   permission-denied / invalid-argument  the backend is reachable and evaluating requests
 *   unavailable                           cannot connect — read the gRPC line above it
 */
import { initializeApp } from 'firebase/app'
import { initializeFirestore, doc, getDoc } from 'firebase/firestore'

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing env: ${missing.join(', ')}`)
  console.error('Run with: node --env-file=.env.local tools/firebase/probe-db.mjs')
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

const databaseId = process.argv[2] ?? process.env.VITE_FIREBASE_DATABASE_ID ?? '(default)'

// Long polling because Node has no WebChannel; without it the probe itself would look offline
// and tell you nothing.
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, databaseId)

console.log(`project:  ${process.env.VITE_FIREBASE_PROJECT_ID}`)
console.log(`database: ${databaseId}\n`)

try {
  // A path no ruleset should allow unauthenticated. Being *denied* is the good outcome here: it
  // proves the request reached the backend and rules ran.
  await getDoc(doc(db, 'companies/__probe__'))
  console.log('RESULT: read allowed — rules permit an unauthenticated get on that path')
} catch (err) {
  console.log(`RESULT: ${err.code}`)
  console.log(`        ${err.message}`)
  if (err.code === 'unavailable') {
    console.log('\nUnreachable. The gRPC line printed above this carries the real reason —')
    console.log('billing, a missing database, or a wrong database id.')
  } else {
    console.log('\nReachable: the backend answered and rules were evaluated.')
  }
}
process.exit(0)
