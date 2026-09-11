// src/config/firebase.js
// ─────────────────────────────────────────────
// نسخة "بيئة تجريبية" — بتشاور على مشروع my-app-load-test بس، ومفيهاش
// أي علاقة بمشروع الإنتاج (agri-pro-2b607). منسوخة حرفيًا من الملف
// الأصلي، والاختلاف الوحيد هو firebaseConfig تحت.
// ─────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from "firebase/firestore";
import { getAuth, setPersistence, indexedDBLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBLJjOYcleAkXJSAC2GMu5w4Deq8k1vJvY",
  authDomain: "my-app-load-test.firebaseapp.com",
  projectId: "my-app-load-test",
  storageBucket: "my-app-load-test.firebasestorage.app",
  messagingSenderId: "267315152167",
  appId: "1:267315152167:web:5331feaaebc4bd2894d502",
};

const app = initializeApp(firebaseConfig);

// Offline cache (PWA-friendly) — نفس المنطق بالظبط زي ملف الإنتاج، من غير
// أي تعديل: persistentMultipleTabManager يخلي offline persistence شغالة
// حتى لو التطبيق مفتوح في أكتر من تاب، ولو IndexedDB مش متاحة بيرجع
// لـ memory cache بدل ما يكسر التطبيق.
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (err) {
  console.warn("Persistent offline cache unavailable, falling back to memory cache:", err);
  db = initializeFirestore(app, { localCache: memoryLocalCache() });
}
export { db };

export const auth = getAuth(app);

setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
  console.warn("Auth persistence setup failed:", err);
});

export default app;