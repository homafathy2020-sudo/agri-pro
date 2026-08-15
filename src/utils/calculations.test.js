// src/utils/calculations.test.js
//
// Unit tests for the money math in calculations.js. These functions drive
// every revenue/profit/debt number shown in the app, so a silent regression
// here is the most expensive kind of bug — this file exists to catch that
// before it reaches a real client's account.

import {
  calcRevenue,
  calcFuelCost,
  calcJobNetProfit,
  calcJobProfit,
  calcRemainingAmount,
  getJobPaidAmount,
  derivePaymentStatus,
  aggregateJobs,
  buildEquipmentReport,
  buildDriverReport,
  groupByWorkType,
  buildClientSummary,
  buildClientList,
  calcTotalPaidForJob,
  derivePaymentStatusFromPayments,
  checkMaintenanceDue,
  checkOverdueDebts,
} from "./calculations";

// ─── calcRevenue / calcFuelCost ────────────────────────────────────────────

describe("calcRevenue", () => {
  test("multiplies acres by price per acre", () => {
    expect(calcRevenue(10, 150)).toBe(1500);
  });

  test("treats missing/invalid values as 0 instead of NaN", () => {
    expect(calcRevenue(undefined, 150)).toBe(0);
    expect(calcRevenue(10, null)).toBe(0);
    expect(calcRevenue("", "")).toBe(0);
  });

  test("coerces numeric strings", () => {
    expect(calcRevenue("10", "150")).toBe(1500);
  });
});

describe("calcFuelCost", () => {
  test("multiplies fuel used by fuel price", () => {
    expect(calcFuelCost(20, 12)).toBe(240);
  });

  test("defaults invalid input to 0", () => {
    expect(calcFuelCost(undefined, 12)).toBe(0);
    expect(calcFuelCost(20, undefined)).toBe(0);
  });
});

// ─── Job profit ─────────────────────────────────────────────────────────────

describe("calcJobNetProfit", () => {
  test("revenue minus fuel cost minus maintenance share", () => {
    // revenue = 10*150=1500, fuel = 20*12=240, maint = 100
    expect(calcJobNetProfit(10, 150, 20, 12, 100)).toBe(1160);
  });

  test("maintCostShare defaults to 0 when omitted", () => {
    expect(calcJobNetProfit(10, 150, 20, 12)).toBe(1260);
  });

  test("calcJobProfit is an alias of calcJobNetProfit", () => {
    expect(calcJobProfit).toBe(calcJobNetProfit);
  });
});

// ─── Remaining amount ───────────────────────────────────────────────────────

describe("calcRemainingAmount", () => {
  test("revenue minus amount paid", () => {
    expect(calcRemainingAmount(1000, 400)).toBe(600);
  });

  test("never goes negative when overpaid", () => {
    expect(calcRemainingAmount(1000, 1500)).toBe(0);
  });

  test("treats missing amountPaid as 0", () => {
    expect(calcRemainingAmount(1000, undefined)).toBe(1000);
  });
});

// ─── getJobPaidAmount (instalments vs legacy fallback) ─────────────────────

describe("getJobPaidAmount", () => {
  test("sums instalments from the payments collection when present", () => {
    const job = { id: "job1", amountPaid: 999 }; // legacy field should be ignored
    const payments = [
      { jobId: "job1", amount: 200 },
      { jobId: "job1", amount: 150 },
      { jobId: "job2", amount: 500 }, // unrelated job, must not be counted
    ];
    expect(getJobPaidAmount(job, payments)).toBe(350);
  });

  test("falls back to legacy job.amountPaid when no instalments exist", () => {
    const job = { id: "oldJob", amountPaid: 700 };
    expect(getJobPaidAmount(job, [])).toBe(700);
  });

  test("falls back to 0 when neither instalments nor legacy field exist", () => {
    const job = { id: "job3" };
    expect(getJobPaidAmount(job, [])).toBe(0);
  });

  test("defaults payments to an empty array when omitted", () => {
    const job = { id: "job4", amountPaid: 50 };
    expect(getJobPaidAmount(job)).toBe(50);
  });
});

// ─── Payment status ──────────────────────────────────────────────────────────

describe("derivePaymentStatus", () => {
  test("unpaid when nothing has been paid", () => {
    expect(derivePaymentStatus(1000, 0)).toBe("unpaid");
  });

  test("partial when paid is between 0 and revenue", () => {
    expect(derivePaymentStatus(1000, 500)).toBe("partial");
  });

  test("paid when the full revenue has been paid", () => {
    expect(derivePaymentStatus(1000, 1000)).toBe("paid");
  });

  test("paid when overpaid", () => {
    expect(derivePaymentStatus(1000, 1200)).toBe("paid");
  });
});

// ─── aggregateJobs ───────────────────────────────────────────────────────────

