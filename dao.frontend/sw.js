const CACHE_NAME = 'registro-personas-cache-v1';
const urlsToCache = [
  './', // 
  './index.html', 

  // Archivos CSS 
  './css/bootstrap.min.css',
  './css/datatables.min.css',
  './css/style.css',
  './css/dataTables.dataTables.css',

  // Archivos JavaScript 
  './js/jquery-3.7.1.min.js',
  './js/datatables.min.js',
  './js/bootstrap.bundle.min.js',
  './js/sweetalert2.all.min.js',
  './js/es-ES.js',

  // Favicon externo 
  'https://is4-ssl.mzstatic.com/image/thumb/Purple124/v4/90/50/08/90500838-b40d-806e-e3ff-663d94ce2618/source/256x256bb.jpg'

];

// Evento 'install'
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando app shell y activos principales...');
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.error('Service Worker: Falló al cachear uno o más recursos durante la instalación:', error, urlsToCache);
            
          });
      })
      .then(() => {
        console.log('Service Worker: Instalación completa. Omitiendo espera (skipWaiting).');
        return self.skipWaiting(); 
      })
  );
});

// Evento 'activate'
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activación completa. Reclamando clientes.');
      return self.clients.claim(); // Permite que el SW activo controle los clientes inmediatamente.
    })
  );
});

// Evento 'fetch'
self.addEventListener('fetch', event => {
  
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para las llamadas (process.php)
  if (event.request.url.includes('process.php')) {
    event.respondWith(
      fetch(event.request).catch(error => {
        console.warn('Service Worker: Llamada a API fallida (probablemente offline):', event.request.url, error);
        throw error; 
      })
    );
    return;
  }

  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }


        return fetch(event.request).then(networkResponse => {

          if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
            return networkResponse; 
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return networkResponse;
        }).catch(error => {
          console.error('Service Worker: Falló la obtención (fetch) para:', event.request.url, error);

          throw error;
        });
      })
  );
});