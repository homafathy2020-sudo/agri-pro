// src/services/userProfileService.js
// ─────────────────────────────────────────────────────────
// ملف بروفايل صغير لكل مستخدم في users/{uid}: اسم، إيميل، تاريخ
// تسجيل، وآخر نشاط. الهدف الوحيد منه إن الأدمن يقدر يشوف قائمة
// الحسابات — البيانات التشغيلية الفعلية (معدات/شغل/سائقين) فاضلة
// في مجموعاتها القديمة زي ما هي، معزولة بنفس الـ userId.
// ─────────────────────────────────────────────────────────
import {
  doc, setDoc, collection, getDocs, getCountFromServer,
  query, orderBy, limit, startAfter,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";

// عدد الشركات في كل صفحة من لوحة الأدمن الرئيسية (getPage تحت). قيمة
// متوسطة: مش صغيرة جداً تخلي "تحميل المزيد" مزعج، ومش كبيرة تلغي فايدة
// الترقيم أصلاً.
const ADMIN_PAGE_SIZE = 25;

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

  /**
   * audit finding F-019 (Phase 4): صفحة واحدة بس من الشركات (الأحدث
   * تسجيلاً أولاً)، بدل getAll() اللي بتجيب كل شركة في النظام في كل
   * فتحة صفحة — التكلفة دي كانت بتكبر خطياً مع عدد الشركات (شوف قسم
   * "قابلية التوسّع" في تقرير التدقيق). getAll() فضلت موجودة زي ما هي
   * ومتستخدمش هنا — لسه لازمة لقائمة اختيار الشركة المستهدفة في صفحة
   * رسائل الأدمن، واللي محتاجة كل الشركات فعلاً مش صفحة واحدة.
   *
   * `cursor` = آخر مستند (DocumentSnapshot) من الصفحة اللي فاتت، أو
   * null للصفحة الأولى. الترتيب بـ createdAt وحده (بدون أي where()
   * مركّب معاه) — ده معناه فهرس Firestore التلقائي لحقل واحد كافي، من
   * غير أي حاجة تتضاف في firestore.indexes.json.
   *
   * ⚠️ عادة فريق (F-016): أي استعلام مستقبلي بيجمع where() + orderBy()
   * على حقلين مختلفين هنا محتاج فهرس مركّب يتضاف يدوياً في
   * firestore.indexes.json قبل النشر — من غيره الاستعلام هيفشل في
   * الإنتاج برسالة فيها رابط لإنشاء الفهرس تلقائياً من الـ Console.
   *
   * ⚠️ افتراض موثّق: الترتيب بـ createdAt بيفترض إن كل مستند شركة عنده
   * الحقل ده. ده مضمون لأي حساب اتعمل عن طريق register() في
   * AuthContext.jsx (بيبعته وقت التسجيل مباشرة، ومفيش أي نداء تاني
   * لـ touch() بيلمسه بعد كده). لو يوم اكتشفت شركة مش ظاهرة في القائمة
   * المرقّمة لسبب غريب، استخدم مربع البحث فوق — بيعمل getAll() كاملة
   * زي الأول، فمش متأثر بالمشكلة دي أبداً.
   */
  getPage: async ({ pageSize = ADMIN_PAGE_SIZE, cursor = null } = {}) => {
    const base = cursor
      ? query(collection(db, COLLECTIONS.USERS), orderBy("createdAt", "desc"), startAfter(cursor), limit(pageSize + 1))
      : query(collection(db, COLLECTIONS.USERS), orderBy("createdAt", "desc"), limit(pageSize + 1));

    const snap = await getDocs(base);
    const hasMore = snap.docs.length > pageSize;
    const pageDocs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

    return {
      items: pageDocs.map((d) => ({ uid: d.id, ...d.data() })),
      // الـ DocumentSnapshot نفسه (مش بس الـ id) — startAfter محتاجه
      // عشان يعرف قيمة createdAt اللي يبدأ بعدها من غير قراءة إضافية.
      nextCursor: pageDocs.length ? pageDocs[pageDocs.length - 1] : null,
      hasMore,
    };
  },
};
