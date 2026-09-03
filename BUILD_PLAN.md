# BUILD_PLAN.md — "aim" (AIM ENTERPRISE) Repair-Shop ERP

This is the authoritative, phase-by-phase build plan. It merges your roadmap with the exact
UI/UX facts pulled from the 78 reference screenshots in `example/` (fully catalogued in
[`SCREENS_NOTES.md`](SCREENS_NOTES.md)). Every phase below tells you **which preview images
are the ground truth** for that screen — when in doubt, open that file, not memory.

**Golden rule:** pixel/behavior fidelity to `SCREENS_NOTES.md` for anything it documents;
your judgement (documented in `PROGRESS.md`) for anything it doesn't (e.g. the public landing
page, which isn't in the screenshots at all and is only described in your roadmap).

No mock/static data anywhere past Phase 2. No paywall/plan-tier UI anywhere. Mobile-first,
PWA-installable, real Firebase backend, real RBAC enforced both client-side (hide/disable)
and server-side (Firestore rules) — never one without the other.

---

## 0. Tech stack (locked)

| Concern      | Choice                                                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build tool   | Vite + React 18 + TypeScript                                                                                                                                                  |
| Styling      | Tailwind CSS + shadcn/ui (`new-york` style, teal primary)                                                                                                                     |
| Routing      | React Router v6                                                                                                                                                               |
| Server state | TanStack Query (all Firestore reads go through it — no raw `useEffect` fetch spaghetti)                                                                                       |
| Backend      | Firebase (Auth, Firestore, Storage) — **client SDK only**, no Admin SDK, no custom server                                                                                     |
| Icons        | lucide-react                                                                                                                                                                  |
| Dates        | date-fns                                                                                                                                                                      |
| Charts       | Recharts                                                                                                                                                                      |
| Forms        | react-hook-form + zod (added because the roadmap implies heavy validated forms everywhere — no server exists to validate, so client-side zod schemas are the only safety net) |
| Deploy       | Vercel                                                                                                                                                                        |

---

## 1. Firebase project facts (as given) — action items before Phase 2

You gave me this config:

```
apiKey: "GOOGLE_API_KEY"          <-- ⚠ this is literally placeholder text, not a real key
authDomain: "hotel-7ac9f.firebaseapp.com"
projectId: "hotel-7ac9f"
storageBucket: "hotel-7ac9f.appspot.com"
messagingSenderId: "102297833385"
appId: "1:102297833385:web:d4082c79d3744543173eb8"
measurementId: "G-7FR0N40BPN"
databaseId: "demo"
```

Two things that change how Phase 0/2 must be built, vs. a naive `firebaseConfig` copy-paste:

1. **`apiKey` is not real.** I've written it into `.env.local` as-is so the file structure is
   ready, but auth/Firestore calls will fail until you paste the real Web API key (Firebase
   Console → Project settings → General → Your apps → SDK setup and configuration) over that
   placeholder.
2. **`databaseId: "demo"` means this project's Firestore is a _named_ (non-default) database.**
   The plain `getFirestore(app)` call everyone copy-pastes only ever talks to the database
   literally called `(default)`. If your Firestore instance is really named `demo` (Firebase
   Console → Firestore → check the database-selector dropdown to confirm), `src/lib/firebase.ts`
   **must** call `getFirestore(app, "demo")` (via an env var, not hardcoded) or every read/write
   will silently 404/hang against a database that doesn't exist. This is the single most common
   invisible bug in Firebase+Vite setups with a non-default database, so it's called out
   explicitly in Phase 0.
3. Project id `hotel-7ac9f` / bucket names suggest this Firebase project was originally created
   for something else (a "hotel" app) and is being reused. That's fine functionally — Firestore
   doesn't care what the project is named — but flagging it in case it wasn't intentional.

`.env.local` (gitignored) and `.env.local.example` have been created at the repo root already —
see the end of this message.

---

## 2. Non-negotiable quality bar (applies to every phase, not just Phase 11)

- **No fake numbers.** If a stat card can't be computed live from Firestore yet, the screen
  isn't done — don't ship a hardcoded "₹245" because that's what the sample screenshot showed.
- **Every list has:** loading skeleton → empty state → error state → populated state. Never a
  blank white flash.
- **Every destructive action** (delete, void, cancel, deactivate) shows a confirm step.
- **Every write** goes through a single mutation function per entity (not duplicated inline
  Firestore calls scattered across components) so audit-logging (Phase 3) can hook in once.
- **Every route + sidebar item + action button** is gated by `usePermissions()` (Phase 3) — no
  hardcoded `if (role === 'owner')` anywhere in feature code.
- **375px width is a first-class breakpoint**, tested every phase, not deferred to Phase 11 polish.
- **Firestore security rules are written in the same phase as the collection they protect** —
  not deferred to the end. A collection with no rule is a phase that isn't actually done.

---

## Phase 0 — Project scaffold

**Goal:** blank-but-correct shell; `npm run dev` renders a blank page with zero console errors.

- [ ] `npm create vite@latest . -- --template react-ts`
- [ ] Tailwind CSS install + config (content globs covering `src/**/*.{ts,tsx}`)
- [ ] shadcn/ui `init` — style `new-york`, base color = a custom teal (map to `#0d9488` /
      `#14b8a6` per the landing-page hero color observed nowhere in screenshots but specified
      in your roadmap — this is a deliberate deviation from the screenshots' pure-white/teal-accent
      app UI, which is correct: the marketing site is allowed to be bolder than the app shell)
- [ ] React Router v6, TanStack Query (with a shared `QueryClient`, sane `staleTime` defaults —
      financial numbers should refetch more eagerly than static masters data)
