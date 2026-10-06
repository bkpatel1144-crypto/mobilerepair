/**
 * What a crawler gets — fetched with no JavaScript at all.
 *
 *   node tools/seo/seo-check.mjs <base>
 *
 * This is the only check that answers the question. Opening the site in a browser tells you
 * what a *person* sees after React has run; a crawler that does not execute JavaScript, and
 * every link preview in WhatsApp and Slack, sees the bytes the server sent. Those were two
 * completely different things here: the app looked correct while every one of nine routes
 * served `<title>aim</title>` and no structured data.
 *
 * Plain `fetch`, deliberately. Using Playwright would run the JavaScript and hide the bug.
 */
import { readFile } from 'node:fs/promises'

const base = (process.argv[2] ?? 'https://aim-enterprise.web.app').replace(/\/$/, '')
const seo = JSON.parse(await readFile('src/data/site-seo.json', 'utf8'))

const fails = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`)
  if (!ok) fails.push(label)
}

const seen = new Map()

for (const page of seo.pages) {
  const url = base + page.path
  const res = await fetch(url, { headers: { 'user-agent': 'seo-check' } })
  const html = await res.text()
  const name = page.path

  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? ''
  const desc = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [])[1] ?? ''
  const canonical = (html.match(/rel="canonical"\s+href="([^"]*)"/) || [])[1] ?? ''

  const decoded = title.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  check(`${name} has its own title`, decoded === page.title, decoded || '(none)')
  check(`${name} has a description`, desc.length > 50, `${desc.length} chars`)
  check(`${name} is canonical to itself`, canonical === base + page.path, canonical || '(none)')
  check(`${name} carries structured data`, html.includes('application/ld+json'))
  check(`${name} has a social card image`, /og:image/.test(html))

  // Two pages sharing a title is two pages Google cannot tell apart.
  if (seen.has(decoded)) check(`${name} title is unique`, false, `same as ${seen.get(decoded)}`)
  else seen.set(decoded, name)

  // Titles over ~60 characters get truncated in results; descriptions over ~160.
  check(`${name} title fits a search result`, decoded.length <= 62, `${decoded.length} chars`)
  check(`${name} description fits`, desc.length <= 160, `${desc.length} chars`)
}

for (const [file, must] of [
  ['/robots.txt', 'Sitemap:'],
  ['/sitemap.xml', '<urlset'],
]) {
  const res = await fetch(base + file)
  const body = await res.text()
  check(`${file} is served`, res.ok && body.includes(must), `${res.status}`)
}

const robots = await (await fetch(base + '/robots.txt')).text()
check('the signed-in app is excluded from the index', /Disallow: \/app\//.test(robots))

const og = await fetch(base + '/og-image.png')
check('the social card image exists', og.ok, `${og.status}`)

console.log(`\n${fails.length ? `${fails.length} FAILED` : 'all checks passed'}`)
process.exit(fails.length ? 1 : 0)
