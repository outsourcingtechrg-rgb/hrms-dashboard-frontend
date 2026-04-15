import { API } from "../Components/Apis";

import SupperAdminDashboard from "../Pages/Dashboard/SuperAdminDashboard";
import CeoDashboard from "../Pages/Dashboard/CeoDashboard";
import HrAdminDashboard from "../Pages/Dashboard/HrAdminDashboard";
import HrDashboard from "../Pages/Dashboard/HrDashboard";
import DepartmentHeadDashboard from "../Pages/Dashboard/DepartmentHeadDashboard";
import LeadDashboard from "../Pages/Dashboard/LeadDashboard";
import EmployeeDashboard from "../Pages/Dashboard/EmployeeDashboard";
import InternDashboard from "../Pages/Dashboard/InternDashboard";
import FinanceDashboard from "../Pages/Dashboard/FinanceDashboard";


import {
  LayoutDashboard,
  Users,
  Clock,
  FileText,
  Settings,
  LetterText,
  Megaphone,
  Shield,
  GraduationCap,
  Calendar,
  Ticket,
  House,
} from "lucide-react";


/* =========================
   JWT DECODER
========================= */
function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/* =========================
   DASHBOARD MAP
========================= */
const roleDashboardMap = {
  1: SupperAdminDashboard,
  2: CeoDashboard,
  3: HrAdminDashboard,
  4: HrDashboard,
  5: FinanceDashboard,
  6: DepartmentHeadDashboard,
  7: LeadDashboard,
  8: EmployeeDashboard,
  9: InternDashboard,
};

