const CACHE_NAME = 'ai-chat-v1.2';
const CACHE_VERSION = '1.2.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon.png',
  '/favicon-192.png',
  '/favicon-512.png',
  '/robots.txt'
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = {
  images: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  fonts: /\.(woff|woff2|ttf|eot)$/,
  api: /\/api\//,
  external: /^https:\/\//
};

// Cache strategies
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets with better error handling
self.addEventListener('install', (event) => {
  console.log(`Service Worker ${CACHE_VERSION} installing...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('Static assets cached successfully');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log(`Service Worker ${CACHE_VERSION} activating...`);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
    .then(() => {
      console.log('Service Worker activated and controlling all clients');
    })
  );
});

// Enhanced fetch handler with multiple strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (RUNTIME_CACHE_PATTERNS.api.test(url.pathname)) {
    // API requests - Network first with offline fallback
    event.respondWith(handleApiRequest(request));
  } else if (RUNTIME_CACHE_PATTERNS.images.test(url.pathname)) {
    // Images - Cache first
    event.respondWith(handleImageRequest(request));
  } else if (RUNTIME_CACHE_PATTERNS.fonts.test(url.pathname)) {
    // Fonts - Cache first with long TTL
    event.respondWith(handleFontRequest(request));
  } else if (url.origin === location.origin) {
    // Same-origin requests - Stale while revalidate
    event.respondWith(handleSameOriginRequest(request));
  } else {
    // External requests - Network first
    event.respondWith(handleExternalRequest(request));
  }
});

// API request handler
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request.clone());
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return custom offline API response
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable. Please check your connection and try again.',
        offline: true,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Image request handler
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return placeholder image or cached fallback
    return new Response('', { status: 404 });
  }
}

// Font request handler
async function handleFontRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

// Same-origin request handler
async function handleSameOriginRequest(request) {
  const cachedResponse = await caches.match(request);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, response.clone()));
        }
      })
      .catch(() => {}); // Fail silently for background updates
      
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('', { status: 404 });
  }
}

// External request handler
async function handleExternalRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('', { status: 404 });
  }
}

// Background sync handler
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'conversation-sync') {
    event.waitUntil(syncConversations());
  } else if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Sync conversations when back online
async function syncConversations() {
  try {
    // Check if there are pending conversations to sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_CONVERSATIONS',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Conversation sync failed:', error);
  }
}

// Sync analytics when back online
async function syncAnalytics() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ANALYTICS',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Analytics sync failed:', error);
  }
}

// Enhanced push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New AI response available',
      icon: '/favicon-192.png',
      badge: '/favicon-192.png',
      image: data.image,
      tag: data.tag || 'ai-response',
      renotify: true,
      requireInteraction: data.requireInteraction || false,
      vibrate: [100, 50, 100],
      actions: [
        {
          action: 'open',
          title: 'Open Chat',
          icon: '/favicon-192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/favicon-192.png'
        }
      ],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || 'default',
        url: data.url || '/',
        ...data
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'AI Chat Interface', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      
      // If action is dismiss, just close
      if (action === 'dismiss') {
        return;
      }
      
      // Check if a client is already open
      const existingClient = clients.find(client => 
        client.url.includes(self.location.origin)
      );
      
      if (existingClient) {
        // Focus existing window and navigate
        existingClient.focus();
        if (data.url && data.url !== '/') {
          existingClient.postMessage({
            type: 'NAVIGATE',
            url: data.url
          });
        }
      } else {
        // Open new window
        const urlToOpen = data.url || '/';
        self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  const { data } = event;
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
          return cache.addAll(data.urls);
        })
      );
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.delete(CACHE_NAME)
      );
      break;
      
    case 'GET_CACHE_SIZE':
      event.waitUntil(
        getCacheSize().then(size => {
          event.ports[0].postMessage({ cacheSize: size });
        })
      );
      break;
  }
});

// Utility functions
async function getCacheSize() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  let totalSize = 0;
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response && response.headers.get('content-length')) {
      totalSize += parseInt(response.headers.get('content-length'));
    }
  }
  
  return totalSize;
}

// Periodic cleanup
async function cleanupExpiredCaches() {
  const cacheNames = await caches.keys();
  const expiredCaches = cacheNames.filter(name => {
    return name.startsWith('ai-chat-v') && name !== CACHE_NAME;
  });
  
  return Promise.all(
    expiredCaches.map(cacheName => caches.delete(cacheName))
  );
}

// Network connectivity detection
function isOnline() {
  return navigator.onLine;
}

// Custom error responses
function createErrorResponse(message, status = 500) {
  return new Response(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
      service_worker: true
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Log service worker lifecycle
console.log('Service Worker script loaded - Version:', CACHE_VERSION);