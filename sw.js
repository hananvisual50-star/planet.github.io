// Nama Cache untuk PWA
const CACHE_NAME = 'planet-production-v1';

// File lokal di GitHub yang perlu dicache agar PWA bisa terbuka secara instan saat offline / semi-online
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Tahap Install: Membuat cache lokal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mencadangkan aset lokal');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Tahap Aktifasi: Menghapus cache lama jika ada pembaruan versi
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Strategi Fetching: Mengutamakan jaringan terlebih dahulu (Network-first), 
// lalu jatuh kembali ke cache jika pengguna sedang offline.
// Pendekatan ini sangat krusial karena isi aplikasi utama Anda berada di dalam iframe eksternal (Google Apps Script).
self.addEventListener('fetch', (event) => {
  // Hanya intercept request dengan skema http/https
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jika sukses mengambil data terbaru, simpan salinannya ke cache jika file tersebut ada di aset lokal kita
        if (event.request.method === 'GET' && ASSETS_TO_CACHE.some(asset => event.request.url.includes(asset.replace('./', '')))) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Jika offline atau gagal memuat jaringan, cari di cache lokal
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jika tidak ada di cache dan ini adalah navigasi utama, berikan fallback offline sederhana
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
