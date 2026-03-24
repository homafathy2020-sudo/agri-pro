// src/hooks/useEquipment.js
import { useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { buildEquipmentReport } from "../utils/calculations";

/**
 * Provides equipment list enriched with computed stats.
 */
export const useEquipment = () => {
  const { equipment, jobs, maintenance, settings, loading,
          addEquipment, updateEquipment, deleteEquipment } = useData();

  const report = useMemo(
    () => buildEquipmentReport(equipment, jobs, maintenance, settings.fuelPrice),
    [equipment, jobs, maintenance, settings.fuelPrice]
  );

  const getById = (id) => equipment.find((e) => e.id === id);

  return {
    equipment,
    report,
    loading,
    getById,
    addEquipment,
    updateEquipment,
    deleteEquipment,
  };
};
