/**
 * Apis.js — Central API registry for HRMS Leave & Application modules
 *
 * Usage:
 *   import { API } from "./Apis";
 *   fetch(API.GetAllApplications, { headers: authHeader() })
 *   fetch(API.HODAction(id), { ... })
 *
 * Auth helper:
 *   import { authHeader, getAuth } from "./Apis";
 */

export const mainOrigin = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// ── Auth helpers ──────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem("access_token") || "";
}

export function authHeader() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

/** Decode JWT and return auth context (no validation — server validates) */
export function getAuth() {
  try {
    const token = getToken();
    if (!token) return null;
    const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(raw));
    return {
      account_id:    Number(p.sub),
      employee_id:   Number(p.id),
      epi:           Number(p.EPI),
      level:         Number(p.level ?? 99),
      department_id: p.department_id ?? null,
      name:          p.name ?? p.full_name ?? "User",
    };
  } catch {
    return null;
  }
}

// ── RBAC ─────────────────────────────────────────────────────────────────────

/**
 * Levels:
 *  1  Super Admin  — full access
 *  2  CEO          — full read + approve
 *  3  HR Admin     — full HR actions
 *  4  HR Officer   — full HR actions
 *  5  Finance      — payroll only
 *  6  Dept Head    — dept-scoped + HOD approval
 *  7  Lead         — own apps only
 *  8  Employee     — own apps only
 *  9  Intern       — own apps only
 */
