/**
 * leaveApis.js
 * ─────────────────────────────────────────────────────────────
 * Centralised API definitions + fetch helpers for the
 * Leave Management module.
 *
 * Usage:
 *   import { LEAVE_API, apiFetch, authHeaders, getAuth } from "./leaveApis";
 */

const BASE = "http://127.0.0.1:8000/api/v1";

/* ─────────────────────────────────────────────
   AUTH HELPERS
──────────────────────────────────────────────── */

/** Read the raw JWT from localStorage */
export function getToken() {
  return localStorage.getItem("access_token") ?? null;
}

/** Standard headers for every request */
export function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

/**
 * Decode the JWT payload and return a normalised auth object.
 * Falls back gracefully if no token is present.
 *
 * Returned shape:
 *   { id, epi, name, role, level, email }
 *
 * Level mapping (matches your HRMS):
 *   1 = Super Admin  2 = CEO  3 = HR Admin
 *   4 = HR Officer   5 = Finance Head  6 = Dept Head
 *   7 = Lead         8 = Employee      9 = Intern
 */
export function getAuth() {
  try {
    const token = getToken();
    if (!token) return null;
    const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p   = JSON.parse(atob(raw));

    return {
      id:    Number(p.EPI ?? p.employee_id ?? p.id ?? p.sub ?? 0),
      epi:   p.EPI    ?? null,
      machineId: p.id ?? null,
      name:  p.name ?? p.full_name ?? [p.f_name, p.l_name].filter(Boolean).join(" ") ?? p.username ?? "User",
      email: p.email  ?? "",
      role:  p.role   ?? "employee",
      level: Number(p.level ?? p.role_level ?? 8),
    };
  } catch {
    return null;
  }
}

/**
 * Thin fetch wrapper — throws on non-ok, returns null on 204.
 *
 * @param {string} url
 * @param {RequestInit} options
 */
