// src/components/layout/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ADMIN_UIDS } from "../../config/constants";

/**
 * حارس إضافي فوق ProtectedRoute (اللي أصلاً بيتطلب تسجيل دخول). ده بس
 * بيمنع غير الأدمن من شوفان واجهة صفحة الأدمن على جهازه — الحماية
 * الحقيقية للبيانات نفسها هي isAdmin() في firestore.rules، اللي هترفض
 * أي محاولة قراءة فعلية من حساب مش أدمن حتى لو حد لعب في كود الفرونت.
 */
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || !ADMIN_UIDS.includes(user.uid)) return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
