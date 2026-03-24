// src/services/equipmentService.js
import {
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  getDocs, query, where, orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";

const col = () => collection(db, COLLECTIONS.EQUIPMENT);

export const equipmentService = {
  /**
   * Fetch all equipment for a farm (userId scope).
   */
  async getAll(userId) {
    const q = query(col(), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  /**
   * Add new equipment document.
   */
  async add(userId, data) {
    const ref = await addDoc(col(), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  /**
   * Update an existing equipment document.
   */
  async update(id, data) {
    const ref = doc(db, COLLECTIONS.EQUIPMENT, id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  },

  /**
   * Delete an equipment document.
   */
  async remove(id) {
    const ref = doc(db, COLLECTIONS.EQUIPMENT, id);
    await deleteDoc(ref);
  },
};
