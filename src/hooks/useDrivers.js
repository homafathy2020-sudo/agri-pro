// src/hooks/useDrivers.js
import { useMemo, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import { buildDriverReport } from "../utils/calculations";
import { calcOutstandingAdvances, getMonthEntries } from "../utils/salaryCalculations";
import { SALARY_ENTRY_TYPES, DRIVER_STATUS } from "../config/constants";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const useDrivers = () => {
  const {
    drivers, jobs, payments, settings,
    salaryEntries = [], attendance = [], equipment = [],
    loading, addDriver, updateDriver, deleteDriver,
  } = useData();

  const currentMonth = useMemo(getCurrentMonth, []);

  // Full report: job stats (ops/acres/revenue) + salary status + equipment,
  // all in one place so the drivers list can show everything at a glance.
  const report = useMemo(() => {
    const base = buildDriverReport(drivers, jobs, settings.fuelPrice, payments);
    return base.map((drv) => {
      const status = drv.status === DRIVER_STATUS.INACTIVE ? DRIVER_STATUS.INACTIVE : DRIVER_STATUS.ACTIVE;
      const outstandingAdvance = calcOutstandingAdvances(salaryEntries, drv.id);

      const monthEntries = getMonthEntries(salaryEntries, drv.id, currentMonth);
      const baseEntriesThisMonth = monthEntries.filter((e) => e.type === SALARY_ENTRY_TYPES.BASE);
      const unpaidThisMonth = (drv.salary > 0)
        && (baseEntriesThisMonth.length === 0 || baseEntriesThisMonth.some((e) => !e.paid));

      const assignedEquipment = equipment
        .filter((eq) => eq.driverId === drv.id)
        .map((eq) => eq.name);

      return { ...drv, status, outstandingAdvance, unpaidThisMonth, assignedEquipment };
    });
  }, [drivers, jobs, settings.fuelPrice, payments, salaryEntries, equipment, currentMonth]);

  const getById = (id) => drivers.find((d) => d.id === id);

  /** Counts of records tied to a driver — used to warn before deleting. */
  const getDriverDependencyCounts = useCallback((driverId) => ({
    jobs:          jobs.filter((j) => j.driverId === driverId).length,
    salaryEntries: salaryEntries.filter((e) => e.driverId === driverId).length,
    attendance:    attendance.filter((a) => a.driverId === driverId).length,
  }), [jobs, salaryEntries, attendance]);

  return {
    drivers,
    report,
    loading,
    getById,
    getDriverDependencyCounts,
    addDriver,
    updateDriver,
    deleteDriver,
  };
};
