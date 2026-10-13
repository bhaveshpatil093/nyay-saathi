/**
 * Nyay Saathi - Vanilla Service Worker (Offline-First PWA)
 * 
 * - Zero external libraries
 * - Versioned cache storage
 * - App shell and static asset precaching
 * - Cache-first for static assets
 * - Stale-while-revalidate for other same-origin GET requests
 * - Bilingual offline fallback page for failed navigations
 * - Old cache purging on activate
 * - Strict same-origin interception (never intercepts or caches 3rd-party origins)
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `nyay-saathi-${CACHE_VERSION}`;
const OFFLINE_URL = './offline.html';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

// Regex for static assets
const STATIC_ASSET_REGEX = /\.(js|css|svg|png|jpg|jpeg|webp|ico|woff|woff2|webmanifest|json)$/i;

// 1. Install Event: Precache essential shell & offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Do not force skipWaiting automatically during initial install
        // so updates can be controlled by the user via the update toast
      })
  );
});

// 2. Activate Event: Cleanup stale version caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// 3. Message Listener: Support skipWaiting for update flow
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch Event: Same-origin caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Never intercept or cache non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Never cache or intercept anything that is NOT same origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle SPA Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline, try app root or index.html from cache
          const cachedIndex =
            (await caches.match('./')) ||
            (await caches.match('./index.html')) ||
            (await caches.match(request));

          if (cachedIndex) {
            return cachedIndex;
          }

          // Fallback to offline page
          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) {
            return offlineFallback;
          }

          return new Response('Offline - Nyay Saathi', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }

  // Cache-first for built static assets (JS, CSS, images, fonts, manifest)
  if (STATIC_ASSET_REGEX.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate for other same-origin GET requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Ignore network errors in SWR background revalidation
        });

      return cachedResponse || fetchPromise;
    })
  );
});
