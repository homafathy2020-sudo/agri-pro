// src/utils/dataIntegrityCheck.integration.test.js
//
// audit finding: Phase 3 roadmap task 3 — "توسيع اختبارات integration بما
// يتجاوز useDashboard فقط". findOrphanedPayments، findOrphanedSupplierPayments
// وfindDuplicateSalaryEntries كل واحدة فيهم متغطية بوحدة اختبار خاصة بيها
// (findOrphanedPayments.test.js، findDuplicateSalaryEntries.test.js)، لكن
// محدش اختبرهم وهم شغالين مع بعض على بيانات شركة واحدة واقعية — بالظبط
// زي "تقرير فحص سلامة البيانات الدوري" اللي التدقيق نفسه اقترحه لاحقًا في
// Phase 5 من الـ roadmap. الملف ده بيبني الأساس على نفس فلسفة
// useDashboard.integration.test.js بالظبط: دوال نقية (pure functions) على
// مصفوفات mock، من غير أي Firestore حقيقي أو حتى mock — لو أي دالة اتغيّر
// شكل مخرجاتها بعدين، الاختبار المُجمّع هنا هيكسر حتى لو كل دالة لوحدها
// عدّت اختبارها الفردي.

import { findOrphanedPayments, findOrphanedSupplierPayments } from "./findOrphanedPayments";
import { findDuplicateSalaryEntries } from "./findDuplicateSalaryEntries";

// نفس الفكرة اللي هتتحول لاحقًا لتقرير أدمن دوري (Phase 5) — تشغيل كل
// كاشفات سلامة البيانات مع بعض على بيانات شركة واحدة، وإرجاع ملخص واحد.
function runDataIntegrityCheck({ jobs, payments, supplierInvoices, supplierPayments, salaryEntries }) {
  const orphanedPayments = findOrphanedPayments(jobs, payments);
  const orphanedSupplierPayments = findOrphanedSupplierPayments(supplierInvoices, supplierPayments);
  const salaryDuplicates = findDuplicateSalaryEntries(salaryEntries);

  return {
    orphanedPayments,
    orphanedSupplierPayments,
    salaryDuplicates,
    totalIssuesFound:
      orphanedPayments.length + orphanedSupplierPayments.length + salaryDuplicates.duplicateCount,
  };
}

