// src/hooks/useDrivers.js
import { useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { buildDriverReport } from "../utils/calculations";

export const useDrivers = () => {
  const { drivers, jobs, settings, loading,
          addDriver, updateDriver, deleteDriver } = useData();

  const report = useMemo(
    () => buildDriverReport(drivers, jobs, settings.fuelPrice),
    [drivers, jobs, settings.fuelPrice]
  );

  const getById = (id) => drivers.find((d) => d.id === id);

  return {
    drivers,
    report,
    loading,
    getById,
    addDriver,
    updateDriver,
    deleteDriver,
  };
};
