// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider }       from "./contexts/AuthContext";
import { PrivacyProvider }    from "./contexts/PrivacyContext";
import ProtectedRoute         from "./components/layout/ProtectedRoute";
import AdminRoute             from "./components/layout/AdminRoute";
import RequireModule          from "./components/layout/RequireModule";
import AppLayout              from "./components/layout/AppLayout";
import ErrorBoundary          from "./components/system/ErrorBoundary";

import AuthPage               from "./pages/AuthPage";
import DashboardPage          from "./pages/DashboardPage";
import EquipmentPage          from "./pages/EquipmentPage";
import EquipmentDetailPage    from "./pages/EquipmentDetailPage";
import JobsPage               from "./pages/JobsPage";
import DriversPage            from "./pages/DriversPage";
import DriverDetailPage       from "./pages/DriverDetailPage";
import MaintenancePage        from "./pages/MaintenancePage";
import CustodyPage            from "./pages/CustodyPage";
import TaxDeductionsPage      from "./pages/TaxDeductionsPage";
import ReportsPage            from "./pages/ReportsPage";
import ClientsPage            from "./pages/ClientsPage";
import ClientDetailPage       from "./pages/ClientDetailPage";
import SuppliersPage          from "./pages/SuppliersPage";
import SupplierDetailPage     from "./pages/SupplierDetailPage";
import NotificationsPage      from "./pages/NotificationsPage";
import BillingPage            from "./pages/BillingPage";
import AdminPage              from "./pages/AdminPage";
import AdminBillingRequestsPage from "./pages/AdminBillingRequestsPage";
import AdminErrorsPage        from "./pages/AdminErrorsPage";
import AdminMessagesPage      from "./pages/AdminMessagesPage";
import AdminBackupToExcelPage from "./pages/AdminBackupToExcelPage";

const App = () => (
  <ErrorBoundary>
  <BrowserRouter>
    <AuthProvider>
    <PrivacyProvider>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index                          element={<DashboardPage />} />
          <Route path="equipment"               element={<EquipmentPage />} />
          <Route path="equipment/:equipmentId"  element={<EquipmentDetailPage />} />
          <Route path="jobs"                    element={<JobsPage />} />
          <Route path="drivers"                 element={<DriversPage />} />
          <Route path="drivers/:driverId"       element={<DriverDetailPage />} />
          <Route path="maintenance"             element={<MaintenancePage />} />
          <Route path="custody"                 element={<RequireModule module="custody"><CustodyPage /></RequireModule>} />
          <Route path="tax-deductions"          element={<TaxDeductionsPage />} />
          <Route path="reports"                 element={<ReportsPage />} />
          <Route path="clients"                 element={<RequireModule module="clients"><ClientsPage /></RequireModule>} />
          <Route path="clients/:clientName"     element={<RequireModule module="clients"><ClientDetailPage /></RequireModule>} />
          <Route path="suppliers"               element={<RequireModule module="suppliers"><SuppliersPage /></RequireModule>} />
          <Route path="suppliers/:supplierName" element={<RequireModule module="suppliers"><SupplierDetailPage /></RequireModule>} />
          <Route path="notifications"           element={<NotificationsPage />} />
          <Route path="billing"                 element={<BillingPage />} />
          <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="admin/billing-requests" element={<AdminRoute><AdminBillingRequestsPage /></AdminRoute>} />
          <Route path="admin/errors" element={<AdminRoute><AdminErrorsPage /></AdminRoute>} />
          <Route path="admin/messages" element={<AdminRoute><AdminMessagesPage /></AdminRoute>} />
          <Route path="admin/backup-to-excel" element={<AdminRoute><AdminBackupToExcelPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background:"#1a2235", color:"#f0f4f8",
            border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:"14px", fontFamily:"Cairo, sans-serif",
            fontSize:"14px", direction:"rtl",
          },
          success: { iconTheme: { primary:"#22c55e", secondary:"#fff" } },
          error:   { iconTheme: { primary:"#ef4444", secondary:"#fff" } },
        }}
      />
    </PrivacyProvider>
    </AuthProvider>
  </BrowserRouter>
  </ErrorBoundary>
);

export default App;
