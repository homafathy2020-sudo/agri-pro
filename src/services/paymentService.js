// src/services/paymentService.js
import {
  collection, doc,
  setDoc, updateDoc, deleteDoc,
  getDocs, query, where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";

const col = () => collection(db, COLLECTIONS.PAYMENTS);

export const paymentService = {
  async getAll(userId) {
    // No orderBy — sort in JS to avoid needing a Firestore index
    const q    = query(col(), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  },

  async getByJob(userId, jobId) {
    const q    = query(col(), where("userId", "==", userId), where("jobId", "==", jobId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  },

  // Returns { id, promise } — see equipmentService.js for why.
  add(userId, data) {
    const ref = doc(col());
    // ISO string (not serverTimestamp) so the exact moment the payment was
    // recorded is available immediately in local state — see jobService.js.
    const promise = setDoc(ref, { ...data, userId, createdAt: new Date().toISOString() });
    return { id: ref.id, promise };
  },

  update(id, data) {
    return updateDoc(doc(db, COLLECTIONS.PAYMENTS, id), { ...data, updatedAt: serverTimestamp() });
  },

  remove(id) {
    return deleteDoc(doc(db, COLLECTIONS.PAYMENTS, id));
  },
};
