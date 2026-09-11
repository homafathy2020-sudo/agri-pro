// src/components/common/FeatureIntroBanner.jsx
//
// audit roadmap Phase 7: "مساعدة/توثيق داخل التطبيق للميزات الحرجة" —
// بانر تعريفي قصير وقابل للإخفاء، بيتحط أول صفحة من كذا صفحة أساسية في
// التطبيق (شوف ClientsPage.jsx/SuppliersPage.jsx/CustodyPage.jsx/
// ReportsPage.jsx) عشان يشرح للمستخدم الجديد الصفحة دي بتعمل إيه باختصار
// قبل ما يستخدمها. كل بانر له `id` مستقل، وبيتذكر إخفاءه لوحده في
// localStorage (زي نفس نمط useOnboardingChecklist.js/useNotifications.js
// بالظبط) — مفيش أي كتابة لـ Firestore، ومفيش أي تكرار لو المستخدم شافه
// وقفله قبل كده.
//
// `dismissOnEvent` اختياري: اسم حدث window (زي أحداث utils/uiEvents.js)
// لو انبعت، البانر بيقفل نفسه تلقائي بنفس آلية القفل اليدوي — مفيد لما
// المستخدم يكمّل الإجراء اللي البانر بيعرّفه بيه من مكان تاني في الواجهة
// (مثال: بانر "سعر الوقود" في DashboardPage.jsx بيتقفل تلقائي لما
// المستخدم يحفظ السعر من Sidebar.jsx — شوف FUEL_PRICE_SAVED_EVENT).
// المكون فضل عام ومالوش أي معرفة بحالة الوقود بالذات.
import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { InfoIcon, CloseIcon } from "../ui/Icons";

const dismissedKey = (id, uid) => `featureIntroDismissed:${id}:${uid}`;

const FeatureIntroBanner = ({ id, title, description, action, dismissOnEvent }) => {
  const { user } = useAuth();
  const uid = user?.uid || "anon";

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(dismissedKey(id, uid)) === "1"; }
    catch { return false; }
  });

  const dismiss = useCallback(() => {
    try { localStorage.setItem(dismissedKey(id, uid), "1"); } catch { /* best-effort */ }
    setDismissed(true);
  }, [id, uid]);

  useEffect(() => {
    if (!dismissOnEvent) return;
    window.addEventListener(dismissOnEvent, dismiss);
    return () => window.removeEventListener(dismissOnEvent, dismiss);
  }, [dismissOnEvent, dismiss]);

  if (dismissed) return null;

  return (
    <div className="flex items-start justify-between gap-3 bg-blue-900/20 border border-blue-800/40 rounded-2xl px-5 py-3.5 mb-5">
      <div className="flex items-start gap-3">
        <InfoIcon size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-300">{title}</p>
          <p className="text-xs text-blue-400/80 mt-0.5 leading-relaxed">{description}</p>
          {action && <div className="mt-2.5">{action}</div>}
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="إخفاء"
        className="text-blue-400/60 hover:text-blue-300 transition-colors flex-shrink-0"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
};

export default FeatureIntroBanner;
