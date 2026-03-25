/**
 * ApplicationsPage.jsx  —  Role-based Applications Management
 *
 * ── JWT Role behaviour ──────────────────────────────────────────
 *  Level 1  Super Admin   sees all · HR final action
 *  Level 2  CEO           sees all · HR final action (read-heavy)
 *  Level 3  HR Admin      sees all · HR final action
 *  Level 4  HR Officer    sees all · HR final action
 *  Level 6  Dept Head     sees own dept only · HOD first-level action
 *  Level ≥7 Employee      sees own applications only · create / withdraw
 *
 * ── Approval flow ───────────────────────────────────────────────
 *  Employee submits → Pending
 *  HOD reviews      → HOD_Approved  (passes to HR)
 *                   → HOD_Rejected  (terminal)
 *  HR reviews       → Approved      (terminal ✓)
 *                   → Rejected      (terminal ✗)
 *
 * ── APIs needed in Apis.js ─────────────────────────────────────
 *  GetAllApplications   : `${mainOrigin}/applications`
 *  ApplicationStats     : `${mainOrigin}/applications/stats`
 *  ApplicationById      : (id) => `${mainOrigin}/applications/${id}`
 *  CreateApplication    : `${mainOrigin}/applications`
 *  HODAction            : (id) => `${mainOrigin}/applications/${id}/hod`
 *  HRAction             : (id) => `${mainOrigin}/applications/${id}/hr`
 *  UpdateApplication    : (id) => `${mainOrigin}/applications/${id}`
 *  DeleteApplication    : (id) => `${mainOrigin}/applications/${id}`
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X, Search, ChevronLeft, ChevronRight, SlidersHorizontal,
  CheckCircle2, XCircle, Clock, FileText, Plane, DollarSign,
  Filter, PlusCircle, Send, Loader2, AlertTriangle, RefreshCw,
  Crown, Shield, UserCheck, Users, AlertCircle, Eye,
  ThumbsUp, ThumbsDown, Pencil, Trash2, Info,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Animations ─── */
const _STYLES = `
  @keyframes ap-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ap-side { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes ap-spin { to{transform:rotate(360deg)} }
  .ap-in   { animation: ap-in   .22s ease-out both; }
  .ap-side { animation: ap-side .25s cubic-bezier(.4,0,.2,1); }
  .ap-spin { animation: ap-spin .85s linear infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("__ap_styles__")) {
  const el = document.createElement("style");
  el.id = "__ap_styles__";
  el.textContent = _STYLES;
  document.head.appendChild(el);
}

/* ─── JWT helper ─── */
function getAuth() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    const raw = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const p = JSON.parse(atob(raw));

    return {
      account_id: Number(p.sub),       // 🔹 login account id
      employee_id: Number(p.id),       // 🔹 actual employee.employee_id
      epi: Number(p.EPI),              // 🔹 FK if needed
      level: p.level ?? 99,
      department_id: p.department_id ?? null,
      name: p.name ?? p.full_name ?? null,
    };

  } catch {
    return null;
  }
}

/* ─── RBAC config ─── */
const LEVEL_META = {
  1: { label: "Super Admin", Icon: Crown,     color: "bg-red-50 text-red-700 border-red-200"         },
  2: { label: "CEO",         Icon: Crown,     color: "bg-amber-50 text-amber-700 border-amber-200"   },
  3: { label: "HR Admin",    Icon: Shield,    color: "bg-violet-50 text-violet-700 border-violet-200" },
  4: { label: "HR Officer",  Icon: Shield,    color: "bg-green-50 text-green-700 border-green-200"   },
  6: { label: "Dept Head",   Icon: UserCheck, color: "bg-blue-50 text-blue-700 border-blue-200"      },
};

function getRoleConfig(level) {
  const meta = LEVEL_META[level] ?? { label: `Level ${level}`, Icon: Users, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return {
    ...meta,
    isHR:       [1, 2, 3, 4].includes(level),
    isHOD:      level === 6,
    isEmployee: level >= 7,
    canCreate:  true,                          // everyone can submit
    canHOD:     level === 6,
    canHR:      [1, 2, 3, 4].includes(level),
    seesAll:    [1, 2, 3, 4].includes(level),
    seesDept:   level === 6,
  };
}

/* ─── Status config ─── */
const STATUS_CFG = {
  Pending:      { icon: Clock,         cls: "bg-violet-50 text-violet-700 border border-violet-200",  dot: "bg-violet-500"  },
  HOD_Approved: { icon: ThumbsUp,      cls: "bg-sky-50 text-sky-700 border border-sky-200",           dot: "bg-sky-500"     },
  HOD_Rejected: { icon: ThumbsDown,    cls: "bg-orange-50 text-orange-700 border border-orange-200",  dot: "bg-orange-500"  },
  Approved:     { icon: CheckCircle2,  cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500"},
  Rejected:     { icon: XCircle,       cls: "bg-red-50 text-red-700 border border-red-200",           dot: "bg-red-500"     },
};

const TYPE_CFG = {
  Leave:         { Icon: FileText,   cls: "bg-violet-50 text-violet-700" },
  Travel:        { Icon: Plane,      cls: "bg-blue-50 text-blue-700"     },
  Reimbursement: { Icon: DollarSign, cls: "bg-amber-50 text-amber-700"   },
};

const ALL_STATUSES  = ["Pending", "HOD_Approved", "HOD_Rejected", "Approved", "Rejected"];
const ALL_TYPES     = ["Leave", "Travel", "Reimbursement"];

/* ─── Shared badge primitives ─── */
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status];
  if (!cfg) return <span className="text-xs text-gray-400">{status}</span>;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <Icon size={10} />
      {status.replace("_", " ")}
    </span>
  );
}

function TypeChip({ type }) {
  const cfg = TYPE_CFG[type];
  if (!cfg) return <span className="text-xs text-gray-500">{type}</span>;
  const { Icon, cls } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${cls}`}>
      <Icon size={10} /> {type}
    </span>
  );
}

