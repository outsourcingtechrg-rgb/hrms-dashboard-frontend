/**
 * EmployeesAttendancePage.jsx
 *
 * ── Auth ─────────────────────────────────────────────────────────
 *  Reads access_token → JWT → level + department_id
 *  Level 1  → Super Admin  : full view, all employees
 *  Level 2  → CEO          : full view, all employees (read-only)
 *  Level 3  → HR Admin     : full view, all employees
 *  Level 4  → HR Officer   : full view, all employees
 *  Level 6  → Dept Head    : own dept only (Leads + Interns)
 *
 * ── APIs needed in Apis.js ───────────────────────────────────────
 *  GetAllEmployees            : `${mainOrigin}/employees`
 *  ListDepartment             : `${mainOrigin}/departments`
 *
 *  AdminAttendanceRecords     : `${mainOrigin}/attendance/admin/records`
 *    Query params: month (YYYY-MM), employee_id (Employee.id), department_id, status, skip, limit
 *    Returns enriched records: each has employee_name, department_name, designation, image etc.
 *    Only system employees — ZKT ghost entries excluded automatically.
 *
 *  AdminAttendanceSummary     : `${mainOrigin}/attendance/admin/summary`
 *    Query params: month (YYYY-MM), department_id
 *    Returns: { present, late, early, absent, leave, total_records, total_employees, rate, by_department[] }
 *
 *  AdminAttendanceByEmployee  : (empDbId, month) =>
 *    `${mainOrigin}/attendance/admin/records?employee_id=${empDbId}&month=${month}`
 *    (reuse the same admin/records endpoint filtered to one employee)
 *
 * ── Enriched admin record shape ───────────────────────────────────
 *  {
 *    id, employee_id (machine), employee_db_id (Employee.id),
 *    employee_name, f_name, l_name, designation,
 *    department_id, department_name, employment_status, image,
 *    date: "YYYY-MM-DD",
 *    status: "Present" | "Late" | "Early" | "Absent" | "Leave",
 *    in_time: "HH:MM" | null,
 *    out_time: "HH:MM" | null,
 *    hours: float | null,
 *    attendance_mode: "onsite" | "remote",
 *  }
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Crown,
  Shield,
  UserCheck,
  TrendingUp,
  Building2,
  Loader2,
  AlertCircle,
  Eye,
  Activity,
  Zap,
  Moon,
  LogIn,
  LogOut,
  Timer,
  Filter,
  BarChart2,
  Info,
  ChevronDown,
} from "lucide-react";
import { API } from "../../Components/Apis";
import MyAttendancePage from "./EmployeeAttendance";
/* ─── Global styles ─── */
const _STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

  @keyframes ea-in    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ea-left  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes ea-right { from{transform:translateX(100%);opacity:0}  to{transform:translateX(0);opacity:1} }
  @keyframes ea-spin  { to{transform:rotate(360deg)} }

  .ea-page * { font-family: 'DM Sans', sans-serif; }
  .ea-mono   { font-family: 'DM Mono', monospace; }
  .ea-fade   { animation: ea-in    .28s cubic-bezier(.4,0,.2,1) both; }
  .ea-left   { animation: ea-left  .22s cubic-bezier(.4,0,.2,1) both; }
  .ea-slide  { animation: ea-right .3s  cubic-bezier(.4,0,.2,1); }
  .ea-spin   { animation: ea-spin  .9s  linear infinite; }

  .ea-stagger > *:nth-child(1) { animation: ea-in .28s .03s cubic-bezier(.4,0,.2,1) both; }
  .ea-stagger > *:nth-child(2) { animation: ea-in .28s .07s cubic-bezier(.4,0,.2,1) both; }
  .ea-stagger > *:nth-child(3) { animation: ea-in .28s .11s cubic-bezier(.4,0,.2,1) both; }
  .ea-stagger > *:nth-child(4) { animation: ea-in .28s .15s cubic-bezier(.4,0,.2,1) both; }
  .ea-stagger > *:nth-child(5) { animation: ea-in .28s .19s cubic-bezier(.4,0,.2,1) both; }
  .ea-stagger > *:nth-child(6) { animation: ea-in .28s .23s cubic-bezier(.4,0,.2,1) both; }

  .ea-card {
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04);
    border: 1px solid rgba(0,0,0,.05);
  }

  .ea-row { transition: background .1s ease; }
  .ea-row:hover { background: rgba(99,102,241,.04) !important; }

  .ea-bar { height: 3px; border-radius: 99px; background: #f1f1f3; overflow: hidden; }
  .ea-bar-fill { height: 100%; border-radius: 99px; transition: width .6s cubic-bezier(.4,0,.2,1); }

  .ea-scroll::-webkit-scrollbar { width:4px; height:4px; }
  .ea-scroll::-webkit-scrollbar-track { background:transparent; }
  .ea-scroll::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:99px; }
