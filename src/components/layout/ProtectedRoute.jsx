// src/components/layout/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingScreen from "../ui/LoadingScreen";
import { DataProvider } from "../../contexts/DataContext";
import OnboardingGate from "./OnboardingGate";
import LandingPage from "../../pages/LandingPage";

/**
 * Wraps routes that require authentication.
 * Also provides DataContext so all child pages have access to Firestore data.
 *
 * Special case: this block also covers the root path "/" (see App.jsx —
 * the index route renders DashboardPage). A logged-out visitor hitting "/"
 * sees the public marketing LandingPage instead of being redirected to
 * /auth, so the app has a real homepage. Every other path under this block
 * (equipment, jobs, ...) still redirects a logged-out visitor to /auth.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen message="جاري التحقق من تسجيل الدخول..." />;
  if (!user) {
    if (location.pathname === "/") return <LandingPage />;
    return <Navigate to="/auth" replace />;
  }

  return (
    <DataProvider>
      <OnboardingGate>{children}</OnboardingGate>
    </DataProvider>
  );
};

export default ProtectedRoute;
