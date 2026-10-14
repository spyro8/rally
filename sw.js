// SPYR service worker.
// - App shell (html / js / css / json): network first, saved copy when offline. Replaced every version.
// - Pictures, music and fonts: saved on the phone the first time they load, then served from the
//   phone (that's what makes the Journey open fast again). This cache keeps its name across app
//   versions because the art files never change in place; a new picture always has a new name.
// - Supabase and other sites are never touched.
const C = "spyr-v52-48";
const MEDIA = "spyr-media-1";
const SHELL = /\.(html|js|css|json|webmanifest)$/i;
const ART = /\.(webp|png|jpe?g|gif|svg|mp3|m4a|ogg|wav|ttf|otf|woff2?)$/i;

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

  if (SHELL.test(url.pathname) || url.pathname.endsWith("/")) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        keep(C, req, res);
        return res;
      } catch (err) {
        const hit = await caches.match(req);
        if (hit) return hit;
        throw err;
      }
    })());
  }
});
