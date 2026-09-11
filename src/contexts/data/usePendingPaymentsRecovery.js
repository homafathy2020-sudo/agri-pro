// src/contexts/data/usePendingPaymentsRecovery.js
//
// يحل مشكلة: لو المستخدم قفل التطبيق كله (مش بس نافذة الإضافة) وهو
// أوفلاين، بالظبط في اللحظة اللي بين "اتسجلت العملية" و"لسه هيتسجل معاها
// الدفعة المقدّمة عند التسجيل" — كود تسجيل الدفعة في JobsPage كان لسه ما
// اتنفذش، فالدفعة كانت هتضيع نهائيًا بدون أي أثر ليها.
//
// JobsPage دلوقتي بيسجّل "نية دفعة معلّقة" في localStorage قبل ما يستنى
// تأكيد العملية (pendingJobPayments.js). الهوك ده بيشتغل مرة واحدة بعد ما
// البيانات تحمّل بنجاح، ويدوّر على أي نية متروكة من جلسة سابقة، ويكمّلها
// تلقائيًا — بنفس رقم الدفعة (id) المحفوظ، فمستحيل تتسجل مرتين حتى لو
// المحاولة اتكررت أكتر من مرة.
//
// مهم: localStorage هنا مش مصدر بيانات مالية ولا بديل عن Firestore — هو
// مجرد "ملاحظة تذكير" محلية. الدفعة الفعلية دايمًا بتتسجل في Firestore
// بنفس آلية trackWrite/rollback المستخدمة في كل التطبيق.
import { useEffect, useRef } from "react";
import { paymentService } from "../../services/paymentService";
import {
  getPendingJobPayments,
  clearPendingJobPayment,
} from "../../utils/pendingJobPayments";

export function usePendingPaymentsRecovery({ user, loading, jobs, payments, dispatch, trackWrite }) {
  const ranRef = useRef(false);

  // مستخدم مختلف (تسجيل خروج/دخول من غير إعادة تحميل الصفحة) لازم يبدأ
  // فحص جديد من الأول.
  useEffect(() => {
    ranRef.current = false;
  }, [user?.uid]);

  useEffect(() => {
    if (!user || loading) return;
    if (ranRef.current) return; // مرة واحدة بس لكل تحميل ناجح
    ranRef.current = true;

    const pending = getPendingJobPayments(user.uid);
    if (pending.length === 0) return;

    pending.forEach((intent) => {
      const { paymentId, jobId, amount, date, notes } = intent || {};
      if (!paymentId || !jobId) {
        clearPendingJobPayment(user.uid, paymentId);
        return;
      }

      // الدفعة اتسجّلت فعلاً قبل ما نلحق نمسح النية (مثلاً التطبيق اتقفل
      // بين نجاح الكتابة ومسح النية) — امسح النية بس، من غير أي تكرار.
      if (payments.some((p) => p.id === paymentId)) {
        clearPendingJobPayment(user.uid, paymentId);
        return;
      }

      // العملية نفسها مش موجودة في البيانات المحمّلة — يبقى كتابتها
      // الأصلية ما وصلتش أصلاً (حالة نادرة جدًا، عادة بس لو التخزين
      // المحلي اتمسح بالكامل). مفيش عملية نربط بيها الدفعة، فامسح النية
      // المعلّقة بدل ما تفضل عالقة للأبد.
      if (!jobs.some((j) => j.id === jobId)) {
        clearPendingJobPayment(user.uid, paymentId);
        return;
      }

      // العملية موجودة والدفعة لسه ما اتسجلتش فعليًا — كمّل التسجيل بنفس
      // الـ id المحفوظ.
      const { promise } = paymentService.add(
        user.uid,
        { jobId, amount, date, notes },
        paymentId
      );
      dispatch({ type: "ADD_PAYMENT", payload: { id: paymentId, jobId, amount, date, notes } });
      trackWrite(promise, {
        rollback: () => dispatch({ type: "DELETE_PAYMENT", payload: paymentId }),
        errorMessage: "تعذر إكمال تسجيل دفعة مقدّمة كانت معلّقة من جلسة سابقة",
      });
      clearPendingJobPayment(user.uid, paymentId);
    });
  }, [user, loading, jobs, payments, dispatch, trackWrite]);
}
