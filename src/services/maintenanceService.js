// src/services/maintenanceService.js
import {
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  getDocs, query, where, orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";

const col = () => collection(db, COLLECTIONS.MAINTENANCE);

export const maintenanceService = {
  async getAll(userId) {
    const q = query(col(), where("userId", "==", userId), orderBy("date", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async add(userId, data) {
    const ref = await addDoc(col(), {
      ...data,
      userId,
      // ISO string (not serverTimestamp) so the exact creation moment is
      // available immediately in local state — see jobService.js for why.
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id, data) {
    const ref = doc(db, COLLECTIONS.MAINTENANCE, id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  },

  async remove(id) {
    const ref = doc(db, COLLECTIONS.MAINTENANCE, id);
    await deleteDoc(ref);
  },
};
