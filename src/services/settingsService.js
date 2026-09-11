// src/services/settingsService.js
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { DEFAULT_FUEL_PRICE } from "../config/constants";

// جوه users/{uid}/meta/settings بدل collection مستقل — نفس فكرة باقي
// بيانات المستخدم (equipment, jobs...) دلوقتي.
const settingsDocRef = (userId) => doc(db, "users", userId, "meta", "settings");

// باگ حقيقي كان موجود هنا: لو مستند meta/settings اتعمله setDoc(merge:true)
// أول مرة بحقل تاني غير fuelPrice (زي onboardingCompleted أو company —
// شوف features/onboarding/OnboardingFlow.jsx، بيحصل بالظبط كده لأي حساب
// جديد بيكمّل/يتخطى شاشة الإعداد الأولى قبل ما يلمس سعر الوقود خالص)،
// المستند بيتولد وهو ناقص fuelPrice تماماً — مش بس مستخدم قيمة افتراضية
// جوه initialState زي ما كان متوقع، لأن أول snapshot حقيقي بيستبدل
// state.settings بالكامل (SET_LOADED)، فـ fuelPrice بيبقى undefined
// فعلياً في الحالة، مش 12. النتيجة: أي setDoc لعملية شغل جديدة (بيحط
// fuelPriceAtJob من القيمة دي) كان بيفشل بالكامل بخطأ Firestore
// "Unsupported field value: undefined" — يعني العملية مش بتتسجل خالص.
// الإصلاح: القيمة الافتراضية دلوقتي بتترصّ (merge) تحت أي حقول فعلية في
// المستند، مش بس تتستخدم لو المستند مش موجود خالص — فـ fuelPrice
// مضمون وجوده دايماً بغض النظر عن أي حقل تاني اتكتب في المستند الأول.
const withDefaults = (data) => ({ fuelPrice: DEFAULT_FUEL_PRICE, ...data });

export const settingsService = {
  async get(userId) {
    const snap = await getDoc(settingsDocRef(userId));
    return withDefaults(snap.exists() ? snap.data() : {});
  },

  // Live-subscribe to the single settings document (not a collection —
  // see the doc ref above). `onData` gets the same shape `get()` resolves
  // to (falls back to the default fuel price when the doc doesn't exist
  // yet, or when it exists but doesn't have fuelPrice set — see
  // withDefaults() above), on the initial snapshot and every subsequent
  // change.
  subscribe(userId, onData, onError) {
    return onSnapshot(
      settingsDocRef(userId),
      (snap) => onData(withDefaults(snap.exists() ? snap.data() : {})),
      onError
    );
  },

  async save(userId, data) {
    await setDoc(settingsDocRef(userId), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },
};
