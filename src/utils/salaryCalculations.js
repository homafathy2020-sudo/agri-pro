// src/utils/salaryCalculations.js
import { SALARY_ENTRY_TYPES } from "../config/constants";

/**
 * Calculate net salary for a driver in a specific month.
 * entries = all salary entries for that driver in that month
 */
export const calcMonthlySalary = (entries, defaultBase = 0) => {
  let base      = 0;
  let bonuses   = 0;
  let deductions = 0;
  let advances  = 0;
  let advanceRepayments = 0;
  let hasBaseEntry = false;

  entries.forEach((e) => {
    const amount = Number(e.amount) || 0;
    switch (e.type) {
      case SALARY_ENTRY_TYPES.BASE:          base += amount; hasBaseEntry = true; break;
      case SALARY_ENTRY_TYPES.BONUS:         bonuses          += amount; break;
      case SALARY_ENTRY_TYPES.DEDUCTION:     deductions       += amount; break;
      case SALARY_ENTRY_TYPES.ADVANCE:       advances         += amount; break;
      case SALARY_ENTRY_TYPES.ADVANCE_REPAY: advanceRepayments += amount; break;
      default: break;
    }
  });

  // إذا لم يُسجَّل قيد "راتب أساسي" لهذا الشهر بعد، استخدم الراتب الأساسي
  // المُحدَّد في بيانات السائق نفسه، عشان القيمة تتطابق دايمًا مع كارت
  // "الراتب الأساسي" فوق وميظهرش صفر.
  if (!hasBaseEntry) base = Number(defaultBase) || 0;

  const gross = base + bonuses;
  const net   = gross - deductions - advanceRepayments;

  return { base, bonuses, deductions, advances, advanceRepayments, gross, net };
};

/**
 * Get all salary entries for a driver in a specific month (YYYY-MM).
 */
export const getMonthEntries = (allEntries, driverId, yearMonth) =>
  allEntries.filter(
    (e) => e.driverId === driverId && (e.date || "").startsWith(yearMonth)
  );

/**
 * Total outstanding advances for a driver (advances - repayments).
 */
export const calcOutstandingAdvances = (allEntries, driverId) => {
  const driverEntries = allEntries.filter((e) => e.driverId === driverId);
  const totalAdvances = driverEntries
    .filter((e) => e.type === SALARY_ENTRY_TYPES.ADVANCE)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalRepaid = driverEntries
    .filter((e) => e.type === SALARY_ENTRY_TYPES.ADVANCE_REPAY)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  return Math.max(0, totalAdvances - totalRepaid);
};

/**
 * Total salary paid to ALL drivers (for profit deduction).
 * Net cost = base + bonus - deductions - advanceRepayments, computed the
 * SAME way as calcMonthlySalary (grouped per driver per month, applying
 * each driver's default base salary when a month has no explicit BASE
 * entry). Without this grouping, a driver whose base is never logged
 * explicitly but who has a deduction/advance-repayment entry that month
 * would contribute a bare negative number with nothing to net it against,
 * which flips the sign of "مرتبات الفريق" and — because it's subtracted
 * from profit — makes net profit look artificially higher.
 *
 * `drivers` is optional (defaults to []) for backward-compat with existing
 * callers; without it, default-base fallback simply won't apply (same as
 * calcMonthlySalary with defaultBase = 0).
 */
export const calcTotalSalariesPaid = (allEntries, drivers = []) => {
  const driverById = new Map(drivers.map((d) => [d.id, d]));

  // Group entries by driver + month, same unit calcMonthlySalary works on.
  const groups = new Map();
  allEntries.forEach((e) => {
    const yearMonth = (e.date || "").slice(0, 7) || "_nodate";
    const key = `${e.driverId}|${yearMonth}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  });

  let total = 0;
  groups.forEach((entries, key) => {
    const driverId = key.split("|")[0];
    const defaultBase = driverById.get(driverId)?.salary || 0;
    total += calcMonthlySalary(entries, defaultBase).net;
  });
  return total;
};

/**
 * Absence deduction per day based on base salary and working days.
 */
export const calcDailyRate = (monthlySalary, workingDaysPerMonth = 26) =>
  monthlySalary / workingDaysPerMonth;

/**
 * Attendance summary for a driver in a month.
 */
export const calcAttendanceSummary = (attendanceRecords, driverId, yearMonth) => {
  const records = attendanceRecords.filter(
    (r) => r.driverId === driverId && (r.date || "").startsWith(yearMonth)
  );
  const present  = records.filter((r) => r.status === "present").length;
  const absent   = records.filter((r) => r.status === "absent").length;
  const late     = records.filter((r) => r.status === "late").length;
  const half     = records.filter((r) => r.status === "half").length;
  return { present, absent, late, half, total: records.length };
};
