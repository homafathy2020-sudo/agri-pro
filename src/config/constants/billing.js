// src/config/constants/billing.js
// ─────────────────────────────────────────────────────────────────────────
// نظام الباقات والاشتراكات — Phase 1 من خارطة الطريق في تقرير
// SAAS_PRICING_AND_BILLING_RESEARCH.html (القسم 13 و17 و18 و21).
//
// المرحلة الحالية: دفع يدوي (فودافون كاش/InstaPay + إيصال واتساب) لحد ما
// نشترك في بوابة دفع رسمية (Paymob غالبًا حسب توصية التقرير). البنية هنا
// (Plan + Entitlement منفصل عن Subscription) مصممة من الأول عشان لما
// نضيف بوابة دفع حقيقية، نضيف مصدر تفعيل جديد بس — من غير ما نعيد بناء
// أي حاجة من اللي هنا.
// ─────────────────────────────────────────────────────────────────────────

// ─── الباقات ────────────────────────────────────────────────────────────
// كل حد هنا له سبب عمل/تكلفة واضح (زي ما اتفقنا في التقرير) — مفيش أي حد
// على عدد العمليات/الدفعات/الصيانة اليومية، الحدود بس على المعدات والفريق
// (اللي بتعكس حجم الشركة الحقيقي) وعمق النسخ الاحتياطي.
export const PLAN_IDS = {
  STARTER:      "starter",
  PROFESSIONAL: "professional",
  BUSINESS:     "business",
};

// custodyModule/clientsModule/suppliersModule بتتحكم في ظهور صفحات
// "العهدة"/"العملاء والديون"/"الموردين" بالكامل (رابط القائمة + الراوت
// نفسه عبر RequireModule) — مش عرض/تعديل جزئي، إما الصفحة موجودة أو
// مختفية تمامًا. طلب صريح: أساسي من غيرهم الثلاثة، احترافي من غير عهدة
// بس، مؤسسي بكل حاجة. الإنفاذ على مستوى الواجهة بس (زي حد
// المعدات/الفريق بالظبط) مش firestore.rules، لنفس سبب القرار في قسم
// "موقوفة" تحت — تشديد الحماية هنا يديك خطر تقفل بيانات شركة حقيقية
// موجودة بره صاحبها بالغلط، أخطر بكتير من تساهل مؤقت في مستخدم متمرس
// بيلعب بالـ Firestore SDK مباشرة.
export const PLANS = [
  {
    id: PLAN_IDS.STARTER,
    name: "أساسي",
    priceMonthly: 499,
    priceAnnual: 4990, // شهرين مجانًا (~16.7%)
    limits: {
      equipmentMax: 5,
      teamMax: 5,
      backupRetentionCount: 2,   // نسخ
      backupFrequencyHours: 168, // أسبوعي
    },
    features: {
      advancedReports: false,
      excelExport: false,
      pdfDownload: false,
      custodyModule: false,
      clientsModule: false,
      suppliersModule: false,
      taxDeductionsModuleFull: false,
      prioritySupport: false,
    },
  },
  {
    id: PLAN_IDS.PROFESSIONAL,
    name: "احترافي",
    priceMonthly: 1199,
    priceAnnual: 11990,
    featured: true,
    limits: {
      equipmentMax: 15,
      teamMax: 15,
      backupRetentionCount: 7,
      backupFrequencyHours: 24, // يومي
    },
    features: {
      advancedReports: true,
      excelExport: true,
      pdfDownload: true,
      custodyModule: false,
      clientsModule: true,
      suppliersModule: true,
      taxDeductionsModuleFull: true,
      prioritySupport: true,
    },
  },
  {
    id: PLAN_IDS.BUSINESS,
    name: "مؤسسي",
    priceMonthly: 2499,
    priceAnnual: 24990,
    limits: {
      equipmentMax: null, // بدون حد
      teamMax: null,
      backupRetentionCount: 10,
      backupFrequencyHours: 24,
    },
    features: {
      advancedReports: true,
      excelExport: true,
      pdfDownload: true,
      custodyModule: true,
      clientsModule: true,
      suppliersModule: true,
      taxDeductionsModuleFull: true,
      prioritySupport: true,
    },
  },
];

export const getPlanById = (planId) => PLANS.find((p) => p.id === planId) || null;

// خصم السنوي الفعلي وقيمته الشهرية المكافئة — للعرض في صفحة الاشتراك.
export const getAnnualSavings = (plan) => {
  const fullYear = plan.priceMonthly * 12;
  return {
    savingsEgp: fullYear - plan.priceAnnual,
    savingsPercent: Math.round(((fullYear - plan.priceAnnual) / fullYear) * 100),
    effectiveMonthly: Math.round(plan.priceAnnual / 12),
  };
};

// ─── دورة الفوترة ───────────────────────────────────────────────────────
export const BILLING_CYCLE = {
  MONTHLY: "monthly",
  ANNUAL:  "annual",
};

