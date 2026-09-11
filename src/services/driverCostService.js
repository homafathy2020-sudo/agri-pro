// src/services/driverCostService.js
// ملحوظة: الخدمة دي legacy — مش بتتنادى حاليًا من أي مكان في التطبيق
// غير DataContext (قراءة/تنظيف بيانات قديمة قبل نظام الرواتب الحالي).
import {
  collection, doc,
  setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const col = (uid) => collection(db, "users", uid, "driverCosts");

export const driverCostService = {
  async getAll(userId) {
    const snap = await getDocs(col(userId));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  },

  // Live-subscribe — see paymentService.js for why the sort is client-side.
  // NOTE: useDataLoader.js deliberately skips calling this once a device
  // has already confirmed (via driverCostsMigratedKey) that this legacy
  // collection is fully drained, to avoid leaving a permanently-idle
  // listener open on an empty collection forever.
  subscribe(userId, onData, onError) {
    return onSnapshot(
      col(userId),
      (snap) => onData(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      ),
      onError
    );
  },

  add(userId, data) {
    const ref = doc(col(userId));
    const promise = setDoc(ref, { ...data, createdAt: serverTimestamp() });
    return { id: ref.id, promise };
  },

  async update(userId, id, data) {
    await updateDoc(doc(col(userId), id), { ...data, updatedAt: serverTimestamp() });
  },

  async remove(userId, id) {
    await deleteDoc(doc(col(userId), id));
  },
};
