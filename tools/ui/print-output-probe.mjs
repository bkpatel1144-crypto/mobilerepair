/**
 * What comes out of Print, checked against the paper it was meant for.
 *
 *   node tools/ui/print-output-probe.mjs <base> <email> <password>
 *
 * Reads the generated print document directly rather than judging the designer's canvas: the
 * canvas can look right while `@page` is invalid and the printer silently falls back to A4.
 */
import { chromium } from 'playwright'
const [base, email, password] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email); await page.fill('#password', password)
await page.click('button[type=submit]'); await page.waitForTimeout(15000)

// Render in-page using the app's own module, with a real template from Firestore.
const out = await page.evaluate(async () => {
  const mods = await Promise.all([
    import('/src/lib/print-render.ts'),
    import('/src/lib/print-contexts.ts'),
    import('/src/lib/print-sample.ts'),
  ])
  const [render, contexts, sample] = mods
  const { getFirestore, collection, getDocs } = await import('firebase/firestore')
  const { db } = await import('/src/lib/firebase.ts')
  void getFirestore
  // find the signed-in company from the app's own cached profile
  const companyId = JSON.parse(localStorage.getItem('aim.lastCompanyId') ?? 'null')
  const tryPaths = companyId ? [`companies/${companyId}/printTemplates`] : []
  for (const path of tryPaths) {
    const snap = await getDocs(collection(db, path))
    if (!snap.empty) {
      const tpl = { id: snap.docs[0].id, ...snap.docs[0].data() }
      const ctx = contexts.jobCardPrintContext
        ? contexts.jobCardPrintContext(sample.SAMPLE_JOB_CARD ?? {}, {})
        : {}
      const html = render.renderPrintHtml(tpl, ctx)
      return { ok: true, name: tpl.name, paper: tpl.paper, html: html.slice(0, 1200), full: html }
    }
  }
  return { ok: false, why: 'no templates found', companyId }
})
if (!out.ok) {
  console.log('could not render:', out.why, out.companyId ?? '')
} else {
  const pageRule = (out.full.match(/@page \{[^}]*\}/) || ['(none)'])[0]
  console.log(`template : ${out.name}`)
  console.log(`paper    : ${JSON.stringify(out.paper)}`)
  console.log(`@page    : ${pageRule}`)
  const valid = /@page \{ size: [\d.]+mm [\d.]+mm;/.test(pageRule)
  console.log(`valid CSS: ${valid ? 'yes' : 'NO — browser will ignore it and print A4'}`)
  console.log(`symbols  : ${/<svg/.test(out.full) ? 'real SVG barcode/QR present' : 'none (text only)'}`)
}
await browser.close()