- [ ] `firebase` SDK (client only)
- [ ] `lucide-react`, `date-fns`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`
- [ ] `src/lib/firebase.ts`:
  ```ts
  import { initializeApp } from 'firebase/app'
  import { getAuth } from 'firebase/auth'
  import { getFirestore } from 'firebase/firestore'
  import { getStorage } from 'firebase/storage'

  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  })

  export const auth = getAuth(app)
  // Named database — see BUILD_PLAN.md §1. Falls back to "(default)" if unset.
  export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)')
  export const storage = getStorage(app)
  ```
- [ ] `.env.local.example` with all 7 keys (incl. `VITE_FIREBASE_DATABASE_ID`) as placeholders
- [ ] `vercel.json`: SPA rewrite (`{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`)
- [ ] ESLint + Prettier (React + TS + hooks rules; Prettier as an ESLint-conflict-free formatter)
- [ ] PWA: `public/manifest.json` (name "aim", short_name "aim", `display: standalone`,
      `theme_color`/`background_color` teal-ish, icons 192/512), a minimal service worker
      (cache-first for the app shell, network-first for nothing Firestore-related — don't cache
      API responses, only static assets) registered in `main.tsx`
- [ ] `PROGRESS.md` stub created (see bottom of this plan) — update after **every** phase, not
      just at the end
- [ ] Verify: `npm run dev` → blank white page, 0 console errors, 0 TS errors

---

## Phase 1 — Design system & app shell

Reference screenshots: **all of them** (the shell is on every page) — specifically
`preview.webp`, `preview (7)`, `preview (16)`, `preview (60)`, `preview (67)` for sidebar states
at different scroll/expansion points.

### Public landing page (`/`)

Not covered by screenshots — build to your roadmap's spec exactly as written (dark hero,
teal wordmark, floating browser-mockup card with the job-card status timeline, feature
sections, free-forever pricing page, no card-required messaging). This is the one screen
where your roadmap is the sole source of truth.

### Authenticated shell (`/app/*`)

From `SCREENS_NOTES.md` "Cross-cutting observations" section — build these as the first
reusable pieces, in this order, because everything else depends on them:

1. **Top bar** (identical on every screen): hamburger + "aim" wordmark · breadcrumb trail ·
   search input w/ `Ctrl K` hint · fullscreen icon · gear icon · dark-mode moon icon ·
   translate icon · bell · avatar chip (initials circle + name + role, e.g. "Shrey Ghadge /
   Owner").
2. **Left sidebar**, ~250px, white bg, collapsible. Fixed top-level order (confirmed across
   every screenshot, never varies): **Dashboard → Sales → Service → Finance → Masters →
   Second Hand Device → Reports → Administration → Settings**. Accordion behavior — expanding
   one section auto-collapses whichever was open (observed: Settings open on `preview.webp`,
   only Administration open on `preview (16)`, only Finance open on `preview (60)` — never two
   open at once). Active leaf = light-teal pill bg + teal left border + teal icon/text
   (`preview.webp`'s "Backup & Restore" row). Footer: "© 2025 ERP Pro" (only visible when the
   open section's list is short enough not to push it off-screen).
3. Sidebar sub-items, exact and complete (do not invent extra ones, do not drop any):
   - **Sales:** Sales Invoices
   - **Service:** Job Cards, Service Options, Job Costing, Service Items
   - **Finance:** Receipts & Payments, Party Ledger, Cash Book, Receivables, Payables,
     Supplier Payables 🔒, Expenses 🔒
   - **Masters:** Units of Measure, Item Categories, Item Master, Payment Modes,
     Party Categories, Parties
   - **Second Hand Device:** Device Purchase, Device Sale, Device Stock, Purchase Register,
     Sale Register
   - **Reports:** Service Reports, Profit & Loss 🔒, Job-wise Profit, Supplier Report,
     Technician Report, Period Summary, Field Visit Report
   - **Administration:** User Management, Role Management, Active Sessions, IP Whitelist,
     Login Report, System Audit
   - **Settings:** Branch Management, Workflow Designer, Company Settings, Financial Years,
     Billing & Subscription, Print Formats, WhatsApp, Backup & Restore
   - 🔒 = build the nav entry disabled/greyed with a lock icon and route it nowhere functional
     yet (Supplier Payables, Expenses, Profit & Loss) — this is the app's own convention for
     "not available on this plan/role", reuse it verbatim for genuinely locked items later.
4. **Route base:** `aim.kiwikit.in/dashboard/...` in the original → use `/app/...` as our base
   (e.g. `/app/admin/roles`, `/app/finance/receivables`) since `/dashboard` as a path segment
   was the original's choice, not a hard requirement — note this substitution in `PROGRESS.md`.

### Shared components (build before any feature page)

- `<StatCard>` — label (uppercase, small, grey), big bold number, icon in a soft colored
  circle, optional trend arrow. Seen everywhere: dashboard tiles, every report's summary row,
  every list page's filter-pill row (`Total 1 / Active 1 / Inactive 0 / Deleted 0` pattern).
- `<StatusBadge>` — color-mapped pill. Palette observed: green = Active/Success/Paid, red =
  Cancelled/overdue/negative, amber/orange = Pending/Warning/Default-badge, blue = In
  Progress/info, grey = Closed/neutral/System, purple = special (Owner-role, session icons).
- `<DataTable>` — sortable column headers (↕ arrows), search box, pagination footer in the
  exact observed copy pattern `"Showing 1–1 of 1"` / `"1–1 of 1 record(s)"` + `"Rows per
page: [10 ▾]"` + `« ‹ Page 1 of 1 › »`. Row click → `<DetailDrawer>`.
- `<DetailDrawer>` — slides from right, header (icon+title+status badges), action buttons row,
  grouped labeled sections (small caps section headers with icons), timeline block at bottom
  where applicable, X to close. This single component is reused for **every** entity detail
  view in the app (Party, Item, Role, Branch, Session, Job Card, Second-hand device, etc.) —
  build it generic (sections as a prop array) rather than one-off per entity.
- `<FormModal>` — centered modal, optional "Saved HH:MM AM" / "Draft saved" autosave indicator
  top-right, "Clear/Clear Draft" link, Cancel + primary-teal-action footer buttons.
- `<EmptyState>` — icon + message (e.g. "No backups yet. Create your first backup above.",
  "No outstanding receivables / All payments are up to date.").
- `<FilterBar>` — date quick-chips (Today/Yesterday/This Week/This Month/This Year) + custom
  range date pickers + search box; reused on nearly every list/report page.
- Mobile behavior for all of the above from day one: sidebar → slide-in drawer under 768px,
  `<DataTable>` rows → stacked cards, `<FormModal>`/`<DetailDrawer>` → full-screen sheet,
  44px+ touch targets.
- [ ] Verify: landing page renders; `/app/dashboard` renders an empty shell with working
      sidebar accordion behavior and a working mobile drawer toggle at 375px.

---

## Phase 2 — Auth + multi-tenant data model + security rules

Reference: `preview (25)`/`(26)` (Users), `preview (23)`/`(24)` (Roles), `preview (14)`/`(15)`
(Branches), `preview (3)`/`(4)` (Financial Years) for the shape of the seeded defaults.

- [ ] Email/password signup, login, forgot-password, persisted session, protected routes.
- [ ] On first signup, in one transaction/batch:
  - `companies/{companyId}` doc
  - `companies/{companyId}/branches/{branchId}` — **Main Branch**, code `MAIN`, `type: "system"`,
    `protected: true` (matches `preview (14)`'s "Protected system branch — Cannot be deleted")
  - `companies/{companyId}/financialYears/{fyId}` — a current FY seeded active (matches
    `preview (3)`/`(4)` "FY 2026-27" pattern — derive from the real current date, not hardcoded)
  - `companies/{companyId}/roles/{roleId}` × 5: **Owner** (code `OWNER`, `type: "owner"`,
    `protected: true`, full `menuPermissions`/`actionPermissions` = all true — matches
    `preview (23)`'s "This is the Owner role... can only be managed by another Owner"),
    **Manager**, **Salesman**, **Technician**, **Accountant** (`type: "custom"`) each with a
    sensible starter permission map you define now and refine in Phase 3
  - `users/{uid}` for the signing-up user — `role: OWNER`, `protected: true` (matches
    `preview (25)`'s "Shrey Ghadge — Protected" badge), `branchId` = Main Branch
- [ ] Firestore collections — use exactly this shape (from your roadmap, confirmed compatible
      with everything seen in the screenshots):
  ```
  companies/{companyId}
  companies/{companyId}/branches/{branchId}
  users/{uid}
  companies/{companyId}/roles/{roleId}
  companies/{companyId}/workflowConfig/{roleId}
  companies/{companyId}/parties/{partyId}
  companies/{companyId}/partyCategories/{id}
  companies/{companyId}/items/{itemId}
  companies/{companyId}/itemCategories/{id}
  companies/{companyId}/uom/{id}
  companies/{companyId}/paymentModes/{id}
  companies/{companyId}/serviceOptions/{type}/{id}
  companies/{companyId}/jobCards/{jobId}
  companies/{companyId}/jobCosting/{jobId}
  companies/{companyId}/receipts/{receiptId}
  companies/{companyId}/secondHandPurchases/{id}
  companies/{companyId}/secondHandSales/{id}
  companies/{companyId}/auditLog/{id}
  companies/{companyId}/sessions/{id}
  companies/{companyId}/ipWhitelist/{id}
  companies/{companyId}/financialYears/{id}
  companies/{companyId}/printTemplates/{id}
  companies/{companyId}/backups/{id}
  companies/{companyId}/counters/{docType}   // ADDED — see sequential-ID note below
  ```
- [ ] **`companyId` resolution strategy (decision, documented here so Phase 3+ don't re-litigate
      it):** use **custom claims** set via a callable-free approach is not possible without a
      server, and this project is explicitly client-SDK-only with no Admin SDK / Cloud
      Functions. So: store `companyId` on `users/{uid}` (already in the shape above) and have
      **every security rule look it up with `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId`**
      rather than relying on a custom claim nothing can mint without a backend. This is slightly
      more expensive per rule evaluation (an extra `get()`) but is the only correct option given
      the "no custom server" constraint. Document this trade-off in `PROGRESS.md`.
- [ ] **Sequential human-readable IDs** (`JC-{FY}-{seq}`, `RCP-{ddmm}-{seq}`, `PTY-{FY}-{seq}`,
      `SHDP-{FY}-{seq}`, `SHDS-{FY}-{seq}` — all confirmed exact formats from the screenshots,
      e.g. `JC-2026-27-00001`, `RCP-2609-00001`, `PTY-2026-27-00002`, `SHDP-2026-27-00001`):
      implement via a **Firestore transaction** against `counters/{docType}` (`{lastSeq: number}`)
      — read, increment, write, and create the real doc in the _same_ transaction so two
      concurrent job-card creations can never collide. Never generate these client-side with
      `Math.random()` or a plain increment-then-write (race condition).
- [ ] `firestore.rules`: auth required everywhere; every doc scoped to the caller's `companyId`
      via the lookup above; writes to sensitive collections additionally check the caller's role
      `actionPermissions` map (deny by default — an empty/missing permission = no access, never
      "assume yes"). `firestore.indexes.json` for composite queries (jobCards by
      status+branch+date, auditLog by companyId+timestamp, etc.) — add indexes as each later
      phase's queries need them, don't try to guess them all now.
- [ ] Verify: sign up → land on dashboard → sign out → sign back in; confirm in Firebase console
      that company/branch/FY/5-roles/user docs all exist with correct shapes.

---

## Phase 3 — RBAC engine (build before any feature module)

Reference: `preview (7)`, `(21)`, `(22)`, `(23)`, `(24)` (Role Management + Configure screens),
`preview (25)`/`(26)` (User Management).

- [ ] `usePermissions()` hook — loads the current user's role doc once (TanStack Query,
      long `staleTime`, invalidated on role-config save), exposes `canView(menuKey)` and
      `canDo(entity, action)`. **Every** sidebar item, route guard, and action button from
      Phase 4 onward consumes this — no per-role `if` statements in feature components.
- [ ] **Administration → Role Management** (`preview (23)`/`(24)`): list (Total/Active/
      Disabled/Deleted stat pills), search, "+ Add Role", row → detail drawer (Role Information,
      "Owner Role" warning box for the protected role, Timeline), **Configure** page with tabs:
  - **Menus & Permissions** (`preview (21)`/`(22)`): collapsible module tree mirroring the
    sidebar exactly, each module a checkbox with a submenu-count badge (`"2/2"`) and a
    permission-count badge (`"⚿ 11/11"`); expanding a module reveals its entity permission
    table (CREATE/DELETE/UPDATE/VIEW columns) plus named special actions (Approve Invoice,
    Cancel Invoice, Email Invoice, Export Data, Record Payment, Print Invoice, Access Sales
    Module, etc. — one such action list per module, defined per-module not globally). Header
    controls: Collapse/Expand/Clear/Select All/"Inherit from role"/"Grant Full Access" toggle
    (which flips to "Full Access Granted" and disables the granular tree underneath — confirmed
    behavior from comparing `preview (21)` vs `(22)`). Footer: live `X/Y menus · X/Y permissions
· N widgets` counters + "Unsaved changes" pill + Cancel/Save.
  - **Dashboard & Landing**: default landing route + visible-widgets selection per role.
- [ ] **Administration → User Management** (`preview (25)`/`(26)`): list (Total/Active/Disabled/
      Deleted), "+ Add New User" full-page form (Full Name, Mobile, Email, Password w/ show-hide
      eye icon, Role dropdown w/ "Role selected" confirmation, amber "Security Note" box,
      autosave "Status: Incomplete/Complete" + "Auto-saved HH:MM:SS AM" indicator) that
      **actually** creates a Firebase Auth user (client SDK `createUserWithEmailAndPassword`,
      then immediately re-sign-in the acting Owner since client-side user creation signs in as
      the new user — handle this properly, e.g. a secondary Firebase Auth app instance so the
      Owner's session isn't hijacked) + the Firestore `users` doc + role assignment.
- [ ] Verify: create a Technician user, log in as them, confirm sidebar items _actually
      disappear_ (not just CSS-hidden) and that a direct Firestore write attempt for something
      outside their `actionPermissions` is rejected by the rules, not just the UI.

---

## Phase 4 — Workflow Designer (dynamic form + status-action engine)

Reference: `preview (7)`–`(13)` (Role Permissions / Job Card Form / Lead Form tabs).

`workflowConfig/{roleId}` holds all of the below per role.

1. **Role Permissions tab** (`preview (7)`, `(13)`): role picker with configured-role list
   (each row shows `👁 N statuses · ⚡ N actions`), then the exact status×action matrix:
   - Statuses (10, exact): `Pending, In Queue, In Progress, On Hold, Technician Completed,
Ready for Delivery, Delivered, Closed, Cancelled, Cancelled · Pending Return`
   - Actions (14, exact): `Take Job, Job Done, Hold, Resume, Generate Bill, Payment, Deliver,
Close, Cancel, Return & Close, Add Image, Add Part, Field Visit, Handover`
   - Plus "Job Access" (All Jobs / Assignee + Open / Assigned Only) and a removable-chip
     multi-select "Status Filter" (which statuses this role even sees in the Job Cards list).
2. **Users tab** (`preview (12)`): Assignment & Handover (Assign To Roles / Handover Roles /
   Default Handover dropdowns) + "Who Did It — Dropdowns" toggles (Received By, Delivered By,
   Cancelled By, Returned By, Field Visit Technician) — each toggle switches between
   "logged-in user auto-recorded" (off) and a user-selectable dropdown (on).
3. **Behavior tab** (`preview (11)`): toggles — Collect payment with Generate Bill, Print
   prompt after job card creation, Require description on Job Done, Can view prices & payment
   data, Allow undo last action — plus "Auto-Open Popups": After Job Done → Open Generate
   Bill/Open Handover; After Generate Bill → Open Handover.
4. **Job Card Form Builder tab** (`preview (8)`–`(10)`): live per-field toggle system.
   Field groups (checkboxes): Customer Information, Device Information, Repair Information,
   Financial, Accessories, Internal Details, Images. Per-field icon controls: 👁 visibility /
   🔴 required / 🔒 locked / 📱 device-only. Exact field list, exact optional/locked defaults
   as observed: Customer* (locked), Device Type* (locked) + Brand* + Model* (all with inline
   "+" add-new), IMEI (optional, scan-icon), IMEI 2, Serial No (optional), Device PIN/Pattern
   (optional, "⊞ Draw" pattern-grid widget), Problems* (locked, multi-select + "+"), Service
   Items (optional, catalog search that adds to Estimated Cost), Estimated Cost & Advance
   Received (currency inputs with quick chips ₹200/500/1,000/1,500/2,000/3,000/5,000, plus a
   highlighted ₹0 default chip), Items Received/Returned (multi-select tag pickers with "+"),
   Received By* (locked, defaults to current user), Assign To (technician picker), Remark,
   Add Images (dropzone). Layout dropdown (Standard one-field-per-row / Compact paired fields /
   Two Column / Large Desktop / Auto), Template select, Import/Export/"Save as template"/
   Discard/Save. **This schema must literally drive the real Create Job Card form in Phase 5** —
   render it from the stored schema, don't hand-build a second hardcoded form that happens to
   look similar.
5. **Lead Form Builder tab** (`preview (8)`): same toggle system for a Lead schema — Contact
   Information (Customer*, Name, Phone Number, Alternative Mobile, Business Name), Location
   (District, Taluka, Village, City, Address — all hideable, default hidden per screenshots),
   Notes, Source (dropdown, default "Cold Call"), Assign To, Tags, Next Follow-up Date (+ time,
   quick chips Tomorrow/In 3 days/In a week), Follow-up Note.

- [x] Verify: flip a field required→optional in the builder, confirm its own live-preview pane
      updates instantly and the change persists after a reload — done, 20/20 automated checks.
      The second half of this line ("confirm the *real* Create Job Card form changes live") isn't
      checkable yet — that form doesn't exist until Phase 5 — but it's built to read from this
      exact same `formSchemas/jobCard` doc, not a hardcoded copy; Phase 5's own verify step
      closes the loop.

---

## Phase 5 — Service module

Reference: `preview (69)`–`(72)` (Job Cards list + full detail), `preview (73)` (Service
Options), `preview (37)`/`(74)` (Job Costing), `preview (75)` (Service Items).

- [x] **Job Cards** (`preview (69)`): 11-pill status filter row (`Total, Pending, In Queue, In
Progress, On Hold, Tech Done, Ready, Delivered, Closed, Cancelled, Pending Return`) —
      click any pill to filter the table by that status; search, date chips, "My Completed
      Jobs (N)"/"My Received Jobs" quick filters; "+ Create Job Card" using the Phase 4 schema.
      Row → full detail (`preview (71)` drawer / `preview (72)` expanded full-page — build one
      component, the drawer just renders it narrower): header (job#, customer+phone, status
      badge), action buttons (Cancel Job, Repeat Job, Print Label, Print Job Card, Print Bill,
      WhatsApp), amber "Undo Last Action · no time limit" banner (only shown if the Behavior
      toggle allows it, and only within whatever undo window you implement), then panels for
      Items at Intake (received/returned chips), Device, Problem Reported + Remark, Assignment
      (Received/Assigned/Delivered By), Payment (Estimated/Advance/Paid/Balance + Parts Cost +
      Final Amount + linked receipt chips), Parts Used, Images, Notes, and a right-hand vertical
      Timeline (Created → Assigned → Advance Received → Part Added → Taken (status transition
      badge) → Note → Part Added → Repair Done → ... — every one of these must be a real
      event written when the corresponding action happens, not synthesized after the fact).
      **Every status transition button is gated by the Phase-4 status×action matrix for the
      current user's role AND the job's current status** — this is the whole point of the
      Workflow Designer; don't just show all buttons always.
- [x] **Service Options** (`preview (73)`): Brands nested under Device Types (Mobile/Keypad
      Phone/Tablet/Smart Watch/Earbuds-TWS/Laptop) with drag-handle reorder + edit/delete +
      count badges, "🔀 Split shared brands" action (a brand can start shared across device
      types; this button forks it into per-device-type independent rows without touching
      existing job cards' historical references) + flat accordion sections: Cancel Reasons,
      Customer Items, Device Types, Hold Reasons, Models (grouped by brand, `"18 brands · 91"`
      badge pattern), Outstanding Reasons, Problems — each with its own "+" add.
- [x] **Job Costing** (`preview (37)`/`(74)`): list of Closed jobs, All/Pending/Done tabs,
      row → "Record Actual Costing" modal: read-only reference table of parts from the job,
      editable cost-entry cards per Part/Labor/Overhead/Other tab (rate × qty, with a
      🔒 Linked / ⚠ Cost required badge per row), "+ Add Cost Item", live Bill Amount/Total
      Cost/Profit (color-coded, %) summary, amber "Actual cost exceeds original rate on some
      parts" warning when applicable, Notes, Save (purple "Save Costing" button, matches
      screenshot's distinct purple accent for this one flow).
- [x] **Service Items** (`preview (75)`): read-only table, filtered from Item Master to
      `type === "service"` items — literally query Item Master with that filter, don't
      duplicate data into a second collection (the app's own banner text says exactly this:
      "Service items are managed in Item Master... appear here automatically"). Item Master
      itself doesn't exist until Phase 7 — see PROGRESS.md for the minimal `items`/`parties`
      collections built now so this and Job Cards have something real to query/write.
- [x] Verify: ran one job card fully through intake → take job → parts added → job done → bill
      generated → delivered → closed → costing recorded, live against the real Firebase project,
      twice consecutively (19/19 checks both times). Separately verified the actual point of
      this phase + Phase 4 together: a fresh Technician with no workflow config sees *zero*
      status-action buttons on a job card; after the Owner grants only "Take Job" for the
      Pending status via the Workflow Designer, the Technician sees exactly that one button and
      no others (8/8 checks). Dashboard confirmed to reflect the created job with no manual
      refresh. Reports (Phase 9) doesn't exist yet to check against.

---

## Phase 6 — Finance module

Reference: `preview (60)`–`(66)`, `(77)` (Payables, Receivables, Cash Book, Party Ledger,
Receipts & Payments).

- [x] **Receipts & Payments** (`preview (65)`/`(66)`): Today Received / Net Amount / Cash·Net
      cards, date+mode filters, "+ New Entry" modal (Receipt-IN / Payment-OUT toggle tabs,
      Customer search, "Against" toggle Job Card / Manual-Advance, Amount, Payment Mode button
      group Cash/UPI/Card, Notes, "Record Receipt"), table with a row kebab menu → "Void
      Receipt" (must reverse the ledger correctly inside a transaction — never just soft-delete
      the receipt doc and leave stale balances elsewhere).
- [x] **Party Ledger** (`preview (63)`/`(64)`): summary list (Total Parties/Billed/Collected/
      Outstanding), All/Customers/Suppliers toggle, row → full "khata" statement (Job Card
      Created / Advance Received / Bill Generated style particulars, running Debit/Credit/
      Balance-with-Cr-suffix, linked job-card references, closing balance row) + Export.
- [x] **Cash Book** (`preview (62)`): Opening/Total Credit(IN)/Total Debit(OUT)/Closing cards,
      date filters, running-balance table, "Closing Balance (N entry total)" row, Export.
- [x] **Receivables** (`preview (61)`): Total Outstanding/Billed/Collected/Collection% cards +
      4 aging buckets (0-30/30-60/60-90/90+ days), searchable table, empty state exact copy
      "No outstanding receivables / All payments are up to date."
- [x] **Payables** (`preview (60)`): Total Payable/Refund Due/Unused Advance/Advance Credit
      cards, All/Refund Due/Unused Advance tabs, expandable per-party row → Total Received/
      Refund Due/Already Refunded breakdown.
- [x] Greyed 🔒 nav stubs: Supplier Payables, Expenses (no logic behind them yet) — already
      declared `locked: true` in `nav.ts` since Phase 1/5; nothing new needed this phase.
- [x] Verify: recording a receipt against a Job Card updates that job's Paid/Balance, the Party
      Ledger, the Cash Book, and Receivables from **one** write path (batch/transaction) — never
      four separate un-atomic writes that can partially fail. Confirmed live: a job-card advance
      writes the receipt + `paidAmount` patch in one batch (already true since Phase 5); the new
      standalone "New Entry" does the same; Void Receipt reverses both in one batch too. Party
      Ledger, Cash Book, and Receivables all read the *same* `receipts`+`jobCards` collections
      live (no denormalized copy to drift) — see PROGRESS.md for the exact verification run.

---

## Phase 7 — Masters + Second Hand Device

Reference: `preview (39)`–`(48)` (Second Hand Device), `preview (51)`–`(59)` (Masters).

- [x] **Units of Measure** (`preview (59)`): table (System-seeded rows like Pieces/Numbers/Set/
      Pair/Box/Pack/Roll/Meter/Centimeter/Inch, Inch shown with a `LENGTH` base-unit-conversion
      badge) + "+ Add UOM" modal (Name, Code auto-generated, Type, Symbol, Decimal Places,
      Display Order, optional Base-UOM conversion, Description).
- [x] **Item Categories** (`preview (58)`): hierarchical tree (root "Spare Parts" with 8+
      children "Under: Spare Parts"), Raw Material/Service type pill, detail drawer w/
      Items/Sub-Categories stat boxes, protected system categories have no Delete.
- [x] **Item Master** (`preview (57)`): table + detail drawer (Classification: Type/Nature/
      Category/Primary UOM; Pricing: Tax GST%/CGST+SGST split/Selling/Purchase/MRP; Inventory:
      Stock Tracked; Enabled In: Sales/Purchase/Production/Service-POS chips) + Add Item form.
- [x] **Payment Modes** (`preview (56)`): table (Cash/UPI/Card seeded, Cash flagged default) +
      "+ Add Payment Mode" modal (Name, Code auto, Type, Description, "Set as default" checkbox).
- [x] **Party Categories** (`preview (54)`/`(55)`): table (General Supplier/Regular Customer/
      Walk-in Customer seeded, each can be flagged Default-for-Customer and/or
      Default-for-Supplier via star icons) + detail drawer w/ Default Credit Days + "Create New
      Category" modal.
- [x] **Parties** (`preview (51)`–`(53)`): table w/ Customers/Suppliers/Both filter pills +
      Category filter pills, sort, Export Excel/CSV, "+ Add Party" modal with a collapsible
      "Hide/Show extra details" section (Address, Email, GST number, PAN number, Area, Village,
      Taluka, District, Pincode) — Party Type is checkboxes (Customer/Supplier, not mutually
      exclusive — a party can be Both), detail drawer w/ Credit Limit/Credit Days.
- [x] **Second Hand Device — Purchase** (`preview (49)`/`(50)`): full form — Device Details
      (Type*/Brand*/Model* with inline add, IMEI + IMEI2 + scan-icon, Device PIN/Pattern draw
      widget, RAM, Storage/ROM, Colour, Battery Health%, Network, Original Invoice Date,
      Warranty Left months, Dual SIM/Box/Bill checkboxes, Condition Grade, Account Lock
      iCloud/Google status, Accessories Included, Condition Notes, Device Photos dropzone);
      Seller & ID Verification (Seller* party search + inline add, ID Proof Type/Number, ID
      Proof Photo capture, "IMEI checked against CEIR/blocked-device list" + "Seller declared
      not stolen" checkboxes); Purchase Details (Price*, Date, Payment Mode, Amount Paid w/
      "Paid in full" helper, Purchased By, Expected Sale Price, Notes).
