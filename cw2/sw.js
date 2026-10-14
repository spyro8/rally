// SPYR service worker: keeps only the app shell (html / js / css / json) so the app opens fast
// and shows its offline banner. Pictures, audio and fonts are never cached here — iPhone's
// cache storage has a small quota, and when it filled up a cloned response could stall and leave
// a room (the Journey) stuck on its loading screen. Old caches are deleted on every update.
const C = "spyr-v52-47";
const SHELL = /\.(html|js|css|json|webmanifest)$/i;
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    try { const keys = await caches.keys(); await Promise.all(keys.filter((k) => k !== C).map((k) => caches.delete(k))); } catch {}
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  let url; try { url = new URL(e.request.url); } catch { return; }
  if (url.origin !== self.location.origin) return;                       // Supabase etc.: straight to the network
  if (!(SHELL.test(url.pathname) || url.pathname.endsWith("/"))) return;  // art, audio, fonts: browser cache only
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request);
      if (r && r.ok && r.type === "basic") {
        const copy = r.clone();
        e.waitUntil(caches.open(C).then((c) => c.put(e.request, copy)).catch(() => {}));
      }
      return r;
    } catch (err) {
      const m = await caches.match(e.request);
      if (m) return m;
      throw err;
    }
  })());
});
