# OFFLINE_NUMBERING.md — design note for Phase 15b

Phase 15a is done and deployed: the app now tells the truth when the connection goes. Reading
works from cache, and anything that cannot save says so before the form is filled in.

15b is the real fix — **creating a job card with no connection**. This note exists because
`NEXT_PHASES.md` says that piece "gets its own design note before any code, and it is the one
piece of work here I would not rush." It ends with one question that only the shop can answer.

## Why it does not work today

Every human-readable id — `JC-2026-27-00001`, `RCP-…`, `PTY-…`, `PUR-…` — comes from
`getNextSequence()`, which is a Firestore `runTransaction` against a `counters/{docType}`
document. A transaction is a read round trip followed by a commit round trip. With no connection
there is no round trip, so there is no number, so there is no job card.

The transaction is not gratuitous. "Read the last number, add one, write it" races the moment
two people at the same counter create a job card in the same second, and the result is two job
cards with the same number — which is worse than not being able to create one at all.

## What makes this hard rather than fiddly

**The job number is the invoice number.** Sales Invoices lists jobs by `jobNumber`
(`sales-invoices-page.tsx:116`); there is no separate invoice series. So any scheme that puts
gaps in job numbering also puts gaps in what a GST-registered shop hands a customer as a tax
invoice number. Under Indian GST a tax invoice series is meant to be consecutive. For a shop that
is **not** registered — which is the common case this app deliberately supports, and why GST is
an optional setting — a gap means nothing at all.

That is the whole decision, and it is a business one, not a technical one.

## Options considered

**A. Reserve a block of numbers while online.** Each device, while connected, runs the existing
transaction once to claim a block (say 20 numbers) and keeps it in local storage. Offline it
takes numbers from its own block. No two devices can collide, because no two devices hold the
same block.

- Numbers are final the moment they are issued, so a printed job-card slip is never wrong.
- Unused numbers in a block are never issued: clearing browser data, or simply not using all 20,
  leaves **gaps**.
- Roughly a day's work, plus a migration-free rollout — the counter document is unchanged, it is
  just incremented by 20 instead of 1.

**B. Provisional number now, real number on sync.** Create offline with a placeholder, renumber
when the connection returns. Rejected: the customer walks out with a printed slip bearing a
number that later changes. A receipt whose number is not the number in the system is worse than
no offline support.

**C. Device-suffixed numbers** (`JC-2026-27-00001-A`). Rejected: it changes the format on every
printed document and diverges from the reference app the client is matching.

**D. Separate the two series.** Keep job numbers as internal work-order numbers (block-reserved,
gaps allowed, works offline) and mint a *separate* gapless `invoiceNumber` at Generate Bill,
which happens at the counter with the customer present and is the moment least likely to be
offline. This removes the tension entirely.

- It is the technically correct answer.
- It adds an invoice-number column the reference app does not have, so it is a **deliberate
  divergence from the clone** — and the clone requirement has been explicit throughout.
- Bigger: Sales Invoices, the print formats and Edit Bill all have to carry the new number.

**E. Do nothing more.** 15a already stops the silent failure. Job cards still need a connection.
Free, and honest, but the counter still cannot take in a device on a dropped line.

## Recommendation

**A for a shop that is not GST-registered; D for one that is.**

The app already knows which it is — `gstRegistration` on the company document, the setting added
so small shops are not forced into GST they do not have. That means the choice does not have to
be made once for everybody:

- Unregistered: reserve blocks, job cards work offline, gaps are harmless.
- Registered: either accept D's separate invoice series, or accept that job cards need a
  connection (E) and keep the tax series gapless.

What I will **not** do is quietly introduce gaps into the numbers a GST-registered shop presents
as tax invoices. That is a decision with legal consequences for the shop owner, not a detail to
absorb into an implementation.

## The question

> Is this app's typical shop GST-registered, and are gaps in job-card numbering acceptable?

- **"Not registered / gaps are fine"** → I build A. About a day. Job cards, and job cards with an
  advance, both work offline.
- **"Registered, keep invoice numbers gapless"** → I build D. Two to three days, and Sales
  Invoices gains an invoice-number column the competitor does not show.
- **"Leave it"** → 15a stands on its own and Phase 15 closes here.

## Scope note whichever way it goes

Receipts (`RCP-…`) are a separate series and the same reasoning applies to them independently. An
advance taken at intake mints one, so "create a job card with an advance, offline" needs the
receipt series solved too — under A that is the same block mechanism applied to a second counter.
