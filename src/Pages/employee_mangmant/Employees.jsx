/**
 * EmployeeManagementPage.jsx
 * HR Admin — Employee Management (Full CRUD)
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 *  REQUIRED APIs  (import from components/Apis.js)
 * ├─────────────────────────────────────────────────────────────────────┤
 *  GetAllEmployees    : GET    `${mainOrigin}/employees`
 *  CreateEmployees    : POST   `${mainOrigin}/employees`
 *  employeeDetails    : GET    `${mainOrigin}/employees/:id`
 *  UpdateEmployee     : PUT    `${mainOrigin}/employees/:id`
 *  DeleteEmployee     : DELETE `${mainOrigin}/employees/:id`
 *
 *  Dropdown APIs:
 *  ListDepartment     : GET    `${mainOrigin}/departments`
 *  AllRoles           : GET    `${mainOrigin}/roles`
 *  ListShifts         : GET    `${mainOrigin}/shifts`
 *
 * ├─────────────────────────────────────────────────────────────────────┤
 *  CREATE / UPDATE PAYLOAD
 *  {
 *    employee_id        : number | null  ← biometric / machine ID
 *    f_name             : string   required
 *    l_name             : string   required
 *    email              : string   required
 *    cell               : string   required
 *    gender             : string   required  "male" | "female" | "other"
 *    designation        : string   optional
 *    join_date          : string   required  "YYYY-MM-DD"
 *    role_id            : number | null
 *    department_id      : number | null
 *    shift_id           : number | null
 *    manager_id         : number | null
 *    is_remote          : boolean
 *    image              : string | null
 *    extra_data         : object | null
 *  }
 * └─────────────────────────────────────────────────────────────────────┘
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  X,
  Mail,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Building2,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  Send,
  RefreshCw,
  UserCog,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Info,
  User,
} from "lucide-react";
import { API } from "../../Components/Apis";
import {
  getAuthFromStorage,
  getAuthHeaders,
  filterEmployeesByDepartment,
  filterDepartmentsList,
} from "../../utils/authUtils";

/* ─── Animations ─── */
const _S = `
  @keyframes _fi  { from{opacity:0}                            to{opacity:1} }
  @keyframes _su  { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes _sir { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes _sp  { to{transform:rotate(360deg)} }
  .em-fi  { animation:_fi  .2s ease-out; }
  .em-su  { animation:_su  .25s ease-out both; }
  .em-sir { animation:_sir .3s cubic-bezier(.4,0,.2,1); }
  .em-sp  { animation:_sp  .85s linear infinite; }
`;
if (
  typeof document !== "undefined" &&
  !document.getElementById("__em_styles__")
) {
  const el = Object.assign(document.createElement("style"), {
    id: "__em_styles__",
    textContent: _S,
  });
  document.head.appendChild(el);
}

/* ─── Constants ─── */
const STATUS_CFG = {
  active: {
    badge: "bg-green-100 text-green-800",
    dot: "bg-green-500",
    label: "Active",
  },
  inactive: {
    badge: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
    label: "Inactive",
  },
  resigned: {
    badge: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-400",
    label: "Resigned",
  },
  probation: {
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
    label: "Probation",
  },
  terminated: {
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    label: "Terminated",
  },
};
const GENDER_OPTS = ["male", "female", "other"];
const STATUS_OPTS = [
  "active",
  "inactive",
  "resigned",
  "probation",
  "terminated",
];

// Using centralized auth utility
const getAuth = getAuthFromStorage;

/* ─── Helpers ─── */
const fullName = (e) =>
  [e?.f_name, e?.l_name].filter(Boolean).join(" ") || `#${e?.id}`;
const deptLabel = (d) => d?.department || d?.name || `Dept #${d?.id}`;
const roleLabel = (r) => r?.name || `Role #${r?.id}`;
const shiftLabel = (s) => s?.name || `Shift #${s?.id}`;
const avatarUrl = (e) =>
  e?.image || `https://i.pravatar.cc/150?u=${e?.id || e?.email || "x"}`;

/* ─── Shared UI ─── */
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

