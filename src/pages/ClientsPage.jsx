// src/pages/ClientsPage.jsx
import React, { useState } from "react";
import { useClients }    from "../hooks/useClients";
import { useJobs }       from "../hooks/useJobs";
import { useData }       from "../contexts/DataContext";
import ClientCard        from "../features/clients/ClientCard";
import PaymentForm       from "../features/payments/PaymentForm";
import Modal             from "../components/ui/Modal";
import { StatCard, EmptyState } from "../components/ui/Card";
import LoadingScreen     from "../components/ui/LoadingScreen";
import { DriverIcon, AlertIcon, RevenueIcon } from "../components/ui/Icons";
import { formatCurrency } from "../utils/formatters";

const ClientsPage = () => {
  const { clients, totalDebt, loading } = useClients();
  const { jobs: enrichedJobs }  = useJobs();
  const { updateJob }           = useData();  // ← updateJob مش addPayment
  const [search,   setSearch]   = useState("");
  const [payModal, setPayModal] = useState(null);

  if (loading) return <LoadingScreen />;

  const filtered     = clients.filter((c) =>
    c.client.toLowerCase().includes(search.toLowerCase())
  );
  const totalRevenue = clients.reduce((s, c) => s + c.totalRevenue, 0);
  const totalPaid    = clients.reduce((s, c) => s + c.totalPaid,    0);

  const handleQuickPayment = (clientName) => {
    const unpaidJobs = enrichedJobs
      .filter((j) => j.client === clientName && (j.remainingAmount || 0) > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!unpaidJobs.length) return;
    const job = unpaidJobs[0];
    setPayModal({ job, jobRevenue: job.revenue, alreadyPaid: job.amountPaid || 0 });
  };

  // ← يحدّث job.amountPaid مباشرة بدل ما يضيف في payments collection
  const handleSavePayment = async (data) => {
    const newAmountPaid = (payModal.alreadyPaid || 0) + Number(data.amount);
    await updateJob(payModal.job.id, {
      ...payModal.job,
      amountPaid: newAmountPaid,
    });
    setPayModal(null);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto" dir="rtl">

      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
          <DriverIcon size={22} className="text-brand-400"/>
          العملاء والمديونيات
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{clients.length} عميل مسجل</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={<RevenueIcon size={24}/>} label="إجمالي الإيرادات" value={formatCurrency(totalRevenue)} color="green"/>
        <StatCard icon={<RevenueIcon size={24}/>} label="إجمالي المحصّل"   value={formatCurrency(totalPaid)}    color="blue"/>
        <StatCard icon={<AlertIcon size={24}/>}   label="إجمالي الديون"    value={formatCurrency(totalDebt)}    color={totalDebt > 0 ? "amber" : "green"}/>
      </div>

      {clients.length > 0 && (
        <div className="mb-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم العميل..."
            className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-600"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<DriverIcon size={48} className="text-gray-600 mx-auto mb-2"/>}
          title="لا يوجد عملاء"
          description="العملاء يظهرون تلقائياً عند تسجيل العمليات"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ClientCard key={c.client} client={c}
              onQuickPayment={() => handleQuickPayment(c.client)}/>
          ))}
        </div>
      )}

      <Modal open={!!payModal} onClose={() => setPayModal(null)}
        title={`استلام دفعة — ${payModal?.job?.client || ""}`}>
        {payModal && (
          <PaymentForm
            jobId={payModal.job.id}
            jobRevenue={payModal.jobRevenue}
            alreadyPaid={payModal.alreadyPaid}
            onSave={handleSavePayment}
            onClose={() => setPayModal(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default ClientsPage;
