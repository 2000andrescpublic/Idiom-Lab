/* Service worker de english-lab_impulse.html — cachea la app para que
   funcione sin conexión. Solo intercepta pedidos relacionados con
   "impulse" (el propio HTML, el manifest y este mismo script); todo lo
   demás (otras variantes del proyecto, fuentes de Google, etc.) pasa
   de largo sin tocarlo. Estrategia: "red primero" — siempre busca la versión más nueva (revalidando
   con el servidor, así que si no cambió cuesta un 304) y solo usa la copia
   en caché cuando no hay conexión. Así cada despliegue se ve en la primera
   carga, sin quedarse una versión atrás. */
const CACHE_NAME = "englishlab-impulse-v2";
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
    fetch(req.url, { cache: "no-cache" })
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("./english-lab_impulse.html"))
      )
  );
});