function Widget({ icon: Icon, title, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <span
        className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}
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

function Toast({ toast }) {
  if (!toast) return null;
  const { bg, I } = {
    success: { bg: "bg-emerald-600", I: CheckCircle2 },
    error: { bg: "bg-red-500", I: XCircle },
    info: { bg: "bg-blue-600", I: Info },
  }[toast.type] || { bg: "bg-gray-800", I: Info };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-2xl text-sm font-medium pointer-events-none em-fi ${bg}`}
    >
      <I size={16} /> {toast.msg}
    </div>
  );
}

function ErrBanner({ msg, onRetry }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
      <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-700">Error</p>
        <p className="text-xs text-red-400 mt-0.5 break-words">{msg}</p>
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

/* ─────────────────────────────────────────
   Status Toggle — dropdown picker that sits
   in the table row and PATCHes the status.
───────────────────────────────────────── */
const TOGGLE_COLORS = {
  active: "bg-green-500",
  inactive: "bg-gray-400",
  resigned: "bg-yellow-400",
  probation: "bg-blue-400",
  terminated: "bg-red-500",
};

function StatusToggle({ employee, onStatusChange, canChangeStatus }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const current = employee.employment_status || "inactive";
  const isActive = current === "active";

  /* clicking the pill-toggle just flips active ↔ inactive quickly */
  const handlePillClick = async (e) => {
    e.stopPropagation();
    if (!canChangeStatus) {
      alert("You don't have permission to change employee status.");
      return;
    }
    const nextStatus = isActive ? "inactive" : "active";
    await applyStatus(nextStatus);
  };

  /* choosing from the dropdown sets any status */
  const handleSelect = async (status) => {
    setOpen(false);
    if (status === current) return;
    await applyStatus(status);
  };

  const applyStatus = async (status) => {
    setLoading(true);
    try {
      const res = await fetch(API.UpdateEmployee(employee.id), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...employee, employment_status: status }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const updated = await res.json();
      onStatusChange(updated);
    } catch (err) {
      console.error("[StatusToggle]", err.message);
    } finally {
      setLoading(false);
    }
  };

  const stCfg = STATUS_CFG[current] || STATUS_CFG.inactive;

  return (
    <div
      ref={ref}
      className="relative flex items-center gap-1.5 justify-center"
    >
      {/* ── Pill toggle: active ↔ inactive ── */}
      <button
        disabled={loading || !canChangeStatus}
        onClick={handlePillClick}
        title={canChangeStatus ? (isActive ? "Click to deactivate" : "Click to activate") : "Permission denied"}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50
          ${isActive ? "bg-green-500" : "bg-gray-300"}`}
      >
        {loading ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={10} className="em-sp text-white" />
          </span>
        ) : (
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
              ${isActive ? "translate-x-4" : "translate-x-0.5"}`}
          />
        )}
      </button>

      {/* ── Badge + chevron to open full status picker ── */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition hover:opacity-80 ${stCfg.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${stCfg.dot}`} />
        {stCfg.label}
        <svg
          className={`w-2.5 h-2.5 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[140px] em-su">
          {STATUS_OPTS.map((s) => {
            const cfg = STATUS_CFG[s];
            const isCurrent = s === current;
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition
                  ${isCurrent ? "bg-gray-50 text-gray-700" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${TOGGLE_COLORS[s]}`}
                />
                {cfg.label}
                {isCurrent && (
                  <CheckCircle2 size={11} className="ml-auto text-gray-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Employee Detail Sidebar
───────────────────────────────────────── */
function EmployeeSidebar({
  employee,
  depts,
  roles,
  shifts,
  onClose,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) {
  if (!employee) return null;
  const stCfg = STATUS_CFG[employee.employment_status] || {};
  const dept = depts.find((d) => d.id === employee.department_id);
  const role = roles.find((r) => r.id === employee.role_id);
  const shift = shifts.find((s) => s.id === employee.shift_id);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm em-fi"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 bottom-0 z-[51] w-full sm:w-[400px] bg-white shadow-2xl flex flex-col em-sir">
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
          {/* Banner */}
          <div className="em-su flex items-center gap-4 bg-gray-50 rounded-xl p-4">
            <img
              src={avatarUrl(employee)}
              alt={fullName(employee)}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow shrink-0"
            />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-base leading-tight">
                {fullName(employee)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {employee.designation || "—"}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {dept && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
                    {deptLabel(dept)}
                  </span>
                )}
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${stCfg.badge || "bg-gray-100 text-gray-600"}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${stCfg.dot || "bg-gray-400"}`}
                  />
                  {stCfg.label || employee.employment_status}
                </span>
                {employee.is_remote && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-teal-50 text-teal-700 flex items-center gap-1">
                    <Wifi size={9} /> Remote
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact rows */}
          {[
            { Icon: Mail, label: "Email", value: employee.email },
            { Icon: Phone, label: "Cell", value: employee.cell },
            { Icon: User, label: "Gender", value: employee.gender },
            { Icon: Calendar, label: "Joined", value: employee.join_date },
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
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-gray-800 capitalize truncate">
                    {value}
                  </p>
                </div>
              </div>
            ))}

          {/* Employment grid */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2.5">
              Employment Details
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "DB ID", value: `#${employee.id}` },
                {
                  label: "Machine ID",
                  value:
                    employee.employee_id != null
                      ? `#${employee.employee_id}`
                      : "—",
                },
                { label: "Department", value: dept ? deptLabel(dept) : "—" },
                { label: "Role", value: role ? roleLabel(role) : "—" },
                { label: "Shift", value: shift ? shiftLabel(shift) : "—" },
                { label: "Remote", value: employee.is_remote ? "Yes" : "No" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => {
              if (!canEdit) {
                alert("You don't have permission to edit employees.");
                return;
              }
              onEdit(employee);
              onClose();
            }}
            disabled={!canEdit}
            title={canEdit ? "Edit employee" : "Permission denied"}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition disabled:cursor-not-allowed"
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            onClick={() => {
              if (!canDelete) {
                alert("You don't have permission to delete employees.");
                return;
              }
              onDelete(employee);
              onClose();
            }}
            disabled={!canDelete}
            title={canDelete ? "Delete employee" : "Permission denied"}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:border-gray-200 disabled:text-gray-400 text-sm font-medium rounded-xl transition disabled:cursor-not-allowed"
          >
            <Trash2 size={13} /> Remove
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm rounded-xl transition text-center"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────────────────────
   Delete Confirm
───────────────────────────────────────── */
function DeleteConfirm({ employee, deleting, onConfirm, onCancel }) {
  if (!employee) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm em-fi px-4">
      <div className="bg-white rounded-2xl p-6 w-[380px] max-w-full shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">
          Remove Employee?
        </h2>
        <p className="text-sm font-bold text-gray-800 text-center mb-1">
          {fullName(employee)}
        </p>
        <p className="text-xs text-gray-400 text-center mb-4">
          {employee.designation} · DB #{employee.id}
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2 mb-5">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            This action cannot be undone.
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
                <Loader2 size={14} className="em-sp" />
                Removing…
              </>
            ) : (
              "Yes, Remove"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Form helpers
───────────────────────────────────────── */
const LBL =
  "block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5";
const INP = (err) =>
  `w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition placeholder-gray-300 ${err ? "border-red-300" : "border-gray-200"}`;
const SEL =
  "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 cursor-pointer transition text-gray-700";

/* ─────────────────────────────────────────
   Create / Edit Modal
───────────────────────────────────────── */
const EMPTY_FORM = {
  employee_id: "",
  f_name: "",
  l_name: "",
  email: "",
  cell: "",
  gender: "male",
  image: "",
  designation: "",
  join_date: "",
  role_id: "",
  department_id: "",
  shift_id: "",
  manager_id: "",
  is_remote: false,
  extra_data: null,
};

function EmployeeFormModal({
  employee,
  depts,
  roles,
  shifts,
  allEmployees,
  onClose,
  onSaved,
  showToast,
}) {
  const isEdit = !!employee;

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          employee_id: employee.employee_id ?? "",
          f_name: employee.f_name || "",
          l_name: employee.l_name || "",
          email: employee.email || "",
          cell: employee.cell || "",
          gender: employee.gender || "male",
          image: employee.image || "",
          designation: employee.designation || "",
          join_date: employee.join_date || "",
          role_id: employee.role_id ?? "",
          department_id: employee.department_id ?? "",
          shift_id: employee.shift_id ?? "",
          manager_id: employee.manager_id ?? "",
          is_remote: employee.is_remote || false,
          extra_data: employee.extra_data || null,
        }
      : { ...EMPTY_FORM },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.f_name.trim()) e.f_name = "First name is required.";
    if (!form.l_name.trim()) e.l_name = "Last name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    if (!form.cell.trim()) e.cell = "Cell number is required.";
    if (!form.gender) e.gender = "Gender is required.";
    if (!form.join_date) e.join_date = "Join date is required.";
    if (form.employee_id !== "" && isNaN(Number(form.employee_id)))
      e.employee_id = "Machine ID must be a number.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);

    const payload = {
      employee_id: form.employee_id !== "" ? Number(form.employee_id) : null,
      f_name: form.f_name.trim(),
      l_name: form.l_name.trim(),
      email: form.email.trim(),
      cell: form.cell.trim(),
      gender: form.gender,
      image: form.image.trim() || null,
      designation: form.designation.trim() || null,
      join_date: form.join_date,
      role_id: form.role_id !== "" ? Number(form.role_id) : null,
      department_id:
        form.department_id !== "" ? Number(form.department_id) : null,
      shift_id: form.shift_id !== "" ? Number(form.shift_id) : null,
      manager_id: form.manager_id !== "" ? Number(form.manager_id) : null,
      is_remote: form.is_remote,
      extra_data: form.extra_data || null,
    };

    try {
      const url = isEdit
        ? API.UpdateEmployee(employee.id)
        : API.CreateEmployees;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Request failed (${res.status})`);
      }
      const saved = await res.json();
      onSaved(saved, isEdit);
      showToast(isEdit ? "Employee updated." : "Employee added.", "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  const managers = allEmployees.filter((e) => !isEdit || e.id !== employee?.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm em-fi px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
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
              {isEdit ? "Edit Employee" : "Add New Employee"}
            </p>
            <p className="text-[11px] text-gray-400">
              {isEdit
                ? `Editing: ${fullName(employee)}`
                : "Fill in all required fields"}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 pb-1.5 border-b border-gray-100">
                Personal Information
              </p>
            </div>

            <div>
              <label className={LBL}>First Name *</label>
              <input
                value={form.f_name}
                onChange={(e) => set("f_name", e.target.value)}
                placeholder="Ahmed"
                className={INP(errors.f_name)}
              />
              {errors.f_name && (
                <p className="text-xs text-red-500 mt-1">{errors.f_name}</p>
              )}
            </div>

            <div>
              <label className={LBL}>Last Name *</label>
              <input
                value={form.l_name}
                onChange={(e) => set("l_name", e.target.value)}
                placeholder="Khan"
                className={INP(errors.l_name)}
              />
              {errors.l_name && (
                <p className="text-xs text-red-500 mt-1">{errors.l_name}</p>
              )}
            </div>

            <div>
              <label className={LBL}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="emp@company.com"
                className={INP(errors.email)}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className={LBL}>Cell *</label>
              <input
                type="tel"
                value={form.cell}
                onChange={(e) => set("cell", e.target.value)}
                placeholder="+92-300-0000000"
                className={INP(errors.cell)}
              />
              {errors.cell && (
                <p className="text-xs text-red-500 mt-1">{errors.cell}</p>
              )}
            </div>

            <div>
              <label className={LBL}>Gender *</label>
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className={SEL}
              >
                {GENDER_OPTS.map((g) => (
                  <option key={g} value={g}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LBL}>Profile Image URL</label>
              <input
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="https://…"
                className={INP(false)}
              />
            </div>

            <div className="sm:col-span-2 mt-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 pb-1.5 border-b border-gray-100">
                Employment Details
              </p>
            </div>

            <div>
              <label className={LBL}>
                Machine ID
                <span className="ml-1 normal-case font-normal text-gray-400">
                  (biometric device)
                </span>
              </label>
              <input
                type="number"
                value={form.employee_id}
                onChange={(e) => set("employee_id", e.target.value)}
                placeholder="e.g. 101  (optional)"
                className={INP(errors.employee_id)}
              />
              {errors.employee_id ? (
                <p className="text-xs text-red-500 mt-1">
                  {errors.employee_id}
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 mt-1">
                  Must match the ID programmed into the attendance machine.
                </p>
              )}
            </div>

            <div>
              <label className={LBL}>Designation</label>
              <input
                value={form.designation}
                onChange={(e) => set("designation", e.target.value)}
                placeholder="Software Engineer"
                className={INP(false)}
              />
            </div>

            <div>
              <label className={LBL}>Join Date *</label>
              <input
                type="date"
                value={form.join_date}
                onChange={(e) => set("join_date", e.target.value)}
                className={INP(errors.join_date)}
              />
              {errors.join_date && (
                <p className="text-xs text-red-500 mt-1">{errors.join_date}</p>
              )}
            </div>

            <div className="sm:col-span-2 mt-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 pb-1.5 border-b border-gray-100">
                Assignments
              </p>
            </div>

            <div>
              <label className={LBL}>Department</label>
              <select
                value={form.department_id}
                onChange={(e) => set("department_id", e.target.value)}
                className={SEL}
              >
                <option value="">— None —</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {deptLabel(d)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LBL}>Role</label>
              <select
                value={form.role_id}
                onChange={(e) => set("role_id", e.target.value)}
                className={SEL}
              >
                <option value="">— None —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {roleLabel(r)} (L{r.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LBL}>Shift</label>
              <select
                value={form.shift_id}
                onChange={(e) => set("shift_id", e.target.value)}
                className={SEL}
              >
                <option value="">— None —</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {shiftLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LBL}>Manager</label>
              <select
                value={form.manager_id}
                onChange={(e) => set("manager_id", e.target.value)}
                className={SEL}
              >
                <option value="">— None —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {fullName(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Remote toggle */}
            <div className="sm:col-span-2">
              <div
                onClick={() => set("is_remote", !form.is_remote)}
                className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border cursor-pointer transition
                  ${form.is_remote ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
              >
                <div className="flex items-center gap-3">
                  {form.is_remote ? (
                    <Wifi size={16} className="text-teal-600" />
                  ) : (
                    <WifiOff size={16} className="text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {form.is_remote ? "Remote Employee" : "On-site Employee"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {form.is_remote
                        ? "Works from any location"
                        : "Works from the office"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_remote ? "bg-teal-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_remote ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="em-sp" />
                {isEdit ? "Saving…" : "Adding…"}
              </>
            ) : (
              <>
                <Send size={14} />
                {isEdit ? "Save Changes" : "Add Employee"}
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

/* ─────────────────────────────────────────
   Pagination
───────────────────────────────────────── */
function Pagination({ page, totalPages, totalItems, pageSize, onPage }) {
  /* Build the page-number window: always show first, last, current ±1, with "…" gaps */
  const pages = useMemo(() => {
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter(
        (n) => n >= 1 && n <= totalPages,
      ),
    );
    const sorted = [...set].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1] > 1) result.push("…");
      result.push(n);
    });
    return result;
  }, [page, totalPages]);

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
      {/* Record count */}
      <p className="text-xs text-gray-400 tabular-nums shrink-0">
        Showing{" "}
        <span className="font-semibold text-gray-600">
          {from}–{to}
        </span>{" "}
        of <span className="font-semibold text-gray-600">{totalItems}</span>{" "}
        employees
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500
            hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="h-8 w-8 flex items-center justify-center text-xs text-gray-400 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`h-8 min-w-[2rem] px-2 flex items-center justify-center rounded-lg text-xs font-semibold border transition
                ${
                  p === page
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                }`}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500
            hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Jump-to input */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-400">Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          defaultValue={page}
          key={page}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = Number(e.target.value);
              if (v >= 1 && v <= totalPages) onPage(v);
            }
          }}
          onBlur={(e) => {
            const v = Number(e.target.value);
            if (v >= 1 && v <= totalPages && v !== page) onPage(v);
          }}
          className="w-12 h-8 text-center text-xs border border-gray-200 rounded-lg bg-gray-50
            outline-none focus:border-blue-400 transition tabular-nums"
        />
        <span className="text-xs text-gray-400">of {totalPages}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════ */
const PAGE_SIZE = 10;

export default function EmployeeManagementPage() {
  const auth = useMemo(() => getAuth(), []);
  const isDeptHead = auth?.level === 6;
  const canAddEmployee = [1, 3, 4].includes(auth?.level ?? -1);
  const canEditDelete = [1, 3, 4].includes(auth?.level ?? -1);

  const [employees, setEmployees] = useState([]);
  const [depts, setDepts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [empLoading, setEmpLoading] = useState(true);
  const [dropLoading, setDropLoading] = useState(true);
  const [empErr, setEmpErr] = useState(null);

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRemote, setFilterRemote] = useState("All");
  const [page, setPage] = useState(1);

  const [viewEmp, setViewEmp] = useState(null);
  const [editEmp, setEditEmp] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* ── Fetch ── */
  const fetchEmployees = useCallback(async () => {
    setEmpLoading(true);
    setEmpErr(null);
    try {
      const res = await fetch(API.GetAllEmployees, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : data.employees || []);
    } catch (err) {
      setEmpErr(err.message);
    } finally {
      setEmpLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    setDropLoading(true);
    const authHeaders = getAuthHeaders();
    try {
      const [dr, rr, sr] = await Promise.all([
        fetch(API.ListDepartment, { headers: authHeaders }),
        fetch(API.AllRoles, { headers: authHeaders }),
        fetch(API.ListShifts, { headers: authHeaders }),
      ]);
      const [dD, rD, sD] = await Promise.all([
        dr.ok ? dr.json() : [],
        rr.ok ? rr.json() : [],
        sr.ok ? sr.json() : [],
      ]);
      setDepts(Array.isArray(dD) ? dD : dD.departments || []);
      setRoles(Array.isArray(rD) ? rD : rD.roles || []);
      setShifts(Array.isArray(sD) ? sD : sD.shifts || []);
    } catch (err) {
      console.warn("[dropdowns]", err.message);
    } finally {
      setDropLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchDropdowns();
  }, [fetchEmployees, fetchDropdowns]);

  /* ── CRUD ── */
  const handleSaved = (saved, isEdit) =>
    setEmployees((prev) =>
      isEdit
        ? prev.map((e) => (e.id === saved.id ? saved : e))
        : [saved, ...prev],
    );

  /* Called by StatusToggle when the API responds with the updated employee */
  const handleStatusChange = useCallback(
    (updated) => {
      setEmployees((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e)),
      );
      const cfg = STATUS_CFG[updated.employment_status];
      showToast(
        `${fullName(updated)} marked as ${cfg?.label || updated.employment_status}.`,
        updated.employment_status === "active" ? "success" : "info",
      );
    },
    [showToast],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(API.DeleteEmployee(deleteTarget.id), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      showToast("Employee removed.", "success");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const scopedEmployees = useMemo(
    () => filterEmployeesByDepartment(employees, auth),
    [employees, auth],
  );

  const scopedDepartments = useMemo(
    () => filterDepartmentsList(depts, auth),
    [depts, auth],
  );

  /* ── Stats ── */
  const stats = useMemo(
    () => ({
      total: scopedEmployees.length,
      active: scopedEmployees.filter((e) => e.employment_status === "active")
        .length,
      inactive: scopedEmployees.filter(
        (e) => e.employment_status === "inactive",
      ).length,
      terminated: scopedEmployees.filter(
        (e) => e.employment_status === "terminated",
      ).length,
      remote: scopedEmployees.filter((e) => e.is_remote).length,
    }),
    [scopedEmployees],
  );

  /* ── Dept breakdown ── */
  const deptBreakdown = useMemo(() => {
    const map = {};
    scopedEmployees.forEach((e) => {
      const d = scopedDepartments.find((d) => d.id === e.department_id);
      const k = d
        ? deptLabel(d)
        : e.department_id
          ? `Dept #${e.department_id}`
          : null;
      if (k) map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [scopedEmployees, scopedDepartments]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scopedEmployees.filter((e) => {
      const name = fullName(e).toLowerCase();
      const matchQ =
        !q ||
        name.includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        String(e.id).includes(q) ||
        (e.employee_id != null && String(e.employee_id).includes(q));
      const dept = scopedDepartments.find((d) => d.id === e.department_id);
      const matchD =
        filterDept === "All" || (dept ? deptLabel(dept) === filterDept : false);
      const matchS =
        filterStatus === "All" || e.employment_status === filterStatus;
      const matchR =
        filterRemote === "All" ||
        (filterRemote === "Remote" ? e.is_remote : !e.is_remote);
      return matchQ && matchD && matchS && matchR;
    });
  }, [
    scopedEmployees,
    search,
    filterDept,
    filterStatus,
    filterRemote,
    scopedDepartments,
  ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sf = (fn) => {
    fn();
    setPage(1);
  };

  const activePills = [
    filterDept !== "All" && { key: "dept", label: filterDept },
    filterStatus !== "All" && { key: "status", label: filterStatus },
    filterRemote !== "All" && { key: "remote", label: filterRemote },
    search && { key: "q", label: `"${search}"` },
  ].filter(Boolean);

  const loading = empLoading;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Employee Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isDeptHead
              ? "Viewing employees from your department only"
              : "Directory & workforce overview"}
          </p>
        </div>
        {canAddEmployee && (
          <button
            onClick={() => setShowAdd(true)}
            className="self-start flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <PlusCircle size={16} /> Add Employee
          </button>
        )}
      </header>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Widget
          icon={Users}
          title="Total"
          value={loading ? "…" : stats.total}
          sub="In system"
          color="border-blue-200 bg-blue-50 text-blue-700"
        />
        <Widget
          icon={CheckCircle2}
          title="Active"
          value={loading ? "…" : stats.active}
          sub="Working"
          color="border-green-200 bg-green-50 text-green-700"
        />
        <Widget
          icon={Clock}
          title="Inactive"
          value={loading ? "…" : stats.inactive}
          sub="On hold"
          color="border-gray-200 bg-gray-100 text-gray-600"
        />
        <Widget
          icon={XCircle}
          title="Terminated"
          value={loading ? "…" : stats.terminated}
          sub="Inactive"
          color="border-red-200 bg-red-50 text-red-700"
        />
        <Widget
          icon={Wifi}
          title="Remote"
          value={loading ? "…" : stats.remote}
          sub="WFH"
          color="border-teal-200 bg-teal-50 text-teal-700"
        />
      </div>

      {/* Dept breakdown */}
      {!loading && deptBreakdown.length > 0 && (
        <Card
          title="By Department"
          className="mb-6"
          action={
            <span className="text-xs text-gray-400">
              {scopedEmployees.length} total
            </span>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {deptBreakdown.map(([dept, count]) => {
              const pct = stats.total
                ? Math.round((count / stats.total) * 100)
                : 0;
              const active = filterDept === dept;
              return (
                <div
                  key={dept}
                  onClick={() => sf(() => setFilterDept(active ? "All" : dept))}
                  className={`flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1.5 transition ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}
                >
                  <span
                    className={`w-28 text-xs font-medium truncate shrink-0 ${active ? "text-blue-700" : "text-gray-600"}`}
                  >
                    {dept}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${active ? "bg-blue-600" : "bg-blue-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 tabular-nums w-10 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {empErr && <ErrBanner msg={empErr} onRetry={fetchEmployees} />}

      {/* Filter toolbar */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className={LBL}>Search</label>
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => sf(() => setSearch(e.target.value))}
                placeholder="Name, ID, machine ID, email…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className={LBL}>Department</label>
            <select
              value={filterDept}
              onChange={(e) => sf(() => setFilterDept(e.target.value))}
              className={SEL}
            >
              <option value="All">All Departments</option>
              {deptBreakdown.map(([d]) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LBL}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => sf(() => setFilterStatus(e.target.value))}
              className={SEL}
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LBL}>Work Type</label>
            <select
              value={filterRemote}
              onChange={(e) => sf(() => setFilterRemote(e.target.value))}
              className={SEL}
            >
              <option value="All">All</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setSearch("");
                setFilterDept("All");
                setFilterStatus("All");
                setFilterRemote("All");
                setPage(1);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
            >
              <RefreshCw size={13} /> Reset
            </button>
            <button
              onClick={() => {
                fetchEmployees();
                fetchDropdowns();
              }}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={13} className="em-sp" />
              ) : (
                <RefreshCw size={13} />
              )}{" "}
              Refresh
            </button>
          </div>
        </div>

        {activePills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {activePills.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full"
              >
                {f.label}
                <button
                  onClick={() => {
                    setPage(1);
                    if (f.key === "dept") setFilterDept("All");
                    if (f.key === "status") setFilterStatus("All");
                    if (f.key === "remote") setFilterRemote("All");
                    if (f.key === "q") setSearch("");
                  }}
                  className="opacity-60 hover:opacity-100"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <span className="ml-auto text-xs text-gray-400 self-center">
              {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card
        title="Employee Directory"
        action={
          <span className="text-xs text-gray-400">
            {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  ["Employee", "text-left"],
                  ["Machine ID", "text-center hidden sm:table-cell"],
                  ["Designation", "text-left"],
                  ["Department", "text-center"],
                  ["Status", "text-center"],
                  ["Joined", "text-center hidden md:table-cell"],
                  ["Remote", "text-center"],
                  ["Actions", "text-center"],
                ].map(([h, cls]) => (
                  <th
                    key={h}
                    className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${cls}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Loader2
                      size={28}
                      className="mx-auto em-sp text-blue-400 mb-3"
                    />
                    <p className="text-sm text-gray-400">Loading employees…</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Users size={28} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-400 mb-3">
                      No employees match your filters.
                    </p>
                    {canAddEmployee && (
                      <button
                        onClick={() => setShowAdd(true)}
                        className="text-sm text-blue-600 font-medium hover:underline"
                      >
                        + Add first employee
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((emp, i) => {
                  const dept = scopedDepartments.find(
                    (d) => d.id === emp.department_id,
                  );
                  return (
                    <tr
                      key={emp.id}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/20 transition border-b border-gray-50 last:border-b-0`}
                    >
                      {/* Employee */}
                      <td
                        className="py-3 px-4 cursor-pointer"
                        onClick={() => setViewEmp(emp)}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={avatarUrl(emp)}
                            alt={fullName(emp)}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                          />
                          <div>
                            <p className="text-sm font-medium text-blue-600 hover:underline whitespace-nowrap">
                              {fullName(emp)}
                            </p>
                            <p className="text-xs text-gray-400 tabular-nums">
                              DB #{emp.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Machine ID */}
                      <td className="py-3 px-4 text-center hidden sm:table-cell">
                        {emp.employee_id != null ? (
                          <span className="text-xs font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">
                            #{emp.employee_id}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                        {emp.designation || "—"}
                      </td>

                      {/* Dept */}
                      <td className="py-3 px-4 text-center">
                        {dept ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                            {deptLabel(dept)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* ── Status — now uses the interactive StatusToggle ── */}
                      <td className="py-3 px-4">
                        <StatusToggle
                          employee={emp}
                          onStatusChange={handleStatusChange}
                          canChangeStatus={canEditDelete}
                        />
                      </td>

                      {/* Joined */}
                      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap hidden md:table-cell">
                        {emp.join_date || "—"}
                      </td>

                      {/* Remote */}
                      <td className="py-3 px-4 text-center">
                        {emp.is_remote ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700">
                            <Wifi size={10} /> Remote
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">On-site</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewEmp(emp)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition"
                            title="View"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (!canEditDelete) {
                                alert("You don't have permission to edit employees.");
                                return;
                              }
                              setEditEmp(emp);
                            }}
                            disabled={!canEditDelete}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title={canEditDelete ? "Edit" : "Permission denied"}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (!canEditDelete) {
                                alert("You don't have permission to delete employees.");
                                return;
                              }
                              setDeleteTarget(emp);
                            }}
                            disabled={!canEditDelete}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title={canEditDelete ? "Remove" : "Permission denied"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        )}
      </Card>

      {/* Overlays */}
      {showAdd && (
        <EmployeeFormModal
          depts={scopedDepartments}
          roles={roles}
          shifts={shifts}
          allEmployees={scopedEmployees}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
      {editEmp && (
        <EmployeeFormModal
          employee={editEmp}
          depts={scopedDepartments}
          roles={roles}
          shifts={shifts}
          allEmployees={scopedEmployees}
          onClose={() => setEditEmp(null)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
      {viewEmp && (
        <EmployeeSidebar
          employee={viewEmp}
          depts={scopedDepartments}
          roles={roles}
          shifts={shifts}
          canEdit={canEditDelete}
          canDelete={canEditDelete}
          onClose={() => setViewEmp(null)}
          onEdit={(e) => {
            setViewEmp(null);
            setEditEmp(e);
          }}
          onDelete={(e) => {
            setViewEmp(null);
            setDeleteTarget(e);
          }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          employee={deleteTarget}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
