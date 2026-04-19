// ══════════════════════════════════════════════
//  כנפיים – Service Worker  v2.0
//  Offline-first caching strategy
// ══════════════════════════════════════════════

const CACHE_NAME = "kanafayim-v2";
const CACHE_URLS = [
  "./index.html",
  "./manifest.json",
  "https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap"
];

// ── INSTALL: cache core files
self.addEventListener("install", event => {
  console.log("[SW] Installing כנפיים v2...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(err => {
        console.warn("[SW] Some files could not be cached:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: remove old caches
self.addEventListener("activate", event => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: serve from cache, fallback to network
self.addEventListener("fetch", event => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin requests (maps, wa links etc.)
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;
  const isFont  = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

  if (!isLocal && !isFont) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Return cached version + update in background
        const networkUpdate = fetch(event.request).then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          }
          return res;
        }).catch(() => {});
        return cached;
      }

      // Not in cache – fetch from network
      return fetch(event.request).then(res => {
        if (!res || res.status !== 200) return res;
        const cloned = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, cloned));
        return res;
      }).catch(() => {
        // Offline fallback for HTML pages
        if (event.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("./index.html");
        }
      });
    })
  );
});

// ── BACKGROUND SYNC (optional future use)
self.addEventListener("sync", event => {
  if (event.tag === "sync-favorites") {
    console.log("[SW] Background sync – favorites");
  }
});

// ── PUSH NOTIFICATIONS (optional future use)
self.addEventListener("push", event => {
  const data = event.data?.json() || { title: "כנפיים", body: "עדכון חדש זמין" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      dir: "rtl",
      lang: "he"
    })
  );
});
