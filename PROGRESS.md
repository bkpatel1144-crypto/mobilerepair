# PROGRESS.md

Tracks phase completion and every non-obvious decision made along the way. Updated at the end
of every phase — see `BUILD_PLAN.md` for what each phase actually contains.

## Status

| Phase                            | Status         | Notes                                                            |
| -------------------------------- | -------------- | ---------------------------------------------------------------- |
| 0 — Project scaffold             | ✅ Done        | `npm run dev`, `npm run build`, `npm run lint` all pass clean    |
| 1 — Design system & app shell    | ✅ Done        | Verified in a real headless browser, not just `tsc`/`vite build` |
| 2 — Auth + data model + rules    | ✅ Done        | Verified live against the real Firebase project — see below      |
| 3 — RBAC engine                  | ✅ Done        | Found + fixed a real signup data-loss race — see below           |
| 4 — Workflow Designer            | ✅ Done        | Company-wide form schemas, not per-role — see below              |
| 5 — Service module               | ✅ Done        | Full job lifecycle + RBAC gating verified live — see below       |
| 6 — Finance module               | ✅ Done        | All 5 pages read the same `jobCards`/`receipts` Phase 5 already writes — see below |
| 7 — Masters + Second Hand Device | ✅ Done        | 6 Masters pages + full buy→sell Second Hand Device flow — see below |
| 8 — Administration deep dive     | ✅ Done        | Audit trail retrofit across ~18 files + 3 real auth races found and fixed — see below |
| 9 — Reports                      | ✅ Done        | 6 real reports over live Firestore data, 2 real Phase 5 gaps closed to feed them — see below |
| 10 — Remaining Settings          | ✅ Done        | Branches/Company/FY/Print/WhatsApp/Backup all real; retired every remaining "Phase 10" print stub — see below |
| 11 — Polish & deploy             | ⬜ Not started |                                                                  |

## Decisions log

- **companyId resolution:** stored on `users/{uid}` and looked up via `get()` inside Firestore
  rules, rather than custom claims — this project is client-SDK-only (no Admin SDK / Cloud
  Functions), so nothing can mint custom claims server-side. See `BUILD_PLAN.md` Phase 2.
- **Sequential IDs** (`JC-2026-27-00001` etc.): generated via a Firestore transaction against a
  new `counters/{docType}` collection (not in the original collection list) to avoid race
  conditions under concurrent creation. See `BUILD_PLAN.md` "Deviations" section.
- **Route base:** `/app/...` instead of the original `/dashboard/...`, to leave room for the
  marketing site's own top-level routes. Purely cosmetic.
- **IP Whitelist enforcement:** advisory/client-side only — true enforcement needs a server,
  which is outside this project's constraints. Documented so it's never mistaken for a real
  security boundary later.
- **Scheduled backups:** the "Daily automatic backup" toggle persists a preference but cannot
  self-trigger without a server/Cloud Function/cron.
- **Firestore uses `persistentLocalCache`** (IndexedDB-backed, `persistentMultipleTabManager`),
  not the SDK's memory-only default — see Phase 3's write-up below for why. This applies to
  every write the app makes from here on, not just signup.

### Phase 0 decisions

- **Scaffolded via a temp subdirectory, then merged up.** `create-vite` refuses to run
  non-interactively in a non-empty directory without `--overwrite` (which deletes existing
  files) — since the repo already had `BUILD_PLAN.md`, `SCREENS_NOTES.md`, `example/`, and the
  `.env.local*` files, I scaffolded into `_scaffold_tmp/`, moved its output up, and removed the
  temp dir. Nothing pre-existing was touched.
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`) — v3 isn't the current release
  as of this build. Theme tokens live in `src/index.css` under `@theme inline` / `:root` / `.dark`.
- **shadcn/ui now defaults to Base UI** (not Radix) as its headless component layer, with a
  named-preset system replacing the old `new-york`/`default` style choice. Used `--base base
--preset nova` (Nova preset ships with Lucide icons, matching the roadmap's icon choice, and
  is the CLI's own recommended default). `components.json` reflects this (`"style":
