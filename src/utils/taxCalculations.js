// src/utils/taxCalculations.js
//
// Pure tax/deduction math, extracted out of useTaxDeductions.js for the same
// reason as custodyCalculations.js: this is one of the two flows the
// SC-2026-9114 review flagged as having zero test coverage, and it had zero
// coverage specifically because the math lived inline inside a React hook's
// useMemo(), coupled to DataContext. See custodyCalculations.js for the full
// rationale.

const safeNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Total of all tax/deduction entries — the figure subtracted from net
 * profit on the dashboard.
 */
export const calcTotalTaxDeductions = (entries = []) =>
  entries.reduce((s, t) => s + safeNum(t.amount), 0);

/**
 * Total tax/deduction amount grouped by type (tax / government fee /
 * penalty / other).
 */
export const calcTaxDeductionsByType = (entries = []) => {
  const map = {};
  entries.forEach((t) => {
    const key = t.type || "other";
    map[key] = (map[key] || 0) + safeNum(t.amount);
  });
  return map;
};
