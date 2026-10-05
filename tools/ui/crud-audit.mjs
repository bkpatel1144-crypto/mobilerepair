/**
 * Which screens let a shopkeeper fix a mistake, and which only let them make one.
 *
 *   node tools/ui/crud-audit.mjs
 *
 * Every list screen shows records someone typed. A screen that can create but not edit or
 * delete is a one-way door: a party added with a wrong mobile, an item priced wrong, an expense
 * entered twice — all permanent.
 *
 * The judgement this turns on is *which* screens own their rows, so it is written out below
 * rather than inferred. A first version of this tool simply flagged every screen without a
 * pencil and a bin, which put "add delete to the audit log" and "add edit to the P&L report" on
 * the list — advice that would make the app worse. Counting is easy; knowing what should be
 * counted is the work.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = 'src/pages/app'

/**
 * Screens that do NOT own their rows, and must not offer edit or delete. Three reasons:
 *
 *  - **Derived.** Stock is purchases minus what jobs consumed; a ledger is receipts and
 *    invoices added up. Editing the view would do nothing, or quietly contradict the records it
 *    is computed from.
 *  - **Immutable by purpose.** An audit log you can edit is not an audit log.
 *  - **A report.** Nothing is stored here at all.
 *
 * The registers are reports *of* purchases and sales; those records are edited on the Device
 * Purchase and Device Sale screens, which are deliberately not in this list.
 */
const READ_ONLY = new Set([
  'administration/login-report-page.tsx',
  'administration/system-audit-page.tsx',
  'finance/cash-book-page.tsx',
  'finance/party-ledger-page.tsx',
  'finance/receivables-page.tsx',
  'finance/supplier-payables-page.tsx',
  'inventory/stock-page.tsx',
  'reports/field-visit-report-page.tsx',
  'reports/job-wise-profit-page.tsx',
  'reports/period-summary-page.tsx',
  'reports/service-reports-page.tsx',
  'reports/supplier-report-page.tsx',
  'reports/technician-report-page.tsx',
  'second-hand-device/device-stock-page.tsx',
  'second-hand-device/purchase-register-page.tsx',
  'second-hand-device/sale-register-page.tsx',
  'service/job-costing-page.tsx',
])

/**
 * Records that are financial or sequence-bound: corrected by *voiding*, never by deleting.
 * Deleting an invoice puts a hole in a GST series that must be gapless, and a deleted receipt
 * is money that was taken and now has no record.
 */
const VOID_NOT_DELETE = new Set([
  'finance/expenses-page.tsx',
  'finance/receipts-payments-page.tsx',
  'sales/sales-invoices-page.tsx',
  'second-hand-device/device-purchase-page.tsx',
  'second-hand-device/device-sale-page.tsx',
])

/**
 * A financial year is locked, never deleted — deleting one would orphan every invoice and
 * receipt numbered inside it.
 */
const LOCK_NOT_DELETE = new Set(['settings/financial-years-page.tsx'])

/** Rows that are sessions, not records: the action is "revoke", not "delete". */
const REVOKE = new Set(['administration/active-sessions-page.tsx'])

/** Job cards are opened, not edited in place — the detail screen owns their whole lifecycle. */
const DETAIL_OWNED = new Set(['service/job-cards-page.tsx'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.tsx') && !name.endsWith('.test.tsx')) out.push(p)
  }
  return out
}

const rows = []
for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8')
  if (!/DataTable|ExpandableTable/.test(src)) continue

  const rel = file.replace(/\\/g, '/').replace('src/pages/app/', '')
  rows.push({
    rel,
    create: /Add [A-Z]|Create [A-Z]|New [A-Z]|setCreating/.test(src),
    edit: /Pencil|setEditing|onEdit\b|editing(Id|Row|Item)?\s*[,)=]|\/edit/.test(src),
    // A soft delete is the right pattern for anything with history behind it, so Disable and
    // Deactivate count. A row a job card has already referenced cannot simply vanish.
    // Terms specific enough not to collide with the `disabled=` attribute that sits on almost
    // every button in the app — matching that made every screen look like it had a delete.
    del: /Trash2?\b|useDelete|handleDelete|onDelete\b|setDeleting|[Dd]eactivate|disableUser|useSetUserStatus/.test(
      src
    ),
    locked: /Lock|closeYear/i.test(src),
    voided: /voided|voidReceipt|useVoid|Void/.test(src),
    revoke: /revoke|signOut|terminate/i.test(src),
    open: /onRowClick|navigate\(/.test(src),
  })
}

function expectation(r) {
  if (READ_ONLY.has(r.rel)) return { kind: 'read-only', missing: [] }
  if (DETAIL_OWNED.has(r.rel)) {
    return { kind: 'opens detail', missing: r.open ? [] : ['a way to open the record'] }
  }
  if (REVOKE.has(r.rel)) return { kind: 'revoke', missing: r.revoke ? [] : ['revoke'] }
  if (LOCK_NOT_DELETE.has(r.rel)) {
    return { kind: 'edit + lock', missing: [!r.edit && 'edit', !r.locked && 'lock'].filter(Boolean) }
  }
  if (VOID_NOT_DELETE.has(r.rel)) {
    return {
      kind: 'edit + void',
      missing: [!r.edit && 'edit', !r.voided && 'void'].filter(Boolean),
    }
  }
  return {
    kind: 'edit + delete',
    missing: [!r.edit && 'edit', !r.del && 'delete'].filter(Boolean),
  }
}

rows.sort((a, b) => a.rel.localeCompare(b.rel))
for (const r of rows) r.exp = expectation(r)
const gaps = rows.filter((r) => r.exp.missing.length)

console.log(`${rows.length} list screens · ${gaps.length} with a real gap\n`)
console.log(`${'screen'.padEnd(50)} ${'expected'.padEnd(14)} has`)
console.log('-'.repeat(94))
for (const r of rows) {
  const has =
    [
      r.create && 'add',
      r.edit && 'edit',
      r.del && 'delete',
      r.voided && 'void',
      r.revoke && 'revoke',
    ]
      .filter(Boolean)
      .join(', ') || '(none)'
  const flag = r.exp.missing.length ? `   <-- missing ${r.exp.missing.join(' + ')}` : ''
  console.log(`${r.rel.padEnd(50)} ${r.exp.kind.padEnd(14)} ${has}${flag}`)
}

console.log(`\n${gaps.length} to fix:`)
for (const r of gaps) console.log(`  ${r.rel} — needs ${r.exp.missing.join(' + ')}`)
const ro = rows.filter((r) => r.exp.kind === 'read-only').length
console.log(
  `\n${ro} screens are deliberately read-only (derived views, audit trails, reports) and are ` +
    `not gaps. See READ_ONLY in this file for why each one is there.`
)
