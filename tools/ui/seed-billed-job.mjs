/**
 * Writes one already-billed job card straight into Firestore, so a browser probe can start at
 * the screen it actually wants to test.
 *
 *   node --env-file=.env.local tools/ui/seed-billed-job.mjs <email> <password>
 *
 * Driving the intake form to get here does not work on a fresh tenant: Customer, Brand and Model
 * are all pickers over masters that a brand-new company has none of, so the flow requires
 * creating a customer, a device type, a brand and a model first, and a probe that long fails for
 * reasons that have nothing to do with what is being checked.
 *
 * The document written is the exact shape of the client's own screenshot — ₹250 taken as an
 * advance against a ₹245 bill — because that is the case where editing the bill must hand ₹5
 * back. Prints the job number and company id so the caller can assert against them.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  initializeFirestore,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error('usage: node --env-file=.env.local tools/ui/seed-billed-job.mjs <email> <password>')
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
const dbId = process.env.VITE_FIREBASE_DATABASE_ID || 'mobilerepairing'
const db = initializeFirestore(app, {}, dbId)

const cred = await signInWithEmailAndPassword(getAuth(app), email, password)
const uid = cred.user.uid
const userSnap = await getDoc(doc(db, 'users', uid))
if (!userSnap.exists()) {
  console.error('no user document — signup has not finished writing it yet')
  process.exit(1)
}
const { companyId, fullName } = userSnap.data()
console.log(`signed in as ${fullName} (${uid}), company ${companyId}`)

const jobRef = doc(collection(db, `companies/${companyId}/jobCards`))
const now = serverTimestamp()
const parts = [
  { id: 'p1', itemId: 'i1', itemName: 'Battery Replacement', itemCode: 'SRV003', rate: 12, qty: 1 },
  {
    id: 'p2',
    itemId: 'i2',
    itemName: 'Back Panel / Housing Replacement',
    itemCode: 'SRV009',
    rate: 23,
    qty: 1,
  },
  { id: 'p3', itemId: 'i3', itemName: 'Battery Replacement', itemCode: 'SRV003', rate: 210, qty: 1 },
]

await setDoc(jobRef, {
  jobNumber: 'JC-2026-27-09001',
  // `ready` means a bill exists — which is exactly the state in which parts must stop being
  // addable and Edit Bill must take over.
  status: 'ready',
  branchId: 'main',
  customerId: 'seed-customer',
  customerName: 'Probe Customer',
  customerMobile: '9876500000',
  alternativeMobile: null,
  deviceTypeId: null,
  deviceTypeName: 'Mobile',
  brandId: null,
  brandName: 'Samsung',
  model: 'Galaxy A15',
  imei: '987465132065432',
  imei2: null,
  serialNo: null,
  devicePinPattern: null,
  problemIds: [],
  problemLabels: ['Seeded for the bill-edit probe'],
  remark: null,
  serviceItems: [],
  estimatedCost: 233,
  advanceReceived: 250,
  partsCost: 245,
  finalAmount: 245,
  // More paid than the bill comes to, so any further discount must produce a refund.
  paidAmount: 250,
  itemsReceived: ['SIM Card'],
  itemsReturned: ['Memory Card'],
  receivedById: uid,
  receivedByName: fullName,
  assignedToId: uid,
  assignedToName: fullName,
  deliveredById: null,
  deliveredByName: null,
  cancelledById: null,
  cancelledByName: null,
  returnedById: null,
  returnedByName: null,
  partsUsed: parts,
  imageUrls: [],
  notes: [],
  cancelReason: null,
  holdReason: null,
  lastActionUndo: null,
  billGeneratedAt: now,
  createdById: uid,
  createdByName: fullName,
  createdAt: now,
  updatedAt: now,
})

console.log(`seeded JC-2026-27-09001 (${jobRef.id}) — ready, ₹245 billed, ₹250 paid, 3 parts`)
process.exit(0)
