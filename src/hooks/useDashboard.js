// src/hooks/useDashboard.js
import { useMemo } from "react";
import { useData } from "../contexts/DataContext";
import {
  aggregateJobs,
  buildDailyRevenue,
  groupByWorkType,
  buildEquipmentReport,
  aggregateSupplierInvoices,
} from "../utils/calculations";
import { calcTotalSalariesPaid } from "../utils/salaryCalculations";

export const useDashboard = () => {
  const {
    jobs, equipment, maintenance, drivers, payments = [],
    supplierInvoices = [], supplierPayments = [],
    settings, salaryEntries = [], taxDeductions = [], loading,
  } = useData();

  const fuelPrice = settings.fuelPrice;

  const totals = useMemo(
    () => aggregateJobs(jobs, fuelPrice, payments),
    [jobs, fuelPrice, payments]
  );

  const totalMaintCost = useMemo(
    () => maintenance.reduce((s, m) => s + (Number(m.cost) || 0), 0),
    [maintenance]
  );

  const totalSalaries = useMemo(
    () => calcTotalSalariesPaid(salaryEntries),
    [salaryEntries]
  );

  const totalTaxDeductions = useMemo(
    () => taxDeductions.reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [taxDeductions]
  );

  // الفاتورة بتدخل في صافي الربح فورًا وقت تسجيلها (استحقاق)، بغض النظر
  // إنها اتدفعت للمورد ولا لسه — بالظبط زي ما إيراد العميل بيتحسب فور
  // تسجيل الـ job، مش وقت ما العميل يدفع فعليًا. متابعة "المدفوع فعليًا"
  // (totalPayable) منفصلة تمامًا وموجودة في useSuppliers، وده رقم
  // تدفقات نقدية (cash flow) مش ربحية.
  const supplierStats = useMemo(
    () => aggregateSupplierInvoices(supplierInvoices, supplierPayments),
    [supplierInvoices, supplierPayments]
  );
  const totalSupplierInvoiced = supplierStats.totalInvoiced;

  const netProfit = totals.netProfit - totalMaintCost - totalSalaries - totalTaxDeductions - totalSupplierInvoiced;

  const margin = totals.totalRevenue > 0
    ? (netProfit / totals.totalRevenue) * 100
    : 0;

  const dailyRevenue      = useMemo(() => buildDailyRevenue(jobs, 7), [jobs]);
  const workTypeBreakdown = useMemo(() => groupByWorkType(jobs), [jobs]);

  const equipReport = useMemo(
    () => buildEquipmentReport(equipment, jobs, maintenance, fuelPrice, payments),
    [equipment, jobs, maintenance, fuelPrice, payments]
  );

  const bestEquipment = equipReport[0] ?? null;

  const recentJobs = useMemo(
    () => [...jobs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [jobs]
  );

  const miniRevenue = dailyRevenue.map((d) => d.revenue);

  return {
    totals,
    totalMaintCost,
    totalSalaries,
    totalTaxDeductions,
    totalSupplierInvoiced,
    netProfit,
    margin,
    dailyRevenue,
    workTypeBreakdown,
    equipReport,
    bestEquipment,
    recentJobs,
    miniRevenue,
    equipment,
    drivers,
    payments,
    fuelPrice,
    loading,
  };
};
