// src/components/ui/OfflineBanner.jsx
import React from "react";
import { usePWA } from "../../hooks/usePWA";

/**
 * Shows a sticky banner when the user is offline.
 * Also shows an "Install App" button when the browser supports it.
 */
const OfflineBanner = () => {
  const { isOnline, canInstall, installPrompt } = usePWA();

  if (isOnline && !canInstall) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex flex-col gap-0" dir="rtl">
      {/* Offline warning */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-600 text-white text-xs font-bold py-2 px-4">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
          أنت غير متصل بالإنترنت — البيانات المحفوظة متاحة
        </div>
      )}

      {/* Install prompt */}
      {canInstall && isOnline && (
        <div className="flex items-center justify-between gap-3 bg-brand-700 text-white text-xs font-bold py-2 px-4">
          <span>ثبّت التطبيق على شاشتك الرئيسية للوصول السريع</span>
          <button
            onClick={installPrompt}
            className="bg-white text-brand-700 rounded-lg px-3 py-1 text-xs font-bold hover:bg-gray-100 flex-shrink-0"
          >
            تثبيت
          </button>
        </div>
      )}
    </div>
  );
};

export default OfflineBanner;
