// src/hooks/useDriverCosts.js
import { useMemo, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import { buildDriverReportWithCosts } from "../utils/calculations";

export const useDriverCosts = () => {
  const {
    driverCosts, drivers, jobs, settings,
    addDriverCost, updateDriverCost, deleteDriverCost,
    loading,
  } = useData();

  /** Full driver report including costs */
  const driverReport = useMemo(
    () => buildDriverReportWithCosts(drivers, jobs, driverCosts, settings.fuelPrice),
    [drivers, jobs, driverCosts, settings.fuelPrice]
  );

  /** Costs for a specific driver, sorted newest first */
  const getCostsForDriver = useCallback(
    (driverId) => driverCosts
      .filter((c) => c.driverId === driverId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [driverCosts]
  );

  /** Month-filtered costs for payroll summary */
  const getCostsForMonth = useCallback(
    (driverId, year, month) => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      return driverCosts.filter(
        (c) => c.driverId === driverId && c.date?.startsWith(prefix)
      );
    },
    [driverCosts]
  );

  /** Total costs for a driver this month */
  const getMonthlyTotal = useCallback(
    (driverId) => {
      const now    = new Date();
      const costs  = getCostsForMonth(driverId, now.getFullYear(), now.getMonth() + 1);
      return costs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    },
    [getCostsForMonth]
  );

  return {
    driverCosts,
    driverReport,
    loading,
    getCostsForDriver,
    getCostsForMonth,
    getMonthlyTotal,
    addDriverCost,
    updateDriverCost,
    deleteDriverCost,
  };
};
