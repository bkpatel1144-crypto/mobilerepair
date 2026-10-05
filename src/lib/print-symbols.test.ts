import { describe, it, expect } from 'vitest'
import jsQR from 'jsqr'
import { qrSvg, code128Svg, isCode128Encodable, patternFor } from '@/lib/print-symbols'

/**
 * The structural checks here exist because the first draft of the Code 128 table was typed by
 * hand and was wrong — 536 characters where 642 were needed — and nothing about the generated
 * SVG looked wrong enough to notice. A barcode that is subtly malformed prints perfectly and
 * fails silently at the one moment it matters, with a customer's device in someone's hand.
 *
 * The QR test is the one that proves the loop closes: it renders the symbol, rasterises it, and
 * decodes it with `jsqr` — the very decoder `scan-job-card-modal.tsx` uses. If that passes, a
 * printed label is readable by this app's own scanner, which is the whole point of the feature.
 */

describe('Code 128 pattern table', () => {
  it('has all 107 symbols', () => {
    expect(() => patternFor(106)).not.toThrow()
    expect(patternFor(106)).toHaveLength(7) // Stop is the only seven-run symbol
  })

  it('every data symbol is exactly 11 modules wide and six runs long', () => {
    for (let value = 0; value <= 105; value++) {
      const runs = patternFor(value)
      expect(runs, `symbol ${value} run count`).toHaveLength(6)
      expect(
        runs.reduce((a, b) => a + b, 0),
        `symbol ${value} module width`
      ).toBe(11)
    }
  })

  it('the stop symbol is 13 modules', () => {
    expect(patternFor(106).reduce((a, b) => a + b, 0)).toBe(13)
  })

  it('has no duplicate patterns — a repeat would make two characters indistinguishable', () => {
    const seen = new Set<string>()
    for (let value = 0; value <= 106; value++) seen.add(patternFor(value).join(''))
    expect(seen.size).toBe(107)
  })
})

describe('code128Svg', () => {
  it('encodes a job number', () => {
    const svg = code128Svg('JC-2026-27-00041')
    expect(svg).toContain('<svg')
    expect(svg).toContain('<rect')
  })

  it('refuses what set B cannot carry, rather than printing a lie', () => {
    expect(isCode128Encodable('JC-2026-27-00041')).toBe(true)
    expect(isCode128Encodable('')).toBe(false)
    expect(isCode128Encodable('देवनागरी')).toBe(false)
    expect(code128Svg('देवनागरी')).toBeNull()
  })

  it('carries a checksum symbol — the width arithmetic only works if it is there', () => {
    // A Code 128 symbol is: Start (11) + n data (11 each) + checksum (11) + Stop (13), plus a
    // 10-module quiet zone at each end. Drop the checksum and every barcode is 11 modules
    // short, which is precisely the kind of error that still prints and still looks fine.
    const widthFor = (text: string) => Number(code128Svg(text)!.match(/viewBox="0 0 (\d+)/)![1])
    for (const text of ['A', 'AB', 'JC-2026-27-00041']) {
      expect(widthFor(text), `width of "${text}"`).toBe(11 * (2 + text.length) + 13 + 20)
    }
  })

  it('is wider for longer input — each character adds 11 modules', () => {
    const short = Number(code128Svg('AB')!.match(/viewBox="0 0 (\d+)/)![1])
    const long = Number(code128Svg('ABCD')!.match(/viewBox="0 0 (\d+)/)![1])
    expect(long - short).toBe(22)
  })
})

describe('qrSvg', () => {
  it('produces an SVG with a quiet zone', () => {
    const svg = qrSvg('JC-2026-27-00041')
    expect(svg).toContain('<svg')
    const size = Number(svg.match(/viewBox="0 0 (\d+)/)![1])
    // 21 modules is the smallest QR; plus 4 modules of quiet zone each side.
    expect(size).toBeGreaterThanOrEqual(21 + 8)
  })

  /**
   * The round trip. Rasterises the SVG by reading its rects directly — no browser, no canvas —
   * then hands the pixel buffer to `jsqr` exactly as the camera scanner does.
   */
  it('round-trips through jsqr, the decoder Scan Job Card uses', () => {
    const text = 'JC-2026-27-00041'
    const svg = qrSvg(text)
    const size = Number(svg.match(/viewBox="0 0 (\d+)/)![1])

    const SCALE = 4
    const px = size * SCALE
    const data = new Uint8ClampedArray(px * px * 4).fill(255) // white

    for (const m of svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="1"\/>/g)) {
      const [x, y, w] = [Number(m[1]), Number(m[2]), Number(m[3])]
      for (let dy = 0; dy < SCALE; dy++) {
        for (let dx = 0; dx < w * SCALE; dx++) {
          const i = ((y * SCALE + dy) * px + (x * SCALE + dx)) * 4
          data[i] = data[i + 1] = data[i + 2] = 0
        }
      }
    }

    const decoded = jsQR(data, px, px)
    expect(decoded?.data).toBe(text)
  })

  it('round-trips a longer value too', () => {
    const text = 'https://aim-enterprise.web.app/app/service/job-cards/Nnqh9mY1HWLS3D1rkr0Z'
    const svg = qrSvg(text)
    const size = Number(svg.match(/viewBox="0 0 (\d+)/)![1])
    const SCALE = 4
    const px = size * SCALE
    const data = new Uint8ClampedArray(px * px * 4).fill(255)
    for (const m of svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="1"\/>/g)) {
      const [x, y, w] = [Number(m[1]), Number(m[2]), Number(m[3])]
      for (let dy = 0; dy < SCALE; dy++) {
        for (let dx = 0; dx < w * SCALE; dx++) {
          const i = ((y * SCALE + dy) * px + (x * SCALE + dx)) * 4
          data[i] = data[i + 1] = data[i + 2] = 0
        }
      }
    }
    expect(jsQR(data, px, px)?.data).toBe(text)
  })
})
