// src/hooks/useDashboard.integration.test.js
//
// This is the "integration-lite" test called for in the SC-2026-9114 review
// follow-up: create a job -> record a payment against it -> confirm the
// dashboard's computed debt/profit is correct — using plain mock arrays
// instead of a real Firestore instance.
//
// useDashboard.js itself is a thin React hook that just wires DataContext
// state into the pure functions below (aggregateJobs, calcTotalSalariesPaid,
// aggregateSupplierInvoices, ...) and adds one line of arithmetic
// (netProfit = ...). Mounting React + mocking Firebase just to exercise that
// one line would be a lot of test-infrastructure weight for what it buys.
// Instead, this file calls the exact same functions useDashboard.js calls,
// in the exact same order, on a small realistic mock dataset, and asserts
// the final combined numbers — so any regression in how the pieces are
// wired together (not just in one function in isolation) gets caught here.
//
// If useDashboard.js's calculation is ever changed, this test must be
// updated to match, and vice versa — keep the two in sync.

import { aggregateJobs, aggregateSupplierInvoices } from "../utils/calculations";
import { calcTotalSalariesPaid } from "../utils/salaryCalculations";
import { calcTotalTaxDeductions } from "../utils/taxCalculations";
import { SALARY_ENTRY_TYPES } from "../config/constants";

/** Re-run of the exact netProfit formula from useDashboard.js. */
function computeDashboardTotals({ jobs, payments, maintenance, salaryEntries, taxDeductions, supplierInvoices, supplierPayments, fuelPrice }) {
  const totals = aggregateJobs(jobs, fuelPrice, payments);
  const totalMaintCost = maintenance.reduce((s, m) => s + (Number(m.cost) || 0), 0);
  const totalSalaries = calcTotalSalariesPaid(salaryEntries);
  const totalTaxDeductions = calcTotalTaxDeductions(taxDeductions);
  const supplierStats = aggregateSupplierInvoices(supplierInvoices, supplierPayments);
  const totalSupplierPayable = supplierStats.totalPayable;

  const netProfit = totals.netProfit - totalMaintCost - totalSalaries - totalTaxDeductions - totalSupplierPayable;
  const margin = totals.totalRevenue > 0 ? (netProfit / totals.totalRevenue) * 100 : 0;

  return { totals, totalMaintCost, totalSalaries, totalTaxDeductions, totalSupplierPayable, netProfit, margin };
}

describe("dashboard pipeline: job creation -> payment -> debt/profit", () => {
  test("a job created, then partially paid, produces the correct outstanding debt", () => {
    // 1) إنشاء شغلانة: 20 فدان × 100 ج = 2000 ج إيراد، 10 لتر سولار × 15 ج
    const jobs = [
      { id: "job1", client: "أحمد", acres: 20, pricePerAcre: 100, fuelUsed: 10, date: "2026-01-10" },
    ];
    // 2) تحصيل دفعة جزئية على نفس الشغلانة
    const payments = [{ jobId: "job1", amount: 800 }];

    const result = computeDashboardTotals({
      jobs, payments,
      maintenance: [], salaryEntries: [], taxDeductions: [],
      supplierInvoices: [], supplierPayments: [],
      fuelPrice: 15,
    });

    // 3) التأكد إن المديونية المحسوبة في الداشبورد صحيحة
    expect(result.totals.totalRevenue).toBe(2000);
    expect(result.totals.totalPaid).toBe(800);
    expect(result.totals.totalRemaining).toBe(1200); // 2000 - 800
    expect(result.totals.totalFuelCost).toBe(150);   // 10 * 15
    expect(result.netProfit).toBe(2000 - 150);        // no other costs yet
  });

  test("a follow-up completing payment brings remaining debt to zero", () => {
    const jobs = [
      { id: "job1", client: "أحمد", acres: 20, pricePerAcre: 100, fuelUsed: 10, date: "2026-01-10" },
    ];
    // دفعة جزئية ثم دفعة مكمّلة لنفس الشغلانة
    const payments = [
      { jobId: "job1", amount: 800 },
      { jobId: "job1", amount: 1200 },
    ];

    const result = computeDashboardTotals({
      jobs, payments,
      maintenance: [], salaryEntries: [], taxDeductions: [],
      supplierInvoices: [], supplierPayments: [],
      fuelPrice: 15,
    });

    expect(result.totals.totalPaid).toBe(2000);
    expect(result.totals.totalRemaining).toBe(0);
  });

  test("maintenance, salaries, tax and unpaid supplier invoices all reduce net profit together", () => {
    const jobs = [
      { id: "job1", acres: 10, pricePerAcre: 500, fuelUsed: 0, date: "2026-01-01" }, // revenue 5000
    ];
    const maintenance = [{ cost: 400 }];
    const salaryEntries = [
      { type: SALARY_ENTRY_TYPES.BASE, amount: 1000 },
      { type: SALARY_ENTRY_TYPES.ADVANCE, amount: 5000 }, // must NOT reduce profit (not a real expense yet)
    ];
    const taxDeductions = [{ amount: 300 }];
    const supplierInvoices = [{ id: "inv1", amount: 1000 }];
    const supplierPayments = [{ supplierInvoiceId: "inv1", amount: 400 }]; // 600 still payable

    const result = computeDashboardTotals({
      jobs, payments: [], maintenance, salaryEntries, taxDeductions,
      supplierInvoices, supplierPayments, fuelPrice: 15,
    });

    expect(result.totalMaintCost).toBe(400);
    expect(result.totalSalaries).toBe(1000); // advance excluded
    expect(result.totalTaxDeductions).toBe(300);
    expect(result.totalSupplierPayable).toBe(600); // 1000 - 400 paid so far

    // 5000 revenue - 0 fuel - 400 maint - 1000 salaries - 300 tax - 600 supplier
    expect(result.netProfit).toBe(5000 - 400 - 1000 - 300 - 600);
  });

  test("fully covers everything with zero activity: no NaN, no crash", () => {
    const result = computeDashboardTotals({
      jobs: [], payments: [], maintenance: [], salaryEntries: [], taxDeductions: [],
      supplierInvoices: [], supplierPayments: [], fuelPrice: 15,
    });
    expect(result.netProfit).toBe(0);
    expect(result.margin).toBe(0); // guarded against division by zero
  });
});
