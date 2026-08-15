// src/config/constants.js

// ─── Firestore Collections ────────────────────────────────────────────────────
export const COLLECTIONS = {
  EQUIPMENT:      "equipment",
  JOBS:           "jobs",
  DRIVERS:        "drivers",
  MAINTENANCE:    "maintenance",
  SETTINGS:       "settings",
  PAYMENTS:       "payments",
  DRIVER_COSTS:   "driverCosts",
  SALARY_ENTRIES: "salaryEntries",
  ATTENDANCE:     "attendance",
  NOTIFICATIONS:  "notifications",
  BACKUPS:        "backups",
  CUSTODY:        "custodyTransactions",
};

// ─── Backup ───────────────────────────────────────────────────────────────────
export const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_BACKUPS_KEPT   = 7;                    // keep last 7 snapshots

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
  "المحراث",
  "القلاب",
  "السبسيولار",
  "معدة تسوية",
  "الدسك",
  "الرشاشة",
  "كومباين",
  "بلانتر بنجر",
  "بلانتر ذرة",
  "سطارة",
  "هولمر حصاد",
  "بدارة خدمة",
  "بدارة خضري",
  "أخرى",
];

export const WORK_TYPE_ICONS = {
  "المحراث":      "🌱",
  "القلاب":       "🌱",
  "السبسيولار":   "🌱",
  "معدة تسوية":   "⚖️",
  "الدسك":        "🌾",
  "الرشاشة":      "💧",
  "كومباين":      "🌻",
  "بلانتر بنجر":  "🌾",
  "بلانتر ذرة":   "🌾",
  "سطارة":        "🌾",
  "هولمر حصاد":   "🌻",
  "بدارة خدمة":   "🌾",
  "بدارة خضري":   "🌾",
  "أخرى":         "🔧",
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

// ─── Driver Status ────────────────────────────────────────────────────────────
export const DRIVER_STATUS = {
  ACTIVE:   "active",
  INACTIVE: "inactive",
};

export const DRIVER_STATUS_LABELS = {
  active:   "نشط",
  inactive: "غير نشط",
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = {
  MAINTENANCE_DUE:   "maintenance_due",
  DEBT_OVERDUE:      "debt_overdue",
  CUSTODY_OVERDRAWN: "custody_overdrawn",
  GENERAL:           "general",
};

export const NOTIFICATION_LABELS = {
  maintenance_due:   "موعد صيانة",
  debt_overdue:      "دين متأخر",
  custody_overdrawn: "عهدة بالسالب",
  general:           "عام",
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

// ─── Custody (العهدة) ──────────────────────────────────────────────────────────
// رجل الأعمال بيسلّم الشركة مبلغ (عهدة) بشكل دوري، وبيتصرف منه على الميكنة والسواقين.
export const CUSTODY_TYPES = {
  DEPOSIT: "deposit", // إضافة فلوس (تسليم من رجل الأعمال)
  EXPENSE: "expense", // صرف فلوس (مصروف يتخصم من الرصيد)
};

export const CUSTODY_TYPE_LABELS = {
  deposit: "إضافة فلوس",
  expense: "صرف فلوس",
};

// تصنيف المصروف — يفيد في التقارير (فين بتروح الفلوس)
export const CUSTODY_EXPENSE_CATEGORIES = {
  EQUIPMENT: "equipment", // ميكنة
  DRIVER:    "driver",    // سائقين
  OTHER:     "other",     // أخرى
};

export const CUSTODY_EXPENSE_CATEGORY_LABELS = {
  equipment: "ميكنة",
  driver:    "سائقين",
  other:     "أخرى",
};
