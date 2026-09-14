/**
 * Seeds the masters Create Job Card insists on, so a probe can drive intake by *picking* rather
 * than by quick-adding through four different pickers' create-new footers.
 *
 *   node --env-file=.env.local tools/ui/seed-intake-masters.mjs <email> <password>
 *
 * A brand-new tenant has no customers, device types, brands, models or problems, and intake
 * validation requires all of them. Driving those create-new flows is a test of the pickers, not
 * of what Phase 15b changed — and a probe that fails for an unrelated reason teaches nothing.
 *
 * Deliberately writes no job card and no counter: the point is to leave the sequence blocks
 * untouched so the probe exercises them for real.
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
  console.error(
    'usage: node --env-file=.env.local tools/ui/seed-intake-masters.mjs <email> <password>'
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

const cred = await signInWithEmailAndPassword(getAuth(app), email, password)
const uid = cred.user.uid
const userSnap = await getDoc(doc(db, 'users', uid))
if (!userSnap.exists()) {
  console.error('no user document — signup has not finished writing it yet')
  process.exit(1)
}
const { companyId } = userSnap.data()
const now = serverTimestamp()

const optionPath = (type) => `companies/${companyId}/serviceOptions/${type}/items`

const deviceTypeRef = doc(collection(db, optionPath('deviceTypes')))
await setDoc(deviceTypeRef, { label: 'Mobile', order: 1, status: 'active', createdAt: now, updatedAt: now })

const brandRef = doc(collection(db, optionPath('brands')))
await setDoc(brandRef, {
  label: 'Samsung',
  order: 1,
  deviceTypeIds: [deviceTypeRef.id],
  status: 'active',
  createdAt: now,
  updatedAt: now,
})

const modelRef = doc(collection(db, optionPath('models')))
await setDoc(modelRef, {
  label: 'Galaxy A15',
  order: 1,
  brandId: brandRef.id,
  status: 'active',
  createdAt: now,
  updatedAt: now,
})

const problemRef = doc(collection(db, optionPath('problems')))
await setDoc(problemRef, {
  label: 'Screen not working',
  order: 1,
  status: 'active',
  createdAt: now,
  updatedAt: now,
})

// A customer to pick, so intake never has to quick-add a party either.
const partyRef = doc(collection(db, `companies/${companyId}/parties`))
await setDoc(partyRef, {
  partyNumber: 'PTY-SEED-00001',
  name: 'Probe Customer',
  mobile: '9876500001',
  type: 'customer',
  partyTypes: ['customer'],
  categoryId: null,
  categoryName: null,
  email: null,
  address: null,
  gstNumber: null,
  panNumber: null,
  area: null,
  village: null,
  taluka: null,
  district: null,
  pincode: null,
  creditLimit: 0,
  creditDays: 0,
  attributes: {},
  status: 'active',
  createdAt: now,
  updatedAt: now,
})

// A job already finished by the technician, so the probe can press Generate Bill once and see
// the invoice series mint a number — without driving take-job and repair-done first.
const jobRef = doc(collection(db, `companies/${companyId}/jobCards`))
const jobNumber = `JC-SEED-${String(Date.now()).slice(-5)}`
await setDoc(jobRef, {
  jobNumber,
  status: 'techDone',
  branchId: 'main',
  customerId: partyRef.id,
  customerName: 'Probe Customer',
  customerMobile: '9876500001',
  alternativeMobile: null,
  deviceTypeId: deviceTypeRef.id,
  deviceTypeName: 'Mobile',
  brandId: brandRef.id,
  brandName: 'Samsung',
  model: 'Galaxy A15',
  imei: null,
  imei2: null,
  serialNo: null,
  devicePinPattern: null,
  problemIds: [problemRef.id],
  problemLabels: ['Screen not working'],
  remark: null,
  serviceItems: [],
  estimatedCost: 1500,
  advanceReceived: 0,
  partsCost: 0,
  finalAmount: null,
  paidAmount: 0,
  itemsReceived: [],
  itemsReturned: [],
  receivedById: uid,
  receivedByName: userSnap.data().fullName,
  assignedToId: uid,
  assignedToName: userSnap.data().fullName,
  deliveredById: null,
  deliveredByName: null,
  cancelledById: null,
  cancelledByName: null,
  returnedById: null,
  returnedByName: null,
  partsUsed: [],
  imageUrls: [],
  notes: [],
  attributes: {},
  cancelReason: null,
  holdReason: null,
  lastActionUndo: null,
  createdById: uid,
  createdByName: userSnap.data().fullName,
  createdAt: now,
  updatedAt: now,
  deliveredAt: null,
  billGeneratedAt: null,
  closedAt: null,
  cancelledAt: null,
})

console.log(
  JSON.stringify({ companyId, customer: 'Probe Customer', billableJobId: jobRef.id, jobNumber })
)
process.exit(0)
