/**
 * Rasterises `public/favicon.svg` into the PNG sizes that SVG alone does not cover.
 *
 * The SVG handles Chrome, Firefox and Edge tabs. These do not read it:
 *  - Safari and iOS ignore SVG for `apple-touch-icon`, so an iPhone "Add to Home Screen" would
 *    fall back to a screenshot of the page.
 *  - Android's install prompt wants a 192 and a 512 in the manifest, and a `maskable` entry so
 *    the launcher can crop it to whatever shape the device uses instead of putting the icon in a
 *    white circle.
 *
 * Run after editing the SVG: node tools/icons/build-icons.cjs
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '../..')
const SRC = path.join(ROOT, 'public/favicon.svg')
const OUT = path.join(ROOT, 'public')

/** `apple-touch-icon` is composited on a white background by older iOS, so it is rendered at the
 * full bleed of the teal tile rather than transparent. */
const TARGETS = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'favicon-180.png', size: 180 }, // apple-touch-icon
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]

async function main() {
  const svg = fs.readFileSync(SRC)
  for (const { file, size } of TARGETS) {
    await sharp(svg, { density: 384 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, file))
    const bytes = fs.statSync(path.join(OUT, file)).size
    console.log(`  ${file.padEnd(18)} ${size}x${size}  ${(bytes / 1024).toFixed(1)} kB`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
