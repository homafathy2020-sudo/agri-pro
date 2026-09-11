// src/features/admin/EntitlementEditorModal.jsx
// ─────────────────────────────────────────────────────────
// أدمن بس — منح/تعديل صلاحية شركة يدويًا: باقة عادية بتاريخ انتهاء،
// Lifetime (بدون تاريخ انتهاء إطلاقًا)، أو Complimentary (وصول مجاني
// بتاريخ اختياري). راجع قسم 16-17 في تقرير
// SAAS_PRICING_AND_BILLING_RESEARCH.html — Lifetime قرار أدمن يدوي بس،
// مش خيار عام.
// ─────────────────────────────────────────────────────────
import React, { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { Select, Textarea } from "../../components/ui/Input";
import { PLANS, ENTITLEMENT_TYPE } from "../../config/constants/billing";

const TYPE_LABELS = {
  [ENTITLEMENT_TYPE.PLAN]:          "باقة عادية (بتاريخ انتهاء)",
  [ENTITLEMENT_TYPE.LIFETIME]:      "وصول دائم (Lifetime)",
  [ENTITLEMENT_TYPE.COMPLIMENTARY]: "وصول مجاني (Complimentary)",
};

const EntitlementEditorModal = ({ company, currentEntitlement, onClose, onGrant, onExtend }) => {
  const [type, setType] = useState(currentEntitlement?.type || ENTITLEMENT_TYPE.PLAN);
  const [planId, setPlanId] = useState(currentEntitlement?.planId || PLANS[PLANS.length - 1].id);
  const [expirationInput, setExpirationInput] = useState("");
  const [notes, setNotes] = useState(currentEntitlement?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      let expirationDate = null;
      if (type !== ENTITLEMENT_TYPE.LIFETIME && expirationInput) {
        expirationDate = new Date(expirationInput);
      }
      await onGrant({
        uid: company.uid,
        type,
        planId: type === ENTITLEMENT_TYPE.COMPLIMENTARY && !planId ? null : planId,
        expirationDate,
        notes,
      });
      toast.success("تم تحديث صلاحية الشركة");
      onClose();
    } catch (err) {
      toast.error("حصل خطأ، حاول تاني");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickExtend = async (days) => {
    setSaving(true);
    try {
      await onExtend(company.uid, days);
      toast.success(`تم التمديد ${days} يوم`);
      onClose();
    } catch (err) {
      toast.error("حصل خطأ، حاول تاني");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`إدارة اشتراك — ${company.displayName || company.email}`} size="md">
      <div className="flex flex-col gap-4">
        <Select label="نوع الصلاحية" value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>

        {type !== ENTITLEMENT_TYPE.LIFETIME && (
          <Select label="الباقة (تحدد الحدود والمزايا)" value={planId || ""} onChange={(e) => setPlanId(e.target.value)}>
            {type === ENTITLEMENT_TYPE.COMPLIMENTARY && <option value="">بدون حدود (كل المزايا مفتوحة)</option>}
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        )}

        {type === ENTITLEMENT_TYPE.LIFETIME && (
          <Select label="مجموعة المزايا (Lifetime دايمًا كل المزايا مفتوحة، ده بس لعرض اسم الباقة)" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        )}

        {type !== ENTITLEMENT_TYPE.LIFETIME && (
          <div>
            <label className="text-xs font-semibold text-gray-400 tracking-wide block mb-1.5">
              تاريخ الانتهاء {type === ENTITLEMENT_TYPE.COMPLIMENTARY && "(سيبها فاضية = بدون تاريخ انتهاء)"}
            </label>
            <input
              type="date"
              value={expirationInput}
              onChange={(e) => setExpirationInput(e.target.value)}
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/50"
            />
          </div>
        )}

        <Textarea label="ملاحظات داخلية (للأدمن بس)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: عميل مؤسس، اتفاق خاص..." />

        {currentEntitlement && type !== ENTITLEMENT_TYPE.LIFETIME && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={saving} onClick={() => handleQuickExtend(30)}>تمديد 30 يوم</Button>
            <Button variant="secondary" size="sm" disabled={saving} onClick={() => handleQuickExtend(365)}>تمديد سنة</Button>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t border-white/8">
          <Button variant="ghost" size="sm" onClick={onClose}>إلغاء</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>حفظ</Button>
        </div>
      </div>
    </Modal>
  );
};

export default EntitlementEditorModal;
