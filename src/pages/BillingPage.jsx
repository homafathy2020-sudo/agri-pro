// src/pages/BillingPage.jsx
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useEntitlement } from "../hooks/useEntitlement";
import { useSubscription } from "../hooks/useSubscription";
import { billingService } from "../services/billingService";
import { Card, Badge, EmptyState } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import LoadingScreen from "../components/ui/LoadingScreen";
import {
  WalletIcon, StarIcon, CheckCircleIcon, AlertIcon, ClockIcon,
  PhoneIcon, SendIcon,
} from "../components/ui/Icons";
import { formatCurrency, formatDateTime } from "../utils/formatters";
import {
  PLANS, BILLING_CYCLE, TRIAL_DAYS, getAnnualSavings,
  MANUAL_PAYMENT_METHODS, MANUAL_PAYMENT_INFO, METHOD_LABELS_AR as METHOD_LABELS,
} from "../config/constants/billing";
import { LICENSE_STATE } from "../config/constants/billing";
import { LICENSE_STATE_LABELS as STATE_LABELS } from "../utils/licenseState";

const buildWhatsappMessage = ({ companyName, email, planName, cycleLabel, amount, method, requestId }) => {
  const lines = [
    "طلب اشتراك جديد — زراعي برو",
    `الشركة: ${companyName || "—"}`,
    `الإيميل: ${email || "—"}`,
    `الباقة: ${planName} (${cycleLabel})`,
    `المبلغ: ${amount} ج.م`,
    `طريقة الدفع: ${METHOD_LABELS[method]}`,
    `رقم الطلب: ${requestId}`,
    "تم التحويل — برجاء المراجعة والتفعيل 🙏",
  ];
  return lines.join("\n");
};

