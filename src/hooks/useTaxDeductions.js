// src/hooks/useTaxDeductions.js
import { useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { calcTotalTaxDeductions, calcTaxDeductionsByType } from "../utils/taxCalculations";

export const useTaxDeductions = () => {
  const {
    taxDeductions, loading,
    addTaxDeduction, updateTaxDeduction, deleteTaxDeduction,
  } = useData();

  /** الحركات مرتّبة الأحدث أولاً (الـ service بيرتّبها أصلاً، ده احتياط) */
  const entries = useMemo(
    () => [...taxDeductions].sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [taxDeductions]
  );

  /** إجمالي كل الضرائب والخصومات — البند اللي بيتخصم من صافي الربح */
  const total = useMemo(
    () => calcTotalTaxDeductions(taxDeductions),
    [taxDeductions]
  );

  /** الإجمالي مجمّع حسب النوع (ضريبة / رسوم حكومية / غرامة / أخرى) */
  const totalByType = useMemo(
    () => calcTaxDeductionsByType(taxDeductions),
    [taxDeductions]
  );

  return {
    entries,
    total,
    totalByType,
    loading,
    addTaxDeduction,
    updateTaxDeduction,
    deleteTaxDeduction,
  };
};