export async function apiFetch(url, options = {}) {
  const res = await fetch(url, { headers: authHeaders(), ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ─────────────────────────────────────────────
   ROLE HELPERS
   (matches backend APPROVER_ROLES / ADMIN_ROLES)
──────────────────────────────────────────────── */

/** Roles that can approve / reject / cancel requests */
export const APPROVER_ROLES = new Set(["hr", "hr_head", "ceo", "admin"]);
/** Roles with full admin CRUD on LeaveType + LeaveAllocation */
export const ADMIN_ROLES    = new Set(["admin"]);

/** Returns true if the auth object belongs to an approver */
export function isApprover(auth) {
  if (!auth) return false;
  return auth.level <= 4; // levels 1-4 = SuperAdmin / CEO / HR Admin / HR Officer
}

/** Returns true if the auth object is a pure admin */
export function isAdmin(auth) {
  if (!auth) return false;
  return auth.level <= 3; // levels 1-3 = SuperAdmin / CEO / HR Admin
}

/* ─────────────────────────────────────────────
   LEAVE ENDPOINTS
──────────────────────────────────────────────── */

export const LEAVE_API = {

  /* ── Leave Types (admin CRUD) ── */
  LeaveTypes:    `${BASE}/leaves/types`,
  LeaveTypeById: (id) => `${BASE}/leaves/types/${id}`,

  /* ── Leave Allocations ── */
  Allocations:      `${BASE}/leaves/allocations`,
  AllocationById:   (id) => `${BASE}/leaves/allocations/${id}`,

  /** Balance for the calling employee (omit employee_id) or HR querying another employee */
  Balance: ({ leaveTypeId, year, employeeId } = {}) => {
    const q = new URLSearchParams();
    q.append("leave_type_id", leaveTypeId);
    q.append("year", year);
    if (employeeId != null) q.append("employee_id", employeeId);
    return `${BASE}/leave/balance?${q}`;
  },

  /* ── Leave Requests — employee ── */
  /** POST  → apply for leave */
  ApplyLeave:   `${BASE}/leave/requests`,
  /** GET   → my leave requests  (add ?status=pending etc.) */
  MyLeaves:     `${BASE}/leave/requests/me`,
  /** DELETE → employee self-cancels a pending request */
  CancelLeave:  (id) => `${BASE}/leave/requests/${id}/cancel`,

  /* ── Leave Requests — admin / HR view ── */
  /** GET all requests (filterable by employee_id, status, leave_type_id) */
  AllLeaveRequests: (params = {}) => {
    const q = new URLSearchParams();
    if (params.employeeId)   q.append("employee_id",   params.employeeId);
    if (params.status)       q.append("status",        params.status);
    if (params.leaveTypeId)  q.append("leave_type_id", params.leaveTypeId);
    if (params.skip != null) q.append("skip",          params.skip);
    if (params.limit != null)q.append("limit",         params.limit);
    const qs = q.toString();
    return `${BASE}/leave/requests${qs ? `?${qs}` : ""}`;
  },
  /** GET single request */
  LeaveRequestById: (id) => `${BASE}/leave/requests/${id}`,

  /* ── Leave Request — HR / CEO action ── */
  /** POST { status, reason? } → approve / reject / cancel */
  LeaveAction: (id) => `${BASE}/leave/requests/${id}/action`,

  /* ── Leave Transactions (audit trail) ── */
  Transactions: (params = {}) => {
    const q = new URLSearchParams();
    if (params.employeeId)  q.append("employee_id",   params.employeeId);
    if (params.leaveTypeId) q.append("leave_type_id", params.leaveTypeId);
    if (params.skip != null)q.append("skip",          params.skip);
    if (params.limit != null)q.append("limit",        params.limit);
    const qs = q.toString();
    return `${BASE}/leave/transactions${qs ? `?${qs}` : ""}`;
  },
};

/* ─────────────────────────────────────────────
   CONVENIENCE FETCH FUNCTIONS
   Each maps 1-to-1 with a backend route.
──────────────────────────────────────────────── */

/* Leave Types */
export const fetchLeaveTypes     = (activeOnly = true) =>
  apiFetch(`${LEAVE_API.LeaveTypes}?active_only=${activeOnly}`);

export const fetchLeaveTypeById  = (id) =>
  apiFetch(LEAVE_API.LeaveTypeById(id));

export const createLeaveType     = (data) =>
  apiFetch(LEAVE_API.LeaveTypes, { method: "POST", body: JSON.stringify(data) });

export const updateLeaveType     = (id, data) =>
  apiFetch(LEAVE_API.LeaveTypeById(id), { method: "PATCH", body: JSON.stringify(data) });

export const deleteLeaveType     = (id) =>
  apiFetch(LEAVE_API.LeaveTypeById(id), { method: "DELETE" });

/* Leave Allocations */
export const fetchAllocations    = (params = {}) => {
  const q = new URLSearchParams();
  if (params.employeeId) q.append("employee_id", params.employeeId);
  if (params.year)       q.append("year", params.year);
  return apiFetch(`${LEAVE_API.Allocations}?${q}`);
};

export const createAllocation    = (data) =>
  apiFetch(LEAVE_API.Allocations, { method: "POST", body: JSON.stringify(data) });

export const updateAllocation    = (id, data) =>
  apiFetch(LEAVE_API.AllocationById(id), { method: "PATCH", body: JSON.stringify(data) });

export const fetchBalance        = (leaveTypeId, year, employeeId) =>
  apiFetch(LEAVE_API.Balance({ leaveTypeId, year, employeeId }));

/* My Leave Requests */
export const fetchMyLeaves       = (status) => {
  const url = status
    ? `${LEAVE_API.MyLeaves}?status=${status}`
    : LEAVE_API.MyLeaves;
  return apiFetch(url);
};

export const applyForLeave       = (data) =>
  apiFetch(LEAVE_API.ApplyLeave, { method: "POST", body: JSON.stringify(data) });

export const cancelOwnLeave      = (id) =>
  apiFetch(LEAVE_API.CancelLeave(id), { method: "DELETE" });

/* All Requests (HR / Admin) */
export const fetchAllLeaveRequests = (params) =>
  apiFetch(LEAVE_API.AllLeaveRequests(params));

export const fetchLeaveRequestById = (id) =>
  apiFetch(LEAVE_API.LeaveRequestById(id));

/* Action (HR / CEO) */
export const actionLeaveRequest  = (id, status, reason) =>
  apiFetch(LEAVE_API.LeaveAction(id), {
    method: "POST",
    body: JSON.stringify({ status, reason: reason || null }),
  });

/* Transactions */
export const fetchTransactions   = (params) =>
  apiFetch(LEAVE_API.Transactions(params));