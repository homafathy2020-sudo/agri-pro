// src/services/driverService.js
import {
  collection, doc,
  setDoc, updateDoc, deleteDoc,
  getDocs, query, where, orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";

const col = () => collection(db, COLLECTIONS.DRIVERS);

export const driverService = {
  async getAll(userId) {
    const q = query(col(), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // Returns { id, promise } — see equipmentService.js for why.
  add(userId, data) {
    const ref = doc(col());
    const promise = setDoc(ref, {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, promise };
  },

  update(id, data) {
    const ref = doc(db, COLLECTIONS.DRIVERS, id);
    return updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  },

  remove(id) {
    const ref = doc(db, COLLECTIONS.DRIVERS, id);
    return deleteDoc(ref);
  },
};
