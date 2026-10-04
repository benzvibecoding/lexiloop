/* LexiLoop service worker (Phase 7): precache app shell, offline-first cho điều hướng,
   stale-while-revalidate cho API từ điển + audio. */
const VERSION = "lexiloop-v7";
const APP_SHELL = [
  "/",
  "/about",
  "/privacy",
  "/onboarding",
  "/placement",
  "/dashboard",
  "/decks",
  "/review",
  "/study",
  "/library",
  "/lookup",
  "/add",
  "/stats",
  "/settings",
  "/offline",
  "/manifest.webmanifest",
];
const SWR_HOSTS = ["api.dictionaryapi.dev", "api.mymemory.translated.net"];
const SWR_CACHE = `${VERSION}-swr`;

self.addEventListener("install", (event) => {
  const e = event as ExtendableEvent;
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(APP_SHELL))
      .then(() => (self as unknown as ServiceWorkerGlobalScope).skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const e = event as ExtendableEvent;
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION && k !== SWR_CACHE).map((k) => caches.delete(k)));
      await (self as unknown as ServiceWorkerGlobalScope).clients.claim();
    })(),
  );
});

async function swr(request: Request): Promise<Response> {
  const cache = await caches.open(SWR_CACHE);
  const hit = await cache.match(request);
  const fetchAndPut = fetch(request)
    .then((res) => {
      if (res.ok) void cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  if (hit) return hit;
  const res = (await fetchAndPut) as Response | undefined;
  if (res) return res;
  return new Response("Offline", { status: 503 });
}

self.addEventListener("fetch", (event) => {
  const e = event as FetchEvent;
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (SWR_HOSTS.includes(url.hostname)) {
    e.respondWith(swr(req));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(VERSION);
          void cache.put(req, res.clone());
          return res;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match("/offline");
          if (fallback) return fallback;
          return new Response("Offline — mở app khi có mạng một lần để dùng offline.", { status: 503 });
        }
      })(),
    );
    return;
  }
  // Tài nguyên tĩnh: cache-first rồi mạng
  e.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        return await fetch(req);
      } catch {
        return new Response("Offline", { status: 503 });
      }
    })(),
  );
});
