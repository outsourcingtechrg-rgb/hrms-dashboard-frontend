import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { resolveUserUI } from "./auth/roleResolver";
import ProtectedRoute from "./auth/ProtectedRoute";
import { parseJwt } from "./utils/auth";

import PageRender from "./Pages/PageRender";
import LoginForm from "./Pages/Login/LoginForm";
import ForgotPasswordModal from "./Pages/Login/ForgotPasswordModal";

// Pages
import Employees from "./Pages/employee_mangmant/Employees";
import Attendance from "./Pages/Attendance/Attendance";
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

// My Pages
import MyNotices from "./Pages/MySection/MyNotices";
import MyApplications from "./Pages/MySection/myApplications";
import MyTraining from "./Pages/MySection/MyTraining";
import MyPolicy from "./Pages/MySection/MyPolicies";
import MyAttendance from "./Pages/MySection/MyAttendance";

import ComingSoon from "./Pages/CommingSoon/CommingSoon";

function AppContent() {
  const [ui, setUI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // 🔁 Refresh UI after login
  async function refreshUI() {
    setLoading(true);
    try {
      const resolved = await resolveUserUI();
      setUI(resolved);
    } finally {
      setLoading(false);
    }
  }

  // 🔐 Logout
  function logout() {
    localStorage.removeItem("access_token");
    setUI(null);
  }

  // 🚀 Init + Auto Logout
  useEffect(() => {
    let logoutTimer;
    let isMounted = true;

    async function init() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      const decoded = parseJwt(token);

      if (!decoded) {
        logout();
        if (isMounted) setLoading(false);
        return;
      }

      // ⏳ Auto logout
      const expiryTime = decoded.exp * 1000;
      const timeout = expiryTime - Date.now();

      if (timeout <= 0) {
        logout();
        if (isMounted) setLoading(false);
        return;
      }

      logoutTimer = setTimeout(logout, timeout);

      // 🎯 Load UI
      try {
        const resolved = await resolveUserUI();
        if (isMounted) setUI(resolved);
      } catch (err) {
        console.error("UI load failed", err);
        logout();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (logoutTimer) clearTimeout(logoutTimer);
    };
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
        {/* 🔓 Public */}
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

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/change-password"
          element={ui ? <NewPassword /> : <Navigate to="/login" replace />}
        />

        {/* 🔐 Protected Layout */}
        <Route
          element={
            <ProtectedRoute>
              <PageRender sidebarItems={Sidebar} onLogout={logout} />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/employees"
            element={
              <ProtectedRoute minLevel={6}>
                <Employees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/departments"
            element={
              <ProtectedRoute minLevel={4}>
                <DepartmentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles"
            element={
              <ProtectedRoute minLevel={1}>
                <RolesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shifts"
            element={
              <ProtectedRoute minLevel={4}>
                <Shifts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute minLevel={7}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance/employee/:employeeId"
            element={
              <ProtectedRoute minLevel={6}>
                <EmployeeAttendanceDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sync"
            element={
              <ProtectedRoute minLevel={3}>
                <AttendanceSync />
              </ProtectedRoute>
            }
          />

          <Route path="/applications" element={<Applications />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/notice" element={<Notice />} />
          <Route path="/kpi" element={<KPI />} />

          <Route path="/reports" element={<ComingSoon />} />
          <Route path="/training" element={<ComingSoon />} />

          {/* 👤 My Section */}
          <Route path="/my-applications" element={<MyApplications />} />
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

        {/* 404 */}
        <Route
          path="*"
          element={<Navigate to={ui ? "/dashboard" : "/login"} replace />}
        />
      </Routes>

      {/* Forgot Password Modal */}
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