// src/utils/paymentUtils.js
// Single source of truth: job.amountPaid only
export const getTotalPaid = (job) => Number(job.amountPaid) || 0;
