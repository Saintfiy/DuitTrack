const CACHE_PREFIX = 'duittrack-pwa-';
const STATIC_CACHE = `${CACHE_PREFIX}static-v1`;
const OFFLINE_CACHE = `${CACHE_PREFIX}offline-v1`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
          .filter((cacheName) => ![STATIC_CACHE, OFFLINE_CACHE].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const offlinePage = await caches.match(OFFLINE_URL);
        if (!offlinePage) throw new Error('Offline fallback page is unavailable');
        return offlinePage;
      }),
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
