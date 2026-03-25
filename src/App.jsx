import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { resolveUserUI } from "./auth/roleResolver";
import ProtectedRoute from "./auth/ProtectedRoute";

import PageRender from "./Pages/PageRender";
import LoginForm from "./Pages/Login/LoginForm";
import ForgotPasswordModal from "./Pages/Login/ForgotPasswordModal";

// Pages
import Employees from "./Pages/employee_mangmant/Employees";
import Reports from "./Pages/Reports/Reports";
import Attendance from "./Pages/Attendance/Attendance";
import Training from "./Pages/Traning/Traning";
import Policy from "./Pages/Policies/Policies";
import KPI from "./Pages/KPI/KPI";
import NewPassword from "./Pages/Login/NewPassword";
import Applications from "./Pages/Applications/Applications";
import Notice from "./Pages/Notice/Notice";
import EmployeeAttendanceDetails from "./Pages/Attendance/EmployeeAttendanceDetails";
import DepartmentPage from "./Pages/Department/Departments";
import RolesPage from "./Pages/Roles/Roles";
import Shifts from "./Pages/Shifts/Shifts";
import AttendanceSync from "./Pages/AttendanceSync/AttendanceSync";
import ResetPassword from "./Pages/Login/ResetPassword";
// My pages
import MyNotices from "./Pages/MySection/MyNotices";
import MyApplications from "./Pages/MySection/myApplications";
import MyTraining from "./Pages/MySection/MyTraining";
import MyPolicy from "./Pages/MySection/MyPolicies";
import MyAttendance from "./Pages/MySection/MyAttendance";

function AppContent() {
  const [ui, setUI] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: moved inside component
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  async function refreshUI() {
    setLoading(true);
    const resolved = await resolveUserUI();
    setUI(resolved);
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setUI(null);
  }

  useEffect(() => {
    async function init() {
      const resolved = await resolveUserUI();
      setUI(resolved);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const Dashboard = ui?.DashboardComponent;
  const Sidebar = ui?.sidebarItems;

  return (
    <>
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={
            ui ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginForm
                onLogin={refreshUI}
                onForgotPassword={() => setShowForgotPassword(true)}
              />
            )
          }
        />

        {/* Change Password */}
        <Route
          path="/change-password"
          element={ui ? <NewPassword /> : <Navigate to="/login" replace />}
        />

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute ui={ui}>
              <PageRender sidebarItems={Sidebar} onLogout={logout} />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route
            path="/attendance/employee/:employeeId"
            element={<EmployeeAttendanceDetails />}
          />
          <Route path="/training" element={<Training />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/kpi" element={<KPI />} />
          <Route path="/notice" element={<Notice />} />
          <Route path="/departments" element={<DepartmentPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/sync" element={<AttendanceSync />} />

          {/* My Section */}
          <Route path="/my-applications" element={<Applications />} />
          <Route path="/my-notices" element={<MyNotices />} />
          <Route path="/my-training" element={<MyTraining />} />
          <Route path="/my-policies" element={<MyPolicy />} />
          <Route path="/my-attendance" element={<MyAttendance />} />
        </Route>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to={ui ? "/dashboard" : "/login"} replace />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to={ui ? "/dashboard" : "/login"} replace />} />
      </Routes>

      {/* ✅ Modal OUTSIDE Routes */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}