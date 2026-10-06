/**
 * Does the app shell fit the viewport, or does the document scroll behind it?
 *
 *   node tools/ui/shell-height-probe.mjs <base> <email> <password> [path]
 *
 * The shell is `h-dvh overflow-hidden` with the content pane scrolling inside it, so the
 * document itself must never be taller than the window. When it is, you scroll past the whole
 * application and find empty page underneath — which is what a user sees as "the UI broke".
 */
import { chromium } from 'playwright'
const [base, email, password, path] = process.argv.slice(2)
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1500, height: 900 } })
await page.goto(base + '/login', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.fill('#email', email); await page.fill('#password', password)
await page.click('button[type=submit]'); await page.waitForTimeout(15000)

for (const look of ['studio', 'classic']) {
  for (const chrome of ['docked', 'floating']) {
    await page.evaluate(([l, c]) => {
      localStorage.setItem('aim-appearance', JSON.stringify({
        look: l, accent: 'teal', cards: 'white', chrome: c, font: 'geist',
      }))
      const r = document.documentElement
      r.setAttribute('data-look', l); r.setAttribute('data-chrome', c)
    }, [look, chrome])
    await page.goto(base + (path || '/app/dashboard'), { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(6000)
    const m = await page.evaluate(() => {
      const shell = document.querySelector('[data-chrome-surface="shell"]')
      const cs = shell && getComputedStyle(shell)
      return {
        docH: document.documentElement.scrollHeight,
        winH: window.innerHeight,
        shellH: shell ? Math.round(shell.getBoundingClientRect().height) : null,
        shellPad: cs ? cs.padding : null,
        shellBox: cs ? cs.boxSizing : null,
      }
    })
    const over = m.docH - m.winH
    console.log(
      `${over > 1 ? 'FAIL' : 'ok  '}  ${look}/${chrome}: document ${m.docH}px in ${m.winH}px` +
      ` (shell ${m.shellH}px, padding ${m.shellPad}, box-sizing ${m.shellBox})`
    )
  }
}
await b.close()
