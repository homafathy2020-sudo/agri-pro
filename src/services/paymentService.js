// src/services/paymentService.js
import {
  collection, doc,
  addDoc, updateDoc, deleteDoc,
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

  async add(userId, data) {
    const ref = await addDoc(col(), { ...data, userId, createdAt: serverTimestamp() });
    return ref.id;
  },

  async update(id, data) {
    await updateDoc(doc(db, COLLECTIONS.PAYMENTS, id), { ...data, updatedAt: serverTimestamp() });
  },

  async remove(id) {
    await deleteDoc(doc(db, COLLECTIONS.PAYMENTS, id));
  },
};
