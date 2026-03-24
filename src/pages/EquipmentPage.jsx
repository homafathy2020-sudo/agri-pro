// src/pages/EquipmentPage.jsx
import React, { useState } from "react";
import { useEquipment } from "../hooks/useEquipment";
import { useDrivers }   from "../hooks/useDrivers";
import { useJobs }      from "../hooks/useJobs";
import { useConfirm }   from "../hooks/useConfirm";
import EquipmentCard    from "../features/equipment/EquipmentCard";
import EquipmentForm    from "../features/equipment/EquipmentForm";
import JobForm          from "../features/jobs/JobForm";
import Modal            from "../components/ui/Modal";
import ConfirmDialog    from "../components/ui/ConfirmDialog";
import Button           from "../components/ui/Button";
import { EmptyState }   from "../components/ui/Card";
import LoadingScreen    from "../components/ui/LoadingScreen";
import { PlusIcon, TractorIcon } from "../components/ui/Icons";

const EquipmentPage = () => {
  const { report, loading, addEquipment, updateEquipment, deleteEquipment } = useEquipment();
  const { report: driverReport } = useDrivers();
  const { addJob, fuelPrice }    = useJobs();
  const { confirm, confirmState } = useConfirm();
  const [modal, setModal] = useState(null);

  const handleSaveEquipment = async (formData) => {
    if (modal.mode === "add") await addEquipment(formData);
    else await updateEquipment(modal.data.id, formData);
    setModal(null);
  };

  const handleSaveJob = async (formData) => {
    await addJob(formData);
    setModal(null);
  };

  const handleDelete = async (id) => {
    const ok = await confirm(id);
    if (ok) deleteEquipment(id);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2">
            <TractorIcon size={22} className="text-brand-400"/>
            إدارة المعدات
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{report.length} معدة مسجلة</p>
        </div>
        <Button onClick={() => setModal({ mode:"add" })} icon={<PlusIcon size={16}/>}>إضافة معدة</Button>
      </div>

      {report.length === 0 ? (
        <EmptyState
          icon={<TractorIcon size={48} className="text-gray-600 mx-auto mb-4"/>}
          title="لا توجد معدات بعد"
          description="أضف معداتك الزراعية لبدء تتبع الأداء"
          action={<Button onClick={() => setModal({ mode:"add" })} icon={<PlusIcon size={16}/>}>إضافة أول معدة</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {report.map((eq) => (
            <EquipmentCard key={eq.id} equipment={eq}
              onEdit={()       => setModal({ mode:"edit", data:eq })}
              onDelete={()     => handleDelete(eq.id)}
              onQuickJob={()   => setModal({ mode:"quickJob", equipmentId:eq.id, driverId:eq.driverId })}
            />
          ))}
        </div>
      )}

      {/* Add / Edit equipment */}
      <Modal open={modal?.mode==="add" || modal?.mode==="edit"}
        onClose={() => setModal(null)}
        title={modal?.mode==="add" ? "إضافة معدة جديدة" : "تعديل المعدة"}>
        {(modal?.mode==="add" || modal?.mode==="edit") && (
          <EquipmentForm initial={modal.data} drivers={driverReport}
            onSave={handleSaveEquipment} onClose={() => setModal(null)}/>
        )}
      </Modal>

      {/* Quick Job modal */}
      <Modal open={modal?.mode==="quickJob"} onClose={() => setModal(null)} title="تسجيل شغل جديد">
        {modal?.mode==="quickJob" && (
          <JobForm
            equipment={report}
            drivers={driverReport}
            fuelPrice={fuelPrice}
            initial={{ equipmentId: modal.equipmentId, driverId: modal.driverId || "" }}
            onSave={handleSaveJob}
            onClose={() => setModal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog open={confirmState.open} onClose={confirmState.reject}
        onConfirm={confirmState.accept} message="هل تريد حذف هذه المعدة؟"/>
    </div>
  );
};

export default EquipmentPage;
