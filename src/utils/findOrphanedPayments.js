// src/utils/findOrphanedPayments.js
//
// (audit finding B4/F3 — cross-device cascading-delete race)
//
// deleteJob / deleteSupplierInvoice already delete a job/invoice AND every
// payment that references it in a single atomic Firestore batch (see the
// comments on those two functions in contexts/DataContext.jsx) — that
// fully closes the risk of a job being deleted while ITS OWN payments are
// left behind on a single device/session.
//
// What it cannot close is a race ACROSS two devices/tabs that haven't
// synced with each other yet:
//   1. Device A adds a payment to job J. That write is only queued
//      locally (e.g. A is briefly offline) — it hasn't reached the
//      server yet.
//   2. Around the same time, device B deletes job J. Device B's delete
//      queries "every payment that currently references J" — but it can
//      only see what has already reached the server/its own local cache,
//      so A's not-yet-synced payment isn't in that query and isn't
//      included in the delete batch.
//   3. Device A reconnects. Its queued payment write goes through
//      normally and succeeds — creating a payment that references a job
//      which, by then, no longer exists.
// The payment record itself is never lost — Firestore just has no
// server-side rule tying a payment's existence to its job's existence, so
// nothing rejects step 3. The problem is purely one of correctness after
// the fact: an orphaned payment keeps counting in aggregate totals
// (overall revenue/cash received) but is permanently invisible in any
// per-job or per-client view, because those views only show payments
// reachable through an existing job. Closing this for good would need a
// server-side check (a Cloud Function or a Firestore rule with a get()
// lookup) — out of scope here and not something to add speculatively.
// This module instead does the safe, purely-additive thing: detect it
// from data already loaded in the app (no extra Firestore reads) and
// report it, exactly like utils/findDuplicateSalaryEntries.js reports
// possible duplicate salary entries — for a human to review. It never
// deletes or changes anything on its own, and in the overwhelming
// majority of cases (no offline cross-device edits on the same job/
// invoice within the same short window) it will find nothing at all.

export const findOrphanedPayments = (jobs = [], payments = []) => {
  const jobIds = new Set(jobs.map((j) => j.id));
  return payments.filter((p) => p.jobId && !jobIds.has(p.jobId));
};

export const findOrphanedSupplierPayments = (supplierInvoices = [], supplierPayments = []) => {
  const invoiceIds = new Set(supplierInvoices.map((i) => i.id));
  return supplierPayments.filter((p) => p.supplierInvoiceId && !invoiceIds.has(p.supplierInvoiceId));
};
