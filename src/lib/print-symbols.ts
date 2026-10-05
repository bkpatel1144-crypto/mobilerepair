import qrcode from 'qrcode-generator'

/**
 * Real, scannable Barcode and QR symbols for printed templates.
 *
 * Both used to print as the raw value in a monospace dashed box, on the stated grounds that a
 * fake bar pattern no scanner could read would be worse than honest text. That reasoning was
 * right about fake patterns and wrong about the conclusion, because this app *has* a scanner:
 * Scan Job Card decodes QR with `jsqr` and looks the job up by number. So the loop was open at
 * exactly one point — the app could read a label it was constitutionally unable to print.
 *
 * Output is inline SVG with no external request, which matters because printed HTML is opened
 * in a blank popup with no network guarantees and `<img src="https://…">` would print as a
 * broken box. SVG also scales to whatever mm the element was sized to without going fuzzy,
 * which a canvas bitmap would.
 */

/** Quiet zone, in modules. Below 4 the spec says a reader may fail; scanners vary. */
const QR_QUIET = 4

/**
 * A QR symbol sized to fill its box.
 *
 * Error correction M (~15%) rather than L: these go on devices that sit in a workshop, get
 * handled with dirty fingers and sometimes a smear of thermal paper wear, and the extra
 * redundancy costs a slightly denser symbol and nothing else.
 */
export function qrSvg(text: string): string {
  const qr = qrcode(0, 'M') // 0 = pick the smallest version that fits
  qr.addData(text)
  qr.make()

  const count = qr.getModuleCount()
  const size = count + QR_QUIET * 2
  const rects: string[] = []
  for (let row = 0; row < count; row++) {
    // Run-length the dark modules across each row: one <rect> per run instead of per module
    // turns a 25×25 symbol from 300-odd elements into a few dozen, which keeps the printed
    // document small enough to hand to `document.write`.
    let runStart = -1
    for (let col = 0; col <= count; col++) {
      const dark = col < count && qr.isDark(row, col)
      if (dark && runStart === -1) runStart = col
      if (!dark && runStart !== -1) {
        rects.push(
          `<rect x="${runStart + QR_QUIET}" y="${row + QR_QUIET}" width="${col - runStart}" height="1"/>`
        )
        runStart = -1
      }
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `width="100%" height="100%" shape-rendering="crispEdges">` +
    `<rect width="${size}" height="${size}" fill="#fff"/>` +
    `<g fill="#000">${rects.join('')}</g></svg>`
  )
}

// ---- Code 128 -------------------------------------------------------------
// Hand-written rather than a second dependency: the symbology is a lookup table and a weighted
// checksum, and the whole thing is shorter than the code needed to wrap a library.

/**
 * The canonical Code 128 pattern table: 107 symbols, each a run of bar/space module widths
 * starting with a bar. Values 0–102 are data, 103–105 are the Start codes, 106 is Stop.
 *
 * Every data symbol is exactly 11 modules wide and six runs long; Stop is 13 modules and seven.
 * `print-symbols.test.ts` asserts both, which is the check that matters here — the first draft
 * of this table was typed by hand, came out 536 characters instead of 642, and would have
 * printed confident garbage on every label.
 */
const CODE128_PATTERNS = [
  '212222',
  '222122',
  '222221',
  '121223',
  '121322',
  '131222',
  '122213',
  '122312',
  '132212',
  '221213',
  '221312',
  '231212',
  '112232',
  '122132',
  '122231',
  '113222',
  '123122',
  '123221',
  '223211',
  '221132',
  '221231',
  '213212',
  '223112',
  '312131',
  '311222',
  '321122',
  '321221',
  '312212',
  '322112',
  '322211',
  '212123',
  '212321',
  '232121',
  '111323',
  '131123',
  '131321',
  '112313',
  '132113',
  '132311',
  '211313',
  '231113',
  '231311',
  '112133',
  '112331',
  '132131',
  '113123',
  '113321',
  '133121',
  '313121',
  '211331',
  '231131',
  '213113',
  '213311',
  '213131',
  '311123',
  '311321',
  '331121',
  '312113',
  '312311',
  '332111',
  '314111',
  '221411',
  '431111',
  '111224',
  '111422',
  '121124',
  '121421',
  '141122',
  '141221',
  '112214',
  '112412',
  '122114',
  '122411',
  '142112',
  '142211',
  '241211',
  '221114',
  '413111',
  '241112',
  '134111',
  '111242',
  '121142',
  '121241',
  '114212',
  '124112',
  '124211',
  '411212',
  '421112',
  '421211',
  '212141',
  '214121',
  '412121',
  '111143',
  '111341',
  '131141',
  '114113',
  '114311',
  '411113',
  '411311',
  '113141',
  '114131',
  '311141',
  '411131',
  '211412',
  '211214',
  '211232',
  '2331112',
] as const

/** The run widths for one Code 128 symbol, alternating bar, space, bar, … */
export function patternFor(value: number): number[] {
  return [...CODE128_PATTERNS[value]].map(Number)
}

/** `true` when every character is encodable in Code 128 set B (ASCII 32–126). */
export function isCode128Encodable(text: string): boolean {
  return text.length > 0 && [...text].every((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126)
}

/**
 * A Code 128 (set B) barcode as inline SVG.
 *
 * Set B covers digits, upper and lower case and punctuation, which is every job number, invoice
 * number and IMEI this app produces. Returns `null` for anything it cannot encode, so the caller
 * can fall back to printing the text rather than printing a symbol that lies.
 */
export function code128Svg(text: string): string | null {
  if (!isCode128Encodable(text)) return null

  const START_B = 104
  const STOP = 106
  const values = [START_B, ...[...text].map((c) => c.charCodeAt(0) - 32)]

  // Modulo-103 checksum, each symbol weighted by its position (the start char has weight 1).
  let sum = START_B
  for (let i = 1; i < values.length; i++) sum += values[i] * i
  values.push(sum % 103)
  values.push(STOP)

  const bars: string[] = []
  let x = 10 // quiet zone, in modules
  for (const value of values) {
    const widths = patternFor(value)
    widths.forEach((w, i) => {
      if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="100"/>`) // even = bar
      x += w
    })
  }
  const total = x + 10 // trailing quiet zone

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} 100" ` +
    `preserveAspectRatio="none" width="100%" height="100%" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="100" fill="#fff"/>` +
    `<g fill="#000">${bars.join('')}</g></svg>`
  )
}