export const CYCLE_DAYS = {
  [BILLING_CYCLE.MONTHLY]: 30,
  [BILLING_CYCLE.ANNUAL]:  365,
};

// ─── حالة الاشتراك (subscriptions/{uid}.status) ────────────────────────
export const SUBSCRIPTION_STATUS = {
  TRIALING:  "trialing",
  ACTIVE:    "active",
  CANCELED:  "canceled",
};

// ─── نوع ومصدر الصلاحية (entitlements/{uid}) ───────────────────────────
export const ENTITLEMENT_TYPE = {
  PLAN:          "plan",         // مرتبط باشتراك مدفوع عادي
  LIFETIME:      "lifetime",     // admin-only — بدون تاريخ انتهاء إطلاقًا
  COMPLIMENTARY: "complimentary",// وصول مجاني بتاريخ انتهاء اختياري (تجربة ممتدة، صفقة خاصة...)
};

export const ENTITLEMENT_SOURCE = {
  MANUAL_PAYMENT: "manual_payment", // دُفعت يدويًا (فودافون كاش/InstaPay) وفعّلها الأدمن
  ADMIN_OVERRIDE: "admin_override", // منحها الأدمن مباشرة (Lifetime/Complimentary) بدون دفع
  TRIAL:          "trial",          // تجربة مجانية تلقائية عند التسجيل — راجع TRIAL_DAYS تحت
};

// حالة الترخيص المشتقة (computed client-side من entitlement.expirationDate،
// مش field مخزّن) — دي اللي بتتحكم في الـ UI (بانر، حظر إضافة معدة جديدة...).
export const LICENSE_STATE = {
  NONE:      "none",      // مفيش entitlement خالص لسه (شركة قبل ما تختار باقة)
  TRIAL:     "trial",     // تجربة مجانية سارية (وصول كامل لباقة احترافي)
  ACTIVE:    "active",
  LIFETIME:  "lifetime",
  COMPLIMENTARY: "complimentary",
  GRACE:     "grace",     // انتهت الباقة (أو التجربة)، لسه جوه فترة السماح
  SUSPENDED: "suspended", // انتهت فترة السماح — قراءة/تصدير بس، منع إضافة معدة/فرد فريق جديد
};

// فترة السماح بعد انتهاء تاريخ الباقة قبل ما نعتبرها "موقوفة" — حتى في
// suspended البيانات نفسها متاحة بالكامل للقراءة والتصدير والنسخ
// الاحتياطي دايمًا (سياسة عدم حذف البيانات، القسم 21 من التقرير) —
// الوحيد اللي بيتقفل هو إضافة معدة/فرد فريق جديد.
export const GRACE_PERIOD_DAYS = 7;

// ─── التجربة المجانية (Free Trial) ──────────────────────────────────────
// تلقائية 100% عند أول تسجيل لأي شركة جديدة (src/contexts/AuthContext.jsx
// → register())، بدون بطاقة ائتمان، وصول كامل لمزايا وحدود باقة
// "احترافي" — مطابق حرفيًا لتوصية القسم 15 في التقرير. الحماية الحقيقية
// ضد التلاعب (تمديد التجربة، تكرارها، تغيير باقتها) في firestore.rules
// (isValidTrialSelfCreate) — create بينجح مرة واحدة بس طول عمر الحساب،
// وupdate/delete فاضلين أدمن بس زي أي entitlement تاني.
export const TRIAL_DAYS = 14;
// فترة سماح أطول من فترة سماح الباقة المدفوعة (30 يوم بدل 7) — نفس رقم
// القسم 15 في التقرير: قراءة وتصدير ونسخ احتياطي بس، لحد ما الشركة
// تختار وتدفع باقة فعلية.
export const TRIAL_GRACE_PERIOD_DAYS = 30;

// ─── الدفع اليدوي المؤقت (لحد الاشتراك في بوابة دفع رسمية) ─────────────
export const MANUAL_PAYMENT_METHODS = {
  VODAFONE_CASH: "vodafone_cash",
  INSTAPAY:      "instapay",
};

export const MANUAL_PAYMENT_INFO = {
  vodafoneCashNumber: "01016212267",
  vodafoneCashHolderName: "ادهم فتحي",
  instapayNumber:     "01009811200",
  instapayHolderName: "fathyk",
  // بصيغة دولية بدون + أو صفر البداية، لازمة لرابط wa.me
  whatsappNumberIntl: "201015132639",
  whatsappNumberDisplay: "01015132639",
};

export const BILLING_REQUEST_STATUS = {
  PENDING_REVIEW: "pending_review",
  CONFIRMED:      "confirmed",
  REJECTED:       "rejected",
};

export const METHOD_LABELS_AR = {
  [MANUAL_PAYMENT_METHODS.VODAFONE_CASH]: "فودافون كاش",
  [MANUAL_PAYMENT_METHODS.INSTAPAY]:      "InstaPay",
};
