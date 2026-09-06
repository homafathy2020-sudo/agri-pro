// src/hooks/useCustody.js
import { useMemo, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import {
  calcCustodyBalance,
  calcExpensesByCategory,
  getCustodyTransactionsForMonth,
} from "../utils/custodyCalculations";

export const useCustody = () => {
  const {
    custody, drivers, equipment,
    addCustody, updateCustody, deleteCustody,
    loading,
  } = useData();

  /** Transactions sorted newest first (service already sorts, but keep safe) */
  const transactions = useMemo(
    () => [...custody].sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [custody]
  );

  /** الرصيد المتبقي من العهدة + إجمالي الإيداع/الصرف + هل الرصيد سالب */
  const { totalDeposits, totalExpenses, balance, isOverdrawn } = useMemo(
    () => calcCustodyBalance(custody),
    [custody]
  );

  /** إجمالي المصروفات مجمّعة حسب التصنيف (ميكنة / سائقين / أخرى) */
  const expensesByCategory = useMemo(
    () => calcExpensesByCategory(custody),
    [custody]
  );

  /** اسم المعدة/السائق المرتبط بالمصروف، إن وجد */
  const getLinkedName = useCallback(
    (t) => {
      if (t.equipmentId) return equipment.find((e) => e.id === t.equipmentId)?.name || null;
      if (t.driverId)    return drivers.find((d) => d.id === t.driverId)?.name || null;
      return null;
    },
    [equipment, drivers]
  );

  /** معاملات شهر معيّن */
  const getTransactionsForMonth = useCallback(
    (year, month) => getCustodyTransactionsForMonth(custody, year, month),
    [custody]
  );

  return {
    transactions,
    totalDeposits,
    totalExpenses,
    balance,
    isOverdrawn,
    expensesByCategory,
    getLinkedName,
    getTransactionsForMonth,
    loading,
    addCustody,
    updateCustody,
    deleteCustody,
  };
};
