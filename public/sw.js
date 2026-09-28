// SFtransit offline support.
// The map, lines, stations, neighborhood guide and journey planner are all built
// into the app bundle, so once these files are cached the map works with no signal.
// Live data (/api/*) always goes to the network and is never cached.

const VERSION = "sftransit-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      await cache.addAll(SHELL);
      // Also cache the hashed JS/CSS/image files the current page uses.
      try {
        const html = await (await fetch("/", { cache: "no-store" })).text();
        const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
        await cache.addAll([...new Set(assets)]);
      } catch (e) {
        // Assets will be cached the first time they load instead.
      }
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // live data: network only

  // Pages: try the network (fresh content), fall back to the saved copy when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(VERSION);
        try {
          const res = await withTimeout(fetch(req), 4000);
          if (res.ok && url.pathname === "/") cache.put("/", res.clone());
          else if (res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return (await cache.match(req)) || (await cache.match("/")) || Response.error();
        }
      })()
    );
    return;
  }

  // Hashed build files and images: use the saved copy, otherwise fetch and save.
  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })()
  );
});
