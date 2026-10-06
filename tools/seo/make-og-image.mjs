/**
 * Renders `public/og-image.png`, the card that appears when someone shares a link.
 *
 *   node tools/seo/make-og-image.mjs
 *
 * A link shared to WhatsApp — which is how a repair shop will actually send this to another
 * repair shop — shows a large image or it shows a grey box. The tags referenced an og-image
 * that had never been created, so every share was the grey box.
 *
 * Rendered from HTML with Playwright, which is already a dev dependency, rather than committing
 * a binary nobody can edit. Re-run it after changing the wording and the file regenerates.
 * 1200×630 is the size every platform crops from.
 */
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'

const seo = JSON.parse(await readFile('src/data/site-seo.json', 'utf8'))

const html = `<!doctype html>
<meta charset="utf-8" />
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; display: flex; flex-direction: column;
    justify-content: space-between; padding: 72px;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    color: #fff;
    background:
      radial-gradient(900px 600px at 85% -10%, rgba(0,187,167,0.35), transparent),
      radial-gradient(700px 500px at -5% 110%, rgba(0,120,160,0.30), transparent),
      #0b1b22;
  }
  .brand { display: flex; align-items: center; gap: 18px; }
  .mark {
    width: 64px; height: 64px; border-radius: 18px; background: #00b3a4;
    display: flex; align-items: center; justify-content: center;
    font-size: 38px; font-weight: 700; color: #04221f;
  }
  .name { font-size: 40px; font-weight: 700; letter-spacing: -0.03em; }
  .org { font-size: 17px; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.6; }
  h1 {
    font-size: 72px; line-height: 1.05; font-weight: 600; letter-spacing: -0.035em;
    max-width: 17ch;
  }
  p { font-size: 27px; line-height: 1.4; opacity: 0.78; max-width: 40ch; margin-top: 22px; }
  .row { display: flex; gap: 12px; }
  .chip {
    font-size: 19px; padding: 11px 20px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.22); background: rgba(255,255,255,0.06);
  }
</style>
<div class="brand">
  <div class="mark">a</div>
  <div>
    <div class="name">aim</div>
    <div class="org">${seo.orgName}</div>
  </div>
</div>
<div>
  <h1>Run your whole repair shop in one place</h1>
  <p>Job cards, technician workflow, WhatsApp updates, GST billing and warranty.</p>
</div>
<div class="row">
  <div class="chip">Job cards</div>
  <div class="chip">GST billing</div>
  <div class="chip">WhatsApp updates</div>
  <div class="chip">Works offline</div>
</div>
`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.screenshot({ path: 'public/og-image.png' })
await browser.close()
console.log('wrote public/og-image.png (1200x630)')
