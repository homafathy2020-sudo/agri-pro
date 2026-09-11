// src/utils/licenseState.js
// ─────────────────────────────────────────────────────────
// حساب "حالة الترخيص" المشتقة من مستند entitlements/{uid} — مشترك بين
// useEntitlement (صفحة الشركة) وAdminPage (لوحة الأدمن)، عشان الاثنين
// يحسبوا نفس الحالة بنفس المنطق بالظبط بدل ما يتكرر بشكلين مختلفين.
//
// المبدأ الأساسي (قسم 21 في تقرير SAAS_PRICING_AND_BILLING_RESEARCH):
// انتهاء الباقة أبداً ما بيمنعش القراءة أو التصدير أو النسخ الاحتياطي —
// اللي بيتقفل تدريجياً هو بس إضافة معدة/فرد فريق جديد فوق حد الباقة،
// وده بعد فترة سماح (GRACE_PERIOD_DAYS) مش فور انتهاء التاريخ.
// ─────────────────────────────────────────────────────────
import { LICENSE_STATE, GRACE_PERIOD_DAYS, getPlanById } from "../config/constants/billing";

// عرض موحّد لحالة الترخيص — مستخدم في BillingPage (وجهة نظر الشركة)
// وAdminPage (وجهة نظر الأدمن) عشان الاثنين يوصفوا نفس الحالة بنفس
// الكلام ونفس اللون بالظبط.
export const LICENSE_STATE_LABELS = {
  [LICENSE_STATE.NONE]:          { text: "لسه ما اخترتش باقة", variant: "gray" },
  [LICENSE_STATE.ACTIVE]:        { text: "نشطة",                variant: "green" },
  [LICENSE_STATE.LIFETIME]:      { text: "وصول دائم (Lifetime)", variant: "green" },
  [LICENSE_STATE.COMPLIMENTARY]: { text: "وصول مجاني",          variant: "green" },
  [LICENSE_STATE.GRACE]:         { text: "انتهت — فترة سماح",    variant: "amber" },
  [LICENSE_STATE.SUSPENDED]:     { text: "متوقفة",               variant: "red" },
};

const toDate = (v) => {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate();
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * @param {object|null} entitlement - مستند entitlements/{uid} (أو null لو
 *   لسه مفيش واحد للشركة دي خالص).
 * @returns {{
 *   state: string,
 *   plan: object|null,
 *   expirationDate: Date|null,
 *   daysUntilExpiration: number|null,
 *   daysSinceExpiration: number|null,
 *   canAddRecords: boolean,   // معدة/فرد فريق جديد
 *   isFullAccess: boolean,    // كل المزايا شغالة عادي (active/lifetime/complimentary لسه سارية)
 * }}
 */
export const computeLicenseState = (entitlement) => {
  if (!entitlement) {
    return {
      state: LICENSE_STATE.NONE,
      plan: null,
      expirationDate: null,
      daysUntilExpiration: null,
      daysSinceExpiration: null,
      canAddRecords: true, // قبل ما تختار باقة أصلاً — منسمحش نمنعها فجأة
      isFullAccess: true,
    };
  }

  const plan = entitlement.planId ? getPlanById(entitlement.planId) : null;

  if (entitlement.type === "lifetime") {
    return {
      state: LICENSE_STATE.LIFETIME, plan,
      expirationDate: null, daysUntilExpiration: null, daysSinceExpiration: null,
      canAddRecords: true, isFullAccess: true,
    };
  }

  const expirationDate = toDate(entitlement.expirationDate);

  if (entitlement.type === "complimentary" && !expirationDate) {
    return {
      state: LICENSE_STATE.COMPLIMENTARY, plan,
      expirationDate: null, daysUntilExpiration: null, daysSinceExpiration: null,
      canAddRecords: true, isFullAccess: true,
    };
  }

  if (!expirationDate) {
    // entitlement موجود لكن من غير تاريخ انتهاء ولا lifetime — حالة غير
    // متوقعة، بنعامله كـ "نشط" بدل ما نقفل حاجة بالغلط.
    return {
      state: entitlement.type === "complimentary" ? LICENSE_STATE.COMPLIMENTARY : LICENSE_STATE.ACTIVE,
      plan, expirationDate: null, daysUntilExpiration: null, daysSinceExpiration: null,
      canAddRecords: true, isFullAccess: true,
    };
  }

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((expirationDate.getTime() - now.getTime()) / msPerDay);

  if (diffDays >= 0) {
    return {
      state: LICENSE_STATE.ACTIVE, plan,
      expirationDate, daysUntilExpiration: diffDays, daysSinceExpiration: null,
      canAddRecords: true, isFullAccess: true,
    };
  }

  const daysSinceExpiration = Math.abs(diffDays);
  if (daysSinceExpiration <= GRACE_PERIOD_DAYS) {
    return {
      state: LICENSE_STATE.GRACE, plan,
      expirationDate, daysUntilExpiration: null, daysSinceExpiration,
      canAddRecords: true, // لسه جوه فترة السماح — منسمحش نمنع حاجة
      isFullAccess: true,
    };
  }

  return {
    state: LICENSE_STATE.SUSPENDED, plan,
    expirationDate, daysUntilExpiration: null, daysSinceExpiration,
    canAddRecords: false, // ممنوع إضافة معدة/فرد فريق جديد بس — باقي البيانات زي ما هي
    isFullAccess: false,
  };
};
