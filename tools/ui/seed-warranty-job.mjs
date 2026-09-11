/**
 * Seeds a delivered job carrying a real warranty, so the Phase 14 probe can look it up and
 * reopen it.
 *
 *   node --env-file=.env.local tools/ui/seed-warranty-job.mjs <email> <password>
 *
 * Delivered three months ago with a six-month bill warranty and a one-year part warranty, so one
 * line is live and the dates are not today's — a window that happened to start today would pass
 * even if the arithmetic were wrong.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  initializeFirestore,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  setDoc,
} from 'firebase/firestore'

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error('usage: node --env-file=.env.local tools/ui/seed-warranty-job.mjs <email> <password>')
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

const cred = await signInWithEmailAndPassword(getAuth(app), email, password)
const uid = cred.user.uid
const userSnap = await getDoc(doc(db, 'users', uid))
if (!userSnap.exists()) {
  console.error('no user document — signup has not finished writing it yet')
  process.exit(1)
}
const { companyId, fullName } = userSnap.data()
const now = serverTimestamp()
const stamp = Date.now()

const threeMonthsAgo = new Date()
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
const delivered = Timestamp.fromDate(threeMonthsAgo)

const jobNumber = `JC-2026-27-${String(stamp).slice(-5)}`
const mobile = `98${String(stamp).slice(-8)}`
const imei = `35${String(stamp).slice(-13)}`

const jobRef = doc(collection(db, `companies/${companyId}/jobCards`))
await setDoc(jobRef, {
  jobNumber,
  status: 'delivered',
  branchId: 'main',
  customerId: 'seed-customer',
  customerName: 'Warranty Probe Customer',
  customerMobile: mobile,
  alternativeMobile: null,
  deviceTypeId: null,
  deviceTypeName: 'Mobile',
  brandId: null,
  brandName: 'Samsung',
  model: 'Galaxy A15',
  imei,
  imei2: null,
  serialNo: null,
  devicePinPattern: null,
  problemIds: [],
  problemLabels: ['Screen not working'],
  remark: null,
  serviceItems: [],
  estimatedCost: 2000,
  advanceReceived: 0,
  partsCost: 1800,
  serviceCharge: 200,
  discount: 0,
  finalAmount: 2000,
  paidAmount: 2000,
  // Six months from delivery: still live three months later.
  billWarranty: { value: 6, unit: 'months' },
  itemsReceived: [],
  itemsReturned: [],
  receivedById: uid,
  receivedByName: fullName,
  assignedToId: uid,
  assignedToName: fullName,
  deliveredById: uid,
  deliveredByName: fullName,
  cancelledById: null,
  cancelledByName: null,
  returnedById: null,
  returnedByName: null,
  partsUsed: [
    {
      id: 'p1',
      itemId: 'seed-screen',
      itemName: 'Display Replacement',
      itemCode: 'PRT001',
      rate: 1800,
      qty: 1,
      supplierId: null,
      supplierName: null,
      // A year from delivery — the line that must read as live with roughly nine months left.
      warranty: { value: 1, unit: 'years', until: null },
    },
  ],
  imageUrls: [],
  notes: [],
  attributes: {},
  cancelReason: null,
  holdReason: null,
  lastActionUndo: null,
  createdById: uid,
  createdByName: fullName,
  createdAt: delivered,
  updatedAt: now,
  deliveredAt: delivered,
  billGeneratedAt: delivered,
  closedAt: null,
  cancelledAt: null,
})

console.log(JSON.stringify({ companyId, jobId: jobRef.id, jobNumber, mobile, imei }))
process.exit(0)