- [x] **Device Stock** (`preview (43)`/`(44)`): In Stock/Total Invested/Aging>30days cards,
      table w/ Refurb Cost/Invested/Expected Sale Price/Days in Stock.
- [x] **Device Sale** (`preview (45)`/`(46)`): Available to Sell/In Refurb/Sold/Total Profit
      cards, "Sell {device}" modal (read-only purchased-device summary, Buyer* search + inline
      add, Sale Price*, Payment Mode, Warranty days, Accessories Given to Buyer, Notes → computes
      Profit = salePrice − purchasePrice − refurbCost).
- [x] **Purchase Register / Sale Register** (`preview (39)`–`(42)`): exportable ledgers with
      Average Margin %, detail drawer combining device+seller/buyer+purchase+sale+timeline in
      one place (Print Receipt/Invoice + Print Label actions, Edit/Send to Refurb/Return to
      Seller actions while still in stock).
- [x] Verify: buy → sell one device end to end; confirm profit math and every stat tile
      (Purchase Register, Sale Register, Device Stock, Device Sale) agree with each other.
      Confirmed live, 28/28 checks twice consecutively: signed up → all 6 Masters pages loaded
      with their seeded defaults (UOM 15, Payment Modes 3, Party Categories 3, Item Categories
      10) → created a custom UOM, a custom Item, and a "Both" customer+supplier Party → bought a
      Samsung Galaxy A15 for ₹2,000 through the full Create Purchase form (Device Details/Seller
      & ID Verification/Purchase Details, real seller quick-add) → confirmed it appeared In Stock
      on both Device Purchase and Device Stock (₹2,000 invested) → sold it for ₹2,500 through
      Device Sale's "Sell" modal (real buyer quick-add) → confirmed Sale Register showed the sale
      with ₹500 profit / 20.0% margin and the correct combined Device+Seller+Purchase+Sale+
      Timeline detail drawer, Purchase Register flipped the same purchase to "Sold," and Device
      Stock correctly emptied out. Re-ran `verify-phase5.mjs` (19/19), `verify-phase6.mjs`
      (13/13), and `verify-gating.mjs` (8/8) afterward — zero regression.

