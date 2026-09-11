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

const dismissedKey = (uid) => `onboardingDismissed:${uid}`;

export const useOnboardingChecklist = () => {
  const { user } = useAuth();
  const { equipment = [], drivers = [], jobs = [] } = useData();
  const uid = user?.uid || "anon";

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(dismissedKey(uid)) === "1"; }
    catch { return false; }
  });

  // الترتيب المنطقي للاستخدام: تضيف السائق الأول، بعدين المعدة اللي
  // هيشتغل عليها، وبعدين تقدر تسجّل بيها أول عملية شغل (لازمة للاتنين
  // معاً — شوف JobForm.jsx).
  const steps = useMemo(() => ([
    { id: "drivers",   label: "أضف فريق العمل (سائق/موظف)", done: drivers.length   > 0, path: "/drivers"   },
    { id: "equipment", label: "أضف أول معدة",              done: equipment.length > 0, path: "/equipment" },
    { id: "jobs",      label: "سجّل أول عملية شغل",          done: jobs.length      > 0, path: "/jobs"      },
  ]), [drivers.length, equipment.length, jobs.length]);

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
