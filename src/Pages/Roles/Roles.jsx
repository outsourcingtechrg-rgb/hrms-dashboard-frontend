import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  Shield,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Crown,
  Key,
  Users,
  Lock,
  ChevronDown,
  Check,
  ChevronRight as ChevronRightSmall,
  Info,
  Hash,
  Calendar,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Animations ─── */
const STYLES = `
  @keyframes fadeIn        { from{opacity:0}                         to{opacity:1} }
  @keyframes slideUp       { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInRight  { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes spinAnim      { from{transform:rotate(0deg)}            to{transform:rotate(360deg)} }
  .fade-in        { animation: fadeIn .2s ease-out; }
  .slide-up       { animation: slideUp .25s ease-out both; }
  .slide-in-right { animation: slideInRight .3s cubic-bezier(.4,0,.2,1); }
  .spin           { animation: spinAnim .9s linear infinite; }
`;
if (typeof document !== "undefined") {
  const existing = document.getElementById("role-page-styles");
  if (!existing) {
    const s = document.createElement("style");
    s.id = "role-page-styles";
    s.innerHTML = STYLES;
    document.head.appendChild(s);
  }
}

/* ─── Permission Groups (maps to extra_data.permissions[]) ─── */
const PERMISSION_GROUPS = {
  "Employee Management": [
    { key: "employees.view", label: "View Employees" },
    { key: "employees.create", label: "Create Employees" },
    { key: "employees.edit", label: "Edit Employees" },
    { key: "employees.delete", label: "Delete Employees" },
  ],
  Attendance: [
    { key: "attendance.view", label: "View Attendance" },
    { key: "attendance.manage", label: "Manage Attendance" },
    { key: "attendance.export", label: "Export Reports" },
  ],
  "Leave Management": [
    { key: "leaves.view", label: "View Leaves" },
    { key: "leaves.approve", label: "Approve Leaves" },
    { key: "leaves.reject", label: "Reject Leaves" },
    { key: "leaves.manage", label: "Manage All Leaves" },
  ],
  Departments: [
    { key: "departments.view", label: "View Departments" },
    { key: "departments.manage", label: "Manage Departments" },
    { key: "departments.assign_head", label: "Assign Head" },
  ],
  Policies: [
    { key: "policies.view", label: "View Policies" },
    { key: "policies.create", label: "Create Policies" },
    { key: "policies.edit", label: "Edit Policies" },
    { key: "policies.delete", label: "Delete Policies" },
  ],
  Notices: [
    { key: "notices.view", label: "View Notices" },
    { key: "notices.create", label: "Create Notices" },
    { key: "notices.manage", label: "Manage All Notices" },
  ],
  Payroll: [
    { key: "payroll.view", label: "View Payroll" },
    { key: "payroll.process", label: "Process Payroll" },
    { key: "payroll.export", label: "Export Payroll" },
  ],
  "Role Management": [
    { key: "roles.view", label: "View Roles" },
    { key: "roles.create", label: "Create Roles" },
    { key: "roles.edit", label: "Edit Roles" },
    { key: "roles.delete", label: "Delete Roles" },
  ],
};

const ALL_PERMISSION_KEYS = Object.values(PERMISSION_GROUPS)
  .flat()
  .map((p) => p.key);

/* ─── Level → badge style ─── */
const LEVEL_CFG = [
  {
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    label: "Super Admin",
  },
  {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    label: "Admin",
  },
  {
    color: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    label: "Manager",
  },
  {
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    label: "HR",
  },
  {
    color: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
    label: "Staff",
  },
  {
    color: "bg-gray-50 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    label: "Viewer",
  },
];

function getLevelCfg(level) {
  return (
    LEVEL_CFG[Math.min(level - 1, LEVEL_CFG.length - 1)] ||
    LEVEL_CFG[LEVEL_CFG.length - 1]
  );
}

