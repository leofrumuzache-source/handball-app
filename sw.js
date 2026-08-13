/**
 * ============================================
 * Handball Club Management - Service Worker
 * Enables offline caching for PWA
 * ============================================
 */

const CACHE_NAME = 'handball-club-v1';
const ASSETS_TO_CACHE = [
  './',
  './login.html',
  './index.html',
  './clubs.html',
  './teams.html',
  './players.html',
  './competitions.html',
  './matches.html',
  './calendar.html',
  './settings.html',
  './import.html',
  './club-view.html',
  './team-view.html',
  './player-view.html',
  './competition-view.html',
  './match-view.html',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './js/storage.js',
  './js/ui.js',
  './js/standings.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('Cache install error:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }
        
        // Fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response for caching
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          });
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        // Return offline page if available
        return caches.match('./index.html');
      })
  );
});