describe("aggregateJobs", () => {
  const jobs = [
    { id: "a", acres: 10, pricePerAcre: 100, fuelUsed: 5, date: "2026-01-01" }, // revenue 1000
    { id: "b", acres: 5, pricePerAcre: 200, fuelUsed: 3, date: "2026-01-02" },  // revenue 1000
  ];
  const payments = [{ jobId: "a", amount: 1000 }]; // job a fully paid, job b unpaid

  test("sums revenue, acres and fuel across jobs", () => {
    const totals = aggregateJobs(jobs, 12, payments);
    expect(totals.totalRevenue).toBe(2000);
    expect(totals.totalAcres).toBe(15);
    expect(totals.totalFuel).toBe(8);
    expect(totals.totalFuelCost).toBe(96); // 8 * 12
    expect(totals.netProfit).toBe(2000 - 96);
  });

  test("computes totalPaid and totalRemaining from the payments collection", () => {
    const totals = aggregateJobs(jobs, 12, payments);
    expect(totals.totalPaid).toBe(1000);
    expect(totals.totalRemaining).toBe(1000); // job b's full revenue still owed
  });

  test("returns all-zero totals for an empty job list", () => {
    const totals = aggregateJobs([], 12, []);
    expect(totals).toEqual({
      totalRevenue: 0, totalAcres: 0, totalFuel: 0, totalFuelCost: 0,
      netProfit: 0, totalPaid: 0, totalRemaining: 0,
    });
  });
});

// ─── Equipment / driver reports ──────────────────────────────────────────────

describe("buildEquipmentReport", () => {
  const equipment = [{ id: "eq1", name: "Tractor 1" }, { id: "eq2", name: "Tractor 2" }];
  const jobs = [
    { id: "j1", equipmentId: "eq1", acres: 10, pricePerAcre: 100, fuelUsed: 0, date: "2026-01-01" },
    { id: "j2", equipmentId: "eq2", acres: 20, pricePerAcre: 100, fuelUsed: 0, date: "2026-01-02" },
  ];
  const maintenance = [{ id: "m1", equipmentId: "eq1", cost: 300 }];

  test("attributes jobs and maintenance cost to the right equipment", () => {
    const report = buildEquipmentReport(equipment, jobs, maintenance, 12, []);
    const eq1 = report.find((r) => r.id === "eq1");
    const eq2 = report.find((r) => r.id === "eq2");
    expect(eq1.totalRevenue).toBe(1000);
    expect(eq1.maintCost).toBe(300);
    expect(eq1.netProfit).toBe(700); // 1000 revenue - 0 fuel - 300 maint
    expect(eq2.maintCost).toBe(0);
    expect(eq1.ops).toBe(1);
  });

  test("sorts by total revenue descending", () => {
    const report = buildEquipmentReport(equipment, jobs, maintenance, 12, []);
    expect(report[0].id).toBe("eq2"); // 2000 revenue > 1000 revenue
  });

  test("margin is 0 (not NaN) when equipment has no revenue", () => {
    const report = buildEquipmentReport(
      [{ id: "eqX" }], [], [], 12, []
    );
    expect(report[0].margin).toBe(0);
  });
});

describe("buildDriverReport", () => {
  test("attributes jobs to the right driver and sorts by revenue", () => {
    const drivers = [{ id: "d1" }, { id: "d2" }];
    const jobs = [
      { id: "j1", driverId: "d1", acres: 1, pricePerAcre: 100, fuelUsed: 0, date: "2026-01-01" },
      { id: "j2", driverId: "d2", acres: 5, pricePerAcre: 100, fuelUsed: 0, date: "2026-01-01" },
    ];
    const report = buildDriverReport(drivers, jobs, 12, []);
    expect(report[0].id).toBe("d2");
    expect(report[0].ops).toBe(1);
    expect(report[1].id).toBe("d1");
  });
});

// ─── groupByWorkType ─────────────────────────────────────────────────────────

describe("groupByWorkType", () => {
  test("sums acres per work type", () => {
    const jobs = [
      { workType: "حرث", acres: 10 },
      { workType: "حرث", acres: 5 },
      { workType: "رش", acres: 3 },
    ];
    const grouped = groupByWorkType(jobs);
    expect(grouped).toEqual(
      expect.arrayContaining([
        { name: "حرث", value: 15 },
        { name: "رش", value: 3 },
      ])
    );
  });
});

// ─── Client summary / list ──────────────────────────────────────────────────

