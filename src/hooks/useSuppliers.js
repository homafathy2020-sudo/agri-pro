// src/hooks/useSuppliers.js
// Mirror of useClients.js, flipped direction: this tracks money the
// business OWES to suppliers/contractors, not money owed to the business.
import { useMemo, useCallback } from "react";
import { useData } from "../contexts/DataContext";
import { calcSupplierRemaining, getInvoicePaidAmount } from "../utils/calculations";

export const useSuppliers = () => {
  const { supplierInvoices = [], supplierPayments = [], loading } = useData();

  const suppliers = useMemo(() => {
    const map = {};
    supplierInvoices.forEach((inv) => {
      const name = inv.supplierName;
      if (!name) return;
      if (!map[name]) map[name] = { supplierName: name, ops: 0, totalInvoiced: 0, totalPaidOut: 0, totalPayable: 0 };
      const paid      = getInvoicePaidAmount(inv, supplierPayments);
      const remaining = calcSupplierRemaining(inv.amount, paid);
      map[name].ops            += 1;
      map[name].totalInvoiced  += Number(inv.amount) || 0;
      map[name].totalPaidOut   += paid;
      map[name].totalPayable   += remaining;
    });
    return Object.values(map).sort((a, b) => b.totalPayable - a.totalPayable);
  }, [supplierInvoices, supplierPayments]);

  const totalPayable = useMemo(
    () => suppliers.reduce((s, sup) => s + sup.totalPayable, 0),
    [suppliers]
  );

  const getSupplierSummary = useCallback((supplierName) => {
    const invoices = supplierInvoices.filter((inv) => inv.supplierName === supplierName);
    const summary = { supplierName, ops: invoices.length, invoices: [], totalInvoiced: 0, totalPaidOut: 0, totalPayable: 0 };
    invoices.forEach((inv) => {
      const paid      = getInvoicePaidAmount(inv, supplierPayments);
      const remaining = calcSupplierRemaining(inv.amount, paid);
      summary.totalInvoiced += Number(inv.amount) || 0;
      summary.totalPaidOut  += paid;
      summary.totalPayable  += remaining;
      summary.invoices.push({ ...inv, amountPaid: paid, remainingAmount: remaining });
    });
    return summary;
  }, [supplierInvoices, supplierPayments]);

  return { suppliers, totalPayable, loading, getSupplierSummary };
};
