// NoCashClub Service Worker
// Bewusst schlank gehalten: sorgt nur dafür, dass die Seite als App installierbar ist
// und die wichtigsten statischen Dateien offline verfügbar bleiben. Live-Daten (Supabase)
// werden NIE zwischengespeichert, damit nie veraltete Zettel/Nachrichten angezeigt werden.

const CACHE_NAME = "nocashclub-shell-v1";
const SHELL_FILES = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nie API-Aufrufe (Supabase) oder andere fremde Domains zwischenspeichern.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
