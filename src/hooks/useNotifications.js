// src/hooks/useNotifications.js
import { useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { checkMaintenanceDue, checkOverdueDebts } from "../utils/calculations";

/**
 * Derives all active alerts from existing data — no extra Firestore reads.
 * Returns sorted list of notifications with type, severity, and action info.
 */
export const useNotifications = () => {
  const { equipment, maintenance, jobs, settings, loading } = useData();

  const maintenanceAlerts = useMemo(
    () => checkMaintenanceDue(equipment, maintenance, 14),
    [equipment, maintenance]
  );

  const debtAlerts = useMemo(
    () => checkOverdueDebts(jobs, settings.fuelPrice, 30),
    [jobs, settings.fuelPrice]
  );

  const notifications = useMemo(() => {
    const list = [];

    // Maintenance alerts
    maintenanceAlerts.forEach(({ equipment: eq, daysLeft, isOverdue }) => {
      list.push({
        id:       `maint-${eq.id}`,
        type:     "maintenance_due",
        severity: isOverdue ? "high" : "medium",
        title:    isOverdue
          ? `${eq.name} — تجاوز موعد الصيانة`
          : `${eq.name} — موعد الصيانة قريب`,
        body: isOverdue
          ? `تأخر الصيانة بـ ${Math.abs(daysLeft)} يوم`
          : `باقي ${daysLeft} يوم للصيانة`,
        equipmentId: eq.id,
        actionLabel: "عرض المعدة",
        actionPath:  `/equipment/${eq.id}`,
      });
    });

    // Debt alerts
    debtAlerts.forEach(({ job, remaining, daysDiff }) => {
      list.push({
        id:       `debt-${job.id}`,
        type:     "debt_overdue",
        severity: daysDiff > 60 ? "high" : "medium",
        title:    `${job.client} — مستحق متأخر`,
        body:     `${remaining.toLocaleString("ar-EG")} ج.م متأخر منذ ${daysDiff} يوم`,
        jobId:    job.id,
        client:   job.client,
        remaining,
        actionLabel: "عرض العميل",
        actionPath:  `/clients/${encodeURIComponent(job.client)}`,
      });
    });

    // Sort: high severity first, then by title
    return list.sort((a, b) => {
      if (a.severity === "high" && b.severity !== "high") return -1;
      if (b.severity === "high" && a.severity !== "high") return  1;
      return a.title.localeCompare(b.title, "ar");
    });
  }, [maintenanceAlerts, debtAlerts]);

  const highCount = notifications.filter((n) => n.severity === "high").length;
  const totalCount = notifications.length;

  return { notifications, highCount, totalCount, loading };
};
