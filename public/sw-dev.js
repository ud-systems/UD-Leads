// Development Service Worker for Offline Testing
// This version is more permissive and allows testing offline functionality

const CACHE_NAME = 'ud-leads-dev-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/offline.html'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Dev SW: Opened cache');
        return cache.addAll(OFFLINE_URLS);
      })
  );
});

// Fetch event - more permissive for development
self.addEventListener('fetch', (event) => {
  // Skip certain development requests that might cause issues
  if (event.request.url.includes('@react-refresh') ||
      event.request.url.includes('__vite') ||
      event.request.url.includes('hot-update') ||
      event.request.url.includes('ws://') ||
      event.request.url.includes('wss://')) {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version or offline page
          return caches.match(event.request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/offline.html');
            });
        })
    );
  }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Dev SW: Background sync triggered');
    
    // Send message to main app to trigger sync
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'TRIGGER_SYNC'
        });
      });
    });
  } catch (error) {
    console.error('Dev SW: Background sync failed:', error);
  }
}

// Handle messages from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Dev SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
