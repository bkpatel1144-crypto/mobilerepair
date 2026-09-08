/**
 * Reproduces the signup bootstrap against the live database and reports exactly where it breaks.
 *
 * Built after a first version of this probe passed while real signups kept failing — because it
 * wrote only the 13 tenant-root documents `seedTenantForUser`'s doc comment mentions, and missed
 * that the same function also seeds ~136 service options, the Masters datasets and the print
 * template catalogue into the *same* atomic batch. A probe that doesn't write those cannot
 * reproduce the failure. So this one is structured around the two questions that actually decide
 * whether signup works:
 *
 *  1. Which collections refuse a bootstrap write? Every document is written individually, so the
 *     atomic batch's single anonymous rejection becomes one line per collection.
 *  2. Does the batch's *size* matter independently of that? Security rules cap the number of
 *     document access calls per request, and every create rule here calls `isBootstrapping()`,
 *     i.e. `exists(users/{uid})`. If that budget were counted per document rather than per
 *     distinct document read, no large bootstrap batch could ever commit and the fix would have
 *     to split the seeding into chunks rather than just amend the rules. Phase 2 answers that by
 *     committing a deliberately oversized batch of a collection that already allows bootstrap.
 *
 *   node --env-file=.env.local tools/firebase/probe-signup.mjs
 *
 * Leaves a throwaway company named "ZZ PROBE <timestamp>" behind. `companies` is deliberately
 * undeletable from a client, so delete it from the console. The Auth account deletes itself.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'
import {
  initializeFirestore,
  doc,
  collection,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
// Long polling because Node has no WebChannel; without it the probe itself would look offline.
const db = initializeFirestore(
  app,
  { experimentalForceLongPolling: true },
  process.env.VITE_FIREBASE_DATABASE_ID || '(default)'
)

const stamp = Date.now()
const email = `probe-${stamp}@aim-probe.test`
const cred = await createUserWithEmailAndPassword(auth, email, 'ProbeOnly!2345')
const uid = cred.user.uid
console.log(`account:  ${email}`)
console.log(`database: ${process.env.VITE_FIREBASE_DATABASE_ID}\n`)

const companyRef = doc(collection(db, 'companies'))
const companyId = companyRef.id
const now = serverTimestamp()
const base = { name: 'ZZ probe', code: 'ZZP', status: 'active', createdAt: now, updatedAt: now }

// ---- phase 1: one document per collection the real batch writes to --------------------------
// The company doc goes first because every subcollection path below depends on it existing.
console.log('PHASE 1 — one bootstrap write per collection the signup batch touches')
const targets = [
  [
    'companies',
    companyRef,
    {
      ...base,
      legalName: 'ZZ probe',
      gstRegistration: 'Unregistered',
      gstin: null,
      pan: null,
      email,
      phone: '',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      protected: true,
    },
  ],
  [
    'branches',
    doc(collection(db, `companies/${companyId}/branches`)),
    { ...base, type: 'system', protected: true },
  ],
  [
    'financialYears',
    doc(collection(db, `companies/${companyId}/financialYears`)),
    { ...base, isActive: true, isLocked: false, isCurrent: true },
  ],
  [
    'roles',
    doc(collection(db, `companies/${companyId}/roles`)),
    {
      ...base,
      type: 'owner',
      protected: true,
      fullAccess: true,
      menuPermissions: {},
      actionPermissions: {},
      dashboardConfig: {},
    },
  ],
  [
    'serviceOptions/*/items',
    doc(collection(db, `companies/${companyId}/serviceOptions/brand/items`)),
    { ...base, source: 'system' },
  ],
  ['uom', doc(collection(db, `companies/${companyId}/uom`)), { ...base, source: 'system' }],
  [
    'itemCategories',
    doc(collection(db, `companies/${companyId}/itemCategories`)),
    { ...base, source: 'system' },
  ],
  [
    'paymentModes',
    doc(collection(db, `companies/${companyId}/paymentModes`)),
    { ...base, source: 'system' },
  ],
  [
    'partyCategories',
    doc(collection(db, `companies/${companyId}/partyCategories`)),
    { ...base, source: 'system' },
  ],
  [
    'expenseCategories',
    doc(collection(db, `companies/${companyId}/expenseCategories`)),
    { ...base, protected: true },
  ],
  [
    'printTemplates',
    doc(collection(db, `companies/${companyId}/printTemplates`)),
    { ...base, docType: 'jobCard' },
  ],
  [
    'whatsappConfig',
    doc(db, `companies/${companyId}/whatsappConfig/config`),
    { countryCode: '91', templates: [], updatedAt: now },
  ],
  [
    'backupSettings',
    doc(db, `companies/${companyId}/backupSettings/settings`),
    { dailyAutoBackupEnabled: false, updatedAt: now },
  ],
  [
    'auditLog',
    doc(collection(db, `companies/${companyId}/auditLog`)),
    {
      action: 'Login',
      module: 'auth',
      entityType: 'Login',
      entityId: uid,
      result: 'success',
      performedById: uid,
      performedByName: 'Probe',
      performedByRole: 'Owner',
      createdAt: now,
    },
  ],
  [
    'sessions',
    doc(collection(db, `companies/${companyId}/sessions`)),
    { userId: uid, userName: 'Probe', roleName: 'Owner', startedAt: now, lastActivityAt: now },
  ],
]

const denied = []
for (const [label, ref, data] of targets) {
  try {
    await setDoc(ref, data)
    console.log(`  OK      ${label}`)
  } catch (err) {
    console.log(`  DENIED  ${label}  -> ${err.code}`)
    denied.push(label)
  }
}

// ---- phase 2: does batch size alone break the rules' access budget? -------------------------
// `printTemplates` already allows `isBootstrapping()`, so a large batch of them isolates size
// from permissions: if this commits, repeated `exists(users/{uid})` calls are cached per request
// and the real batch's ~200 documents are not themselves a problem.
const BULK = 200
console.log(
  `\nPHASE 2 — ${BULK} printTemplates in one batch (isolates batch size from permissions)`
)
try {
  const batch = writeBatch(db)
  for (let i = 0; i < BULK; i++) {
    batch.set(doc(collection(db, `companies/${companyId}/printTemplates`)), {
      ...base,
      docType: 'jobCard',
      n: i,
    })
  }
  await batch.commit()
  console.log(`  OK — ${BULK} documents committed, so repeated exists() calls are not the limit`)
} catch (err) {
  console.log(`  FAILED — ${err.code}: ${err.message}`)
  console.log('  Batch size IS a constraint; the seeding has to be split into chunks.')
}

console.log(
  denied.length
    ? `\nBOOTSTRAP IS DENIED ON: ${denied.join(', ')}\nThe signup batch is atomic, so any one of these fails the entire signup.`
    : '\nEvery collection accepted a bootstrap write.'
)
console.log(`company left behind: ${companyId}  (delete "ZZ PROBE ${stamp}" from the console)`)
await deleteUser(cred.user).catch(() => console.log('(could not delete the probe auth account)'))
process.exit(0)
