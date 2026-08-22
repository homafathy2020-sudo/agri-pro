// src/services/adminMessageService.js
// ─────────────────────────────────────────────────────────
// تنبيهات بيبعتها الأدمن يدوياً للمستخدمين — إما لكل الشركات مرة واحدة،
// أو لشركة واحدة بعينها. بتظهر جوه نفس صفحة "التنبيهات" الموجودة أصلاً
// (useNotifications) جنب تنبيهات الصيانة والمستحقات، مش في مكان منفصل.
// ─────────────────────────────────────────────────────────
import {
  addDoc, deleteDoc, doc, collection, query, where,
  getDocs, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";

const col = () => collection(db, COLLECTIONS.ADMIN_MESSAGES);

export const adminMessageService = {
  /** أدمن بس — targetUserId = null يعني "لكل الشركات". */
  send: ({ title, body, severity = "medium", targetUserId = null }) => {
    const admin = auth.currentUser;
    return addDoc(col(), {
      title,
      body,
      severity, // "high" | "medium"
      targetUserId,
      createdBy: admin?.uid || null,
      createdAt: serverTimestamp(),
    });
  },

  /** سجل كل الرسائل اللي الأدمن بعتها (تاريخياً)، أدمن بس. */
  getAllForAdmin: async () => {
    const q = query(col(), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  /**
   * الرسائل اللي مفروض المستخدم الحالي يشوفها: العامة (targetUserId ==
   * null) + الموجّهة له بالتحديد. كويريتين منفصلتين لأن Firestore مش
   * بيدعم دمج null مع قيمة تانية في فلتر "in" واحد، بعدين بندمجهم هنا.
   */
  getForUser: async (uid) => {
    const [broadcastSnap, targetedSnap] = await Promise.all([
      getDocs(query(col(), where("targetUserId", "==", null))),
      getDocs(query(col(), where("targetUserId", "==", uid))),
    ]);
    const rows = [
      ...broadcastSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      ...targetedSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    ];
    rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return rows;
  },

  /** أدمن بس — سحب رسالة كان بعتها (بتختفي عند كل المستخدمين). */
  remove: (id) => deleteDoc(doc(db, COLLECTIONS.ADMIN_MESSAGES, id)),
};
