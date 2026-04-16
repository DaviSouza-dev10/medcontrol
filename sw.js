const CACHE_NAME = "medcontrol-v1";
const APP_SHELL = [
    "./",
    "./index.html",
    "./login.html",
    "./cadastro.html",
    "./dashboard.html",
    "./style.css",
    "./js/pwa.js",
    "./js/auth.js",
    "./js/firebase.js",
    "./js/script.js",
    "./manifest.webmanifest",
    "./assets/icon-192.svg",
    "./assets/icon-512.svg",
    "./assets/alerta.mp3.mp3"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }

                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });

                    return networkResponse;
                })
                .catch(() => caches.match("./index.html"));
        })
    );
});

self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "Hora do seu remedio";
    const options = {
        body: data.body || "Abra o MedControl para conferir o lembrete.",
        icon: "./assets/icon-192.svg",
        badge: "./assets/icon-192.svg",
        data: {
            url: data.url || "./dashboard.html"
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const destino = event.notification.data?.url || "./dashboard.html";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(destino) && "focus" in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(destino);
            }
        })
    );
});
