# NEXT_PHASES.md — what is left, phase by phase

`BUILD_PLAN.md` ends at Phase 11 and every phase in it is done. This file continues the same
numbering with the work that is still open, so there is one list to work through rather than a
pile of notes.

Rules carried over from `BUILD_PLAN.md` §2 and unchanged here: every phase is typechecked
(`tsc -b`), unit-tested, linted, run through `npm run verify:build`, deployed, and then **proved
in a real browser against the deployed site** with a probe that reports how much it examined.
A phase is not done because the code compiles.

## Order at a glance

| Phase                              | What it fixes                                     | Size    | Blocked on |
| ---------------------------------- | ------------------------------------------------- | ------- | ---------- |
| 12 — Make Masters real             | ✅ Done — Attributes now drives Item/Party/Job Card | Small   | —          |
| 13 — Parts & stock integrity       | ✅ Done — fitting a part is checked against stock  | Medium  | —          |
| 14 — After the sale                | ✅ Done — warranty lookup + linked rework          | Medium  | —          |
| 15 — Works on bad internet         | 11 hooks fail with no connection, silently        | Large   | —          |
| 16 — Finish the clone              | ~40 screens never compared to theirs              | Ongoing | Screenshots from you |

Phases 12–15 are independent of each other — the order below is by how much each one is
costing the shop today, not by dependency. Phase 16 can be slotted in whenever screenshots
arrive.

---

## Phase 12 — Make Masters real ✅ Done

**The problem.** Masters > Attributes stores name, code, applies-to, data type, mandatory and
values, and **nothing in the app reads any of it.** Create Item still asks the shopkeeper to
type variant attributes as free text (`create-item-page.tsx:664`), which is the exact problem
the Attributes screen was built to solve — "Colour", "colour" and "Color" still all become
different attributes. The Mandatory checkbox blocks nothing, anywhere.

**What ships.**

