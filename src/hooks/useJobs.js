// src/hooks/useJobs.js
import { useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import {
  aggregateJobs, calcRevenue, calcFuelCost,
  calcRemainingAmount, derivePaymentStatus, getJobPaidAmount,
} from "../utils/calculations";

export const useJobs = () => {
  const { jobs, payments, settings, loading, addJob, updateJob, deleteJob } = useData();

  const [filters, setFilters] = useState({
    equipmentId:"", driverId:"", workType:"",
    dateFrom:"", dateTo:"", paymentStatus:"",
  });

  const enrichJob = (job) => {
    const revenue         = calcRevenue(job.acres, job.pricePerAcre);
    const fuelCost        = calcFuelCost(job.fuelUsed, settings.fuelPrice);
    const profit           = revenue - fuelCost;
    const amountPaid       = getJobPaidAmount(job, payments);
    const remainingAmount = calcRemainingAmount(revenue, amountPaid);
    const paymentStatus   = derivePaymentStatus(revenue, amountPaid);
    return { ...job, revenue, fuelCost, profit, amountPaid, remainingAmount, paymentStatus };
  };

  const filtered = useMemo(() => {
    return jobs
      .filter((j) => {
        if (filters.equipmentId && j.equipmentId !== filters.equipmentId) return false;
        if (filters.driverId    && j.driverId    !== filters.driverId)    return false;
        if (filters.workType    && j.workType    !== filters.workType)    return false;
        if (filters.dateFrom    && j.date        <  filters.dateFrom)     return false;
        if (filters.dateTo      && j.date        >  filters.dateTo)       return false;
        if (filters.paymentStatus) {
          const rev    = calcRevenue(j.acres, j.pricePerAcre);
          const paid   = getJobPaidAmount(j, payments);
          const status = derivePaymentStatus(rev, paid);
          if (status !== filters.paymentStatus) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [jobs, filters, payments]);

  const totals = useMemo(
    () => aggregateJobs(filtered, settings.fuelPrice, payments),
    [filtered, settings.fuelPrice, payments]
  );

  const clearFilters = () =>
    setFilters({ equipmentId:"", driverId:"", workType:"", dateFrom:"", dateTo:"", paymentStatus:"" });

  return {
    jobs: filtered.map(enrichJob),
    allJobs: jobs,
    totals, filters, setFilters, clearFilters,
    hasActiveFilters: Object.values(filters).some(Boolean),
    loading,
    addJob, updateJob, deleteJob,
    fuelPrice: settings.fuelPrice,
  };
};
