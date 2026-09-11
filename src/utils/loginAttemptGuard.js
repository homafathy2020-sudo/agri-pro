// src/utils/loginAttemptGuard.js
//
// audit finding F-023: مفيش أي طبقة حماية من جانب التطبيق ضد محاولات
// تخمين كلمة المرور المتكررة، غير الحد الافتراضي اللي Firebase نفسه بيرجعه
// (auth/too-many-requests) — واللي بيتفعّل متأخر شوية وعلى مستوى مشروع
// Firebase كله، مش بالضرورة بسرعة كافية لمحاولة تخمين من متصفح واحد.
//
// ⚠️ الطبقة دي "تهدئة" إضافية بسيطة من جانب المتصفح (localStorage) بس —
// مش بديل حقيقي عن حماية من جانب الخادم، وأي حد يعرف يستخدم أدوات
// المطوّر يقدر يتجاوزها بسهولة (يمسح localStorage، يفتح نافذة تصفح خفي،
// يستخدم متصفح تاني). هدفها الوحيد رفع تكلفة أي محاولة تخمين آلية بسيطة
// وبطيئة من نفس المتصفح — مش صد هجوم جاد. الحماية الحقيقية طويلة المدى
// لازم تكون عبر Firebase App Check أو مكافئ من جانب خادم حقيقي (المشروع
// حاليًا معندوش خادم مخصص أصلًا — راجع قسم "تدقيق الأمان" في تقرير
// التدقيق للتفاصيل).
const STORAGE_PREFIX = "loginAttempts:";
const MAX_FREE_ATTEMPTS = 3;        // أول 3 محاولات فاشلة من غير أي تهدئة
const BASE_LOCKOUT_MS = 5_000;      // 5 ثواني أول تهدئة بعدها
const MAX_LOCKOUT_MS = 5 * 60_000;  // سقف 5 دقايق حتى لو استمرت المحاولات

const keyFor = (email) => `${STORAGE_PREFIX}${String(email || "").trim().toLowerCase()}`;

const read = (email) => {
  try {
    const raw = localStorage.getItem(keyFor(email));
    return raw ? JSON.parse(raw) : { count: 0, lockedUntil: 0 };
  } catch {
    // خصوصية/تخزين متصفح معطّل — منعاملش المستخدم كمقفول عليه أبدًا.
    return { count: 0, lockedUntil: 0 };
  }
};

const write = (email, state) => {
  try { localStorage.setItem(keyFor(email), JSON.stringify(state)); } catch {}
};

/** بترجع { locked, remainingMs } — استخدمها قبل أي محاولة دخول. */
export const checkLoginLock = (email) => {
  const { lockedUntil } = read(email);
  const remainingMs = lockedUntil - Date.now();
  return remainingMs > 0 ? { locked: true, remainingMs } : { locked: false, remainingMs: 0 };
};

/** تتسجل بعد أي محاولة دخول فاشلة (باسورد غلط) — بتحسب مدة التهدئة الجاية تصاعديًا. */
export const recordFailedLogin = (email) => {
  const state = read(email);
  const count = state.count + 1;
  let lockedUntil = 0;
  if (count > MAX_FREE_ATTEMPTS) {
    const extraFailures = count - MAX_FREE_ATTEMPTS;
    const ms = Math.min(BASE_LOCKOUT_MS * 2 ** (extraFailures - 1), MAX_LOCKOUT_MS);
    lockedUntil = Date.now() + ms;
  }
  write(email, { count, lockedUntil });
};

/** تتسجل بعد أي دخول ناجح — بترجّع العداد للصفر عشان صاحب الحساب الحقيقي ميفضلش مقفول عليه لأخطاء قديمة. */
export const clearLoginAttempts = (email) => {
  try { localStorage.removeItem(keyFor(email)); } catch {}
};

/** "٣٢ ثانية" / "دقيقتين" — لعرض المدة المتبقية بشكل مفهوم في رسالة التنبيه. */
export const formatRemaining = (ms) => {
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds} ثانية`;
  const minutes = Math.ceil(totalSeconds / 60);
  return minutes === 1 ? "دقيقة" : `${minutes} دقايق`;
};
