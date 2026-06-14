const CACHE_NAME = 'soluxe-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo/soluxe-logo.jpeg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Network-first strategy for the main HTML and manifest to avoid stale UI
  if (event.request.mode === 'navigate' || event.request.url.includes('manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for assets (images, logos, etc)
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