/* ─── Shared UI ─── */
function Card({ title, children, action }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
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

function Widget({ title, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <span
        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${color}`}
      >
        <Icon className="w-5 h-5" />
      </span>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Toast notification ─── */
function Toast({ toast }) {
  if (!toast) return null;
  const cfg = {
    success: { bg: "bg-emerald-600", Icon: CheckCircle2 },
    error: { bg: "bg-red-500", Icon: XCircle },
    info: { bg: "bg-blue-600", Icon: Info },
  }[toast.type] || { bg: "bg-gray-800", Icon: Info };
  const { bg, Icon: TIcon } = cfg;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-500 flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-xl text-sm font-medium ${bg} fade-in pointer-events-none`}
    >
      <TIcon size={16} /> {toast.message}
    </div>
  );
}

/* ─── Permissions Editor ─── */
function PermissionsEditor({ permissions = [], onChange }) {
  const [expanded, setExpanded] = useState(Object.keys(PERMISSION_GROUPS));

  const togglePerm = (key) =>
    onChange(
      permissions.includes(key)
        ? permissions.filter((k) => k !== key)
        : [...permissions, key],
    );

  const toggleGroup = (perms) => {
    const keys = perms.map((p) => p.key);
    const allOn = keys.every((k) => permissions.includes(k));
    onChange(
      allOn
        ? permissions.filter((k) => !keys.includes(k))
        : [...new Set([...permissions, ...keys])],
    );
  };

  const toggleExpand = (group) =>
    setExpanded((p) =>
      p.includes(group) ? p.filter((g) => g !== group) : [...p, group],
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] uppercase tracking-widest font-semibold text-gray-400">
          Permissions ({permissions.length}/{ALL_PERMISSION_KEYS.length})
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange([...ALL_PERMISSION_KEYS])}
            className="text-[11px] font-semibold text-blue-600 hover:underline"
          >
            Select All
          </button>
          <span className="text-gray-300 text-xs">·</span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] font-semibold text-gray-400 hover:text-red-500 hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-1.5 max-h-72 overflow-y-auto rounded-xl border border-gray-100 p-2 bg-gray-50/50">
        {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
          const keys = perms.map((p) => p.key);
          const selectedCount = keys.filter((k) =>
            permissions.includes(k),
          ).length;
          const allSel = selectedCount === keys.length;
          const someSel = selectedCount > 0 && !allSel;
          const isOpen = expanded.includes(group);

          return (
            <div
              key={group}
              className="rounded-xl overflow-hidden border border-gray-100 bg-white"
            >
              {/* Group row */}
              <div
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none transition ${allSel ? "bg-blue-50" : someSel ? "bg-blue-50/40" : "hover:bg-gray-50"}`}
                onClick={() => toggleExpand(group)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroup(perms);
                  }}
                  className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0
                    ${allSel ? "bg-blue-600 border-blue-600" : someSel ? "bg-blue-100 border-blue-400" : "border-gray-300 bg-white hover:border-blue-400"}`}
                >
                  {allSel && (
                    <Check size={10} className="text-white" strokeWidth={3} />
                  )}
                  {someSel && <div className="w-2 h-0.5 bg-blue-500 rounded" />}
                </button>
                <span className="text-xs font-semibold text-gray-700 flex-1 leading-none">
                  {group}
                </span>
                <span className="text-[10px] text-gray-400 font-medium tabular-nums">
                  {selectedCount}/{keys.length}
                </span>
                <ChevronRightSmall
                  size={12}
                  className={`text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-90" : ""}`}
                />
              </div>

              {/* Permission rows */}
              {isOpen && (
                <div className="border-t border-gray-100 px-3 py-2 grid grid-cols-2 gap-1">
                  {perms.map((perm) => {
                    const on = permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 transition select-none
                          ${on ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
                      >
                        <button
                          type="button"
                          onClick={() => togglePerm(perm.key)}
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition
                            ${on ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}
                        >
                          {on && (
                            <Check
                              size={9}
                              className="text-white"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                        <span className="text-xs leading-none">
                          {perm.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Role Form Modal (Create / Edit) ─── */
const EMPTY_FORM = { name: "", level: 2, permissions: [] };

function RoleFormModal({ role, onClose, onSaved, showToast }) {
  const isEdit = !!role;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: role.name,
          level: role.level,
          permissions: role.extra_data?.permissions || [],
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
    if (!form.name.trim()) e.name = "Role name is required.";
    if (!form.level || form.level < 1 || form.level > 10)
      e.level = "Level must be between 1 and 10.";
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
      name: form.name.trim(),
      level: Number(form.level),
      extra_data: { permissions: form.permissions },
    };

    try {
      const url = isEdit ? API.UpdateRoleByID(role.id) : API.CreateRoles;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Request failed (${res.status})`);
      }
      const saved = await res.json();
      onSaved(saved, isEdit);
      showToast(
        isEdit ? "Role updated successfully." : "Role created successfully.",
        "success",
      );
      onClose();
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  const levelCfg = getLevelCfg(Number(form.level) || 1);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              {isEdit ? (
                <Edit3 size={14} className="text-blue-600" />
              ) : (
                <PlusCircle size={14} className="text-blue-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {isEdit ? "Edit Role" : "Create New Role"}
              </p>
              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                {isEdit
                  ? `Editing: ${role.name}`
                  : "Define a new role & its permissions"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">
              Role Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. HR Manager, Department Head…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition placeholder-gray-300 ${errors.name ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Level */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">
              Access Level *{" "}
              <span className="normal-case text-gray-400 font-normal">
                (1 = highest authority)
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={10}
                value={form.level}
                onChange={(e) => set("level", e.target.value)}
                className={`w-24 border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition text-center font-semibold ${errors.level ? "border-red-300" : "border-gray-200"}`}
              />
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${levelCfg.color}`}
              >
                <span className={`w-2 h-2 rounded-full ${levelCfg.dot}`} />
                Level {form.level} · {levelCfg.label}
              </div>
              <span className="text-xs text-gray-400">Range: 1–10</span>
            </div>
            {errors.level && (
              <p className="text-xs text-red-500 mt-1">{errors.level}</p>
            )}

            {/* Level legend */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {LEVEL_CFG.map((cfg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => set("level", i + 1)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${Number(form.level) === i + 1 ? cfg.color : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"}`}
                >
                  L{i + 1} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <PermissionsEditor
            permissions={form.permissions}
            onChange={(perms) => set("permissions", perms)}
          />
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
                <Loader2 size={15} className="spin" />{" "}
                {isEdit ? "Saving…" : "Creating…"}
              </>
            ) : (
              <>
                <Send size={14} /> {isEdit ? "Save Changes" : "Create Role"}
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

/* ─── Role Detail Sidebar ─── */
function RoleSidebar({ role, onClose, onEdit, onDelete }) {
  if (!role) return null;
  const levelCfg = getLevelCfg(role.level);
  const perms = role.extra_data?.permissions || [];

  // Group permissions for display
  const grouped = Object.entries(PERMISSION_GROUPS)
    .map(([group, items]) => ({
      group,
      items: items.filter((p) => perms.includes(p.key)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm fade-in"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 z-51 w-full sm:w-110 bg-white shadow-2xl flex flex-col slide-in-right">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${levelCfg.color}`}
              >
                <span className={`w-2 h-2 rounded-full ${levelCfg.dot}`} />
                Level {role.level} · {levelCfg.label}
              </span>
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {role.name}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              ID #{role.id} · Created{" "}
              {role.created_at
                ? new Date(role.created_at).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition shrink-0 mt-1"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Role ID", value: `#${role.id}` },
              { label: "Level", value: role.level },
              { label: "Permissions", value: perms.length },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-gray-50 rounded-xl p-3 text-center"
              >
                <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">
                  {label}
                </div>
                <div className="text-lg font-bold text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          {/* Permissions grouped */}
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2.5">
              Permissions ({perms.length})
            </div>
            {perms.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl">
                <Lock size={22} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-400">No permissions assigned</p>
              </div>
            ) : (
              <div className="space-y-2">
                {grouped.map(({ group, items }) => (
                  <div key={group} className="bg-gray-50 rounded-xl px-3 py-3">
                    <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-2">
                      {group}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((p) => (
                        <span
                          key={p.key}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100"
                        >
                          <Check size={9} strokeWidth={3} /> {p.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extra data (raw, if any other fields) */}
          {role.extra_data &&
            Object.keys(role.extra_data).filter((k) => k !== "permissions")
              .length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">
                  Extra Data
                </div>
                <pre className="text-xs text-gray-600 bg-gray-50 rounded-xl px-4 py-3 overflow-x-auto">
                  {JSON.stringify(role.extra_data, null, 2)}
                </pre>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => {
              onEdit(role);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            onClick={() => {
              onDelete(role);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition"
          >
            <Trash2 size={13} /> Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition text-center"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Delete Confirm Modal ─── */
function DeleteConfirm({ role, onConfirm, onCancel, deleting }) {
  if (!role) return null;
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl p-6 w-95 max-w-[calc(100vw-32px)] shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">
          Delete Role?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-1">
          You are about to permanently delete:
        </p>
        <p className="text-sm font-bold text-gray-800 text-center mb-1">
          "{role.name}"
        </p>
        <p className="text-xs text-gray-400 text-center mb-5">
          Level {role.level} · ID #{role.id}
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2 mb-5">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Employees assigned this role may lose access. This action cannot be
            undone.
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
                <Loader2 size={14} className="spin" /> Deleting…
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

/* ─── Main Page ─── */
export default function RolesPage() {
  /* State */
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("All");
  const [page, setPage] = useState(1);
  const [viewRole, setViewRole] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const PAGE_SIZE = 10;

  /* ── Toast helper ── */
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Fetch all roles ── */
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(API.AllRoles, { headers });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : data.roles || []);
    } catch (err) {
      setFetchError(err.message || "Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  /* ── CRUD handlers ── */
  const handleSaved = (saved, isEdit) => {
    setRoles((prev) =>
      isEdit
        ? prev.map((r) => (r.id === saved.id ? saved : r))
        : [saved, ...prev],
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(API.DeleteRoleByID(deleteTarget.id), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showToast("Role deleted successfully.", "success");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || "Failed to delete role.", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Stats ── */
  const stats = {
    total: roles.length,
    maxPerms: roles.reduce(
      (m, r) => Math.max(m, (r.extra_data?.permissions || []).length),
      0,
    ),
    levels: [...new Set(roles.map((r) => r.level))].length,
  };

  /* ── Filtering ── */
  const filtered = roles
    .filter(
      (r) =>
        (!search ||
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          String(r.id).includes(search)) &&
        (filterLevel === "All" || String(r.level) === filterLevel),
    )
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const uniqueLevels = [...new Set(roles.map((r) => r.level))].sort(
    (a, b) => a - b,
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setFilter = (fn) => {
    fn();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-900">
      {/* ── Header ── */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Crown size={20} className="text-amber-500" />
            <h1 className="text-3xl font-semibold">Role Management</h1>
          </div>
          <p className="text-sm text-gray-500">
            Define access levels and permissions for your organisation · Super
            Admin
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm whitespace-nowrap self-start"
        >
          <PlusCircle size={16} /> New Role
        </button>
      </header>

      {/* ── Widgets ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Widget
          title="Total Roles"
          value={loading ? "…" : stats.total}
          sub="Defined in system"
          icon={Shield}
          color="border-blue-300 bg-blue-50 text-blue-700"
        />
        <Widget
          title="Access Levels"
          value={loading ? "…" : stats.levels}
          sub="Distinct levels in use"
          icon={Key}
          color="border-violet-300 bg-violet-50 text-violet-700"
        />
        <Widget
          title="Max Permissions"
          value={loading ? "…" : stats.maxPerms}
          sub="In a single role"
          icon={Lock}
          color="border-amber-300 bg-amber-50 text-amber-700"
        />
      </div>

      {/* ── Level legend ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LEVEL_CFG.map((cfg, i) => (
          <button
            key={i}
            onClick={() =>
              setFilter(() =>
                setFilterLevel(
                  filterLevel === String(i + 1) ? "All" : String(i + 1),
                ),
              )
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm
              ${filterLevel === String(i + 1) ? cfg.color : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />L{i + 1}{" "}
            {cfg.label}
          </button>
        ))}
        {filterLevel !== "All" && (
          <button
            onClick={() => {
              setFilterLevel("All");
              setPage(1);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-400 hover:text-red-500 hover:border-red-200 transition"
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* ── Search bar ── */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-45">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setFilter(() => setSearch(e.target.value))}
            placeholder="Search roles by name or ID…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-400"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilter(() => setFilterLevel(e.target.value))}
          className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 cursor-pointer text-gray-700"
        >
          <option value="All">All Levels</option>
          {uniqueLevels.map((l) => (
            <option key={l} value={l}>
              Level {l} — {getLevelCfg(l).label}
            </option>
          ))}
        </select>
        <button
          onClick={fetchRoles}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Refresh
        </button>
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} role{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ── */}
      <Card
        title="Roles"
        action={
          <span className="text-xs text-gray-400">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        }
      >
        {/* Error state */}
        {fetchError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Failed to load roles
              </p>
              <p className="text-xs text-red-500 mt-0.5">{fetchError}</p>
            </div>
            <button
              onClick={fetchRoles}
              className="ml-auto text-xs font-semibold text-red-600 hover:underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "#",
                  "Role Name",
                  "Level",
                  "Permissions",
                  "Created",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap
                    ${i <= 1 ? "text-left" : "text-center"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2
                      size={24}
                      className="mx-auto text-blue-400 spin mb-3"
                    />
                    <p className="text-sm text-gray-400">Loading roles…</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Shield size={30} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-400 mb-3">
                      {search || filterLevel !== "All"
                        ? "No roles match your filters."
                        : "No roles found."}
                    </p>
                    {!search && filterLevel === "All" && (
                      <button
                        onClick={() => setShowCreate(true)}
                        className="text-sm text-blue-600 font-medium hover:underline"
                      >
                        + Create first role
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((role, i) => {
                  const cfg = getLevelCfg(role.level);
                  const perms = role.extra_data?.permissions || [];

                  return (
                    <tr
                      key={role.id}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"} hover:bg-blue-50/20 transition border-b border-gray-50 last:border-b-0`}
                    >
                      {/* ID */}
                      <td className="py-3 px-4 text-xs text-gray-400 font-medium tabular-nums">
                        #{role.id}
                      </td>

                      {/* Name */}
                      <td
                        className="py-3 px-4 cursor-pointer"
                        onClick={() => setViewRole(role)}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${cfg.color}`}
                          >
                            <Shield size={14} />
                          </div>
                          <span className="text-sm font-medium text-blue-600 hover:underline">
                            {role.name}
                          </span>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                          />
                          L{role.level} · {cfg.label}
                        </span>
                      </td>

                      {/* Permission count */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-blue-400 transition-all"
                              style={{
                                width: `${(perms.length / ALL_PERMISSION_KEYS.length) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 tabular-nums">
                            {perms.length}
                          </span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap">
                        {role.created_at
                          ? new Date(role.created_at).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewRole(role)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition"
                            title="View"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => setEditRole(role)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 transition"
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(role)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition"
                            title="Delete"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </Card>

      {/* ── Modals / Overlays ── */}
      {showCreate && (
        <RoleFormModal
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
      {editRole && (
        <RoleFormModal
          role={editRole}
          onClose={() => setEditRole(null)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}
      {viewRole && (
        <RoleSidebar
          role={viewRole}
          onClose={() => setViewRole(null)}
          onEdit={(r) => {
            setViewRole(null);
            setEditRole(r);
          }}
          onDelete={(r) => {
            setViewRole(null);
            setDeleteTarget(r);
          }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          role={deleteTarget}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