export function getRoleConfig(level) {
  const lvl = Number(level ?? 99);
  const isHR       = [1, 2, 3, 4].includes(lvl);
  const isHOD      = lvl === 6;
  const isEmployee = lvl >= 7;

  const META = {
    1: { label: "Super Admin", color: "bg-red-50 text-red-700 border-red-200"           },
    2: { label: "CEO",         color: "bg-amber-50 text-amber-700 border-amber-200"     },
    3: { label: "HR Admin",    color: "bg-violet-50 text-violet-700 border-violet-200"  },
    4: { label: "HR Officer",  color: "bg-green-50 text-green-700 border-green-200"     },
    5: { label: "Finance",     color: "bg-teal-50 text-teal-700 border-teal-200"        },
    6: { label: "Dept Head",   color: "bg-blue-50 text-blue-700 border-blue-200"        },
    7: { label: "Lead",        color: "bg-gray-100 text-gray-600 border-gray-200"       },
    8: { label: "Employee",    color: "bg-gray-100 text-gray-600 border-gray-200"       },
    9: { label: "Intern",      color: "bg-gray-100 text-gray-500 border-gray-200"       },
  };

  const meta = META[lvl] ?? { label: `Level ${lvl}`, color: "bg-gray-100 text-gray-600 border-gray-200" };

  return {
    level:      lvl,
    ...meta,
    isHR,
    isHOD,
    isEmployee,
    canCreate:  true,
    canHOD:     isHOD,
    canHR:      isHR,
    seesAll:    isHR,
    seesDept:   isHOD,
    seesOwn:    isEmployee,
    // leave management: only HR+
    canManageLeaves:    isHR,
    canAllocateLeaves:  isHR,
    canManageCycles:    [1, 3].includes(lvl),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// APPLICATION APIs
// ═════════════════════════════════════════════════════════════════════════════

export const API = {

  // ── Applications ──────────────────────────────────────────────────────────

  /** GET  /applications  — returns list; backend filters by JWT role automatically */
  GetAllApplications: `${mainOrigin}/applications`,

  /** GET  /applications/stats  — { total, pending, hod_approved, approved, rejected, hod_rejected } */
  ApplicationStats: `${mainOrigin}/applications/stats`,

  /** GET  /applications/:id */
  ApplicationById: (id) => `${mainOrigin}/applications/${id}`,

  /** POST /applications  — create new application */
  CreateApplication: `${mainOrigin}/applications`,

  /** POST /applications/:id/hod   body: { action: "approve"|"reject", rejection_reason? } */
  HODAction: (id) => `${mainOrigin}/applications/${id}/hod`,

  /** POST /applications/:id/hr    body: { action: "approve"|"reject", rejection_reason? } */
  HRAction: (id) => `${mainOrigin}/applications/${id}/hr`,

  /** PATCH /applications/:id */
  UpdateApplication: (id) => `${mainOrigin}/applications/${id}`,

  /** DELETE /applications/:id  — withdraw (employee only, pending) */
  DeleteApplication: (id) => `${mainOrigin}/applications/${id}`,

  // ── Leave Cycles ──────────────────────────────────────────────────────────

  /** GET  /leave/cycles */
  GetLeaveCycles: `${mainOrigin}/leave/cycles`,

  /** POST /leave/cycles */
  CreateLeaveCycle: `${mainOrigin}/leave/cycles`,

  /** GET  /leave/cycles/:id */
  GetLeaveCycleById: (id) => `${mainOrigin}/leave/cycles/${id}`,

  /** PATCH /leave/cycles/:id */
  UpdateLeaveCycle: (id) => `${mainOrigin}/leave/cycles/${id}`,

  /** DELETE /leave/cycles/:id */
  DeleteLeaveCycle: (id) => `${mainOrigin}/leave/cycles/${id}`,

  // ── Leave Types ───────────────────────────────────────────────────────────

  /** GET  /leave/types?leave_cycle_id=&is_paid= */
  GetLeaveTypes: `${mainOrigin}/leave/types`,

  /** POST /leave/types */
  CreateLeaveType: `${mainOrigin}/leave/types`,

  /** GET  /leave/types/:id */
  GetLeaveTypeById: (id) => `${mainOrigin}/leave/types/${id}`,

  /** PATCH /leave/types/:id */
  UpdateLeaveType: (id) => `${mainOrigin}/leave/types/${id}`,

  /** DELETE /leave/types/:id */
  DeleteLeaveType: (id) => `${mainOrigin}/leave/types/${id}`,

  // ── Leave Allocations ─────────────────────────────────────────────────────

  /** GET  /leave/allocations?employee_id=&leave_type_id=&year= */
  GetLeaveAllocations: `${mainOrigin}/leave/allocations`,

  /** POST /leave/allocations  — single allocation */
  CreateLeaveAllocation: `${mainOrigin}/leave/allocations`,

  /** POST /leave/allocations/bulk  — body: { employee_ids: [], leave_type_id, year, allocated_days } */
  BulkAllocateLeaves: `${mainOrigin}/leave/allocations/bulk`,

  /** GET  /leave/allocations/:id */
  GetLeaveAllocationById: (id) => `${mainOrigin}/leave/allocations/${id}`,

  /** PATCH /leave/allocations/:id */
  UpdateLeaveAllocation: (id) => `${mainOrigin}/leave/allocations/${id}`,

  /** DELETE /leave/allocations/:id */
  DeleteLeaveAllocation: (id) => `${mainOrigin}/leave/allocations/${id}`,

  // ── Leave Balances ────────────────────────────────────────────────────────

  /** GET  /leave/balances?employee_id=&leave_type_id=&leave_cycle_id= */
  GetLeaveBalances: `${mainOrigin}/leave/balances`,

  /** GET  /leave/balances/employee/:employee_id?leave_cycle_id= */
  GetEmployeeBalances: (employeeId) => `${mainOrigin}/leave/balances/employee/${employeeId}`,

  /** POST /leave/balances */
  CreateLeaveBalance: `${mainOrigin}/leave/balances`,

  /** PATCH /leave/balances/:id */
  UpdateLeaveBalance: (id) => `${mainOrigin}/leave/balances/${id}`,

  // ── Leave Requests ────────────────────────────────────────────────────────

  /** GET  /leave/requests?employee_id=&leave_type_id=&leave_cycle_id=&status= */
  GetLeaveRequests: `${mainOrigin}/leave/requests`,

  /** POST /leave/requests */
  CreateLeaveRequest: `${mainOrigin}/leave/requests`,

  /** GET  /leave/requests/:id */
  GetLeaveRequestById: (id) => `${mainOrigin}/leave/requests/${id}`,

  /** PATCH /leave/requests/:id */
  UpdateLeaveRequest: (id) => `${mainOrigin}/leave/requests/${id}`,

  /** POST /leave/requests/:id/approve   body: { approved_by: employee_id } */
  ApproveLeaveRequest: (id) => `${mainOrigin}/leave/requests/${id}/approve`,

  /** POST /leave/requests/:id/reject    body: { rejection_reason: string } */
  RejectLeaveRequest: (id) => `${mainOrigin}/leave/requests/${id}/reject`,

  /** DELETE /leave/requests/:id */
  DeleteLeaveRequest: (id) => `${mainOrigin}/leave/requests/${id}`,

  // ── Leave Transactions ────────────────────────────────────────────────────

  /** GET  /leave/transactions?employee_id=&leave_type_id=&leave_cycle_id=&action= */
  GetLeaveTransactions: `${mainOrigin}/leave/transactions`,

  /** POST /leave/transactions */
  CreateLeaveTransaction: `${mainOrigin}/leave/transactions`,

  /** GET  /leave/transactions/:id */
  GetLeaveTransactionById: (id) => `${mainOrigin}/leave/transactions/${id}`,

  // ── Employees (for selectors) ─────────────────────────────────────────────

  /** GET  /employees?department_id= */
  GetEmployees: `${mainOrigin}/employees`,

  /** GET  /departments */
  GetDepartments: `${mainOrigin}/departments`,
};

// ── Generic fetch wrapper ─────────────────────────────────────────────────────

/**
 * apiFetch(url, options?)
 * Wraps fetch with auth header + JSON handling + error normalisation.
 * Returns { data, error }.
 */
export async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...authHeader(),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { data: null, error: errBody?.detail || `Error ${res.status}` };
    }
    if (res.status === 204) return { data: null, error: null };
    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message || "Network error" };
  }
}