# aim

Repair-shop & second-hand-device ERP by AIM ENTERPRISE.

Built phase-by-phase — see [`BUILD_PLAN.md`](BUILD_PLAN.md) for the full roadmap and
[`PROGRESS.md`](PROGRESS.md) for what's done, every non-obvious decision made along the way, and
known limitations. `SCREENS_NOTES.md` catalogues the reference UI this app was built to match.

## Stack

Vite + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), React Router, TanStack
Query, Firebase (Auth/Firestore/Storage — client SDK only, no server component), Recharts,
react-hook-form + zod.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in your Firebase project's config (see below)
npm run dev
```

### Firebase config

Every value below comes from Firebase Console → Project Settings → your web app's config
snippet, except `VITE_FIREBASE_DATABASE_ID`.

| Variable                            | Where it comes from                                               |
| ----------------------------------- | ----------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Web app config                                                    |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Web app config                                                    |
| `VITE_FIREBASE_PROJECT_ID`          | Web app config                                                    |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Web app config                                                    |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Web app config                                                    |
| `VITE_FIREBASE_APP_ID`              | Web app config                                                    |
| `VITE_FIREBASE_MEASUREMENT_ID`      | Web app config (optional — Analytics)                             |
| `VITE_FIREBASE_DATABASE_ID`         | **Only if your Firestore uses a named database, not `(default)`** |

**The named-database gotcha**: check Firebase Console → Firestore Database → the database
selector dropdown at the top. If it shows anything other than the literal word `(default)` —
e.g. `demo` — you **must** set `VITE_FIREBASE_DATABASE_ID` to that exact name. Every Firestore
call in this app goes through `src/lib/firebase.ts`'s own `getFirestore(app, databaseId)`; a
missing or wrong database id here makes every single read/write fail (often silently, as a
permission-denied-looking error) even though the credentials themselves are correct. This is the
single most common invisible-failure mode when standing this project up against a new Firebase
project — see `BUILD_PLAN.md` §1 for the full story.

### Firestore/Storage security rules

`firestore.rules`, `firestore.indexes.json`, and `storage.rules` are checked into the repo but
**are not automatically deployed** — Firebase doesn't pick up local rule files on its own. Deploy
them with:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

or paste each file's contents into Firebase Console (Firestore Database → Rules, and Storage →
Rules) by hand. Until these are deployed, the app only works under whatever rules already exist
on the project (or the Firebase default of "all access denied," on a brand-new project).

**The named-database gotcha applies to the deploy too**, and fails more quietly than the runtime
one. `firebase deploy --only firestore:rules` writes to the database named in `firebase.json`'s
`firestore.database` key; with that key missing or wrong, the CLI happily reports a successful
deploy while the rules land on a database the app never talks to — leaving the real one on
whatever it had before. Both `firebase.json` (`"database": "mobilerepairing"`) and `.firebaserc`
(`"default": "ibellmobiles-123"`) are already pointed at this project; if you move to a different
Firebase project or database, change them together with `VITE_FIREBASE_DATABASE_ID`.

Check what actually landed with `npx firebase-tools firestore:databases:list`, and confirm the
Rules tab in the Console is showing the `mobilerepairing` database (there is a database selector
at the top) rather than `(default)`.

### What a fresh signup seeds

The very first signup on a new company atomically creates, in one Firestore batch (see
`seedTenantForUser()` in `src/lib/auth.ts`):

- The company doc itself (`status: 'active'`, `protected: true` — the one company this account
  will ever have; see `PROGRESS.md`'s Phase 10 notes for why there's no multi-company support).
- **Main Branch** — a protected, un-deletable branch (`code: MAIN`).
- **The current Financial Year** — derived from today's real calendar date (Apr 1 – Mar 31,
  Indian fiscal year), not hardcoded.
- **5 default roles** — Owner (full access), Manager, Salesman, Technician, Accountant — each
  with a real starting permission set, not a blank slate.
- A full default **Service Options** catalogue (91 device models across 20 brands, plus
  cancel/hold/outstanding reasons and customer items) and default **Masters** data (Units of
  Measure, Payment Modes, Party Categories, Item Categories).
- One protected default **Print Template** per document type (11 total), and default **WhatsApp**
  message templates for each job lifecycle event — so real "Print"/"WhatsApp" buttons work from
  the very first job card, not just after manual setup.
- The signing-up user's own profile, an audit-log entry, and an active session.

Every one of these is real, editable data afterward — an Owner can rename, reorder, disable, or
add to any of it through the app's own Settings/Masters pages exactly like anything else.

## Scripts

- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npm run lint` — ESLint (includes the React Compiler's own correctness checks)
- `npm run format` / `npm run format:check` — Prettier

## Deploy (Vercel)

1. **Link the project**: `npx vercel link` (or import the repo directly from the Vercel
   dashboard) from the repo root.
2. **Set environment variables** — every `VITE_FIREBASE_*` var from the table above, in Vercel
   Project Settings → Environment Variables (Production, and Preview if you want preview
   deployments to work against the same Firebase project). `VITE_FIREBASE_DATABASE_ID` is
   required here too if your project uses a named database — a preview/production build with no
   Firebase env vars at all will build successfully (Vite doesn't fail on missing `VITE_*` vars)
   but every Firebase call will fail at runtime.
3. **Deploy**: `npx vercel --prod`, or push to the linked Git branch if you've connected the
   Vercel project to your repo for automatic deploys. `vercel.json` already handles SPA routing
   (`/* → /index.html`) so client-side routes don't 404 on a hard refresh.
4. **Add the deployed domain to Firebase Auth's authorized domains list** — Firebase Console →
   Authentication → Settings → Authorized domains → Add domain. Without this, sign-in/signup will
   fail on the deployed site even with correct env vars (Firebase Auth rejects auth requests from
   an origin it doesn't recognize).
5. **Verify live**: sign up a real (throwaway) account on the deployed URL and confirm the full
   signup → dashboard flow works — the fastest way to catch a missed env var or un-deployed
   Firestore rule before a real user does.

## Known, honest limitations

Documented in full in `PROGRESS.md`'s per-phase "decisions" sections; the headline ones:

- **IP Whitelist enforcement is advisory only** — a client-SDK-only app has no way to make this
  unspoofable; it's a real, working check, just not a hard security boundary.
- **Scheduled/automatic backups persist the preference but can't fire themselves** — no
  server/Cloud Function/cron exists to run them unattended. Use "Backup Now" for a real backup
  today.
- **Financial Year documents (Settings → Financial Years) are administrative, not load-bearing**
  — job/receipt/party sequence numbers derive their `2026-27`-style segment from the real
  calendar date, independent of which FY doc is marked "Current."
- **No real payment gateway, SMS, or email sending** — this is a client-SDK-only Firebase app;
  WhatsApp messages open `wa.me` links for the user to send manually, and there is no billing
  tier to pay for (the app is free, by design — see Settings → Billing & Subscription).
  #   m o b i l e r e p a i r 
   
   

## Deploying

```
npm run build
npx firebase-tools deploy --only hosting
npx firebase-tools deploy --only firestore:mobilerepairing
npx firebase-tools deploy --only storage
```

Live at https://aimenterprise.web.app

**Deploy the Firestore rules with `--only firestore:mobilerepairing`, not
`--only firestore:rules`.** This project uses a _named_ database, so the `firestore` key in
`firebase.json` is an array. The CLI's `firestore:rules` selector only understands the
single-object form: against the array it prints "Deploy complete" and releases nothing at all —
no error, no warning. That silent no-op is what left the rules undeployed while every attempt
appeared to succeed, and the symptom was the app hanging on its loading spinner with
`FirebaseError: Failed to get document because the client is offline`, because a deny-all ruleset
rejects the listen stream and the SDK then reports itself offline rather than permission-denied.

`--only firestore:indexes` crashes the CLI outright on the array form
(`TypeError: Cannot read properties of undefined (reading 'map')`); the database-name selector
deploys indexes and rules together and works.
