// src/utils/maintenanceAlerts.js
//
// Phase 1 of the "smart alerts" feature (council-reviewed decision): purely
// derived, client-side, offline-safe alerts — no Cloud Functions, no push,
// no new Firestore collections. Same idea as calculations.js's
// checkOverdueDebts: read a few optional fields, diff against today, done.
// Consumed by useNotifications.js (feeds the existing in-app notification
// bell) and reused as-is for the dashboard's "تنبيهات هامة" card — one
// source of truth for both, nothing duplicated.
//
// Every field these functions read is OPTIONAL and additive on top of the
// existing equipment/job schema (equipment.reminderDate, job.reminderDate)
// — a record missing it simply produces no alert. Nothing here writes
// anything.
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
 * Date-based reminder alerts for equipment — covers both base-equipment
 * oil changes and attachment grease reminders with one field: the owner
 * picks a plain date (`equipment.reminderDate`) instead of the app trying
 * to infer it from usage/interval math. Staged: computed fresh every render
 * from that one date, so there is no separate "already reminded" record to
 * fall out of sync — the same due date just moves through medium → high
 * severity as it gets closer, rather than firing repeated separate
 * notifications for the same event. Same shape as checkJobReminders below.
 */
export const checkEquipmentReminders = (equipment = [], today = new Date(), leadDays = 7) => {
  const alerts = [];
  equipment.forEach((eq) => {
    if (!eq.reminderDate) return;
    const days = daysUntil(eq.reminderDate, today);
    if (days === null || days > leadDays) return;
    alerts.push({ equipment: eq, dueDate: eq.reminderDate, daysUntil: days });
  });
  return alerts;
};

/**
 * Client/job reminder-date alerts — same staged-window idea as
 * checkEquipmentReminders above, applied to the optional `reminderDate`
 * field a user can set on any job (e.g. a debt follow-up date).
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