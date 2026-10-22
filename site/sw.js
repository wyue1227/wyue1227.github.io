// Retire only the old vocabulary shell. Never modify IndexedDB or unrelated caches.
self.addEventListener("install", (event) =>
  event.waitUntil(self.skipWaiting()),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("gojuon-shell-")) await caches.delete(key);
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  ),
);
