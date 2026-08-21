// src/services/userProfileService.js
// ─────────────────────────────────────────────────────────
// ملف بروفايل صغير لكل مستخدم في users/{uid}: اسم، إيميل، تاريخ
// تسجيل، وآخر نشاط. الهدف الوحيد منه إن الأدمن يقدر يشوف قائمة
// الحسابات — البيانات التشغيلية الفعلية (معدات/شغل/سائقين) فاضلة
// في مجموعاتها القديمة زي ما هي، معزولة بنفس الـ userId.
// ─────────────────────────────────────────────────────────
import { doc, setDoc, getDocs, collection, query, orderBy } from "firebase/firestore";
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
   * أي حد تاني يقرا القائمة دي — استدعاء الدالة دي من حساب مش أدمن
   * هيرجع permission-denied مش بيانات وهمية.
   */
  getAll: async () => {
    const q = query(collection(db, COLLECTIONS.USERS), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};
