const CACHE = "la-fruta-v2";
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icon.svg",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore individual failures
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API calls: network only
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests: network-first, fallback to cache, then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            return cached || caches.match("/offline");
          })
        )
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => new Response(null, { status: 503 }))
      );
    })
  );
});
