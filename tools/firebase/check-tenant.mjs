/**
 * Reads a tenant back from the server as one of its own users, to answer "is the data actually
 * there?" without any client-side cache in the way.
 *
 * The companion to `e2e-signup.mjs`. That script found a brand-new Owner staring at an empty
 * sidebar; this one established that the company, the Owner role and the profile all existed and
 * were readable, with `fullAccess: true` — which is what moved the search off `firestore.rules`
 * and onto the client, where the bug actually was.
 *
 * Every read is `getDocFromServer`, never `getDoc`: the local cache is usually the thing under
 * suspicion, and a cached answer would hide exactly what is being measured.
 *
 *   node --env-file=.env.local tools/firebase/check-tenant.mjs <email> <password> <companyId> <roleId>
 *
 * `e2e-signup.mjs` prints the exact invocation for the account it just created.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeFirestore, doc, getDocFromServer, collection, getDocs } from 'firebase/firestore'

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, 'mobilerepairing')

const [email, password, companyId, roleId] = process.argv.slice(2)
const cred = await signInWithEmailAndPassword(auth, email, password)

const user = (await getDocFromServer(doc(db, `users/${cred.user.uid}`))).data()
console.log(
  'users/{uid}:',
  JSON.stringify(
    {
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.roleName,
      roleCode: user.roleCode,
      status: user.status,
      branchId: user.branchId,
      companyIds: user.companyIds,
      memberships: user.memberships,
      activeCompanyId: user.activeCompanyId,
    },
    null,
    2
  )
)

const role = (await getDocFromServer(doc(db, `companies/${companyId}/roles/${roleId}`))).data()
console.log(
  '\nrole doc:',
  JSON.stringify(
    {
      name: role.name,
      code: role.code,
      type: role.type,
      status: role.status,
      fullAccess: role.fullAccess,
      menuPermissionKeys: Object.keys(role.menuPermissions ?? {}).length,
      dashboardConfig: role.dashboardConfig,
    },
    null,
    2
  )
)

const roles = await getDocs(collection(db, `companies/${companyId}/roles`))
console.log(
  `\nall ${roles.size} roles:`,
  roles.docs.map((d) => `${d.data().code}${d.id === roleId ? ' <- profile.roleId' : ''}`).join(', ')
)

const company = (await getDocFromServer(doc(db, `companies/${companyId}`))).data()
console.log(`\ncompany: name=${company.name} status=${company.status}`)
process.exit(0)
