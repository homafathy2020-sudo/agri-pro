// src/services/salaryService.js
// Handles salary entries: base pay, bonuses, deductions, advances
import {
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  getDocs, query, where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLL = "salaryEntries";
const col  = () => collection(db, COLL);

export const salaryService = {
  async getAll(userId) {
    const q    = query(col(), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  },

  async add(userId, data) {
    const ref = await addDoc(col(), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id, data) {
    await updateDoc(doc(db, COLL, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async remove(id) {
    await deleteDoc(doc(db, COLL, id));
  },
};
