/**
 * Seeds the exact situation Phase 13 is about: one stock-tracked part, one of it bought, and an
 * in-progress job card ready to have it fitted.
 *
 *   node --env-file=.env.local tools/ui/seed-stock-job.mjs <email> <password>
 *
 * Written straight to Firestore for the same reason `seed-billed-job.mjs` is: driving intake on
 * a fresh tenant means creating a customer, device type, brand and model first, and a probe that
 * long fails for reasons unrelated to what it is checking.
 *
 * One purchased, so fitting the first is allowed and the second is not — the smallest data set
 * that tells the two apart. Prints the job number and the part's name for the caller to assert
 * against.
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
  console.error('usage: node --env-file=.env.local tools/ui/seed-stock-job.mjs <email> <password>')
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
const partName = `ZZ Stock Screen ${stamp}`

// ---- the part, stock-tracked so it has an on-hand at all -------------------
const itemRef = doc(collection(db, `companies/${companyId}/items`))
await setDoc(itemRef, {
  itemCode: `ZZS${String(stamp).slice(-4)}`,
  name: partName,
  type: 'part',
  nature: 'Goods',
  categoryId: null,
  categoryName: null,
  subCategoryId: null,
  subCategoryName: null,
  uom: 'nos',
  primaryUom: { id: null, code: 'NOS', name: 'Numbers', symbol: 'nos' },
  purchaseUom: null,
  salesUom: null,
  alternateUoms: [],
  taxCategory: 'GST_18',
  gstRates: { cgst: 9, sgst: 9, igst: 18, cess: 0 },
  gstPercent: 18,
  cgstPercent: 9,
  sgstPercent: 9,
  sellingPrice: 1800,
  purchasePrice: 1200,
  mrp: null,
  // The whole point — an untracked item is deliberately never blocked.
  stockTracked: true,
  trackingType: 'NONE',
  shelfLifeDays: null,
  reorder: { reorderPoint: 2, minStock: 0, maxStock: 0, reorderQty: 0 },
  hasVariants: false,
  variantAttributes: [],
  attributes: {},
  images: [],
  lob: {
    sales: { isActive: true, allowDiscount: false, maxDiscount: 0 },
    purchase: { isActive: true },
    production: { isActive: false },
    servicePos: { isActive: true },
    ecommerce: { isActive: false },
  },
  enabledInSales: true,
  enabledInPurchase: true,
  enabledInProduction: false,
  enabledInServicePos: true,
  isSystem: false,
  description: null,
  status: 'active',
  createdAt: now,
  updatedAt: now,
})

// ---- exactly one bought ----------------------------------------------------
const purchaseRef = doc(collection(db, `companies/${companyId}/purchases`))
await setDoc(purchaseRef, {
  purchaseNumber: `PUR-ZZ-${String(stamp).slice(-5)}`,
  supplierId: null,
  supplierName: 'ZZ Probe Supplier',
  invoiceNumber: null,
  terms: 'cash',
  lines: [
    { id: 'l1', itemId: itemRef.id, itemName: partName, qty: 1, rate: 1200 },
  ],
  total: 1200,
  amountPaid: 1200,
  status: 'active',
  cancelReason: null,
  notes: null,
  sourceJobCardId: null,
  sourceJobCardNumber: null,
  editHistory: [],
  createdById: uid,
  createdByName: fullName,
  createdAt: now,
  updatedAt: now,
})

// ---- a job card at a status that still accepts parts -----------------------
const jobNumber = `JC-2026-27-${String(stamp).slice(-5)}`
const jobRef = doc(collection(db, `companies/${companyId}/jobCards`))
await setDoc(jobRef, {
  jobNumber,
  status: 'inProgress',
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
  problemLabels: ['Seeded for the stock probe'],
  remark: null,
  serviceItems: [],
  estimatedCost: 1800,
  advanceReceived: 0,
  partsCost: 0,
  finalAmount: null,
  paidAmount: 0,
  itemsReceived: [],
  itemsReturned: [],
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
  partsUsed: [],
  imageUrls: [],
  notes: [],
  attributes: {},
  cancelReason: null,
  holdReason: null,
  lastActionUndo: null,
  createdById: uid,
  createdByName: fullName,
  createdAt: now,
  updatedAt: now,
})

console.log(JSON.stringify({ companyId, jobId: jobRef.id, jobNumber, itemId: itemRef.id, partName }))
process.exit(0)
