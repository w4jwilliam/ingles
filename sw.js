/* ============================================================
   Service Worker — Inglês em 30 minutos
   Cache do app pra funcionar offline após primeiro carregamento.
   
   Quando atualizar o app, MUDE o nome do cache (v2 → v3) pra
   forçar todos os usuários a baixarem a nova versão.
   ============================================================ */

const CACHE_NAME = 'ingles30-v2';
const ARQUIVOS_PARA_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalação: pré-cacheia tudo
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tenta cachear tudo, mas se algum ícone faltar não trava
      return cache.addAll(ARQUIVOS_PARA_CACHE).catch(() => {
        // Cachea pelo menos o index.html
        return cache.add('./index.html');
      });
    }).then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos quando versão muda
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: serve do cache, cai pra rede, depois atualiza cache
self.addEventListener('fetch', (event) => {
  // Só intercepta requisições do próprio app (mesma origem)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Estratégia: cache-first com refresh em background
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});
