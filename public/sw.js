// Chaduvkondi Service Worker
// Cache-first strategy for static assets, network-first for API calls

const CACHE_NAME = "chaduvkondi-v1";
const STATIC_CACHE = "chaduvkondi-static-v1";
const API_CACHE = "chaduvkondi-api-v1";

const STATIC_ASSETS = [
  "/manifest.json",
  "/",
];

const API_PATHS = ["/api/"];

// Install: Cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-first for static, network-first for API, offline fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // API requests: Network-first with cache fallback
  if (API_PATHS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Static assets (JS, CSS, fonts, images): Cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/) ||
    url.pathname.startsWith("/_next/") ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(cacheFirstWithNetwork(request));
    return;
  }

  // Page navigations: Network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Default: Network-first
  event.respondWith(networkFirstWithCache(request));
});

// Cache-first strategy
async function cacheFirstWithNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return cached version even if stale
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Network-first strategy with cache fallback
async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for page navigations
    if (request.mode === "navigate") {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>Offline - Chaduvkondi</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #e5e5e5; text-align: center; padding: 20px; }
          .offline-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px; max-width: 400px; }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #a78bfa; }
          p { color: #888; font-size: 0.875rem; line-height: 1.5; }
        </style>
        </head>
        <body>
          <div class="offline-card">
            <h1>📡 You're Offline</h1>
            <p>Don't worry! Your progress is saved locally. Connect to the internet to sync, or keep practicing from your cached quizzes.</p>
          </div>
        </body>
        </html>`,
        {
          headers: { "Content-Type": "text/html" },
          status: 200,
        }
      );
    }

    return new Response("Offline", { status: 503 });
  }
}