describe("data integrity check pipeline: orphaned payments + duplicate salary entries together", () => {
  test("a realistic company dataset with every known issue type surfaces all of them correctly", () => {
    const jobs = [
      { id: "job1", client: "أحمد", acres: 20, pricePerAcre: 100 },
      { id: "job2", client: "محمد", acres: 10, pricePerAcre: 200 },
      // ملحوظة: "job3" مالوش أي مستند هنا عمدًا — بيمثّل وظيفة اتمسحت
      // بعد ما دفعة ليها كانت لسه offline على جهاز تاني (audit finding B4/F3).
    ];
    const payments = [
      { jobId: "job1", amount: 500 }, // طبيعية
      { jobId: "job2", amount: 300 }, // طبيعية
      { jobId: "job3", amount: 999 }, // يتيمة — job3 مش موجود
    ];

    const supplierInvoices = [{ id: "inv1", amount: 1000 }];
    const supplierPayments = [
      { supplierInvoiceId: "inv1", amount: 400 }, // طبيعية
      { supplierInvoiceId: "inv-ghost", amount: 250 }, // يتيمة — inv-ghost مش موجودة
    ];

    const salaryEntries = [
      // إدخالين يدويين بالصدفة نفس القيم بالظبط — لازم ميتفلجوش أبداً لأنهم مش migration-sourced.
      { id: "s1", driverId: "d1", type: "bonus", amount: 500, date: "2026-01-05", notes: "مكافأة يدوية" },
      { id: "s2", driverId: "d1", type: "bonus", amount: 500, date: "2026-01-05", notes: "مكافأة يدوية تانية بالصدفة نفس القيم" },

      // نفس legacyDriverCostId اتحول مرتين — high confidence duplicate.
      {
        id: "s3", driverId: "d2", type: "base", amount: 3000, date: "2026-01-01",
        notes: "(منقول من: driverCost123)", legacyDriverCostId: "dc123",
        createdAt: { toMillis: () => 1000 },
      },
      {
        id: "s4", driverId: "d2", type: "base", amount: 3000, date: "2026-01-01",
        notes: "(منقول من: driverCost123)", legacyDriverCostId: "dc123",
        createdAt: { toMillis: () => 2000 },
      },

      // نفس السائق/النوع/المبلغ/التاريخ، من غير legacyDriverCostId مشترك — needsReview بس.
      {
        id: "s5", driverId: "d3", type: "advance", amount: 1000, date: "2026-02-01",
        notes: "(منقول من: driverCost999)",
      },
      {
        id: "s6", driverId: "d3", type: "advance", amount: 1000, date: "2026-02-01",
        notes: "(منقول من: driverCost999)",
      },
    ];

    const result = runDataIntegrityCheck({ jobs, payments, supplierInvoices, supplierPayments, salaryEntries });

    // 1) دفعة يتيمة واحدة بس، وهي بالظبط اللي متعلقة بـ job3
    expect(result.orphanedPayments).toHaveLength(1);
    expect(result.orphanedPayments[0].jobId).toBe("job3");

    // 2) دفعة مورد يتيمة واحدة بس
    expect(result.orphanedSupplierPayments).toHaveLength(1);
    expect(result.orphanedSupplierPayments[0].supplierInvoiceId).toBe("inv-ghost");

    // 3) تكرار الرواتب: مجموعة واحدة high-confidence (s3/s4) ومجموعة واحدة needsReview (s5/s6)
    expect(result.salaryDuplicates.highConfidence).toHaveLength(1);
    expect(result.salaryDuplicates.highConfidence[0].keep.id).toBe("s3"); // الأقدم createdAt
    expect(result.salaryDuplicates.highConfidence[0].duplicates.map((d) => d.id)).toEqual(["s4"]);

    expect(result.salaryDuplicates.needsReview).toHaveLength(1);
    expect(result.salaryDuplicates.needsReview[0].duplicates.map((d) => d.id)).toEqual(["s6"]);

    // 4) القيدين اليدويين (s1/s2) ملهمش أي وجود في أي مجموعة تكرار — الضمان
    // الموثّق في findDuplicateSalaryEntries.js نفسه ("Manually-entered salary
    // entries are never touched or flagged").
    const allFlaggedIds = [
      ...result.salaryDuplicates.highConfidence.flatMap((g) => [g.keep.id, ...g.duplicates.map((d) => d.id)]),
      ...result.salaryDuplicates.needsReview.flatMap((g) => [g.keep.id, ...g.duplicates.map((d) => d.id)]),
    ];
    expect(allFlaggedIds).not.toContain("s1");
    expect(allFlaggedIds).not.toContain("s2");

    // 5) الملخص المُجمّع: 1 دفعة يتيمة + 1 دفعة مورد يتيمة + 2 تكرار رواتب (s4, s6)
    expect(result.totalIssuesFound).toBe(4);
  });

  test("a fully clean company (no orphans, no duplicates) reports zero issues — no false positives", () => {
    const jobs = [{ id: "job1", client: "أحمد", acres: 20, pricePerAcre: 100 }];
    const payments = [{ jobId: "job1", amount: 500 }];
    const supplierInvoices = [{ id: "inv1", amount: 1000 }];
    const supplierPayments = [{ supplierInvoiceId: "inv1", amount: 1000 }];
    const salaryEntries = [
      { id: "s1", driverId: "d1", type: "base", amount: 3000, date: "2026-01-01", notes: "راتب عادي" },
    ];

    const result = runDataIntegrityCheck({ jobs, payments, supplierInvoices, supplierPayments, salaryEntries });

    expect(result.orphanedPayments).toHaveLength(0);
    expect(result.orphanedSupplierPayments).toHaveLength(0);
    expect(result.salaryDuplicates.highConfidence).toHaveLength(0);
    expect(result.salaryDuplicates.needsReview).toHaveLength(0);
    expect(result.totalIssuesFound).toBe(0);
  });

  test("an empty/new company (zero activity) reports zero issues without crashing", () => {
    const result = runDataIntegrityCheck({
      jobs: [], payments: [], supplierInvoices: [], supplierPayments: [], salaryEntries: [],
    });
    expect(result.totalIssuesFound).toBe(0);
  });
});
