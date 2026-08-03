// ============================================================
// sw.js — Service Worker MONITORING GDFG
// Ganti CACHE_VERSION setiap kali ada update file
// ============================================================

const CACHE_VERSION  = 'v1.0.4';
const CACHE_NAME     = 'monitoring-gdfg-' + CACHE_VERSION;

// File yang di-cache saat install
const PRECACHE_URLS = [
  './',
  './index.html',
  './js/api.js',
  './js/shim.js',
  './js/app.js',
  './js/dashboard.js',
  './js/input.js',
  './js/realisasi.js',
  './js/opname.js',
  './js/rdc.js',
  './js/stockjalur.js',
  './js/binloc.js',
  './js/monitoringekspor.js',
  './js/kpi.js',
];

// ── INSTALL: cache semua file ──────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// ── ACTIVATE: hapus cache versi lama ──────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── MESSAGE: handle SKIP_WAITING dari halaman ──────────────────
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// ── FETCH: Network First untuk JS/HTML, Cache First untuk asset ──
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Skip request ke Worker / GAS / API eksternal — jangan di-cache
  if (
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('gdfg-app.online') ||
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fontawesome.com')
  ) {
    return; // biarkan browser handle langsung
  }

  // Untuk file lokal (index.html, js/*): Network First
  // → ambil dari network, kalau gagal fallback ke cache
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        // Update cache dengan versi terbaru
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        // Network gagal → fallback ke cache
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});
