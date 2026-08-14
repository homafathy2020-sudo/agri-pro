// src/hooks/useNotifications.js
import { useMemo } from "react";
import { useData } from "../contexts/DataContext";
import { checkMaintenanceDue, checkOverdueDebts } from "../utils/calculations";
import { CUSTODY_TYPES } from "../config/constants";

/**
 * Derives all active alerts from existing data — no extra Firestore reads.
 * Returns sorted list of notifications with type, severity, and action info.
 */
export const useNotifications = () => {
  const { equipment, maintenance, jobs, payments, settings, custody, loading } = useData();

  const maintenanceAlerts = useMemo(
    () => checkMaintenanceDue(equipment, maintenance, 14),
    [equipment, maintenance]
  );

  const debtAlerts = useMemo(
    () => checkOverdueDebts(jobs, settings.fuelPrice, 30, payments),
    [jobs, settings.fuelPrice, payments]
  );

  const custodyBalance = useMemo(() => {
    const deposits = custody
      .filter((c) => c.type === CUSTODY_TYPES.DEPOSIT)
      .reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const expenses = custody
      .filter((c) => c.type === CUSTODY_TYPES.EXPENSE)
      .reduce((s, c) => s + (Number(c.amount) || 0), 0);
    return deposits - expenses;
  }, [custody]);

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

    // Custody overdrawn alert — only when balance actually goes negative,
    // no arbitrary low-balance threshold.
    if (custody.length > 0 && custodyBalance < 0) {
      list.push({
        id:       "custody-overdrawn",
        type:     "custody_overdrawn",
        severity: "high",
        title:    "رصيد العهدة بالسالب",
        body:     `المصروفات تجاوزت المبلغ المُسلَّم بـ ${Math.abs(custodyBalance).toLocaleString("ar-EG")} ج.م`,
        actionLabel: "عرض العهدة",
        actionPath:  "/custody",
      });
    }

    // Sort: high severity first, then by title
    return list.sort((a, b) => {
      if (a.severity === "high" && b.severity !== "high") return -1;
      if (b.severity === "high" && a.severity !== "high") return  1;
      return a.title.localeCompare(b.title, "ar");
    });
  }, [maintenanceAlerts, debtAlerts, custody, custodyBalance]);

  const highCount = notifications.filter((n) => n.severity === "high").length;
  const totalCount = notifications.length;

  return { notifications, highCount, totalCount, loading };
};
