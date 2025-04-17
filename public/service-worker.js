const CACHE_NAME = "whos-up-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/scripts/main.js",
  "/scripts/admin.js",
  "/scripts/mod.js",
  "/bh.html",
  "/59.html",
  "/admin.html",
  "/modpanel.html",
  "/header.jpeg"
];


// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Activate immediately after install
});

// Activate and clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // Take control of all clients
});

// Fetch from cache first, fall back to network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() =>
          caches.match("/index.html")
        )
      );
    })
  );
});
