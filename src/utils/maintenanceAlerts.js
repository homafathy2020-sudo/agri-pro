// src/utils/maintenanceAlerts.js
//
// Phase 1 of the "smart alerts" feature (council-reviewed decision): purely
// derived, client-side, offline-safe alerts — no Cloud Functions, no push,
// no new Firestore collections. Same idea as calculations.js's
// checkOverdueDebts: read a few optional fields, diff against today/the
// current meter reading, done. Consumed by useNotifications.js (feeds the
// existing in-app notification bell) and reused as-is for the dashboard's
// "تنبيهات هامة" card — one source of truth for both, nothing duplicated.
//
// Every field these functions read is OPTIONAL and additive on top of the
// existing equipment/job schema (oilChangeIntervalMeter, currentMeter,
// greaseIntervalDays, reminderDate) — a record missing any of them simply
// produces no alert. Nothing here writes anything.
import { EQUIPMENT_CATEGORY } from "../config/constants";
import { getLastOilChange } from "./serviceHistory";

const MS_PER_DAY = 86400000;

const daysUntil = (dateStr, today) => {
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  // Compare by calendar day, not by exact time-of-day, so "due today" reads
  // as 0 regardless of what time the app happens to be opened.
  const startOfToday  = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((startOfTarget - startOfToday) / MS_PER_DAY);
};

/**
 * Usage-based oil-change-due alerts for BASE equipment. Needs an explicit
 * baseline (an oilChangeHistory entry or the legacy lastOilChangeMeter),
 * an interval, AND a manually-updated `currentMeter` reading before it can
 * say anything — this is deliberate: the app has no way to know a tractor's
 * real odometer/hour-meter on its own (that reading only exists on the
 * physical gauge), so a missing/never-updated currentMeter must produce NO
 * alert rather than a guess. Single-stage only (no "approaching" pre-alert)
 * since usage, unlike a calendar date, doesn't advance predictably.
 */
export const checkOilChangeDue = (equipment = []) => {
  const alerts = [];
  equipment.forEach((eq) => {
    if (eq.category === EQUIPMENT_CATEGORY.ATTACHMENT) return;
    const interval = Number(eq.oilChangeIntervalMeter) || 0;
    const current  = Number(eq.currentMeter);
    if (!interval || !Number.isFinite(current) || current <= 0) return;
    const last = getLastOilChange(eq);
    if (!last || !(Number(last.meter) >= 0)) return; // no baseline yet
    const dueAtMeter = Number(last.meter) + interval;
    const over = current - dueAtMeter;
    if (over < 0) return; // not due yet
    alerts.push({ equipment: eq, dueAtMeter, currentMeter: current, over });
  });
  return alerts;
};

/**
 * Date-based grease-due alerts for ATTACHMENT equipment. Staged: computed
 * fresh every render from lastGreaseDate + greaseIntervalDays, so there is
 * no separate "already reminded" record to fall out of sync — the same due
 * date just moves through medium → high severity as it gets closer, rather
 * than firing repeated separate notifications for the same event.
 */
export const checkGreaseDue = (equipment = [], today = new Date(), leadDays = 7) => {
  const alerts = [];
  equipment.forEach((eq) => {
    if (eq.category !== EQUIPMENT_CATEGORY.ATTACHMENT) return;
    const intervalDays = Number(eq.greaseIntervalDays) || 0;
    const last = eq.lastGreaseDate;
    if (!intervalDays || !last) return;
    const lastDate = new Date(last);
    if (Number.isNaN(lastDate.getTime())) return;
    lastDate.setDate(lastDate.getDate() + intervalDays);
    const dueDate = lastDate.toISOString().slice(0, 10);
    const days = daysUntil(dueDate, today);
    if (days === null || days > leadDays) return;
    alerts.push({ equipment: eq, dueDate, daysUntil: days });
  });
  return alerts;
};

/**
 * Client/job reminder-date alerts — same staged-window idea as
 * checkGreaseDue, applied to the optional `reminderDate` field a user can
 * set on any job (e.g. a debt follow-up date).
 */
export const checkJobReminders = (jobs = [], today = new Date(), leadDays = 7) => {
  const alerts = [];
  jobs.forEach((job) => {
    if (!job.reminderDate) return;
    const days = daysUntil(job.reminderDate, today);
    if (days === null || days > leadDays) return;
    alerts.push({ job, dueDate: job.reminderDate, daysUntil: days });
  });
  return alerts;
};
