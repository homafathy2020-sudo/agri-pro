// src/utils/formatters.js

/**
 * Format a number with comma separators (Arabic locale).
 */
export const formatNumber = (value, decimals = 0) =>
  Number(value || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Format a number as Egyptian Pounds.
 */
export const formatCurrency = (value) =>
  `${formatNumber(value)} ج.م`;

/**
 * Format an ISO date string → full Arabic locale date.
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });
};

/**
 * Format an ISO date string → short Arabic locale date.
 */
export const formatDateShort = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-EG");
};

/**
 * Today as YYYY-MM-DD (for input[type=date]).
 */
export const todayISO = () => new Date().toISOString().split("T")[0];

/**
 * First letter of a name for avatar display.
 */
export const getInitial = (name = "") => name.trim().charAt(0) || "؟";

/**
 * Format a percentage.
 */
export const formatPercent = (value, decimals = 1) =>
  `${Number(value || 0).toFixed(decimals)}%`;

/**
 * Tailwind color class based on profit sign.
 */
export const profitColor = (value) =>
  Number(value) >= 0 ? "text-green-400" : "text-red-400";

/**
 * Add thousand separators as the user types.
 * Strips all non-digit characters, formats with commas.
 * Returns the raw numeric string for storage.
 *
 * Usage in an input:
 *   value={formatInputNumber(rawValue)}
 *   onChange={(e) => setRawValue(parseInputNumber(e.target.value))}
 */
export const formatInputNumber = (rawValue) => {
  if (rawValue === "" || rawValue == null) return "";
  const digits = String(rawValue).replace(/[^\d.]/g, "");
  const parts  = digits.split(".");
  parts[0]     = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

/**
 * Strip formatting commas → plain numeric string.
 */
export const parseInputNumber = (formattedValue) =>
  String(formattedValue || "").replace(/,/g, "");
