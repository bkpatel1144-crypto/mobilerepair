import data from '@/data/site-seo.json'

/**
 * Per-page metadata for the public site.
 *
 * Every marketing page served `<title>aim</title>` and one generic description, because nothing
 * in the app ever touched the document head. Nine pages competing for the same title is nine
 * pages a search engine cannot tell apart, and a one-word title is a result nobody clicks.
 *
 * The copy lives in `src/data/site-seo.json` rather than here so that one file is the only
 * definition: this module reads it for the running app, and `tools/seo/build-seo.mjs` reads the
 * same file to write `sitemap.xml` and to bake the JSON-LD and per-page tags into the shipped
 * HTML. A first attempt had the build script parse *this* file with regular expressions, which
 * broke on the first template literal it met — plain JSON is importable by both sides and
 * cannot drift.
 *
 * Titles are written to be clicked, not to be clever: the thing the page is about, then the
 * product. Under ~60 characters so they are not truncated, descriptions under ~155 likewise.
 */

export const SITE_URL = data.siteUrl
export const SITE_NAME = data.siteName
export const ORG_NAME = data.orgName

export interface PageSeo {
  path: string
  title: string
  description: string
  changefreq: string
  priority: number
}

export const PAGES: PageSeo[] = data.pages

export function seoFor(pathname: string): PageSeo | undefined {
  return PAGES.find((p) => p.path === pathname)
}
