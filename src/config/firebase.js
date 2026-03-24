// src/config/firebase.js
// ─────────────────────────────────────────────
// Replace the firebaseConfig values below with
// your own project credentials from Firebase Console
// ─────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAi2k3zZiMrrAFelWxk7l2524GYBh7i8I4",
  authDomain: "agri-pro-2b607.firebaseapp.com",
  projectId: "agri-pro-2b607",
  storageBucket: "agri-pro-2b607.firebasestorage.app",
  messagingSenderId: "921780884129",
  appId: "1:921780884129:web:4645eab14a0d76250c56e0",
};


const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence (PWA-friendly)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Offline persistence: multiple tabs open");
  } else if (err.code === "unimplemented") {
    console.warn("Offline persistence: browser not supported");
  }
});

export default app;
