// src/hooks/useCustody.js
import { useMemo, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import { CUSTODY_TYPES } from "../config/constants";

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

  const totalDeposits = useMemo(
    () => custody
      .filter((c) => c.type === CUSTODY_TYPES.DEPOSIT)
      .reduce((s, c) => s + (Number(c.amount) || 0), 0),
    [custody]
  );

  const totalExpenses = useMemo(
    () => custody
      .filter((c) => c.type === CUSTODY_TYPES.EXPENSE)
      .reduce((s, c) => s + (Number(c.amount) || 0), 0),
    [custody]
  );

  /** الرصيد المتبقي من العهدة */
  const balance = totalDeposits - totalExpenses;

  const isOverdrawn = balance < 0;

  /** إجمالي المصروفات مجمّعة حسب التصنيف (ميكنة / سائقين / أخرى) */
  const expensesByCategory = useMemo(() => {
    const map = {};
    custody
      .filter((c) => c.type === CUSTODY_TYPES.EXPENSE)
      .forEach((c) => {
        const key = c.category || "other";
        map[key] = (map[key] || 0) + (Number(c.amount) || 0);
      });
    return map;
  }, [custody]);

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
    (year, month) => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      return custody.filter((c) => c.date?.startsWith(prefix));
    },
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
