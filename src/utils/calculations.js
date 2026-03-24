// src/utils/calculations.js

// ─── Job-level ────────────────────────────────────────────────────────────────

export const calcRevenue = (acres, pricePerAcre) =>
  (Number(acres) || 0) * (Number(pricePerAcre) || 0);

export const calcFuelCost = (fuelUsed, fuelPrice) =>
  (Number(fuelUsed) || 0) * (Number(fuelPrice) || 0);

/**
 * Full net profit for a single job.
 * maintCostShare = maintenance cost attributed to this job (optional).
 */
export const calcJobNetProfit = (acres, pricePerAcre, fuelUsed, fuelPrice, maintCostShare = 0) => {
  const revenue  = calcRevenue(acres, pricePerAcre);
  const fuelCost = calcFuelCost(fuelUsed, fuelPrice);
  return revenue - fuelCost - (Number(maintCostShare) || 0);
};

// kept for backward-compat with existing callers
export const calcJobProfit = calcJobNetProfit;

// ─── Payment helpers ──────────────────────────────────────────────────────────

/**
 * amountPaid is stored; remainingAmount is always derived — never stored.
 */
export const calcRemainingAmount = (revenue, amountPaid) =>
  Math.max(0, revenue - (Number(amountPaid) || 0));

export const derivePaymentStatus = (revenue, amountPaid) => {
  const paid = Number(amountPaid) || 0;
  if (paid <= 0)           return "unpaid";
  if (paid >= revenue)     return "paid";
  return "partial";
};

// ─── Aggregation ──────────────────────────────────────────────────────────────

/**
 * Aggregate stats for a list of raw jobs (from Firestore, no enrichment yet).
 * Returns totals used by dashboard, reports, and hooks.
 */
export const aggregateJobs = (jobs, fuelPrice) => {
  const totalRevenue  = jobs.reduce((s, j) => s + calcRevenue(j.acres, j.pricePerAcre), 0);
  const totalAcres    = jobs.reduce((s, j) => s + (Number(j.acres) || 0), 0);
  const totalFuel     = jobs.reduce((s, j) => s + (Number(j.fuelUsed) || 0), 0);
  const totalFuelCost = calcFuelCost(totalFuel, fuelPrice);
  const netProfit     = totalRevenue - totalFuelCost;

  // Payment aggregates
  const totalPaid      = jobs.reduce((s, j) => s + (Number(j.amountPaid) || 0), 0);
  const totalRemaining = jobs.reduce((s, j) => {
    const rev = calcRevenue(j.acres, j.pricePerAcre);
    return s + calcRemainingAmount(rev, j.amountPaid);
  }, 0);

  return { totalRevenue, totalAcres, totalFuel, totalFuelCost, netProfit, totalPaid, totalRemaining };
};

/**
 * Build per-equipment report: jobs + maintenance costs → full P&L.
 */
