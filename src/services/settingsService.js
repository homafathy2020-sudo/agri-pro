// src/services/settingsService.js
import {
  doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { COLLECTIONS, DEFAULT_FUEL_PRICE } from "../config/constants";

const settingsDocRef = (userId) => doc(db, COLLECTIONS.SETTINGS, userId);

export const settingsService = {
  async get(userId) {
    const snap = await getDoc(settingsDocRef(userId));
    if (snap.exists()) return snap.data();
    return { fuelPrice: DEFAULT_FUEL_PRICE };
  },

  async save(userId, data) {
    await setDoc(settingsDocRef(userId), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },
};