//  for testing propose only
// const roleDashboardMap = {
//   1: SupperAdminDashboard,
//   2: CeoDashboard,
//   3: HrAdminDashboard,
//   4: HrDashboard,
//   5: DepartmentHeadDashboard,
//   6: LeadDashboard,
//   7: LeadDashboard,
//   8: EmployeeDashboard,
//   9: EmployeeDashboard,
// };
const MY_SECTION = [
  { label: "My Attendance", icon: Clock, path: "/my-attendance", my: true },
  { label: "My Applications", icon: Ticket, path: "/my-applications", my: true },
  { label: "My Notices", icon: FileText, path: "/my-notices", my: true },
  { label: "My Training", icon: GraduationCap, path: "/my-training", my: true },
  { label: "My Policies", icon: Shield, path: "/my-policies", my: true },
  { label: "Leave Management", icon: Calendar, path: "/leave-managment", my: true },
];
/* =========================
   SIDEBAR MAP
========================= */
const roleSidebarMap = {
  // Super Admin
  1: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", my: false },
      { label: "Notices", icon: Megaphone, path: "/notice", my: false },
      { label: "Attendance", icon: Clock, path: "/attendance", my: false },
      // { label: "Timings", icon: Calendar, path: "/timings", my: false },
      { label: "Applications", icon: Ticket, path: "/applications", my: false },
      { label: "Employees", icon: Users, path: "/employees", my: false },
      { label: "Roles", icon: Settings, path: "/roles", my: false },
      { label: "departments", icon: House, path: "/departments", my: false },
      { label: "Reports", icon: FileText, path: "/reports", my: false },
      { label: "Training/Courses", icon: GraduationCap, path: "/training", my: false },
      { label: "KPI", icon: LetterText, path: "/kpi", my: false },
      { label: "Roles", icon: LetterText, path: "/roles", my: false },
      { label: "Policy", icon: Shield, path: "/policy", my: false },
      { label: "Shifts", icon: Clock, path: "/shifts", my: false },
      { label: "Sync Settings", icon: Settings, path: "/sync", my: false },
  ],
  // CEO
  2: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", my: false },
      { label: "Notices", icon: Megaphone, path: "/notice", my: false },
      { label: "Attendance", icon: Clock, path: "/attendance", my: false },
      { label: "Applications", icon: Ticket, path: "/applications", my: false },
      { label: "Employees", icon: Users, path: "/employees", my: false },
      { label: "Departments", icon: House, path: "/departments", my: false },
      { label: "Reports", icon: FileText, path: "/reports", my: false },
      { label: "Training/Courses", icon: GraduationCap, path: "/training", my: false },
      { label: "KPI", icon: LetterText, path: "/kpi", my: false },
      { label: "Policy", icon: Shield, path: "/policy", my: false },
      { label: "Roles", icon: Settings, path: "/roles", my: false },
  ],
  // HR head
  3: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", my: false },
      { label: "Notices", icon: Megaphone, path: "/notice", my: false },
      { label: "Attendance", icon: Clock, path: "/attendance", my: false },
      { label: "Applications", icon: Ticket, path: "/applications", my: false },
      // { label: "departments", icon: House, path: "/departments", my: false },
      { label: "Employees", icon: Users, path: "/employees", my: false },
      { label: "Reports", icon: FileText, path: "/reports", my: false },
      { label: "Training/Courses", icon: GraduationCap, path: "/training", my: false },
      { label: "KPI", icon: LetterText, path: "/kpi", my: false },
      { label: "Policy", icon: Shield, path: "/policy", my: false },
        // my section
      ...MY_SECTION
  ],
  // HR
  4: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", my: false },
      { label: "Notices", icon: Megaphone, path: "/notice", my: false },
      { label: "Attendance", icon: Clock, path: "/attendance", my: false },
      { label: "Applications", icon: Ticket, path: "/applications", my: false },
      { label: "Employees", icon: Users, path: "/employees", my: false },
      { label: "Reports", icon: FileText, path: "/reports", my: false },
      { label: "Training/Courses", icon: GraduationCap, path: "/training", my: false },
      { label: "KPI", icon: LetterText, path: "/kpi", my: false },
      { label: "Policy", icon: Shield, path: "/policy", my: false },
      { label: "Leave Management", icon: Calendar, path: "/leave-managment", my: false },
        // my section
      ...MY_SECTION
  ],
  // finance head
  5: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", my: false }, 
      { label: "Finance", icon: LayoutDashboard, path: "/finance", my: false }, 
        // my section
      ...MY_SECTION
  ],
  // Department head
  6: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", my: false },
      { label: "Notices", icon: Megaphone, path: "/notice", my: false },
      // { label: "Attendance", icon: Clock, path: "/attendance", my: false },
      { label: "Applications", icon: Ticket, path: "/applications", my: false },
      { label: "Attendance", icon: House, path: "/hod-attendance", my: false },
      { label: "Employees", icon: Users, path: "/hod-employees", my: false },
      { label: "Reports", icon: FileText, path: "/reports", my: false },
      { label: "Training/Courses", icon: GraduationCap, path: "/training", my: false },
      { label: "KPI", icon: LetterText, path: "/kpi", my: false },
      { label: "Policy", icon: Shield, path: "/policy", my: false },
        // my section
      ...MY_SECTION
  ],
  // Lead
  7: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", my: false },
        // my section
      ...MY_SECTION
  ],
  // Employee
  8: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", my: false },
    { label: "Leave Management", icon: Calendar, path: "/leave-managment", my: false },
        // my section
      ...MY_SECTION
  ],
  // intern
  9: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", my: false }, 
        // my section
      ...MY_SECTION
  ],
};

/* =========================
   MAIN EXPORT (USED BY APP)
========================= */
export async function resolveUserUI() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  const decoded = decodeJWT(token);
  if (!decoded?.EPI) return null;

  const employeeId = decoded.EPI;

  try {
    const response = await fetch(API.employeeRoleByID(employeeId), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch role");
    }

    const roleRes = await response.json();

    const level = roleRes.level;

    return {
      level,
      DashboardComponent: roleDashboardMap[level],
      sidebarItems: roleSidebarMap[level] || [],
    };
  } catch (error) {
    console.error("Failed to resolve role UI", error);
    return null;
  }
}