# Public web rebuild

The plan for the pre-login experience: 9 public pages and 4 auth screens, rebuilt from scratch.

## Why

The site that existed was two pages. Measured against what it needs to do — convince a repair-shop
owner to trust their whole business to this software — it had specific, fixable problems:

| Problem                                        | Evidence                                                                                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content sat in a narrow column on wide screens | `max-w-6xl` (1152px) inside a 1440px viewport, with `max-w-2xl` headings and `max-w-3xl` FAQ inside that. Roughly a third of the screen was margin.                          |
| The hero cut off mid-mockup                    | The dark band ended at a hard horizontal edge while the product mockup straddled it, so the seam landed across the image.                                                    |
| Pricing was one card in empty white            | 1010px of page for a single 400px card.                                                                                                                                      |
| No product, no proof                           | One hand-drawn mockup, no screenshots, no numbers, no customers.                                                                                                             |
| Flat, uniform surfaces                         | Every card a 1px border and `p-5`; every section `py-16`. Nothing signalled what mattered most.                                                                              |
| Only two pages                                 | "Features" and "Workflow" in the nav were anchors on the home page, not pages. Nothing to rank, nothing to link, nothing to send a customer.                                 |
| A different company's email                    | "Book a demo" opened `mailto:hello@kiwikitservice.com`.                                                                                                                      |
| The headline was untranslated                  | `<h1>Run your repair shop with aim</h1>` never went through `t()`, so Hindi and Gujarati visitors read English in the largest text on the site. Same for "Login" in the nav. |

## Rules this rebuild follows

1. **Use the full width.** One `Container` primitive, `max-w-[92rem]` with padding that scales
   5→8→12→16 by breakpoint. Section backgrounds are full-bleed; only the text inside a reading
   column is ever narrowed, and never below what the line length actually needs.
2. **Every screen size.** Verified at 375, 414, 768, 1024, 1280, 1440 and 1920. Fluid type via
   `clamp()` rather than breakpoint jumps, so nothing snaps between sizes.
3. **Trilingual.** Every string through `t()`, keys added to `en`/`hi`/`gu` together. Enforced by
   `no-hardcoded-strings.test.ts`, which is what the old headline slipped past.
4. **Honest.** No invented testimonials, no fake customer logos, no made-up numbers. Sections are
   designed to work without social proof, with marked slots for when there is some.
5. **Real product.** Screenshots captured from the live app with Playwright, not drawings.

## Pages

### Public

| Route                | Purpose                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/`                  | Home. Hero with real product, the problem it solves, the six capabilities, the workflow, pricing summary, CTA. |
| `/features`          | Every module in depth, grouped: service, finance, second-hand, masters, administration, settings.              |
| `/pricing`           | One free plan, stated confidently — what's included, why it's free, what happens to your data.                 |
| `/solutions`         | Who it's for: single repair shop, second-hand dealer, multi-branch operation.                                  |
| `/about`             | AIM ENTERPRISE — who builds this and why.                                                                      |
| `/contact`           | Contact details, demo request, support routes.                                                                 |
| `/faq`               | The full question set, grouped, not four items in a narrow box.                                                |
| `/privacy`, `/terms` | Legal. Required before anyone will enter customer data.                                                        |

### Auth (restyled, not rewired)

`/login`, `/signup`, `/forgot-password`, `/complete-setup`. The signup and login _logic_ was just
repaired after a production outage — this pass changes presentation only, and the
`tools/firebase/e2e-signup.mjs` run has to stay green through it.

## Accessibility toolbar

A floating panel on every public page, and the same preferences manageable inside the app under
Settings:

| Control        | Behaviour                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Font size      | Steps the root font size up and down. Everything is in `rem`, so the whole page scales rather than one element. |
| High contrast  | Raises contrast to WCAG AAA on text and borders, in both light and dark themes.                                 |
| Dyslexia font  | Swaps the type stack for a dyslexia-friendly face with wider spacing.                                           |
| Listen to page | Reads the main content aloud via the browser's own speech synthesis — no service, no key, works offline.        |
| Reset all      | Clears every preference.                                                                                        |

Preferences persist per browser and apply to the app as well as the site, so a technician who
sets a larger font on the marketing page keeps it after signing in.

Inside the app the same controls appear as a third tab in the **My Profile** drawer, with labels
and explanations, off the same `useAccessibility()` hook. Not under Settings, deliberately:
Settings menu items are role-gated, and a Technician's whole access is
`menusForSections(['service'])`, so a Settings > Preferences page would be invisible to exactly
the staff most likely to need larger text. An accessibility control a permission can hide is not
an accessibility control. The profile drawer is reachable by every signed-in account.

## Order of work

1. Foundation: `Container`/`Section` primitives, fluid type scale, nav, footer.
2. Home.
3. Features, Pricing, Solutions.
4. About, Contact, FAQ, Privacy, Terms.
5. Auth screens.
6. Real product screenshots captured and dropped in.

Each stage: keys in all three languages, render tests extended, verified in a browser at every
width above, then `npm run verify:build` before any deploy — a bundle that renders a blank page
passes `tsc`, `eslint` and all 311 unit tests, which is how the last outage shipped.

## Needs filling before launch

Placeholders are marked `TODO(contact)` in `src/config/company.ts`:

- Registered address, phone, WhatsApp number, support email
- GSTIN, if it should appear in the footer
- Customer names or testimonials, once there are any
