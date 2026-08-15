/* eslint-disable no-restricted-globals */

// src/service-worker.js
// ─────────────────────────────────────────────────────────
// ده الملف اللي بيخلي التطبيق يشتغل أوف لاين فعليًا: بيخزّن
// (precache) كل ملفات الموقع (JS/CSS/HTML) وقت أول تحميل،
// وبعدين المتصفح بيقرأها من الجهاز مباشرة من غير ما يحتاج نت.
// بيانات Firestore نفسها بالفعل عندها كاش محلي منفصل (IndexedDB)
// من إعداد enableIndexedDbPersistence في src/config/firebase.js.
//
// لازم الملف ده يفضل جوه src/ عشان react-scripts (CRA) يعرف
// يلاقيه وقت الـ build ويحقن فيه __WB_MANIFEST بأسماء الملفات
// الحقيقية (باللي فيها hash) تلقائيًا.
// ─────────────────────────────────────────────────────────

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from "workbox-strategies";

clientsClaim();

// Precache كل الملفات اللي بيبنيها الـ build (JS, CSS, media...)
// بأسمائها الحقيقية اللي فيها hash — بيتحقن أوتوماتيك وقت npm run build.
// eslint-disable-next-line no-undef
precacheAndRoute(self.__WB_MANIFEST);

// App shell routing: أي طلب تنقّل (فتح صفحة) بيرجّع index.html من الكاش
// عشان الراوتس بتاعة React Router تشتغل حتى أوف لاين.
const fileExtensionRegexp = new RegExp("/[^/?]+\\.[^/]+$");
registerRoute(
  ({ request, url }) => {
    if (request.mode !== "navigate") return false;
    if (url.pathname.startsWith("/_")) return false;
    if (url.pathname.match(fileExtensionRegexp)) return false;
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + "/index.html")
);

// خطوط جوجل (Cairo / Tajawal) — تتخزن بعد أول تحميل، عشان الخط
// يفضل يظهر صح حتى أوف لاين.
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
  new StaleWhileRevalidate({
    cacheName: "google-fonts",
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
);

// أيقونات/صور ثابتة من نفس الأصل
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "app-images",
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  })
);

// طلبات Firestore/Firebase: سيبها تروح للنت أولًا، ولو مفيش نت
// خليها ترجع تفشل بهدوء — Firestore SDK نفسه عنده كاش IndexedDB
// منفصل (enableIndexedDbPersistence) بيتكفل بالبيانات أوف لاين،
// فمش محتاجين الـ service worker يتدخل في طلبات الشبكة دي.
registerRoute(
  ({ url }) =>
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis.com"),
  new NetworkFirst({ cacheName: "firebase-network-first" })
);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
