const CACHE = 'bastah-v2';
const FILES = [
  './', './index.html', './manifest.json', './assets/icon.svg', './css/styles.css',
  './js/app.js', './js/pwa.js', './js/store.js', './js/ui.js',
  './js/pages/home.js', './js/pages/stock.js', './js/pages/sales.js',
  './js/pages/customers.js', './js/pages/capital.js', './js/pages/finance.js', './js/pages/system.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))));
  self.clients.claim();
});

// شبكة أولاً، وإذا ما في إنترنت من الكاش
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(h => h || caches.match('./index.html')))
  );
});