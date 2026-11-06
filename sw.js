/* AI Study Suite PRO — service worker
 *
 * Strategy:
 *   • HTML / navigations  → NETWORK-FIRST (always the newest app; cache is only
 *                            the offline fallback). This is what makes updates
 *                            appear immediately instead of serving a stale copy.
 *   • static assets       → cache-first with a background refresh.
 *   • AI provider calls   → never intercepted, always straight to the network.
 */
const VERSION = 'v18.62.3';
const CACHE = 'ai-study-' + VERSION;
const SHELL = ['./', './index.html', './app.js', './app-core.js', './app-features.js', './app-android.js', './ui-android.css', './manifest.json', './logo.svg', './favicon.svg', './icon-192.png', './icon-512.png', './og-image.png'];

/* Android share target: files arrive as a multipart POST to ./share.
   They are parked in this cache and picked up by the page. */
const SHARE_CACHE = 'ai-study-shared';

async function handleShareTarget(request) {
  try {
    const form = await request.formData();
    const cache = await caches.open(SHARE_CACHE);
    const stale = await cache.keys();
    await Promise.all(stale.map((k) => cache.delete(k)));
    let i = 0;
    for (const value of form.getAll('media')) {
      if (typeof value === 'string' || !value) continue;
      const headers = new Headers({
        'content-type': value.type || 'application/octet-stream',
        'x-file-name': encodeURIComponent(value.name || ('shared-' + i)),
        'x-file-type': value.type || ''
      });
      await cache.put(new Request('/__shared/' + i), new Response(value, { headers }));
      i++;
    }
  } catch (err) { /* a share we could not read — the app still opens normally */ }
  return Response.redirect('./?shared=1', 303);
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// the page can ask a waiting worker to take over immediately
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Android share sheet → POST ./share
  if (req.method === 'POST' && url.pathname.endsWith('/share')) {
    e.respondWith(handleShareTarget(req));
    return;
  }

  if (req.method !== 'GET') return;

  // never intercept AI provider calls
  if (/generativelanguage\.googleapis\.com|api\.groq\.com|api\.openai\.com|openrouter\.ai|api\.deepseek\.com|api\.mistral\.ai/.test(url.host)) return;

  const isHTML = req.mode === 'navigate'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('.js');   // JS must never be stale: new HTML + old JS = broken app

  if (isHTML) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          const cacheable = res && res.status === 200 &&
            (url.origin === self.location.origin || /cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com/.test(url.host));
          if (cacheable) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
