/* Memoris service worker: the app shell opens offline; data always comes from the network. */
const CACHE = 'memoris-v4';
const SHELL = ['./', './favicon.svg', './manifest.webmanifest', './icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase API and photos: always the network

  if (req.mode === 'navigate') {
    // New deploys show up right away; offline falls back to the cached shell.
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }

  // Everything else (hashed assets, fonts, seed photos): show the cached copy, refresh it in the background.
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) c.put(req, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || fresh;
    }),
  );
});

// ───────── Web Push ─────────
self.addEventListener('push', (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { body: e.data ? e.data.text() : '' };
  }
  e.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // The app is open and visible: update it quietly instead of showing a banner.
      if (wins.some((w) => w.visibilityState === 'visible')) {
        wins.forEach((w) => w.postMessage({ type: 'push', url: d.url }));
        return;
      }
      await self.registration.showNotification(d.title || 'Memoris', {
        body: d.body || '',
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: d.tag,
        renotify: Boolean(d.tag),
        data: { url: d.url || '#/' },
      });
    })(),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const hash = (e.notification.data && e.notification.data.url) || '#/';
  e.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const mine = wins.find((w) => w.url.startsWith(self.registration.scope));
      if (mine) {
        mine.postMessage({ type: 'goto', hash });
        await mine.focus();
      } else {
        await self.clients.openWindow(new URL(hash, self.registration.scope).href);
      }
    })(),
  );
});
