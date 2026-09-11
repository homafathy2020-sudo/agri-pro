// src/utils/demoDataSeed.js
//
// audit roadmap Phase 7: "بيانات تجريبية اختيارية (demo data) عند إنشاء
// حساب جديد" — اختيارية تماماً وبطلب صريح من المستخدم نفسه (زرار في قائمة
// "أول خطوات" في الداشبورد، شوف components/dashboard/OnboardingChecklist.jsx)،
// مش بتتحط تلقائي وقت التسجيل. كل سجل بيتحط عليه علامة واضحة في notes
// ("(بيانات تجريبية)") عشان يبان للمستخدم إنها تجريبية ويقدر يحذفها بسهولة
// من نفس صفحات التطبيق العادية (سجل الشغل، المعدات، فريق العمل) زي أي
// سجل حقيقي تاني — مفيش أي flag خاص أو مسار حذف منفصل.
//
// بتستخدم نفس دوال الإضافة الحقيقية (addEquipment/addDriver/addJob/
// addPayment) اللي أي مستخدم عادي بيستخدمها من useData() — مفيش أي مسار
// كتابة خاص، يعني نفس التحقق بالظبط (firestore.rules) ونفس الـ optimistic
// update/rollback عند فشل أي كتابة زي أي عملية حقيقية.
const isoDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

const DEMO_TAG = "(بيانات تجريبية — تقدر تحذفها في أي وقت)";

export const seedDemoData = async ({ addEquipment, addDriver, addJob, addPayment }) => {
  const equipmentId = await addEquipment({
    name:     "جرار تجريبي",
    type:     "جرار",
    category: "base",
    status:   "active",
    fuelRate: 8,
  });

  const driverId = await addDriver({
    name:   "سائق تجريبي",
    status: "active",
    role:   "driver",
    phone:  "01000000000",
  });

  // عملية 1 — بدون دفعة، عشان يبان شكل "مستحق" في الداشبورد وصفحة العملاء.
  await addJob({
    client:         "عميل تجريبي",
    workType:       "المحراث",
    equipmentId,
    driverId,
    date:           isoDate(4),
    acres:          5,
    pricePerAcre:   250,
    fuelUsed:       20,
    fuelPriceAtJob: 15,
    notes:          DEMO_TAG,
  });

  // عملية 2 — مع دفعة كاملة، عشان يبان شكل "متحصّل" جنب الأول.
  const { id: job2Id } = await addJob({
    client:         "عميل تجريبي",
    workType:       "الرشاشة",
    equipmentId,
    driverId,
    date:           isoDate(1),
    acres:          3,
    pricePerAcre:   180,
    fuelUsed:       10,
    fuelPriceAtJob: 15,
    notes:          DEMO_TAG,
  });

  await addPayment({
    jobId:  job2Id,
    amount: 540,
    date:   isoDate(1),
    notes:  DEMO_TAG,
  });
};
