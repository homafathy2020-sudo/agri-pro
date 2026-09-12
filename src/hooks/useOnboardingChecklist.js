// src/hooks/useOnboardingChecklist.js
//
// audit roadmap Phase 7: "قائمة onboarding موجّهة لأول دخول". كل خطوة
// بتتحسب مباشرة من البيانات الموجودة فعلاً (equipment/drivers/jobs) —
// مفيش أي كتابة إضافية لـ Firestore ولا حقل جديد في بروفايل المستخدم
// عشان "نتتبع" التقدّم، لأن التقدّم نفسه مشتق بالكامل من وجود البيانات.
// الحاجة الوحيدة المتخزّنة محلياً هي "إخفاء القائمة" (dismissed) — زي
// نفس نمط readNotifs/hiddenNotifs في useNotifications.js بالظبط.
import { useMemo, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { DEFAULT_FUEL_PRICE } from "../config/constants";

const dismissedKey = (uid) => `onboardingDismissed:${uid}`;

export const useOnboardingChecklist = () => {
  const { user } = useAuth();
  const { equipment = [], drivers = [], jobs = [], settings } = useData();
  const uid = user?.uid || "anon";

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(dismissedKey(uid)) === "1"; }
    catch { return false; }
  });

  // الترتيب المنطقي للاستخدام: تضيف السائق الأول، بعدين المعدة اللي
  // هيشتغل عليها، وبعدين تظبط سعر الوقود (لازم يكون مضبوط قبل ما تسجّل
  // عمليات فيها استهلاك سولار — القيمة بتتثبّت على كل عملية وقت تسجيلها)،
  // وأخيرًا تقدر تسجّل بيها أول عملية شغل — شوف JobForm.jsx.
  //
  // خطوة "sعر الوقود" (كانت قبل كده بانر منفصل — FeatureIntroBanner في
  // DashboardPage.jsx، اتشال ودُمج هنا) مالهاش صفحة خاصة بيها (`path`
  // فاضية عمدًا) — بدل كده، الضغط عليها في OnboardingChecklist.jsx بيبعت
  // FOCUS_FUEL_PRICE_EVENT عشان يوجّه المستخدم لحقل السعر في القائمة
  // الجانبية نفسها (زي ما كان زرار البانر بالظبط بيعمل). "تمت" هنا بمعنى
  // "السعر اتغيّر عن القيمة الافتراضية" — نفس فلسفة باقي الخطوات (مشتقة
  // من بيانات موجودة فعلاً، من غير أي حقل تتبّع إضافي في Firestore).
  const steps = useMemo(() => ([
    { id: "drivers",   label: "أضف فريق العمل (سائق/موظف)", done: drivers.length   > 0, path: "/drivers"   },
    { id: "equipment", label: "أضف أول معدة",              done: equipment.length > 0, path: "/equipment" },
    { id: "fuelPrice", label: "اضبط سعر الوقود",            done: (settings?.fuelPrice ?? DEFAULT_FUEL_PRICE) !== DEFAULT_FUEL_PRICE, path: null },
    { id: "jobs",      label: "سجّل أول عملية شغل",          done: jobs.length      > 0, path: "/jobs"      },
  ]), [drivers.length, equipment.length, jobs.length, settings?.fuelPrice]);

  const doneCount  = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const allDone    = doneCount === totalSteps;
  // بتختفي لو اتقفلت يدوياً أو لو كل الخطوات خلصت أصلاً — مفيش داعي
  // لشاشة "تهانينا" دايمة، القائمة هدفها توجيه أول استخدام بس.
  const visible = !dismissed && !allDone;

  const dismiss = useCallback(() => {
    try { localStorage.setItem(dismissedKey(uid), "1"); } catch { /* best-effort */ }
    setDismissed(true);
  }, [uid]);

  return { steps, doneCount, totalSteps, allDone, visible, dismiss };
};