1. Create/Edit Item replaces the free-text Variant Attributes box with the attributes whose
   `appliesTo` is `item` — rendered by `dataType` (text / number / date / boolean / a real
   dropdown for `select`, fed by that attribute's own values).
2. `mandatory: true` actually refuses the save, with the error on the field.
3. Items keep storing attribute values against the attribute **code**, so renaming an
   attribute later does not orphan every item that used it.
4. The same treatment for `appliesTo: 'party'` (Customers/Suppliers) and `'jobCard'`, since the
   picker already offers those three and offering a choice that does nothing is worse than not
   offering it.
5. Existing items' free-text attributes are still displayed — no item loses data.

**Proof.** Create an attribute of each data type, one mandatory; open Create Item and confirm
each renders as the right control, that saving without the mandatory one is refused, and that
the values survive a reload. Then confirm an item created before this change still opens.

**Also in this phase (housekeeping).** Delete the `ZZ …` probe companies from Firestore — they
are test tenants from my own verification runs and are cluttering the console.

---

## Phase 13 — Parts & stock integrity ✅ Done

**The problem.** Nothing in `use-job-actions.ts` looks at on-hand stock. A technician can fit 5
screens when 1 was ever purchased; the Stock page simply shows a negative number afterwards and
no one is told. Stock exists as a report and not as a control.

**What ships.**

1. The Add Parts picker shows on-hand beside every part — the number is needed *at the moment
   of choosing*, not on a separate screen afterwards.
2. Fitting more than is on hand is blocked, with the shortfall named ("2 on hand, you are
   fitting 5").
3. An explicit override for the owner, recorded on the timeline — a real shop does fit a part
   that hasn't been entered into the system yet, and a block with no way past it gets worked
   around by not recording the part at all, which is worse.
4. Out-of-stock and below-reorder parts are flagged in the picker before they are chosen.
5. A low-stock count on the Dashboard so it is seen without opening Inventory.

**Proof.** Buy 1 of a part, fit 1 (allowed), fit another (blocked), override as owner (allowed,
and the override is on the timeline), and confirm Stock and the job card agree afterwards.

---

## Phase 14 — After the sale: warranty & rework ✅ Done

**The problem.** Two gaps that are really one gap — the returning customer.

`billWarranty` is written by Edit Bill and **read by nothing**. When someone walks back in with
the same phone, no screen answers "is this still under warranty?", which is the only reason to
record a warranty at all.

And there is no reopen path. A closed job that comes back has to be entered as a brand-new job
card, so the repair history breaks at exactly the point where history matters most — and the
shop cannot tell a repeat failure from a new customer.

**What ships.**

1. **Warranty lookup** — search by phone number, IMEI, job card number or invoice number;
   returns the job, what was fitted, the warranty recorded on each part and on the bill, and
   whether it is still live with the days remaining.
2. **Reopen / rework** — a delivered or closed job reopens as a *linked* rework job rather than
   an unrelated new one. Both cards link to each other, and the original's timeline records
   that it came back.
3. A rework inside warranty defaults to no charge, and the fact that it was a warranty job is
   recorded — otherwise the P&L quietly shows a free repair as a loss with no reason attached.
4. Repeat failures are visible: opening a job for a device shows what was done to it before.

**Proof.** Bill a job with a 6-month part warranty, deliver and close it, look the device up by
phone number, confirm the warranty reads as live with the right days left, reopen it as a
rework, and confirm both cards link and neither total is disturbed.

---

## Phase 15 — Works on bad internet

**The problem.** 11 hooks call `getNextSequence`, which is a Firestore **transaction**, and a
transaction cannot complete with no connection. Job cards, receipts, purchases, expenses,
parties, second-hand purchases and sales, costing, bill edits and supplier payables all fail
when the connection drops. There is no offline indicator either, so on a bad line the counter
staff get a failure with no explanation — and this is a shop counter, where losing connectivity
is normal, not an edge case.

Firestore's offline cache is already switched on (`persistentLocalCache`), so **reading** works
offline today. It is only creating anything with a number that does not.

**What ships, in two stages** — the first is small and honest, the second is the real fix:

**15a — stop failing silently.** An online/offline indicator in the shell, every
sequence-dependent action clearly disabled while offline with the reason given, and queued
writes surfaced instead of appearing to have saved. This does not make the app work offline; it
stops it lying about it, and it is a day's work rather than a week's.

**15b — create offline for real.** Sequence numbers reserved in a way that does not need a live
transaction, so job cards and receipts can be created on a dead connection and reconcile when
it returns. This is a genuine design change with a real risk — two devices offline at once must
not mint the same `JC-2026-27-00001` — so it gets its own design note before any code, and it
is the one piece of work here I would not rush.

**Proof.** With the network cut in DevTools: the indicator appears, an existing job card still
opens from cache, and (after 15b) a new job card is created, gets a number, and is in Firestore
with the right number once the network returns.

---

## Phase 16 — Finish the clone

**The problem.** ~40 screens have never been compared to the competitor's, because I have not
seen them. Comparing from source reading has twice reported screens as matching while they
looked nothing alike, so this needs screenshots, not guesses.

**Known and ready to do now:** Company Management is missing its **Filters** button and its
**More Actions** button. (The "Viewing: …" chip is already there.)

**Waiting on screenshots**, by section:

| Section            | Screens | 
| ------------------ | ------- |
| Settings           | 8       |
| Finance            | 7       |
| Reports            | 7       |
| Masters            | 7       |
| Administration     | 5       |
| Second Hand Device | 5       |
| Dashboard          | 1       |

Send whichever section matters most and it gets the same treatment Attributes and Company
Preferences got: read every screenshot first, match the screen, deploy, prove it in the
browser, and screenshot both side by side before calling it done.

**Already confirmed matching, no work needed:** the job cards list (13 columns, 11 status
cards, filter chips), the 3-column expanded job card, the timeline and its 14 event types,
Role Configure's toolbar and bottom bar, and the job-card → bill flow including Edit Bill.

---

## Deliberate differences from the competitor

Not gaps — decisions, recorded here so they are not "fixed" by mistake later:

- **Manufacturing module.** Their Company Preferences lists one. This app has no Manufacturing
  menus, so a toggle for it would switch nothing off. Only the ten modules that exist are
  offered. Say the word if the module itself should be built.
- **57 menus vs their 52.** Deliberate — ours includes General Purchase, Stock and Attributes.
- **GST is optional.** Their app assumes GST registration; small shops often are not
  registered, so `gstRegistration` drives whether tax is split at all.
- **Storage rules are coarser than Firestore's.** Signed-in plus unguessable path IDs, not a
  per-tenant check — Storage's `firestore.get()` can only read the `(default)` database and
  this project's is the named `mobilerepairing`. Revisit if a phase needs the stronger
  guarantee.
