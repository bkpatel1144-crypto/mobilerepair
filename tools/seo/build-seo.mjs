/**
 * Writes `robots.txt`, `sitemap.xml`, the JSON-LD graph and the per-page head tags into the
 * built site.
 *
 *   node tools/seo/build-seo.mjs
 *
 * Run after `vite build`. Four things that cannot be done from inside a client-rendered app:
 *
 *  1. **robots.txt and sitemap.xml** did not exist at all. Without them a nine-page site relies
 *     on a crawler following every link, and — more importantly — the signed-in routes stay in
 *     the index, where `/app/...` produces search results that lead to a login form.
 *  2. **The JSON-LD graph goes into the HTML itself.** Google's guidance is that structured
 *     data injected by client-side JavaScript "may or may not" be picked up, while structured
 *     data in the initial HTML response is guaranteed to be processed.
 *  3. **A static HTML file per public route**, each carrying its own `<title>`, description,
 *     canonical and social tags. This is the prerender-lite that a mostly-static marketing site
 *     wants: Google now calls serving different HTML to bots "a workaround, not a long-term
 *     solution", so every one of these files is the real app shell — same scripts, same markup,
 *     same content once hydrated. Only the head differs, and it differs to *match* what the
 *     page renders, never to say something else.
 *  4. **`og-image.png`** is referenced by the social tags; if it is missing this says so rather
 *     than shipping a broken card.
 *
 * `src/data/site-seo.json` is the single source for all of it, shared with the running app.
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import path from 'node:path'

const DIST = 'dist'
const seo = JSON.parse(await readFile('src/data/site-seo.json', 'utf8'))
const { siteUrl, siteName, pages, organization } = seo

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ---- robots.txt ------------------------------------------------------------
await writeFile(
  path.join(DIST, 'robots.txt'),
  `# ${siteUrl}
User-agent: *
Allow: /

# The signed-in application. Everything here is behind a login, so a crawler that indexes it
# produces search results leading to a sign-in form rather than to the content promised.
Disallow: /app/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /complete-setup

Sitemap: ${siteUrl}/sitemap.xml
`,
  'utf8'
)

// ---- sitemap.xml -----------------------------------------------------------
const today = new Date().toISOString().slice(0, 10)
const urls = pages
  .map((p) =>
    [
      '  <url>',
      `    <loc>${siteUrl}${p.path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${p.changefreq}</changefreq>`,
      `    <priority>${p.priority}</priority>`,
      '  </url>',
    ].join('\n')
  )
  .join('\n')
await writeFile(
  path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  'utf8'
)

// ---- the JSON-LD graph -----------------------------------------------------
const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: seo.orgName,
      url: siteUrl,
      logo: `${siteUrl}/icon-512.png`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: organization.streetAddress,
        addressLocality: organization.addressLocality,
        addressRegion: organization.addressRegion,
        postalCode: organization.postalCode,
        addressCountry: organization.addressCountry,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: organization.telephone,
        email: organization.email,
        contactType: 'customer support',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi', 'gu'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: ['en', 'hi', 'gu'],
    },
    {
      '@type': 'SoftwareApplication',
      name: siteName,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web browser',
      url: siteUrl,
      publisher: { '@id': `${siteUrl}/#organization` },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    },
  ],
}

// ---- one HTML file per public route ---------------------------------------
const shell = await readFile(path.join(DIST, 'index.html'), 'utf8')

function headFor(page) {
  const url = `${siteUrl}${page.path}`
  const img = `${siteUrl}/og-image.png`
  return [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(siteName)}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    `<script type="application/ld+json">${JSON.stringify(graph)}</script>`,
  ].join('\n    ')
}

for (const page of pages) {
  // Replace the shell's placeholder title and description rather than appending, or the page
  // ships with two of each and a crawler picks whichever it likes.
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace('</head>', `  ${headFor(page)}\n  </head>`)

  // Flat `pricing.html`, not `pricing/index.html`.
  //
  // Firebase serves static files before rewrites, but only on an exact match: `/pricing` is
  // not a file, so it fell through to the `source: "**"` SPA rewrite and every route got the
  // root shell's head back. `cleanUrls: true` in `firebase.json` is what maps `/pricing` to
  // `pricing.html`. Verified by curling the deployed site with JavaScript off, which is the
  // only check that actually answers "what does a crawler get".
  const out =
    page.path === '/'
      ? path.join(DIST, 'index.html')
      : path.join(DIST, `${page.path.replace(/^\//, '')}.html`)
  await mkdir(path.dirname(out), { recursive: true })
  await writeFile(out, html, 'utf8')
}

try {
  await access(path.join(DIST, 'og-image.png'))
} catch {
  console.warn('  warning: public/og-image.png is missing — social cards will have no image')
}

console.log(`robots.txt and sitemap.xml written (${pages.length} urls)`)
console.log(`per-page head written for ${pages.length} routes, JSON-LD embedded in each`)
