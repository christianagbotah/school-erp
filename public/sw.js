/* iEduPro service worker — offline app shell for the PWA.
   Strategy:
   - Precache the root shell on install.
   - Navigations: network-first, fall back to cached shell (offline reload works).
   - Same-origin static assets: stale-while-revalidate.
   - API calls are NOT intercepted — app-level cachedFetch + outbox handle data.
*/
const SHELL_CACHE = 'iedupro-shell-v2';
const ASSET_CACHE = 'iedupro-assets-v2';
const SHELL_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll([SHELL_URL])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // data layer handles its own offline behaviour

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(SHELL_URL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL_URL))
    );
    return;
  }

  if (['GET'].includes(event.request.method)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(ASSET_CACHE).then((c) => c.put(event.request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
