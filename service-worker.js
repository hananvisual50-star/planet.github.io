// Nama cache unik
const CACHE_NAME = 'planet-system-pwa-v1';

// Daftar aset pembungkus luar yang akan dicache agar PWA bisa terbuka langsung
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Tahap Install: Simpan aset statis pembungkus ke dalam cache lokal browser
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mencache aset shell aplikasi');
      return cache.addAll(ASSETS);
    })
  );
  // Langsung aktifkan Service Worker baru tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

// Tahap Aktivasi: Bersihkan cache versi lama jika ada pembaruan file
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache usang:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Tahap Fetching: Ambil aset pembungkus dari cache jika tersedia, atau ambil dari jaringan jika tidak dicache
self.addEventListener('fetch', (event) => {
  // Hanya proses metode GET untuk menghindari error pada GAS request
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
