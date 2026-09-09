// src/utils/salaryCalculations.test.js
import {
  calcMonthlySalary,
  getMonthEntries,
  calcOutstandingAdvances,
  calcTotalSalariesPaid,
  calcDailyRate,
  calcAttendanceSummary,
} from "./salaryCalculations";
import { SALARY_ENTRY_TYPES, MAX_MONEY_VALUE } from "../config/constants";

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

// ─── Boundary values ────────────────────────────────────────────────────────

describe("calcMonthlySalary — boundary values", () => {
  test("handles a MAX_MONEY_VALUE-scale bonus without losing precision", () => {
    const entries = [
      { type: SALARY_ENTRY_TYPES.BASE, amount: 0 },
      { type: SALARY_ENTRY_TYPES.BONUS, amount: MAX_MONEY_VALUE },
    ];
    const result = calcMonthlySalary(entries);
    expect(result.gross).toBe(MAX_MONEY_VALUE);
  });

  // Deduction + advance + advance-repayment together in the same month —
  // the exact combined scenario the SC-2026-9114 review asked to confirm.
  test("net salary is correct when deduction, advance and advance-repayment all land in the same month", () => {
    const entries = [
      { type: SALARY_ENTRY_TYPES.BASE, amount: 3000 },
      { type: SALARY_ENTRY_TYPES.DEDUCTION, amount: 200 },   // e.g. absence
      { type: SALARY_ENTRY_TYPES.ADVANCE, amount: 1000 },    // new advance taken
      { type: SALARY_ENTRY_TYPES.ADVANCE_REPAY, amount: 500 }, // repaying an older advance
    ];
    const result = calcMonthlySalary(entries);
    // net = gross(3000) - deductions(200) - advanceRepayments(500)
    // the new advance itself does NOT reduce this month's net pay — it's
    // money already handed out, tracked separately via calcOutstandingAdvances
    expect(result.net).toBe(2300);
    expect(result.advances).toBe(1000);
  });

  test("net salary can go negative when deductions/repayments exceed gross pay", () => {
    const entries = [
      { type: SALARY_ENTRY_TYPES.BASE, amount: 500 },
      { type: SALARY_ENTRY_TYPES.ADVANCE_REPAY, amount: 800 },
    ];
    const result = calcMonthlySalary(entries);
    expect(result.net).toBe(-300);
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
  test("nets BASE/BONUS against DEDUCTION/ADVANCE_REPAY; excludes ADVANCE", () => {
    const entries = [
      { driverId: "d1", type: SALARY_ENTRY_TYPES.BASE, amount: 3000 },
      { driverId: "d2", type: SALARY_ENTRY_TYPES.BONUS, amount: 500 },
      { driverId: "d1", type: SALARY_ENTRY_TYPES.ADVANCE, amount: 1000 }, // excluded (debt, not expense)
      { driverId: "d1", type: SALARY_ENTRY_TYPES.DEDUCTION, amount: 200 }, // now subtracted
      { driverId: "d2", type: SALARY_ENTRY_TYPES.ADVANCE_REPAY, amount: 300 }, // now subtracted
    ];
    // 3000 + 500 - 200 - 300 = 3000
    expect(calcTotalSalariesPaid(entries)).toBe(3000);
  });

  test("applies each driver's default base salary when no BASE entry was logged that month (bug regression)", () => {
    // d1's base salary is never logged as an explicit entry (relies on the
    // driver's default salary), but a deduction was logged for them this
    // month. Without grouping + default-base fallback, this used to sum to
    // -300 for d1 alone, flipping the sign and inflating "net profit".
    const entries = [
      { driverId: "d1", type: SALARY_ENTRY_TYPES.DEDUCTION, amount: 300, date: "2026-06-05" },
    ];
    const drivers = [{ id: "d1", salary: 3000 }];
    // 3000 (default base) - 300 (deduction) = 2700, never negative.
    expect(calcTotalSalariesPaid(entries, drivers)).toBe(2700);
  });

  test("without a drivers list, falls back to raw entries (defaultBase 0) — same as before", () => {
    const entries = [
      { driverId: "d1", type: SALARY_ENTRY_TYPES.DEDUCTION, amount: 300, date: "2026-06-05" },
    ];
    expect(calcTotalSalariesPaid(entries)).toBe(-300);
  });

  test("keeps different drivers/months in separate buckets", () => {
    const entries = [
      { driverId: "d1", type: SALARY_ENTRY_TYPES.BASE, amount: 3000, date: "2026-05-01" },
      { driverId: "d1", type: SALARY_ENTRY_TYPES.DEDUCTION, amount: 300, date: "2026-06-05" }, // different month, no BASE
    ];
    const drivers = [{ id: "d1", salary: 3000 }];
    // May: 3000 (explicit BASE). June: 3000 (default) - 300 = 2700.
    expect(calcTotalSalariesPaid(entries, drivers)).toBe(3000 + 2700);
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
