// src/features/suppliers/EditInvoicePaidAmountDialog.jsx
//
// نافذة تعديل "إجمالي المدفوع" على فاتورة مورد بعينها. المستخدم بيدخل
// مبلغ ويحدد "زيادة" أو "خصم" — الواجهة بسيطة ومفيش أي مسمى "دفعة
// تسوية" ظاهر ليه.
//
// من تحت: "المدفوع" مش Field مخزّن على الفاتورة أصلاً — هو مجموع
// supplierPayments المرتبطة بيها (راجع تعليق getInvoicePaidAmount في
// calculations.js، وتحذيره الصريح من إضافة Field موازي زي "amountPaid").
// فعشان أي زيادة/خصم يفضل محفوظ فعلاً حتى لو النت اتقطع، بيتسجل تحت
// السطح كـsupplierPayment بمبلغ الفرق (موجب أو سالب) — بدون أي نص أو
// ملاحظة "تسوية" تتفرض على الدفعة، ودي مسؤولية الصفحة اللي بتستدعي
// onConfirm مش الديالوج نفسه.
//
// وبما إن التعديل ده بيأثر على مبلغ مالي بدون توثيق طبيعي لدفعة حقيقية،
// اتحط وراه نفس تأكيد الباسورد المستخدم في DeleteJobDialog.jsx بالحرف
// الواحد (نفس reauthenticate + نفس رسائل الأخطاء).
import React, { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { NumberInput } from "../../components/ui/Input";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency } from "../../utils/formatters";
import { LockIcon, EyeIcon, EyeOffIcon, EditIcon } from "../../components/ui/Icons";

// onConfirm(delta) — delta بالإشارة (موجب = زيادة، سالب = خصم)
const EditInvoicePaidAmountDialog = ({ open, onClose, invoice, currentPaid = 0, onConfirm }) => {
  const { reauthenticate } = useAuth();
  const [direction, setDirection] = useState("increase"); // "increase" | "decrease"
  const [amount, setAmount]       = useState("");
  const [password, setPassword]   = useState("");
  const [visible, setVisible]     = useState(false);
  const [error, setError]         = useState("");
  const [checking, setChecking]   = useState(false);

  useEffect(() => {
    if (open) {
      setDirection("increase");
      setAmount("");
      setPassword("");
      setError("");
      setChecking(false);
      setVisible(false);
    }
  }, [open]);

  const parsedAmount = Number(amount);
  const validAmount  = amount !== "" && !Number.isNaN(parsedAmount) && parsedAmount > 0
    && (direction === "increase" || parsedAmount <= currentPaid);
  const delta      = validAmount ? (direction === "increase" ? parsedAmount : -parsedAmount) : 0;
  const newTotal   = currentPaid + delta;

  const handleConfirm = async () => {
    if (!validAmount) {
      setError(direction === "decrease" && parsedAmount > currentPaid
        ? "مينفعش تخصم أكتر من المدفوع الحالي"
        : "اكتب مبلغ أكبر من صفر");
      return;
    }
    if (!password) { setError("اكتب كلمة المرور"); return; }
    setChecking(true);
    setError("");
    try {
      await reauthenticate(password);
    } catch (err) {
      setChecking(false);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("كلمة المرور غير صحيحة");
      } else if (err.code === "auth/too-many-requests") {
        setError("محاولات كتير غلط، حاول تاني بعد شوية");
      } else {
        setError("تعذر التحقق من كلمة المرور، تأكد من اتصالك بالإنترنت");
      }
      return;
    }
    await onConfirm(delta);
    setChecking(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={() => !checking && onClose()} title="تعديل إجمالي المدفوع" size="sm">
      <div className="space-y-4">
        {invoice?.description && (
          <p className="text-sm font-bold text-gray-200">{invoice.description}</p>
        )}

        <div className="bg-surface-2 rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-gray-500">المدفوع حاليًا</span>
          <span className="font-extrabold text-green-400 tabular-nums">{formatCurrency(currentPaid)}</span>
        </div>

        {/* Increase / decrease toggle */}
        <div className="flex bg-surface-2 rounded-xl p-1 gap-1">
          {[
            { id: "increase", label: "زيادة" },
            { id: "decrease", label: "خصم" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { setDirection(opt.id); setError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                direction === opt.id
                  ? (opt.id === "increase" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400")
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <NumberInput
          label="المبلغ"
          placeholder="0"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
        />

        {validAmount && (
          <div className="bg-surface-2 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-gray-500">المدفوع بعد التعديل</span>
            <span className="font-extrabold text-gray-100 tabular-nums">{formatCurrency(newTotal)}</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 tracking-wide">
            أدخل كلمة مرور حسابك للتأكيد
          </label>
          <div className="relative">
            <LockIcon size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              placeholder="كلمة المرور"
              className={`w-full bg-surface-2 border rounded-xl pr-10 pl-11 py-3 text-gray-100 placeholder-gray-500 text-sm
                transition duration-200 focus:outline-none focus:ring-2 focus:ring-brand-600/50 focus:border-brand-600
                ${error ? "border-red-500 focus:ring-red-500/50" : "border-white/10"}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {visible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="ghost" size="sm" disabled={checking} onClick={onClose}>إلغاء</Button>
          <Button variant="primary" size="sm" loading={checking} icon={<EditIcon size={14} />}
            disabled={!validAmount}
            onClick={handleConfirm}>
            حفظ
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditInvoicePaidAmountDialog;
