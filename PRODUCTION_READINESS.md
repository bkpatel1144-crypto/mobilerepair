# PRODUCTION_READINESS.md — checked 15 September 2026

Everything below was measured against the **deployed** site at
   , not against a dev server and not by reading source. Where a check
disagreed with the app, the app was looked at before either was changed.

## Gates

| Gate | Result |
|---|---|
| `npm run typecheck` (`tsc -b`) | clean |
| `npm test` | 601 passing, 28 files |
| `npm run lint` | 0 errors, 1 warning (pre-existing, see below) |
| `npm run verify:build` | 3 byte-stable builds, React in one chunk |

The lint warning is React Compiler declining to memoize `create-user-page.tsx` because
react-hook-form's `watch()` returns a function it cannot memoize safely. It is a compiler notice,
not a defect.

## Security

- **Cross-tenant isolation: 21 of 21 paths denied.** One shop signed in cannot read another
  shop's job cards, parties, receipts, items, audit log or company document.
- **`companies` is not listable** by a normal tenant — confirmed by a script that tried and was
  refused.
- Firestore and Storage rules redeployed from the repo, both compiled clean.
- Storage rules are deliberately coarser than Firestore's: signed-in plus unguessable path ids,
  because Storage's `firestore.get()` can only read the `(default)` database and this project's
  is the named `mobilerepairing`. Recorded in `storage.rules`.

## Functional checks, all against the deployed site

| Area | Checks | Result |
|---|---|---|
| Every screen renders | 48 | clean — no placeholders, no crashes, no console errors |
| Mobile at 390px | 55 screens | clean — no overflow, no field under 260px, no tap target under 32px |
| Translations | 48 screens × 2 languages | clean — no raw keys, no lost button labels |
| Dropdowns | 52 across 50 screens | all open, list options, accept a choice |
| Add party from a picker | 14 | the real form, prefilled, selected back, in the master |
| Stock when fitting a part | 15 | blocks, names the shortfall, owner override lands on the timeline |
| Warranty + rework | 21 | 91 days left on a 3-month-old delivery, linked rework, original untouched |
| Offline behaviour | 16 | banner, cached reads, honest refusals, recovery |
| Offline job card creation | 16 | created with the line cut, in Firestore after a full reload |
| Company preferences | 21 | modules toggle, logo round-trips through Storage |
| Company toolbar | 13 | filters filter, CSV downloads |
| Attributes wiring | 19 | mandatory blocks the save, values survive |
| Fresh signup | end to end | Owner role, 5 roles seeded, no access denied |

## Known limits — deliberate, not defects

1. **Eight actions need a connection**: receipts, expenses, purchases, job costing, second-hand
   purchase and sale, supplier payables, bill edits, and Generate Bill. Each says so plainly
   rather than failing silently. This follows from the decision to keep the GST invoice series
   gapless — see `OFFLINE_NUMBERING.md`. Job cards, reworks and customers **do** work offline.
2. **A device must be online once** before it can create offline; that is when it reserves its
   block of numbers. A brand-new device says "no job card numbers left in reserve".
3. **Job card numbers can have gaps.** Invoice numbers cannot — that is the whole point of the
   separate `INV-` series.
4. **~40 screens have never been compared** to the competitor's. `SCREEN_INVENTORY.md` lists
   what each of ours contains so the comparison can be done a section at a time. Blocked on
   screenshots.
5. **Manufacturing module** is not built. Company Preferences offers the ten modules that exist.

## Before going live

- [ ] **Delete the `ZZ …` probe tenants.** Roughly two dozen, from Firestore `companies` *and*
      their sign-in accounts under Authentication. Both halves — deleting one leaves a real login
      pointing at a company that is gone. A client-SDK script cannot do this (see the security
      note above), so it is a console job. `tools/firebase/list-probe-companies.mjs` explains it.
- [ ] Decide whether the shop's own first company is created by signing up fresh, or by keeping
      an existing tenant.

Nothing on this list blocks launch; the probe tenants are clutter in the same project, not a
fault in the app.
