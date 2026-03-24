// src/config/constants.js

// ─── Firestore Collections ────────────────────────────────────────────────────
export const COLLECTIONS = {
  EQUIPMENT:     "equipment",
  JOBS:          "jobs",
  DRIVERS:       "drivers",
  MAINTENANCE:   "maintenance",
  SETTINGS:      "settings",
  PAYMENTS:      "payments",
  DRIVER_COSTS:  "driverCosts",
  NOTIFICATIONS: "notifications",
};

// ─── Equipment ────────────────────────────────────────────────────────────────
export const EQUIPMENT_TYPES = [
  "جرار",
  "معدة حرث",
  "معدة زراعة",
  "مضخة مياه",
  "حصادة",
  "أخرى",
];

export const EQUIPMENT_STATUS = {
  ACTIVE:      "active",
  MAINTENANCE: "maintenance",
  INACTIVE:    "inactive",
};

export const EQUIPMENT_STATUS_LABELS = {
  active:      "نشطة",
  maintenance: "في الصيانة",
  inactive:    "متوقفة",
};

export const EQUIPMENT_TYPE_ICONS = {
  "جرار":        "🚜",
  "معدة حرث":   "⚙️",
  "معدة زراعة": "🌿",
  "مضخة مياه":  "💧",
  "حصادة":      "🌾",
  "أخرى":       "🔧",
};

// ─── Work Types ───────────────────────────────────────────────────────────────
export const WORK_TYPES = [
  "حرث",
  "زراعة",
  "تسوية",
  "ري",
  "حصاد",
  "أخرى",
];

export const WORK_TYPE_ICONS = {
  "حرث":   "🌱",
  "زراعة": "🌾",
  "تسوية": "⚖️",
  "ري":    "💧",
  "حصاد":  "🌻",
  "أخرى":  "🔧",
};

// ─── Maintenance ──────────────────────────────────────────────────────────────
export const MAINTENANCE_TYPES = [
  "تغيير زيت",
  "صيانة دورية",
  "إطارات",
  "بطارية",
  "فلاتر",
  "كهرباء",
  "ميكانيكي",
  "هيكل",
  "أخرى",
];

export const MAINTENANCE_INTERVALS = [
  { label: "كل 250 ساعة", hours: 250 },
  { label: "كل 500 ساعة", hours: 500 },
  { label: "كل شهر",      days:  30  },
  { label: "كل 3 أشهر",   days:  90  },
  { label: "كل 6 أشهر",   days:  180 },
  { label: "كل سنة",      days:  365 },
];

// ─── Payment Status ───────────────────────────────────────────────────────────
export const PAYMENT_STATUS = {
  PAID:    "paid",
  PARTIAL: "partial",
  UNPAID:  "unpaid",
};

export const PAYMENT_STATUS_LABELS = {
  paid:    "مدفوع",
  partial: "جزئي",
  unpaid:  "غير مدفوع",
};

export const PAYMENT_STATUS_VARIANTS = {
  paid:    "green",
  partial: "amber",
  unpaid:  "red",
};

// ─── Driver Costs ─────────────────────────────────────────────────────────────
export const DRIVER_COST_TYPES = [
  "راتب شهري",
  "بدل وقود",
  "بدل سكن",
  "حافز",
  "سلفة",
  "خصم",
  "أخرى",
];

// ─── Notifications ────────────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  MAINTENANCE_DUE: "maintenance_due",
  DEBT_OVERDUE:    "debt_overdue",
  GENERAL:         "general",
};

export const NOTIFICATION_LABELS = {
  maintenance_due: "موعد صيانة",
  debt_overdue:    "دين متأخر",
  general:         "عام",
};

// ─── Misc ─────────────────────────────────────────────────────────────────────
export const DEFAULT_FUEL_PRICE = 12; // EGP per litre
export const APP_VERSION        = "2.0.0";

// ─── Salary System ────────────────────────────────────────────────────────────
export const SALARY_ENTRY_TYPES = {
  BASE:      "base",       // الراتب الأساسي
  BONUS:     "bonus",      // حافز / زيادة
  DEDUCTION: "deduction",  // خصم
  ADVANCE:   "advance",    // سلفة
  ADVANCE_REPAY: "advance_repay", // سداد سلفة
};

export const SALARY_ENTRY_LABELS = {
  base:           "راتب أساسي",
  bonus:          "حافز / مكافأة",
  deduction:      "خصم",
  advance:        "سلفة",
  advance_repay:  "سداد سلفة",
};

export const SALARY_ENTRY_COLORS = {
  base:           "text-green-400",
  bonus:          "text-blue-400",
  deduction:      "text-red-400",
  advance:        "text-amber-400",
  advance_repay:  "text-purple-400",
};

export const DEDUCTION_REASONS = [
  "غياب",
  "تأخير",
  "خطأ في العمل",
  "سداد سلفة",
  "أخرى",
];

export const BONUS_REASONS = [
  "حافز أداء",
  "ساعات إضافية",
  "بدل وقود",
  "بدل سكن",
  "مكافأة",
  "أخرى",
];

export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  ABSENT:  "absent",
  LATE:    "late",
  HALF:    "half",
};

export const ATTENDANCE_LABELS = {
  present: "حضر",
  absent:  "غياب",
  late:    "تأخير",
  half:    "نصف يوم",
};
