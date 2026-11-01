// ============================================================================
// Ganesh's HabitFlow — High-Performance Offline & Mobile Push Service Worker
// Version: 2.5.0
// ============================================================================

const CACHE_NAME = 'habitflow-v2.5.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..800;1,9..40,400..800&family=Manrope:wght@500;700;800;900&display=swap'
];

// 1. Install Event: Pre-cache static core assets and app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline shell and dependencies');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache partial failure (will cache on demand):', err);
      });
    })
  );
});

// 2. Activate Event: Clean up outdated legacy caches and claim active clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging legacy cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Stale-While-Revalidate for app shell, direct network for Cloud Sync
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Direct bypass for cloud sync endpoints (never serve stale sync data)
  if (url.hostname.includes('kvdb.io') || url.hostname.includes('val.town')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ offline: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Cache-First with Stale-While-Revalidate for all other requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Asynchronously revalidate in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache response
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cached index.html for page navigations when offline
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
    })
  );
});

// 4. Push Event: Handle background push notifications on Android & mobile browsers
self.addEventListener('push', (event) => {
  let data = {
    title: "Ganesh's HabitFlow Reminder",
    body: "Time for your scheduled routine! Keep your streak alive.",
    tag: 'habitflow-alert'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const iconData = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%2310b981"/><text x="50" y="65" font-size="45" font-weight="bold" text-anchor="middle" fill="white">✓</text></svg>';

  const options = {
    body: data.body,
    icon: data.icon || iconData,
    badge: iconData,
    tag: data.tag || 'habitflow-routine',
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: './index.html'
    },
    actions: [
      { action: 'open', title: 'Open HabitFlow' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification Click Event: Focus existing window or open HabitFlow
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing open tab if available
      for (let client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});

// 6. Background Sync Event (Triggers sync when connectivity restores)
self.addEventListener('sync', (event) => {
  if (event.tag === 'habitflow-cloud-sync') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_SYNC' });
        });
      })
    );
  }
});
