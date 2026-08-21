// src/services/userProfileService.js
// ─────────────────────────────────────────────────────────
// ملف بروفايل صغير لكل مستخدم في users/{uid}: اسم، إيميل، تاريخ
// تسجيل، وآخر نشاط. الهدف الوحيد منه إن الأدمن يقدر يشوف قائمة
// الحسابات — البيانات التشغيلية الفعلية (معدات/شغل/سائقين) فاضلة
// في مجموعاتها القديمة زي ما هي، معزولة بنفس الـ userId.
// ─────────────────────────────────────────────────────────
import { doc, setDoc, collection, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";

export const userProfileService = {
  /**
   * بينشئ البروفايل أول مرة أو بيحدّثه بعد كده — نفس الدالة للحالتين
   * بفضل merge:true. createdAt بيتبعت مرة واحدة بس (وقت التسجيل)،
   * وأي نداء تاني من غيرها (lastActiveAt فقط) مش بيلمسها خالص.
   */
  touch: (uid, data) =>
    setDoc(doc(db, COLLECTIONS.USERS, uid), data, { merge: true }),

  /**
   * أدمن بس: قاعدة isAdmin() في firestore.rules هي اللي فعلياً بتمنع
   * أي حد تاني يقرا العدد ده — استدعاء الدالة دي من حساب مش أدمن هيرجع
   * permission-denied. بتستخدم getCountFromServer عشان تجيب رقم العدد
   * بس من غير ما تنزّل بيانات أي مستخدم (اسم/إيميل/نشاط) للمتصفح خالص.
   */
  getCount: async () => {
    const snap = await getCountFromServer(collection(db, COLLECTIONS.USERS));
    return snap.data().count;
  },

  /**
   * أدمن بس (نفس قاعدة isAdmin() في firestore.rules، allow list). بترجع
   * تفاصيل كل الحسابات (اسم/إيميل/تاريخ تسجيل/آخر نشاط) عشان شاشة
   * الأدمن. أي حساب مش أدمن هياخد permission-denied بدل البيانات.
   */
  getAll: async () => {
    const snap = await getDocs(collection(db, COLLECTIONS.USERS));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  },
};
