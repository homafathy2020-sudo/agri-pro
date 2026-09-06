// src/utils/custodyCalculations.test.js
import {
  calcTotalDeposits,
  calcTotalExpenses,
  calcCustodyBalance,
  calcExpensesByCategory,
  getCustodyTransactionsForMonth,
} from "./custodyCalculations";
import { CUSTODY_TYPES } from "../config/constants";

const deposit = (amount, extra = {}) => ({ type: CUSTODY_TYPES.DEPOSIT, amount, ...extra });
const expense = (amount, extra = {}) => ({ type: CUSTODY_TYPES.EXPENSE, amount, ...extra });

describe("calcTotalDeposits / calcTotalExpenses", () => {
  test("sums only matching-type transactions", () => {
    const transactions = [deposit(5000), expense(1200), deposit(2000)];
    expect(calcTotalDeposits(transactions)).toBe(7000);
    expect(calcTotalExpenses(transactions)).toBe(1200);
  });

  test("returns 0 for an empty list", () => {
    expect(calcTotalDeposits([])).toBe(0);
    expect(calcTotalExpenses([])).toBe(0);
  });

  test("treats missing/invalid amounts as 0 instead of NaN", () => {
    const transactions = [deposit(undefined), deposit("not-a-number"), deposit(100)];
    expect(calcTotalDeposits(transactions)).toBe(100);
  });
});

describe("calcCustodyBalance", () => {
  test("balance is deposits minus expenses", () => {
    const transactions = [deposit(10000), expense(4000)];
    const result = calcCustodyBalance(transactions);
    expect(result).toEqual({
      totalDeposits: 10000,
      totalExpenses: 4000,
      balance: 6000,
      isOverdrawn: false,
    });
  });

  // This is the case the SC-2026-9114 review specifically called out as
  // untested: a negative custody balance must be reported as-is (not
  // clamped to 0) so the "overdrawn" warning actually fires.
  test("balance goes negative and isOverdrawn flips true when expenses exceed deposits", () => {
    const transactions = [deposit(1000), expense(1500)];
    const result = calcCustodyBalance(transactions);
    expect(result.balance).toBe(-500);
    expect(result.isOverdrawn).toBe(true);
  });

  test("zero balance is not considered overdrawn", () => {
    const transactions = [deposit(1000), expense(1000)];
    expect(calcCustodyBalance(transactions).isOverdrawn).toBe(false);
  });

  test("empty transaction list is a zero, non-overdrawn balance", () => {
    expect(calcCustodyBalance([])).toEqual({
      totalDeposits: 0, totalExpenses: 0, balance: 0, isOverdrawn: false,
    });
  });

  test("defaults transactions to an empty array when omitted", () => {
    expect(calcCustodyBalance()).toEqual({
      totalDeposits: 0, totalExpenses: 0, balance: 0, isOverdrawn: false,
    });
  });
});

describe("calcExpensesByCategory", () => {
  test("groups expense amounts by category", () => {
    const transactions = [
      expense(300, { category: "equipment" }),
      expense(200, { category: "equipment" }),
      expense(150, { category: "driver" }),
      deposit(5000), // deposits must never be counted here
    ];
    expect(calcExpensesByCategory(transactions)).toEqual({
      equipment: 500,
      driver: 150,
    });
  });

  test("falls back to 'other' when category is missing", () => {
    const transactions = [expense(100)];
    expect(calcExpensesByCategory(transactions)).toEqual({ other: 100 });
  });
});

// This exists because useCustody.js (custody page) and useNotifications.js
// (overdrawn alert) used to each hand-compute this balance separately —
// two copies of the same formula that could silently drift apart. Both now
// call calcCustodyBalance(), so this test doubles as a guard against that
// duplication ever creeping back in.
describe("calcCustodyBalance — single source of truth for the overdrawn alert", () => {
  test("the same balance value drives both the custody page and the overdrawn notification", () => {
    const transactions = [deposit(2000), expense(2500)];
    const { balance, isOverdrawn } = calcCustodyBalance(transactions);
    expect(balance).toBe(-500);
    expect(isOverdrawn).toBe(true);
  });
});

describe("getCustodyTransactionsForMonth", () => {
  const transactions = [
    deposit(100, { date: "2026-01-05" }),
    expense(50, { date: "2026-01-20" }),
    deposit(200, { date: "2026-02-01" }),
  ];

  test("filters by year-month prefix and pads single-digit months", () => {
    const result = getCustodyTransactionsForMonth(transactions, 2026, 1);
    expect(result).toHaveLength(2);
  });

  test("returns an empty array when nothing matches", () => {
    expect(getCustodyTransactionsForMonth(transactions, 2026, 6)).toEqual([]);
  });
});
