// src/services/billingService.js
// ─────────────────────────────────────────────────────────
// نظام الباقات والاشتراكات — Phase 1 (دفع يدوي: فودافون كاش/InstaPay +
// إيصال واتساب، لحد الاشتراك في بوابة دفع رسمية). راجع
// SAAS_PRICING_AND_BILLING_RESEARCH.html (قسم 17-18) للتصميم الكامل.
//
// التقسيم مقصود: entitlements هي مصدر الحقيقة الوحيد اللي التطبيق بيقراه
// عشان يقرر الصلاحيات (حد المعدات/الفريق، حالة الترخيص). subscriptions
// سجل تجاري (دورة فوترة، آخر دفعة) — مش بيتقرأ من منطق الصلاحيات نفسه.
// الاثنين ما بيتكتبوش إلا من الأدمن (firestore.rules)، أبداً من العميل
// مباشرة — التطبيق بيطلب (billingRequests) والأدمن بيفعّل يدوياً.
// ─────────────────────────────────────────────────────────
import {
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  collection, query, where, orderBy, onSnapshot, serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";
import { CYCLE_DAYS, BILLING_REQUEST_STATUS } from "../config/constants/billing";

const entitlementRef  = (uid) => doc(db, COLLECTIONS.ENTITLEMENTS, uid);
const subscriptionRef = (uid) => doc(db, COLLECTIONS.SUBSCRIPTIONS, uid);
const billingRequestsCol = () => collection(db, COLLECTIONS.BILLING_REQUESTS);

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export const billingService = {
  // ─── الشركة نفسها ────────────────────────────────────────────────────

  /** Real-time — بيرجّع unsubscribe. entitlement = null لو مفيش واحد لسه.
   *  onError اختياري — بيتنادى لو الـ listener فشل (صلاحيات/شبكة) عشان
   *  اللي مستخدم الدالة يقدر يوقف حالة الـ loading بدل ما تفضل عالقة. */
  subscribeToEntitlement: (uid, onChange, onError) =>
    onSnapshot(
      entitlementRef(uid),
      (snap) => onChange(snap.exists() ? snap.data() : null),
      (error) => {
        console.error("subscribeToEntitlement failed:", error);
        onError?.(error);
      }
    ),

  /** طلب دفع يدوي جديد — بيتسجل بحالة "قيد المراجعة" لحد ما الأدمن يتأكد
   *  من التحويل ويفعّل الباقة. بيرجّع الـ id عشان نقدر نتابع حالته live. */
  createBillingRequest: async ({ planId, billingCycle, amount, method }) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("لازم تكون مسجّل دخول");
    const docRef = await addDoc(billingRequestsCol(), {
      uid,
      planId,
      billingCycle,
      amount,
      method,
      status: BILLING_REQUEST_STATUS.PENDING_REVIEW,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /** متابعة حالة طلب دفع بعينه (لصاحبه بس — rules بتتأكد من uid). */
  subscribeToBillingRequest: (requestId, onChange) =>
    onSnapshot(doc(db, COLLECTIONS.BILLING_REQUESTS, requestId), (snap) =>
      onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    ),

  // ─── أدمن بس — الحماية الفعلية في firestore.rules (isAdmin) ──────────

  /** كل الـ entitlements — لعمود "الباقة/الحالة" في جدول الشركات. */
  getAllEntitlements: async () => {
    const snap = await getDocs(collection(db, COLLECTIONS.ENTITLEMENTS));
    const map = {};
    snap.docs.forEach((d) => { map[d.id] = d.data(); });
    return map; // { [uid]: entitlementData }
  },

  /** طلبات الدفع اللي لسه محتاجة مراجعة الأدمن. */
  getPendingBillingRequests: async () => {
    const q = query(
      billingRequestsCol(),
      where("status", "==", BILLING_REQUEST_STATUS.PENDING_REVIEW),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  /**
   * الأدمن بيتأكد إن التحويل وصل فعلاً (يدوياً، برا التطبيق) وبعدين
   * يضغط هنا — بيفعّل الاشتراك والصلاحية مع بعض، ويقفل الطلب كـ "متأكد
   * منه". دورة الفوترة بتتحسب من النهاردة (مش من تاريخ الطلب) عشان لو
   * الأدمن اتأخر يوم-يومين في المراجعة، الشركة ما تخسرش من مدتها.
   */
  confirmBillingRequestAndActivate: async (request) => {
    const admin = auth.currentUser;
    if (!admin) throw new Error("لازم تكون مسجّل دخول كأدمن");

    const now = new Date();
    const periodEnd = addDays(now, CYCLE_DAYS[request.billingCycle] || 30);

    // نقرا الـ entitlement الحالي عشان نحافظ على startDate الأصلي لو
    // الشركة دي كانت مشتركة قبل كده (تجديد، مش اشتراك أول مرة).
    const existingSnap = await getDoc(entitlementRef(request.uid));
    const startDate = existingSnap.exists() && existingSnap.data().startDate
      ? existingSnap.data().startDate
      : Timestamp.fromDate(now);

    await Promise.all([
      updateDoc(doc(db, COLLECTIONS.BILLING_REQUESTS, request.id), {
        status: BILLING_REQUEST_STATUS.CONFIRMED,
        confirmedAt: serverTimestamp(),
        confirmedBy: admin.uid,
      }),
      setDoc(subscriptionRef(request.uid), {
        planId: request.planId,
        billingCycle: request.billingCycle,
        status: "active",
        currentPeriodStart: Timestamp.fromDate(now),
        currentPeriodEnd: Timestamp.fromDate(periodEnd),
        gatewayProvider: "manual",
        lastPaymentAmount: request.amount,
        lastPaymentMethod: request.method,
        updatedAt: serverTimestamp(),
      }, { merge: true }),
      setDoc(entitlementRef(request.uid), {
        type: "plan",
        source: "manual_payment",
        planId: request.planId,
        startDate,
        expirationDate: Timestamp.fromDate(periodEnd),
        adminOverrideBy: admin.uid,
        adminOverrideAt: serverTimestamp(),
        notes: existingSnap.exists() ? (existingSnap.data().notes || "") : "",
      }, { merge: true }),
    ]);
  },

  /** رفض طلب دفع (مبلغ غلط، التحويل ملوش أصل...) — بدون أي تفعيل. */
  rejectBillingRequest: (requestId, reason = "") =>
    updateDoc(doc(db, COLLECTIONS.BILLING_REQUESTS, requestId), {
      status: BILLING_REQUEST_STATUS.REJECTED,
      rejectReason: reason,
    }),

  /**
   * منح صلاحية يدوياً بدون اشتراك مدفوع أصلاً — Lifetime (بدون تاريخ
   * انتهاء إطلاقاً) أو Complimentary (وصول مجاني، بتاريخ انتهاء اختياري
   * زي تمديد تجربة). القسم 16-17 من التقرير: Lifetime لازم يفضل قرار
   * أدمن يدوي بس، مش خيار عام في صفحة الأسعار.
   */
  grantEntitlement: async ({ uid, type, planId = null, expirationDate = null, notes = "" }) => {
    const admin = auth.currentUser;
    if (!admin) throw new Error("لازم تكون مسجّل دخول كأدمن");
    await setDoc(entitlementRef(uid), {
      type, // "lifetime" | "complimentary" | "plan"
      source: "admin_override",
      planId,
      startDate: Timestamp.fromDate(new Date()),
      expirationDate: expirationDate ? Timestamp.fromDate(expirationDate) : null,
      adminOverrideBy: admin.uid,
      adminOverrideAt: serverTimestamp(),
      notes,
    }, { merge: true });
  },

  /** تمديد يدوي سريع (تعويض تأخير، هدية، صفقة خاصة) — بيمدد من تاريخ
   *  الانتهاء الحالي لو لسه ما جاش، أو من النهاردة لو خلاص انتهى. */
  extendEntitlement: async (uid, extraDays) => {
    const admin = auth.currentUser;
    if (!admin) throw new Error("لازم تكون مسجّل دخول كأدمن");
    const snap = await getDoc(entitlementRef(uid));
    const current = snap.exists() ? snap.data() : null;
    const now = new Date();
    const currentExpiry = current?.expirationDate?.toDate?.() || null;
    const base = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
    const newExpiry = addDays(base, extraDays);
    await setDoc(entitlementRef(uid), {
      type: current?.type || "plan",
      planId: current?.planId || null,
      expirationDate: Timestamp.fromDate(newExpiry),
      adminOverrideBy: admin.uid,
      adminOverrideAt: serverTimestamp(),
    }, { merge: true });
  },
};
