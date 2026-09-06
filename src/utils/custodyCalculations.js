// src/utils/custodyCalculations.js
//
// Pure custody (العهدة) math, extracted out of useCustody.js.
//
// WHY THIS FILE EXISTS: before this change, the balance/overdraft logic lived
// directly inside useMemo() calls in the React hook, coupled to DataContext
// (Firebase). That made it impossible to unit-test without mounting React
// and mocking Firestore — which is exactly why item #6 of the SC-2026-9114
// review (no tests for the custody flow) was true in the first place. Pulling
// the math out into plain functions, the same way calculations.js and
// salaryCalculations.js already do for jobs/salaries, makes it: importable
// and testable with zero mocking, and reusable anywhere else (reports,
// exports) without depending on the hook.
//
// useCustody.js should only ever read state and call these functions — no
// arithmetic belongs in the hook itself.

import { CUSTODY_TYPES } from "../config/constants";

const safeNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Sum of all deposit transactions (money handed over to the business).
 */
export const calcTotalDeposits = (transactions = []) =>
  transactions
    .filter((c) => c.type === CUSTODY_TYPES.DEPOSIT)
    .reduce((s, c) => s + safeNum(c.amount), 0);

/**
 * Sum of all expense transactions (money spent out of the custody).
 */
export const calcTotalExpenses = (transactions = []) =>
  transactions
    .filter((c) => c.type === CUSTODY_TYPES.EXPENSE)
    .reduce((s, c) => s + safeNum(c.amount), 0);

/**
 * Single source of truth for the custody balance + overdraft flag.
 * Unlike job/payment remaining amounts, this balance is allowed to go
 * negative on purpose — a negative balance IS the "overdrawn" signal the
 * app needs to warn the business owner about, so it must never be clamped
 * to 0 here.
 */
export const calcCustodyBalance = (transactions = []) => {
  const totalDeposits = calcTotalDeposits(transactions);
  const totalExpenses = calcTotalExpenses(transactions);
  const balance = totalDeposits - totalExpenses;
  return { totalDeposits, totalExpenses, balance, isOverdrawn: balance < 0 };
};

/**
 * Total expenses grouped by category (equipment / driver / other), for the
 * "where did the money go" breakdown.
 */
export const calcExpensesByCategory = (transactions = []) => {
  const map = {};
  transactions
    .filter((c) => c.type === CUSTODY_TYPES.EXPENSE)
    .forEach((c) => {
      const key = c.category || "other";
      map[key] = (map[key] || 0) + safeNum(c.amount);
    });
  return map;
};

/**
 * All transactions whose `date` (YYYY-MM-DD) falls in the given year/month.
 */
export const getCustodyTransactionsForMonth = (transactions = [], year, month) => {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return transactions.filter((c) => (c.date || "").startsWith(prefix));
};
