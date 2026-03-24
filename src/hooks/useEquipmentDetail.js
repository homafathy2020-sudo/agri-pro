// src/hooks/useEquipmentDetail.js
import { useMemo } from "react";
import { useData } from "../contexts/DataContext";
import {
  calcRevenue, calcFuelCost,
  calcRemainingAmount, derivePaymentStatus,
} from "../utils/calculations";

export const useEquipmentDetail = (equipmentId) => {
  const { equipment, jobs, maintenance, settings, loading } = useData();

  const eq = equipment.find((e) => e.id === equipmentId);

  const eqJobs = useMemo(
    () => jobs
      .filter((j) => j.equipmentId === equipmentId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((job) => {
        const revenue         = calcRevenue(job.acres, job.pricePerAcre);
        const fuelCost        = calcFuelCost(job.fuelUsed, settings.fuelPrice);
        const profit          = revenue - fuelCost;
        const amountPaid      = Number(job.amountPaid) || 0;
        const remainingAmount = calcRemainingAmount(revenue, amountPaid);
        const paymentStatus   = derivePaymentStatus(revenue, amountPaid);
        return { ...job, revenue, fuelCost, profit, amountPaid, remainingAmount, paymentStatus };
      }),
    [jobs, equipmentId, settings.fuelPrice]
  );

  const eqMaint = useMemo(
    () => maintenance
      .filter((m) => m.equipmentId === equipmentId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [maintenance, equipmentId]
  );

  const stats = useMemo(() => {
    const totalRevenue   = eqJobs.reduce((s, j) => s + j.revenue, 0);
    const totalAcres     = eqJobs.reduce((s, j) => s + (Number(j.acres) || 0), 0);
    const totalFuel      = eqJobs.reduce((s, j) => s + (Number(j.fuelUsed) || 0), 0);
    const totalFuelCost  = eqJobs.reduce((s, j) => s + j.fuelCost, 0);
    const totalPaid      = eqJobs.reduce((s, j) => s + j.amountPaid, 0);
    const totalRemaining = eqJobs.reduce((s, j) => s + j.remainingAmount, 0);
    return { totalRevenue, totalAcres, totalFuel, totalFuelCost, totalPaid, totalRemaining };
  }, [eqJobs]);

  const maintCost = useMemo(
    () => eqMaint.reduce((s, m) => s + (Number(m.cost) || 0), 0),
    [eqMaint]
  );

  const netProfit = stats.totalRevenue - stats.totalFuelCost - maintCost;
  const margin    = stats.totalRevenue > 0 ? (netProfit / stats.totalRevenue) * 100 : 0;

  return {
    equipment: eq,
    jobs: eqJobs,
    maintenance: eqMaint,
    stats, maintCost, netProfit, margin,
    fuelPrice: settings.fuelPrice,
    loading,
  };
};
