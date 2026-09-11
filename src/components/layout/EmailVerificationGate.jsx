// src/components/layout/EmailVerificationGate.jsx
//
// audit finding F-005: قبل إضافة الملف ده، مكانش فيه أي تحقق من ملكية
// البريد الإلكتروني وقت التسجيل — أي حد كان يقدر يسجّل بأي إيميل حتى لو
// مش بتاعه ويستخدم التطبيق عادي على طول.
//
// القرار المتخذ (بعد مراجعة مع صاحب المنتج): "hard block" — الحساب بيتعمل
// فعليًا في Firebase وقت التسجيل (مفيش طريقة تانية تبعت رابط تحقق من غير
// ما يكون فيه حساب مسجل بيه أصلاً — ده قيد بنيوي في Firebase Auth نفسه)،
// لكن التطبيق مش بيسمح بدخول أي صفحة تانية غير الشاشة دي لحد ما المستخدم
// يضغط على رابط التحقق اللي وصله بالإيميل. البديل الوحيد لتفادي إنشاء
// الحساب قبل التحقق تمامًا هو التحول لتسجيل دخول بدون باسورد عبر رابط
// الإيميل (Firebase "email link sign-in") — وده تغيير معماري أكبر بكتير
// (بيحتاج تفعيل يدوي من Firebase Console + تخزين الباسورد مؤقتًا في
// المتصفح لحد التأكيد) واتقرر عدم الحاجة له حاليًا.
//
// بيتحط في ProtectedRoute.jsx قبل DataProvider مباشرة، عشان لو المستخدم
// مش متحقق من بريده، التطبيق ميحملش أي بيانات Firestore خاصة بيه أصلاً —
// مش بس يمنعه بصريًا من الشاشة.
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { LogoutIcon } from "../ui/Icons";

const RESEND_COOLDOWN_MS = 60 * 1000;

const EmailVerificationGate = ({ children }) => {
  const { user, logout, resendVerificationEmail, refreshEmailVerified } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);

  // لو مفيش مستخدم أصلًا (هيتعالج في ProtectedRoute)، أو بريده متحقق منه
  // بالفعل — منعرقلش، نسيب الصفحة المطلوبة تظهر عادي.
  if (!user || user.emailVerified) return children;

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

  const onCheckAgain = async () => {
    setChecking(true);
    try {
      const verified = await refreshEmailVerified();
      if (verified) {
        toast.success("تم التحقق من بريدك الإلكتروني بنجاح ✓");
        // مفيش داعي لأي navigate يدوي — الـ user state هيتحدّث، والمكوّن
        // ده هيعمل re-render تلقائي ويسيب children تظهر (الشرط فوق).
      } else {
        toast("لسه مفيش تحقق — افتح الرابط اللي وصلك في الإيميل الأول", { icon: "📩" });
      }
    } catch {
      toast.error("تعذر التحقق من الحالة الآن، حاول تاني");
    } finally {
      setChecking(false);
    }
  };

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error("تعذر تسجيل الخروج، حاول تاني");
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 font-arabic" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 shadow-xl shadow-brand-900/50 bg-brand-600 flex items-center justify-center text-3xl">
            📩
          </div>
          <h1 className="text-xl font-extrabold text-gray-100">أكّد بريدك الإلكتروني</h1>
          <p className="text-sm text-gray-500 mt-1">خطوة أخيرة قبل ما تبدأ تستخدم حسابك</p>
        </div>

        <div className="bg-surface border border-white/10 rounded-3xl p-6 shadow-2xl text-center">
          <p className="text-sm text-gray-300 leading-relaxed">
            بعتنالك رابط تحقق على
            <br />
            <span className="font-bold text-gray-100" style={{ direction: "ltr", display: "inline-block" }}>
              {user.email}
            </span>
            <br />
            افتح الإيميل واضغط على الرابط، وبعدها ارجع هنا واضغط "تحقق الآن".
          </p>
          <p className="text-xs text-gray-500 mt-3">
            (متلاقيش الإيميل؟ تأكد من مجلد الـ Spam / العشوائي)
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              onClick={onCheckAgain}
              disabled={checking}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {checking
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : "تم التأكيد، تحقق الآن"}
            </button>
            <button
              onClick={onResend}
              disabled={sending}
              className="w-full bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-200 font-bold py-3 rounded-xl transition-all duration-200 border border-white/10"
            >
              {sending ? "جارٍ الإرسال..." : "إعادة إرسال رابط التحقق"}
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-white/8">
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors inline-flex items-center gap-1.5"
            >
              <LogoutIcon size={14} />
              مش بريدك؟ سجّل خروج وسجّل من جديد ببريد صح
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationGate;
