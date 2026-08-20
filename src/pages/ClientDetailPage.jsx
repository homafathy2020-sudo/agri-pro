// src/pages/ClientDetailPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClients }    from "../hooks/useClients";
import { useData }       from "../contexts/DataContext";
import PaymentBadge      from "../features/clients/PaymentBadge";
import { Card, CardHeader, CardBody, SummaryRow, EmptyState, ProgressBar } from "../components/ui/Card";
import LoadingScreen     from "../components/ui/LoadingScreen";
import { formatCurrency, formatNumber, formatDateShort } from "../utils/formatters";
import { AcreIcon, CalendarIcon, TractorIcon } from "../components/ui/Icons";

const ClientDetailPage = () => {
  const { clientName }  = useParams();
  const navigate        = useNavigate();
  const decodedName     = decodeURIComponent(clientName);
  const { getClientSummary, loading } = useClients();
  const { equipment }       = useData();

  if (loading) return <LoadingScreen />;

  const summary = getClientSummary(decodedName);
  const { totalRevenue, totalPaid, totalRemaining, totalAcres, ops, jobs } = summary;
  const paidPct = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
      {/* Back */}
      <button
        onClick={() => navigate("/clients")}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 mb-5 transition-colors"
      >
        ← العملاء
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-900/60 to-surface-3 border border-brand-800/30 flex items-center justify-center text-2xl font-extrabold text-brand-300">
          {decodedName.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-100">{decodedName}</h1>
          <p className="text-sm text-gray-500">{ops} عملية · {formatNumber(totalAcres)} فدان</p>
        </div>
      </div>

      {/* Financial summary card */}
      <Card className="mb-5">
        <CardHeader title="الملخص المالي" />
        <CardBody>
          <SummaryRow label="إجمالي الإيراد"  value={formatCurrency(totalRevenue)}   valueColor="text-amber-400" />
          <SummaryRow label="إجمالي المدفوع"  value={formatCurrency(totalPaid)}      valueColor="text-green-400" />
          <SummaryRow label="المبلغ المتبقي"  value={formatCurrency(totalRemaining)} valueColor={totalRemaining > 0 ? "text-red-400" : "text-gray-400"} bold />

          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>نسبة السداد</span>
              <span className="font-bold text-brand-400">{paidPct.toFixed(0)}%</span>
            </div>
            <ProgressBar
              value={paidPct}
              max={100}
              color={paidPct >= 100 ? "bg-green-500" : paidPct > 50 ? "bg-brand-500" : "bg-amber-500"}
            />
          </div>
        </CardBody>
      </Card>

      {/* Jobs list */}
      <h2 className="text-sm font-bold text-gray-300 mb-3">العمليات ({ops})</h2>
      {jobs.length === 0 ? (
        <EmptyState icon={<AcreIcon size={40} className="text-gray-600 mx-auto mb-2" />} title="لا توجد عمليات" />
      ) : (
        <div className="space-y-3">
          {jobs
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((job) => {
              // job is already enriched by useClients (getClientSummary) with
              // amountPaid / remainingAmount / paymentStatus derived from
              // the payments collection — no need to recompute here.
              const revenue    = job.revenue;
              const paid       = job.amountPaid;
              const remaining  = job.remainingAmount;
              const status     = job.paymentStatus;
              const eq         = equipment.find((e) => e.id === job.equipmentId);

              return (
                <div key={job.id} className={`bg-surface border rounded-2xl p-4 ${
                  status === "unpaid" && revenue > 0 ? "border-amber-800/40" : "border-white/8"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-100">{job.workType}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <CalendarIcon size={11} /> {formatDateShort(job.date)}
                        {eq && <><TractorIcon size={11} /> {eq.name}</>}
                      </div>
                    </div>
                    <PaymentBadge status={status} />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "أفدنة",  value: formatNumber(job.acres),    color: "text-blue-400"  },
                      { label: "إيراد",  value: formatCurrency(revenue),    color: "text-amber-400" },
                      { label: "مدفوع",  value: formatCurrency(paid),       color: "text-green-400" },
                      { label: "متبقي",  value: formatCurrency(remaining),  color: remaining > 0 ? "text-red-400" : "text-gray-400" },
                    ].map((s) => (
                      <div key={s.label} className="bg-surface-2 rounded-xl p-2 text-center">
                        <p className={`text-xs font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default ClientDetailPage;
