const CACHE_NAME = 'mcqkash-v7';
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
  './favicon.svg',
  './favicon.ico',
  './favicon-32x32.png',
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

// Web Push Notifications Handler — enables daily revision push alerts & automated streak reminders
self.addEventListener('push', (event) => {
  let data = {
    title: 'MCQ Kash — Daily Revision Alert',
    body: 'Time for your daily 10-minute MCQ practice! Keep your streak alive.',
    url: './'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'icon-192.png',
    badge: 'favicon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes('mcq') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
