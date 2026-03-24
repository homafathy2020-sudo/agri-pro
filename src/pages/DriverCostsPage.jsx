// src/pages/DriverCostsPage.jsx
import React, { useState } from "react";
import { useDriverCosts }   from "../hooks/useDriverCosts";
import { useData }          from "../contexts/DataContext";
import { useConfirm }       from "../hooks/useConfirm";
import DriverCostForm       from "../features/driverCosts/DriverCostForm";
import Modal                from "../components/ui/Modal";
import ConfirmDialog        from "../components/ui/ConfirmDialog";
import Button               from "../components/ui/Button";
import { StatCard, Card, CardHeader, CardBody, EmptyState, SummaryRow } from "../components/ui/Card";
import LoadingScreen        from "../components/ui/LoadingScreen";
import { PlusIcon, DriverIcon, RevenueIcon, TrashIcon, EditIcon, CalendarIcon } from "../components/ui/Icons";
import { formatCurrency, formatDateShort, getInitial } from "../utils/formatters";

const DriverCostsPage = () => {
  const { driverReport, getCostsForDriver, loading,
          addDriverCost, updateDriverCost, deleteDriverCost } = useDriverCosts();
  const { drivers } = useData();
  const { confirm, confirmState } = useConfirm();
  const [modal, setModal]     = useState(null);
  const [expanded, setExpanded] = useState(null);

  const totalCosts  = driverReport.reduce((s, d) => s + (d.totalCosts || 0), 0);
  const totalProfit = driverReport.reduce((s, d) => s + (d.netAfterCosts || 0), 0);

  const handleSave = async (data) => {
    if (modal.mode === "add") await addDriverCost(data);
    else await updateDriverCost(modal.data.id, data);
  };

  const handleDelete = async (id) => {
    const ok = await confirm(id);
    if (ok) deleteDriverCost(id);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto" dir="rtl">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
            <DriverIcon size={22} className="text-brand-400"/>
            تكاليف السائقين
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">رواتب، بدلات، حوافز</p>
        </div>
        <Button onClick={() => setModal({ mode:"add" })} icon={<PlusIcon size={16}/>}>
          تسجيل تكلفة
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={<RevenueIcon size={24}/>} label="إجمالي التكاليف" value={formatCurrency(totalCosts)} color="red"/>
        <StatCard icon={<RevenueIcon size={24}/>} label="الربح بعد التكاليف" value={formatCurrency(totalProfit)} color={totalProfit>=0?"green":"red"}/>
      </div>

      {/* Driver cards */}
      {driverReport.length === 0 ? (
        <EmptyState icon={<DriverIcon size={48} className="text-gray-600 mx-auto mb-2"/>}
          title="لا يوجد سائقون" description="أضف سائقين أولاً"/>
      ) : (
        <div className="space-y-4">
          {driverReport.map((drv) => {
            const costs = getCostsForDriver(drv.id);
            const isExpanded = expanded === drv.id;
            return (
              <Card key={drv.id}>
                {/* Driver header */}
                <div
                  className="flex items-center gap-3 p-5 cursor-pointer hover:bg-white/2 rounded-2xl transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : drv.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-700 to-blue-700 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                    {getInitial(drv.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-100">{drv.name}</p>
                    <p className="text-xs text-gray-500">{costs.length} سجل تكلفة</p>
                  </div>
                  <div className="text-left flex-shrink-0 ml-4">
                    <p className="text-sm font-extrabold text-red-400 tabular-nums">{formatCurrency(drv.totalCosts || 0)}</p>
                    <p className="text-[10px] text-gray-500">إجمالي التكاليف</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className={`text-sm font-extrabold tabular-nums ${(drv.netAfterCosts||0)>=0?"text-green-400":"text-red-400"}`}>
                      {formatCurrency(drv.netAfterCosts || 0)}
                    </p>
                    <p className="text-[10px] text-gray-500">ربح صافي</p>
                  </div>
                  <span className="text-gray-500 mr-2">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {/* Expanded costs list */}
                {isExpanded && (
                  <div className="border-t border-white/8">
                    <div className="px-5 py-3 flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-400">سجل التكاليف</p>
                      <Button size="xs" variant="ghost"
                        onClick={() => setModal({ mode:"add", preDriver: drv.id })}
                        icon={<PlusIcon size={12}/>}>
                        إضافة
                      </Button>
                    </div>

                    {costs.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4 pb-5">لا توجد تكاليف مسجلة</p>
                    ) : (
                      <div className="divide-y divide-white/8 pb-2">
                        {costs.map((c) => (
                          <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-200">{c.type}</p>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                <CalendarIcon size={11}/>
                                <span>{formatDateShort(c.date)}</span>
                                {c.notes && <span>· {c.notes}</span>}
                              </div>
                            </div>
                            <span className="text-sm font-bold text-red-400 tabular-nums flex-shrink-0 mr-2">
                              {formatCurrency(c.amount)}
                            </span>
                            <Button variant="ghost" size="xs" icon={<EditIcon size={13}/>} className="px-2"
                              onClick={() => setModal({ mode:"edit", data: c })}/>
                            <Button variant="ghost" size="xs" icon={<TrashIcon size={13}/>} className="px-2"
                              onClick={() => handleDelete(c.id)}/>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Monthly summary */}
                    <div className="border-t border-white/8 p-5">
                      <SummaryRow label="إجمالي الإيراد"      value={formatCurrency(drv.totalRevenue  || 0)} valueColor="text-amber-400"/>
                      <SummaryRow label="تكلفة الوقود"        value={formatCurrency(drv.totalFuelCost || 0)} valueColor="text-blue-400"/>
                      <SummaryRow label="إجمالي تكاليف السائق" value={formatCurrency(drv.totalCosts   || 0)} valueColor="text-red-400"/>
                      <SummaryRow label="الربح الصافي الحقيقي" value={formatCurrency(drv.netAfterCosts|| 0)}
                        valueColor={(drv.netAfterCosts||0)>=0?"text-green-400":"text-red-400"} bold/>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.mode==="add" ? "تسجيل تكلفة جديدة" : "تعديل التكلفة"}>
        {modal && (
          <DriverCostForm
            initial={modal.data || (modal.preDriver ? { driverId: modal.preDriver } : undefined)}
            drivers={drivers}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog open={confirmState.open} onClose={confirmState.reject}
        onConfirm={confirmState.accept} message="هل تريد حذف هذه التكلفة؟"/>
    </div>
  );
};

export default DriverCostsPage;
