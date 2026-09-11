// src/utils/licenseState.js
// ─────────────────────────────────────────────────────────
// حساب "حالة الترخيص" المشتقة من مستند entitlements/{uid} — مشترك بين
// useEntitlement (صفحة الشركة) وAdminPage (لوحة الأدمن)، عشان الاثنين
// يحسبوا نفس الحالة بنفس المنطق بالظبط بدل ما يتكرر بشكلين مختلفين.
//
// المبدأ الأساسي (قسم 21 في تقرير SAAS_PRICING_AND_BILLING_RESEARCH):
// انتهاء الباقة (أو التجربة) أبداً ما بيمنعش القراءة أو التصدير أو النسخ
// الاحتياطي — اللي بيتقفل تدريجياً هو بس إضافة معدة/فرد فريق جديد فوق حد
// الباقة، وده بعد فترة سماح (GRACE_PERIOD_DAYS/TRIAL_GRACE_PERIOD_DAYS)
// مش فور انتهاء التاريخ.
// ─────────────────────────────────────────────────────────
import {
  LICENSE_STATE, GRACE_PERIOD_DAYS, TRIAL_GRACE_PERIOD_DAYS, ENTITLEMENT_SOURCE,
  getPlanById,
} from "../config/constants/billing";

// عرض موحّد لحالة الترخيص — مستخدم في BillingPage (وجهة نظر الشركة)
// وAdminPage (وجهة نظر الأدمن) عشان الاثنين يوصفوا نفس الحالة بنفس
// الكلام ونفس اللون بالظبط.
export const LICENSE_STATE_LABELS = {
  [LICENSE_STATE.NONE]:          { text: "لسه ما اخترتش باقة", variant: "gray" },
  [LICENSE_STATE.TRIAL]:         { text: "تجربة مجانية",       variant: "blue" },
  [LICENSE_STATE.ACTIVE]:        { text: "نشطة",                variant: "green" },
  [LICENSE_STATE.LIFETIME]:      { text: "وصول دائم (Lifetime)", variant: "green" },
  [LICENSE_STATE.COMPLIMENTARY]: { text: "وصول مجاني",          variant: "green" },
  [LICENSE_STATE.GRACE]:         { text: "انتهت — فترة سماح",    variant: "amber" },
  [LICENSE_STATE.SUSPENDED]:     { text: "متوقفة",               variant: "red" },
};

// كل الوحدات مفتوحة — الحالة الافتراضية قبل ما نعرف باقة محددة (NONE)،
// أو لما مفيش باقة "معروضة" مرتبطة أصلاً (Lifetime دايمًا، وComplimentary
// من غير planId محدد) — راجع الشرح في computeLicenseState تحت.
const FULL_MODULES = { custody: true, clients: true, suppliers: true };

const modulesForPlan = (plan) =>
  plan
    ? {
        custody:   !!plan.features?.custodyModule,
        clients:   !!plan.features?.clientsModule,
        suppliers: !!plan.features?.suppliersModule,
      }
    : FULL_MODULES;

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
 *   isFullAccess: boolean,    // كل المزايا شغالة عادي (active/trial/lifetime/complimentary لسه سارية)
 *   modules: { custody: boolean, clients: boolean, suppliers: boolean },
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
      modules: FULL_MODULES,
    };
  }

  const plan = entitlement.planId ? getPlanById(entitlement.planId) : null;
  const isTrial = entitlement.source === ENTITLEMENT_SOURCE.TRIAL;

  if (entitlement.type === "lifetime") {
    // Lifetime دايمًا كل المزايا مفتوحة (زي ما هو موثّق في
    // EntitlementEditorModal) — الـ planId هنا لو موجود فهو لعرض اسم
    // الباقة بس، مش بيقيّد أي وحدة. عمدًا مش modulesForPlan(plan) هنا.
    return {
      state: LICENSE_STATE.LIFETIME, plan,
      expirationDate: null, daysUntilExpiration: null, daysSinceExpiration: null,
      canAddRecords: true, isFullAccess: true,
      modules: FULL_MODULES,
    };
  }

  const expirationDate = toDate(entitlement.expirationDate);

  if (entitlement.type === "complimentary" && !expirationDate) {
    return {
      state: LICENSE_STATE.COMPLIMENTARY, plan,
      expirationDate: null, daysUntilExpiration: null, daysSinceExpiration: null,
      canAddRecords: true, isFullAccess: true,
      modules: modulesForPlan(plan), // planId فاضية = FULL_MODULES تلقائيًا
    };
  }

  if (!expirationDate) {
    // entitlement موجود لكن من غير تاريخ انتهاء ولا lifetime — حالة غير
    // متوقعة، بنعامله كـ "نشط" بدل ما نقفل حاجة بالغلط.
    return {
      state: entitlement.type === "complimentary" ? LICENSE_STATE.COMPLIMENTARY : LICENSE_STATE.ACTIVE,
      plan, expirationDate: null, daysUntilExpiration: null, daysSinceExpiration: null,
      canAddRecords: true, isFullAccess: true,
      modules: modulesForPlan(plan),
    };
  }

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((expirationDate.getTime() - now.getTime()) / msPerDay);

  if (diffDays >= 0) {
    return {
      state: isTrial ? LICENSE_STATE.TRIAL : LICENSE_STATE.ACTIVE, plan,
      expirationDate, daysUntilExpiration: diffDays, daysSinceExpiration: null,
      canAddRecords: true, isFullAccess: true,
      modules: modulesForPlan(plan),
    };
  }

  // فترة السماح بعد الانتهاء أطول للتجربة المجانية (30 يوم) من الباقة
  // المدفوعة (7 يوم) — نفس الأرقام الموصى بها في التقرير.
  const daysSinceExpiration = Math.abs(diffDays);
  const gracePeriodDays = isTrial ? TRIAL_GRACE_PERIOD_DAYS : GRACE_PERIOD_DAYS;
  if (daysSinceExpiration <= gracePeriodDays) {
    return {
      state: LICENSE_STATE.GRACE, plan,
      expirationDate, daysUntilExpiration: null, daysSinceExpiration,
      canAddRecords: true, // لسه جوه فترة السماح — منسمحش نمنع حاجة
      isFullAccess: true,
      modules: modulesForPlan(plan),
    };
  }

  return {
    state: LICENSE_STATE.SUSPENDED, plan,
    expirationDate, daysUntilExpiration: null, daysSinceExpiration,
    canAddRecords: false, // ممنوع إضافة معدة/فرد فريق جديد بس — باقي البيانات زي ما هي
    isFullAccess: false,
    modules: modulesForPlan(plan),
  };
};
