// src/pages/SupplierDetailPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSuppliers }  from "../hooks/useSuppliers";
import { useData }       from "../contexts/DataContext";
import SupplierPaymentForm from "../features/suppliers/SupplierPaymentForm";
import Modal              from "../components/ui/Modal";
import Button              from "../components/ui/Button";
import { Card, CardHeader, CardBody, SummaryRow, EmptyState, ProgressBar, Badge } from "../components/ui/Card";
import LoadingScreen      from "../components/ui/LoadingScreen";
import { formatCurrency, formatDateShort } from "../utils/formatters";
import { CalendarIcon, PlusIcon } from "../components/ui/Icons";

const SupplierDetailPage = () => {
  const { supplierName }  = useParams();
  const navigate           = useNavigate();
  const decodedName        = decodeURIComponent(supplierName);
  const { getSupplierSummary, loading } = useSuppliers();
  const { addSupplierPayment } = useData();
  const [payModal, setPayModal] = useState(null);

  if (loading) return <LoadingScreen />;

  const summary = getSupplierSummary(decodedName);
  const { totalInvoiced, totalPaidOut, totalPayable, ops, invoices } = summary;
  const paidPct = totalInvoiced > 0 ? (totalPaidOut / totalInvoiced) * 100 : 0;

  const handleSavePayment = async (data) => {
    await addSupplierPayment(data);
    setPayModal(null);
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
      {/* Back */}
      <button
        onClick={() => navigate("/suppliers")}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 mb-5 transition-colors"
      >
        ← الموردين
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-900/60 to-surface-3 border border-red-800/30 flex items-center justify-center text-2xl font-extrabold text-red-300">
          {decodedName.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-100">{decodedName}</h1>
          <p className="text-sm text-gray-500">{ops} فاتورة</p>
        </div>
      </div>

      {/* Financial summary card */}
      <Card className="mb-5">
        <CardHeader
          title="الملخص المالي"
          actions={
            totalPayable > 0 && (
              <Button size="xs" variant="danger" onClick={() => setPayModal({})}>
                <PlusIcon size={14}/> تسجيل دفعة
              </Button>
            )
          }
        />
        <CardBody>
          <SummaryRow label="إجمالي المستحق عليك" value={formatCurrency(totalInvoiced)} valueColor="text-amber-400" />
          <SummaryRow label="إجمالي اللي دفعته"    value={formatCurrency(totalPaidOut)}  valueColor="text-green-400" />
          <SummaryRow label="المبلغ الباقي عليك"    value={formatCurrency(totalPayable)}  valueColor={totalPayable > 0 ? "text-red-400" : "text-gray-400"} bold />

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>نسبة السداد له</span>
              <span className="font-bold text-brand-400">{paidPct.toFixed(0)}%</span>
            </div>
            <ProgressBar
              value={paidPct}
              max={100}
              color={paidPct >= 100 ? "bg-green-500" : paidPct > 50 ? "bg-brand-500" : "bg-red-500"}
            />
          </div>
        </CardBody>
      </Card>

      {/* Invoices list */}
      <h2 className="text-sm font-bold text-gray-300 mb-3">الفواتير ({ops})</h2>
      {invoices.length === 0 ? (
        <EmptyState title="لا توجد فواتير" />
      ) : (
        <div className="space-y-3">
          {invoices
            .slice()
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .map((inv) => {
              const remaining = inv.remainingAmount;
              const isPaid    = remaining <= 0;
              return (
                <div key={inv.id} className={`bg-surface border rounded-2xl p-4 ${
                  !isPaid ? "border-red-800/40" : "border-white/8"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-100">{inv.description}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <CalendarIcon size={11} /> {formatDateShort(inv.date)}
                      </div>
                    </div>
                    <Badge variant={isPaid ? "green" : "red"}>{isPaid ? "مدفوع" : "لسه عليك"}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "إجمالي", value: formatCurrency(inv.amount),          color: "text-amber-400" },
                      { label: "مدفوع",  value: formatCurrency(inv.amountPaid),      color: "text-green-400" },
                      { label: "متبقي",  value: formatCurrency(remaining),           color: remaining > 0 ? "text-red-400" : "text-gray-400" },
                    ].map((s) => (
                      <div key={s.label} className="bg-surface-2 rounded-xl p-2 text-center">
                        <p className={`text-xs font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {remaining > 0 && (
                    <button
                      onClick={() => setPayModal({ invoice: inv })}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-xs font-bold hover:bg-red-900/40 transition-colors"
                    >
                      <PlusIcon size={14}/> تسجيل دفعة على الفاتورة دي
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Payment modal — targets a specific invoice if one was clicked,
          otherwise the oldest unpaid invoice for this supplier. */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`تسجيل دفعة — ${decodedName}`}>
        {payModal && (() => {
          const target = payModal.invoice
            || invoices.filter((i) => i.remainingAmount > 0)
                 .sort((a, b) => (a.date || "").localeCompare(b.date || ""))[0];
          if (!target) return null;
          return (
            <SupplierPaymentForm
              supplierInvoiceId={target.id}
              invoiceAmount={target.amount}
              alreadyPaid={target.amountPaid || 0}
              onSave={handleSavePayment}
              onClose={() => setPayModal(null)}
            />
          );
        })()}
      </Modal>
    </div>
  );
};

export default SupplierDetailPage;
