// src/utils/taxCalculations.test.js
import { calcTotalTaxDeductions, calcTaxDeductionsByType } from "./taxCalculations";

describe("calcTotalTaxDeductions", () => {
  test("sums the amount field across all entries", () => {
    const entries = [{ amount: 500 }, { amount: 250 }, { amount: 1000 }];
    expect(calcTotalTaxDeductions(entries)).toBe(1750);
  });

  test("returns 0 for an empty list", () => {
    expect(calcTotalTaxDeductions([])).toBe(0);
  });

  test("defaults to an empty array when omitted", () => {
    expect(calcTotalTaxDeductions()).toBe(0);
  });

  test("treats missing/invalid amounts as 0 instead of NaN", () => {
    const entries = [{ amount: undefined }, { amount: "not-a-number" }, { amount: 300 }];
    expect(calcTotalTaxDeductions(entries)).toBe(300);
  });
});

describe("calcTaxDeductionsByType", () => {
  test("groups amounts by type", () => {
    const entries = [
      { type: "tax", amount: 1000 },
      { type: "tax", amount: 500 },
      { type: "fine", amount: 200 },
    ];
    expect(calcTaxDeductionsByType(entries)).toEqual({ tax: 1500, fine: 200 });
  });

  test("falls back to 'other' when type is missing", () => {
    expect(calcTaxDeductionsByType([{ amount: 100 }])).toEqual({ other: 100 });
  });

  test("returns an empty object for an empty list", () => {
    expect(calcTaxDeductionsByType([])).toEqual({});
  });
});
