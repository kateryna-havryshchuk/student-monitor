const CACHE_NAME = "pwa-cache-v2";

const ASSETS = [
  "/",                     
  "/index.html",          
  "/addEditModal.html", 
  "/dashboard.html",     
  "/tasks.html", 
  "/messages.html",
  "/messagesFunctional.js", 
  "/messagesStyle.css", 
  "/style.css",  
  "/index.js",        
  "/images",            
  "/images/web-app-manifest-128x128.png",
  "/images/web-app-manifest-192x192.png",
  "/images/web-app-manifest-256x256.png",
  "/images/web-app-manifest-512x512.png",
  "/images/user-icon.jpg",
  "/images/screenshot1.jpg",
  "/images/screenshot2.jpg",
  "/images/screenshot3PC.jpg",
  "/images/screenshot4PC.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Кешування ресурсів...");
      return cache.addAll(ASSETS).catch(console.error);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || networkFetch;
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      console.log("Новий Service Worker активовано.");
      return self.clients.claim();
    })
  );
});