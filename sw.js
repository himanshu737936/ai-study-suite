/* AI Study Suite PRO — service worker (offline shell) */
const CACHE = 'ai-study-v11';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // never intercept AI provider calls — always go to network
  if (/generativelanguage\.googleapis\.com|api\.groq\.com|api\.openai\.com|openrouter\.ai|api\.deepseek\.com|api\.mistral\.ai/.test(url.host)) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const cacheable = res && res.status === 200 && (url.origin === self.location.origin || /cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com/.test(url.host));
      if (cacheable) { const clone = res.clone(); caches.open(CACHE).then((c) => c.put(req, clone)); }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
