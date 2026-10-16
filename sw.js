// Service Worker untuk Sistem Kesiswaan PWA
const CACHE_NAME = 'kesiswaan-app-v34';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/print.css',
  './js/data.js',
  './js/storage.js',
  './js/supabase-client.js',
  './js/auth.js',
  './js/siswa-portal.js',
  './js/admin-portal.js',
  './js/forms.js',
  './js/app.js',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Menghapus cache lama:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Hanya tangani request GET untuk aset lokal
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Lewati request eksternal (CDN, API Supabase, Gambar Unsplash, dsb)
  if (url.origin !== self.location.origin) return;

  const isNavigationOrHtml = event.request.mode === 'navigate' || 
                             (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) ||
                             url.pathname.endsWith('index.html') || url.pathname === '/' || url.pathname === '';

  if (isNavigationOrHtml) {
    // NETWORK FIRST untuk navigasi/HTML agar update UI dan penghapusan teks lama langsung tampil
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request).then((cached) => cached || caches.match('./index.html'));
      })
    );
    return;
  }

  // Network First untuk skrip js dan css lokal selama masa aktif pengembangan
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const resClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});

