const APP_VERSION = "v3.4.17"; // build:version
// Keep this cache namespace separate from the preserved Anki Sprint v9.13 PWA.
const CACHE_PREFIX = "apkg-simulator-shell-";
const CACHE_NAME = `${CACHE_PREFIX}${APP_VERSION}`;
const PRECACHE = [
  "./.nojekyll",
  "./assets/apple-touch-icon-C3GtdD9x.png",
  "./assets/icon-gTp1paoi.svg",
  "./assets/index-DEmdR-wp.js",
  "./assets/index-Dd4FS1F1.css",
  "./assets/manifest-DD1pHFoS.webmanifest",
  "./assets/sql-wasm-UFUCzYNW.wasm",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg",
  "./index.html",
  "./licenses/DOMPurify-Apache-2.0.txt",
  "./licenses/DOMPurify-MPL-2.0.txt",
  "./licenses/fzstd-MIT.txt",
  "./licenses/sql.js-LICENSE.txt",
  "./licenses/zip.js-BSD-3-Clause.txt",
  "./manifest.webmanifest"
]; // build:precache

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => (
        key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME
      )).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match("./index.html")) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(new Response("External requests are disabled", { status: 403 }));
    return;
  }
  if (request.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request).catch(() => Response.error()));
});
