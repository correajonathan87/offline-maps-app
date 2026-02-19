const SHELL_CACHE = 'app-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './src/main.js',
  './src/map/mapRenderer.js',
  './src/map/offlineTileLayer.js',
  './src/gps/locationService.js',
  './src/editor/mapEditor.js',
  './src/persistence/storage.js',
  './src/persistence/syncFolder.js',
  './src/io/fileInterop.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
