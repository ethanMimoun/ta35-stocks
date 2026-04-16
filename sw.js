// Service Worker for מגמת צמיחה
// Version 2.1 - Fixed POST caching and Firebase passthrough

const CACHE_NAME = 'megamat-tzmcha-v2';
const urlsToCache = [
  './',
  './index.html',
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((err) => console.warn('SW install cache error:', err))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // CRITICAL: Only cache GET requests — POST/PUT/DELETE cannot be cached
  if (request.method !== 'GET') {
    return; // Let browser handle it normally, don't intercept
  }
  
  // Skip Firebase, Firestore, and external APIs — always fetch fresh
  const url = request.url;
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('googleusercontent.com') ||
    url.includes('docs.google.com') ||
    url.includes('allorigins.win') ||
    url.includes('corsproxy.io') ||
    url.includes('unpkg.com') ||
    url.includes('cdn.jsdelivr.net') ||
    url.includes('tradingview.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('s3.tradingview.com')
  ) {
    return;
  }
  
  // Network-first for HTML
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  
  // Cache-first for other assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(request).then((response) => {
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic' &&
          request.method === 'GET'
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone).catch(() => {});
          });
        }
        return response;
      }).catch(() => {
        if (request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
