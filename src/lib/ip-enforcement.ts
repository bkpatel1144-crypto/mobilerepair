/**
 * IPv4-only address/CIDR matching for the IP Whitelist feature (`preview (19)`).
 *
 * **This can only ever be advisory, never a real security boundary** — BUILD_PLAN.md Phase 8
 * calls this out explicitly. True IP enforcement has to happen at the network edge or in a
 * server that terminates the request (a Cloud Function, an edge middleware); this project is
 * client-SDK-only by design (no Admin SDK, no server component at all), so every check here runs
 * *inside* the very browser tab a bad actor controls — trivially bypassable by editing
 * `localStorage`/intercepting the `fetch` this file makes, or simply not running this JS at all
 * against Firestore directly. It's kept anyway because it does what a real client-side feature
 * honestly can: nudge a legitimate team member who's traveled off a trusted network, and leave an
 * auditable trail (`auditLog` rows with `result: 'blocked'`) of when it fired. Never rely on this
 * as the actual reason sensitive data is protected — `firestore.rules`' own `belongsToCompany()`/
 * `hasMenuAccess()` checks are the real boundary, and stay fully in effect regardless of this.
 */

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const part of parts) {
    const octet = Number(part)
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null
    n = (n << 8) | octet
  }
  return n >>> 0
}

/** Accepts a bare IP ("103.21.244.10", treated as a /32) or CIDR ("103.21.244.0/24"). Returns
 * `null` for anything unparseable — callers treat that as "never matches," not "matches everything." */
function parseIpOrCidr(value: string): { network: number; mask: number } | null {
  const [ipPart, prefixPart] = value.trim().split('/')
  const ip = ipToInt(ipPart)
  if (ip == null) return null
  const prefix = prefixPart == null ? 32 : Number(prefixPart)
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  return { network: ip & mask, mask }
}

export function ipMatchesEntry(ip: string, ipOrCidr: string): boolean {
  const target = ipToInt(ip)
  const entry = parseIpOrCidr(ipOrCidr)
  if (target == null || entry == null) return false
  return (target & entry.mask) === entry.network
}

/** True if `ip` matches at least one *active* entry. An empty (or all-inactive) whitelist means
 * "nothing has been configured yet" — treated as "allow everyone," matching `preview (19)`'s own
 * framing of this as an opt-in feature, not a default-deny one a company must set up before its
 * first login works. */
export function isIpAllowed(ip: string | null, entries: { ipOrCidr: string; active: boolean }[]): boolean {
  const activeEntries = entries.filter((e) => e.active)
  if (activeEntries.length === 0) return true
  if (!ip) return false // can't prove membership in a non-empty whitelist without a detected IP
  return activeEntries.some((e) => ipMatchesEntry(ip, e.ipOrCidr))
}
