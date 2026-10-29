// Service Worker للمتجر: أسرع تحميل، وصفحات تعمل بدون إنترنت.
// - ملفات الموقع الثابتة والصور: من الذاكرة أولاً (لا تتغير أبداً)
// - الصفحات: من الشبكة أولاً، وعند انقطاع الإنترنت آخر نسخة محفوظة أو صفحة «غير متصل»
// - لا يُحفظ أي شيء خاص: الصفحات ذات no-store (الإدارة، الحساب) وكل مسارات API
const VERSION = 'v1';
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES_CACHE).then((c) => c.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

const isStatic = (url) => url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/api/uploads/');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const cc = res.headers.get('Cache-Control') || '';
          if (res.ok && !cc.includes('no-store') && !res.headers.get('X-Robots-Tag')) {
            const copy = res.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || caches.match(OFFLINE_URL))
    );
  }
});
