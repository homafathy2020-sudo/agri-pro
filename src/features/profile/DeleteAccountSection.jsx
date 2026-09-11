// src/features/profile/DeleteAccountSection.jsx
//
// audit finding F-006: زرار الدخول لمسار حذف الحساب — متعمّد إنه آخر قسم
// في نافذة الملف الشخصي (زي أي منتج SaaS تاني)، بستايل تحذيري واضح عشان
// يتفرّق بصريًا عن باقي الأقسام العادية.
import React, { useState } from "react";
import { TrashIcon } from "../../components/ui/Icons";
import DeleteAccountDialog from "./DeleteAccountDialog";

const DeleteAccountSection = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-400"><TrashIcon size={16} /></span>
        <h3 className="text-sm font-bold text-red-300">منطقة الخطر</h3>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-3">
        حذف الحساب نهائيًا يمسح كل بياناتك ولا يمكن التراجع عنه.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm font-semibold text-red-400 hover:text-red-300 border border-red-900/60 hover:border-red-700 rounded-xl py-2.5 transition-colors"
      >
        حذف الحساب نهائيًا
      </button>

      <DeleteAccountDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default DeleteAccountSection;
