// src/components/layout/SubscriptionStatusBanner.jsx
// ─────────────────────────────────────────────────────────
// بانر حالة الاشتراك — ظاهر أعلى محتوى كل صفحة (جوه AppLayout، قبل
// Outlet مباشرة). بيتغيّر حسب useEntitlement():
//  - none: تذكير هادي يوجّه لصفحة /billing (قابل للإخفاء)
//  - active قريبة من الانتهاء (≤3 أيام): تحذير كهرماني (قابل للإخفاء)
//  - grace: تحذير كهرماني أقوى — البيانات كلها سليمة، بس محتاج تجديد
//  - suspended: تحذير أحمر — مفيش إضافة معدة/فرد فريق جديد لحد التجديد
// lifetime/complimentary/active بعيدة عن الانتهاء = مفيش بانر خالص.
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEntitlement } from "../../hooks/useEntitlement";
import { LICENSE_STATE } from "../../config/constants/billing";
import { AlertIcon, StarIcon, CloseIcon } from "../ui/Icons";

const dismissedKey = (state, uid) => `subBannerDismissed:${state}:${uid}`;

const SubscriptionStatusBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const entitlement = useEntitlement();
  const { state, daysUntilExpiration, loading } = entitlement;
  const uid = user?.uid || "anon";

  const isExpiringSoon = state === LICENSE_STATE.ACTIVE && typeof daysUntilExpiration === "number" && daysUntilExpiration <= 3;
  const showKey = state === LICENSE_STATE.NONE ? "none" : isExpiringSoon ? "expiring" : state === LICENSE_STATE.GRACE ? "grace" : null;

  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!showKey) { setDismissed(false); return; }
    try { setDismissed(localStorage.getItem(dismissedKey(showKey, uid)) === "1"); }
    catch { setDismissed(false); }
  }, [showKey, uid]);

  const dismiss = () => {
    try { localStorage.setItem(dismissedKey(showKey, uid), "1"); } catch { /* best-effort */ }
    setDismissed(true);
  };

  if (loading) return null;

  // Suspended دايمًا ظاهر — مش قابل للإخفاء، لأنه فعليًا بيمنع إضافة سجلات جديدة.
  if (state === LICENSE_STATE.SUSPENDED) {
    return (
      <div className="flex items-center justify-between gap-3 bg-red-900/30 border border-red-800/50 rounded-xl px-4 py-3 mb-4 mx-4 lg:mx-6 mt-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <AlertIcon size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-200">
            انتهت باقتك — بياناتك كلها متاحة زي ما هي، بس مفيش إضافة معدة أو فرد فريق جديد لحد ما تجدد.
          </p>
        </div>
        <button
          onClick={() => navigate("/billing")}
          className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-lg px-3.5 py-2 flex-shrink-0"
        >
          تجديد الباقة
        </button>
      </div>
    );
  }

  if (!showKey || dismissed) return null;

  const isNone = showKey === "none";
  const isGrace = showKey === "grace";

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-4 mx-4 lg:mx-6 mt-4 flex-wrap border ${
      isGrace ? "bg-amber-900/30 border-amber-800/50" : "bg-surface-2 border-white/10"
    }`}>
      <div className="flex items-center gap-2.5">
        {isGrace ? <AlertIcon size={18} className="text-amber-400 flex-shrink-0" /> : <StarIcon size={18} className="text-brand-400 flex-shrink-0" />}
        <p className={`text-sm ${isGrace ? "text-amber-200" : "text-gray-300"}`}>
          {isNone && "لسه ما اخترتش باقة اشتراك — اختار الباقة المناسبة لحجم شغلك."}
          {isGrace && "انتهت باقتك من فترة قصيرة — جدّدها الآن قبل ما نضطر نوقف إضافة سجلات جديدة."}
          {showKey === "expiring" && `باقتك هتنتهي خلال ${daysUntilExpiration} يوم — جدّدها دلوقتي عشان ما ينقطعش الاشتراك.`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate("/billing")}
          className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg px-3.5 py-2"
        >
          {isNone ? "اختيار باقة" : "تجديد الباقة"}
        </button>
        <button onClick={dismiss} aria-label="إخفاء" className="text-gray-500 hover:text-gray-300 p-1">
          <CloseIcon size={14} />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionStatusBanner;
