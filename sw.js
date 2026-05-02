const CACHE_NAME = 'letrox-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './palavras_letrox.json',
  './emoji_kkk.png',
  './icon-192.png',
  './icon-512.png',
  './sons/acerto.mp3',
  './sons/erro.mp3',
  './sons/repetida.mp3',
  './sons/palavra mestra.mp3',
  './sons/completo.mp3',
  './sons/poder 01.mp3',
  './sons/poder 02.mp3',
  './sons/click.mp3',
  './sons/balls 3.mp3',
  './sons/balls 10.mp3',
  './sons/balls 12.mp3',
  './sons/balls 21.mp3',
  './sons/balls 22.mp3',
  './sons/tap 1.mp3',
  './sons/tap 2.mp3',
  './sons/tap 3.mp3',
  './sons/tap 4.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Usamos addAll mas com tratamento individual para que um arquivo quebrado não aborte tudo
        return Promise.all(
          ASSETS_TO_CACHE.map(url => {
            return cache.add(url).catch(err => console.log('Falha ao fazer cache de', url, err));
          })
        );
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deletando cache antigo', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Estratégia: Stale-While-Revalidate
  // Retorna o que está no cache imediatamente e, em paralelo, busca na rede para atualizar o cache
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Salva a nova versão no cache se for válida
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Modo offline (silencioso, pois o cache irá suprir)
      });

      // Retorna o cache primeiro se existir; senão espera a rede
      return cachedResponse || fetchPromise;
    })
  );
});
