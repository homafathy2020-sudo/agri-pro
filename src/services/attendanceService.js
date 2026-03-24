// src/services/attendanceService.js
import {
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  getDocs, query, where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLL = "attendance";
const col  = () => collection(db, COLL);

export const attendanceService = {
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
