// src/services/adminIntegrityService.js
//
// audit finding F-003 (Phase 5, البند التاني): تقرير فحص تكامل بيانات
// مجمّع عبر كل الشركات — أدمن بس. useNotifications.js/useAdminErrors.js
// بيكتشفوا نفس المشاكل دي (دفعات يتيمة، قيود رواتب مكررة) بس لكل شركة
// لوحدها وهي داخلة على حسابها هي بس — مفيش قبل كده أي مكان الأدمن يقدر
// يشوف فيه الصورة الكاملة عبر كل الشركات دفعة واحدة.
//
// ده كان محتاج تعديل في firestore.rules نفسه (شوف التعليق فوق
// match /{document=**} جوه users/{uid}): الأدمن كان أصلاً يقدر يقرا بس
// بروفايل الشركة (users/{uid}) وmetadata الباك أب بتاعتها — مش محتوى
// subcollections زي jobs/payments/salaryEntries خالص. اتضافت
// `|| isAdmin()` لقاعدة القراءة العامة (قراءة بس، مفيش أي كتابة جديدة)،
// واتحدّث الاختبار المقابل في scripts/testFirestoreRules.js.
//
// الكشف نفسه بيعتمد بالكامل على الدوال النقية الموجودة فعلاً
// (utils/findOrphanedPayments.js وutils/findDuplicateSalaryEntries.js) —
// مفيش منطق كشف جديد هنا، بس تشغيلها عبر كل شركة بدل شركة واحدة بس.
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { userProfileService } from "./userProfileService";
import { findOrphanedPayments, findOrphanedSupplierPayments } from "../utils/findOrphanedPayments";
import { findDuplicateSalaryEntries } from "../utils/findDuplicateSalaryEntries";

const col = (uid, name) => collection(db, "users", uid, name);

const getAllDocs = async (uid, name) => {
  const snap = await getDocs(col(uid, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// كام شركة نقرا بياناتها بالتوازي في نفس الوقت وقت الفحص — مش كل
// الشركات دفعة واحدة (لو عددهم كبير، ده هيبقى مئات القراءات المتزامنة
// دفعة واحدة)، ومش شركة شركة (بطيء جداً لو العدد كبير). رقم متوسط بسيط.
const CONCURRENCY = 5;

async function scanCompany(profile) {
  const uid = profile.uid;
  const [jobs, payments, supplierInvoices, supplierPayments, salaryEntries] = await Promise.all([
    getAllDocs(uid, "jobs"),
    getAllDocs(uid, "payments"),
    getAllDocs(uid, "supplierInvoices"),
    getAllDocs(uid, "supplierPayments"),
    getAllDocs(uid, "salaryEntries"),
  ]);

  const orphanedPayments = findOrphanedPayments(jobs, payments);
  const orphanedSupplierPayments = findOrphanedSupplierPayments(supplierInvoices, supplierPayments);
  const salaryDuplicates = findDuplicateSalaryEntries(salaryEntries);

  const issueCount =
    orphanedPayments.length +
    orphanedSupplierPayments.length +
    salaryDuplicates.duplicateCount;

  return {
    uid,
    displayName: profile.displayName || profile.email || uid,
    email: profile.email || null,
    orphanedPayments,
    orphanedSupplierPayments,
    salaryDuplicates,
    issueCount,
  };
}

export const adminIntegrityService = {
  /**
   * بيفحص كل الشركات المسجّلة في النظام، شركة شركة (بدفعات متوازية
   * صغيرة، شوف CONCURRENCY فوق) — يدوي بالكامل (بيتنادى من زرار "شغّل
   * الفحص")، مش تلقائي عند فتح الصفحة، لأنه بيقرا subcollections كاملة
   * (jobs/payments/supplierInvoices/supplierPayments/salaryEntries) لكل
   * شركة في النظام — تكلفة قراءة حقيقية بتكبر خطياً مع عدد الشركات، فمش
   * حاجة تتحمّل من غير ما الأدمن يطلبها بنفسه.
   *
   * @param {(done: number, total: number) => void} [onProgress] بينادى
   *   بعد كل دفعة شركات تخلص، عشان الواجهة تقدر تعرض تقدّم حقيقي (فحص
   *   عدد كبير من الشركات ممكن ياخد وقت محسوس، مش لحظي).
   */
  runFullScan: async (onProgress) => {
    const companies = await userProfileService.getAll();
    const results = [];
    let done = 0;

    for (let i = 0; i < companies.length; i += CONCURRENCY) {
      const batch = companies.slice(i, i + CONCURRENCY);
      // eslint-disable-next-line no-await-in-loop
      const batchResults = await Promise.all(batch.map((c) => scanCompany(c)));
      results.push(...batchResults);
      done += batch.length;
      onProgress?.(done, companies.length);
    }

    // الأغلبية الساحقة من الشركات هتكون نضيفة تماماً (findOrphanedPayments.js
    // موثّق ليه ده متوقع) — التقرير بيعرض بس اللي فيها مشكلة فعلية، الأكتر
    // مشاكل أولاً، بدل ما يغرق الأدمن في قايمة طويلة أغلبها صفر.
    const withIssues = results
      .filter((r) => r.issueCount > 0)
      .sort((a, b) => b.issueCount - a.issueCount);
    const totalIssues = results.reduce((s, r) => s + r.issueCount, 0);

    return {
      scannedAt: new Date(),
      companiesScanned: companies.length,
      companiesWithIssues: withIssues.length,
      totalIssues,
      results: withIssues,
    };
  },
};
