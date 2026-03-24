// src/hooks/usePayments.js
import { useMemo, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import { calcRevenue, calcRemainingAmount, derivePaymentStatus } from "../utils/calculations";

/**
 * Returns payments enriched with job context.
 * Provides helpers to get payments per job and update them.
 */
export const usePayments = () => {
  const {
    payments, jobs, settings,
    addPayment, updatePayment, deletePayment,
    loading,
  } = useData();

  const fuelPrice = settings.fuelPrice;

  /** All payments for a specific job, sorted newest first */
  const getPaymentsForJob = useCallback(
    (jobId) => payments.filter((p) => p.jobId === jobId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [payments]
  );

  /** Full payment summary for a job */
  const getJobPaymentSummary = useCallback(
    (job) => {
      const revenue    = calcRevenue(job.acres, job.pricePerAcre);
      const jobPayments = getPaymentsForJob(job.id);
      const totalPaid  = jobPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const remaining  = calcRemainingAmount(revenue, totalPaid);
      const status     = derivePaymentStatus(revenue, totalPaid);
      return { revenue, totalPaid, remaining, status, payments: jobPayments };
    },
    [getPaymentsForJob]
  );

  /** Total outstanding debt across all jobs */
  const totalDebt = useMemo(() => {
    return jobs.reduce((s, job) => {
      const { remaining } = getJobPaymentSummary(job);
      return s + remaining;
    }, 0);
  }, [jobs, getJobPaymentSummary]);

  /** All jobs that still have unpaid balance */
  const unpaidJobs = useMemo(() => {
    return jobs
      .map((job) => ({ job, ...getJobPaymentSummary(job) }))
      .filter(({ remaining }) => remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);
  }, [jobs, getJobPaymentSummary]);

  return {
    payments,
    loading,
    totalDebt,
    unpaidJobs,
    getPaymentsForJob,
    getJobPaymentSummary,
    addPayment,
    updatePayment,
    deletePayment,
  };
};
