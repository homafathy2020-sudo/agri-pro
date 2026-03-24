// src/hooks/useSalary.js
import { useMemo, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import {
  calcMonthlySalary,
  calcOutstandingAdvances,
  calcTotalSalariesPaid,
  getMonthEntries,
  calcAttendanceSummary,
} from "../utils/salaryCalculations";

export const useSalary = () => {
  const {
    salaryEntries = [],
    attendance    = [],
    drivers,
    addSalaryEntry, updateSalaryEntry, deleteSalaryEntry,
    addAttendance,  updateAttendance,  deleteAttendance,
    loading,
  } = useData();

  // ── Per driver ──────────────────────────────────────────────────────────────

  const getDriverEntries = useCallback(
    (driverId) => salaryEntries.filter((e) => e.driverId === driverId),
    [salaryEntries]
  );

  const getMonthSummary = useCallback(
    (driverId, yearMonth) => {
      const entries = getMonthEntries(salaryEntries, driverId, yearMonth);
      return { ...calcMonthlySalary(entries), entries };
    },
    [salaryEntries]
  );

  const getOutstandingAdvances = useCallback(
    (driverId) => calcOutstandingAdvances(salaryEntries, driverId),
    [salaryEntries]
  );

  const getAttendanceSummary = useCallback(
    (driverId, yearMonth) => calcAttendanceSummary(attendance, driverId, yearMonth),
    [attendance]
  );

  const getDriverAttendance = useCallback(
    (driverId) => attendance
      .filter((r) => r.driverId === driverId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [attendance]
  );

  // ── Global ──────────────────────────────────────────────────────────────────

  /** Total salaries paid — used to deduct from overall profit */
  const totalSalariesPaid = useMemo(
    () => calcTotalSalariesPaid(salaryEntries),
    [salaryEntries]
  );

  /** Current month salary summary per driver */
  const now          = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const currentMonthPayroll = useMemo(() =>
    drivers.map((drv) => {
      const summary   = getMonthSummary(drv.id, currentMonth);
      const advances  = getOutstandingAdvances(drv.id);
      const attend    = getAttendanceSummary(drv.id, currentMonth);
      return { driver: drv, ...summary, outstandingAdvances: advances, attendance: attend };
    }),
    [drivers, currentMonth, getMonthSummary, getOutstandingAdvances, getAttendanceSummary]
  );

  return {
    salaryEntries,
    attendance,
    totalSalariesPaid,
    currentMonthPayroll,
    currentMonth,
    loading,
    getDriverEntries,
    getMonthSummary,
    getOutstandingAdvances,
    getAttendanceSummary,
    getDriverAttendance,
    addSalaryEntry,    updateSalaryEntry,    deleteSalaryEntry,
    addAttendance,     updateAttendance,     deleteAttendance,
  };
};
