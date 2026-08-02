const CACHE_NAME = 'mcqkash-v5';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './maskable-icon-512.png',
  './icon-1024.png',
  './apple-touch-icon.png',
  './logo-leather-dark.png',
  './favicon.ico',
  './favicon-96x96.png',
  './screenshot-mobile-1.png',
  './screenshot-mobile-2.png',
  './screenshot-desktop-1.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.warn('PWA Pre-cache notice:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // SPA navigation fallback for offline access
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html') || caches.match('./');
      })
    );
    return;
  }

  // Network-first strategy for dynamic resources, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background Sync capability for offline test submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-exam-results' || event.tag === 'mcqkash-sync') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(() => {
        console.log('[SW] Background sync triggered for offline test results');
      })
    );
  }
});

// Periodic Background Sync capability for daily current affairs & test series updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-daily-mcqs' || event.tag === 'mcqkash-periodic-update') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(() => {
        console.log('[SW] Periodic background sync running for daily content updates');
      })
    );
  }
});
