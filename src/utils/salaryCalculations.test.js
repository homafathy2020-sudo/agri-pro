// src/utils/salaryCalculations.test.js
import {
  calcMonthlySalary,
  getMonthEntries,
  calcOutstandingAdvances,
  calcTotalSalariesPaid,
  calcDailyRate,
  calcAttendanceSummary,
} from "./salaryCalculations";
import { SALARY_ENTRY_TYPES } from "../config/constants";

// ─── calcMonthlySalary ────────────────────────────────────────────────────────

describe("calcMonthlySalary", () => {
  test("sums base, bonus, deduction and advance-repayment entries", () => {
    const entries = [
      { type: SALARY_ENTRY_TYPES.BASE, amount: 3000 },
      { type: SALARY_ENTRY_TYPES.BONUS, amount: 500 },
      { type: SALARY_ENTRY_TYPES.DEDUCTION, amount: 200 },
      { type: SALARY_ENTRY_TYPES.ADVANCE, amount: 1000 },
      { type: SALARY_ENTRY_TYPES.ADVANCE_REPAY, amount: 300 },
    ];
    const result = calcMonthlySalary(entries, 3000);

    expect(result.base).toBe(3000);
    expect(result.bonuses).toBe(500);
    expect(result.deductions).toBe(200);
    expect(result.advances).toBe(1000);
    expect(result.advanceRepayments).toBe(300);
    expect(result.gross).toBe(3500);       // base + bonuses
    expect(result.net).toBe(3000);         // gross - deductions - advanceRepayments
  });

  test("falls back to the driver's default base salary when no BASE entry exists this month", () => {
    const entries = [{ type: SALARY_ENTRY_TYPES.BONUS, amount: 200 }];
    const result = calcMonthlySalary(entries, 2500);
    expect(result.base).toBe(2500);
    expect(result.gross).toBe(2700);
  });

  test("does NOT apply the default base when a BASE entry of 0 was explicitly recorded", () => {
    // An explicit base entry means the month has been settled — even if 0,
    // it must not be silently replaced by the driver's default.
    const entries = [{ type: SALARY_ENTRY_TYPES.BASE, amount: 0 }];
    const result = calcMonthlySalary(entries, 2500);
    expect(result.base).toBe(0);
  });

  test("defaultBase defaults to 0 when omitted and no BASE entry exists", () => {
    const result = calcMonthlySalary([]);
    expect(result.base).toBe(0);
    expect(result.net).toBe(0);
  });

  test("unrecognised entry types are ignored rather than throwing", () => {
    const entries = [{ type: "unknown_type", amount: 999 }];
    const result = calcMonthlySalary(entries, 1000);
    // base falls back to default since no BASE entry was found; the unknown
    // entry contributes to nothing
    expect(result.base).toBe(1000);
    expect(result.gross).toBe(1000);
  });
});

// ─── getMonthEntries ──────────────────────────────────────────────────────────

describe("getMonthEntries", () => {
  const entries = [
    { driverId: "d1", date: "2026-01-05" },
    { driverId: "d1", date: "2026-02-01" },
    { driverId: "d2", date: "2026-01-10" },
  ];

  test("filters by both driver and year-month prefix", () => {
    const result = getMonthEntries(entries, "d1", "2026-01");
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-01-05");
  });

  test("returns an empty array when no entries match", () => {
    expect(getMonthEntries(entries, "d3", "2026-01")).toEqual([]);
  });
});

// ─── calcOutstandingAdvances ──────────────────────────────────────────────────

describe("calcOutstandingAdvances", () => {
  test("advances minus repayments for that driver only", () => {
    const entries = [
      { driverId: "d1", type: SALARY_ENTRY_TYPES.ADVANCE, amount: 1000 },
      { driverId: "d1", type: SALARY_ENTRY_TYPES.ADVANCE_REPAY, amount: 400 },
      { driverId: "d2", type: SALARY_ENTRY_TYPES.ADVANCE, amount: 5000 }, // other driver
    ];
    expect(calcOutstandingAdvances(entries, "d1")).toBe(600);
  });

  test("never returns a negative balance when repayments exceed advances", () => {
    const entries = [
      { driverId: "d1", type: SALARY_ENTRY_TYPES.ADVANCE, amount: 200 },
      { driverId: "d1", type: SALARY_ENTRY_TYPES.ADVANCE_REPAY, amount: 500 },
    ];
    expect(calcOutstandingAdvances(entries, "d1")).toBe(0);
  });
});

// ─── calcTotalSalariesPaid ────────────────────────────────────────────────────

describe("calcTotalSalariesPaid", () => {
  test("sums only BASE and BONUS entries across all drivers", () => {
    const entries = [
      { driverId: "d1", type: SALARY_ENTRY_TYPES.BASE, amount: 3000 },
      { driverId: "d2", type: SALARY_ENTRY_TYPES.BONUS, amount: 500 },
      { driverId: "d1", type: SALARY_ENTRY_TYPES.ADVANCE, amount: 1000 }, // excluded
      { driverId: "d1", type: SALARY_ENTRY_TYPES.DEDUCTION, amount: 200 }, // excluded
    ];
    expect(calcTotalSalariesPaid(entries)).toBe(3500);
  });
});

// ─── calcDailyRate ────────────────────────────────────────────────────────────

describe("calcDailyRate", () => {
  test("divides monthly salary by working days (default 26)", () => {
    expect(calcDailyRate(2600)).toBe(100);
  });

  test("respects a custom working-days count", () => {
    expect(calcDailyRate(3000, 30)).toBe(100);
  });
});

// ─── calcAttendanceSummary ────────────────────────────────────────────────────

describe("calcAttendanceSummary", () => {
  const records = [
    { driverId: "d1", date: "2026-01-01", status: "present" },
    { driverId: "d1", date: "2026-01-02", status: "absent" },
    { driverId: "d1", date: "2026-01-03", status: "late" },
    { driverId: "d1", date: "2026-01-04", status: "half" },
    { driverId: "d1", date: "2026-02-01", status: "present" }, // different month
    { driverId: "d2", date: "2026-01-01", status: "present" }, // different driver
  ];

  test("counts each status for the given driver and month only", () => {
    const summary = calcAttendanceSummary(records, "d1", "2026-01");
    expect(summary).toEqual({ present: 1, absent: 1, late: 1, half: 1, total: 4 });
  });

  test("returns all zeros when nothing matches", () => {
    const summary = calcAttendanceSummary(records, "d1", "2026-03");
    expect(summary).toEqual({ present: 0, absent: 0, late: 0, half: 0, total: 0 });
  });
});
