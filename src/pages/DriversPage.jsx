// src/pages/DriversPage.jsx
import React, { useState } from "react";
import { useNavigate }    from "react-router-dom";
import { useDrivers }     from "../hooks/useDrivers";
import { useDriverCosts } from "../hooks/useDriverCosts";
import { useConfirm }     from "../hooks/useConfirm";
import DriverForm         from "../features/drivers/DriverForm";
import DriverCostForm     from "../features/driverCosts/DriverCostForm";
import Modal              from "../components/ui/Modal";
import ConfirmDialog      from "../components/ui/ConfirmDialog";
import Button             from "../components/ui/Button";
import { Card, EmptyState } from "../components/ui/Card";
import LoadingScreen      from "../components/ui/LoadingScreen";
import {
  PlusIcon, DriverIcon, EditIcon, TrashIcon, PhoneIcon,
} from "../components/ui/Icons";
import { formatCurrency, formatNumber, getInitial } from "../utils/formatters";

const DriversPage = () => {
  const navigate   = useNavigate();
  const { report, loading, addDriver, updateDriver, deleteDriver } = useDrivers();
  const { getCostsForDriver, addDriverCost }  = useDriverCosts();
  const { confirm, confirmState } = useConfirm();
  const [modal, setModal]         = useState(null);

  const handleSaveDriver = async (data) => {
    if (modal.mode === "add") await addDriver(data);
    else await updateDriver(modal.data.id, data);
    setModal(null);
  };

  const handleDeleteDriver = async (id) => {
    const ok = await confirm(id);
    if (ok) deleteDriver(id);
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

      {report.length === 0 ? (
        <EmptyState
          icon={<DriverIcon size={48} className="text-gray-600 mx-auto mb-2"/>}
          title="لا يوجد سائقون بعد"
          description="أضف سائقيك لتتبع أدائهم وكشف مرتباتهم"
          action={<Button onClick={() => setModal({ mode:"add" })} icon={<PlusIcon size={16}/>}>إضافة أول سائق</Button>}
        />
      ) : (
        <div className="space-y-3">
          {report.map((drv) => (
            <Card key={drv.id} hover>
              <div className="p-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-700 to-blue-700 flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0 shadow-lg">
                    {getInitial(drv.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-gray-100 truncate">{drv.name}</h3>
                    {drv.phone && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <PhoneIcon size={11} className="text-gray-500"/>
                        <p className="text-xs text-gray-500" style={{ direction:"ltr" }}>{drv.phone}</p>
                      </div>
                    )}

                    {/* Quick stats */}
                    <div className="flex gap-4 mt-3 flex-wrap">
                      {[
                        { label:"أفدنة",   value:formatNumber(drv.totalAcres||0),    color:"text-blue-400"  },
                        { label:"إيراد",   value:formatCurrency(drv.totalRevenue||0), color:"text-amber-400" },
                        { label:"عمليات",  value:drv.ops||0,                          color:"text-gray-300"  },
                        ...(drv.salary > 0
                          ? [{ label:"الراتب", value:formatCurrency(drv.salary), color:"text-green-400" }]
                          : []),
                      ].map((s) => (
                        <div key={s.label} className="flex flex-col gap-0.5">
                          <span className={`text-sm font-extrabold ${s.color}`}>{s.value}</span>
                          <span className="text-[10px] text-gray-500">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button variant="secondary" size="sm"
                      onClick={() => navigate(`/drivers/${drv.id}`)}>
                      الرواتب والحضور
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="xs" icon={<EditIcon size={13}/>}
                        className="flex-1" onClick={() => setModal({ mode:"edit", data:drv })}/>
                      <Button variant="ghost" size="xs" icon={<TrashIcon size={13}/>}
                        className="flex-1" onClick={() => handleDeleteDriver(drv.id)}/>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
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
        onConfirm={confirmState.accept} message="هل تريد حذف هذا السائق؟"/>
    </div>
  );
};

export default DriversPage;
