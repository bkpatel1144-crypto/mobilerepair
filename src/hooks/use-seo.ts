import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PAGES, SITE_NAME, SITE_URL, seoFor } from '@/lib/seo'

/** Creates the tag if it is missing, then sets it. Idempotent across route changes. */
function setMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
    document.head.appendChild(el)
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
}

/**
 * Keeps the document head in step with the route.
 *
 * Client-side routing changes the URL without reloading the document, so without this every
 * page after the first keeps the previous page's title and description — and the very first
 * one keeps whatever is in `index.html`. Nine marketing pages all titled "aim" is nine pages a
 * search engine has no way to tell apart, and a one-word title is a result nobody clicks.
 *
 * The static HTML written by the prerender step already carries the correct tags for each page,
 * so for a crawler this hook changes nothing. It is for the human who clicks Pricing and then
 * bookmarks the tab.
 */
export function useSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const page = seoFor(pathname)
    // An app route, not a marketing page — leave the head alone rather than describing the
    // signed-in ERP as if it were a landing page.
    if (!page) return

    const url = `${SITE_URL}${page.path === '/' ? '' : page.path}`
    document.title = page.title

    setMeta('meta[name="description"]', { name: 'description', content: page.description })
    // Canonical matters more than usual here: the same content is reachable with and without a
    // trailing slash, and from the `.firebaseapp.com` mirror Firebase Hosting serves alongside
    // `.web.app`. Without this they compete with each other.
    setMeta('link[rel="canonical"]', { rel: 'canonical', href: url })

    setMeta('meta[property="og:title"]', { property: 'og:title', content: page.title })
    setMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: page.description,
    })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: url })
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
    setMeta('meta[property="og:image"]', {
      property: 'og:image',
      content: `${SITE_URL}/og-image.png`,
    })
    setMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    })
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: page.title })
    setMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: page.description,
    })
    setMeta('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: `${SITE_URL}/og-image.png`,
    })
  }, [pathname])
}

/** Every public path, for the sitemap generator and the prerenderer. */
export const PUBLIC_PATHS = PAGES.map((p) => p.path)
