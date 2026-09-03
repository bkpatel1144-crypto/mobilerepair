/** A lightweight, regex-based "Browser on OS" label (`preview (20)`'s own "Device" column) — a
 * full UA-parsing library is more machinery than a cosmetic session-list label justifies. Falls
 * back to "Unknown Device" for anything genuinely unrecognized rather than guessing wrong. */
export function deviceLabelFromUserAgent(ua: string): string {
  const os = osFromUserAgent(ua)
  const browser = browserFromUserAgent(ua)
  if (!os && !browser) return 'Unknown Device'
  if (!os) return browser!
  if (!browser) return os
  return `${browser} on ${os}`
}

function osFromUserAgent(ua: string): string | null {
  if (/windows/i.test(ua)) return 'Windows'
  if (/mac os x|macintosh/i.test(ua)) return 'macOS'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/linux/i.test(ua)) return 'Linux'
  return null
}

function browserFromUserAgent(ua: string): string | null {
  // Order matters — Edge/Opera/Samsung Browser UAs also contain "Chrome" and "Safari" tokens.
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet'
  if (/firefox/i.test(ua)) return 'Firefox'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  return null
}

/** Collapsible "Technical details" section content in the Sessions detail drawer — the raw
 * string, verbatim, for whoever actually needs it beyond the friendly label. */
export function rawUserAgent(ua: string): string {
  return ua || 'Not captured'
}