describe("buildClientSummary and buildClientList", () => {
  const jobs = [
    { id: "j1", client: "أحمد", acres: 10, pricePerAcre: 100, fuelUsed: 0, date: "2026-01-01" },
    { id: "j2", client: "أحمد", acres: 5, pricePerAcre: 100, fuelUsed: 0, date: "2026-01-02" },
    { id: "j3", client: "محمد", acres: 20, pricePerAcre: 100, fuelUsed: 0, date: "2026-01-03" },
  ];
  const payments = [{ jobId: "j3", amount: 2000 }]; // محمد fully paid

  test("buildClientSummary aggregates only that client's jobs", () => {
    const summary = buildClientSummary("أحمد", jobs, 12, payments);
    expect(summary.ops).toBe(2);
    expect(summary.totalRevenue).toBe(1500);
    expect(summary.totalRemaining).toBe(1500); // nothing paid
  });

  test("buildClientList sorts clients by outstanding debt descending", () => {
    const list = buildClientList(jobs, 12, payments);
    expect(list[0].client).toBe("أحمد"); // owes 1500
    expect(list.find((c) => c.client === "محمد").totalRemaining).toBe(0);
  });

  test("buildClientList ignores jobs with no client name", () => {
    const withBlank = [...jobs, { id: "j4", client: "", acres: 1, pricePerAcre: 1, date: "2026-01-04" }];
    const list = buildClientList(withBlank, 12, payments);
    expect(list.some((c) => c.client === "")).toBe(false);
  });
});

// ─── Payment instalments ──────────────────────────────────────────────────────

describe("calcTotalPaidForJob", () => {
  test("sums only the instalments for the given job", () => {
    const payments = [
      { jobId: "j1", amount: 100 },
      { jobId: "j1", amount: 50 },
      { jobId: "j2", amount: 999 },
    ];
    expect(calcTotalPaidForJob(payments, "j1")).toBe(150);
  });
});

describe("derivePaymentStatusFromPayments", () => {
  test("returns paid/remaining/status derived from the payments list", () => {
    const payments = [{ jobId: "j1", amount: 400 }];
    const result = derivePaymentStatusFromPayments(1000, payments, "j1");
    expect(result).toEqual({ paid: 400, remaining: 600, status: "partial" });
  });
});

// ─── Maintenance alerts ───────────────────────────────────────────────────────

describe("checkMaintenanceDue", () => {
  test("flags equipment whose maintenance is overdue", () => {
    const today = new Date();
    const longAgo = new Date(today);
    longAgo.setDate(longAgo.getDate() - 40);
    const isoLongAgo = longAgo.toISOString().split("T")[0];

    const equipment = [{ id: "eq1", maintenanceIntervalDays: 30 }];
    const maintenance = [{ id: "m1", equipmentId: "eq1", date: isoLongAgo }];

    const alerts = checkMaintenanceDue(equipment, maintenance, 7);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].isOverdue).toBe(true);
  });

  test("ignores equipment without a maintenance interval configured", () => {
    const equipment = [{ id: "eq1" }]; // no maintenanceIntervalDays
    const maintenance = [{ id: "m1", equipmentId: "eq1", date: "2020-01-01" }];
    expect(checkMaintenanceDue(equipment, maintenance)).toEqual([]);
  });

  test("ignores equipment with no maintenance history yet", () => {
    const equipment = [{ id: "eq1", maintenanceIntervalDays: 30 }];
    expect(checkMaintenanceDue(equipment, [])).toEqual([]);
  });
});

// ─── Overdue debts ─────────────────────────────────────────────────────────────

describe("checkOverdueDebts", () => {
  test("flags unpaid jobs older than the overdue threshold", () => {
    const today = new Date();
    const oldDate = new Date(today);
    oldDate.setDate(oldDate.getDate() - 45);
    const isoOld = oldDate.toISOString().split("T")[0];

    const jobs = [
      { id: "j1", date: isoOld, acres: 10, pricePerAcre: 100 }, // old + unpaid
      { id: "j2", date: new Date().toISOString().split("T")[0], acres: 10, pricePerAcre: 100 }, // recent + unpaid
    ];

    const overdue = checkOverdueDebts(jobs, 12, 30, []);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].job.id).toBe("j1");
  });

  test("excludes jobs that are already fully paid, regardless of age", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 90);
    const isoOld = oldDate.toISOString().split("T")[0];

    const jobs = [{ id: "j1", date: isoOld, acres: 10, pricePerAcre: 100 }];
    const payments = [{ jobId: "j1", amount: 1000 }];

    expect(checkOverdueDebts(jobs, 12, 30, payments)).toEqual([]);
  });

  test("sorts results by remaining amount descending", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);
    const isoOld = oldDate.toISOString().split("T")[0];

    const jobs = [
      { id: "small", date: isoOld, acres: 1, pricePerAcre: 100 },  // remaining 100
      { id: "big",   date: isoOld, acres: 10, pricePerAcre: 100 }, // remaining 1000
    ];

    const overdue = checkOverdueDebts(jobs, 12, 30, []);
    expect(overdue[0].job.id).toBe("big");
    expect(overdue[1].job.id).toBe("small");
  });
});
