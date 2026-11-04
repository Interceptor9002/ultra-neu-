const SHELL = "rk-shell-v7", EXT = "rk-ext-v7";
const DATEIEN = ["./", "./index.html", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.allSettled(DATEIEN.map(d => c.add(d))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(n => Promise.all(n.filter(k => k !== SHELL && k !== EXT).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);

  if (u.origin === location.origin){
    e.respondWith(
      fetch(r)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put(r, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(r).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  if (u.hostname === "cdn.jsdelivr.net"){
    e.respondWith(
      caches.match(r).then(hit => hit || fetch(r).then(res => {
        if (res.ok){
          const copy = res.clone();
          caches.open(EXT).then(c => c.put(r, copy)).catch(() => {});
        }
        return res;
      }))
    );
  }
});