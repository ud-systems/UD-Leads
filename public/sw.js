// Service Worker for Offline-First Lead Management
const CACHE_NAME = 'ud-leads-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/offline.html'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(OFFLINE_URLS);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip service worker for development server requests
  if (event.request.url.includes('localhost:5173') || 
      event.request.url.includes('127.0.0.1:5173') ||
      event.request.url.includes('@react-refresh') ||
      event.request.url.includes('__vite') ||
      event.request.url.includes('hot-update')) {
    return;
  }

  // Only handle navigation requests and specific resources
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      event.request.url.includes('/offline.html')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request);
        })
        .catch(() => {
          // Return offline page if both cache and network fail
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503 });
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
    // This will be handled by the main app's sync logic
    // The service worker just triggers the sync
    console.log('Background sync triggered');
    
    // Send message to main app to trigger sync
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'TRIGGER_SYNC'
        });
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
