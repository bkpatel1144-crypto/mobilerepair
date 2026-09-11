/** Prints a shop's company document — used to tell "the setting did not save" apart from
 *  "the setting saved and the screen ignores it". */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeFirestore, doc, getDoc } from 'firebase/firestore'
const [email, password] = process.argv.slice(2)
const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY, authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID, storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: process.env.VITE_FIREBASE_APP_ID,
})
const db = initializeFirestore(app, {}, process.env.VITE_FIREBASE_DATABASE_ID || 'mobilerepairing')
const cred = await signInWithEmailAndPassword(getAuth(app), email, password)
const { companyId } = (await getDoc(doc(db, 'users', cred.user.uid))).data()
const c = (await getDoc(doc(db, `companies/${companyId}`))).data()
console.log(JSON.stringify({
  companyId,
  gstRegistration: c.gstRegistration, gstin: c.gstin,
  gstRate: c.gstRate, pricesIncludeGst: c.pricesIncludeGst,
}, null, 2))
process.exit(0)
