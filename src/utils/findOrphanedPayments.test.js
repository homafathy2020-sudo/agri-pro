// src/utils/findOrphanedPayments.test.js
import { findOrphanedPayments, findOrphanedSupplierPayments } from "./findOrphanedPayments";

describe("findOrphanedPayments", () => {
  test("returns nothing when every payment references an existing job", () => {
    const jobs = [{ id: "j1" }, { id: "j2" }];
    const payments = [{ id: "p1", jobId: "j1" }, { id: "p2", jobId: "j2" }];
    expect(findOrphanedPayments(jobs, payments)).toHaveLength(0);
  });

  test("flags a payment whose job no longer exists", () => {
    const jobs = [{ id: "j1" }];
    const payments = [{ id: "p1", jobId: "j1" }, { id: "p2", jobId: "j-deleted" }];
    const result = findOrphanedPayments(jobs, payments);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p2");
  });

  test("ignores malformed payments with no jobId at all rather than false-flagging them", () => {
    const jobs = [{ id: "j1" }];
    const payments = [{ id: "p1" }];
    expect(findOrphanedPayments(jobs, payments)).toHaveLength(0);
  });

  test("defaults to empty arrays safely", () => {
    expect(findOrphanedPayments()).toEqual([]);
  });
});

describe("findOrphanedSupplierPayments", () => {
  test("returns nothing when every supplier payment references an existing invoice", () => {
    const supplierInvoices = [{ id: "i1" }];
    const supplierPayments = [{ id: "sp1", supplierInvoiceId: "i1" }];
    expect(findOrphanedSupplierPayments(supplierInvoices, supplierPayments)).toHaveLength(0);
  });

  test("flags a supplier payment whose invoice no longer exists", () => {
    const supplierInvoices = [{ id: "i1" }];
    const supplierPayments = [{ id: "sp1", supplierInvoiceId: "i-deleted" }];
    const result = findOrphanedSupplierPayments(supplierInvoices, supplierPayments);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("sp1");
  });

  test("defaults to empty arrays safely", () => {
    expect(findOrphanedSupplierPayments()).toEqual([]);
  });
});
