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

  // الفاتورة بتدخل في صافي الربح على أساس نقدي (cash basis): اللي بيتخصم
  // هو اللي اتدفع فعليًا للمورد لحد دلوقتي (totalPayable = المتبقي، يعني
  // إجمالي الفاتورة ناقص أي دفعات)، مش إجمالي الفاتورة الأصلي. لو دفعت
  // نص الفاتورة، نص التكلفة بس اللي بيتخصم من الربح — ونفس الرقم ده هو
  // اللي بيظهر في تنبيه "مستحقات عليك للموردين" وفي "صافي وضعك المالي"،
  // عشان الرقم يبقى واحد متسق في كل الصفحة مش رقمين مختلفين لنفس الحاجة.
  const supplierStats = useMemo(
    () => aggregateSupplierInvoices(supplierInvoices, supplierPayments),
    [supplierInvoices, supplierPayments]
  );
  const totalSupplierPayable = supplierStats.totalPayable;

  const netProfit = totals.netProfit - totalMaintCost - totalSalaries - totalTaxDeductions - totalSupplierPayable;

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
    totalSupplierPayable,
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
