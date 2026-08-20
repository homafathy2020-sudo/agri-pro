// src/hooks/useClients.js
import { useMemo, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import { calcRevenue, calcRemainingAmount, derivePaymentStatus, getJobPaidAmount } from "../utils/calculations";

export const useClients = () => {
  const { jobs, payments, loading } = useData();

  const clients = useMemo(() => {
    const map = {};
    jobs.forEach((job) => {
      const name = job.client;
      if (!name) return;
      if (!map[name]) map[name] = { client:name, ops:0, totalRevenue:0, totalAcres:0, totalPaid:0, totalRemaining:0 };
      const revenue   = calcRevenue(job.acres, job.pricePerAcre);
      const paid      = getJobPaidAmount(job, payments);
      const remaining = calcRemainingAmount(revenue, paid);
      map[name].ops            += 1;
      map[name].totalRevenue   += revenue;
      map[name].totalAcres     += Number(job.acres) || 0;
      map[name].totalPaid      += paid;
      map[name].totalRemaining += remaining;
    });
    return Object.values(map).sort((a, b) => b.totalRemaining - a.totalRemaining);
  }, [jobs, payments]);

  const totalDebt = useMemo(
    () => clients.reduce((s, c) => s + c.totalRemaining, 0),
    [clients]
  );

  const getClientSummary = useCallback((clientName) => {
    const clientJobs = jobs.filter((j) => j.client === clientName);
    const summary = { client:clientName, ops:clientJobs.length, jobs:[], totalRevenue:0, totalPaid:0, totalRemaining:0 };
    clientJobs.forEach((job) => {
      const revenue   = calcRevenue(job.acres, job.pricePerAcre);
      const paid      = getJobPaidAmount(job, payments);
      const remaining = calcRemainingAmount(revenue, paid);
      const status    = derivePaymentStatus(revenue, paid);
      summary.totalRevenue   += revenue;
      summary.totalPaid      += paid;
      summary.totalRemaining += remaining;
      summary.jobs.push({ ...job, revenue, amountPaid:paid, remainingAmount:remaining, paymentStatus:status });
    });
    return summary;
  }, [jobs, payments]);

  return { clients, totalDebt, loading, getClientSummary };
};
