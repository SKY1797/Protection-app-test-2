const CACHE_NAME = 'Protection-app-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/data.js',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force immediate activation
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      )
    )
  );
  self.clients.claim(); // Take control of all pages immediately
});

self.addEventListener('fetch', event => {
  event.respondWith(
    // ignoreSearch: true ensures that ?view=home matches the cached /index.html
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          // Only cache GET requests (prevents errors with unsupported schemes)
          if (event.request.method === 'GET' && event.request.url.startsWith('http')) {
             cache.put(event.request, networkResponse.clone());
          }
        });
        return networkResponse;
      }).catch(() => {
        // Network failed (offline), do nothing and let it fall back to cachedResponse
      });

      return cachedResponse || fetchPromise;
    })
  );
});
