/**
 * DepartmentPage.jsx
 * HR Admin — Department Management
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 *  REQUIRED APIs  (import from components/Apis.js)
 * ├─────────────────────────────────────────────────────────────────────┤
 *  ListDepartment    : GET    `${mainOrigin}/departments`
 *  createDepartment  : POST   `${mainOrigin}/departments`
 *  DepartmentDetails : GET    `${mainOrigin}/departments/:id`
 *  deleteDepartment  : DELETE `${mainOrigin}/departments/:id`
 *  updateDepartment  : PUT    `${mainOrigin}/departments/:id`   ← assign head via { head_id }
 *  employees         : GET    `${mainOrigin}/employees`         ← all employees for head picker
 *
 * ├─────────────────────────────────────────────────────────────────────┤
 *  PAYLOAD — Create Department
 *    { department: string, head_id?: number | null, extra_data?: object }
 *
 *  PAYLOAD — Update Department (name or head)
 *    { department?: string, head_id?: number | null, extra_data?: object }
 *
 *  PAYLOAD — Assign / Remove Head
 *    { head_id: number | null }
 *
 * ├─────────────────────────────────────────────────────────────────────┤
 *  Department shape from backend
 *  {
 *    id           : number
 *    department   : string          ← department name
 *    head_id      : number | null
 *    created_at   : string
 *    extra_data   : object | null
 *    head         : Employee | null ← nested from relationship (if API includes it)
 *    employees    : Employee[]      ← nested from relationship (if API includes it)
 *  }
 *
 *  Employee shape (from /employees)
 *  {
 *    id           : number
 *    name         : string
 *    email        : string
 *    position     : string
 *    department   : string | { id, department }
 *    department_id: number
 *    emp_type     : string  "Full-time" | "Lead" | "Intern" | "Contract"
 *    status       : string  "Active" | "On Leave" | "Probation" | "Terminated"
 *    join_date    : string
 *  }
 * └─────────────────────────────────────────────────────────────────────┘
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  Edit3,
  Trash2,
  Eye,
  PlusCircle,
  Send,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  UserCog,
  UserCheck,
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight as CRight,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Animations ─── */
const _STYLES = `
  @keyframes _fi  { from{opacity:0}                            to{opacity:1} }
  @keyframes _su  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes _sir { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes _sp  { to{transform:rotate(360deg)} }
  .dp-fi  { animation:_fi  .2s ease-out; }
  .dp-su  { animation:_su  .25s ease-out both; }
  .dp-sir { animation:_sir .3s cubic-bezier(.4,0,.2,1); }
  .dp-sp  { animation:_sp  .85s linear infinite; }
`;
if (
  typeof document !== "undefined" &&
  !document.getElementById("__dp_styles__")
) {
  const el = Object.assign(document.createElement("style"), {
    id: "__dp_styles__",
    textContent: _STYLES,
  });
  document.head.appendChild(el);
}

/* ─── Dept visual metadata (client-side decoration only) ─── */
const DEPT_PALETTE = [
  {
    color: "bg-indigo-50 text-indigo-700",
    border: "border-indigo-200",
    accent: "#6366f1",
    icon: "⚙️",
  },
  {
    color: "bg-violet-50 text-violet-700",
    border: "border-violet-200",
    accent: "#7c3aed",
    icon: "👥",
  },
  {
    color: "bg-orange-50 text-orange-700",
    border: "border-orange-200",
    accent: "#ea580c",
    icon: "📈",
  },
  {
    color: "bg-green-50 text-green-700",
    border: "border-green-200",
    accent: "#16a34a",
    icon: "💰",
  },
  {
    color: "bg-pink-50 text-pink-700",
    border: "border-pink-200",
    accent: "#db2777",
    icon: "🎨",
  },
  {
    color: "bg-cyan-50 text-cyan-700",
    border: "border-cyan-200",
    accent: "#0891b2",
    icon: "🔧",
  },
  {
    color: "bg-amber-50 text-amber-700",
    border: "border-amber-200",
    accent: "#d97706",
    icon: "📦",
  },
  {
    color: "bg-rose-50 text-rose-700",
    border: "border-rose-200",
    accent: "#e11d48",
    icon: "🏢",
  },
];
/* Deterministic palette per dept id */
function dPalette(id) {
  return DEPT_PALETTE[(id || 0) % DEPT_PALETTE.length];
}