---

## Phase 8 — Administration deep dive

Reference: `preview (16)`–`(20)` (System Audit, Login Report, IP Whitelist, Active Sessions).

- [x] **Active Sessions** (`preview (20)`): Currently Online/Unique Users/Idle(30m+) cards,
      table, row → detail drawer (Signed in / Last activity / Signed in for / Auto-expires on /
      "Inactive for Xm" pill, IP + Device + collapsible raw user-agent "Technical details",
      "This is your current session" flag for the viewer's own row).
- [x] **IP Whitelist** (`preview (19)`): "+ Add IP to Whitelist" modal (Label*, IP/CIDR* with
      "Detect My Current IP" helper link, Notes, Active toggle). **Be honest about the limit
      here**: real IP enforcement at login needs a server (Cloud Function/edge middleware) to be
      unspoofable; since this project is explicitly client-SDK-only, implement it as a
      best-effort client-side check (fetch the user's public IP, compare against the whitelist,
      block the UI if it doesn't match and the role isn't Owner) and **document in `PROGRESS.md`
      that this is advisory, not a real security boundary**, so it's never mistaken for one later.
- [x] **Login Report** (`preview (18)`): 7 clickable stat cards (Online Right Now, Logins Today,
      Users Today, IP Addresses, Failed Attempts, Unauthorized, Blocked IPs — clicking one
      changes which table view is shown), "Busiest time today" stat, Today/Yesterday/This
      Week/This Month/This Year/Custom range + IP filter, logins table → session detail drawer.
- [x] **System Audit** (`preview (16)`/`(17)`): Total Events/Critical/Today cards, search +
      Filters + Export CSV, full trail table (Time/Action/Entity/Performed By/Target/Result/IP/
      Details), row → detail drawer (Entity Type+ID, Performed By w/ role+branch, pretty-printed
      JSON "Additional Details" payload, Session Info incl. browser + timestamp, Result badge).
      Flag financial/device/costing/bill-generation actions with the red ⚠ "critical" icon
      exactly as shown (Job Costing Create, Second Hand Device Sale/Purchase Create, Payment
      Receipt Create, Job Card Bill were all flagged critical in the reference data — use that
      as your critical-action list, extend sensibly for anything equivalent added later).
- [x] Every mutation written since Phase 2 must now produce a real `auditLog` entry — go back
      and retrofit Phases 2–7's write paths with a shared `logAudit()` call if it wasn't threaded
      through from the start (it should have been, per the Phase-2 "single mutation function per
      entity" rule — this phase is where you verify that discipline actually held).
- [x] Verify: every write made anywhere in the app so far produced a matching audit entry with
      correct actor, IP, and timestamp.

---

## Phase 9 — Reports

Reference: `preview (32)`–`(36)`, `(38)` (all seven report pages).

All numbers computed live via Firestore queries/aggregation — never cached static numbers.

- [x] **Service Reports** (`preview (38)`): Total Jobs/Pending/In Progress/Completed/Revenue/
      Outstanding cards, heavy filter row (date, status, assigned/received/delivered/cancelled
      by, device type), expandable rows → Details + Parts/Items table + inline Activity Timeline.
- [x] **Job-wise Profit** (`preview (36)`): Jobs/Revenue/Cost/Profit/Avg Margin cards, per-job
      table, color-coded profit (red negative), Closed/status pill.
- [x] **Supplier Report** (`preview (35)`): supplier rows w/ Total Purchase/Qty/Jobs/Avg
      Cost-per-Unit + a Share% progress bar, expand → 4 sub-stat cards + "Top Parts by Spend"
      chips + transaction table with a loss/deviation-% flag per line (matches the observed
      `↘920.4%` style annotation where a part's cost dwarfs the job's revenue).
- [x] **Technician Report** (`preview (34)`): per-technician Jobs/Revenue/Cost/Profit/Margin/
      Avg-per-Job + a Win-Rate/Performance badge (Profit/Loss), expand → 6 sub-stat cards +
      per-job table.
- [x] **Period Summary** (`preview (33)`): Daily/Monthly toggle, 7 summary cards incl. Shop
      Expenses, expandable date rows → job table + "Shop expenses in this period" explainer box + "Net after shop expenses" row.
- [x] **Field Visit Report** (`preview (32)`): Total Visits/Time Spent/Technicians on
      Field("Tap to see who")/Jobs Visited cards, By Technician / By Job Card toggle, empty
      state "No field visits logged in this period."
- [x] Greyed 🔒 nav stub: Profit & Loss.
- [x] Verify reconciliation: sum of a period's Job-wise Profit rows === that period's Period
      Summary Gross Profit; Supplier Report's Total Purchase for a period === sum of that
      period's parts costs in Job Costing.

---

## Phase 10 — Remaining Settings

Reference: `preview (1)`–`(6)` (Print Formats, Company, Financial Years), `preview (14)`/`(15)`
(Branches).

- [x] **Branch Management**: table + protected Main Branch + "+ Create Branch" modal (Name only
      — code auto-generated, per the observed helper text) + detail drawer.
- [x] **Company Settings** (`preview (5)`/`(6)`): table (one seeded protected default "aim"
      company) + detail drawer (Company/Contact/Tax & Registration/Financial Settings sections) + "Create Company" form (Company Name/Code/Legal Name, GST Registration type, GSTIN, PAN,
      Email, Phone, Currency, Timezone, amber note: "GSTIN only required for
      Regular/Composition — pick Unregistered otherwise; ensure GSTIN and PAN match").
- [x] **Financial Years** (`preview (3)`/`(4)`): table (current FY pre-seeded, star+"Current"
      badge) + "Create Next FY" (sequential, one click) + manual "Create Financial Year" modal
      (Name, Start/End Date, note steering users to the sequential button instead) + detail
      drawer w/ computed Duration and enforced "only one FY can be active at a time."
- [x] **Billing & Subscription**: static page — plainly free forever, zero plan-tier UI.
- [x] **Print Formats** (`preview (1)`/`(2)`): grouped-by-document-type list (Job Card,
      Job Card Bill, Payment Receipt, Purchase Receipt, Second Hand Device Purchase Receipt,
      Second Hand Device Sale Invoice, Second Hand Device Label, Device Tag Label, Product
      Label, Barcode Label, Customer Label — exact 11, each showing format-count + default
      format name), "+ New Template" modal (Name, Document Type dropdown) → simple field-picker + positioned-text-block canvas bound to real entity fields (doesn't need pixel-perfect
      drag-drop, just functional and bound to live data).
- [x] **WhatsApp**: template message config used by the "customer updated automatically" copy
      referenced on the landing page and job-card timeline.
- [x] **Backup & Restore** (`preview.webp`): live Current Database stat (real Firestore doc
      counts across the tenant's collections), "Backup Now" (serializes a JSON snapshot to
      Firebase Storage under the company's path), "Download Backup" (direct download of that
      JSON), scheduler UI (Daily automatic backup checkbox + Time + Keep-for-days — note in
      `PROGRESS.md` that actually running on a schedule needs a server/Cloud Function/cron this
      project doesn't have, so this persists the _preference_ but can't fire itself unattended),
      Backup History table, "Restore from File" (upload `.json` → validate shape → either
      restore as a separate read-only Archive (safe) or overwrite live data (behind a strong
      confirm)), Archives list.
- [x] Verify: full `npm run build` — zero errors, zero warnings.

---

## Phase 11 — Polish & deploy

- [ ] Empty states on every list/report that can legitimately be empty.
- [ ] Loading skeletons on every data-fetching view (no blank-white flash, ever).
- [ ] 375px pass on every single screen built in Phases 1–10 (not just spot-checked) — sidebar
      drawer, stacked-card tables, full-screen sheets, 44px+ tap targets.
- [ ] Confirm-step on every delete/void/cancel/deactivate across the whole app.
- [ ] `README.md`: setup steps, required Firebase config (incl. the named-database gotcha from
      §1), Vercel deploy steps, and the seeded-default-data summary a fresh signup gets (Owner
      user, Main Branch, current FY, 5 default roles).
- [ ] Deploy: Vercel project linked to the repo, all 8 `VITE_FIREBASE_*` env vars (7 + the
      database-id one) set in Vercel project settings, production build verified live, Vercel's
      domain added to Firebase Auth's authorized domains list.
- [ ] Final pass over `PROGRESS.md`: every phase checked off, zero open TODOs.

---

## Deviations from the literal roadmap text (called out explicitly, not silently)

1. Added `react-hook-form` + `zod` — your roadmap didn't list a form library but described
   heavily validated forms everywhere; without a server, client-side schema validation is the
   only guard rail, so this is load-bearing, not a nice-to-have.
2. Added a `counters/{docType}` collection not in your original list — required to generate the
   sequential IDs (`JC-2026-27-00001` etc.) safely under concurrent writes; a plain "read last
   doc, increment, write" pattern race-conditions under load.
3. Route base changed from the original app's `/dashboard/...` to `/app/...` to avoid colliding
   with the marketing site's own routes (landing page lives at `/`, pricing/FAQ etc. likely want
   short paths) — purely a naming choice, no functional difference.
4. IP Whitelist enforcement is explicitly downgraded to "advisory" in Phase 8 because true
   enforcement requires a server and this build is constrained to client-SDK-only — flagged
   there and here so it's never assumed to be a real security boundary later.
5. Scheduled/automatic backups (Backup & Restore's "Daily automatic backup" toggle) can persist
   a preference but cannot self-trigger without a server — same constraint as #4.
6. Phase 4's Job Card Form and Lead Form builders are stored **company-wide**
   (`formSchemas/jobCard`, `formSchemas/lead`), not per-role, despite this section's own opening
   line ("`workflowConfig/{roleId}` holds all of the below per role"). The reference screenshots
   themselves contradict that line: `preview (7)`'s "Job Card Form" and "Lead Form" tabs sit as
   siblings of "Role Permissions" at the top level, with no role selector in scope for either —
   only "Role Permissions" (statuses/actions/assignment/behavior) is actually nested under a
   selected role. A single shared form shape per company also makes more practical sense than a
   different Create Job Card *layout* per role. `workflowConfig/{roleId}` still holds everything
   that genuinely is per-role.
7. Phase 5 (Service module) needs a customer to attach a job card to and a catalog to pick
   parts/service items from — both are properly "Masters" (Phase 7) concerns, but Phase 5 comes
   first in this roadmap's own ordering. Added minimal `parties`/`items` collections now (see
   `PartyDoc`/`ItemDoc` in `src/types/firestore.ts`) with just enough of a shape for Phase 7's
   fuller Item Master/Party Management pages to extend, not replace. No new "Masters" pages were
   built early — the quick-add UI lives inline inside the Job Card form and Service Items page
   themselves.
8. Job Cards' advance/payment recording writes to a real `receipts` collection now (`ReceiptDoc`
   in `src/types/firestore.ts`), ahead of Phase 6 (Finance) actually building the Receipts &
   Payments *page*. Phase 6 builds its UI on this same collection, not a second one — matches
   this roadmap's own Phase 6 instruction that a receipt-against-a-job-card update everywhere
   "from one write path," which is only possible if that one path already exists.
9. Default Service Options for a new company now seed from `src/data/default-service-options.json`
   (your own export of the real app's default dataset — 91 models, 20 brands, real reasons/items)
   instead of a small placeholder list, per your explicit request that new signups get the same
   defaults the real app ships with, editable afterward exactly like any other Service Option.
10. Base UI's `<Select>` component (used for Assign To, Handover To, Role pickers, etc.) only
    resolves a display label from an explicit `items` map passed to `Select.Root` — not from the
    text of a mounted `SelectItem`, since those only exist in the DOM while the popup is open.
    Every call site in this app composes `SelectItem` the "plain" way, so left unfixed, every one
    of them would show a raw stored value (a Firestore ID) instead of its label right after a
    fresh selection. Fixed once in the shared `components/ui/select.tsx` wrapper, which now
    auto-derives that `items` map from the same children every call site already renders — no
    call site needed to change. Not a roadmap deviation so much as a library-integration bug this
    roadmap wouldn't have anticipated; recorded here because it affected every ID-bound dropdown
    in the app, not just the one screen it was first noticed on.
11. Phase 6's "Payables" is customer-side, not a traditional accounts-payable-to-suppliers
    screen — this app has no supplier-purchase flow yet (that's Phase 7+), and the reference's
    own card set (Refund Due / Unused Advance / Advance Credit) describes money the shop is
    *holding from customers* that isn't confirmed revenue, not money owed *to* suppliers. Built
    exactly that: Refund Due = a cancelled/returned job whose collected amount hasn't been fully
    refunded; Unused Advance = an active, not-yet-billed job holding a paid amount not yet
    recognized against a final bill; Advance Credit = a party whose combined ledger balance
    across every job is negative (paid more overall than billed). All three computed from
    `jobCards`+`receipts` already in place — no new collection.
12. Party Ledger's "Bill Generated" row uses the job's own `updatedAt` as the bill date — this
    app doesn't record a separate `billGeneratedAt` timestamp anywhere, so it's the closest real
    timestamp available rather than a fabricated one. Same reasoning as every other "closest
    real timestamp, not a fake one" call made in earlier phases.
13. Item Categories' seeded default dataset is the exact 9 rows `preview (58)` itself documents
    (root "Spare Parts" + 8 named children), plus one "Repair Services" root Item Master's own
    seeded Service-type items can file under — not the screenshot's own observed "Total 27,"
    since the other 18 categories were never actually captured in `SCREENS_NOTES.md`. Padding the
    count with invented category names would be exactly the "fake data" BUILD_PLAN's quality bar
    forbids; a company can add its own the same way it adds anything else on this page.
14. Second Hand Device Purchase reuses the *exact same* `serviceOptions` Device Type/Brand/Model
    catalog Job Cards already picks from (`preview (50)`'s combos are visually identical to the
    Job Card form's own) — one shared catalog company-wide, not a second one seeded separately
    for second-hand devices.
15. Parties' `type: 'customer' | 'supplier'` field (Phase 5) is kept as a *derived* field, not
    replaced, once Phase 7 introduces the real `partyTypes: ('customer' | 'supplier')[]` array
    the reference's own checkboxes require (a party can be Customer, Supplier, or **Both** —
    `preview (51)`'s own "Both" filter pill proves this isn't a mutually-exclusive radio). Every
    Phase 5/6 call site that reads `party.type` (job-card customer search, receipt party search,
    Party Ledger's Customers/Suppliers toggle) keeps working unchanged; a "Both" party simply
    reads as `'customer'` there, which is the same simplification the reference's own Party
    Ledger screen makes (it has no "Both" concept of its own either).
16. "Delete" on Parties, Item Master, and every Masters entity backed by a `source: 'system'`
    flag (UOM, Item Categories, Payment Modes, Party Categories) is a soft `status: 'deleted'`/
    `'disabled'` update, never a real Firestore `delete()` — `firestore.rules` backs this up
    server-side (`allow delete: if false` on Parties/Items; the `source != 'system'` guard on
    Masters entities). Same reasoning as every other "an entity might be referenced elsewhere,
    so don't hard-delete it" call already made for Branches/Roles/Receipts in earlier phases.
17. Found and fixed a real, pre-existing bug while reviewing this phase's own screenshots: every
    leaf page's breadcrumb (`components/layout/top-bar.tsx`) rendered a stray "0" after the page
    title whenever it had no extra crumb segment — a classic React footgun
    (`entry.extraCrumbs.length` is the *number* `0` on nearly every page, and `0 && x` in a JSX
    expression evaluates to `0` itself rather than `false`, which React then renders as a literal
    "0" text node instead of nothing). Wrapped the condition in `Boolean(...)`. Present since
    whichever earlier phase built the breadcrumb — not a Phase 7 regression — but only actually
    *noticed* now, via this phase's own side-by-side screenshot review; re-ran the full
    Phase 5/6/gating regression suite afterward to confirm the fix touched nothing else.
18. **Found and fixed a broad, previously-latent Firestore correctness bug while building Phase
    8's own audit trail**, dating back at least to Phase 5: a document field written via
    `serverTimestamp()` reads back as `null` locally until the server acknowledges it, and
    Firestore's query engine *excludes* (not just mis-sorts) a document from a server-side
    `orderBy()`-sorted result set while its sort field is still `null`. This silently made a
    freshly-created row (job card, receipt, session, audit entry, second-hand purchase/sale, IP
    whitelist entry) invisible in its own list until a server round trip completed *and*
    something triggered a refetch — not a Phase 8 regression, a bug every list-with-`orderBy`
    hook in the app had carried since it was first written. Fixed everywhere by removing the
    server-side `orderBy()` and sorting client-side instead, falling back to "now"
    (`new Date().getTime()`, not the bare `Date.now()` this project's React Compiler flags) for
    an unresolved timestamp rather than treating it as smaller/older than everything else. The
    exact same class of bug also showed up in a *date-range filter* (Login Report's own
    "is this today" check), where the honest fallback is the same "treat unresolved as now,"
    never "treat unresolved as epoch."
19. **Found and fixed two real races between Firebase Auth's own global state change and this
    app's async post-auth checks**, both entirely new discoveries this phase, neither a Phase 8
    regression so much as a structural gap Phase 8 was the first thing to actually exercise:
    - *Signup*: `GuestOnlyRoute` redirects reactively the instant a profile doc becomes visible —
      independent of whatever `signUp()`'s own JS does next. The session + audit-log docs used to
      be written as a separate `await` *after* the main bootstrap batch committed, landing 1-3s
      after that redirect already fired. Fixed by folding both into the *same* atomic bootstrap
      batch (using a `getClientIp()` promise kicked off in parallel with the rest of signup).
    - *Login rejection*: `signInWithEmailAndPassword` flips Firebase's global auth state (and
      `GuestOnlyRoute`'s reactive redirect) the instant credentials check out — before `logIn()`'s
      own async profile-status/IP-whitelist checks (a Firestore round trip) can reject the
      attempt. Fixed with a `ProtectedRoute`-level backstop (`AccountDisabledScreen`/
      `IpBlockedScreen`) that checks `profile.status`/IP-whitelist status directly, so real app
      content is never rendered for a disabled/blocked account regardless of which check "wins."
      Also removed `logIn()`'s own `firebaseSignOut()` call on rejection, since that auto-signout
      was dismissing the backstop screen moments later (bouncing back to a bare login form) —
      each backstop screen now has its own manual "Sign Out" button as the stable end state.
    - A *third*, deeper variant of the second race surfaced only once the "blocked"/"unauthorized"
      audit-log write itself was checked, not just the rejection message: a user (or, at machine
      speed, an automated test) clicking that manual "Sign Out" button can fire before `logIn()`'s
      own audit write has reached the server — `firebaseSignOut()` invalidates the token that
      write needs mid-flight, silently turning a security-relevant rejection into one that never
      gets logged. Fixed by having `logOut()` await a "pending audit write" tracked from the
      *moment `logIn()` is called* (`trackPendingAuditWrite`/`flushPendingAuditWrite` in
      `src/lib/audit-log.ts`), not just from whichever point inside `logIn()` the write itself
      starts — closing the race regardless of which stage it lands in.
20. **A real server-side security gap found and fixed**: `firestore.rules`' `belongsToCompany()`
    helper — the gate nearly every rule in the file goes through — never checked account `status`
    at all, meaning a `status: 'disabled'` account had *zero* server-side enforcement (only a
    client-side UI nicety, defeatable by anyone calling the SDK directly). Fixed by baking
    `myUserDoc().data.status == 'active'` into `belongsToCompany()` itself, so a disabled account
    is now correctly denied everything except reading their own profile doc (still allowed via
    the separate `request.auth.uid == uid` clause on `users/{uid}`, needed for the client to even
    detect the disabled status in the first place).
21. **A real, pre-existing product gap found while trying to test the disabled-account flow**:
    User Management had no way to actually disable a user — `useSetUserStatus()` didn't exist.
    Added it (audit-logged, `critical: true`) plus a "Disable User"/"Enable User" button on the
    detail drawer, so the disabled-account rejection path built for this phase is actually
    reachable through the UI, not just exercisable by hand-editing Firestore.
22. **A real, pre-existing gap found while building Supplier Report**: `record-costing-modal.tsx`
    (built in Phase 5) declared a `supplier: string | null` field on every cost item but never
    actually rendered anything to *set* it — every cost item's supplier was permanently `null`,
    silently, since the day that modal was written. Added a real `SearchSelect` per cost item
    (autocompletes against existing supplier-type Parties, quick-adds a new one via
    `useCreateParty()` for anything typed that doesn't exist yet — the same call the Second Hand
    Device seller picker already makes) — without this, Supplier Report would have nothing to
    ever show, on any company, forever.
23. **Field Visit is a real, pre-existing job action from Phase 5 (`preview (13)`'s own action
    list) that only ever wrote a bare timeline event with no duration** — nothing in this app
    could ever produce the non-zero "Total Time Spent" `preview (32)` itself calls for. Extended
    it (not a new action) to open a small dialog capturing an optional duration in minutes,
    stored on the timeline event (`JobTimelineEventDoc.durationMinutes`) and mirrored onto a new
    flat `fieldVisits` collection (`FieldVisitDoc`) written in the same atomic batch — a
    denormalized sibling purely so Field Visit Report reads one flat collection instead of every
    job card's own `timeline` subcollection, the same "denormalize for a report page's own
    convenience" call Phase 8 already made for `sessions`/`auditLog`.
24. **Every profit-based report (Job-wise Profit, Technician Report, Supplier Report, Period
    Summary) reads `jobCosting` docs joined against `jobCards`, not `jobCards` alone** —
    `useCostedJobs()` (`src/hooks/use-reports.ts`). A job only has a real profit number once
    Closed *and* actually costed (`JobCostingDoc.billAmount`/`totalCost`/`profit`, snapshotted at
    costing time); a Closed-but-not-yet-costed job has no cost to report against and is correctly
    absent from these four reports' own counts, matching the reference's own screenshots (which
    show "Jobs: 1" reflecting only the one costed job in that test data, not every job ever
    created). Service Reports and Field Visit Report are the two exceptions that read their own
    source (`jobCards`, `fieldVisits`) directly, since neither depends on costing having happened.
25. **"Shop Expenses" on Period Summary is honestly always ₹0** — `nav.ts` marks Finance's own
    "Expenses" leaf `locked: true` (never built, out of this roadmap's scope), so there is nowhere
    in the app a shop expense could ever be recorded. Matches the reference's own screenshot,
    which shows the identical ₹0 with the identical "No shop expenses recorded in this period"
    copy — not a shortcut invented for this build, the reference's own test data has the same gap.
26. **"Export Excel" downloads a `.csv` file, reusing Phase 7's existing `downloadCsv()`** rather
    than adding a binary `.xlsx`-writing library for six more buttons — a CSV opens natively and
    correctly in Excel with zero compatibility loss, the same "simpler real mechanism than the
    label implies" call already made for Phase 5's reorder-by-arrows-not-drag-drop.
27. **A new `ExpandableTable` shared component** (`components/shared/expandable-table.tsx`) —
    `DataTable`'s own sort/pagination contract has no inline row-expansion support, and four of
    six Phase 9 reports need chevron-expandable rows with a rich sub-panel (`preview (33)`/`(34)`/
    `(35)`/`(38)`), a pattern no earlier phase's pages used. Kept separate from `DataTable` itself
    rather than bolting expand support onto a component a dozen+ existing pages already depend on.
28. **Company Settings manages *the* one company, not a real multi-company list** — this app's
    data model ties `UserDoc.companyId` to exactly one company with no company-switcher anywhere,
    so a genuine "Create Company" (a second company doc nothing could ever point at) would create
    a permanently unreachable orphan. `useCompany()` does a single `get()` on the known
    `companyId`, not a collection query — the reference's own screenshot shows the identical
    shape (a "list" with exactly one row) for the same underlying reason, so the UI still looks
    and behaves like the reference's list+drawer pattern; only "Create Company" itself is
    intentionally not built. `firestore.rules`' own `companies/{companyId}` `create` rule is
    unchanged (`isBootstrapping()`-only) — nothing in this phase needed it to allow more.
29. **Financial Year *documents* (Settings → Financial Years) are administrative/informational,
    deliberately independent of the FY *string* Job/Receipt/Party sequence numbers embed** —
    `getCurrentFinancialYear()` (used by `getNextSequence()` since Phase 2) still derives its
    answer purely from the real calendar date, never from which `FinancialYearDoc` a company has
    marked "Current" here. Making the two the same thing would have meant either a risky refactor
    of an already-verified, heavily-used core system (sequence generation), or letting an Owner
    accidentally break job-numbering by activating the wrong FY. "Only one FY active/current at a
    time" is still a real, atomically-enforced invariant (`useActivateFinancialYear()`) — it just
    governs this page's own display and a locked/unlocked status, not numbering. Documented in
    `financial-year.ts`'s own doc comment so this isn't mistaken for an oversight later.
30. **`FinancialYearDoc.isLocked` is a real, persisted toggle with no enforcement point yet** —
    this app has no feature anywhere that associates a transaction (job card, receipt) with a
    specific financial year document, so there's nothing for "locked" to actually block. Kept
    genuine (a real field, really saved, really shown) rather than either faking an enforcement
    check against nothing, or not building the toggle BUILD_PLAN's own reference screenshot shows
    — same "advisory, not fake" principle as IP Whitelist enforcement (deviation #4).
31. **Print Formats' "canvas" is an ordered, reorder-by-arrows block list, not pixel-positioned
    drag-and-drop** — BUILD_PLAN's own spec for this phase explicitly allows exactly this
    ("doesn't need pixel-perfect drag-drop, just functional and bound to live data"), and it's the
    same "simpler real mechanism over the reference's own fancier one" call already made for
    Service Options' own reorder-by-arrows in Phase 5. The live preview pane renders through the
    *exact same* `renderPrintHtml()` every real "Print X" button in the app calls — not a
    decorative mockup — so what a template author sees while editing is genuinely what prints.
32. **Every pre-existing "Print X" stub this phase replaces (Job Card's Print Label/Job Card/Bill,
    Second Hand Device's Print Receipt/Label) now renders the company's own *default* template
    for that document type against the real record** — not a hardcoded receipt layout. A company
    can have several templates per document type (`preview (2)`'s own "80mm"/"58mm" pairs); which
    one a button uses is whichever the company has marked default, changeable from Print Formats
    without touching any of these call sites.
33. **Backup & Restore's own JSON format is this project's, not the reference's `.erpbk`/
    `.json.gz` + Google Drive** — building a real Google Drive OAuth connection needs a server
    this client-SDK-only project doesn't have (same constraint as deviation #4/#5), so backups
    write directly to this company's own Firebase Storage path instead, exactly matching
    BUILD_PLAN's own explicit instruction for this phase. "Restore from File" only ever accepts
    this project's own exported shape (validated via a `_meta` block, not guessed from raw
    structure) — it was never going to be compatible with the reference app's own binary format
    regardless of how this were built.
34. **"Overwrite Live Data" restores by document-level `set()` (matching ids), never a destructive
    delete-everything-not-in-the-file sync** — restoring a document that exists in the uploaded
    backup correctly overwrites the live one; a document that exists live but wasn't in the
    backup is left untouched. A full destructive replace is a much larger, riskier promise than
    "restore my data" usually means, and isn't what BUILD_PLAN's own phrasing ("restore... or
    overwrite live data") asks for. Gated behind a modal requiring the literal word "OVERWRITE"
    typed in, on top of the menu-level permission gate every Settings page already has.

---

## Open item requiring you before Phase 2 can be verified end-to-end

- Real `VITE_FIREBASE_API_KEY` (the value you sent is literally the placeholder text
  `"GOOGLE_API_KEY"`). Phase 0 will scaffold fine without it; Phase 2 (real auth/Firestore
  calls) cannot be verified until it's supplied.
- Please also confirm the Firestore database really is named `demo` and not `(default)` —
  check the database-selector dropdown in Firebase Console → Firestore — since getting this
  wrong is the single most common invisible-failure mode in this kind of setup.
