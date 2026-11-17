const CACHE = "la-fruta-v6";

// Rutas sin hash en el nombre: el mismo URL puede cambiar de contenido al
// desplegar, así que se consulta la red primero y la caché solo es respaldo.
const UNHASHED_PREFIXES = ["/onboarding/"];

function isUnhashed(pathname) {
  return UNHASHED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Nunca guardar respuestas con error: si un 404/500 entra en caché, el usuario
// ve el recurso roto hasta que cambie la versión de CACHE.
async function cacheIfOk(request, response) {
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

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
    caches.open(CACHE).then((cache) =>
      Promise.all(
        STATIC_ASSETS.map((asset) =>
          fetch(asset)
            .then((response) => (response.ok ? cache.put(asset, response) : undefined))
            .catch(() => undefined)
        )
      )
    )
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

self.addEventListener("push", (event) => {
  let data = {
    title: "MercaToma",
    body: "Tienes una novedad.",
    url: "/",
    tag: "mercatoma",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "MercaToma", {
      body: data.body || "",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: { url: data.url || "/" },
      tag: data.tag || "mercatoma",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            if ("navigate" in client) {
              client.navigate(target).catch(() => undefined);
            }
            return client.focus();
          }
        }
        return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
      })
  );
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
        .then((response) => cacheIfOk(request, response))
        .catch(() =>
          caches.match(request).then((cached) => {
            return cached || caches.match("/offline");
          })
        )
    );
    return;
  }

  // Unhashed assets: network-first. Evita servir una copia vieja tras un deploy
  // y evita fijar un error de red en la caché.
  if (isUnhashed(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => cacheIfOk(request, response))
        .catch(() =>
          caches.match(request).then((cached) => cached || new Response(null, { status: 503 }))
        )
    );
    return;
  }

  // Static assets con hash: cache-first, pero sin guardar respuestas con error.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => cacheIfOk(request, response))
        .catch(() => new Response(null, { status: 503 }));
    })
  );
});