export const buildEquipmentReport = (equipment, jobs, maintenance, fuelPrice) =>
  equipment.map((eq) => {
    const eqJobs  = jobs.filter((j) => j.equipmentId === eq.id);
    const eqMaint = maintenance.filter((m) => m.equipmentId === eq.id);
    const stats      = aggregateJobs(eqJobs, fuelPrice);
    const maintCost  = eqMaint.reduce((s, m) => s + (Number(m.cost) || 0), 0);
    const netProfit  = stats.netProfit - maintCost;
    const margin     = stats.totalRevenue > 0 ? (netProfit / stats.totalRevenue) * 100 : 0;
    return { ...eq, ...stats, maintCost, netProfit, margin, ops: eqJobs.length };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

/**
 * Build per-driver report.
 */
export const buildDriverReport = (drivers, jobs, fuelPrice) =>
  drivers.map((drv) => {
    const drvJobs = jobs.filter((j) => j.driverId === drv.id);
    const stats   = aggregateJobs(drvJobs, fuelPrice);
    return { ...drv, ...stats, ops: drvJobs.length };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

/**
 * Build daily revenue array for the last N days (chart data).
 */
export const buildDailyRevenue = (jobs, days = 7) => {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    const revenue = jobs
      .filter((j) => j.date === iso)
      .reduce((s, j) => s + calcRevenue(j.acres, j.pricePerAcre), 0);
    result.push({ date: iso, revenue });
  }
  return result;
};

/**
 * Group jobs by work type, summing acres (pie chart data).
 */
export const groupByWorkType = (jobs) => {
  const map = {};
  jobs.forEach((j) => { map[j.workType] = (map[j.workType] || 0) + (Number(j.acres) || 0); });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

// ─── Client / Debt helpers ────────────────────────────────────────────────────

/**
 * Aggregate all jobs for a single client name.
 * Returns the client's full financial summary.
 */
export const buildClientSummary = (clientName, jobs, fuelPrice) => {
  const clientJobs = jobs.filter((j) => j.client === clientName);
  const stats      = aggregateJobs(clientJobs, fuelPrice);
  return {
    client:        clientName,
    jobs:          clientJobs,
    ops:           clientJobs.length,
    totalRevenue:  stats.totalRevenue,
    totalPaid:     stats.totalPaid,
    totalRemaining: stats.totalRemaining,
    totalAcres:    stats.totalAcres,
  };
};

/**
 * Build the full client list from jobs, sorted by debt (descending).
 */
export const buildClientList = (jobs, fuelPrice) => {
  const names = [...new Set(jobs.map((j) => j.client).filter(Boolean))];
  return names
    .map((name) => buildClientSummary(name, jobs, fuelPrice))
    .sort((a, b) => b.totalRemaining - a.totalRemaining);
};

// ─── Driver cost calculations ─────────────────────────────────────────────────

/**
 * Sum all driver costs for a given driver in a date range.
 */
export const calcDriverTotalCost = (driverCosts) =>
  driverCosts.reduce((s, c) => s + (Number(c.amount) || 0), 0);

/**
 * Net profit after subtracting driver costs from job profits.
 */
export const calcNetProfitAfterDriverCosts = (jobNetProfit, driverCosts) =>
  jobNetProfit - calcDriverTotalCost(driverCosts);

/**
 * Build per-driver full report including salary costs.
 */
export const buildDriverReportWithCosts = (drivers, jobs, driverCosts, fuelPrice) =>
  drivers.map((drv) => {
    const drvJobs  = jobs.filter((j) => j.driverId === drv.id);
    const drvCosts = driverCosts.filter((c) => c.driverId === drv.id);
    const stats    = aggregateJobs(drvJobs, fuelPrice);
    const totalCosts = calcDriverTotalCost(drvCosts);
    const netAfterCosts = stats.netProfit - totalCosts;
    return {
      ...drv,
      ...stats,
      ops: drvJobs.length,
      totalCosts,
      netAfterCosts,
      costs: drvCosts,
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

// ─── Payment instalments ──────────────────────────────────────────────────────

/**
 * Sum all payments made for a specific job.
 */
export const calcTotalPaidForJob = (payments, jobId) =>
  payments
    .filter((p) => p.jobId === jobId)
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

/**
 * Derive payment status from payments list (not stored amountPaid).
 */
export const derivePaymentStatusFromPayments = (revenue, payments, jobId) => {
  const paid = calcTotalPaidForJob(payments, jobId);
  return {
    paid,
    remaining: Math.max(0, revenue - paid),
    status: derivePaymentStatus(revenue, paid),
  };
};

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Check which equipment needs maintenance soon.
 * Returns list of { equipment, daysSinceLast, isOverdue }
 */
export const checkMaintenanceDue = (equipment, maintenance, warningDays = 7) => {
  const alerts = [];
  equipment.forEach((eq) => {
    if (!eq.maintenanceIntervalDays) return;
    const lastMaint = maintenance
      .filter((m) => m.equipmentId === eq.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!lastMaint) return;
    const lastDate   = new Date(lastMaint.date);
    const today      = new Date();
    const daysSince  = Math.floor((today - lastDate) / 86400000);
    const daysLeft   = eq.maintenanceIntervalDays - daysSince;
    if (daysLeft <= warningDays) {
      alerts.push({ equipment: eq, daysSince, daysLeft, isOverdue: daysLeft < 0 });
    }
  });
  return alerts;
};

/**
 * Check clients with overdue debt (jobs older than X days unpaid).
 */
export const checkOverdueDebts = (jobs, fuelPrice, overdueDays = 30) => {
  const today = new Date();
  return jobs
    .filter((j) => {
      const revenue   = calcRevenue(j.acres, j.pricePerAcre);
      const remaining = calcRemainingAmount(revenue, j.amountPaid);
      if (remaining <= 0) return false;
      const jobDate  = new Date(j.date);
      const daysDiff = Math.floor((today - jobDate) / 86400000);
      return daysDiff >= overdueDays;
    })
    .map((j) => {
      const revenue   = calcRevenue(j.acres, j.pricePerAcre);
      const remaining = calcRemainingAmount(revenue, j.amountPaid);
      const daysDiff  = Math.floor((today - new Date(j.date)) / 86400000);
      return { job: j, remaining, daysDiff };
    })
    .sort((a, b) => b.remaining - a.remaining);
};
