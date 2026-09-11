// src/components/ui/EmailVerificationBanner.jsx
//
// audit finding F-005: قبل إضافة هذا الملف، مكانش فيه أي تحقق من إن
// البريد الإلكتروني اللي المستخدم سجّل بيه فعلًا بريده هو — أي حد كان
// يقدر يسجّل بأي إيميل حتى لو مش بتاعه. البانر ده بيفضل ظاهر لحد ما
// المستخدم يضغط على رابط التحقق اللي وصله في إيميله.
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { ChevronUpIcon } from "./Icons";

// مسافة زمنية بسيطة بين ضغطة "أعد الإرسال" والتانية — مش بديل عن حد
// Firebase الحقيقي (auth/too-many-requests)، بس بتمنع المستخدم من قفل
// نفسه بالغلط بضغطات متتالية على الفاضي.
const RESEND_COOLDOWN_MS = 60 * 1000;

// onMinimize: مُمرَّرة من OfflineBanner.jsx عشان الصف ده ينضم لنفس نظام
// التصغير التلقائي (useAutoResetMinimize) المستخدم لباقي صفوف البانر، بدل
// ما يبقى له حالة تصغير منفصلة تسبب تراكب بصري مع الصفوف التانية.
const EmailVerificationBanner = ({ onMinimize }) => {
  const { user, resendVerificationEmail, refreshEmailVerified } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);

  // الحارس الأساسي (المستخدم موجود وبريده مش متحقق منه) بيتفحص في
  // OfflineBanner.jsx قبل ما يعرض الصف ده أصلًا — هنا بس حارس إضافي
  // للأمان لو اتستخدم المكوّن في مكان تاني لوحده.
  if (!user || user.emailVerified) return null;

  const onResend = async () => {
    if (Date.now() - lastSentAt < RESEND_COOLDOWN_MS) {
      toast("استنى شوية قبل ما تطلب إرسال تاني", { icon: "⏳" });
      return;
    }
    setSending(true);
    try {
      await resendVerificationEmail();
      setLastSentAt(Date.now());
      toast.success("تم إرسال رابط التحقق تاني لبريدك الإلكتروني");
    } catch (err) {
      if (err?.code === "auth/too-many-requests") {
        toast.error("محاولات كتير، حاول تاني بعد شوية");
      } else {
        toast.error("تعذر إرسال رابط التحقق، حاول تاني");
      }
    } finally {
      setSending(false);
    }
  };

  // للمستخدم اللي ضغط على رابط التحقق في إيميله بالفعل (في تاب/جهاز
  // تاني عادة) ورجع هنا — بيحدّث الحالة من غير ما يحتاج يعمل خروج ودخول.
  const onCheckAgain = async () => {
    setChecking(true);
    try {
      const verified = await refreshEmailVerified();
      if (verified) {
        toast.success("تم التحقق من بريدك الإلكتروني بنجاح ✓");
      } else {
        toast("لسه مفيش تحقق — افتح الرابط اللي وصلك في الإيميل الأول", { icon: "📩" });
      }
    } catch {
      toast.error("تعذر التحقق من الحالة الآن");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-3 bg-amber-600 text-white text-xs font-bold py-2 px-4 flex-wrap"
      dir="rtl"
    >
      <span>يرجى تأكيد بريدك الإلكتروني ({user.email}) عشان تفعّل حسابك بالكامل — تحقق من صندوق الوارد (والسبام)</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onCheckAgain}
          disabled={checking}
          className="bg-white text-amber-700 rounded-lg px-3 py-1 text-xs font-bold hover:bg-gray-100 disabled:opacity-50"
        >
          {checking ? "جارٍ التحقق..." : "تم التأكيد، تحقق الآن"}
        </button>
        <button
          onClick={onResend}
          disabled={sending}
          className="bg-white/20 text-white rounded-lg px-3 py-1 text-xs font-bold hover:bg-white/30 disabled:opacity-50"
        >
          {sending ? "جارٍ الإرسال..." : "إعادة إرسال الرابط"}
        </button>
        <button
          onClick={onMinimize}
          aria-label="تصغير"
          className="flex-shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
        >
          <ChevronUpIcon size={14} />
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