function Toast({ msg, type = "success" }) {
  if (!msg) return null;
  const bg = type === "error" ? "bg-red-600" : type === "info" ? "bg-blue-600" : "bg-emerald-600";
  const Icon = type === "error" ? XCircle : CheckCircle2;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-2xl text-sm font-medium ${bg} ap-in pointer-events-none`}>
      <Icon size={15} /> {msg}
    </div>
  );
}

/* ─── Reject Modal ─── */
function RejectModal({ title = "Reject Application", onSubmit, onCancel, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm ap-in px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-base font-semibold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">This reason will be visible to the employee.</p>
        <textarea
          rows={4}
          placeholder="Enter rejection reason…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 resize-none outline-none focus:border-red-400 transition"
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">
            Cancel
          </button>
          <button onClick={() => onSubmit(reason)} disabled={!reason.trim() || loading}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2">
            {loading && <Loader2 size={13} className="ap-spin" />}
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Application Modal ─── */
const EMPTY_FORM = { type: "Leave", from_date: "", to_date: "", reason: "", amount: "", destination: "" };

function CreateModal({ onClose, onCreated, showToast }) {
  const [form,   setForm]   = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.type)      e.type      = "Required";
    if (!form.from_date) e.from_date = "Required";
    if (!form.to_date)   e.to_date   = "Required";
    if (form.from_date && form.to_date && form.to_date < form.from_date)
      e.to_date = "Must be on or after From Date";
    if (!form.reason.trim())   e.reason = "Required";
    if (form.type === "Reimbursement" && !form.amount) e.amount = "Required for Reimbursement";
    if (form.type === "Travel"        && !form.destination.trim()) e.destination = "Required for Travel";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      type:        form.type,
      from_date:   form.from_date,
      to_date:     form.to_date,
      reason:      form.reason.trim(),
      ...(form.type === "Reimbursement" && { amount: Number(form.amount) }),
      ...(form.type === "Travel"        && { destination: form.destination.trim() }),
    };
    try {
      const res = await fetch(API.CreateApplication, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.detail || `Error ${res.status}`); }
      const saved = await res.json();
      onCreated(saved);
      showToast("Application submitted successfully.", "success");
      onClose();
    } catch (err) { showToast(err.message, "error"); }
    finally { setSaving(false); }
  };

  const LBL = "block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5";
  const INP = (err) => `w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-indigo-400 transition ${err ? "border-red-300" : "border-gray-200"}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm ap-in px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <PlusCircle size={15} className="text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">New Application</p>
            <p className="text-[11px] text-gray-400">Submit a leave, travel or reimbursement request</p>
          </div>
          <button onClick={onClose} disabled={saving}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-40">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className={LBL}>Application Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_TYPES.map(t => {
                const { Icon, cls } = TYPE_CFG[t];
                const active = form.type === t;
                return (
                  <button key={t} type="button" onClick={() => set("type", t)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition
                      ${active ? `${cls} border-current shadow-sm` : "border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50"}`}>
                    <Icon size={16} /> {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>From Date *</label>
              <input type="date" value={form.from_date} onChange={e => set("from_date", e.target.value)} className={INP(errors.from_date)} />
              {errors.from_date && <p className="text-xs text-red-500 mt-1">{errors.from_date}</p>}
            </div>
            <div>
              <label className={LBL}>To Date *</label>
              <input type="date" value={form.to_date} onChange={e => set("to_date", e.target.value)} className={INP(errors.to_date)} />
              {errors.to_date && <p className="text-xs text-red-500 mt-1">{errors.to_date}</p>}
            </div>
          </div>

          {form.type === "Reimbursement" && (
            <div>
              <label className={LBL}>Amount (PKR) *</label>
              <input type="number" min="0" value={form.amount} onChange={e => set("amount", e.target.value)}
                placeholder="e.g. 5000" className={INP(errors.amount)} />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
          )}

          {form.type === "Travel" && (
            <div>
              <label className={LBL}>Destination *</label>
              <input type="text" value={form.destination} onChange={e => set("destination", e.target.value)}
                placeholder="e.g. Karachi → Lahore" className={INP(errors.destination)} />
              {errors.destination && <p className="text-xs text-red-500 mt-1">{errors.destination}</p>}
            </div>
          )}

          <div>
            <label className={LBL}>Reason *</label>
            <textarea rows={3} value={form.reason} onChange={e => set("reason", e.target.value)}
              placeholder="Describe your request…"
              className={`${INP(errors.reason)} resize-none`} />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="ap-spin" /> Submitting…</> : <><Send size={13} /> Submit Application</>}
          </button>
          <button onClick={onClose} disabled={saving}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Sidebar ─── */
function Sidebar({ application, role, onClose, onRefresh, showToast }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [showReject,    setShowReject]    = useState(false);
  const [rejectContext, setRejectContext] = useState(""); // "hod" | "hr"

  if (!application) return null;

  const isTerminal = ["Approved", "Rejected", "HOD_Rejected"].includes(application.status);
  const canHODAction  = role.canHOD && application.status === "Pending";
  const canHRAction   = role.canHR  && ["Pending", "HOD_Approved"].includes(application.status);
  const canWithdraw   = role.isEmployee && application.status === "Pending" && !role.canHR && !role.canHOD;

  const doAction = async (endpoint, body) => {
    setActionLoading(true);
    try {
      const res = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body:    JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.detail || `Error ${res.status}`); }
      showToast("Action recorded.", "success");
      onRefresh();
      onClose();
    } catch (err) { showToast(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const doDelete = async () => {
    if (!window.confirm("Withdraw this application?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(API.DeleteApplication(application.id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.detail || `Error ${res.status}`); }
      showToast("Application withdrawn.", "success");
      onRefresh();
      onClose();
    } catch (err) { showToast(err.message, "error"); }
    finally { setActionLoading(false); }
  };

  const handleRejectSubmit = (reason) => {
    if (rejectContext === "hod") {
      doAction(API.HODAction(application.id), { action: "reject", rejection_reason: reason });
    } else {
      doAction(API.HRAction(application.id), { action: "reject", rejection_reason: reason });
    }
    setShowReject(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm ap-in" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 z-[101] w-full sm:w-[430px] bg-white shadow-2xl flex flex-col ap-side">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              Application <span className="text-gray-400 font-normal">#{application.id}</span>
            </p>
            <div className="mt-1"><StatusBadge status={application.status} /></div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Employee card */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4">
            <img src={application.employee_image || `https://i.pravatar.cc/150?u=${application.employee_id}`}
              alt={application.employee_name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-tight">{application.employee_name || `Employee #${application.employee_id}`}</p>
              {application.department_name && (
                <p className="text-xs text-gray-500 mt-0.5">{application.department_name}</p>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Type",      value: <TypeChip type={application.type} />       },
              { label: "Status",    value: <StatusBadge status={application.status} /> },
              { label: "From",      value: <span className="text-sm font-semibold text-gray-800">{application.from_date}</span> },
              { label: "To",        value: <span className="text-sm font-semibold text-gray-800">{application.to_date}</span>   },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">{label}</p>
                {value}
              </div>
            ))}
          </div>

          {/* Amount / destination */}
          {(application.amount || application.destination) && (
            <div className="grid grid-cols-1 gap-3">
              {application.amount && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-amber-500 mb-1">Amount</p>
                  <p className="text-sm font-bold text-gray-800">PKR {Number(application.amount).toLocaleString()}</p>
                </div>
              )}
              {application.destination && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-blue-500 mb-1">Destination</p>
                  <p className="text-sm font-semibold text-gray-800">{application.destination}</p>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">Reason</p>
            <p className="text-sm text-gray-700 leading-relaxed">{application.reason}</p>
          </div>

          {/* HOD decision trail */}
          {application.hod_actioner_name && (
            <div className={`rounded-xl p-4 border-l-4 ${
              application.status === "HOD_Rejected"
                ? "bg-orange-50 border-orange-400"
                : "bg-sky-50 border-sky-400"
            }`}>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">
                HOD {application.status === "HOD_Rejected" ? "Rejection" : "Approval"}
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-semibold">By:</span> {application.hod_actioner_name}
              </p>
              {application.hod_rejection_reason && (
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-semibold">Reason:</span> {application.hod_rejection_reason}
                </p>
              )}
            </div>
          )}

          {/* HR decision trail */}
          {application.hr_actioner_name && (
            <div className={`rounded-xl p-4 border-l-4 ${
              application.status === "Rejected" ? "bg-red-50 border-red-400" : "bg-emerald-50 border-emerald-400"
            }`}>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">
                HR {application.status === "Rejected" ? "Rejection" : "Approval"}
              </p>
              <p className="text-sm text-gray-800">
                <span className="font-semibold">By:</span> {application.hr_actioner_name}
              </p>
              {application.hr_rejection_reason && (
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-semibold">Reason:</span> {application.hr_rejection_reason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer — role-specific actions */}
        <div className="px-6 py-4 border-t border-gray-100">

          {/* HOD actions */}
          {canHODAction && (
            <div className="flex gap-3">
              <button disabled={actionLoading}
                onClick={() => doAction(API.HODAction(application.id), { action: "approve" })}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 size={13} className="ap-spin" /> : <ThumbsUp size={13} />}
                HOD Approve
              </button>
              <button disabled={actionLoading}
                onClick={() => { setRejectContext("hod"); setShowReject(true); }}
                className="flex-1 py-2.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-40 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                <ThumbsDown size={13} /> HOD Reject
              </button>
            </div>
          )}

          {/* HR actions */}
          {canHRAction && (
            <div className="flex gap-3">
              <button disabled={actionLoading}
                onClick={() => doAction(API.HRAction(application.id), { action: "approve" })}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 size={13} className="ap-spin" /> : <CheckCircle2 size={13} />}
                Approve
              </button>
              <button disabled={actionLoading}
                onClick={() => { setRejectContext("hr"); setShowReject(true); }}
                className="flex-1 py-2.5 border border-red-300 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-40 text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
                <XCircle size={13} /> Reject
              </button>
            </div>
          )}

          {/* Employee withdraw */}
          {canWithdraw && (
            <button disabled={actionLoading} onClick={doDelete}
              className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 text-sm font-medium rounded-xl transition flex items-center justify-center gap-2">
              <Trash2 size={13} /> Withdraw Application
            </button>
          )}

          {/* Terminal / no action */}
          {!canHODAction && !canHRAction && !canWithdraw && (
            <button onClick={onClose}
              className="w-full py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">
              Close
            </button>
          )}
        </div>
      </aside>

      {showReject && (
        <RejectModal
          title={rejectContext === "hod" ? "HOD Rejection" : "HR Rejection"}
          loading={actionLoading}
          onSubmit={handleRejectSubmit}
          onCancel={() => setShowReject(false)}
        />
      )}
    </>
  );
}

/* ─── Pagination ─── */
const PAGE_SIZE = 12;

function Pagination({ page, total, onChange }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
      <span className="text-xs text-gray-400">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
          if (p < 1 || p > totalPages) return null;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium border transition
                ${p === page ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>
              {p}
            </button>
          );
        })}
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════════════ */
export default function ApplicationsPage() {
  /* Auth */
  const auth = useMemo(() => getAuth(), []);
  const role = useMemo(() => getRoleConfig(auth?.level ?? 99), [auth]);
  const RoleIcon = role.Icon;

  /* Data */
  const [applications, setApplications] = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  /* Filters */
  const [search,   setSearch]   = useState("");
  const [fStatus,  setFStatus]  = useState("All");
  const [fType,    setFType]    = useState("All");
  const [fDept,    setFDept]    = useState("All");
  const [page,     setPage]     = useState(1);

  /* UI state */
  const [selected,    setSelected]    = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [toast,       setToast]       = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* ── Fetch applications ── */
  const fetchApplications = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
      const [appRes, statRes] = await Promise.all([
        fetch(API.GetAllApplications, { headers }),
        fetch(API.ApplicationStats,   { headers }),
      ]);
      if (!appRes.ok) throw new Error(`Error ${appRes.status}`);
      const appData  = await appRes.json();
      const statData = statRes.ok ? await statRes.json() : null;
      setApplications(Array.isArray(appData) ? appData : appData.items || []);
      setStats(statData);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  /* ── Filters ── */
  const depts = useMemo(() => [...new Set(applications.map(a => a.department_name).filter(Boolean))].sort(), [applications]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications.filter(a =>
      (fStatus === "All" || a.status === fStatus) &&
      (fType   === "All" || a.type   === fType)   &&
      (fDept   === "All" || a.department_name === fDept) &&
      (!q || (a.employee_name || "").toLowerCase().includes(q) ||
        (a.department_name || "").toLowerCase().includes(q) ||
        String(a.id).includes(q))
    );
  }, [applications, search, fStatus, fType, fDept]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sf = fn => { fn(); setPage(1); };

  const activePills = [
    fStatus !== "All" && { key: "status", label: fStatus.replace("_", " ") },
    fType   !== "All" && { key: "type",   label: fType   },
    fDept   !== "All" && { key: "dept",   label: fDept   },
    search             && { key: "q",     label: `"${search}"` },
  ].filter(Boolean);

  const clearPill = key => {
    setPage(1);
    if (key === "status") setFStatus("All");
    if (key === "type")   setFType("All");
    if (key === "dept")   setFDept("All");
    if (key === "q")      setSearch("");
  };

  /* ── Stat widgets ── */
  const STAT_CARDS = [
    { label: "Total",        value: stats?.total        ?? applications.length, Icon: FileText,  bg: "bg-gray-100",    ic: "text-gray-500",    num: "text-gray-800"    },
    { label: "Pending",      value: stats?.pending      ?? 0,                   Icon: Clock,     bg: "bg-violet-100",  ic: "text-violet-600",  num: "text-violet-700"  },
    { label: "HOD Approved", value: stats?.hod_approved ?? 0,                   Icon: ThumbsUp,  bg: "bg-sky-100",     ic: "text-sky-600",     num: "text-sky-700"     },
    { label: "Approved",     value: stats?.approved     ?? 0,                   Icon: CheckCircle2,bg:"bg-emerald-100",ic: "text-emerald-600", num: "text-emerald-700" },
    { label: "Rejected",     value: (stats?.rejected ?? 0) + (stats?.hod_rejected ?? 0), Icon: XCircle, bg: "bg-red-100", ic: "text-red-500", num: "text-red-700" },
  ];

  /* ── Role context banner ── */
  const roleBannerText = {
    isHR:       "You have full visibility across the organisation.",
    isHOD:      "Showing applications from your department. You can perform first-level approvals.",
    isEmployee: "Showing your own applications.",
  };

  return (
    <div className="p-5 sm:p-6 space-y-5 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ap-in">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Leave · Travel · Reimbursement requests</p>
        </div>
        <div className="flex items-center gap-2.5 self-start">
          {/* Role badge */}
          {auth && (
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${role.color}`}>
              <RoleIcon size={12} />
              <span>{role.label}</span>
            </div>
          )}
          <button onClick={fetchApplications} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 text-xs font-semibold rounded-xl transition disabled:opacity-40">
            <RefreshCw size={12} className={loading ? "ap-spin" : ""} />
          </button>
          {/* All roles can submit */}
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <PlusCircle size={15} /> New Application
          </button>
        </div>
      </div>

      {/* Role context banner */}
      {auth && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${role.color} ap-in`}>
          <RoleIcon size={14} className="mt-0.5 shrink-0" />
          <p className="text-xs font-medium">
            {role.isHR ? roleBannerText.isHR : role.isHOD ? roleBannerText.isHOD : roleBannerText.isEmployee}
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ label, value, Icon, bg, ic, num }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3 shadow-sm ap-in">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg} ${ic}`}>
              <Icon size={15} />
            </div>
            <div>
              <div className={`text-xl font-bold leading-none ${num}`}>{loading ? "…" : value}</div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button onClick={fetchApplications} className="text-xs font-semibold text-red-600 hover:underline shrink-0">Retry</button>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-3">
        <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />

        <div className="relative flex-1 min-w-[160px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => sf(() => setSearch(e.target.value))}
            placeholder="Search name, ID…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition placeholder-gray-400" />
        </div>

        <select value={fStatus} onChange={e => sf(() => setFStatus(e.target.value))}
          className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 cursor-pointer text-gray-700">
          <option value="All">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>

        <select value={fType} onChange={e => sf(() => setFType(e.target.value))}
          className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 cursor-pointer text-gray-700">
          <option value="All">All Types</option>
          {ALL_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>

        {/* Dept filter: only for seesAll roles */}
        {role.seesAll && depts.length > 0 && (
          <select value={fDept} onChange={e => sf(() => setFDept(e.target.value))}
            className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 cursor-pointer text-gray-700">
            <option value="All">All Depts</option>
            {depts.map(d => <option key={d}>{d}</option>)}
          </select>
        )}

        {activePills.length > 0 && (
          <button onClick={() => { setSearch(""); setFStatus("All"); setFType("All"); setFDept("All"); setPage(1); }}
            className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1.5 rounded-xl hover:bg-red-50 whitespace-nowrap">
            Clear all
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Active filter pills */}
      {activePills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activePills.map(f => (
            <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
              {f.label}
              <button className="opacity-60 hover:opacity-100 transition" onClick={() => clearPill(f.key)}>
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-800 text-sm">
            {role.seesAll ? "All Applications" : role.isHOD ? "Department Applications" : "My Applications"}
          </span>
          <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  { label: "#",          show: true,              left: true  },
                  { label: "Employee",   show: !role.isEmployee,  left: true  },
                  { label: "Department", show: role.seesAll,      left: false },
                  { label: "Type",       show: true,              left: true  },
                  { label: "Date Range", show: true,              left: false },
                  { label: "Status",     show: true,              left: false },
                  { label: "Action",     show: role.canHOD || role.canHR, left: false },
                ].filter(h => h.show).map(({ label, left }) => (
                  <th key={label}
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap ${left ? "text-left" : "text-center"}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Loader2 size={24} className="mx-auto ap-spin text-indigo-400 mb-3" />
                  <p className="text-sm text-gray-400">Loading applications…</p>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <FileText size={28} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">No applications found.</p>
                </td></tr>
              ) : paginated.map((a, idx) => {
                const stCfg = STATUS_CFG[a.status] || {};
                const isPending = a.status === "Pending";
                const isHODApproved = a.status === "HOD_Approved";

                return (
                  <tr key={a.id}
                    className={`hover:bg-indigo-50/20 cursor-pointer transition-colors ${idx < paginated.length - 1 ? "border-b border-gray-50" : ""}`}
                    onClick={() => setSelected(a)}>
                    <td className="px-4 py-3.5 text-xs text-gray-400 font-medium">#{a.id}</td>

                    {/* Employee — hidden for regular employee */}
                    {!role.isEmployee && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <img src={a.employee_image || `https://i.pravatar.cc/150?u=${a.employee_id}`}
                            alt={a.employee_name}
                            className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-800 text-sm leading-tight">{a.employee_name || `#${a.employee_id}`}</p>
                            <p className="text-xs text-gray-400">#{a.employee_id}</p>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Dept — seesAll only */}
                    {role.seesAll && (
                      <td className="px-4 py-3.5 text-center">
                        {a.department_name
                          ? <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">{a.department_name}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                    )}

                    <td className="px-4 py-3.5"><TypeChip type={a.type} /></td>

                    <td className="px-4 py-3.5 text-center">
                      <p className="text-xs font-semibold text-gray-700 tabular-nums whitespace-nowrap">{a.from_date}</p>
                      <p className="text-[10px] text-gray-400">→ {a.to_date}</p>
                    </td>

                    <td className="px-4 py-3.5 text-center"><StatusBadge status={a.status} /></td>

                    {/* Quick action column for HOD / HR */}
                    {(role.canHOD || role.canHR) && (
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        {/* HOD sees Pending, can act */}
                        {role.canHOD && isPending && (
                          <div className="flex items-center justify-center gap-1">
                            <button title="HOD Approve"
                              onClick={() => {
                                const url = API.HODAction(a.id);
                                fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` }, body: JSON.stringify({ action: "approve" }) })
                                  .then(r => r.ok ? fetchApplications() : r.json().then(d => showToast(d?.detail || "Error", "error")))
                                  .catch(() => showToast("Network error", "error"));
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-600 hover:text-white transition">
                              <ThumbsUp size={11} />
                            </button>
                            <button title="HOD Reject"
                              onClick={() => setSelected(a)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white transition">
                              <ThumbsDown size={11} />
                            </button>
                          </div>
                        )}
                        {/* HR sees Pending or HOD_Approved */}
                        {role.canHR && (isPending || isHODApproved) && (
                          <div className="flex items-center justify-center gap-1">
                            <button title="Approve"
                              onClick={() => {
                                fetch(API.HRAction(a.id), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` }, body: JSON.stringify({ action: "approve" }) })
                                  .then(r => r.ok ? fetchApplications() : r.json().then(d => showToast(d?.detail || "Error", "error")))
                                  .catch(() => showToast("Network error", "error"));
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition">
                              <CheckCircle2 size={11} />
                            </button>
                            <button title="Reject — open for reason"
                              onClick={() => setSelected(a)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition">
                              <XCircle size={11} />
                            </button>
                          </div>
                        )}
                        {/* No action available for this row */}
                        {!((role.canHOD && isPending) || (role.canHR && (isPending || isHODApproved))) && (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={filtered.length} onChange={setPage} />
      </div>

      {/* Sidebar */}
      {selected && (
        <Sidebar
          application={selected}
          role={role}
          onClose={() => setSelected(null)}
          onRefresh={fetchApplications}
          showToast={showToast}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => fetchApplications()}
          showToast={showToast}
        />
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}