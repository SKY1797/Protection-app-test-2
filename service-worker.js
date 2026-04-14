const CACHE_NAME = 'Protection-app-v3'; // Bumped version to force the update

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css', 
  '/data.js',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/manifest.json'
  // Note: If you don't actually have an 'apple-touch-icon.png' in your folder, 
  // do not add it here, or it will break the installation again!
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

// 🟢 IMPROVED: Stale-While-Revalidate Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      
      // Always try to fetch the latest version from the network in the background
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Update the cache with the freshly fetched version
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // If offline and network fails, do nothing (it will just rely on the cache)
      });

      // Return the cached response immediately if it exists, otherwise wait for the network
      return cachedResponse || fetchPromise;
    })
  );
});