`;

(() => {
  if (typeof document === "undefined") return;
  if (!document.getElementById("__ea_styles__")) {
    const el = document.createElement("style");
    el.id = "__ea_styles__";
    el.textContent = _STYLES;
    document.head.appendChild(el);
  }
})();

/* ─── JWT helper ─── */
function getHeaders() {
  const t = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

function getAuthFromToken() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return {
      id: payload.sub || payload.id || payload.employee_id || null,
      level: payload.level || payload.role_level || 99,
      department_id: payload.department_id || null,
      name: payload.name || payload.full_name || null,
    };
  } catch {
    return null;
  }
}

/* ─── Helper to extract employee full name ─── */
function getEmployeeName(emp) {
  if (!emp) return "Unknown";
  if (emp.employee_name) return emp.employee_name;
  if (emp.f_name || emp.l_name)
    return `${emp.f_name || ""} ${emp.l_name || ""}`.trim();
  if (emp.name) return emp.name;
  return "Unknown";
}

/* ─── RBAC config ─── */
const LEVEL_CFG = {
  1: {
    label: "Super Admin",
    Icon: Crown,
    color: "bg-red-50 text-red-700 border-red-200",
    accent: "#ef4444",
  },
  2: {
    label: "CEO",
    Icon: Crown,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    accent: "#f59e0b",
  },
  3: {
    label: "HR Admin",
    Icon: Shield,
    color: "bg-violet-50 text-violet-700 border-violet-200",
    accent: "#7c3aed",
  },
  4: {
    label: "HR Officer",
    Icon: Shield,
    color: "bg-green-50 text-green-700 border-green-200",
    accent: "#10b981",
  },
  6: {
    label: "Dept Head",
    Icon: UserCheck,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    accent: "#3b82f6",
  },
};

function getRoleConfig(level) {
  const meta = LEVEL_CFG[level] || {
    label: `Level ${level}`,
    Icon: Users,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    accent: "#6b7280",
  };
  return {
    ...meta,
    seesAll: [1, 2, 3, 4].includes(level),
    isDeptHead: level === 6,
  };
}

/* ─── Status config ─── */
const STATUS_CFG = {
  Present: {
    badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    cal: "#10b981",
    row: "border-l-emerald-400",
  },
  Late: {
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
    cal: "#f59e0b",
    row: "border-l-amber-400",
  },
  Early: {
    badge: "bg-sky-100 text-sky-700 border border-sky-200",
    dot: "bg-sky-400",
    cal: "#38bdf8",
    row: "border-l-sky-400",
  },
  Absent: {
    badge: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
    cal: "#ef4444",
    row: "border-l-red-400",
  },
  Leave: {
    badge: "bg-slate-100 text-slate-600 border border-slate-200",
    dot: "bg-slate-400",
    cal: "#94a3b8",
    row: "border-l-slate-300",
  },
};
const ALL_STATUSES = ["Present", "Late", "Early", "Absent", "Leave"];

/* ─── Time helpers ─── */
function to12(t) {
  if (!t) return "—";
  const s = String(t).slice(0, 5);
  const [hS, mS] = s.split(":");
  const h = parseInt(hS, 10),
    m = parseInt(mS, 10);
  if (isNaN(h) || isNaN(m)) return String(t);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtHours(h) {
  if (h == null || h === 0) return "—";
  const hrs = Math.floor(h),
    min = Math.round((h - hrs) * 60);
  return min > 0 ? `${hrs}h ${min}m` : `${hrs}h`;
}
function toMins(t) {
  if (!t) return null;
  const [hS, mS] = String(t).split(":");
  const h = parseInt(hS, 10),
    m = parseInt(mS, 10);
  return isNaN(h) || isNaN(m) ? null : h * 60 + m;
}

/* ─── Build month list ─── */
function buildMonths() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "long", year: "numeric" }),
    };
  });
}
const MONTHS = buildMonths();
const CURR_MONTH = MONTHS[0].value;

/* ─── Dept palette ─── */
const DEPT_PALETTE = [
  "#6366f1",
  "#7c3aed",
  "#ea580c",
  "#16a34a",
  "#db2777",
  "#0891b2",
  "#d97706",
  "#e11d48",
];
function deptColor(id) {
  return DEPT_PALETTE[(id || 0) % DEPT_PALETTE.length];
}

/* ─── Shared primitives ─── */
function ErrMsg({ msg, onRetry }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 ea-left">
      <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-600">
          Could not load data
        </p>
        <p className="text-xs text-red-400 mt-0.5 wrap-break-word">{msg}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-red-500 hover:text-red-700 shrink-0 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Absent;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  );
}

/* ─── Employee Sidebar ─── */
function EmployeeSidebar({ employee, records, loading, onClose }) {
  if (!employee) return null;

  const todayRec =
    records?.find((r) => r.date === new Date().toISOString().split("T")[0]) ||
    records?.[0] ||
    null;

  const summary = useMemo(() => {
    if (!records?.length) return null;
    const counts = { Present: 0, Late: 0, Early: 0, Absent: 0, Leave: 0 };
    records.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    const total = records.length;
    const rate = total
      ? Math.round(
          ((counts.Present + counts.Late + counts.Early) / total) * 100,
        )
      : 0;
    return { ...counts, total, rate };
  }, [records]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm ea-fade"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 bottom-0 z-51 w-full sm:w-100 bg-white shadow-2xl flex flex-col ea-slide">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-800">
            Employee Profile
          </p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto ea-scroll px-6 py-5 space-y-5">
          {/* Profile banner */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 ea-fade">
            <img
              src={
                employee.image || `https://i.pravatar.cc/150?u=${employee.id}`
              }
              alt={getEmployeeName(employee)}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow shrink-0"
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-base leading-tight truncate">
                {getEmployeeName(employee)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {employee.designation || "—"}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {employee.dept_name && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
                    {employee.dept_name}
                  </span>
                )}
                {employee.employment_status && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                    {employee.employment_status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Today's record */}
          {loading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 size={14} className="ea-spin text-indigo-400" />
              <p className="text-xs text-gray-400">Loading attendance…</p>
            </div>
          ) : todayRec ? (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2.5">
                Latest Record
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Status",
                    value: <StatusPill status={todayRec.status} />,
                    bg: "bg-gray-50",
                  },
                  {
                    label: "In",
                    value: (
                      <span className="ea-mono text-sm font-bold text-gray-900">
                        {to12(todayRec.in_time)}
                      </span>
                    ),
                    bg: "bg-emerald-50",
                  },
                  {
                    label: "Out",
                    value: (
                      <span className="ea-mono text-sm font-bold text-gray-900">
                        {to12(todayRec.out_time)}
                      </span>
                    ),
                    bg: "bg-rose-50",
                  },
                ].map(({ label, value, bg }) => (
                  <div
                    key={label}
                    className={`rounded-xl p-3 text-center ${bg}`}
                  >
                    <p className="text-[10px] text-gray-400 mb-1.5">{label}</p>
                    {value}
                  </div>
                ))}
              </div>
              {todayRec.hours != null && (
                <div className="mt-2 flex items-center justify-center gap-1.5 py-2 bg-blue-50 rounded-xl">
                  <Timer size={12} className="text-blue-500" />
                  <span className="text-xs font-semibold text-blue-700">
                    {fmtHours(todayRec.hours)} worked
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
              <Clock size={14} className="text-gray-300" />
              <p className="text-xs text-gray-400">
                No attendance record found.
              </p>
            </div>
          )}

          {/* Monthly summary */}
          {summary && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2.5">
                Monthly Summary ({summary.total} days)
              </p>
              {/* Rate bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Attendance Rate</span>
                  <span
                    className="font-bold"
                    style={{
                      color:
                        summary.rate >= 90
                          ? "#10b981"
                          : summary.rate >= 75
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  >
                    {summary.rate}%
                  </span>
                </div>
                <div className="ea-bar">
                  <div
                    className="ea-bar-fill"
                    style={{
                      width: `${summary.rate}%`,
                      background:
                        summary.rate >= 90
                          ? "#10b981"
                          : summary.rate >= 75
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                {ALL_STATUSES.filter((s) => summary[s] > 0).map((s) => {
                  const cfg = STATUS_CFG[s];
                  return (
                    <div
                      key={s}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className="text-xs text-gray-600">{s}</span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
                      >
                        {summary[s]}d
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─── Summary widgets ─── */
function SummaryWidgets({ summary, loading, totalEmps }) {
  const stats = [
    {
      key: "present",
      label: "Present",
      grad: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50 border-emerald-100",
      ic: "text-emerald-600 bg-emerald-100",
      Icon: CheckCircle2,
    },
    {
      key: "late",
      label: "Late",
      grad: "from-amber-400 to-orange-500",
      bg: "bg-amber-50 border-amber-100",
      ic: "text-amber-600 bg-amber-100",
      Icon: Clock,
    },
    {
      key: "early",
      label: "Early",
      grad: "from-sky-400 to-blue-500",
      bg: "bg-sky-50 border-sky-100",
      ic: "text-sky-600 bg-sky-100",
      Icon: Zap,
    },
    {
      key: "absent",
      label: "Absent",
      grad: "from-red-400 to-rose-500",
      bg: "bg-red-50 border-red-100",
      ic: "text-red-500 bg-red-100",
      Icon: XCircle,
    },
    {
      key: "leave",
      label: "On Leave",
      grad: "from-slate-400 to-gray-500",
      bg: "bg-slate-50 border-slate-100",
      ic: "text-slate-500 bg-slate-100",
      Icon: Calendar,
    },
  ];

  const rate = summary?.rate ?? 0;
  const rateColor = rate >= 90 ? "#10b981" : rate >= 75 ? "#f59e0b" : "#ef4444";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5 ea-stagger">
      {stats.map(({ key, label, grad, bg, ic, Icon }) => {
        const val = summary?.[key] ?? null;
        const tot = summary?.total_days ?? totalEmps ?? null;
        const pct = tot && val != null ? Math.round((val / tot) * 100) : 0;
        return (
          <div
            key={key}
            className={`ea-card p-4 flex flex-col gap-3 border ${bg}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ic}`}
              >
                <Icon size={14} />
              </span>
              {loading ? (
                <div className="w-8 h-6 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-gray-900 ea-mono">
                  {val ?? "—"}
                </span>
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
                {label}
              </p>
              <div className="ea-bar">
                <div
                  className="ea-bar-fill"
                  style={{
                    width: loading ? "0%" : `${pct}%`,
                    background: `linear-gradient(90deg, var(--from), var(--to))`,
                    backgroundImage: `linear-gradient(90deg, ${grad.includes("emerald") ? "#10b981,#14b8a6" : grad.includes("amber") ? "#fbbf24,#f97316" : grad.includes("sky") ? "#38bdf8,#3b82f6" : grad.includes("red") ? "#f87171,#fb7185" : "#94a3b8,#6b7280"})`,
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {pct}% of {tot ?? "—"}
              </p>
            </div>
          </div>
        );
      })}

      {/* Rate widget */}
      <div className="ea-card p-4 flex flex-col border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <TrendingUp size={14} className="text-gray-500" />
          </span>
        </div>
        {loading ? (
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <>
            <p
              className="text-2xl font-bold ea-mono"
              style={{ color: rateColor }}
            >
              {rate}%
            </p>
            <p
              className="text-[11px] font-semibold mt-0.5"
              style={{ color: rateColor }}
            >
              {rate >= 90
                ? "Excellent"
                : rate >= 75
                  ? "Good"
                  : "Needs Attention"}
            </p>
            <div className="mt-auto pt-2">
              <div className="ea-bar">
                <div
                  className="ea-bar-fill"
                  style={{ width: `${rate}%`, background: rateColor }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Dept breakdown chart ─── */
function DeptBreakdown({ employees, records, depts, filterDept, onDeptClick }) {
  const breakdown = useMemo(() => {
    return depts
      .map((d) => {
        const dEmps = employees.filter((e) => e.department_id === d.id);
        const dRecords = records.filter((r) =>
          dEmps.some(
            (e) => String(e.employee_id || e.id) === String(r.employee_id),
          ),
        );
        const present = dRecords.filter((r) =>
          ["Present", "Late", "Early"].includes(r.status),
        ).length;
        const total = dEmps.length;
        const pct = total ? Math.round((present / total) * 100) : 0;
        return { id: d.id, name: d.department, total, present, pct };
      })
      .filter((d) => d.total > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [employees, records, depts]);

  if (!breakdown.length) return null;

  return (
    <div className="ea-card p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">
          Attendance by Department
        </p>
        <p className="text-[10px] text-gray-400">click to filter</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
        {breakdown.map(({ id, name, total, present, pct }) => {
          const active = filterDept === String(id);
          const color = deptColor(id);
          return (
            <div
              key={id}
              onClick={() => onDeptClick(active ? "All" : String(id))}
              className={`flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1.5 transition-colors ${active ? "bg-indigo-50" : "hover:bg-gray-50"}`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span
                className={`w-28 text-xs font-medium truncate shrink-0 ${active ? "text-indigo-700" : "text-gray-600"}`}
              >
                {name}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: active ? "#6366f1" : color + "cc",
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 ea-mono whitespace-nowrap w-16 text-right">
                {present}/{total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Records Table ─── */
const PAGE_SIZE = 12;

function RecordsTable({
  records,
  employees,
  externalDeptFilter,
  depts,
  loading,
  error,
  onRetry,
  onViewEmployee,
  month,
  onViewEmployeePage,
  onMonthChange,
  role,
}) {
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterMode, setFilterMode] = useState("All");
  const [page, setPage] = useState(1);

  const reset = (fn) => {
    fn();
    setPage(1);
  };

  /* Records from admin/records are already enriched — use directly */
  const enriched = useMemo(
    () =>
      records.map((r) => ({
        ...r,
        emp_name:
          r.employee_name ||
          `${r.f_name || ""} ${r.l_name || ""}`.trim() ||
          `#${r.employee_id}`,
        dept_name: r.department_name || "—",
        dept_id: r.department_id ?? r.dept_id ?? null,
        emp_image: r.image || null,
      })),
    [records],
  );

  useEffect(() => {
    if (externalDeptFilter) {
      setFilterDept(externalDeptFilter);
      setPage(1);
    }
  }, [externalDeptFilter]);

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return enriched.filter(
      (r) =>
        (filterStatus === "All" || r.status === filterStatus) &&
        (filterDept === "All" ||
          String(r.dept_id || "") === String(filterDept)) &&
        (filterMode === "All" || r.attendance_mode === filterMode) &&
        (!lq ||
          r.emp_name?.toLowerCase().includes(lq) ||
          r.dept_name?.toLowerCase().includes(lq) ||
          String(r.employee_id).includes(lq) ||
          r.date?.includes(lq)),
    );
  }, [enriched, q, filterStatus, filterDept, filterMode]);

  const total = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pills = [
    filterStatus !== "All" && filterStatus,
    filterDept !== "All" &&
      depts.find((d) => String(d.id) === filterDept)?.department,
    filterMode !== "All" && filterMode,
    q && `"${q}"`,
  ].filter(Boolean);

  return (
    <div className="ea-card">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold text-gray-700 flex-1 min-w-20">
          Records
          {!loading && (
            <span className="ml-1.5 text-xs font-normal text-gray-400 ea-mono">
              ({filtered.length})
            </span>
          )}
        </p>

        {/* Month picker */}
        <select
          value={month}
          onChange={(e) => {
            onMonthChange(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-300 cursor-pointer text-gray-700 font-medium transition-colors"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative">
          <Search
            size={11}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={q}
            onChange={(e) => reset(() => setQ(e.target.value))}
            placeholder="Search…"
            className="pl-7 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none w-28 focus:border-indigo-300 transition-colors"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => reset(() => setFilterStatus(e.target.value))}
          className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none cursor-pointer text-gray-700 focus:border-indigo-300 transition-colors"
        >
          <option value="All">All Status</option>
          {ALL_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {/* Dept filter (only for seesAll) */}
        {role.seesAll && depts.length > 0 && (
          <select
            value={filterDept}
            onChange={(e) => reset(() => setFilterDept(e.target.value))}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none cursor-pointer text-gray-700 focus:border-indigo-300 transition-colors"
          >
            <option value="All">All Depts</option>
            {depts.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.department}
              </option>
            ))}
          </select>
        )}

        {/* Mode filter */}
        <select
          value={filterMode}
          onChange={(e) => reset(() => setFilterMode(e.target.value))}
          className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none cursor-pointer text-gray-700 focus:border-indigo-300 transition-colors"
        >
          <option value="All">All Modes</option>
          <option value="onsite">Onsite</option>
          <option value="remote">Remote</option>
        </select>

        {pills.length > 0 && (
          <button
            onClick={() => {
              setQ("");
              setFilterStatus("All");
              setFilterDept("All");
              setFilterMode("All");
              setPage(1);
            }}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <X size={10} /> Clear
          </button>
        )}
      </div>

      {/* Active pills */}
      {pills.length > 0 && (
        <div className="px-5 py-2.5 border-b border-gray-50 flex flex-wrap gap-1.5">
          {pills.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-[11px] font-semibold rounded-full"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="px-5 py-3">
          <ErrMsg msg={error} onRetry={onRetry} />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto ea-scroll">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {[
                ["Employee", "text-left pl-5"],
                ["Department", "text-center"],
                ["Date", "text-center"],
                ["Status", "text-center"],
                ["Check In", "text-center"],
                ["Check Out", "text-center"],
                ["Hours", "text-center"],
                ["Mode", "text-center"],
                ["", "text-center pr-5"],
              ].map(([h, cls]) => (
                <th
                  key={h}
                  className={`py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap ${cls}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/80">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <Loader2
                    size={22}
                    className="mx-auto ea-spin text-indigo-400 mb-3"
                  />
                  <p className="text-sm text-gray-400">Loading records…</p>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <BarChart2 size={26} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">No records found.</p>
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const cfg = STATUS_CFG[r.status] || {};
                const outCrossedMidnight =
                  r.in_time &&
                  r.out_time &&
                  (toMins(r.out_time) ?? 9999) < (toMins(r.in_time) ?? 0);
                const dObj = new Date(r.date + "T12:00:00");
                const dFmt = dObj.toLocaleDateString("default", {
                  month: "short",
                  day: "numeric",
                });
                const isWknd = [0, 6].includes(dObj.getDay());

                return (
                  <tr
                    key={`${r.id}-${i}`}
                    className={`ea-row border-l-2 ${cfg.row || "border-l-transparent"} ${isWknd ? "opacity-50" : ""} ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                  >
                    {/* Employee */}
                    <td className="py-3 px-3 pl-5 whitespace-nowrap">
                      <div
                        className="flex items-center gap-2.5"
                        onClick={() =>
                          onViewEmployeePage(r.employee_db_id || r.employee_id)
                        }
                      >
                        <img
                          src={
                            r.emp_image ||
                            `https://i.pravatar.cc/150?u=${r.employee_id}`
                          }
                          alt={r.emp_name}
                          className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm shrink-0 cursor-pointer"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-tight cursor-pointer">
                            {r.emp_name}
                          </p>
                          <p className="text-[10px] text-gray-400 ea-mono">
                            #{r.employee_id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Dept */}
                    <td className="py-3 px-3 text-center">
                      {r.dept_name !== "—" ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 whitespace-nowrap">
                          {r.dept_name}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-center">
                      <p className="text-xs font-semibold text-gray-700">
                        {dFmt}
                      </p>
                      <p className="text-[10px] text-gray-400 ea-mono">
                        {r.date}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <StatusPill status={r.status} />
                    </td>

                    {/* Check In */}
                    <td className="py-3 px-3 text-center">
                      <p className="text-xs font-semibold text-gray-700 ea-mono">
                        {to12(r.in_time)}
                      </p>
                    </td>

                    {/* Check Out */}
                    <td className="py-3 px-3 text-center">
                      <p className="text-xs font-semibold text-gray-700 ea-mono">
                        {to12(r.out_time)}
                      </p>
                      {outCrossedMidnight && (
                        <p className="text-[9px] text-violet-500 font-semibold">
                          +1 day
                        </p>
                      )}
                    </td>

                    {/* Hours */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs font-bold text-gray-800 ea-mono">
                        {fmtHours(r.hours)}
                      </span>
                    </td>

                    {/* Mode */}
                    <td className="py-3 px-3 text-center">
                      {r.attendance_mode ? (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            r.attendance_mode === "remote"
                              ? "bg-teal-50 text-teal-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {r.attendance_mode}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 pr-5 text-center">
                      <button
                        onClick={() =>
                          onViewEmployee(r.employee_db_id || r.employee_id)
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors mx-auto"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 1 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-50">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gray-100"
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <span className="text-xs text-gray-400 ea-mono">
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(total, p + 1))}
            disabled={page === total}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gray-100"
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Root Page
═══════════════════════════════════════════════════════════════ */
export default function EmployeesAttendancePage() {
  const auth = useMemo(() => getAuthFromToken(), []);
  const role = useMemo(() => getRoleConfig(auth?.level ?? 99), [auth]);
  const RoleIcon = role.Icon;
  const [attendanceViewEmpId, setAttendanceViewEmpId] = useState(null);
  const [month, setMonth] = useState(CURR_MONTH);

  /* Data */
  const [employees, setEmployees] = useState([]);
  const [depts, setDepts] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  /* Loading / error */
  const [empLoad, setEmpLoad] = useState(true);
  const [recLoad, setRecLoad] = useState(true);
  const [sumLoad, setSumLoad] = useState(true);
  const [recErr, setRecErr] = useState(null);

  /* Sidebar */
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [sidebarEmp, setSidebarEmp] = useState(null);
  const [sidebarRecords, setSidebarRecords] = useState([]);
  const [sidebarRecLoading, setSidebarRecLoading] = useState(false);

  /* Dept filter from breakdown chart */
  const [chartDeptFilter, setChartDeptFilter] = useState("All");

  /* ── Fetch employees ── */
  const fetchEmployees = useCallback(async () => {
    setEmpLoad(true);
    try {
      const res = await fetch(API.GetAllEmployees, { headers: getHeaders() });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      let list = Array.isArray(data) ? data : data.employees || [];

      /* Dept head: scope to own dept, Leads + Interns only */
      if (role.isDeptHead && auth?.department_id) {
        list = list.filter(
          (e) =>
            e.department_id === auth.department_id &&
            ["Lead", "Intern"].includes(e.emp_type || e.role?.name || ""),
        );
      }
      setEmployees(list);
    } catch (e) {
      console.warn("[Employees]", e.message);
    } finally {
      setEmpLoad(false);
    }
  }, [role, auth]);

  /* ── Fetch departments ── */
  const fetchDepts = useCallback(async () => {
    try {
      const res = await fetch(API.ListDepartment, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setDepts(Array.isArray(data) ? data : data.departments || []);
    } catch {
      /* silent */
    }
  }, []);

  /* ── Fetch attendance records for current month ── */
  const fetchRecords = useCallback(async () => {
    setRecLoad(true);
    setRecErr(null);
    try {
      /* Use admin/records endpoint — already enriched with employee info
         and already filtered to system employees only (no ZKT ghosts).
         For dept head: pass department_id so the server scopes it. */
      const base =
        typeof API.AdminAttendanceRecords === "string"
          ? API.AdminAttendanceRecords
          : `${(API.GetAllEmployees || "").replace("/employees", "")}/attendance/admin/records`;

      const params = new URLSearchParams({ month, limit: "500" });
      if (role.isDeptHead && auth?.department_id) {
        params.set("department_id", String(auth.department_id));
      }

      const res = await fetch(`${base}?${params}`, { headers: getHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.records || [];

      setRecords(list);
    } catch (e) {
      setRecErr(e.message);
    } finally {
      setRecLoad(false);
    }
  }, [month, role, auth]);

  /* ── Fetch summary ── */
  const fetchSummary = useCallback(async () => {
    setSumLoad(true);
    try {
      const base =
        typeof API.AdminAttendanceSummary === "string"
          ? API.AdminAttendanceSummary
          : `${(API.GetAllEmployees || "").replace("/employees", "")}/attendance/admin/summary`;

      const params = new URLSearchParams({ month });
      if (role.isDeptHead && auth?.department_id) {
        params.set("department_id", String(auth.department_id));
      }

      const res = await fetch(`${base}?${params}`, { headers: getHeaders() });
      if (!res.ok) throw new Error(res.status);
      setSummary(await res.json());
    } catch {
      setSummary(null);
    } finally {
      setSumLoad(false);
    }
  }, [month, role, auth]);

  useEffect(() => {
    fetchEmployees();
    fetchDepts();
  }, [fetchEmployees, fetchDepts]);
  useEffect(() => {
    fetchRecords();
    fetchSummary();
  }, [fetchRecords, fetchSummary]);

  /* ── Sidebar: fetch employee's records ── */
  const openSidebar = useCallback(
    async (empDbId) => {
      /* empDbId here is employee_db_id from the enriched record (= Employee.id) */
      const emp = employees.find((e) => e.id === empDbId);
      if (!emp) return;
      setSidebarEmp({
        ...emp,
        name: `${emp.f_name} ${emp.l_name}`,
        dept_name: depts.find((d) => d.id === emp.department_id)?.department,
      });
      setSidebarRecords([]);
      setSidebarRecLoading(true);
      setSelectedEmpId(empDbId);

      try {
        /* Reuse admin/records endpoint scoped to one employee */
        const token = localStorage.getItem("access_token");
        const headers = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const base =
          typeof API.AdminAttendanceRecords === "string"
            ? API.AdminAttendanceRecords
            : `${(API.GetAllEmployees || "").replace("/employees", "")}/attendance/admin/records`;

        const res = await fetch(
          `${base}?employee_id=${empDbId}&month=${month}`,
          { headers },
        );
        if (res.ok) {
          const data = await res.json();
          setSidebarRecords(Array.isArray(data) ? data : data.records || []);
        }
      } catch {
        /* show partial */
      } finally {
        setSidebarRecLoading(false);
      }
    },
    [employees, depts, month],
  );

  /* ── Computed stats from records (fallback if no summary API) ── */
  const computedStats = useMemo(() => {
    if (summary) return summary;
    if (!records.length) return null;
    const counts = { present: 0, late: 0, early: 0, absent: 0, leave: 0 };
    records.forEach((r) => {
      const k = r.status?.toLowerCase();
      if (k in counts) counts[k]++;
    });
    const totalDays = records.length;
    const rate = totalDays
      ? Math.round(
          ((counts.present + counts.late + counts.early) / totalDays) * 100,
        )
      : 0;
    return { ...counts, total_days: totalDays, rate };
  }, [summary, records]);

  const refreshAll = () => {
    fetchRecords();
    fetchSummary();
  };

  if (attendanceViewEmpId) {
    return (
      <MyAttendancePage
        employeeId={attendanceViewEmpId}
        onBack={() => setAttendanceViewEmpId(null)}
      />
    );
  }

  return (
    <div
      className="ea-page min-h-screen px-5 sm:px-8 py-10"
      style={{
        background:
          "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f0f4ff 100%)",
      }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7 ea-fade">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Activity size={17} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Employees Attendance
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-12">
            {role.seesAll
              ? "Organisation-wide attendance overview"
              : `${role.label} view — your department`}
            {" · "}
            {MONTHS.find((m) => m.value === month)?.label}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start ml-12 sm:ml-0">
          {/* Role badge */}
          {auth && (
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${role.color}`}
            >
              <RoleIcon size={12} />
              <span>{role.label}</span>
              {role.isDeptHead && auth.department_id && (
                <span className="opacity-60 ea-mono">
                  · Dept #{auth.department_id}
                </span>
              )}
            </div>
          )}

          {/* Month picker (header) */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-300 cursor-pointer text-gray-600 font-medium shadow-sm transition-colors"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            onClick={refreshAll}
            disabled={recLoad}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-500 text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-40 group"
          >
            <RefreshCw
              size={12}
              className={`${recLoad ? "ea-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Dept head restricted banner */}
      {role.isDeptHead && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-5 ea-left">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <UserCheck size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Department Head View
            </p>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
              You are viewing <strong>Leads</strong> and{" "}
              <strong>Interns</strong> in your department. Full-time employee
              records are managed by HR.
            </p>
          </div>
        </div>
      )}

      {/* Summary widgets */}
      <SummaryWidgets
        summary={computedStats}
        loading={sumLoad && recLoad}
        totalEmps={employees.length}
      />

      {/* Dept breakdown (seesAll only) */}
      {role.seesAll && !recLoad && records.length > 0 && (
        <DeptBreakdown
          employees={employees}
          records={records}
          depts={depts}
          filterDept={chartDeptFilter}
          onDeptClick={setChartDeptFilter}
        />
      )}

      {/* Records table */}
      <RecordsTable
        records={records}
        employees={employees}
        depts={depts}
        loading={recLoad}
        error={recErr}
        onRetry={fetchRecords}
        onViewEmployee={openSidebar} // eye button → sidebar (unchanged)
        onViewEmployeePage={setAttendanceViewEmpId} // name click → full page (new)
        month={month}
        onMonthChange={setMonth}
        externalDeptFilter={chartDeptFilter}
        role={role}
      />

      {/* Employee sidebar */}
      {selectedEmpId && (
        <EmployeeSidebar
          employee={sidebarEmp}
          records={sidebarRecords}
          loading={sidebarRecLoading}
          onClose={() => {
            setSelectedEmpId(null);
            setSidebarEmp(null);
            setSidebarRecords([]);
          }}
        />
      )}
    </div>
  );
}
