// src/components/layout/RequireModule.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useEntitlement } from "../../hooks/useEntitlement";
import { EmptyState } from "../ui/Card";
import Button from "../ui/Button";
import LoadingScreen from "../ui/LoadingScreen";
import { LockIcon } from "../ui/Icons";

const MODULE_LABELS = {
  custody:   "العهدة",
  clients:   "العملاء والديون",
  suppliers: "الموردين",
};

/**
 * حارس فوق ProtectedRoute — بيمنع الوصول المباشر (عبر الرابط، حتى لو
 * رابط القائمة الجانبية مختفي أصلاً) لصفحة مزية مش شاملة في باقة الشركة
 * الحالية (عهدة/عملاء وديون/موردين — راجع src/config/constants/billing.js
 * → PLANS[].features وsrc/utils/licenseState.js → modulesForPlan).
 *
 * الإنفاذ هنا على مستوى الواجهة بس، مش firestore.rules — زي
 * canAddEquipment/canAddTeamMember بالظبط ولنفس السبب: تشديد الحماية على
 * مستوى قاعدة البيانات هنا كان ممكن يقفل شركة حقيقية بره بياناتها
 * بالغلط لو حصل خطأ في الشرط، وده أخطر بكتير من تساهل مؤقت في مستخدم
 * متمرس بيلعب بالـ Firestore SDK مباشرة.
 */
const RequireModule = ({ module, children }) => {
  const { loading, modules } = useEntitlement();
  const navigate = useNavigate();

  if (loading) return <LoadingScreen />;

  if (!modules?.[module]) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto" dir="rtl">
        <EmptyState
          icon={<LockIcon size={40} className="text-gray-600 mx-auto mb-2" />}
          title="المزية دي مش شاملة في باقتك الحالية"
          description={`"${MODULE_LABELS[module] || module}" متاحة في الباقات الأعلى — رقّي باقتك عشان تفتحها.`}
          action={<Button onClick={() => navigate("/billing")}>عرض الباقات</Button>}
        />
      </div>
    );
  }

  return children;
};

export default RequireModule;
