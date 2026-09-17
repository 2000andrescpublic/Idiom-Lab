/* Service worker de english-lab_impulse.html — cachea la app para que
   funcione sin conexión. Solo intercepta pedidos relacionados con
   "impulse" (el propio HTML, el manifest y este mismo script); todo lo
   demás (otras variantes del proyecto, fuentes de Google, etc.) pasa
   de largo sin tocarlo. Estrategia: "stale-while-revalidate" — sirve
   la copia en caché al instante (y funciona offline), y en paralelo
   busca una versión más nueva en la red para la próxima vez. */
const CACHE_NAME = "englishlab-impulse-v1";
const CORE_ASSETS = [
  "./english-lab_impulse.html",
  "./manifest_impulse.json",
  "./sw_impulse.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (!req.url.includes("impulse")) return; // solo maneja assets de impulse

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
