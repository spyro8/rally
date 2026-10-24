// SPYR service worker.
// - Built app code in /assets/ (file names change every version): served from the phone once saved.
// - Other app files (html / js / css / json): network first, but after 3.5 s with no answer the saved
//   copy is used (slow signal no longer means a blank screen). Replaced every version.
// - Music is not kept by this worker (the browser's own cache still helps) so storage stays small.
// - Pictures and fonts: saved on the phone the first time they load, then served from the
//   phone (that's what makes the Journey open fast again). This cache keeps its name across app
//   versions because the art files never change in place; a new picture always has a new name.
// - Supabase and other sites are never touched.
const C = "spyr-v52-58";
const MEDIA = "spyr-media-1";
const SHELL = /\.(html|js|css|json|webmanifest)$/i;
const ART = /\.(webp|png|jpe?g|gif|svg|ttf|otf|woff2?)$/i;

self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    try { const keys = await caches.keys(); await Promise.all(keys.filter((k) => k !== C && k !== MEDIA).map((k) => caches.delete(k))); } catch {}
    await self.clients.claim();
  })());
});

const keep = (cacheName, req, res) => {
  if (!res || !res.ok || res.type !== "basic" || res.status !== 200) return;
  const copy = res.clone();
  caches.open(cacheName).then((c) => c.put(req, copy)).catch(() => {});
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url; try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;
  if (req.headers.has("range")) return;                       // audio seeking: let the browser handle it

  if (ART.test(url.pathname)) {
    e.respondWith((async () => {
      try { const hit = await caches.match(req, { cacheName: MEDIA }); if (hit) return hit; } catch {}
      const res = await fetch(req);
      keep(MEDIA, req, res);
      return res;
    })());
    return;
  }

  if (/\/assets\/[^/]+-[\w-]{6,}\.(js|css)$/.test(url.pathname)) {   // hashed build files never change
    e.respondWith((async () => {
      try { const hit = await caches.match(req, { cacheName: C }); if (hit) return hit; } catch {}
      const res = await fetch(req);
      keep(C, req, res);
      return res;
    })());
    return;
  }

  if (SHELL.test(url.pathname) || url.pathname.endsWith("/")) {
    e.respondWith((async () => {
      const net = fetch(req).then((res) => { keep(C, req, res); return res; }); net.catch(() => {});
      let hit = null; try { hit = await caches.match(req, { cacheName: C }); } catch {}
      if (!hit) return net;                                    // first visit: wait for the network
      const slow = new Promise((r) => setTimeout(() => r(null), 3500));
      try { const res = await Promise.race([net, slow]); return res || hit; } catch { return hit; }
    })());
  }
});
