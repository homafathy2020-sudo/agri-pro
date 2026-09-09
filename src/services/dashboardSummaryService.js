// src/services/dashboardSummaryService.js
//
// Write-only, experimental. Nothing in the app reads this document yet —
// see DataContext.jsx for where it's written and why. This file has
// exactly one job: take the numbers the app already computed (from the
// existing, unmodified calculation functions) and store them at
// users/{uid}/summary/dashboard, so a later phase can read them for a fast
// first paint. No business logic lives here — it never computes anything,
// only persists numbers it's handed.
//
// ROLLBACK: delete this file and remove its one call site in
// DataContext.jsx (search for "dashboardSummaryService") — nothing else in
// the app references it, and no existing collection or document is
// touched by it.

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

// Bump this if the set of fields or their meaning ever changes, so a
// future reader can tell an old-shaped summary apart from a current one
// instead of trusting a field that might not exist yet.
// v2: totalSupplierPayable (unpaid remainder) replaced with
// totalSupplierPaidOut (cash actually paid to suppliers so far) — the old
// field was being subtracted from net profit backwards (paying a supplier
// used to raise the displayed profit instead of lowering it).
export const DASHBOARD_SUMMARY_VERSION = 2;

export const dashboardSummaryService = {
  /**
   * Overwrite users/{uid}/summary/dashboard with a freshly computed set of
   * dashboard totals. `totals` must already contain exactly the fields
   * listed below, computed by the caller using the app's existing,
   * unmodified calculation functions — this function does not compute or
   * validate any business figure itself.
   */
  async write(userId, totals) {
    const ref = doc(db, "users", userId, "summary", "dashboard");
    await setDoc(ref, {
      totalRevenue:         totals.totalRevenue,
      totalFuelCost:        totals.totalFuelCost,
      totalPaid:            totals.totalPaid,
      totalRemaining:       totals.totalRemaining,
      totalMaintCost:       totals.totalMaintCost,
      totalSalariesPaid:    totals.totalSalariesPaid,
      totalTaxDeductions:   totals.totalTaxDeductions,
      totalSupplierPaidOut: totals.totalSupplierPaidOut,
      netProfit:            totals.netProfit,
      margin:               totals.margin,
      computedAt:           serverTimestamp(),
      version:              DASHBOARD_SUMMARY_VERSION,
    });
  },
};