const EMP_TYPE_COLOR = {
  "Full-time": "bg-blue-50 text-blue-700 border-blue-100",
  Lead: "bg-purple-50 text-purple-700 border-purple-100",
  Intern: "bg-amber-50 text-amber-700 border-amber-100",
  Contract: "bg-teal-50 text-teal-700 border-teal-100",
};
const EMP_STATUS_CFG = {
  Active: { badge: "bg-green-100 text-green-800", dot: "bg-green-500" },
  "On Leave": { badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-400" },
  Probation: { badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  Terminated: { badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

/* ─── Helpers ─── */
function empName(e) {
  return e?.name || e?.f_name + " " + e?.l_name || `Employee #${e?.id}`;
}
function empType(e) {
  return e?.emp_type || e?.empType || e?.type || "Full-time";
}
function empStatus(e) {
  return e?.status || "Active";
}
function empDeptId(e) {
  return e?.department_id || e?.department?.id || null;
}

/* ─── Shared UI ─── */
function Widget({ icon: Icon, title, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-center">
      <span
        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={18} />
      </span>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Card({ title, children, action, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          {title && (
            <h2 className="text-sm font-medium text-gray-500">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const cfg = {
    success: { bg: "bg-emerald-600", I: CheckCircle2 },
    error: { bg: "bg-red-500", I: XCircle },
    info: { bg: "bg-blue-600", I: Info },
  }[toast.type] || { bg: "bg-gray-800", I: Info };
  const { bg, I } = cfg;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-2xl text-sm font-medium pointer-events-none dp-fi ${bg}`}
    >
      <I size={16} /> {toast.msg}
    </div>
  );
}

function ErrBanner({ msg, onRetry }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-700">Error</p>
        <p className="text-xs text-red-400 mt-0.5">{msg}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-red-600 hover:underline shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* ─── Employee Sidebar ─── */
function EmpSidebar({ employee, onClose }) {
  if (!employee) return null;
  const stCfg = EMP_STATUS_CFG[empStatus(employee)] || {};
  const type = empType(employee);

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm dp-fi"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 bottom-0 z-[201] w-full sm:w-[360px] bg-white shadow-2xl flex flex-col dp-sir">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900 text-sm">
            Employee Profile
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
            <img
              src={`https://i.pravatar.cc/150?u=${employee.id}`}
              alt={empName(employee)}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow shrink-0"
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-base">
                {empName(employee)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {employee.position}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border ${EMP_TYPE_COLOR[type] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                >
                  {type}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${stCfg.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${stCfg.dot}`} />{" "}
                  {empStatus(employee)}
                </span>
              </div>
            </div>
          </div>
          {[
            { Icon: Mail, label: "Email", value: employee.email },
            { Icon: Phone, label: "Phone", value: employee.phone },
            { Icon: MapPin, label: "Location", value: employee.location },
            {
              Icon: Calendar,
              label: "Joined",
              value: employee.join_date || employee.joinDate,
            },
          ]
            .filter((r) => r.value)
            .map(({ Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
                Employee ID
              </p>
              <p className="text-sm font-medium text-gray-800">
                #{employee.id}
              </p>
            </div>
            {employee.salary && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
                  Salary
                </p>
                <p className="text-sm font-medium text-gray-800">
                  PKR {Number(employee.salary).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─── Create/Edit Dept Modal ─── */
function DeptFormModal({ dept, onClose, onSaved, showToast }) {
  const isEdit = !!dept;
  const [name, setName] = useState(dept?.department || "");
  const [nameErr, setNameErr] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameErr("Department name is required.");
      return;
    }
    setSaving(true);
    const payload = {
      department: name.trim(),
      extra_data: dept?.extra_data || null,
    };
    try {
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const url = isEdit ? API.updateDepartment(dept.id) : API.createDepartment;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Request failed (${res.status})`);
      }
      const saved = await res.json();
      onSaved(saved, isEdit);
      showToast(
        isEdit ? "Department updated." : "Department created.",
        "success",
      );
      onClose();
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm dp-fi px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            {isEdit ? (
              <Edit3 size={15} className="text-blue-600" />
            ) : (
              <PlusCircle size={15} className="text-blue-600" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {isEdit ? "Edit Department" : "New Department"}
            </p>
            <p className="text-[11px] text-gray-400">
              {isEdit ? `Editing: ${dept.department}` : "Add a new department"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">
            Department Name *
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameErr("");
            }}
            placeholder="e.g. Engineering, HR, Sales…"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition placeholder-gray-300 ${nameErr ? "border-red-300" : "border-gray-200"}`}
          />
          {nameErr && <p className="text-xs text-red-500 mt-1">{nameErr}</p>}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="dp-sp" />
                {isEdit ? "Saving…" : "Creating…"}
              </>
            ) : (
              <>
                <Send size={14} />
                {isEdit ? "Save" : "Create"}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Dept Confirm ─── */
function DeleteConfirm({ dept, deleting, onConfirm, onCancel }) {
  if (!dept) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm dp-fi px-4">
      <div className="bg-white rounded-2xl p-6 w-[380px] max-w-full shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">
          Delete Department?
        </h2>
        <p className="text-sm font-bold text-gray-800 text-center mb-4">
          "{dept.department}"
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2 mb-5">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Employees assigned to this department may be affected. This cannot
            be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 size={14} className="dp-sp" />
                Deleting…
              </>
            ) : (
              "Yes, Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Assign Head Modal ─── */
function AssignHeadModal({ dept, allEmployees, onClose, onAssign, assigning }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(dept.head_id || null);

  /* Show employees that belong to this department (match by department_id or department name) */
  const candidates = useMemo(() => {
    const inDept = allEmployees
      .filter((e) => {
        const dId = empDeptId(e);
        if (dId) return dId === dept.id;
        const dName =
          typeof e.department === "string"
            ? e.department
            : e.department?.department;
        return dName?.toLowerCase() === dept.department?.toLowerCase();
      })
      .filter((e) => empStatus(e) === "Active");

    if (!search) return inDept;
    const q = search.toLowerCase();
    return inDept.filter(
      (e) =>
        empName(e).toLowerCase().includes(q) ||
        e.position?.toLowerCase().includes(q),
    );
  }, [allEmployees, dept, search]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm dp-fi px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${dPalette(dept.id).color}`}
          >
            {dPalette(dept.id).icon}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              Assign Department Head
            </p>
            <p className="text-[11px] text-gray-400">{dept.department}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search active employees in this dept…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {/* Remove head option */}
          <div
            onClick={() => setSelected(null)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition ${selected === null ? "border-red-200 bg-red-50" : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"}`}
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <UserCheck size={16} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">
                No Head Assigned
              </p>
              <p className="text-xs text-gray-400">Remove current assignment</p>
            </div>
            {selected === null && (
              <CheckCircle2 size={16} className="text-red-500 shrink-0" />
            )}
          </div>

          {candidates.length === 0 && search === "" && (
            <div className="text-center py-8">
              <Users size={24} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">
                No active employees in {dept.department}
              </p>
            </div>
          )}
          {candidates.length === 0 && search !== "" && (
            <div className="text-center py-6 text-sm text-gray-400">
              No matches found.
            </div>
          )}

          {candidates.map((emp) => {
            const isSel = selected === emp.id;
            const type = empType(emp);
            return (
              <div
                key={emp.id}
                onClick={() => setSelected(emp.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition ${isSel ? "border-blue-300 bg-blue-50" : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"}`}
              >
                <img
                  src={`https://i.pravatar.cc/150?u=${emp.id}`}
                  alt={empName(emp)}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {empName(emp)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {emp.position}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border shrink-0 ${EMP_TYPE_COLOR[type] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                >
                  {type}
                </span>
                {isSel && (
                  <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                )}
                {console.log(candidates)}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => onAssign(dept.id, selected)}
            disabled={assigning}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {assigning ? (
              <>
                <Loader2 size={14} className="dp-sp" />
                Saving…
              </>
            ) : (
              <>
                <Send size={14} />
                Confirm Assignment
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={assigning}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
/* ─── Department Detail View ─── */
const DETAIL_PAGE_SIZE = 8;

function DepartmentDetail({
  dept,
  allEmployees,
  allDepts,
  onBack,
  onAssignHead,
  onEditDept,
}) {
  const palette = dPalette(dept.id);
  const deptEmps = useMemo(
    () =>
      allEmployees.filter((e) => {
        const dId = empDeptId(e);
        if (dId) return dId === dept.id;
        const dName =
          typeof e.department === "string"
            ? e.department
            : e.department?.department;
        return dName?.toLowerCase() === dept.department?.toLowerCase();
      }),
    [allEmployees, dept],
  );

  /* If head is embedded in dept.head, use it; else find by dept.head_id */
  const head =
    dept.head || allEmployees.find((e) => e.id === dept.head_id) || null;

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterSt, setFilterSt] = useState("All");
  const [viewEmp, setViewEmp] = useState(null);
  const [page, setPage] = useState(1);

  const stats = useMemo(
    () => ({
      total: deptEmps.length,
      active: deptEmps.filter((e) => empStatus(e) === "Active").length,
      onLeave: deptEmps.filter((e) => empStatus(e) === "On Leave").length,
      probation: deptEmps.filter((e) => empStatus(e) === "Probation").length,
      leads: deptEmps.filter((e) => empType(e) === "Lead").length,
      interns: deptEmps.filter((e) => empType(e) === "Intern").length,
      fullTime: deptEmps.filter((e) => empType(e) === "Full-time").length,
      contract: deptEmps.filter((e) => empType(e) === "Contract").length,
      avgSalary: deptEmps.length
        ? Math.round(
            deptEmps.reduce((s, e) => s + (e.salary || 0), 0) /
              deptEmps.length /
              1000,
          )
        : 0,
    }),
    [deptEmps],
  );

  const EMP_TYPES = ["Full-time", "Lead", "Intern", "Contract"];
  const EMP_STATUSES = ["Active", "On Leave", "Probation", "Terminated"];
  const typeBreakdown = EMP_TYPES.map((t) => ({
    type: t,
    count: deptEmps.filter((e) => empType(e) === t).length,
  })).filter((x) => x.count > 0);

  const filtered = deptEmps.filter(
    (e) =>
      (!search ||
        empName(e).toLowerCase().includes(search.toLowerCase()) ||
        e.position?.toLowerCase().includes(search.toLowerCase())) &&
      (filterType === "All" || empType(e) === filterType) &&
      (filterSt === "All" || empStatus(e) === filterSt),
  );
  const totalPages = Math.ceil(filtered.length / DETAIL_PAGE_SIZE);
  const paginated = filtered.slice(
    (page - 1) * DETAIL_PAGE_SIZE,
    page * DETAIL_PAGE_SIZE,
  );
  const sf = (fn) => {
    fn();
    setPage(1);
  };

  return (
    <div className="dp-su">
      {/* Back nav */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:border-gray-300 text-sm font-medium rounded-xl shadow-sm transition"
        >
          <ArrowLeft size={14} /> All Departments
        </button>
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${palette.color}`}
          >
            {palette.icon}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {dept.department}
            </h1>
            <p className="text-xs text-gray-400">
              ID #{dept.id} · Created{" "}
              {dept.created_at
                ? new Date(dept.created_at).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => onEditDept(dept)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:border-gray-300 text-sm font-medium rounded-xl shadow-sm transition"
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={onAssignHead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <UserCog size={15} /> {head ? "Change Head" : "Assign Head"}
          </button>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Widget
          icon={Users}
          title="Total Employees"
          value={stats.total}
          sub="In department"
          color="border-blue-200 bg-blue-50 text-blue-700"
        />
        <Widget
          icon={CheckCircle2}
          title="Active"
          value={stats.active}
          sub="Currently working"
          color="border-green-200 bg-green-50 text-green-700"
        />
        <Widget
          icon={Calendar}
          title="On Leave"
          value={stats.onLeave}
          sub="Away"
          color="border-yellow-200 bg-yellow-50 text-yellow-700"
        />
        <Widget
          icon={TrendingUp}
          title="Avg. Salary"
          value={`${stats.avgSalary}K`}
          sub="PKR / month"
          color="border-violet-200 bg-violet-50 text-violet-700"
        />
      </div>

      {/* 3-col info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Head card */}
        <Card title="Department Head">
          {head ? (
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="relative">
                <img
                  src={`https://i.pravatar.cc/150?u=${head.id}`}
                  alt={empName(head)}
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow border-2 border-white">
                  <Award size={12} className="text-white" />
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">
                  {empName(head)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{head.position}</p>
                <div className="flex justify-center gap-1.5 mt-2">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border ${EMP_TYPE_COLOR[empType(head)] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                  >
                    {empType(head)}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${EMP_STATUS_CFG[empStatus(head)]?.badge}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${EMP_STATUS_CFG[empStatus(head)]?.dot}`}
                    />{" "}
                    {empStatus(head)}
                  </span>
                </div>
              </div>
              <div className="w-full space-y-1.5">
                {[
                  { I: Mail, v: head.email },
                  { I: Phone, v: head.phone },
                  {
                    I: Calendar,
                    v:
                      head.join_date || head.joinDate
                        ? `Joined ${head.join_date || head.joinDate}`
                        : null,
                  },
                ]
                  .filter((r) => r.v)
                  .map(({ I, v }) => (
                    <div
                      key={v}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5"
                    >
                      <I size={12} className="text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-600 truncate">
                        {v}
                      </span>
                    </div>
                  ))}
              </div>
              <button
                onClick={onAssignHead}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Change Head
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <UserCheck size={26} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No head assigned</p>
              <button
                onClick={onAssignHead}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                + Assign a head
              </button>
            </div>
          )}
        </Card>

        {/* Dept info */}
        <Card title="Department Info">
          <div>
            {[
              { label: "Department", value: dept.department },
              { label: "Dept ID", value: `#${dept.id}` },
              {
                label: "Created",
                value: dept.created_at
                  ? new Date(dept.created_at).toLocaleDateString()
                  : "—",
              },
              {
                label: "Head ID",
                value: dept.head_id ? `#${dept.head_id}` : "Not assigned",
              },
              { label: "Total Staff", value: `${stats.total} employees` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-xs text-gray-400 font-medium">
                  {label}
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Composition */}
        <Card title="Team Composition">
          <div className="space-y-3">
            {typeBreakdown.map(({ type, count }) => {
              const pct = stats.total
                ? Math.round((count / stats.total) * 100)
                : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border ${EMP_TYPE_COLOR[type] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                    >
                      {type}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                      {count}{" "}
                      <span className="text-gray-400 font-normal">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: palette.accent }}
                    />
                  </div>
                </div>
              );
            })}
            {typeBreakdown.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">
                No employees yet
              </p>
            )}
            {typeBreakdown.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">
                  Status breakdown
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Active", val: stats.active, dot: "bg-green-500" },
                    {
                      label: "On Leave",
                      val: stats.onLeave,
                      dot: "bg-yellow-400",
                    },
                    {
                      label: "Probation",
                      val: stats.probation,
                      dot: "bg-blue-500",
                    },
                  ].map(({ label, val, dot }) => (
                    <div
                      key={label}
                      className="flex items-center gap-1.5 text-xs text-gray-600"
                    >
                      <span className={`w-2 h-2 rounded-full ${dot}`} /> {label}
                      : <span className="font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Employee table */}
      <Card
        title={`Employees — ${dept.department}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => sf(() => setSearch(e.target.value))}
                placeholder="Search…"
                className="pl-7 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none w-32 focus:border-gray-400 transition"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => sf(() => setFilterType(e.target.value))}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer text-gray-700"
            >
              <option value="All">All Types</option>
              {["Full-time", "Lead", "Intern", "Contract"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={filterSt}
              onChange={(e) => sf(() => setFilterSt(e.target.value))}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer text-gray-700"
            >
              <option value="All">All Statuses</option>
              {["Active", "On Leave", "Probation", "Terminated"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Employee", "Position", "Type", "Status", "Joined", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${i <= 1 ? "text-left" : "text-center"}`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Users size={24} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">No employees found.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((emp, i) => {
                  const stCfg = EMP_STATUS_CFG[empStatus(emp)] || {};
                  const type = empType(emp);
                  const isHead = emp.id === dept.head_id;
                  return (
                    <tr
                      key={emp.id}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/20 transition border-b border-gray-50 last:border-b-0`}
                    >
                      <td
                        className="py-3 px-4 cursor-pointer"
                        onClick={() => setViewEmp(emp)}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="relative shrink-0">
                            <img
                              src={`https://i.pravatar.cc/150?u=${emp.id}`}
                              alt={empName(emp)}
                              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            {isHead && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border border-white">
                                <Award size={9} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-600 hover:underline whitespace-nowrap">
                              {empName(emp)}
                            </p>
                            <p className="text-xs text-gray-400">
                              #{emp.id}
                              {isHead && (
                                <span className="ml-1 text-amber-600 font-semibold">
                                  · Head
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                        {emp.position || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${EMP_TYPE_COLOR[type] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                        >
                          {type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${stCfg.badge}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${stCfg.dot}`}
                          />{" "}
                          {empStatus(emp)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap">
                        {emp.join_date || emp.joinDate || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setViewEmp(emp)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition mx-auto"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition text-gray-600"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs text-gray-500">
              {(page - 1) * DETAIL_PAGE_SIZE + 1}–
              {Math.min(page * DETAIL_PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition text-gray-600"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </Card>

      {viewEmp && (
        <EmpSidebar employee={viewEmp} onClose={() => setViewEmp(null)} />
      )}
    </div>
  );
}

/* ─── Department Grid Card ─── */
function DeptCard({ dept, allEmployees, onClick, onEdit, onDelete, idx }) {
  const palette = dPalette(dept.id);
  const deptEmps = allEmployees.filter((e) => {
    const dId = empDeptId(e);
    if (dId) return dId === dept.id;
    const dName =
      typeof e.department === "string"
        ? e.department
        : e.department?.department;
    return dName?.toLowerCase() === dept.department?.toLowerCase();
  });
  const head =
    dept.head || allEmployees.find((e) => e.id === dept.head_id) || null;
  const active = deptEmps.filter((e) => empStatus(e) === "Active").length;
  const leads = deptEmps.filter((e) => empType(e) === "Lead").length;
  const interns = deptEmps.filter((e) => empType(e) === "Intern").length;

  return (
    <div
      className="dp-su bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-100 hover:shadow-md transition group overflow-hidden"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      {/* Accent strip */}
      <div className="h-1.5" style={{ background: palette.accent }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex items-center gap-3 cursor-pointer min-w-0"
            onClick={onClick}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${palette.color}`}
            >
              {palette.icon}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-base leading-tight truncate">
                {dept.department}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {deptEmps.length} employees · #{dept.id}
              </p>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(dept);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600 transition"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(dept);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Head card */}
        <div
          className={`rounded-xl p-3 mb-4 ${head ? "bg-gray-50" : "bg-gray-50 border border-dashed border-gray-200"}`}
        >
          {head ? (
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={`https://i.pravatar.cc/150?u=${head.id}`}
                  alt={empName(head)}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white shadow"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border border-white">
                  <Award size={9} className="text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  {empName(head)}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {head.position}
                </p>
              </div>
              <span className="ml-auto text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 shrink-0">
                Head
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <UserCheck size={14} /> No head assigned
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Active", val: active, cls: "text-green-700 bg-green-50" },
            { label: "Leads", val: leads, cls: "text-purple-700 bg-purple-50" },
            {
              label: "Interns",
              val: interns,
              cls: "text-amber-700 bg-amber-50",
            },
          ].map(({ label, val, cls }) => (
            <div key={label} className={`rounded-lg p-2 text-center ${cls}`}>
              <p className="text-base font-bold">{val}</p>
              <p className="text-[10px] font-medium opacity-80">{label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Created{" "}
            {dept.created_at
              ? new Date(dept.created_at).toLocaleDateString()
              : "—"}
          </span>
          <button
            onClick={onClick}
            className="text-xs font-medium text-blue-600 group-hover:underline flex items-center gap-1"
          >
            Open <CRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Root Page
═══════════════════════════════════════════ */
export default function DepartmentPage() {
  const [depts, setDepts] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [empsLoading, setEmpsLoading] = useState(true);
  const [deptsErr, setDeptsErr] = useState(null);
  const [empsErr, setEmpsErr] = useState(null);

  const [activeDeptId, setActiveDeptId] = useState(null);
  const [search, setSearch] = useState("");

  /* Modals */
  const [assignDept, setAssignDept] = useState(null); // dept object
  const [editDept, setEditDept] = useState(null); // dept object
  const [showCreate, setShowCreate] = useState(false);
  const [deleteDept, setDeleteDept] = useState(null); // dept object
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* ── Fetch departments ── */
  const fetchDepts = useCallback(async () => {
    setDeptsLoading(true);
    setDeptsErr(null);
    try {
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(API.ListDepartment, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setDepts(Array.isArray(data) ? data : data.departments || []);
    } catch (err) {
      setDeptsErr(err.message || "Failed to load departments.");
    } finally {
      setDeptsLoading(false);
    }
  }, []);

  /* ── Fetch all employees (for head picker + dept employee list) ── */
  const fetchEmployees = useCallback(async () => {
    setEmpsLoading(true);
    setEmpsErr(null);
    try {
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(API.GetAllEmployees, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setAllEmployees(Array.isArray(data) ? data : data.employees || []);
    } catch (err) {
      setEmpsErr(err.message || "Failed to load employees.");
    } finally {
      setEmpsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepts();
    fetchEmployees();
  }, [fetchDepts, fetchEmployees]);

  /* ── Assign Head ── */
  const handleAssignHead = async (deptId, empId) => {
    setAssigning(true);
    try {
      const res = await fetch(API.updateDepartment(deptId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ head_id: empId }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const updated = await res.json();
      setDepts((prev) =>
        prev.map((d) =>
          d.id === deptId ? { ...d, ...updated, head_id: empId } : d,
        ),
      );
      showToast(
        empId ? "Department head assigned." : "Head removed.",
        "success",
      );
      setAssignDept(null);
    } catch (err) {
      showToast(err.message || "Failed to assign head.", "error");
    } finally {
      setAssigning(false);
    }
  };

  /* ── Save dept (create or edit) ── */
  const handleSaved = (saved, isEdit) => {
    setDepts((prev) =>
      isEdit
        ? prev.map((d) => (d.id === saved.id ? { ...d, ...saved } : d))
        : [saved, ...prev],
    );
  };

  /* ── Delete dept ── */
  const handleDelete = async () => {
    if (!deleteDept) return;
    setDeleting(true);
    try {
      const res = await fetch(API.deleteDepartment(deleteDept.id), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setDepts((prev) => prev.filter((d) => d.id !== deleteDept.id));
      if (activeDeptId === deleteDept.id) setActiveDeptId(null);
      showToast("Department deleted.", "success");
      setDeleteDept(null);
    } catch (err) {
      showToast(err.message || "Failed to delete.", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Derived ── */
  const activeDept = activeDeptId
    ? depts.find((d) => d.id === activeDeptId)
    : null;

  const stats = useMemo(
    () => ({
      total: depts.length,
      withHead: depts.filter((d) => d.head_id).length,
      noHead: depts.filter((d) => !d.head_id).length,
      empTotal: allEmployees.length,
    }),
    [depts, allEmployees],
  );

  const filteredDepts = useMemo(() => {
    const q = search.toLowerCase();
    return depts.filter((d) => !q || d.department?.toLowerCase().includes(q));
  }, [depts, search]);

  const loading = deptsLoading || empsLoading;

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      {activeDept ? (
        <DepartmentDetail
          dept={activeDept}
          allEmployees={allEmployees}
          allDepts={depts}
          onBack={() => {
            setActiveDeptId(null);
            setSearch("");
          }}
          onAssignHead={() => setAssignDept(activeDept)}
          onEditDept={(d) => setEditDept(d)}
        />
      ) : (
        <>
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-semibold">Departments</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage teams, heads & organisation structure
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="self-start flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <PlusCircle size={16} /> New Department
            </button>
          </header>

          {/* Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Widget
              icon={Building2}
              title="Departments"
              value={loading ? "…" : stats.total}
              sub="Total"
              color="border-blue-200 bg-blue-50 text-blue-700"
            />
            <Widget
              icon={Users}
              title="Employees"
              value={loading ? "…" : stats.empTotal}
              sub="Across all depts"
              color="border-green-200 bg-green-50 text-green-700"
            />
            <Widget
              icon={UserCog}
              title="Heads Assigned"
              value={loading ? "…" : stats.withHead}
              sub="Departments led"
              color="border-violet-200 bg-violet-50 text-violet-700"
            />
            <Widget
              icon={UserCheck}
              title="No Head"
              value={loading ? "…" : stats.noHead}
              sub="Needs assignment"
              color="border-amber-200 bg-amber-50 text-amber-700"
            />
          </div>

          {/* Errors */}
          {deptsErr && (
            <div className="mb-4">
              <ErrBanner msg={deptsErr} onRetry={fetchDepts} />
            </div>
          )}
          {empsErr && (
            <div className="mb-4">
              <ErrBanner msg={empsErr} onRetry={fetchEmployees} />
            </div>
          )}

          {/* Search + refresh toolbar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-xs">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search departments…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 shadow-sm placeholder-gray-400 transition"
              />
            </div>
            <button
              onClick={() => {
                fetchDepts();
                fetchEmployees();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 hover:border-gray-300 text-sm font-medium rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={14} className="dp-sp" />
              ) : (
                <RefreshCw size={14} />
              )}{" "}
              Refresh
            </button>
            <span className="text-xs text-gray-400 ml-auto">
              {filteredDepts.length} dept{filteredDepts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 size={32} className="dp-sp text-blue-400 mb-4" />
              <p className="text-sm text-gray-400">Loading departments…</p>
            </div>
          ) : filteredDepts.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
              <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400 mb-3">
                {search
                  ? "No departments match your search."
                  : "No departments found."}
              </p>
              {!search && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  + Create first department
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDepts.map((dept, i) => (
                <DeptCard
                  key={dept.id}
                  dept={dept}
                  allEmployees={allEmployees}
                  idx={i}
                  onClick={() => {
                    setActiveDeptId(dept.id);
                    window.scrollTo(0, 0);
                  }}
                  onEdit={(d) => setEditDept(d)}
                  onDelete={(d) => setDeleteDept(d)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Overlays ── */}
      {showCreate && (
        <DeptFormModal
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
      {editDept && (
        <DeptFormModal
          dept={editDept}
          onClose={() => setEditDept(null)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
      {assignDept && (
        <AssignHeadModal
          dept={assignDept}
          allEmployees={allEmployees}
          onClose={() => setAssignDept(null)}
          onAssign={handleAssignHead}
          assigning={assigning}
        />
      )}
      {deleteDept && (
        <DeleteConfirm
          dept={deleteDept}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDept(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
