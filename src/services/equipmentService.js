// src/services/equipmentService.js
import {
  collection, doc,
  setDoc, updateDoc, deleteDoc,
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
   *
   * Returns `{ id, promise }` — NOT a promise of the id. `doc(col())`
   * generates the new document's id locally, with no network round-trip,
   * so callers can update the UI immediately. `promise` resolves once
   * Firestore acknowledges the write on the server, which — important
   * while offline — can take a while (it won't resolve at all until
   * connectivity returns), so callers should only use it for background
   * sync tracking, never await it before showing the change to the user.
   */
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

  /**
   * Update an existing equipment document. Returns the write promise —
   * same offline caveat as add() above.
   */
  update(id, data) {
    const ref = doc(db, COLLECTIONS.EQUIPMENT, id);
    return updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  },

  /**
   * Delete an equipment document. Returns the write promise — same
   * offline caveat as add() above.
   */
  remove(id) {
    const ref = doc(db, COLLECTIONS.EQUIPMENT, id);
    return deleteDoc(ref);
  },
};

