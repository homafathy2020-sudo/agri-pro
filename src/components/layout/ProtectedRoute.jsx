// src/components/layout/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingScreen from "../ui/LoadingScreen";
import { DataProvider } from "../../contexts/DataContext";

/**
 * Wraps routes that require authentication.
 * Also provides DataContext so all child pages have access to Firestore data.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen message="جاري التحقق من تسجيل الدخول..." />;
  if (!user)   return <Navigate to="/auth" replace />;

  return <DataProvider>{children}</DataProvider>;
};

export default ProtectedRoute;
