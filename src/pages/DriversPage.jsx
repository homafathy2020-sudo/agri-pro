// src/pages/DriversPage.jsx
import React, { useState, useMemo } from "react";
import { useDrivers }     from "../hooks/useDrivers";
import { useConfirm }     from "../hooks/useConfirm";
import DriverForm         from "../features/drivers/DriverForm";
import DriverCard         from "../features/drivers/DriverCard";
import Modal              from "../components/ui/Modal";
import ConfirmDialog      from "../components/ui/ConfirmDialog";
import Button             from "../components/ui/Button";
import { StatCard, EmptyState } from "../components/ui/Card";
import LoadingScreen      from "../components/ui/LoadingScreen";
import {
  PlusIcon, DriverIcon, RevenueIcon, ClearIcon,
} from "../components/ui/Icons";
import { formatCurrency } from "../utils/formatters";
import { DRIVER_STATUS } from "../config/constants";

const DriversPage = () => {
  const {
    report, loading, addDriver, updateDriver, deleteDriver,
    getDriverDependencyCounts,
  } = useDrivers();
  const { confirm, confirmState } = useConfirm();
  const [modal, setModal]         = useState(null);
  const [search, setSearch]       = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Business-wide totals across ALL drivers' jobs — not affected by search/filter.
  const totals = useMemo(() => report.reduce((acc, d) => ({
    revenue:   acc.revenue   + (d.totalRevenue   || 0),
    paid:      acc.paid      + (d.totalPaid      || 0),
    remaining: acc.remaining + (d.totalRemaining || 0),
  }), { revenue: 0, paid: 0, remaining: 0 }), [report]);

  const visibleDrivers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return report.filter((d) => {
      if (!showInactive && d.status === DRIVER_STATUS.INACTIVE) return false;
      if (!q) return true;
      return d.name?.toLowerCase().includes(q) || d.phone?.toLowerCase().includes(q);
    });
  }, [report, search, showInactive]);

  const handleSaveDriver = async (data) => {
    if (modal.mode === "add") await addDriver(data);
    else await updateDriver(modal.data.id, data);
    setModal(null);
  };

  const handleDeleteDriver = async (drv) => {
    const counts = getDriverDependencyCounts(drv.id);
    const hasHistory = counts.jobs > 0 || counts.salaryEntries > 0 || counts.attendance > 0;

    const message = hasHistory ? (
      <>
        <p className="mb-2">
          السائق <span className="font-bold text-gray-200">{drv.name}</span> عليه سجلات مرتبطة:
        </p>
        <ul className="list-disc list-inside text-gray-300 mb-2 space-y-0.5">
          {counts.jobs > 0 && <li>{counts.jobs} عملية</li>}
          {counts.salaryEntries > 0 && <li>{counts.salaryEntries} قيد راتب</li>}
          {counts.attendance > 0 && <li>{counts.attendance} سجل حضور</li>}
        </ul>
        <p>
          حذفه هيسيب السجلات دي من غير سائق مرتبط بيها. لو السائق سايب الشغل بس عايز تحتفظ بتاريخه،
          الأفضل تغيّر حالته لـ "غير نشط" من زرار التعديل بدل الحذف.
        </p>
      </>
    ) : "هل تريد حذف هذا السائق؟";

    const ok = await confirm(drv.id, message);
    if (ok) deleteDriver(drv.id);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto" dir="rtl">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
            <DriverIcon size={22} className="text-brand-400"/>
            السائقون
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{report.length} سائق مسجل</p>
        </div>
        <Button onClick={() => setModal({ mode:"add" })} icon={<PlusIcon size={16}/>}>
          إضافة سائق
        </Button>
      </div>

      {/* KPIs — business-wide, across all drivers' jobs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={<RevenueIcon size={24}/>} label="إجمالي المستحق"  value={formatCurrency(totals.revenue)}   color="amber" sensitive/>
        <StatCard icon={<RevenueIcon size={24}/>} label="إجمالي الواصل"   value={formatCurrency(totals.paid)}      color="green" sensitive/>
        <StatCard icon={<RevenueIcon size={24}/>} label="إجمالي المتبقي"  value={formatCurrency(totals.remaining)} color={totals.remaining > 0 ? "amber" : "green"} sensitive/>
      </div>

      {/* Search + inactive toggle */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-brand-600"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <ClearIcon size={14}/>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowInactive((v) => !v)}
          className={`flex-shrink-0 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-colors ${
            showInactive
              ? "bg-brand-900/40 border-brand-700 text-brand-300"
              : "bg-surface-2 border-white/10 text-gray-400 hover:text-gray-200"
          }`}
        >
          إظهار غير النشطين
        </button>
      </div>

      {visibleDrivers.length === 0 ? (
        report.length === 0 ? (
          <EmptyState
            icon={<DriverIcon size={48} className="text-gray-600 mx-auto mb-2"/>}
            title="لا يوجد سائقون بعد"
            description="أضف سائقيك لتتبع أدائهم وكشف مرتباتهم"
            action={<Button onClick={() => setModal({ mode:"add" })} icon={<PlusIcon size={16}/>}>إضافة أول سائق</Button>}
          />
        ) : (
          <EmptyState
            icon={<DriverIcon size={48} className="text-gray-600 mx-auto mb-2"/>}
            title="لا توجد نتائج"
            description="جرّب كلمة بحث تانية أو فعّل إظهار غير النشطين"
          />
        )
      ) : (
        <div className="space-y-3">
          {visibleDrivers.map((drv) => (
            <DriverCard
              key={drv.id}
              driver={drv}
              onEdit={() => setModal({ mode:"edit", data:drv })}
              onDelete={() => handleDeleteDriver(drv)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal open={modal?.mode === "add" || modal?.mode === "edit"}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "إضافة سائق جديد" : "تعديل بيانات السائق"}>
        {(modal?.mode === "add" || modal?.mode === "edit") && (
          <DriverForm initial={modal.data} onSave={handleSaveDriver} onClose={() => setModal(null)}/>
        )}
      </Modal>

      <ConfirmDialog open={confirmState.open} onClose={confirmState.reject}
        onConfirm={confirmState.accept} message={confirmState.message}/>
    </div>
  );
};

export default DriversPage;
