const CACHE_NAME = 'Protection-app-v2';

const urlsToCache = [
  './index.html',
  './style.css',
  './data.js',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico',
  './manifest.json',
  './'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force immediate activation
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use Promise.allSettled to ensure installation completes even if one file fails to fetch
      return Promise.allSettled(
        urlsToCache.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(new Request(url), response);
            }
          });
        })
      );
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
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // ignoreSearch: true ensures that ?view=home matches the cached URLs
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      
      // If we found it in cache, return it immediately (Cache First)
      if (cachedResponse) {
        // Optionally update cache in the background (Stale-While-Revalidate)
        event.waitUntil(
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                if (event.request.url.startsWith('http')) {
                  cache.put(event.request, networkResponse.clone());
                }
              });
            }
          }).catch(() => {
            // Ignore network errors in background
          })
        );
        return cachedResponse;
      }

      // If not in cache, try fetching from network
      return fetch(event.request).then(networkResponse => {
        // Return if invalid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache the newly fetched resource
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          if (event.request.url.startsWith('http')) {
             cache.put(event.request, responseToCache);
          }
        });
        
        return networkResponse;
      }).catch(() => {
        // Offline and resource not in cache.
        // If it's a navigation request, we can fallback to index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
