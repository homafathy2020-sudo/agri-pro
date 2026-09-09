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
import { calcTotalTaxDeductions } from "../utils/taxCalculations";

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
    () => calcTotalSalariesPaid(salaryEntries, drivers),
    [salaryEntries, drivers]
  );

  const totalTaxDeductions = useMemo(
    () => calcTotalTaxDeductions(taxDeductions),
    [taxDeductions]
  );

  // الفاتورة بتدخل في صافي الربح على أساس نقدي (cash basis): اللي بيتخصم
  // هو "الواصل للمورد" فعلاً لحد دلوقتي (totalPaidOut) — يعني الكاش اللي
  // فعلاً خرج من جيبك. لو دفعت نص الفاتورة، نص التكلفة بس اللي بيتخصم من
  // الربح، ولما تكمّل السداد يتخصم الباقي. ده عكس totalPayable (المتبقي
  // غير المدفوع)، واللي معروض لوحده كـ"دين عليك" في تنبيه "مستحقات عليك
  // للموردين" وفي "صافي وضعك المالي" — مينفعش يتخصم من الربح، لأن ده كان
  // معناه إن سداد المورد بيزوّد ربحك الظاهري بدل ما يقلله (باگ سابق).
  const supplierStats = useMemo(
    () => aggregateSupplierInvoices(supplierInvoices, supplierPayments),
    [supplierInvoices, supplierPayments]
  );
  const totalSupplierPaidOut = supplierStats.totalPaidOut;

  const netProfit = totals.netProfit - totalMaintCost - totalSalaries - totalTaxDeductions - totalSupplierPaidOut;

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
    totalSupplierPaidOut,
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
