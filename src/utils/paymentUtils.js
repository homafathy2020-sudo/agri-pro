// src/utils/paymentUtils.js
//
// NOTE: this file is currently unused anywhere in the app (kept for any
// external/legacy imports). The real source of truth for "how much has a
// job been paid" is `getJobPaidAmount` in calculations.js, which reads the
// `payments` collection (falling back to the legacy job.amountPaid field
// only for jobs that predate the payments system). Do NOT reintroduce a
// second amountPaid-only helper — that split source of truth was exactly
// the debt-tracking bug this file used to encode.
import { getJobPaidAmount } from "./calculations";

export const getTotalPaid = (job, payments = []) => getJobPaidAmount(job, payments);
