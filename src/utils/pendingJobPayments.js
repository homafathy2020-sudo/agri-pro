// src/utils/pendingJobPayments.js
//
// "مذكرة تذكير" محلية في localStorage — مش مصدر بيانات مالية ولا بديل عن
// Firestore أبدًا. الهدف الوحيد منها: تغطية فجوة صغيرة ممكن تحصل لو
// المستخدم قفل التطبيق كله (مش بس نافذة الإضافة) وهو أوفلاين، بالظبط في
// اللحظة اللي بين "اتسجلت العملية" و"لسه هيتسجل معاها الدفعة المقدّمة عند
// التسجيل" (شوف JobsPage.handleSave وusePendingPaymentsRecovery.js).
//
// أي دفعة فعلية بتتسجل دايمًا في Firestore بنفس آلية trackWrite/rollback
// المستخدمة في باقي التطبيق بالظبط. الملف ده بس بيسجّل "فيه نية دفعة
// معلّقة" قبل ما نستنى تأكيد العملية، عشان لو الجلسة اتقفلت قبل ما الكود
// يلحق يسجّل الدفعة فعليًا، تتسجّل تلقائيًا أول ما التطبيق يفتح تاني —
// بنفس رقم الدفعة (id) المحفوظ عشان أي محاولة تكرار تفضل آمنة (idempotent)
// ومتسجلش نفس الدفعة مرتين.
const storageKey = (uid) => `agripro_pending_job_payments_${uid}`;

const readAll = (uid) => {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (uid, list) => {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(list));
  } catch {
    // لو التخزين المحلي مش متاح (وضع تصفح خاص، مساحة ممتلئة...) الدفعة
    // نفسها مش متأثرة — بس مفيش شبكة أمان لو التطبيق اتقفل فجأة أوفلاين
    // في نفس اللحظة الحرجة. حالة نادرة جدًا ومفيش داعي نوقف أي حاجة بسببها.
  }
};

/** intent = { paymentId, jobId, amount, date, notes } */
export const savePendingJobPayment = (uid, intent) => {
  if (!uid || !intent?.paymentId) return;
  const list = readAll(uid).filter((p) => p.paymentId !== intent.paymentId);
  list.push(intent);
  writeAll(uid, list);
};

export const clearPendingJobPayment = (uid, paymentId) => {
  if (!uid) return;
  const list = readAll(uid).filter((p) => p.paymentId !== paymentId);
  writeAll(uid, list);
};

export const getPendingJobPayments = (uid) => {
  if (!uid) return [];
  return readAll(uid);
};
