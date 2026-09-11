// src/config/firebase.js
// ─────────────────────────────────────────────
// Replace the firebaseConfig values below with
// your own project credentials from Firebase Console
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
  apiKey: "AIzaSyAi2k3zZiMrrAFelWxk7l2524GYBh7i8I4",
  authDomain: "agri-pro-2b607.firebaseapp.com",
  projectId: "agri-pro-2b607",
  storageBucket: "agri-pro-2b607.firebasestorage.app",
  messagingSenderId: "921780884129",
  appId: "1:921780884129:web:4645eab14a0d76250c56e0",
};


const app = initializeApp(firebaseConfig);

// Offline cache (PWA-friendly).
// persistentMultipleTabManager() means offline persistence keeps working
// even if the user has the app open in more than one tab at once — the old
// enableIndexedDbPersistence() API silently disabled persistence entirely
// on the 2nd+ tab, which meant only one open tab actually worked offline.
// If IndexedDB truly isn't available (very old/locked-down browsers), fall
// back to an in-memory cache so the app doesn't crash — it just won't
// survive a reload while offline in that rare case.
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

// Explicit IndexedDB-backed session persistence — keeps the logged-in
// session available across reloads even while fully offline (this is close
// to the SDK's web default already, but we set it explicitly so it doesn't
// silently change if Firebase's default ever does).
setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
  console.warn("Auth persistence setup failed:", err);
});

export default app;
