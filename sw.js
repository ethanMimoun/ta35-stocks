const CACHE_NAME = 'israelibourse-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install - cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Cache install warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate - clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache, fallback to /index.html
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase / external API requests - always go to network
  const url = new URL(event.request.url);
  const isExternal = !url.hostname.includes('israelibourse.co.il') &&
                     !url.hostname.includes('localhost');
  if (isExternal) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // For navigation requests (page loads), serve index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
