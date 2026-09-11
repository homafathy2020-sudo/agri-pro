// src/services/supplierPaymentService.js
// Instalments the business pays OUT to a supplier against a supplierInvoice.
// Mirrors paymentService.js exactly (same relationship jobId↔payments has,
// here it's supplierInvoiceId↔supplierPayments) — same single-source-of-truth
// rule applies: the invoice never stores its own "amountPaid"/"remaining",
// those are always derived from this collection (see calculations.js).
import {
  collection, doc,
  setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, query, where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const col = (uid) => collection(db, "users", uid, "supplierPayments");

export const supplierPaymentService = {
  async getAll(userId) {
    const snap = await getDocs(col(userId));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  },

  // Live-subscribe — see paymentService.js for why the sort is client-side.
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

  async getByInvoice(userId, supplierInvoiceId) {
    const q = query(col(userId), where("supplierInvoiceId", "==", supplierInvoiceId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  },

  // Returns { id, promise } — see equipmentService.js for why.
  add(userId, data) {
    const ref = doc(col(userId));
    // ISO string (not serverTimestamp) — see jobService.js.
    const promise = setDoc(ref, { ...data, createdAt: new Date().toISOString() });
    return { id: ref.id, promise };
  },

  update(userId, id, data) {
    return updateDoc(doc(col(userId), id), { ...data, updatedAt: serverTimestamp() });
  },

  remove(userId, id) {
    return deleteDoc(doc(col(userId), id));
  },
};
