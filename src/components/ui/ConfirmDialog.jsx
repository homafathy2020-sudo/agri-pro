// src/components/ui/ConfirmDialog.jsx
import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { TrashIcon } from "./Icons";

const ConfirmDialog = ({ open, onClose, onConfirm, title = "تأكيد الحذف", message }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
      {message || "هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عنه."}
    </p>
    <div className="flex gap-3 justify-end">
      <Button variant="ghost" size="sm" onClick={onClose}>إلغاء</Button>
      <Button variant="danger" size="sm" onClick={() => { onConfirm(); onClose(); }}
        icon={<TrashIcon size={14} />}>تأكيد الحذف</Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
