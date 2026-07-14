const CACHE_PREFIX = "melin-";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith(CACHE_PREFIX))
              .map((key) => caches.delete(key)),
          ),
        ),
    ]),
  );
});

// As páginas e os arquivos do Next.js ficam sempre sob responsabilidade da rede.
// Isso evita misturar HTML antigo com arquivos de uma implantação mais recente.
