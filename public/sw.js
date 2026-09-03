// Minimal hand-rolled service worker — intentionally simple (no Workbox/vite-plugin-pwa) so
// its caching behavior stays obvious and auditable.
//
// Strategy:
//  - Static assets (JS/CSS/fonts/images), same-origin: cache-first, populated lazily on fetch
//    (no precache manifest to keep in sync with Vite's hashed build filenames).
//  - Everything else (navigations, Firebase/Firestore/Storage calls, any cross-origin request):
//    always network — never cached. Correctness of live data matters far more than offline
//    support for an ERP app; we only cache assets, never API responses.

const CACHE_NAME = 'aim-static-v1'
const STATIC_EXTENSIONS = /\.(?:js|css|woff2?|ttf|otf|svg|png|jpe?g|webp|ico)$/

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  const isSameOrigin = url.origin === self.location.origin
  const isStaticAsset =
    isSameOrigin && request.method === 'GET' && STATIC_EXTENSIONS.test(url.pathname)

  if (!isStaticAsset) return // let the browser handle it normally (network)

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached

      const response = await fetch(request)
      if (response.ok) cache.put(request, response.clone())
      return response
    })
  )
})
