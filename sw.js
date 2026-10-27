// Offline support: keeps a copy of every game file so it works without internet.
// tools/stamp-sw.mjs rewrites VERSION and FILES before each publish, which is what
// tells installed copies that an update is available.
const VERSION = '45198b893b4e';
const FILES = ["./","./index.html","./manifest.webmanifest","./css/app.css","./js/art/catalog.js","./js/art/color.js","./js/art/friends.js","./js/art/unicorn.js","./js/audio/sfx.js","./js/debug.js","./js/engine/facts.js","./js/engine/log.js","./js/engine/model.js","./js/engine/schedule.js","./js/engine/sim.js","./js/engine/tricks.js","./js/main.js","./js/store/db.js","./js/ui/designer.js","./js/ui/dom.js","./js/ui/fx.js","./js/ui/grownups.js","./js/ui/hatch.js","./js/ui/home.js","./js/ui/keypad.js","./js/ui/map.js","./js/ui/progress.js","./js/ui/results.js","./js/ui/session.js","./js/ui/visuals.js","./js/ui/window.js","./fonts/fredoka-latin.woff2","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png"];
const CACHE = `rainbow-isles-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE)
    .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('rainbow-isles-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)
    .then((res) => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    })
    .catch(() => (req.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
