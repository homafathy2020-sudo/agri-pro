// src/services/salaryService.js
// Handles salary entries: base pay, bonuses, deductions, advances
import {
  collection, doc,
  setDoc, updateDoc, deleteDoc,
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

  // Returns { id, promise } — see equipmentService.js for why.
  add(userId, data) {
    const ref = doc(col());
    const promise = setDoc(ref, {
      ...data,
      userId,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, promise };
  },

  update(id, data) {
    return updateDoc(doc(db, COLL, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  remove(id) {
    return deleteDoc(doc(db, COLL, id));
  },
};
