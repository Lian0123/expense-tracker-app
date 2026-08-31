// finalize-pages.mjs stamps a new cache name for every production build so a
// changed hashed app shell cannot be hidden behind a stale cache.
const CACHE = '__DAILY_LEDGER_CACHE__';
const CHARACTER_STATES = [
  'idle',
  'welcome',
  'input',
  'thinking',
  'income',
  'expense',
  'edit',
  'error',
  'empty',
  'import',
  'export',
  'warning',
];
const SCENES = ['morning', 'noon', 'dusk', 'night', 'late-night'];
const IMAGE_FORMATS = ['avif', 'webp', 'png'];
const CORE = [
  './',
  './app/',
  './en/',
  './manifest.webmanifest',
  './assets/brand/hana-app-icon-192.png',
  './assets/brand/hana-app-icon-512.png',
  ...CHARACTER_STATES.flatMap((state) =>
    IMAGE_FORMATS.map((format) => `./assets/characters/hana-${state}.${format}`),
  ),
  ...SCENES.flatMap((scene) =>
    IMAGE_FORMATS.map((format) => `./assets/backgrounds/shrine-${scene}.${format}`),
  ),
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(new URL(event.request.url).pathname.includes('/app/') ? './app/' : './'),
        );
    }),
  );
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
