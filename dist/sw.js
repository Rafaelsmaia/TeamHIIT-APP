const CACHE_NAME = 'team-hiit-v3-' + Date.now();
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Erro ao fazer cache:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições - SEMPRE BUSCAR VERSÃO MAIS RECENTE
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // CRÍTICO: NÃO interceptar NENHUMA requisição do Firebase ou APIs externas
  // Isso é especialmente importante no Android/Chrome
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('cloudfunctions.net') ||
      url.hostname.includes('firebaseapp.com') ||
      url.hostname.includes('identitytoolkit') ||
      url.hostname.includes('securetoken') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('cloudflare') ||
      event.request.method !== 'GET') {
    // Deixar requisições de API passar direto sem interceptação
    return;
  }

  event.respondWith(
    // SEMPRE buscar na rede primeiro para garantir versão mais recente
    fetch(event.request)
      .then((response) => {
        // Se a requisição for bem-sucedida, cache apenas GET requests
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se falhar na rede, tenta buscar no cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Se falhar no cache também, retorna página offline
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Notificações Push
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Team HIIT',
    body: 'Nova atualização disponível!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };

  // Processar dados da notificação
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.notification?.title || 'Team HIIT',
        body: data.notification?.body || 'Nova mensagem!',
        icon: data.notification?.icon || '/icon-192x192.png',
        badge: data.notification?.badge || '/icon-192x192.png',
        data: data.data || {}
      };
    } catch (error) {
      console.log('Erro ao processar dados da notificação:', error);
      notificationData.body = event.data.text() || 'Nova atualização disponível!';
    }
  }

  const options = {
    ...notificationData,
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      {
        action: 'explore', 
        title: 'Ver Treinos',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close', 
        title: 'Fechar',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