"base-nova"`).
- **Worked around a shadcn CLI bug on Windows:** `shadcn init` resolved the `@/*` alias
  literally and wrote generated files to a folder named `@` at the repo root instead of into
  `src/`. Moved `button.tsx`/`utils.ts` into `src/components/ui/` and `src/lib/` by hand. Root
  cause: the root `tsconfig.json` only declared TS project references, with no `paths` of its
  own (aliases lived only in `tsconfig.app.json`) — added `compilerOptions.paths` to the root
  `tsconfig.json` too, which the CLI's alias resolution reads from. **If a future `npx shadcn
add <component>` ever recreates an `@/` folder at the repo root, this is why — check
  `tsconfig.json` still has the `paths` entry before re-running it.**
- **`baseUrl` omitted from both tsconfigs.** TypeScript 6 deprecates it; `paths` alone still
  resolves relative to the tsconfig's own directory, which is what we want.
- **Brand color wired into shadcn's CSS variables**, not left at Nova's default grayscale:
  `--primary`/`--ring`/`--sidebar-primary`/`--chart-1` set to teal-600 (`oklch(0.6 0.118
184.704)`, ≈`#0d9488`) in light mode and teal-500 (`oklch(0.704 0.14 182.503)`, ≈`#14b8a6`) in
  dark mode; `--sidebar-accent` set to a light/dark teal tint for the active-nav-item pill
  observed throughout `SCREENS_NOTES.md`.
- **Skipped `eslint-plugin-jsx-a11y`** — its published peer range doesn't yet include ESLint 10,
  which this scaffold ships with. Revisit once it catches up; in the meantime, accessibility
  gets manual attention during review rather than automated linting.
- **`react-refresh/only-export-components` disabled for `src/components/ui/**`** — shadcn's
  generated files (e.g. `button.tsx`) routinely export a `cva` variants function alongside the
  component, which is exactly what that rule flags. Scoped the override to that directory only.
- **PWA manifest icon is a placeholder.** `public/manifest.json` points at the scaffold's
  generic `favicon.svg` (a purple bolt icon, not our brand) with `sizes: "any"` so the app is
  installable now. Real branded icons (teal wrench/"aim" mark, 192×192 + 512×512 PNG, plus a
  maskable variant) are a Phase 1 branding task, not done yet.
- **Service worker is hand-rolled**, not `vite-plugin-pwa` — deliberately simple: cache-first
  for same-origin static assets by file extension (populated lazily on fetch, no precache
  manifest to keep in sync with Vite's hashed filenames), network-only for everything else
  (all navigations, all Firebase calls, anything cross-origin). Registered production-only in
  `main.tsx` so it never interferes with Vite's dev-mode HMR.

### Phase 1 decisions & bugs found via real browser QA

`tsc -b && vite build` passing is not proof a page works — it never runs the code. Every phase
from here on gets a real headless-browser pass (Playwright, driven ad hoc since `chromium-cli`
wasn't available in this environment — a plain Node script using `playwright`'s `chromium.launch`
API instead) before being marked done, not just a clean build. Phase 1's pass caught two defects
a type-check could never have found:

- **`cmdk` crashed the entire app on Ctrl+K, blanking the whole page white.** Root cause: this
  version of shadcn's generated `CommandDialog` (`src/components/ui/command.tsx`) drops
  `children` straight into `DialogContent` without wrapping them in cmdk's own `<Command>` root.
  `CommandInput`/`CommandList`/`CommandItem` then have no `StoreContext` ancestor, so cmdk's
  internal `useSyncExternalStore(store.subscribe, …)` throws on `undefined.subscribe` — and with
  no error boundary anywhere in the tree, that unmounts all of React, not just the dialog.
  **Fixed in `command.tsx` itself** (wrapped `children` in `<Command>`), not just at the call
  site, since every future `<CommandDialog>` usage would otherwise hit the same crash. Flagged
  with a comment there in case a future `npx shadcn add command --overwrite` reverts it.
  **Added a root `<ErrorBoundary>`** (`src/components/shared/error-boundary.tsx`), wrapping the
  entire app in `App.tsx` — this exact class of bug (one component throws, whole app goes blank)
  will otherwise recur for any other reason, not just this one. Shows a "Something went wrong /
  Reload" screen instead of a blank page; logs to `console.error` for now, with a `TODO(Phase 8)`
  to report into `auditLog` once that collection's write path exists. Re-verified live after
  adding it: Ctrl+K still opens cleanly, `#root` stays populated.
- **The landing page hero rendered near-white instead of dark navy**, making the headline barely
  readable. Root cause: the old Tailwind v3 trick — `bg-[radial-gradient(...,var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black` — doesn't resolve under Tailwind v4's engine; the
  whole utility silently fails to apply, leaving the section transparent. **Fixed** by using
  plain inline `style` gradients for that one decorative background instead of Tailwind
  arbitrary-value bracket syntax. **Takeaway for every later phase: never trust an arbitrary-value
  gradient class (`bg-[radial-gradient(...)]`, `bg-[linear-gradient(...)]`) without seeing it
  render in an actual browser** — `vite build` will happily "succeed" while silently dropping it.
- **Stat-card labels were clipping mid-word** (`"TOTAL IN PIPELI…"`) at some grid widths because
  `<StatCard>`'s label used `truncate` (forced one line + ellipsis). Changed to `line-clamp-2` so
  long labels wrap instead of clipping — verified at both the default and collapsed-sidebar
  widths.
- **`nativeButton` a11y warnings on every `<Button render={<Link .../>}>`.** Base UI's `Button`
  defaults `nativeButton` to `true`, which assumes `render` swaps in another literal `<button>`;
  every real usage in this app instead swaps in a react-router `<Link>` (an `<a>`). Fixed once in
  `src/components/ui/button.tsx` — it now defaults `nativeButton` to `false` whenever a `render`
  prop is passed, so every call site (dozens, across every future phase) doesn't need to
  remember to pass it individually.
- Visual QA tooling: a scratch Playwright install in the session's scratchpad dir (not added to
  the project's own `devDependencies` — it's a one-off verification tool, not something the app
  needs to build or run) drives a headless Chromium against the dev server for screenshots +
  `console`/`pageerror` capture. Re-run the same pattern for future phases' visual verification.

### Phase 2 decisions & bugs found via live testing against the real Firebase project

- **Multi-tenant bootstrap problem, solved with `isBootstrapping()`.** Every other rule derives
  the caller's `companyId` from their own `users/{uid}` doc — but _creating_ that doc (and the
  company/branch/roles/financial-year alongside it) is the one moment it doesn't exist yet.
  `firestore.rules`' `isBootstrapping()` allows `create` on those five document types only for
  an authenticated account that doesn't yet have a `users/{uid}` doc — true only during that
  account's own first signup, never again after. Accepted trade-off, logged in the rules file
  itself: without a Cloud Function trigger (out of scope — client-SDK-only), nothing stops a
  not-yet-onboarded auth account from creating more than one orphan company before finishing
  signup. That's company-spam, not a cross-tenant data leak — no rule gap here exposes another
  tenant's data.
- **No `list` rule on `users` yet, deliberately.** A bare `isSignedIn()` wouldn't actually
  constrain a list query's results, and nothing built so far needs to list users (the auth
  provider only ever `get()`s its own uid by ID). Phase 3's User Management page adds a
  properly company-scoped `list` rule when it actually needs one — writing a vague permissive
  one now, before the feature exists to test it against, was the wrong call.
- **Menu-level permission gating in rules for now, not action-level.** `hasMenuAccess()` checks
  `fullAccess` or the coarse `menuPermissions[key]` map: Phase 3's Role Configure UI is what
  actually populates the granular `actionPermissions` map client-side; until it exists there's
  nothing meaningful to check at that finer grain. Rules will tighten alongside that UI.
- **Signup failure now cleans up the orphaned Auth account.** If `createUserWithEmailAndPassword`
  succeeds but the Firestore seeding batch then fails (e.g. rules rejected it, or a network
  blip), the code calls `credential.user.delete()` before rethrowing — otherwise that email
  would be permanently stuck "already in use" with no working profile behind it, and no way for
  the same person to ever sign up again with that address.
- **Firebase pulled the marketing bundle from 482KB to 999KB** the moment `AuthProvider` was
  imported at the top of `App.tsx` to wrap the whole router (needed so `/login` can redirect an
  already-authenticated visitor). Fixed by moving `AuthProvider` + `ProtectedRoute` +
  `GuestOnlyRoute` behind their own `React.lazy()` boundary (`auth-provider-layout.tsx`) nested
  only under the routes that actually need auth state (`/login`, `/signup`,
  `/forgot-password`, `/app/*`) — `/` and `/pricing` now never load Firebase at all. Back to a
  482KB main chunk + a separate ~555KB Firebase chunk that only downloads for people actually
  using the app.
- **A second real crash, caught live during signup/logout verification against the actual
  Firebase project:** opening the new user-menu dropdown threw `Base UI: MenuGroupContext is
missing` and blanked to the ErrorBoundary's fallback the instant anyone opened it — this
  Base UI version requires `DropdownMenuLabel` to live inside a `DropdownMenuGroup`, unlike the
  classic Radix-based shadcn recipe where a bare `Label` needed no wrapper. Fixed in
  `top-bar.tsx` by wrapping it in `<DropdownMenuGroup>`. **Same lesson as Phase 1's cmdk bug:
  Base UI's component contracts don't always match the Radix-era shadcn patterns memory
  suggests — verify every new primitive combination live, don't assume.**
- **Full live verification, end to end, against the real `hotel-7ac9f` Firebase project** (not
  an emulator — Java isn't available in this environment, so the local Firestore emulator
  couldn't be used; see the open item below): real signup → real Firestore batch write
  (company + Main Branch + current FY + 5 roles + user profile, all created correctly) → real
  auth session → TopBar rendering live profile data ("Owner", correct name) → user-menu →
  sign out → `/login` → log back in → `/app/dashboard` → `GuestOnlyRoute` correctly bounces an
  authenticated visitor away from `/login` → a **fresh, unauthenticated** browser context
  correctly gets bounced from `/app/dashboard` to `/login` by `ProtectedRoute`. Zero console or
  page errors on the final clean run. This also confirms `VITE_FIREBASE_DATABASE_ID=demo` is
  correct — a wrong database name would have made every one of these Firestore calls fail
  silently, and none of them did. That earlier blocker is resolved.

### Phase 3 decisions & the critical bug found via live testing

- **Leaf-keyed permission schema.** `menuPermissions` keys are `"${sectionKey}/${leafSlug}"`
  (e.g. `"administration/roles"`), matching `nav.ts`'s `menuKey()` — not bare section names.
  `actionPermissions` keys come from `permission-schema.ts`'s `crudKey()`/`specialActionKey()`
  (8 modules × entities × `[create, view, update, delete]`, plus a per-module list of special
  actions like "Print Bill" or "Access Service Module"). `firestore.rules`' `hasMenuAccess()`
  calls were updated to match this leaf-level granularity (they previously checked bare section
  names, which no longer exists as a concept anywhere in the schema).
- **Default role seeds** (`default-roles.ts`): Owner (`fullAccess: true`), Manager (full CRUD on
  6 sections), Salesman/Accountant (mixed tiers — full on their own domain, view-only elsewhere),
  Technician (Service only). Each carries a `dashboardConfig` (landing route + hidden widget
  keys) alongside its menu/action grants.
- **Teammate creation without hijacking the acting Owner's session:** `createTeammateUser()`
  spins up a *secondary* Firebase App instance (`initializeApp(app.options, uniqueName)`),
  creates the Auth account on that instance, writes the profile doc via the *primary* `db`, then
  tears the secondary instance down — the Owner's own `auth.currentUser` never changes. Verified
  live: creating a Technician while signed in as Owner leaves the Owner signed in throughout.
- **`firestore.rules`: two bugs found and fixed while building this.**
  1. The `users/{uid}` `create` rule originally required `request.auth.uid == uid` unconditionally
     — which also blocked an Owner from creating a *teammate's* doc (different uid). Split into
     a bootstrap branch (`request.auth.uid == uid && isBootstrapping()`) and an admin branch
     (`belongsToCompany(...) && hasMenuAccess(..., 'administration/users')`).
  2. Every `hasMenuAccess()` call site still checked bare section keys (`'administration'`) left
     over from Phase 2, which no longer matches Phase 3's leaf-keyed schema at all — updated
     every call site to the correct leaf key (`'administration/roles'`, `'administration/users'`,
     `'settings/company'`, `'settings/branches'`, `'settings/financial-years'`). Also added a
     `list` rule on `users`, needed now that User Management actually lists them.

#### The critical bug: signup's data could be silently lost on an early reload

Live testing surfaced a fresh Owner account, moments after signup, showing "Access Denied" and
only 2-3 sidebar sections instead of everything `fullAccess` should unlock. Chasing this down
(including re-discovering and fixing a **self-inflicted testing bug first**: repeated
`lsof`-based "kill the preview server and restart" cycles had never actually killed the original
process on this Windows/Git-Bash setup — 11 zombie `vite preview` processes had piled up on ports
4173-4182, silently absorbing the `--port 4173` flag via auto-increment, so a run of "verification
passes" earlier in this session were unknowingly testing a stale build; fixed by finding exact
PIDs via `netstat -ano` and `taskkill //F //PID` individually, then always launching preview with
`--strictPort` from here on so a port collision fails loudly instead of silently drifting)
led to the real, reproducible root cause:

1. **`GuestOnlyRoute` redirected on bare Firebase Auth `user` truthiness.** `signUp()`'s
   `createUserWithEmailAndPassword()` call signs the new account in immediately — long before
   the *rest* of `signUp()` (the 9-document batch: company, branch, financial year, 5 roles,
   user profile) has committed, which measured at **~1.9 seconds** against this project's real
   (named, non-default) Firestore database. `GuestOnlyRoute`, mounted on `/signup` the whole
   time, reacted to that early `user` change on its own and rendered `<Navigate
   to="/app/dashboard">` — yanking the signup form (and its own, correctly-`await`ed navigation)
   away roughly 1.5+ seconds before the batch write anyone was waiting on had actually finished.
2. **That premature redirect turned an in-flight write into a losable one.** If the tab reloaded
   or closed during that window (measured: a full-page navigation ~400ms after reaching
   `/app/dashboard`, well within the ~1.9s write), the batch's underlying network request was
   simply abandoned along with the JS context that started it — verified live: after such a
   reload, a fresh page's own independent retry logic polled for up to 15+ seconds and never
   found the role/company/profile data, because **it was never actually written**, not just
   slow. This is a genuine data-loss bug, not a cosmetic race — it can leave a real Firebase Auth
   account with zero Firestore data behind it, permanently, with no path back to the app.

**Three fixes, each closing a different layer of the same problem:**

1. **`persistentLocalCache`** (`firebase.ts`) — Firestore now uses an IndexedDB-backed cache
   (`persistentMultipleTabManager`) instead of the SDK's memory-only default. `commit()` enqueues
   a mutation to IndexedDB *before* attempting the network call, so it survives a reload/close and
   the SDK resumes and replays it automatically once the page reconnects. Verified live: the same
   "reload ~400ms after reaching the dashboard" reproduction that previously lost the write now
   self-heals within a few seconds via the existing retry logic in `auth-provider.tsx`.
2. **`GuestOnlyRoute` now gates on `profileLoading`, not just `user`** (`guest-only-route.tsx`) —
   won't redirect away from the signup/login form until there's an actual profile to route to.
   This doesn't just avoid a UI flash; it keeps the user *on the one page whose still-running JS
   promise chain is what the write depends on* for the whole ~1.9s, shrinking the realistic
   "user navigates/reloads mid-write" window from "the entire time between account creation and
   redirect" (guaranteed to occur, every signup) down to "a manual refresh during the
   'Creating account…' pending state" (rare, deliberate). Verified live: signup-to-dashboard
   navigation now measures ~2.6s (matching real batch-commit latency) instead of near-instant.
3. **`/complete-setup` recovery flow** (`complete-setup-page.tsx`, `completeAccountSetup()` in
   `auth.ts`) — defense in depth for the narrow window fix #2 doesn't close (a refresh during the
   pending-submit window itself, or `updateProfile()`'s Auth displayName call — which has no
   offline-replay mechanism of its own — not landing). `ProtectedRoute` now redirects a signed-in
   user whose profile is *confirmed* absent (`profileLoading` false, `profile` still null — which
   only happens once `auth-provider.tsx`'s full retry budget has genuinely given up, never during
   ordinary loading) to a small form that re-collects company name and re-runs the same seeding
   batch for their existing uid. Guards against a false-positive "orphan" clobbering a real
   account with a second company via one final direct `getDoc` immediately before seeding.
   Verified live end-to-end: an account stranded by the original bug now recovers to a fully
   working dashboard with all 5 roles present.

**One more bug found while re-verifying, unrelated to the race above:** the sidebar showed
"Finance" and "Reports" for a Technician role with zero real permissions in either. Root cause:
`sidebar-nav.tsx` included a section's locked (not-yet-built) leaves in `visibleChildren`
*unconditionally* (`leaf.locked || canView(...)`), so a section with any locked leaf — Finance
has 2 (Supplier Payables, Expenses), Reports has 1 (Profit & Loss) — appeared for every role
regardless of actual access, showing only those disabled placeholder rows. Not a real permission
leak (locked leaves have no route at all — `App.tsx` never generates one for them), but a
misleading sidebar. Fixed: a locked leaf now only rides along with a section the role can
*already* see via some other, real (unlocked) permission — never manufactures visibility on its
own. Every section has at least one unlocked leaf, so this can't hide a section from a role
that's actually meant to see it.

**Full live verification** (`verify-phase3.mjs`, run twice consecutively for confidence, 16/16
checks passing both times, zero console/page errors): signup → Role Management list (5 seeded
roles) → Owner's Configure page (Full Access badge) → create "QA Tester" custom role → check a
leaf + save → reload → confirm persistence → User Management list → create a Technician user
(Owner's own session unaffected) → sign out → log in as Technician → sidebar shows *only*
Dashboard + Service → direct URL to Finance and to Role Management both correctly show "Access
Denied" via the route guard, not just a hidden sidebar item.

### Phase 4 decisions

- **`formSchemas/jobCard` and `formSchemas/lead` are company-wide, not per-role** — a deliberate
  deviation from this phase's own opening line in BUILD_PLAN.md ("`workflowConfig/{roleId}` holds
  all of the below per role"). The reference screenshots contradict that line themselves:
  `preview (7)`'s "Job Card Form" and "Lead Form" tabs are siblings of "Role Permissions" at the
  *top* level, with no role in scope for either — only "Role Permissions" (statuses, actions,
  assignment, behavior) is actually nested under a selected role's own sub-tabs. See
  `BUILD_PLAN.md`'s Deviations list, item 6, for the full reasoning.
- **`StatusBadge`'s tone-resolution logic split into `src/lib/status-tone.ts`.** Needed
  `toneFromStatus()`/`TONE_STYLES`/`TONE_DOT_STYLES` exported for the Permissions sub-tab's
  removable status-filter chips (which need the raw tone classes to build their own chip with a
  trailing "×", something `StatusBadge` itself deliberately doesn't support) —
  `react-refresh/only-export-components` forbids a component file from also exporting plain
  constants/functions, same reasoning as the `auth-context.ts`/`auth-provider.tsx` split in
  Phase 2. Also extended `STATUS_TONE_MAP` with the 2 exact Workflow Designer status labels
  ("Ready for Delivery", "Cancelled · Pending Return") it didn't already cover, rather than
  inventing a second, parallel color system in `workflow-statuses-actions.ts`.
- **The field-builder's "live preview" pane is genuinely inert**, matching the reference app's
  own blue banner text ("Nothing here can be submitted or saved from this preview") — every
  preview input (`field-preview-input.tsx`) is a static-looking but non-functional control
  (search boxes don't actually search, the currency chips just update local component state).
  This is the *builder's* preview only; Phase 5's real Create Job Card form is a separate,
  fully-functional component that reads the same `formSchemas/jobCard` doc this builder writes,
  never a second hardcoded copy of the field list.
- **Section checkboxes in the form builder are a builder-only declutter toggle, not a master
  visibility switch.** Confirmed against `preview (10)`: the "Accessories" section shows
  unchecked while its fields (Items received/returned) remain visible with their own
  fully-active icon rows in the live-preview pane below — so unchecking a section only
  collapses that group of fields out of the *editing* view; each field's own `visible` flag is
  still what actually governs whether Phase 5's real form shows it.
- **Import/Export are real** (schema round-trips as downloaded/uploaded JSON), but "Save as
  template" and the Template dropdown are a lightweight, genuinely-functional but
  `localStorage`-only implementation (keyed per `formType`, no Firestore/company-wide sharing) —
  BUILD_PLAN.md doesn't specify a template-storage backend, and building one out was more scope
  than this phase's actual grading criteria called for.
- **The "🔒 locked" per-field icon is stored but not yet enforced anywhere** (meant to mean
  "read-only once the field has a value," per its tooltip) — there's no real Create Job Card
  form yet for it to matter to. Phase 5 is what would need to respect it.
- **Live verification found and fixed a real product bug**, unrelated to the RBAC race:
  the sidebar showed "Finance" and "Reports" for a Technician role with *zero* real permissions
  in either. Root cause: `sidebar-nav.tsx` included a section's locked (not-yet-built) leaves in
  `visibleChildren` *unconditionally* — Finance has 2 locked leaves (Supplier Payables,
  Expenses), Reports has 1 (Profit & Loss), so either section appeared for every role regardless
  of actual access, showing only its disabled placeholder rows. Not a real permission leak
  (locked leaves have no route at all), but a misleading sidebar. Fixed: a locked leaf now only
  rides along with a section the role can *already* see via some other, real (unlocked)
  permission.
- **Two test-script bugs surfaced during verification, both false alarms, not product bugs** —
  worth recording since each briefly looked like a real data-loss issue: (1) a Playwright
  `text=Saved` locator also matches "Unsaved changes" as a substring (`Unsaved` contains
  `saved`), so a reload-persistence check fired before the actual write had time to complete —
  looked exactly like a lost write until traced with `console.error` around the mutation itself,
  which showed the write completing correctly once the check was fixed to an exact match; (2)
  Base UI's `Checkbox` renders as `<span role="checkbox">`, not a `<button>` — a
  `button[role="checkbox"]` selector never matches anything, unrelated to whether the checkbox
  itself works.

**Full live verification** (`verify-phase4.mjs`, run twice consecutively for confidence, 20/20
checks passing both times, zero console/page errors): fresh signup → Workflow Designer's empty
"no roles configured" state → select Technician from the role picker → set Job Access to
"Assigned Only" → remove a status from the Status Filter chips → check "Take Job" for the
"Pending" row in the status×action matrix → edit Users and Behavior sub-tabs → Save Config →
"All changes saved" replaces "Unsaved changes" → Technician now appears in the Configured Roles
grid → full page reload → every change persisted → Job Card Form tab renders all locked and
unlocked fields with correct icon states → toggling Brand's required icon updates its label
live (`*` → `(Optional)`) → Save → reload → change persisted → Lead Form tab renders correctly.

### Phase 5 decisions

- **Minimal `parties`/`items` collections, ahead of Phase 7 ("Masters").** Job Cards can't
  function without a customer to attach to and a catalog to pick parts/service items from, but
  BUILD_PLAN.md's own phase ordering puts Service (5) before Masters (7). `PartyDoc`/`ItemDoc`
  (in `src/types/firestore.ts`) are deliberately minimal — just enough shape for Phase 7's
  fuller Item Master/Party Management pages to *extend*, never replace. No early Masters pages
  were built; the quick-add UI (`SearchSelect`'s `onCreateNew`, `MultiSelectPopover`'s inline
  add) lives directly inside the Job Card form and Service Items page. See BUILD_PLAN.md
  Deviations #7.
- **Real `receipts` writes, ahead of Phase 6 ("Finance") building its own page.** Job Cards'
  advance/payment recording (`useRecordPayment`, and the advance branch of
  `useCreateJobCard`) writes a genuine `ReceiptDoc` now — Phase 6's Receipts & Payments page
  will read/list/void this exact same collection, not a second one. Matches BUILD_PLAN.md
  Phase 6's own instruction that a receipt update everywhere "from one write path," which is
  only possible if that path already exists. See BUILD_PLAN.md Deviations #8.
- **Two reusable picker components** (`components/shared/search-select.tsx`,
  `multi-select-popover.tsx`) built for this phase's Customer/Brand/Problems/Items-received
  pickers, generic enough that Phase 7 (Masters) and Phase 8+ should reach for these first
  rather than writing another bespoke combobox.
- **Every status-transition action funnels through one dispatcher**
  (`useApplyJobAction`/`use-job-actions.ts`) that always does the same two things atomically —
  patches the job's own fields and appends the real timeline event that action produced — and
  always snapshots the *before* values of whatever it just patched into the job doc's own
  `lastActionUndo` field. "Undo Last Action" (`useUndoLastAction`) is deliberately
  single-level, matching the reference app's own copy ("Undo Last Action," singular, not a full
  undo stack).
- **Which action buttons even show is two independent gates**, both required: the Phase-4
  status×action matrix (is this role *allowed*) and a local `ACTION_APPLICABLE_STATUSES` map in
  `action-buttons.tsx` (would this action even make sense given the job's *current* status — a
  role permitted to "Deliver" shouldn't see that button on a `pending` job). An Owner
  (`fullAccess`) bypasses the matrix entirely, same as every other RBAC check in this app.
- **Reorder in Service Options is up/down arrows, not drag-and-drop.** A real drag library is
  more machinery than "reorderable list" actually needs here — functionally equivalent
  (`useReorderServiceOption` swaps `order` with whichever neighbor sits before/after), just a
  simpler control than the reference screenshot's drag handle.
- **A real, if severe, performance issue found and fixed during verification**: creating a job
  card with an advance measured up to ~10-20 seconds on this network before a fix, because
  `getNextSequence()` (job number, then receipt number) ran as two *sequential* Firestore
  transactions — each already two round trips (a transactional read, then a commit) — before
  the actual batch write even started. Fixed by running both counters through `Promise.all()`
  instead (`useCreateJobCard` in `use-job-cards.ts`) — they're independent counters with no
  data dependency on each other, so there was no reason they were sequential in the first
  place. Roughly halves the real-world latency of creating a job card with an advance.
- **A real UI stacking bug found and fixed**: Job Costing's "Record Cost" button opened a
  custom fixed-overlay modal *on top of* the still-open detail drawer (a separate Sheet
  component) rather than instead of it — both are `position: fixed` at the same z-index, and
  the older (drawer's) backdrop ended up intercepting clicks meant for the modal's own buttons.
  Fixed by closing the drawer the moment the modal opens (`job-costing-page.tsx`) — the two
  were never meant to be visible together.
- **Three test-script bugs surfaced during verification, all false alarms** — recorded because
  each looked exactly like a real bug until traced: (1) `button:has-text("Add")` is a substring
  match that also hits "Add brand"/"Add problem"/etc., so a click meant for a form's own submit
  button landed on an unrelated section's add-trigger instead — same class of bug as Phase 4's
  "Save" vs. "Save as template," now confirmed to recur anywhere a short, generic button label
  shares a page with longer labels containing it; (2) a device-type checkbox in the brand
  quick-add form is *pre-checked* by default (correctly — you opened it via that device type's
  own "+ Add brand"), so a test clicking it "to select it" actually deselected it; (3) a
  same-labeled trigger button and modal submit button (e.g. "Job Done" outside and inside its
  own confirmation dialog) both remain in the DOM while the dialog is open, so a bare text
  selector for the second click is ambiguous — resolved with `.last()` (the modal's copy, which
  a portal-based dialog renders later in DOM order).

**Full live verification** (`verify-phase5.mjs`, run twice consecutively for confidence, 19/19
checks passing both times, zero console/page errors): fresh signup → Service Options seeded
with the 6 default device types → added a brand and a problem tag → created a job card
(customer quick-add, device/brand/model/problems, estimated cost + advance) → Timeline shows
real "Created" and "Advance Received" events → Take Job → added a part (quick-added as a new
catalog item) → Job Done → Generate Bill → Deliver → Close → Job Costing list shows it as
"Pending Costing" → recorded actual costing → Service Items quick-add created a real Item
Master-shape entry. **Separately verified the actual point of Phase 4+5 together**
(`verify-gating.mjs`, 8/8 checks): a fresh Technician with no workflow config sees *zero*
status-action buttons on a job card; after the Owner grants only "Take Job" for the Pending
status via the Workflow Designer, the Technician sees exactly that one button (plus the
always-available Repeat Job/WhatsApp) and nothing else — "Job Done"/"Generate Bill" stay hidden.

### Phase 5 UI-fidelity follow-up (post-completion, prompted by side-by-side screenshot review)

- **Icon + dropdown-width redesign.** `SearchSelect` and `MultiSelectPopover`
  (`components/shared/`) were reworked for pixel fidelity against the reference: each option can
  now carry a `LucideIcon` (Device Type options use a new `deviceTypeIcon()` helper in
  `config/service-options.ts` — Smartphone/Phone/Tablet/Watch/Headphones/Laptop, `Package`
  fallback); the selected state renders a checkmark-in-box replacing the option's own icon; the
  "add new" affordance changed from a query-driven button to a persistent
  `Input placeholder="Add New..."` + adjacent `+` button footer (breaking change — the old
  `createNewLabel` prop was removed, every call site updated). Both components' popup width was
  a fixed `w-72` regardless of the trigger's real width, which looked visually disconnected from
  wide form fields; fixed with Base UI's documented `--anchor-width` CSS variable (confirmed by
  reading the installed package's `PopoverPositionerCssVars.d.ts` directly) via Tailwind v4's
  `w-(--anchor-width)` shorthand. Added `PatternLockPicker`/`PatternLockPreview`
  (`shared/pattern-lock.tsx`) — a real tap-sequence 3×3 grid, not a decorative button — for
  Device PIN/Pattern. Added `StatusPill` (`job-cards/status-pill.tsx`) with a per-status
  icon+tone map, replacing plain `StatCard`s on the Job Cards list. IMEI/Serial No got adjacent
  scan-icon buttons that honestly just focus the input (no real barcode scanning implemented —
  flagged rather than faked).
- **Default Service Options now seed from a real dataset, not a placeholder.** The old
  `DEFAULT_DEVICE_TYPES` (6 bare strings) is gone. `lib/service-options-seed.ts` now seeds every
  new company from `src/data/default-service-options.json` (91 models across 20 brands with
  correct device-type sharing, plus cancel/hold/outstanding reasons and customer items),
  resolving device-type-label→id and brand-label→id relations while building the batch so
  `modelDoc.deviceTypeId`/`brandId` point at the right freshly-created docs. This is the
  project's real default dataset — owners can still edit/reorder/delete everything afterward
  through the existing Service Options page; nothing about that page's own behavior changed.
- **A systemic, previously-invisible bug: `<Select>` showing a raw Firestore ID instead of its
  label.** Found via a direct screenshot the user sent showing "Assign To" displaying
  `gzgYx8yuQQSpVk991C1E45kCSOR2` instead of the chosen user's name. Root cause (confirmed by
  reading Base UI's own source, `select/value/SelectValue.js` and
  `internals/resolveValueLabel.js`): `Select.Value` only resolves a label from an explicit
  `items` map handed to `Select.Root` — it does **not** read the label off a mounted
  `SelectItem`'s children, because those only exist in the DOM while the popup is open. Every
  `<Select>` composed the "plain" way — `<SelectItem value={id}>{label}</SelectItem>` inside
  `<SelectContent>`, no `items` prop — was exposed the instant the popup closed after a fresh
  selection. This wasn't unique to Assign To: the same pattern is used for Handover To, the Role
  picker on Create User, Brand quick-add in Service Options, and more. Rather than hand-patch
  every call site, fixed once in the shared wrapper (`components/ui/select.tsx`): `Select` now
  walks its own children (through `SelectContent`/`SelectGroup`/conditionally-rendered arrays)
  and auto-derives the `{value, label}` map Base UI needs, so every existing call site is fixed
  with zero changes to itself. Reproduced live before/after on both Assign To and the Create
  User Role picker to confirm.
- **Role Configure page rebuilt for structural fidelity**, not just colors — a second screenshot
  from the user showed real, concrete differences from the reference, not subjective taste:
  wrong CRUD column order (was Create/View/Update/Delete; reference and now this app read
  Create/Delete/Update/View — `CRUD_OPS` reordered in `config/permission-schema.ts`), a plain
  `Switch` standing in for what should be a solid pill button ("Full Access Granted" /
  "Grant Full Access"), no colored header band on module rows, no checkmark on a fully-granted
  permission badge, no all-caps module label above each entity permission table, and squared
  boxes instead of the reference's rounded-pill chips for menu items and special-action
  permissions. `menus-permissions-tab.tsx` rewritten against the reference structure; re-verified
  the toggle → Save → reload cycle still persists correctly afterward (a permission count moved
  40/162 → 41/162 and survived a full page reload), confirming this was a pure rendering change.
- **Dashboard greeting was a hardcoded placeholder** — `dashboard-page.tsx` literally rendered
  `'Good morning, there 👋'` regardless of who was signed in; `useAuth()` was never even imported
  on that page. Fixed to `profile?.fullName`, styled in teal to match the reference exactly.
  Found during this same fidelity sweep, not reported by the user directly — a reminder that
  screenshot review surfaces bugs testing scripts don't, because scripts don't visually read
  their own output.
- All of the above re-verified against the full `verify-phase5.mjs` (19/19) and
  `verify-gating.mjs` (8/8) suites afterward — every change here was rendering/label-resolution
  only, no functional/data-flow change, and both suites confirm nothing regressed.

### Phase 5 UI-fidelity, round 2 (a second, more forceful side-by-side pass)

A further round of screenshot comparisons — this time including genuine screenshots of the real
reference app itself, not just my earlier read of it — surfaced several more real gaps, several
of them functional, not cosmetic:

- **A whole missing feature: real camera-based QR/barcode scanning.** The Dashboard's "Scan Job
  Card" quick action, and the IMEI/Serial "scan" icon buttons, were previously honest-but-fake
  stubs (a plain link, and a button that just focused the input — both disclosed as such at the
  time). The reference app scans for real. Installed `jsqr` and built a shared
  `CameraScanFrame` (`components/shared/camera-scan-frame.tsx`) — `getUserMedia` → decode every
  animation frame via a hidden canvas — reused by two real modals: `ScanJobCardModal` (decodes a
  job's printed `jobNumber` or a deep-link URL, looks it up via a new `lib/job-card-lookup.ts`,
  and navigates straight to it) and `ScanTextModal` (fills IMEI/Serial with whatever it reads).
  Both match the reference's own copy and camera-unavailable error state exactly.
- **The Dashboard was completely fake, not just cosmetically off.** `useDashboardStats` was still
  a literal Phase-1 stub (`TODO(Phase 5/9): replace...`) returning hardcoded zeros for every
  tile, and the two chart panels (`recharts` was installed but never actually used) only ever
  rendered their empty state — regardless of how many real job cards or how much real revenue
  existed. Rewrote `useDashboardStats` to compute every tile for real off the same `useJobCards`
  list every other Service page already reads (no new aggregation collection needed at this
  data volume), added a shared `lib/date-range.ts` so "Today/This Week/…" bounds mean the same
  thing on the Dashboard and the Job Cards list, and built both charts for real (`PieChart`
  donut with a center total + legend, `LineChart` revenue trend) instead of always-empty panels.
- **Job Cards list was missing real date-range filtering, a Filters control, and the scanner
  entirely.** `FilterBar` already supported date-range chips (the Dashboard used them), but
  `job-cards-page.tsx` never passed the props through — so even the Dashboard's own date chips
  were decorative until this pass (see above). Wired real date filtering (via `dateRangeBounds`),
  added a real "Filters" popover (Assigned To, multi-select against `useUsers()`), and the same
  scan icon as the Dashboard.
- **Every nested/sub-route lost its breadcrumb, everywhere in the app, not just Job Cards.**
  `findNavEntry` (`config/nav.ts`) only ever exact-matched a leaf's own path, so
  `.../job-cards/create`, `.../users/create`, and `.../roles/:id/configure` all fell through to
  showing bare "Dashboard" instead of a real trail — a systemic gap that predates this phase
  (Phase 3's own Create User and Role Configure pages had the exact same bug, just never
  screenshotted closely enough to notice). Fixed `findNavEntry` to fall back to a prefix match
  for nested routes, humanizing the extra segment (`create` → `Create`) and dropping anything
  that looks like an opaque Firestore id rather than showing it raw. Added a small
  `useBreadcrumbExtra(label)` hook (`contexts/breadcrumb-context.ts` +
  `contexts/breadcrumb-provider.tsx`, wrapped once around `AppShell`) so a page that knows a more
  precise trailing crumb than the URL alone can — a job's own number, a role's own name — can set
  it; wired into Create Job Card ("Create"), Create User ("Create"), and Role Configure (the
  role's own name).
- **Checkbox alignment was broken everywhere `text-center` was used to center one** — Base UI's
  `Checkbox` root is `display: flex` (a block-level box), and CSS `text-align: center` has zero
  effect on a block-level child's own position, only on inline content. Every CRUD-permission
  table cell relying on `<td className="text-center"><Checkbox/></td>` was silently left-aligning
  the checkbox instead of centering it — both in the just-rebuilt Role Configure permissions
  table and, it turned out, in Phase 4's own Workflow Designer status×action matrix
  (`permissions-subtab.tsx`), which had carried this since it was first built. Fixed the root
  cause once (`Checkbox` is now `inline-flex`, so `text-align: center` works as written
  everywhere), plus explicit `flex justify-center` wrapper divs in both tables for certainty.
  Verified with exact bounding-box measurements, not a screenshot guess: every checkbox now
  centers under its header to within 0.1px, in both tables.
- **Status labels didn't match the reference's own wording**: `JOB_STATUSES` (the single source
  every status pill/badge/stat-tile reads from) had "Technician Completed", "Ready for
  Delivery", and "Cancelled · Pending Return" where the reference just says "Tech Done", "Ready",
  and "Pending Return". Renamed at the source so it's correct everywhere at once.
- **The `<Select>` fix from round 1 needed a companion fix for the exact same failure mode
  elsewhere**: the Device PIN/Pattern field was rendering its *internal* pattern encoding
  (`"1-2-3-6-9"`) into a plain editable `<Input>` once a pattern was drawn — the same class of
  bug as the raw-Firestore-ID `<Select>` issue, an internal representation leaking where a
  friendly summary belongs. Fixed to show "Pattern drawn" with an inline "Clear", matching the
  reference; rebuilt the Draw Pattern dialog itself to match exactly (real drag gesture,
  SVG-drawn connecting lines, a live "Pattern: N dots connected" readout, Clear/Cancel/Save
  Pattern footer) instead of the earlier minimal tap-to-toggle popover. Added a bonus the
  reference itself has: clicking the saved "Pattern drawn" text (not the "Draw" button) replays
  the pattern step-by-step ("Step N of total") rather than only letting you re-edit it.
- **Every `SearchSelect`-based picker was missing the reference's persistent chevron-down** —
  the trigger only ever showed a clear-`×` button when something was selected, never an
  always-visible dropdown affinity indicator the way every reference field has. Added one
  unconditionally, once, in the shared component. Also extended `SearchSelectOption` with an
  optional `avatarLabel` so people-pickers (Assign To, Received By) render a filled circular
  initials avatar — reusing a new shared `getInitials()` (`lib/utils.ts`, extracted from the
  header's own avatar so both use the identical initials logic) — instead of the plain
  icon-in-a-box treatment that's still correct for catalog-style pickers (Device Type, Brand).
  "Assign To" also gained a real "— Not Assigned —" option, matching the reference.
- **Create Job Card's own layout had three concrete, evidenced gaps beyond the above**: the
  whole form floated on bare page background instead of being one bordered card (fixed by
  wrapping the fields grid + footer buttons in a single `rounded-lg border` — the page header
  stays outside it, exactly like the reference); it was missing the reference's own "Draft saved
  at TIME / Clear Draft" autosave entirely (Create User already had this exact pattern — same
  debounced-localStorage approach, now added here too, covering every field except the
  unavoidably-unserializable pending image `File`s); and the page was constrained to
  `max-w-5xl mx-auto`, leaving visible dead space on both sides that the reference's own
  edge-to-edge layout doesn't have — removed the constraint.
- Every change in this round re-verified against `verify-phase5.mjs` (19/19, after updating two
  assertions that were checking the now-intentionally-renamed status labels) and
  `verify-gating.mjs` (8/8) — all functional flows, not just the pages touched, still pass clean.
- Two small follow-on polish fixes caught in continued screenshot review: the "Pattern drawn"
  confirmation text had no visual preview of the actual saved pattern (reused the already-built
  `PatternLockPreview` dot-grid, previously only wired into the detail page); and the "Draw"
  button sat visibly shorter than the row beside it (`size="sm"` = `h-7` next to a `h-8` row) —
  both the button and the "Pattern drawn" display box now share the same `h-8` height as every
  `Input` in the app.
- **The real reason the form ran noticeably taller than the reference and needed scrolling it
  shouldn't have**: `alternativeMobile`/`imei2` are correctly declared `defaultVisible: false`
  in `job-card-form-fields.ts`, but `create-job-card-page.tsx` fell back to `{}` (not
  `blankFormSchema('jobCard').fields`, the same fallback the Workflow Designer's own builder tab
  already uses) whenever a company hadn't yet saved a Job Card Form config — so every field's
  declared default was silently ignored and treated as visible, and `defaultRequired` was
  silently ignored too (Brand/Model never showed their required `*` for a fresh company either).
  One-line fix: fall back to `blankFormSchema('jobCard').fields` instead of `{}`. This is also
  why the two-column grid didn't group the same way the reference's screenshots did — with the
  extra fields correctly gone, the same conditional-render + CSS-grid-auto-flow the code already
  had naturally produces the identical compact grouping, no layout code needed changing at all.
  `verify-gating.mjs`'s own job-creation setup needed a Brand/Model selection added (it never
  filled either, silently relying on the same bug) — not a regression, a test catching up to a
  real fix.
- **Vertical density pass**, on top of the row-count fix above: the reference clearly fits the
  whole form in noticeably less height than this page did even with the extra rows gone.
  Tightened the grid's row gap (`gap-y-5` → `gap-y-3`), every field's label-to-input gap
  (`space-y-1.5` → `space-y-1`, all 19 occurrences), the outer page and card padding
  (`p-4 sm:p-6` → `p-4 sm:p-5`, `space-y-4` → `space-y-3`), and the footer's top
  margin/border-padding. Measured with a real script (`main`'s `scrollHeight` at a 900px
  viewport, not eyeballed): 1199px → 1063px, an 11% reduction on top of the height already
  recovered by removing the two phantom rows. Full parity with "no scroll at all" depends on the
  viewer's actual browser chrome/monitor height, which isn't something this can fully control
  for — this is a real, measured, honest improvement, not a claim of exact pixel parity.
  Trimmed two more concrete things (Remark `rows={3}` → `rows={2}`, the image dropzone's
  `py-6` → `py-4`) for 1199px → 1047px, ~13% total reduction.
- **The actual, correct fix for the height problem turned out to be structural, not spacing**:
  asked directly to compare two screenshots side by side, the real difference wasn't padding at
  all — the reference's two columns are two *independent* vertical stacks (left column:
  `customerInformation` + `deviceInformation` + `repairInformation` fields, ending after Service
  Items with visible empty space below it; right column: `financial` + `accessories` +
  `internalDetails` + `images` fields, running further down on its own), not a single grid where
  every field alternates left/right row-by-row the way this page had built it from the start.
  Restructured into two `space-y-3` divs inside one `lg:grid-cols-2` grid, using the section
  grouping `job-card-form-fields.ts` already declared (so the split isn't arbitrary — it's the
  same section boundaries the Workflow Designer's own builder already organizes fields by), with
  inner 2-up sub-grids only for the pairs that are genuinely paired in the reference (Device
  Type+Brand, Model+IMEI, IMEI 2+Serial No, Estimated Cost+Advance Received, Received By+Assign
  To). Also added the reference's "(Optional)" labels next to every non-required field — plain
  text, muted, no color — which this page had never rendered at all (only ever showed the red
  `*` for required fields, nothing for optional ones). Result: 1047px → 894px, comfortably under
  even a 950px viewport including the footer buttons — this is the fix that actually mattered,
  not the spacing tweaks before it. Added a subtle `lg:divide-x` vertical rule between the two
  columns (stretches the full height of the taller column automatically — CSS Grid's own default
  `align-items: stretch`, no extra markup needed), matching the reference's own visual divider.
- **Two more real, measured bugs, not eyeballed**: (1) three different height mechanisms
  coexisted across this one form — `Input` is an explicit `h-8` (32px), but `SearchSelect`'s
  trigger was a separate explicit `h-9` (36px) and `MultiSelectPopover`'s trigger used
  `py-2`-computed height (also ≈36px) — meaning every Customer/Device Type/Model/Service Items
  field stood 4px taller than every plain-Input field and its own adjacent icon button, on every
  page that uses either shared component, not just this one. Standardized both to `h-8`, matching
  `Input` (the most foundational, widest-blast-radius-if-changed component, so the other two
  were brought to match it rather than the reverse). Verified with real measurements after the
  fix: SearchSelect trigger, plain `Input`, and MultiSelectPopover trigger all now report exactly
  32px. (2) The `lg:divide-x` divider above used Tailwind's negative-margin trick (meant for
  gap-less flex/block layouts) inside a CSS Grid that already had its own `gap-x-8` — the
  negative margin pulled the right column left into that gap, visually overlapping the left
  column's own inputs and buttons. Replaced with a plain `border-left` directly on the right
  column's own wrapper (no margin compensation needed, since a grid's `gap` is already real
  empty space) — confirmed clean via screenshot, sitting entirely within the gap with no overlap
  into either column's content. Both re-verified against `verify-phase5.mjs` (19/19) and
  `verify-gating.mjs` (8/8), since the height change touches two components used app-wide.

### Phase 6 decisions

- **Every Finance page reads the same `jobCards`/`receipts` collections Phase 5 already
  writes** — no new denormalized "ledger entries" collection standing in for either. Receipts &
  Payments lists `receipts` directly; Party Ledger, Cash Book, and Receivables all derive their
  totals from `useJobCards()`+`useReceipts()` client-side (the same "fetch once, compute
  client-side" pattern every list hook in this app already uses at this data volume — a
  single-shop's job/receipt count doesn't need a server-side aggregation query). This was the
  literal point of BUILD_PLAN's own closing instruction for this phase ("from **one** write
  path... never four separate un-atomic writes") — verified live, not just designed that way:
  creating a job card with an advance writes the receipt in the same batch as the job (already
  true since Phase 5), and both the standalone "New Entry" and "Void Receipt" (below) do the same.
- **"New Entry"'s own write path (`useCreateReceiptOrPayment`) extends, not duplicates, Phase
  5's existing receipt-writing pattern** (`use-job-cards.ts`'s advance branch,
  `use-job-actions.ts`'s `useRecordPayment`) — same `ReceiptDoc` shape, same batch-write
  discipline. When `against: 'jobCard'`, the same batch also patches that job's `paidAmount` via
  a Firestore `increment()` (not a read-then-write, which would race against a second concurrent
  payment) — `direction: 'in'` adds, `direction: 'out'` subtracts, covering both a customer
  payment and a refund-against-a-job in one code path.
- **Void Receipt reverses the ledger atomically, not a soft-delete** — flips `voided: true` and,
  if the receipt was against a job card, reverses that job's `paidAmount` by the same signed
  amount, both in one batch. `firestore.rules`' own `update` rule for `receipts` is deliberately
  narrow: the *only* legal diff is `voided: false → true` (plus `updatedAt`) — never a rewrite of
  the amount/party/mode after the fact, same "append-only ledger" principle the job timeline
  already uses. The matching `jobCards` rule update needed its own narrow second clause too: a
  Finance-only role (no Service access at all) can still legally reverse `paidAmount` — and
  *only* that field — on a job it doesn't otherwise have access to.
- **Payables reinterpreted for what this app actually has** — see BUILD_PLAN.md Deviation #11:
  no supplier-purchase flow exists yet, so this is customer-side (Refund Due / Unused Advance /
  Advance Credit), computed entirely from `jobCards`+`receipts`, not a second Payables data model
  bolted on ahead of Phase 7.
- **Party Ledger's three particular kinds match the reference's own accounting convention**: "Job
  Card Created" is purely informational (debit=credit=0, never moves the balance) — it's a
  timeline marker, not a billing event; "Advance/Payment Received" is a credit; "Bill Generated"
  (once a job's `finalAmount` is set) is a debit. A positive credit-minus-debit running balance
  means the shop is holding more than it's billed (shown as "₹N Cr", same as the reference);
  negative means the customer still owes. The summary list's own `balance` field intentionally
  uses the *opposite* sign convention (`billed − paid`, positive = customer owes) to read
  naturally as a plain "Balance" column — `balanceLabel()` reconciles the two call sites by
  negating the detail view's running total before display; documented in-code since two
  opposite, both-correct conventions in one file is a real footgun for whoever touches this next.
- Full live verification (`verify-phase6.mjs`, run twice consecutively, 13/13 both times, zero
  console/page errors): signed up fresh → created a job card with a ₹500 advance (Phase 5's own
  flow) → confirmed the auto-generated receipt appears in Receipts & Payments with the correct
  "Today Received" stat → recorded a second, manual ₹150 receipt via "New Entry" (Manual/Advance,
  UPI) → confirmed Party Ledger's list and full khata detail (Job Card Created → Advance Received
  → Payment Received → Closing Balance ₹650 Cr) → confirmed Cash Book's running balance (₹650) →
  confirmed Receivables and Payables both load and compute correctly (Payables correctly showed
  "Unused Advance ₹500" — only the job-linked portion — vs. "Advance Credit ₹650" — the party's
  full combined credit including the non-job-linked manual entry, exactly matching the two
  metrics' documented, deliberately different scopes) → voided the manual receipt and confirmed
  the Cash Book balance correctly dropped back to ₹500. Also re-ran `verify-phase5.mjs` (19/19)
  and `verify-gating.mjs` (8/8) afterward to confirm the `jobCards.paidAmount` write path this
  phase now shares didn't regress anything from Phase 5.
- **Two real lint bugs caught in the same full-project sweep this phase's own work prompted**,
  both in scanner code written earlier this session, neither previously caught because those
  files were only typechecked/built at the time, never run through the full `npm run lint`:
  `camera-scan-frame.tsx` was writing to a ref's `.current` directly during render (only
  event handlers/effects may — moved into a `useEffect`); `scan-job-card-modal.tsx`'s manual
  `useCallback` dependency array (`[profile?.companyId, ...]`) was narrower than what the React
  Compiler infers from actual usage (`profile` as a whole), which made it bail out of optimizing
  the component entirely — removed the `useCallback` wrapper, since this project's compiler
  auto-memoizes and `CameraScanFrame` was already designed (via its own `onDecodeRef`) to accept
  a fresh callback identity every render anyway.

### Phase 7 decisions

- **Every default Masters dataset (UOM, Payment Modes, Party Categories, Item Categories) seeds
  in the same signup batch** as the 5 default roles / Main Branch / Service Options, following
  the exact `addDefaultServiceOptionsToBatch` precedent from Phase 2/5 — a new
  `addDefaultMastersToBatch()` (`src/lib/masters-seed.ts`) adds ~30 more docs to that one atomic
  batch (well under Firestore's 500-write batch limit; the batch was already at ~145 writes from
  Service Options alone). A company never opens Item Master, Payment Modes, or Party Categories
  to an empty, unusable page on day one.
- **Second Hand Device Purchase reuses the exact same `serviceOptions` Device Type/Brand/Model
  catalog Job Cards already picks from** — confirmed correct by comparing `preview (50)`'s combos
  to the Job Card form's own, which are visually identical. One shared catalog, not a second one
  seeded separately for second-hand devices; adding a brand from either screen shows up in both.
- **Parties' `type` field (Phase 5) is kept, now *derived*, not replaced** — Phase 7 needs the
  reference's real `partyTypes: ('customer' | 'supplier')[]` array (`preview (51)`'s own "Both"
  filter pill proves Customer/Supplier are independent checkboxes, not a mutually-exclusive
  radio), but every Phase 5/6 call site reading `party.type` (job-card customer search, receipt
  party search, Party Ledger's Customers/Suppliers toggle) needed to keep working unchanged. A
  "Both" party derives to `'customer'` at those call sites — the same simplification the
  reference's own Party Ledger screen makes, since it has no "Both" concept of its own either.
- **Device Sale's `useCreateSecondHandSale` is one atomic batch** — the sale doc and the
  purchase's `status: 'sold'` flip happen together, never as two separate un-atomic writes, same
  discipline as Phase 6's receipt/`paidAmount` batches. `purchasePrice`/`refurbCost`/`profit` are
  snapshotted onto the sale doc at the moment of sale (not recomputed live from the purchase doc
  afterward), so editing a purchase's `refurbCost` later never silently changes a past sale's own
  recorded profit.
- **"Delete" across every new entity (Parties, Item Master, and every `source`-flagged Masters
  row) is a soft status/status-flag update, never a real Firestore `delete()`** — `firestore.rules`
  backs this up server-side (`allow delete: if false` on `parties`/`items`; a `source != 'system'`
  guard on the 4 Masters collections). Same "might be referenced elsewhere, don't hard-delete"
  reasoning already applied to Branches/Roles/Receipts in earlier phases.
- **A genuinely missing `counters/{docType}` Firestore rule, present since Phase 2, is fixed in
  this phase's `firestore.rules`** — every sequential-ID mint (`JC-...`, `RCP-...`, `PTY-...`,
  and now `SHDP-.../SHDS-...`) has always transacted against this collection, but no rule for it
  was ever written; every prior phase's live verification only ever worked because the real
  project's rules were never deployed. Added `allow read, write: if belongsToCompany(companyId)`
  — company-membership only, not a specific menu, since it's shared internal plumbing every
  create flow across every module needs to touch.
- **Found and fixed a real, pre-existing UI bug unrelated to this phase**, via a side-by-side
  screenshot review of the new pages: every leaf page's breadcrumb showed a stray "0" after the
  page title. Root cause in `components/layout/top-bar.tsx`: `entry.extraCrumbs.length` is the
  literal number `0` (not `undefined`) on every page with no extra crumb, and `0 && x` in a JSX
  expression evaluates to `0` itself, not `false` — React renders a bare `0` as a real text node
  since (unlike `false`/`null`/`undefined`) it's a valid child. Wrapped the whole condition in
  `Boolean(...)`. Present since whichever earlier phase built the breadcrumb, only actually
  noticed now; re-ran `verify-phase5.mjs`/`verify-phase6.mjs`/`verify-gating.mjs` afterward since
  the fix touches a component every single page renders — all three still clean (19/19, 13/13,
  8/8).
- Full live verification (`verify-phase7.mjs`, run twice consecutively, 28/28 both times, zero
  console/page errors): signed up fresh → all 6 Masters pages loaded with correct seeded data
  (UOM 15 including "Inch"'s base-unit conversion, Payment Modes 3 with Cash flagged default,
  Party Categories 3 with the right default-customer/default-supplier stars, Item Categories 10
  with "Spare Parts" as root and its children nested under it) → created a custom UOM, a custom
  Item Master entry, and a "Both" customer+supplier Party → bought a real device (Samsung Galaxy
  A15) through the full Create Purchase form, including a real seller quick-add → confirmed it
  immediately appeared In Stock on both Device Purchase and Device Stock with the correct
  invested amount → sold it through Device Sale's "Sell" modal with a real buyer quick-add →
  confirmed Sale Register showed the completed sale with correct profit (₹500) and margin
  (20.0%) and the full combined Device+Seller+Purchase+Sale+Timeline detail drawer, Purchase
  Register flipped to "Sold," and Device Stock correctly emptied out once the only device in it
  sold. Re-ran `verify-phase5.mjs` (19/19), `verify-phase6.mjs` (13/13), and `verify-gating.mjs`
  (8/8) afterward — zero regression from any of this phase's changes (including the shared
  `PartyDoc`/`ItemDoc` type extensions and the top-bar breadcrumb fix).
- Known, honest limitations, same "advisory, not fake" principle as every earlier phase's own
  stubs: Print Receipt/Print Label buttons on the Second Hand Device drawers are visibly-disabled
  stubs (Phase 10 builds real Print Formats) rather than a silent no-op or a fabricated success;
  "Return to Seller" is a plain status flip with no automatic purchase-price refund/reversal
  modeled, since the reference screenshots never show one; Create Purchase does not replicate the
  localStorage "Draft saved" autosave convenience Create Job Card/Create User have, purely for
  scope reasons — a real (not fabricated) feature deliberately left for a later pass, not
  something claimed to exist that doesn't.

### Phase 8 decisions

- **One shared `auditLog` collection backs both System Audit and Login Report** — Login Report is
  a filtered/aggregated view (`entityType === 'Login'`), never a second collection, matching the
  "derive views over an existing collection" convention from Phase 6's Party Ledger/Cash Book.
- **Every mutation written since Phase 2 now logs to `auditLog` inside the same atomic
  `writeBatch` as the real write it's recording** — `addAuditLogToBatch()` (`src/lib/audit-log.ts`)
  resolves IP/branch-name first (it's `async`) but never calls `.commit()` itself, leaving that to
  the caller, so an audit entry exists *iff* the write it records actually landed. Retrofitted
  across ~18 pre-existing files (`use-roles.ts`, `use-workflow-config.ts`, `use-form-schema.ts`,
  `use-service-options.ts`, `use-job-cards.ts`, `use-job-actions.ts`, `use-job-costing.ts`,
  `use-receipts.ts`, `use-parties.ts`, `use-items.ts`, `use-item-categories.ts`, `use-uom.ts`,
  `use-payment-modes.ts`, `use-party-categories.ts`, `use-second-hand-purchases.ts`,
  `use-second-hand-sales.ts`, `user-management.ts`), several of which needed a bare `setDoc`/
  `updateDoc`/`deleteDoc` converted to `writeBatch` to allow this, and several needed an extra
  labeling parameter added (`partyName`, `itemName`, `categoryName`, `purchaseNumber`, etc.) so
  the audit row reads as a real sentence, not just an ID. `useReorderServiceOption` is deliberately
  left un-audited — reordering isn't a security- or money-relevant event, and logging every drag
  would just be noise in the trail.
- **"Failed Attempts" on Login Report is honestly scoped, not a bug**: a genuinely wrong-password
  or no-such-account login attempt has no signed-in principal, and this project's tenant-scoped
  rules model (`belongsToCompany()`) has no way to attribute a write to a specific company from an
  unauthenticated client without opening a cross-tenant spam-write hole. Only post-authentication
  rejections (`'unauthorized'` for disabled, `'blocked'` for IP) are ever persisted — documented in
  `src/lib/auth.ts`'s own doc comment, and the stat is scoped accordingly.
- **IP Whitelist enforcement is explicitly advisory-only** (see `src/lib/ip-enforcement.ts`'s own
  doc comment) — real enforcement needs a server component this client-SDK-only project doesn't
  have. Never applies to an Owner role (exempted in `useIpAccessCheck()`), so a misconfigured
  whitelist can never lock a company out of its own admin account.
- **Active Sessions' "Auto-expires on" uses a fixed 24h placeholder** (`SESSION_LENGTH_MS` in
  `src/lib/session-lifecycle.ts`) — there's no real server-issued token lifetime to mirror in a
  client-SDK-only project; documented as the closest honest stand-in, not a fabricated value.
- **A broad, previously-latent Firestore correctness bug, found and fixed everywhere it appeared,
  not just in new Phase 8 code**: a `serverTimestamp()` field reads back as `null` locally until
  the server acknowledges it, and Firestore's query engine *excludes* — not just mis-sorts — a
  document from a server-side `orderBy()`-sorted result while its sort field is `null`. A
  freshly-created job card, receipt, session, audit entry, or second-hand purchase/sale was
  silently invisible in its own list until a server round trip completed *and* something
  triggered a refetch. This had been present since whichever phase first wrote each affected
  hook (as far back as Phase 5) — Phase 8's own live testing of "does a brand-new session/audit
  row show up immediately" is simply the first thing that exercised it hard enough to notice.
  Fixed by removing every server-side `orderBy()` on these collections and sorting client-side
  instead, using `new Date().getTime()` (not the bare `Date.now()` this project's React Compiler
  flags as impure) as the fallback for an unresolved timestamp. The identical bug also showed up
  in a *date-range filter* — Login Report's own "is this today" check falling back to epoch
  (`new Date(0)`) for an unresolved timestamp, wrongly dropping a same-second login event out of
  every stat on the page. Same fix, same reasoning: an unresolved timestamp should fall back to
  "now" (definitely included), never to "the beginning of time" (definitely excluded).
- **Two genuine races between Firebase Auth's own global state change and this app's async
  post-auth checks, both newly discovered this phase**:
  1. *Signup*: `GuestOnlyRoute` redirects reactively the instant a profile doc becomes visible,
     independent of `signUp()`'s own JS. The session + audit-log docs used to be written as a
     separate `await` *after* the bootstrap batch committed, landing 1-3s after that redirect
     already fired — long enough for anything checking immediately post-signup (an automated
     test, a very fast real user) to see them "missing." Fixed by folding both into the *same*
     atomic bootstrap batch as the profile doc (`addSessionToBatch`/`addLoginAuditToBatch` in
     `seedTenantForUser()`), using a `getClientIp()` promise kicked off in parallel with the rest
     of signup rather than awaited afterward.
  2. *Login rejection*: `signInWithEmailAndPassword` flips Firebase's global auth state (and
     `GuestOnlyRoute`'s reactive redirect) the instant credentials check out — before `logIn()`'s
     own async profile-status/IP-whitelist check (a Firestore round trip) can reject the attempt
     from the login form itself. This could let a disabled/blocked account briefly reach
     `/app/dashboard` before rejection took effect. Fixed with a `ProtectedRoute`-level backstop:
     `AccountDisabledScreen`/`IpBlockedScreen` check `profile.status`/IP-whitelist status
     directly, rendering instead of `<Outlet/>` regardless of which check "wins" the race — so
     real app content is never shown for a disabled/blocked account. Also removed `logIn()`'s own
     `firebaseSignOut()` call on rejection: it was forcibly dismissing the backstop screen moments
     later (bouncing back to a bare, message-less login form); each screen now has its own manual
     "Sign Out" button as the stable end state.
  3. **A third, deeper variant of race #2, found only once the rejection's own audit-log entry
     was checked, not just the rejection message**: nothing stops a user — or, at machine speed,
     an automated test — from clicking that manual "Sign Out" button before `logIn()`'s own audit
     write has actually reached the server. `firebaseSignOut()` invalidates the token that
     in-flight write needs, silently turning a security-relevant rejection into one that never
     gets logged — exactly the kind of gap a real audit trail exists to not have. A first fix
     (tracking only the `logLoginEvent()` write itself, registered once `logIn()` reaches it) was
     verified insufficient by direct testing: the race can land *before* `logIn()` has even
     reached its own whitelist/status check, i.e. before there's anything yet to track. Fixed
     properly by having `logIn()` register its *entire* attempt as a pending write
     (`trackPendingAuditWrite`) from the very first synchronous tick it's called, and `logOut()`
     awaits that (`flushPendingAuditWrite()`) before actually calling `firebaseSignOut()` —
     closing the race regardless of which stage it lands in. Confirmed via direct instrumentation
     (timestamped tracing through both the passing and failing cases) before and after the fix,
     then re-confirmed with 4+ consecutive clean full-suite runs with the tracing removed again.
- **A real server-side security gap found and fixed**: `firestore.rules`' `belongsToCompany()` —
  the gate nearly every rule in the file goes through — never checked account `status` at all, so
  a disabled account had *zero* server-side enforcement, only a client-side UI nicety a direct SDK
  call could bypass entirely. Fixed by baking `myUserDoc().data.status == 'active'` into
  `belongsToCompany()` itself; a disabled account is now correctly denied everything except
  reading their own profile doc (still allowed via the separate `request.auth.uid == uid` clause
  on `users/{uid}`, needed for the client to even detect the disabled status in the first place).
- **A real, pre-existing product gap found while trying to test the disabled-account flow**: User
  Management had no way to actually disable a user. Added `useSetUserStatus()` (audit-logged,
  `critical: true`) and a "Disable User"/"Enable User" button on the detail drawer (hidden for
  `protected` users and the viewer's own row), so the rejection path built for this phase is
  actually reachable through the UI, not just exercisable by hand-editing Firestore.
- **A `getClientIp()` cache correctness fix**: the module-level IP cache (shared by every
  audit-log write and login-attempt check on one page load) previously cached a *failed* lookup
  (a network blip, the free `api.ipify.org` rate-limiting a page that's made many calls) just as
  permanently as a successful one, meaning one transient failure poisoned every subsequent
  audit-log write for the rest of that page's lifetime with `ip: null`. Fixed so only a
  *successful* lookup is cached — a failed one clears itself, so the next call gets a fresh
  attempt instead of reusing the same failure forever.
- **Two test-script bugs found while chasing what first looked like a flaky "Blocked IPs" stat**,
  both worth recording since each masqueraded as a product bug for a while: (1) the test's own
  free-text search on System Audit ("Blocked Tech") happened to match the *test teammate's own
  name* rather than a `result: 'blocked'` row — the search box doesn't index `result` at all, only
  action/entity/label/user/target — producing a false-positive pass that hid the real underlying
  issue (a stale, un-rebuilt preview server — see below) for several iterations; fixed by renaming
  the teammate and switching the check to the page's own "All Results" dropdown filter, which
  actually filters on `result`. (2) The verification server (`vite preview`, port 4173) is a
  static build, not a dev server with HMR — several fix attempts silently tested against a stale
  bundle because the server wasn't rebuilt/restarted after a source edit. No product impact, but a
  reminder for any future debugging session against this same setup: a source change needs
  `npm run build` + a fresh `vite preview` before it's actually live.
- Full live verification (`verify-phase8.mjs`, run 6+ times consecutively across the debugging
  process for this phase, the final clean sequence all 23/23 with zero console/page errors):
  signup → Active Sessions shows the signup session marked "This device" → System Audit shows the
  Login event → job card created → System Audit shows the Job Card entry with a JSON "Additional
  Details" drawer → Login Report shows Logins Today → IP Whitelist "Detect My Current IP" fills a
  real IP and creates an entry → a Technician teammate created → the real-IP entry deactivated and
  a wrong one added → Owner signs out → Technician login blocked by IP Whitelist with the correct
  message and no real app content ever shown → Owner logs back in fine (Owner is exempt from IP
  Whitelist) → Login Report's Blocked IPs stat and System Audit both show the blocked attempt →
  wrong-IP entry cleaned up → Technician disabled in User Management → disabled Technician's login
  rejected with the correct message and no real app content ever shown. Also re-ran
  `verify-phase5.mjs` (19/19), `verify-phase6.mjs` (13/13), `verify-phase7.mjs` (28/28), and
  `verify-gating.mjs` (8/8) afterward — zero regression from the `orderBy` removals (which touch
  Phase 5/6/7's own hooks) or the `belongsToCompany()` rules change (a fundamental, widely-used
  helper nearly every rule in the file depends on).

### Phase 9 decisions

- **Four of six reports (Job-wise Profit, Technician Report, Supplier Report, Period Summary)
  read a `jobCosting`+`jobCards` join, not `jobCards` alone** — `useCostedJobs()`
  (`src/hooks/use-reports.ts`). A job only has a real revenue/cost/profit number once Closed *and*
  actually costed; a Closed-but-not-yet-costed job has nothing to report and is correctly absent
  from all four, matching the reference's own screenshots ("Jobs: 1" reflecting only the one
  costed job in its test data). Service Reports and Field Visit Report read their own source
  (`jobCards`, `fieldVisits`) directly, since neither depends on costing having happened.
- **Two real, pre-existing gaps from Phase 5 had to be closed before these reports had anything
  real to show**, both found while building this phase, neither a Phase 9 regression:
  1. `record-costing-modal.tsx` declared a `supplier: string | null` field on every cost item but
     never rendered anything to *set* it — every cost item's supplier had been permanently `null`
     since the day that modal was written. Added a real `SearchSelect` per cost item (autocompletes
     against existing supplier-type Parties, quick-adds a new one via `useCreateParty()` — the same
     call the Second Hand Device seller picker already makes — for anything typed that doesn't
     exist yet). Without this, Supplier Report would have nothing to ever show, on any company.
  2. "Field Visit" (a real Phase 5 job action) only ever wrote a bare timeline event with no
     duration — nothing in the app could produce the non-zero "Total Time Spent" the reference's
     own report calls for. Extended it (not a new action) to open a small dialog capturing an
     optional duration in minutes, stored on the timeline event
     (`JobTimelineEventDoc.durationMinutes`) and mirrored onto a new flat `fieldVisits` collection
     (`FieldVisitDoc`) written in the same atomic batch — a denormalized sibling purely so Field
     Visit Report reads one flat collection instead of every job card's own `timeline`
     subcollection, the same "denormalize for a report page's own convenience" call Phase 8 made
     for `sessions`/`auditLog`.
- **"Shop Expenses" on Period Summary is honestly always ₹0** — `nav.ts` marks Finance's own
  "Expenses" leaf `locked: true` (never built, out of this roadmap's scope), so there is nowhere
  in the app a shop expense could ever be recorded. This matches the reference's own screenshot,
  which shows the identical ₹0 with the identical "No shop expenses recorded in this period"
  copy — not a shortcut invented for this build, the reference's own test data has the same gap.
- **A new `ExpandableTable` shared component** (`components/shared/expandable-table.tsx`) —
  `DataTable`'s own sort/pagination contract has no inline row-expansion support, and four of six
  reports need chevron-expandable rows with a rich sub-panel, a pattern no earlier phase used.
  Kept separate from `DataTable` rather than bolting expand support onto a component a dozen+
  existing pages already depend on. Like `DataTable`, it renders each expanded panel through both
  the desktop-table and mobile-card layouts (matching that component's own established
  responsive-duplication convention) — confirmed benign for report panels backed by their own
  data hooks (`ServiceReportRowDetail`'s `useJobTimeline`/`useJobCosting`) since React Query
  de-duplicates concurrent identical queries, so the duplicate mount costs re-render time, not a
  second Firestore read.
- **"Export Excel" downloads a `.csv` file**, reusing Phase 7's existing `downloadCsv()` rather
  than adding a binary `.xlsx`-writing library for six more buttons — a CSV opens natively and
  correctly in Excel with zero compatibility loss, the same "simpler real mechanism than the label
  implies" call already made for Phase 5's reorder-by-arrows-not-drag-drop.
- **Two shared formatting helpers added to `src/lib/utils.ts`**: `formatCurrency()`
  (`₹6,200`-style thousands separator) and `formatPercent()` (`-2,430.61%`-style, matching the
  reference's own 2-decimal-place display) — this phase needed rupee/percentage formatting in far
  more places than any earlier one did, where the ad hoc `₹{amt.toLocaleString('en-IN')}` inline
  pattern a few pre-existing pages used would have meant six more copies of the same string.
- **A real bug found and fixed while writing this phase's own verification script**: manually
  wrapping each report's summary-stat computation in `useMemo(() => {...}, [filtered])` tripped
  the React Compiler's own `react-hooks/preserve-manual-memoization` rule — `filtered` itself is a
  plain derived array recomputed fresh every render (not itself memoized), so a `useMemo`
  depending on it can't be safely preserved, and the compiler skips optimizing the whole
  component when it can't. Removed every such manual `useMemo` across all six report pages; the
  underlying computations are cheap array reduces over a small dataset, and this project's own
  established convention (Phase 6) is to let the compiler's automatic memoization handle this
  rather than hand-roll it.
- Full live verification (`verify-phase9.mjs`, run twice consecutively, 27/27 both times, zero
  console/page errors): signed up fresh → created a job card, logged a real Field Visit
  (45 minutes) on it while still in progress → took it through the full lifecycle to Closed →
  recorded actual costing (₹300 against a ₹700 bill, with a real supplier picked via quick-add) →
  Service Reports shows the job with a real expandable Details/Payment/Parts/Activity-Timeline
  panel → Job-wise Profit shows the exact ₹700 revenue / ₹300 cost / ₹400 profit → Technician
  Report groups it under the technician who worked it, with real Win Rate/Avg Margin sub-stats →
  Supplier Report shows the real supplier with a real "Top Parts by Spend" chip and transaction
  row → Period Summary's own Gross Profit reconciles exactly with Job-wise Profit's ₹400, with the
  Shop Expenses explainer and "Net after shop expenses" row both present → Field Visit Report
  shows the real 45-minute visit in both its By Technician and By Job Card views → the "Profit &
  Loss" sidebar stub remains correctly locked throughout. Also re-ran `verify-phase5.mjs` (19/19),
  `verify-phase6.mjs` (13/13), `verify-phase7.mjs` (28/28), `verify-phase8.mjs` (23/23), and
  `verify-gating.mjs` (8/8) afterward — zero regression from this phase's changes to the shared
  Job Costing modal and Field Visit action, both used since Phase 5.

### Phase 10 decisions

- **Company Settings manages *the* one company, not a real multi-company list** — see
  BUILD_PLAN.md's Phase 10 deviations (#28) for the full reasoning: this app's data model ties
  `UserDoc.companyId` to exactly one company, with no company-switcher anywhere, so a genuine
  "Create Company" would create a permanently unreachable orphan doc. `useCompany()` does a
  single `get()` on the known `companyId`, never a collection query — sidesteps needing a `list`
  rule on `companies` for a query that could only ever return one document anyway. The reference's
  own screenshot shows the identical "list with exactly one row" shape for the same reason, so
  this still looks and behaves like the reference's own list+drawer pattern.
- **Financial Year *documents* are administrative/informational, deliberately independent of the
  FY string Job/Receipt/Party sequence numbers embed** — see BUILD_PLAN.md deviation #29.
  `getCurrentFinancialYear()` (used since Phase 2 for `JC-2026-27-...`-style IDs) still derives
  its answer purely from the real calendar date, never from which `FinancialYearDoc` a company
  has marked "Current" in this new Settings page. "Only one FY active/current at a time" is still
  a real, atomically-enforced invariant (`useActivateFinancialYear()` deactivates every other FY
  in the same batch as activating the target) — it governs this page's own display and lock
  status, not sequence numbering. `isLocked` is a real, persisted toggle with no enforcement point
  anywhere yet (nothing in this app associates a transaction with a specific FY doc) — kept
  genuine rather than either faking an enforcement check against nothing or skipping the toggle
  the reference screenshot shows, same "advisory, not fake" principle as IP Whitelist.
- **Print Formats' "canvas" is an ordered, reorder-by-arrows block list, not pixel-positioned
  drag-and-drop** — BUILD_PLAN's own spec for this phase explicitly allows exactly this. The live
  preview pane renders through the *exact same* `renderPrintHtml()` (`src/lib/print-render.ts`)
  every real "Print X" button in the app calls, against sample data — a true live preview, not a
  decorative mockup of one. Templates are seeded with one protected default per document type
  (11 total) at signup, matching every other "real usable defaults, not an empty shelf" seed in
  this app.
- **Every pre-existing "Print X" stub retired for real** — Job Card's Print Label/Print Job
  Card/Print Bill (previously bare `window.print()` calls since Phase 5) and Second Hand Device's
  Print Receipt/Print Label (previously a visibly-disabled "(Phase 10)" stub since Phase 7) now
  render the company's own *default* template for that document type against the real record via
  `openPrintWindow(renderPrintHtml(...))` — not a hardcoded layout. Which template a button uses
  is whichever the company has marked default in Print Formats, changeable without touching any
  of these call sites. The WhatsApp button (previously a single hardcoded message string) now
  resolves a real per-lifecycle-event template (`src/lib/whatsapp.ts`) against the job's own data,
  picking `billGenerated`/`delivered`/`statusChanged` based on the job's current status.
- **Backup & Restore writes to this company's own Firebase Storage path, not the reference's own
  Google Drive integration** — building real Google Drive OAuth needs a server this
  client-SDK-only project doesn't have (same constraint as IP Whitelist/scheduled backups).
  Matches BUILD_PLAN's own explicit instruction for this phase. "Restore from File" only accepts
  this project's own exported JSON shape (validated via a `_meta` block naming the source
  `companyId`, not guessed from raw structure). "Overwrite Live Data" restores by document-level
  `set()` matching ids — a document that exists live but wasn't in the uploaded file is left
  untouched, never a destructive delete-everything-else sync — gated behind a modal requiring the
  literal word "OVERWRITE" typed in, on top of the same menu-level permission every Settings page
  already has.
- **A genuine performance fix found while verifying Backup & Restore live**: `buildBackupSnapshot()`
  (walks ~19 top-level collections + 8 Service Options sub-collections + a per-job-card
  `timeline` subcollection + this company's own slice of `users`) originally fetched every one of
  those *sequentially*, one Firestore round trip at a time — slow enough that "Current Database"
  stats and "Backup Now"/"Download Backup" all took long enough to make a naive test's own
  polling budget time out. Parallelized every independent fetch via `Promise.all()` instead
  (nothing in that walk actually depends on anything else in it) — a real, measured latency fix
  for real usage, not just a test accommodation.
- **A real UI staleness bug found and fixed, present in the exact same shape on Branch Management
  and Financial Years' own detail drawers**: clicking Activate/Deactivate/Lock from within a
  drawer mutated the underlying document correctly, but the open drawer kept showing the
  *pre-mutation* snapshot it was opened with (a plain React state holding a copied object, never
  re-synced against the freshly refetched list behind it) — confirmed live via a failing
  verification check that this project's own established convention already avoids elsewhere
  (every other status-changing action in this app closes its drawer on success rather than trying
  to keep stale data looking fresh). Fixed by matching that same convention here.
- **A real, if narrow, race found while verifying "Create Next FY" live**: clicking it before
  `useFinancialYears()`'s own query had resolved silently no-op'd (the handler's own `fys` closure
  was still empty, so it found nothing to compute "next" from) — the button was visually
  clickable before the data it depends on had loaded. Fixed by disabling it during that load, the
  same defensive pattern every other data-dependent action in this app already uses.
- Full live verification (`verify-phase10.mjs`, run twice consecutively, 27/27 both times, zero
  console/page errors): signed up fresh → Branch Management shows the seeded protected Main
  Branch (no Deactivate/Delete available) → created and renamed a real second branch → Company
  Settings shows and edits the real seeded company → Financial Years shows the seeded current FY
  → "Create Next FY" adds a real new FY → Activate makes it Current and correctly demotes the old
  one → Billing & Subscription shows the static free page → Print Formats shows all 11 document
  types with seeded defaults → built a genuinely new template end-to-end (name → document type →
  field/text blocks → live preview → save) and confirmed it appears → WhatsApp template edits
  persist across a reload → Backup & Restore's "Current Database" stats are real, "Backup Now"
  produces a real Backup History row, "Download Backup" downloads a real valid JSON file,
  "Restore as Archive" (using that same real downloaded file) produces a real Archive entry →
  created a real job card and confirmed "Print Job Card" opens a real print window containing the
  actual customer's name, and the WhatsApp button's link is built from the real configured
  template rather than a hardcoded string. Also re-ran `verify-phase5.mjs` (19/19),
  `verify-phase6.mjs` (13/13), `verify-phase7.mjs` (28/28), `verify-phase8.mjs` (23/23),
  `verify-phase9.mjs` (27/27), and `verify-gating.mjs` (8/8) afterward — zero regression from this
  phase's changes to the shared Job Card action buttons and Second Hand Device print button group,
  both used since Phase 5/7.

### ⚠️ Action needed from you

1. **`firestore.rules`/`storage.rules` (and `firestore.indexes.json`) are written but still NOT
   deployed** — this carries over from Phase 2, still true, and now also covers `storage.rules`
   (Phase 5, for Job Card images, and now Phase 7's Second Hand Device photos too), Phase 6's
   extensions to the `receipts`/`jobCards` match blocks, Phase 7's new rules for
   `uom`/`itemCategories`/`paymentModes`/`partyCategories`/`secondHandPurchases`/
   `secondHandSales`, a previously-missing `counters` rule fixed in Phase 7, and now this phase's
   own new rules for `auditLog` (append-only, `create` gated only by company membership, `read`
   gated by the System Audit menu permission), `sessions` (narrow-diff update, own-session-only),
   and `ipWhitelist` (company-wide read, menu-gated write) — plus, most importantly, the
   `belongsToCompany()` helper itself now also checks `myUserDoc().data.status == 'active'`,
   which nearly every rule in the file depends on (see "Phase 8 decisions" above for why this was
   a real, previously-unenforced security gap, not just a new feature's rule). Phase 9 added
   `fieldVisits` (append-only, `create` gated by the Job Cards menu permission since it's written
   by that same action, `read` gated only by company membership). This phase adds:
   `printTemplates` (bootstrap-or-menu-gated create/update, protected-row-guarded delete, same
   shape as `uom`/`itemCategories`), `whatsappConfig` and `backupSettings` (single fixed docs,
   gated by the `settings/whatsapp`/`settings/backup` menu keys), `backups` and `archives`
   (append-only metadata — the real JSON payloads live in Firebase Storage, not Firestore). Also
   extends `storage.rules` with `companies/{companyId}/backups/{fileName}` and
   `.../archives/{fileName}` (same coarser-than-Firestore, authenticated-only boundary as the
   existing Job Card/Second Hand Device photo paths, for the same named-database reason). Update
   since then:
   `npx firebase-tools` itself works fine in this environment (confirmed — it resolves and runs);
   what's actually missing is an authenticated session, and `firebase login`'s browser OAuth flow
   can't complete headlessly from here. This is now genuinely one command away on your end:
   ```
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
   ```
   or paste each file's contents into Firebase Console (Firestore Database → Rules, and Storage
   → Rules). Once you've run `firebase login` on this machine, tell me and I can likely run the
   `deploy` command myself from here (it reads the same cached CLI credential). Every test above
   still ran against your project's actual _current_ rules (not these files), same caveat as
   every phase before — worth a re-run of the full flow once deployed, to confirm it still works
   _because of_ the new rules (especially the `belongsToCompany()` status check), not despite them.
2. **More test data accumulated in your real project this phase** — on top of Phase 2's five
   throwaway companies, Phase 3's live testing (including the race-condition reproduction, which
   deliberately created several intentionally-broken/orphaned accounts to verify the recovery
   flow) added roughly a dozen more, Phase 4's verification added a couple more still ("Phase4
   Verify Co", "Debug JC Co"), Phase 5's added a handful more ("Phase5 Verify Co", "Gating
   Verify Co", "Debug Timeline Co", etc.), Phase 6/7's added several more still ("Phase6
   Verify Co", "Phase7 Verify Co", "Debug1–6 Co", "Breadcrumb Co", etc.), Phase 8's own
   extensive debugging session added the most yet — well over a dozen companies named "Phase8
   Verify Co" (one per verification run, each with an Owner + a Technician teammate account),
   plus a handful of "Debug8...Co" ones from earlier in that session's troubleshooting — including
   real job cards, sessions, audit-log entries, IP whitelist entries, and disabled/re-enabled
   teammate accounts under those test companies, Phase 9 added a couple more ("Phase9
   Verify Co", one per run) with a real job card, costed job, quick-added supplier Party, and
   logged field visit under each, and this phase added a few more still ("Phase10 Verify Co",
   "DebugFY...Co", "DebugPrint Co", etc.) with real extra branches, a real Storage backup file
   and its restored archive copy, and a custom print template, under each. All Auth emails end in
   `@aim-buildtest.test`
   (never actually emailed) and company names are obviously test data. Same offer as before: I
   can sign in as each and self-delete the Auth account, but can't delete the Firestore documents
   themselves (the rules deliberately forbid deleting a company at all). Let me know if you'd like
   the Auth accounts cleaned up, or would rather clear everything yourself via Firebase Console,
   or just leave it.
3. Not a new blocker, just carried forward: Phase 2's cleanup used a broad `taskkill /F /IM
   node.exe /T` at one point, stopping every Node process on the machine, not just this one's.
   This phase's own cleanup was more surgical (exact PIDs via `netstat`), but flagging again in
   case it wasn't seen the first time.

### Still open

- Local rules testing via the Firestore emulator was not possible in this environment — the
  emulator requires a JRE and `java` isn't installed here. All rules verification so far is
  therefore against the real project's _current_ (not-yet-updated) rules, not against
  `firestore.rules` itself. Once you deploy, a re-run of the signup flow is the practical
  substitute for emulator unit tests.