const PaymentModal = ({ plan, cycle, onClose }) => {
  const { user } = useAuth();
  const [method, setMethod] = useState(MANUAL_PAYMENT_METHODS.VODAFONE_CASH);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState(null); // بعد الإرسال

  const amount = cycle === BILLING_CYCLE.ANNUAL ? plan.priceAnnual : plan.priceMonthly;
  const cycleLabel = cycle === BILLING_CYCLE.ANNUAL ? "سنوي" : "شهري";

  // متابعة حالة الطلب live — لو الأدمن فعّل بسرعة، المستخدم يشوف النتيجة
  // من غير ما يقفل الشاشة أو يعمل refresh.
  // requestId مستخرج كقيمة مستقرة (primitive) بدل الاعتماد على كائن
  // request كله في dependency array — الكائن بيتغيّر مرجعه مع كل snapshot
  // جديد، فلو اعتمدنا عليه هنا كان هيسبب إعادة اشتراك (resubscribe) لا نهائية.
  const requestId = request?.id;
  useEffect(() => {
    if (!requestId) return;
    const unsub = billingService.subscribeToBillingRequest(requestId, (data) => {
      if (data?.status === "confirmed") {
        toast.success("تم تفعيل باقتك بنجاح! 🎉");
      } else if (data?.status === "rejected") {
        toast.error("لم يتم تأكيد الدفعة — تواصل معنا للمراجعة");
      }
      setRequest(data);
    });
    return unsub;
  }, [requestId]);

  const handleSendReceipt = async () => {
    setSubmitting(true);
    try {
      const id = await billingService.createBillingRequest({
        planId: plan.id, billingCycle: cycle, amount, method,
      });
      setRequest({ id, status: "pending_review" });
      const msg = buildWhatsappMessage({
        companyName: user?.displayName, email: user?.email,
        planName: plan.name, cycleLabel, amount, method, requestId: id,
      });
      window.open(
        `https://wa.me/${MANUAL_PAYMENT_INFO.whatsappNumberIntl}?text=${encodeURIComponent(msg)}`,
        "_blank"
      );
    } catch (err) {
      toast.error("حصل خطأ، حاول تاني");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`الاشتراك في باقة ${plan.name}`} size="md">
      {request ? (
        <div className="text-center py-4">
          {request.status === "confirmed" ? (
            <>
              <CheckCircleIcon size={40} className="text-green-400 mx-auto mb-3" />
              <p className="text-gray-100 font-bold mb-1">تم تفعيل باقتك بنجاح</p>
              <p className="text-sm text-gray-500">استمتع بمزايا باقة {plan.name}</p>
            </>
          ) : request.status === "rejected" ? (
            <>
              <AlertIcon size={40} className="text-red-400 mx-auto mb-3" />
              <p className="text-gray-100 font-bold mb-1">لم يتم تأكيد الدفعة</p>
              <p className="text-sm text-gray-500">تواصل معنا على واتساب للمراجعة</p>
            </>
          ) : (
            <>
              <ClockIcon size={40} className="text-amber-400 mx-auto mb-3" />
              <p className="text-gray-100 font-bold mb-1">طلبك قيد المراجعة</p>
              <p className="text-sm text-gray-500">هيتفعّل خلال وقت قصير من بعد مراجعة الإيصال — الصفحة دي هتتحدّث تلقائي</p>
            </>
          )}
          <Button variant="secondary" size="sm" className="mt-5" onClick={onClose}>إغلاق</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between bg-surface-2 rounded-xl px-4 py-3 mb-5">
            <span className="text-sm text-gray-400">المبلغ المطلوب</span>
            <span className="text-lg font-extrabold text-gray-100">{formatCurrency(amount)} <span className="text-xs text-gray-500">/ {cycleLabel}</span></span>
          </div>

          <p className="text-xs font-bold text-gray-500 mb-2">اختر طريقة التحويل</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(METHOD_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                  method === value
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "bg-surface-2 border-white/10 text-gray-300 hover:bg-surface-3"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Card className="p-4 mb-5 bg-surface-2">
            <div className="flex items-center gap-2 mb-3 text-gray-300 text-sm font-bold">
              <PhoneIcon size={15} /> حوّل المبلغ على الرقم ده
            </div>
            <div className="text-2xl font-extrabold text-gray-100 tracking-wide mb-1" dir="ltr">
              {method === MANUAL_PAYMENT_METHODS.INSTAPAY
                ? MANUAL_PAYMENT_INFO.instapayNumber
                : MANUAL_PAYMENT_INFO.vodafoneCashNumber}
            </div>
            <p className="text-xs text-gray-500">
              باسم: {method === MANUAL_PAYMENT_METHODS.INSTAPAY
                ? MANUAL_PAYMENT_INFO.instapayHolderName
                : MANUAL_PAYMENT_INFO.vodafoneCashHolderName}
            </p>
          </Card>

          <p className="text-xs text-gray-500 mb-5 leading-relaxed">
            بعد التحويل اضغط الزرار تحت — هيفتحلك واتساب برسالة جاهزة فيها تفاصيل طلبك،
            ابعتها زي ما هي مع صورة إيصال التحويل، وهنفعّل باقتك بعد المراجعة.
          </p>

          <Button
            variant="primary" className="w-full" icon={<SendIcon size={16} />}
            loading={submitting} onClick={handleSendReceipt}
          >
            تم التحويل — إرسال الإيصال عبر واتساب
          </Button>
        </>
      )}
    </Modal>
  );
};

const PlanCard = ({ plan, cycle, currentPlanId, onSubscribe }) => {
  const { effectiveMonthly, savingsPercent } = getAnnualSavings(plan);
  const price = cycle === BILLING_CYCLE.ANNUAL ? plan.priceAnnual : plan.priceMonthly;
  const isCurrent = currentPlanId === plan.id;

  return (
    <Card className={`p-5 relative flex flex-col ${plan.featured ? "border-brand-600" : ""}`}>
      {plan.featured && (
        <span className="absolute -top-2.5 right-4 bg-brand-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
          الأكثر طلبًا
        </span>
      )}
      <h3 className="text-gray-100 font-extrabold text-lg mb-1">{plan.name}</h3>
      <div className="mb-1">
        <span className="text-2xl font-extrabold text-gray-100">{formatCurrency(price)}</span>
        <span className="text-xs text-gray-500"> / {cycle === BILLING_CYCLE.ANNUAL ? "سنة" : "شهر"}</span>
      </div>
      {cycle === BILLING_CYCLE.ANNUAL && (
        <p className="text-xs text-brand-400 mb-3">≈ {formatCurrency(effectiveMonthly)}/شهر — وفّر {savingsPercent}%</p>
      )}
      {cycle === BILLING_CYCLE.MONTHLY && <div className="mb-3" />}

      <ul className="text-sm text-gray-400 space-y-2 mb-5 flex-1">
        <li>حتى {plan.limits.equipmentMax ?? "غير محدود"} معدة</li>
        <li>حتى {plan.limits.teamMax ?? "غير محدود"} فرد فريق</li>
        <li>عمليات شغل غير محدودة</li>
        <li>نسخ احتياطي {plan.limits.backupFrequencyHours <= 24 ? "يومي" : "أسبوعي"} — {plan.limits.backupRetentionCount} نسخة</li>
        {plan.features.clientsModule && <li>إدارة العملاء والديون</li>}
        {plan.features.suppliersModule && <li>إدارة الموردين</li>}
        {plan.features.custodyModule && <li>إدارة العهدة</li>}
        {plan.features.excelExport && <li>تصدير Excel + تنزيل PDF</li>}
        {plan.features.advancedReports && <li>تقارير متقدمة</li>}
        {plan.features.prioritySupport && <li>دعم أولوية</li>}
      </ul>

      {isCurrent ? (
        <Button variant="secondary" className="w-full" disabled icon={<CheckCircleIcon size={16} />}>
          باقتك الحالية
        </Button>
      ) : (
        <Button variant={plan.featured ? "primary" : "outline"} className="w-full" onClick={() => onSubscribe(plan)}>
          اشترك الآن
        </Button>
      )}
    </Card>
  );
};

// `embedded`: بيستخدمها تاب "الاشتراك" جوه ProfilePage.jsx — نفس الصفحة
// بالحرف الواحد (صفر تكرار منطق)، بس من غير الغلاف الخارجي (padding +
// max-width + dir) لأن ProfilePage بيوفر غلافه هو. الراوت المستقل
// /billing (لسه مستخدم من أماكن تانية كتير: حدود المعدات/الفريق، بانر
// الاشتراك، RequireModule) بيفضل شغال زي ما هو بالظبط لأن `embedded`
// افتراضيًا false.
const BillingPage = ({ embedded = false }) => {
  const [cycle, setCycle] = useState(BILLING_CYCLE.MONTHLY);
  const [subscribingPlan, setSubscribingPlan] = useState(null);
  const { loading, error, state, plan, expirationDate, daysUntilExpiration, daysSinceExpiration } = useEntitlement();
  const { subscription } = useSubscription();

  const statusInfo = STATE_LABELS[state] || STATE_LABELS[LICENSE_STATE.NONE];

  // دورة الفوترة الفعلية (شهري/سنوي) بتتقرا من subscriptions/{uid} —
  // مش من entitlement اللي معهوش الحقل ده أصلاً. متاحة بس لباقة مدفوعة
  // فعلية (ACTIVE/GRACE/SUSPENDED)، مش لتجربة مجانية (مفيش subscription
  // doc خالص لسه) ولا Lifetime/Complimentary (مفيش دورة فوترة أصلاً).
  const cycleLabel = subscription?.billingCycle === BILLING_CYCLE.ANNUAL ? "سنوي" : "شهري";

  // "نوع الاشتراك" — سطر واضح ومنفصل عن شارة الحالة، بيوضح تحديدًا لو
  // ده تجربة مجانية ولا باقة مدفوعة وبأي دورة فوترة، زي ما طلب.
  const subscriptionTypeText =
    state === LICENSE_STATE.TRIAL
      ? `تجربة مجانية — وصول كامل لباقة ${plan?.name || "احترافي"}`
      : state === LICENSE_STATE.LIFETIME
      ? "وصول دائم (Lifetime) — بدون تاريخ انتهاء"
      : state === LICENSE_STATE.COMPLIMENTARY
      ? `وصول مجاني${plan ? ` — باقة ${plan.name}` : ""}`
      : state === LICENSE_STATE.NONE
      ? "لسه ما اخترتش باقة اشتراك"
      : plan
      ? `باقة ${plan.name} مدفوعة — ${cycleLabel}${subscription ? "" : " (بيانات الدفع قيد التحديث)"}`
      : "—";

  if (loading) return <LoadingScreen message="جاري تحميل بيانات الاشتراك..." />;

  if (error) {
    const errorBox = (
      <div className="bg-red-900/30 border border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-200">
        حصل خطأ في تحميل بيانات الاشتراك. جرّب تحدّث الصفحة، ولو المشكلة استمرت كلّم الدعم.
      </div>
    );
    if (embedded) return errorBox;
    return (
      <div className="p-4 lg:p-6 max-w-5xl mx-auto" dir="rtl">
        {errorBox}
      </div>
    );
  }

  const content = (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2 mb-1">
          <WalletIcon size={22} className="text-brand-400" />
          الاشتراك والباقة
        </h1>
        <p className="text-sm text-gray-500">اختر الباقة المناسبة لحجم شغلك — التحويل حاليًا يدوي لحد ما نفعّل بوابة دفع مباشرة.</p>
      </div>

      <Card className="p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">حالة الاشتراك</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
              {plan && state !== LICENSE_STATE.LIFETIME && (
                <span className="text-gray-100 font-bold text-sm">باقة {plan.name}</span>
              )}
            </div>
          </div>
          {expirationDate && state !== LICENSE_STATE.TRIAL && (
            <div className="text-sm">
              {state === LICENSE_STATE.ACTIVE && (
                <p className="text-gray-400">بتنتهي في {formatDateTime(expirationDate)} ({daysUntilExpiration} يوم)</p>
              )}
              {(state === LICENSE_STATE.GRACE || state === LICENSE_STATE.SUSPENDED) && (
                <p className="text-amber-400 font-semibold">
                  انتهت من {daysSinceExpiration} يوم — {state === LICENSE_STATE.SUSPENDED
                    ? "مفيش إضافة معدة/فرد فريق جديد لحد ما تجدد"
                    : "جدّد دلوقتي قبل ما تنتهي فترة السماح"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* نوع الاشتراك — سطر منفصل وواضح: تجربة مجانية / باقة مدفوعة
            وبأي دورة فوترة / وصول دائم / مجاني — زي ما اتطلب بالظبط. */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-1">نوع الاشتراك</p>
          <p className="text-sm text-gray-200 font-semibold">{subscriptionTypeText}</p>
        </div>

        {/* عداد الـ 14 يوم — بشكل مرئي واضح (progress bar + عدد الأيام)
            مش مجرد سطر نص صغير، عشان يبان فورًا من غير ما تدور عليه. */}
        {state === LICENSE_STATE.TRIAL && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <p className="text-sm font-bold text-gray-100">
                باقي <span className={daysUntilExpiration <= 4 ? "text-amber-400" : "text-brand-400"}>{daysUntilExpiration}</span> يوم من التجربة المجانية (من أصل {TRIAL_DAYS} يوم)
              </p>
              <span className="text-xs text-gray-500">تنتهي في {formatDateTime(expirationDate)}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${daysUntilExpiration <= 4 ? "bg-amber-500" : "bg-brand-500"}`}
                style={{ width: `${Math.max(4, Math.min(100, (daysUntilExpiration / TRIAL_DAYS) * 100))}%` }}
              />
            </div>
            <p className={`text-xs mt-2 ${daysUntilExpiration <= 4 ? "text-amber-400 font-semibold" : "text-gray-500"}`}>
              اختار باقة قبل ما تنتهي التجربة عشان تكمل شغلك من غير أي انقطاع.
            </p>
          </div>
        )}
      </Card>

      {(state === LICENSE_STATE.GRACE || state === LICENSE_STATE.SUSPENDED) && (
        <div className="mb-6 flex items-start gap-3 bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3">
          <AlertIcon size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200">
            بياناتك كلها متاحة زي ما هي (قراءة، تصدير، نسخة احتياطية) — التجديد مطلوب بس عشان تقدر تضيف معدات أو أفراد فريق جدد.
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setCycle(BILLING_CYCLE.MONTHLY)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${cycle === BILLING_CYCLE.MONTHLY ? "bg-brand-600 text-white" : "bg-surface-2 text-gray-400"}`}
        >شهري</button>
        <button
          onClick={() => setCycle(BILLING_CYCLE.ANNUAL)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${cycle === BILLING_CYCLE.ANNUAL ? "bg-brand-600 text-white" : "bg-surface-2 text-gray-400"}`}
        >سنوي <span className="text-[11px] opacity-80">(وفّر ~17%)</span></button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            cycle={cycle}
            // "باقتك الحالية" (تعطيل زرار الاشتراك) بس لما تكون فعلاً
            // مشترك ونشط. أثناء التجربة المجانية أو فترة السماح/التوقف
            // المفروض تقدر تشترك (أو تجدد) في أي باقة عادي — لو عطّلناها
            // زي حالة "نشط" كنا هنمنع أي تحويل من تجربة لباقة مدفوعة.
            currentPlanId={state === LICENSE_STATE.ACTIVE ? plan?.id : null}
            onSubscribe={setSubscribingPlan}
          />
        ))}
      </div>

      {state === LICENSE_STATE.LIFETIME && (
        <div className="mt-6">
          <EmptyState
            icon={<StarIcon size={36} className="text-amber-400 mx-auto mb-2" />}
            title="عندك وصول دائم (Lifetime)"
            description="كل مزايا التطبيق متاحة ليك بدون أي تاريخ انتهاء."
          />
        </div>
      )}

      {subscribingPlan && (
        <PaymentModal plan={subscribingPlan} cycle={cycle} onClose={() => setSubscribingPlan(null)} />
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto" dir="rtl">
      {content}
    </div>
  );
};

export default BillingPage;
