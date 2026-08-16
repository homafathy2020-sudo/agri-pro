// src/components/ui/OfflineBanner.jsx
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { usePWA } from "../../hooks/usePWA";
import { useData } from "../../contexts/DataContext";
import { exportService } from "../../services/exportService";

// كل ما فضلت تعديلات معلّقة (مترفعتش) أكتر من الوقت ده، بنعتبرها حالة
// "طول عليها" ونظهر تنبيه أقوى بزرار نسخة احتياطية فورية — بدل ما نسيب
// الشخص يفتكر إن كل حاجة تمام لمجرد إنه مش شايف رسالة خطأ.
const LONG_PENDING_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 ساعات

/**
 * Shows a sticky banner when the user is offline, AND/OR when there's a
 * live sync status worth surfacing:
 * - amber "غير متصل": offline, changes are saved locally and queued
 * - blue "بيانات لسه بترفع (N)": online again, Firestore is flushing the
 *   queued writes to the server
 * - a brief green "تم رفع كل البيانات" the moment the queue empties, so the
 *   person gets explicit confirmation nothing was lost — not just silence
 * - red "لسه فيه تعديلات من كذا ساعة": pending writes have been sitting
 *   unsynced for a long time — offers a one-tap local backup download
 *   (works fully offline, writes an actual file outside browser storage)
 *   as a manual safety net on top of the automatic sync
 * Also shows an "Install App" button when the browser supports it.
 */
const OfflineBanner = () => {
  const { isOnline, canInstall, installPrompt } = usePWA();
  const {
    pendingWrites, lastSyncedAt, firstPendingWriteAt,
    equipment, jobs, drivers, maintenance, payments, salaryEntries, attendance, settings,
  } = useData();

  const [showSyncedFlash, setShowSyncedFlash] = useState(false);
  const prevPending = useRef(pendingWrites);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (prevPending.current > 0 && pendingWrites === 0 && lastSyncedAt) {
      setShowSyncedFlash(true);
      const t = setTimeout(() => setShowSyncedFlash(false), 3000);
      return () => clearTimeout(t);
    }
    prevPending.current = pendingWrites;
  }, [pendingWrites, lastSyncedAt]);

  // Only need a ticking clock while something is actually pending, so this
  // doesn't run a timer needlessly in the common case.
  useEffect(() => {
    if (!firstPendingWriteAt) return;
    const t = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, [firstPendingWriteAt]);

  const pendingHours = firstPendingWriteAt ? (now - firstPendingWriteAt) / (60 * 60 * 1000) : 0;
  const isLongPending = pendingWrites > 0 && firstPendingWriteAt && (now - firstPendingWriteAt) > LONG_PENDING_THRESHOLD_MS;

  const handleEmergencyBackup = () => {
    try {
      exportService.downloadBackupFile({
        equipment, jobs, drivers, maintenance, payments, salaryEntries, attendance, settings,
      });
      toast.success("اتنزّل ملف احتياطي على جهازك دلوقتي");
    } catch {
      toast.error("تعذر تنزيل النسخة الاحتياطية");
    }
  };

  const showSyncing = isOnline && pendingWrites > 0 && !isLongPending;
  const showAnything = !isOnline || canInstall || showSyncing || showSyncedFlash || isLongPending;
  if (!showAnything) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex flex-col gap-0" dir="rtl">
      {/* Long-pending urgent warning takes priority over the ordinary offline banner */}
      {isLongPending && (
        <div className="flex items-center justify-between gap-3 bg-red-700 text-white text-xs font-bold py-2 px-4 flex-wrap">
          <span>
            فيه {pendingWrites} تعديل لسه محفوظ على جهازك بس من {Math.floor(pendingHours)} ساعة تقريبًا —
            وصّل بالنت أول ما تقدر، أو خد نسخة احتياطية دلوقتي للأمان
          </span>
          <button
            onClick={handleEmergencyBackup}
            className="bg-white text-red-700 rounded-lg px-3 py-1 text-xs font-bold hover:bg-gray-100 flex-shrink-0"
          >
            نزّل نسخة احتياطية الآن
          </button>
        </div>
      )}

      {/* Offline warning */}
      {!isOnline && !isLongPending && (
        <div className="flex items-center justify-center gap-2 bg-amber-600 text-white text-xs font-bold py-2 px-4">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
          أنت غير متصل بالإنترنت — البيانات محفوظة على جهازك وهترفع تلقائي لما النت يرجع
        </div>
      )}

      {/* Syncing (back online, flushing the offline queue) */}
      {showSyncing && (
        <div className="flex items-center justify-center gap-2 bg-sky-600 text-white text-xs font-bold py-2 px-4">
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
          {pendingWrites === 1
            ? "بيرفع تعديل واحد لسه محفوظ عندك بس..."
            : `بيرفع ${pendingWrites} تعديلات لسه محفوظة عندك بس...`}
        </div>
      )}

      {/* Just finished syncing */}
      {!showSyncing && !isLongPending && showSyncedFlash && (
        <div className="flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs font-bold py-2 px-4">
          <span className="flex-shrink-0">✓</span>
          تم رفع كل البيانات بنجاح
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
