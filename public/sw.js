/* Cache only the public application shell. Account/API responses never enter this cache. */
const base = new URL(self.registration.scope);
const cacheName = 'mkv-shell-v03:' + base.pathname;
const allowed = (url) => url.origin === base.origin && url.pathname.startsWith(base.pathname);
self.addEventListener('install', (event) =>
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName),
        response = await fetch(base.href, { cache: 'reload' });
      if (!response.ok) throw new Error('Application shell unavailable');
      await cache.put(base.href, response.clone());
      const html = await response.text();
      const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
        .map((m) => new URL(m[1], base))
        .filter((u) => allowed(u) && /\.(js|css|svg)$/.test(u.pathname));
      for (const asset of assets) {
        const result = await fetch(asset);
        if (!result.ok) continue;
        await cache.put(asset.href, result.clone());
        if (asset.pathname.endsWith('.css')) {
          const css = await result.text();
          const fonts = [...css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)]
            .map((m) => new URL(m[1], asset))
            .filter((u) => allowed(u) && /\.woff2?$/.test(u.pathname));
          await Promise.all(
            fonts.map(async (u) => {
              const f = await fetch(u);
              if (f.ok) await cache.put(u.href, f);
            }),
          );
        }
      }
      await self.skipWaiting();
    })(),
  ),
);
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== 'GET' || !allowed(url)) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(cacheName);
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put(base.href, response.clone());
          return response;
        } catch {
          return (await cache.match(base.href)) || Response.error();
        }
      })(),
    );
    return;
  }
  if (!['script', 'style', 'font', 'image'].includes(request.destination)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName),
        cached = await cache.match(request, { ignoreVary: true });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        if (keys.length > 256) {
          const old = keys.find((k) => k.url !== base.href);
          if (old) await cache.delete(old);
        }
      }
      return response;
    })(),
  );
});
