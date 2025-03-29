const CACHE_NAME = "pwa-cache-v1";

// Масив ресурсів, які будуть кешовані при встановленні Service Worker 
// ви кешуєте всі свої файли
const ASSETS = [
  "/",                      // Головна сторінка
  "/index.html",            // HTML-файл
  "/addEditModal.html", // HTML-файл для модального вікна
  "/dashboard.html",        // HTML-файл для панелі керування
  "/tasks.html",          // HTML-файл для сторінки завдань
  "/messages.html",        // HTML-файл для сторінки повідомлень
  "/messagesFunctional.js", // JavaScript-файл для функціоналу повідомлень
  "/messagesStyle.css",    // CSS-стилі для повідомлень
  "/style.css",             // CSS-стилі
  "/index.js",             // Головний JavaScript-файл
  "/images",                 // ❌ Некоректно: "icons" - це папка, її не можна кешувати напряму
// загалом так, але у мене не хотіло кешувати без цієї папки, якщо у вас кешує без додаткового вказування, то не додавайте її
//   "/icons/icons.128.png",   // Іконка 128px
//   "/icons/icons.512.png",   // Іконка 512px
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

// Подія встановлення Service Worker
// Відбувається при першому запуску або коли SW оновлюється
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Кешування ресурсів...");// логування не обовязкове
      // Додаємо файли до кешу, якщо якийсь файл не вдасться завантажити, обробляємо помилку
      return cache.addAll(ASSETS).catch(console.error);
    })
  );
});

// Подія обробки запитів від клієнта (браузера)
// Якщо файл є в кеші – повертаємо його, інакше робимо запит до мережі
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // Запит до мережі, якщо ресурсу немає в кеші
        const networkFetch = fetch(event.request).then((networkResponse) => {
          // Зберігаємо отриманий файл у кеш для майбутніх запитів
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });

        // Повертаємо кешовану версію, якщо вона є, інакше робимо запит до мережі
        return cachedResponse || networkFetch;
      });
    })
  );
});

// Подія активації Service Worker
// Видаляє старі кеші, які більше не використовуються
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // Знаходимо старі кеші
          .map((key) => caches.delete(key))   // Видаляємо їх
      );
    }).then(() => {
      console.log("Новий Service Worker активовано.");
      return self.clients.claim(); // Переключаємо новий SW для всіх вкладок
    })
  );
});