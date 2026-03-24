// src/hooks/useMaintenance.js
import { useMemo } from "react";
import { useData } from "../contexts/DataContext";

export const useMaintenance = () => {
  const { maintenance, equipment, loading,
          addMaintenance, updateMaintenance, deleteMaintenance } = useData();

  /** Group maintenance records by equipment, sorted by date desc */
  const byEquipment = useMemo(() => {
    return equipment
      .map((eq) => {
        const records = maintenance
          .filter((m) => m.equipmentId === eq.id)
          .sort((a, b) => b.date.localeCompare(a.date));
        const totalCost = records.reduce((s, m) => s + (Number(m.cost) || 0), 0);
        return { equipment: eq, records, totalCost };
      })
      .filter((g) => g.records.length > 0)
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [maintenance, equipment]);

  const totalCost = useMemo(
    () => maintenance.reduce((s, m) => s + (Number(m.cost) || 0), 0),
    [maintenance]
  );

  return {
    maintenance,
    byEquipment,
    totalCost,
    loading,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
  };
};
