// src/services/errorLogService.js
// ─────────────────────────────────────────────────────────
// سجل أخطاء بسيط: أي خطأ يحصل عند أي مستخدم (سواء في الـ render نفسه،
// أو في كود async، أو promise rejection) بيتسجل هنا تلقائياً — اسم
// الخطأ، الصفحة، امتى، ومين المستخدم. الأدمن بس اللي يقدر يقراها
// (firestore.rules)، والمستخدم العادي "بيكتب" بس، مش بيشوف القائمة.
// ─────────────────────────────────────────────────────────
import {
  addDoc, collection, doc, updateDoc, deleteDoc,
  getDocs, query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";

const col = () => collection(db, COLLECTIONS.ERROR_LOGS);

// أقصى عدد صفوف نجيبهم للأدمن في نظرة واحدة — سجل الأخطاء ممكن يكبر
// بمرور الوقت، وده بيحدد تكلفة القراءة بدل ما نجيب آلاف الصفوف مرة واحدة.
const MAX_LOGS = 300;

export const errorLogService = {
  /**
   * best-effort دايماً — لو الكتابة نفسها فشلت (مثلاً المستخدم أوف لاين
   * وقت الخطأ، أو مش مسجل دخول أصلاً)، بنبلعها من غير ما نضيف خطأ فوق
   * خطأ. تسجيل الأخطاء نفسه لازم يكون آخر حاجة ممكن تكسر التطبيق.
   */
  log: async ({ message, stack, page, source = "app" }) => {
    try {
      const user = auth.currentUser;
      if (!user) return; // الـ rule محتاج userId، ومفيش حساب هنا نسجله باسمه
      await addDoc(col(), {
        userId: user.uid,
        userEmail: user.email || null,
        message: String(message || "").slice(0, 500),
        stack: String(stack || "").slice(0, 3000),
        page: page || window.location.pathname,
        source, // "boundary" (React render) | "window" (JS runtime) | "promise" (unhandled rejection)
        userAgent: navigator.userAgent,
        resolved: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      // متعمّد تجاهل الخطأ هنا — لو حتى تسجيل الخطأ فشل، مفيش أي فايدة
      // إننا نبلّغ المستخدم أو نحاول تاني.
    }
  },

  /** أدمن بس — الحماية الفعلية في firestore.rules. */
  getAll: async () => {
    const q = query(col(), orderBy("createdAt", "desc"), limit(MAX_LOGS));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  setResolved: (id, resolved) =>
    updateDoc(doc(db, COLLECTIONS.ERROR_LOGS, id), { resolved }),

  remove: (id) => deleteDoc(doc(db, COLLECTIONS.ERROR_LOGS, id)),
};
