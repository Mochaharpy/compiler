const CACHE_NAME = 'my-offline-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/console.min.js',
  '/core.min.js',
  '/editor.min.js',
  '/file-actions.min.js',
  '/importJSON.min.js',
  '/preview.min.js',
  '/resize.min.js',
  '/zip.min.js',
  '/sw.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
