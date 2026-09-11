// src/features/profile/ProfileModal.jsx
//
// نسخة "مقسّمة" — نفس فكرة تقسيم DataContext.jsx بالظبط، بس هنا على
// مكوّنات واجهة (UI) بس؛ الملف ده مفيهوش أي كتابة مالية مباشرة على
// Firestore، فمخاطرة تقسيمه أقل بكتير من تقسيم DataContext. كل قسم من
// أقسام النافذة (الاسم، بيانات الفاتورة، كلمة المرور، النسخ الاحتياطي،
// النسخة المحلية) بقى في ملفه الخاص وبيدير حالته بنفسه بالضبط زي ما كان:
//
//   Section.jsx                → الغلاف البصري المشترك للأقسام
//   PasswordField.jsx          → حقل كلمة مرور قابل لإعادة الاستخدام
//   IdentityHeader.jsx         → الأفتار + عرض/تعديل الاسم
//   CompanyInvoiceSection.jsx  → بيانات الفاتورة الثابتة + الشعار
//   PasswordSection.jsx        → نموذج تغيير كلمة المرور
//   BackupSection.jsx          → النسخ الاحتياطي داخل Firebase + الاسترجاع
//   LocalExportSection.jsx     → نسخة محلية على الجهاز + الاسترجاع منها
//
// الملف ده بقى بس بيجمّعهم جوه Modal واحدة — صفر تغيير في السلوك أو
// الشكل الظاهر للمستخدم. حالة فتح RestoreModal/ImportModal اتسابت هنا
// عمدًا (بدل ما تتنقل جوه BackupSection/LocalExportSection) عشان
// النافذتين يفضلوا sibling لـ div الـ "space-y-5" بالظبط زي الأصل —
// راجع تعليق BackupSection.jsx لتفاصيل السبب.
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import Modal from "../../components/ui/Modal";
import IdentityHeader from "./IdentityHeader";
import CompanyInvoiceSection from "./CompanyInvoiceSection";
import PasswordSection from "./PasswordSection";
import BackupSection from "./BackupSection";
import LocalExportSection from "./LocalExportSection";
import DeleteAccountSection from "./DeleteAccountSection";
import RestoreModal from "./RestoreModal";
import ImportModal from "./ImportModal";

const ProfileModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const { settings, saveSettings } = useData();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <Modal open={open} onClose={onClose} title="الملف الشخصي" size="md">
      <div className="space-y-5">
        <IdentityHeader open={open} />
        <CompanyInvoiceSection user={user} settings={settings} saveSettings={saveSettings} />
        <PasswordSection />
        <BackupSection open={open} onOpenRestore={() => setRestoreOpen(true)} />
        <LocalExportSection onOpenImport={() => setImportOpen(true)} />
        <DeleteAccountSection />
      </div>

      <RestoreModal open={restoreOpen} onClose={() => setRestoreOpen(false)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </Modal>
  );
};

export default ProfileModal;
