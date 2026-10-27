/* AI Study Suite PRO — service worker
 *
 * Strategy:
 *   • HTML / navigations  → NETWORK-FIRST (always the newest app; cache is only
 *                            the offline fallback). This is what makes updates
 *                            appear immediately instead of serving a stale copy.
 *   • static assets       → cache-first with a background refresh.
 *   • AI provider calls   → never intercepted, always straight to the network.
 */
const VERSION = 'v18.36.2';
const CACHE = 'ai-study-' + VERSION;
const SHELL = ['./', './index.html', './manifest.json', './logo.svg', './favicon.svg', './icon-192.png', './icon-512.png', './og-image.png'];

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
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // never intercept AI provider calls
  if (/generativelanguage\.googleapis\.com|api\.groq\.com|api\.openai\.com|openrouter\.ai|api\.deepseek\.com|api\.mistral\.ai/.test(url.host)) return;

  const isHTML = req.mode === 'navigate'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('.html');

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
