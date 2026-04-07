/**
 * FinanceDashboard.jsx
 *
 * A dark, high-contrast financial dashboard with a premium "trading terminal" feel.
 * Slate/charcoal background, emerald/amber accents, monospaced numbers.
 *
 * Features:
 *   - Personal employee dashboard (same as employee view — attendance, leaves)
 *   - Employee salary directory (all employees + their salary/FTM data)
 *   - FTM management: Create, edit, submit for CEO approval, mark paid
 *   - CEO approval inbox (shown when viewed by CEO: level ≤ 2)
 *   - Stats widgets: total payroll, pending approval, paid this month
 *
 * APIs consumed (adjust BASE_URL / API object as needed):
 *   GET  /employees/                → employee list with salary info
 *   GET  /ftm/?pay_month=&pay_year= → list of FTMs
 *   GET  /ftm/stats                 → FTMStats
 *   POST /ftm/                      → create FTM
 *   PATCH /ftm/{id}                 → update FTM
 *   DELETE /ftm/{id}
 *   POST /ftm/{id}/submit
 *   POST /ftm/{id}/approve          (CEO)
 *   POST /ftm/{id}/reject           (CEO)
 *   POST /ftm/{id}/mark-paid
 *   GET  /attendance/my             → own attendance
 *   GET  /leaves/my                 → own leaves
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DollarSign, TrendingUp, Clock, CheckCircle2, XCircle,
  AlertTriangle, FileText, Users, Send, Loader2,
  RefreshCw, ChevronLeft, ChevronRight, Edit3, Trash2,
  Eye, PlusCircle, X, Search, Filter, Award,
  ThumbsUp, ThumbsDown, CreditCard, BarChart3,
  Calendar, Building2, Briefcase, ArrowUpRight,
  ArrowDownRight, Minus, ChevronDown, AlertCircle,
  UserCheck, Activity, Wallet,
} from "lucide-react";

/* ─── Inject styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  @keyframes fdFade   { from{opacity:0} to{opacity:1} }
  @keyframes fdUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fdRight  { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes fdSpin   { to{transform:rotate(360deg)} }
  @keyframes fdPulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fdGlow   { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.3)} 50%{box-shadow:0 0 20px 4px rgba(16,185,129,.15)} }
  .fd-fade  { animation: fdFade .2s ease-out; }
  .fd-up    { animation: fdUp .3s cubic-bezier(.4,0,.2,1) both; }
  .fd-right { animation: fdRight .32s cubic-bezier(.4,0,.2,1); }
  .fd-spin  { animation: fdSpin .85s linear infinite; }
  .fd-pulse { animation: fdPulse 1.6s ease-in-out infinite; }
  .fd-glow  { animation: fdGlow 2s ease-in-out infinite; }
  .fd-num   { font-family: 'JetBrains Mono', monospace; }
  .fd-head  { font-family: 'Syne', sans-serif; }
`;
if (typeof document !== "undefined" && !document.getElementById("__fd_styles__")) {
  const s = document.createElement("style"); s.id = "__fd_styles__"; s.innerHTML = STYLES;
  document.head.appendChild(s);
}

/* ─── Helpers ─── */
const BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:8000";
function getHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}
function getMyLevel() {
  try { return JSON.parse(atob(localStorage.getItem("access_token")?.split(".")[1] || "e30=")).level ?? 99; }
  catch { return 99; }
}
function getMyId() {
  try { return JSON.parse(atob(localStorage.getItem("access_token")?.split(".")[1] || "e30=")).sub ?? null; }
  catch { return null; }
}
function fmtPKR(n) {
  if (n == null) return "—";
  return "PKR " + Number(n).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(iso) { return iso ? String(iso).slice(0, 10) : "—"; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["","January","February","March","April","May","June","July","August","September","October","November","December"];

const FTM_STATUS_CFG = {
  Draft:     { badge: "bg-slate-700 text-slate-300",     dot: "bg-slate-400"   },
  Submitted: { badge: "bg-amber-900/60 text-amber-300",  dot: "bg-amber-400 fd-pulse" },
  Approved:  { badge: "bg-emerald-900/60 text-emerald-300", dot: "bg-emerald-400" },
  Paid:      { badge: "bg-green-900/60 text-green-300",  dot: "bg-green-500"   },
  Rejected:  { badge: "bg-red-900/60 text-red-300",      dot: "bg-red-400"     },
};

/* ─── Toast ─── */
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl pointer-events-none fd-fade fd-num ${type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
      {type === "error" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />} {msg}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ title, value, sub, icon: Icon, color, mono, loading, glow }) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-start gap-4 fd-up ${glow ? "fd-glow" : ""}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 fd-head uppercase tracking-widest">{title}</p>
        {loading
          ? <div className="h-8 w-24 bg-slate-700 rounded animate-pulse mt-1" />
          : <p className={`text-2xl font-bold text-white mt-0.5 ${mono ? "fd-num" : "fd-head"}`}>{value}</p>}
        {sub && !loading && <p className="text-xs text-slate-500 mt-0.5 fd-head">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── FTM Status Badge ─── */
function FTMBadge({ status }) {
  const cfg = FTM_STATUS_CFG[status] || FTM_STATUS_CFG.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full fd-num ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} /> {status}
    </span>
  );
}

/* ─── FTM Form Modal ─── */
const MONTHS_LIST = MONTH_FULL.slice(1).map((m, i) => ({ label: m, value: i + 1 }));
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const EMPTY_FTM = {
  employee_id: "",
  pay_month: CURRENT_MONTH,
  pay_year: CURRENT_YEAR,
  basic_salary: "",
  allowances: { housing: 0, transport: 0, medical: 0, other: 0 },
  deductions: { tax: 0, loan: 0, penalty: 0, other: 0 },
  notes: "",
};

function FTMFormModal({ ftm, employees, onClose, onSaved, showToast }) {
  const isEdit = !!ftm;
  const [form,   setForm]   = useState(isEdit ? {
    employee_id:  ftm.employee_id,
    pay_month:    ftm.pay_month,
    pay_year:     ftm.pay_year,
    basic_salary: ftm.basic_salary,
    allowances:   { ...{ housing: 0, transport: 0, medical: 0, other: 0 }, ...(ftm.allowances || {}) },
    deductions:   { ...{ tax: 0, loan: 0, penalty: 0, other: 0 }, ...(ftm.deductions || {}) },
    notes:        ftm.notes || "",
  } : { ...EMPTY_FTM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };
  const setNested = (group, k, v) => setForm(p => ({ ...p, [group]: { ...p[group], [k]: parseFloat(v) || 0 } }));

  // Live compute
  const totalAllow = Object.values(form.allowances).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const totalDeduct = Object.values(form.deductions).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const gross = (parseFloat(form.basic_salary) || 0) + totalAllow;
  const net   = gross - totalDeduct;

  const validate = () => {
    const e = {};
    if (!form.employee_id)  e.employee_id  = "Required";
    if (!form.basic_salary) e.basic_salary = "Required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      employee_id:  parseInt(form.employee_id),
      pay_month:    parseInt(form.pay_month),
      pay_year:     parseInt(form.pay_year),
      basic_salary: parseFloat(form.basic_salary),
      allowances:   form.allowances,
      deductions:   form.deductions,
      notes:        form.notes || null,
    };
    try {
      const url    = isEdit ? `${BASE_URL}/ftm/${ftm.id}` : `${BASE_URL}/ftm/`;
      const method = isEdit ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.detail || `Error ${res.status}`); }
      const saved = await res.json();
      showToast(isEdit ? "FTM updated." : "FTM created.", "success");
      onSaved(saved);
      onClose();
    } catch (err) { showToast(err.message, "error"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition placeholder-slate-500 fd-num";
  const labelCls = "text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 block fd-head";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm fd-fade">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[94vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
              <DollarSign size={16} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm fd-head">{isEdit ? "Edit FTM" : "Create Financial Transaction Memo"}</h2>
              <p className="text-xs text-slate-400 fd-head">Salary payment memo for CEO approval</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-600 text-slate-400 hover:border-red-500 hover:text-red-400 transition">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Employee + Period */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className={labelCls}>Employee *</label>
              <select value={form.employee_id} onChange={e => setField("employee_id", e.target.value)}
                className={`${inputCls} cursor-pointer ${errors.employee_id ? "border-red-500" : ""}`}>
                <option value="">Select…</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.f_name} {emp.l_name}</option>
                ))}
              </select>
              {errors.employee_id && <p className="text-xs text-red-400 mt-1">{errors.employee_id}</p>}
            </div>
            <div>
              <label className={labelCls}>Month</label>
              <select value={form.pay_month} onChange={e => setField("pay_month", e.target.value)} className={`${inputCls} cursor-pointer`}>
                {MONTHS_LIST.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Year</label>
              <input type="number" value={form.pay_year} onChange={e => setField("pay_year", e.target.value)}
                className={inputCls} min={2020} max={2030} />
            </div>
          </div>

          {/* Basic Salary */}
          <div>
            <label className={labelCls}>Basic Salary (PKR) *</label>
            <input type="number" value={form.basic_salary} onChange={e => setField("basic_salary", e.target.value)}
              placeholder="0.00" className={`${inputCls} ${errors.basic_salary ? "border-red-500" : ""}`} />
            {errors.basic_salary && <p className="text-xs text-red-400 mt-1">{errors.basic_salary}</p>}
          </div>

          {/* Allowances + Deductions side by side */}
          <div className="grid grid-cols-2 gap-5">
            {/* Allowances */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 fd-head uppercase tracking-widest">Allowances</span>
                <span className="ml-auto text-xs fd-num text-emerald-300 font-bold">+{fmtPKR(totalAllow)}</span>
              </div>
              {[
                { key: "housing",   label: "Housing" },
                { key: "transport", label: "Transport" },
                { key: "medical",   label: "Medical" },
                { key: "other",     label: "Other" },
              ].map(({ key, label }) => (
                <div key={key} className="mb-2 last:mb-0">
                  <label className="text-[10px] text-slate-400 fd-head">{label}</label>
                  <input type="number" value={form.allowances[key]} min={0}
                    onChange={e => setNested("allowances", key, e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 transition fd-num" />
                </div>
              ))}
            </div>

            {/* Deductions */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownRight size={14} className="text-red-400" />
                <span className="text-xs font-bold text-red-400 fd-head uppercase tracking-widest">Deductions</span>
                <span className="ml-auto text-xs fd-num text-red-300 font-bold">-{fmtPKR(totalDeduct)}</span>
              </div>
              {[
                { key: "tax",     label: "Income Tax" },
                { key: "loan",    label: "Loan" },
                { key: "penalty", label: "Penalty" },
                { key: "other",   label: "Other" },
              ].map(({ key, label }) => (
                <div key={key} className="mb-2 last:mb-0">
                  <label className="text-[10px] text-slate-400 fd-head">{label}</label>
                  <input type="number" value={form.deductions[key]} min={0}
                    onChange={e => setNested("deductions", key, e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 transition fd-num" />
                </div>
              ))}
            </div>
          </div>

          {/* Live Pay Preview */}
          <div className="bg-gradient-to-r from-emerald-900/30 to-slate-800/60 border border-emerald-700/40 rounded-2xl p-4">
            <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 mb-3 fd-head">Pay Preview</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Gross Pay",  value: gross,         color: "text-emerald-300" },
                { label: "Deductions", value: -totalDeduct,  color: "text-red-300" },
                { label: "Net Pay",    value: net,           color: "text-white" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className="text-[10px] text-slate-400 fd-head mb-1">{label}</div>
                  <div className={`text-lg font-black fd-num ${color}`}>{fmtPKR(Math.abs(value))}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <textarea rows={2} value={form.notes} onChange={e => setField("notes", e.target.value)}
              placeholder="Any additional notes for this payment…"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 resize-none transition placeholder-slate-500 fd-head" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3 bg-slate-800/40">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 fd-head">
            {saving ? <><Loader2 size={14} className="fd-spin" /> Saving…</> : <><FileText size={14} /> {isEdit ? "Save Changes" : "Create FTM"}</>}
          </button>
          <button onClick={onClose} disabled={saving} className="py-2.5 px-5 border border-slate-600 text-slate-400 hover:bg-slate-700 text-sm font-medium rounded-xl transition fd-head">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Employee Salary Row ─── */
function EmployeeSalaryRow({ emp, ftm, onCreateFTM, onViewFTM }) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/40 transition group">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {(emp.f_name?.[0] || "?")}{(emp.l_name?.[0] || "")}
          </div>
          <div>
            <div className="text-sm font-semibold text-white fd-head">{emp.f_name} {emp.l_name}</div>
            <div className="text-xs text-slate-500">{emp.designation || "—"}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-slate-400">{emp.department?.name || emp.department_name || "—"}</td>
      <td className="py-3 px-4 text-xs text-slate-400 fd-num">{emp.employee_id ? `EMP-${emp.employee_id}` : "—"}</td>
      <td className="py-3 px-4">
        {ftm ? (
          <div>
            <div className="text-sm font-bold text-white fd-num">{fmtPKR(ftm.net_pay)}</div>
            <div className="text-xs text-slate-500 fd-num">{ftm.pay_label}</div>
          </div>
        ) : (
          <span className="text-xs text-slate-600">No FTM</span>
        )}
      </td>
      <td className="py-3 px-4">
        {ftm ? <FTMBadge status={ftm.status} /> : <span className="text-xs text-slate-600">—</span>}
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
          {ftm ? (
            <button onClick={() => onViewFTM(ftm)} title="View FTM"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition">
              <Eye size={12} />
            </button>
          ) : (
            <button onClick={() => onCreateFTM(emp)} title="Create FTM"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 text-xs font-bold hover:bg-emerald-600/30 transition fd-head">
              <PlusCircle size={11} /> FTM
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── FTM Detail Sidebar ─── */
function FTMSidebar({ ftm: initialFtm, myLevel, onClose, onEdit, onUpdated, showToast }) {
  const [ftm,    setFtm]    = useState(initialFtm);
  const [acting, setActing] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason,    setRejectReason]    = useState("");

  const isCEO     = myLevel <= 2;
  const isFinance = myLevel === 5 || myLevel <= 2;

  const doAction = async (url, method = "POST", body = null) => {
    setActing(true);
    try {
      const res = await fetch(url, { method, headers: getHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.detail || `Error ${res.status}`); }
      const updated = await res.json();
      setFtm(updated);
      onUpdated(updated);
      return updated;
    } catch (err) { showToast(err.message, "error"); return null; }
    finally { setActing(false); }
  };

  const labelCls = "text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 block fd-head";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm fd-fade" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-[51] w-full sm:w-[520px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col fd-right">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/60 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <FTMBadge status={ftm.status} />
              {ftm.rejection_reason && (
                <span className="text-xs text-red-400 fd-head">Rejected — see below</span>
              )}
            </div>
            <h2 className="text-base font-bold text-white fd-head">{ftm.employee_name || `Employee #${ftm.employee_id}`}</h2>
            <p className="text-xs text-slate-400 fd-num mt-0.5">{ftm.pay_label} · {ftm.employee_designation || "—"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-600 text-slate-400 hover:border-red-500 hover:text-red-400 transition">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Pay summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Basic",       value: ftm.basic_salary, color: "text-slate-200" },
              { label: "Gross Pay",   value: ftm.gross_pay,    color: "text-emerald-300" },
              { label: "Net Pay",     value: ftm.net_pay,      color: "text-white" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
                <div className={labelCls}>{label}</div>
                <div className={`text-base font-black fd-num ${color}`}>{fmtPKR(value)}</div>
              </div>
            ))}
          </div>

          {/* Allowances breakdown */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight size={13} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 fd-head uppercase tracking-widest">Allowances</span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(ftm.allowances || {}).filter(([, v]) => v > 0).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 capitalize fd-head">{k}</span>
                  <span className="text-emerald-300 fd-num">+{fmtPKR(v)}</span>
                </div>
              ))}
              {Object.values(ftm.allowances || {}).every(v => v === 0) && (
                <p className="text-xs text-slate-600">No allowances</p>
              )}
            </div>
          </div>

          {/* Deductions breakdown */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownRight size={13} className="text-red-400" />
              <span className="text-xs font-bold text-red-400 fd-head uppercase tracking-widest">Deductions</span>
            </div>
            <div className="space-y-1.5">
              {Object.entries(ftm.deductions || {}).filter(([, v]) => v > 0).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 capitalize fd-head">{k}</span>
                  <span className="text-red-300 fd-num">-{fmtPKR(v)}</span>
                </div>
              ))}
              {Object.values(ftm.deductions || {}).every(v => v === 0) && (
                <p className="text-xs text-slate-600">No deductions</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Created By",   value: ftm.created_by_name || "—" },
              { label: "Created",      value: fmtDate(ftm.created_at) },
              { label: "Approved By",  value: ftm.approved_by_name || "Pending" },
              { label: "Approved At",  value: fmtDate(ftm.approved_at) },
              { label: "Paid At",      value: fmtDate(ftm.paid_at) },
              { label: "Updated",      value: fmtDate(ftm.updated_at) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                <div className={labelCls}>{label}</div>
                <div className="text-sm font-semibold text-slate-200 fd-head">{value}</div>
              </div>
            ))}
          </div>

          {/* Rejection reason */}
          {ftm.rejection_reason && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
              <div className="text-xs font-bold text-red-400 fd-head mb-1">Rejection Reason</div>
              <p className="text-sm text-red-200 fd-head">{ftm.rejection_reason}</p>
            </div>
          )}

          {/* Notes */}
          {ftm.notes && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className={labelCls}>Notes</div>
              <p className="text-sm text-slate-300 fd-head leading-relaxed">{ftm.notes}</p>
            </div>
          )}

          {/* Reject input */}
          {showRejectInput && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 fd-fade">
              <label className="text-xs font-bold text-red-400 fd-head block mb-2">Rejection Reason (optional)</label>
              <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why this FTM is being rejected…"
                className="w-full bg-slate-800 border border-red-700/50 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500 resize-none fd-head" />
              <div className="flex gap-2 mt-3">
                <button onClick={() => doAction(`${BASE_URL}/ftm/${ftm.id}/reject`, "POST", { reason: rejectReason }).then(u => u && showToast("FTM rejected.", "error"))}
                  disabled={acting}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition fd-head flex items-center justify-center gap-1">
                  {acting ? <Loader2 size={12} className="fd-spin" /> : <ThumbsDown size={12} />} Confirm Reject
                </button>
                <button onClick={() => setShowRejectInput(false)} className="px-4 py-2 border border-slate-600 text-slate-400 rounded-xl text-sm fd-head hover:bg-slate-700 transition">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/40 flex flex-wrap gap-2">

          {/* Finance: Edit (Draft/Rejected) */}
          {isFinance && ["Draft", "Rejected"].includes(ftm.status) && (
            <button onClick={() => { onEdit(ftm); onClose(); }} disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition fd-head">
              <Edit3 size={13} /> Edit
            </button>
          )}

          {/* Finance: Submit for CEO approval */}
          {isFinance && ftm.status === "Draft" && myLevel !== 2 && (
            <button onClick={() => doAction(`${BASE_URL}/ftm/${ftm.id}/submit`).then(u => u && showToast("Submitted for CEO approval."))}
              disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition fd-head">
              {acting ? <Loader2 size={13} className="fd-spin" /> : <Send size={13} />} Submit for Approval
            </button>
          )}

          {/* CEO: Approve */}
          {isCEO && ftm.status === "Submitted" && (
            <button onClick={() => doAction(`${BASE_URL}/ftm/${ftm.id}/approve`).then(u => u && showToast("FTM approved!"))}
              disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition fd-head">
              {acting ? <Loader2 size={13} className="fd-spin" /> : <ThumbsUp size={13} />} Approve
            </button>
          )}

          {/* CEO: Reject */}
          {isCEO && ftm.status === "Submitted" && !showRejectInput && (
            <button onClick={() => setShowRejectInput(true)} disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-red-700/50 text-red-400 hover:bg-red-900/20 text-sm font-bold rounded-xl transition fd-head">
              <ThumbsDown size={13} /> Reject
            </button>
          )}

          {/* Finance: Mark Paid */}
          {isFinance && ftm.status === "Approved" && myLevel !== 2 && (
            <button onClick={() => doAction(`${BASE_URL}/ftm/${ftm.id}/mark-paid`).then(u => u && showToast("Marked as paid! 💸"))}
              disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-700 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition fd-head fd-glow">
              {acting ? <Loader2 size={13} className="fd-spin" /> : <CreditCard size={13} />} Mark Paid
            </button>
          )}

          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-600 text-slate-400 hover:bg-slate-700 text-sm font-medium rounded-xl transition fd-head text-center min-w-[60px]">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Self Info Card ─── */
function SelfInfoCard({ employee, attendanceToday, leaveSummary }) {
  if (!employee) return null;
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 fd-up">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl font-black text-white flex-shrink-0">
          {employee.f_name?.[0]}{employee.l_name?.[0]}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-white fd-head">{employee.f_name} {employee.l_name}</h3>
          <p className="text-sm text-slate-400 fd-head">{employee.designation || "—"} · {employee.department?.name || "—"}</p>
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { label: "Status",    value: employee.employment_status, color: employee.employment_status === "active" ? "text-emerald-400" : "text-amber-400" },
              { label: "Since",     value: fmtDate(employee.join_date), color: "text-slate-300" },
              { label: "Remote",    value: employee.is_remote ? "Yes" : "No", color: employee.is_remote ? "text-blue-400" : "text-slate-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-700/50 rounded-xl px-3 py-2">
                <div className="text-[10px] text-slate-500 fd-head uppercase tracking-widest">{label}</div>
                <div className={`text-xs font-bold fd-head capitalize ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave summary strip */}
      {leaveSummary && (
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-700">
          {[
            { label: "Annual", used: leaveSummary.annual_used ?? 0, total: leaveSummary.annual_total ?? 21 },
            { label: "Sick",   used: leaveSummary.sick_used   ?? 0, total: leaveSummary.sick_total   ?? 10 },
            { label: "Casual", used: leaveSummary.casual_used ?? 0, total: leaveSummary.casual_total ?? 7 },
            { label: "Pending",used: leaveSummary.pending     ?? 0, total: null },
          ].map(({ label, used, total }) => (
            <div key={label} className="text-center bg-slate-700/30 rounded-xl py-2">
              <div className="text-[10px] text-slate-500 fd-head uppercase tracking-widest">{label}</div>
              <div className="text-sm font-black text-white fd-num">{used}{total ? `/${total}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Finance Dashboard
═══════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10;

export default function FinanceDashboard() {
  const myLevel = useMemo(() => getMyLevel(), []);
  const myId    = useMemo(() => getMyId(), []);
  const isCEO   = myLevel <= 2;

  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());

  const [activeTab, setActiveTab] = useState("payroll"); // payroll | pending | self
  const [employees,  setEmployees]  = useState([]);
  const [ftms,       setFtms]       = useState([]);
  const [stats,      setStats]      = useState(null);
  const [selfData,   setSelfData]   = useState(null);
  const [selfLeaves, setSelfLeaves] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [statsLoad,  setStatsLoad]  = useState(true);

  const [search,      setSearch]      = useState("");
  const [filterStatus,setFilterStatus]= useState("All");
  const [page,        setPage]        = useState(1);

  const [showForm,     setShowForm]     = useState(false);
  const [editFTM,      setEditFTM]      = useState(null);
  const [viewFTM,      setViewFTM]      = useState(null);
  const [preselEmp,    setPreselEmp]    = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, ftmRes] = await Promise.all([
        fetch(`${BASE_URL}/employees/?limit=200`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/ftm/?pay_month=${selMonth}&pay_year=${selYear}&limit=200`, { headers: getHeaders() }),
      ]);
      if (empRes.ok) {
        const d = await empRes.json();
        setEmployees(Array.isArray(d) ? d : d.employees || []);
      }
      if (ftmRes.ok) {
        const d = await ftmRes.json();
        setFtms(Array.isArray(d) ? d : d.ftms || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [selMonth, selYear]);

  const fetchStats = useCallback(async () => {
    setStatsLoad(true);
    try {
      const res = await fetch(`${BASE_URL}/ftm/stats?pay_month=${selMonth}&pay_year=${selYear}`, { headers: getHeaders() });
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
    finally { setStatsLoad(false); }
  }, [selMonth, selYear]);

  const fetchSelf = useCallback(async () => {
    try {
      const [empRes, leaveRes] = await Promise.all([
        fetch(`${BASE_URL}/employees/me`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/leaves/my/summary`, { headers: getHeaders() }),
      ]);
      if (empRes.ok)   setSelfData(await empRes.json());
      if (leaveRes.ok) setSelfLeaves(await leaveRes.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchAll(); fetchStats(); fetchSelf(); }, [fetchAll, fetchStats, fetchSelf]);

  const upsertFTM = useCallback((updated) => {
    setFtms(prev => {
      const idx = prev.findIndex(f => f.id === updated.id);
      return idx >= 0 ? prev.map(f => f.id === updated.id ? updated : f) : [updated, ...prev];
    });
    fetchStats();
  }, [fetchStats]);

  // Map employee_id → ftm for current period
  const ftmByEmpId = useMemo(() => {
    const map = {};
    ftms.forEach(f => { map[f.employee_id] = f; });
    return map;
  }, [ftms]);

  // Pending list (CEO view or finance tracking)
  const pendingFtms = useMemo(() =>
    ftms.filter(f => f.status === "Submitted"),
  [ftms]);

  // Filtered employees for payroll tab
  const filteredEmps = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(emp => {
      const ftm = ftmByEmpId[emp.id];
      const matchQ = !q || `${emp.f_name} ${emp.l_name}`.toLowerCase().includes(q) || (emp.designation || "").toLowerCase().includes(q);
      const matchStatus = filterStatus === "All" ||
        (filterStatus === "No FTM" ? !ftm : ftm?.status === filterStatus);
      return matchQ && matchStatus;
    });
  }, [employees, ftmByEmpId, search, filterStatus]);

  const totalPages = Math.ceil(filteredEmps.length / PAGE_SIZE);
  const paginated  = filteredEmps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreateFTM = (emp) => {
    setPreselEmp(emp);
    setEditFTM(null);
    setShowForm(true);
  };

  // Inject preselected employee into form
  const formEmployees = useMemo(() => {
    if (preselEmp && !employees.find(e => e.id === preselEmp.id)) return [preselEmp, ...employees];
    return employees;
  }, [employees, preselEmp]);

  const TABS = [
    { key: "payroll", label: "Payroll",          icon: BarChart3 },
    { key: "pending", label: isCEO ? "Pending Approval" : "Awaiting CEO", icon: Clock, badge: pendingFtms.length },
    { key: "self",    label: "My Profile",        icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 lg:px-8 py-10">

      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-xl">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white fd-head">Finance</h1>
              <p className="text-sm text-slate-500 fd-head">Payroll & FTM Management</p>
            </div>
          </div>
        </div>

        {/* Period selector + actions */}
        <div className="flex items-center gap-3 flex-wrap self-start">
          {/* Month/Year picker */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <select value={selMonth} onChange={e => { setSelMonth(Number(e.target.value)); setPage(1); }}
              className="bg-transparent text-sm text-white px-3 py-2 outline-none cursor-pointer fd-num">
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={selYear} onChange={e => { setSelYear(Number(e.target.value)); setPage(1); }}
              className="bg-transparent text-sm text-white px-3 py-2 outline-none cursor-pointer fd-num border-l border-slate-700">
              {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={() => { fetchAll(); fetchStats(); }} disabled={loading}
            className="w-9 h-9 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition disabled:opacity-40">
            <RefreshCw size={14} className={loading ? "fd-spin" : ""} />
          </button>
          {!isCEO && (
            <button onClick={() => { setEditFTM(null); setPreselEmp(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition shadow-lg fd-head">
              <PlusCircle size={15} /> New FTM
            </button>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total FTMs"      value={stats?.total       ?? "—"}          icon={FileText}     color="bg-slate-700 text-slate-300"            loading={statsLoad} />
        <StatCard title="Pending CEO"     value={stats?.submitted   ?? "—"}          icon={Clock}        color="bg-amber-900/60 text-amber-300"         loading={statsLoad} glow={stats?.submitted > 0} />
        <StatCard title="Approved"        value={stats?.approved    ?? "—"}          icon={CheckCircle2} color="bg-emerald-900/60 text-emerald-300"     loading={statsLoad} />
        <StatCard title="Paid This Month" value={stats?.paid        ?? "—"}          icon={CreditCard}   color="bg-green-900/60 text-green-300"         loading={statsLoad} />
        <StatCard title="Total Payroll"   value={stats ? fmtPKR(stats.total_net_pay) : "—"} icon={DollarSign} color="bg-teal-900/60 text-teal-300" loading={statsLoad} mono />
      </div>

      {/* CEO Pending alert */}
      {isCEO && pendingFtms.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-900/30 border border-amber-700/50 rounded-2xl px-5 py-3 mb-6 fd-glow">
          <AlertTriangle size={15} className="text-amber-400 mt-0.5 flex-shrink-0 fd-pulse" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-300 fd-head">
              {pendingFtms.length} FTM{pendingFtms.length !== 1 ? "s" : ""} awaiting your approval
            </p>
          </div>
          <button onClick={() => setActiveTab("pending")} className="text-xs font-bold text-amber-400 hover:underline fd-head">
            Review now →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 border border-slate-700 rounded-2xl p-1 mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition fd-head ${
              activeTab === key
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}>
            <Icon size={14} /> {label}
            {badge > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full fd-num">{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Payroll */}
      {activeTab === "payroll" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search employees…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-white placeholder-slate-600 transition" />
            </div>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="text-sm bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 outline-none cursor-pointer focus:border-emerald-500 transition">
              <option value="All">All Status</option>
              <option value="No FTM">No FTM</option>
              {["Draft","Submitted","Approved","Paid","Rejected"].map(s => <option key={s}>{s}</option>)}
            </select>
            <span className="ml-auto text-xs text-slate-500 fd-num">{filteredEmps.length} employees</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Employee","Department","Emp ID","Net Pay","FTM Status","Action"].map((h, i) => (
                    <th key={h} className={`py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 fd-head whitespace-nowrap ${i === 0 ? "text-left" : "text-center"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-16 text-center">
                    <Loader2 size={24} className="mx-auto mb-3 fd-spin text-slate-600" />
                    <p className="text-sm text-slate-500 fd-head">Loading payroll data…</p>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center">
                    <Users size={32} className="mx-auto mb-3 text-slate-700" />
                    <p className="text-sm text-slate-500 fd-head">No employees found.</p>
                  </td></tr>
                ) : paginated.map(emp => (
                  <EmployeeSalaryRow
                    key={emp.id} emp={emp} ftm={ftmByEmpId[emp.id]}
                    onCreateFTM={openCreateFTM}
                    onViewFTM={f => setViewFTM(f)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center px-5 py-4 border-t border-slate-800">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-400 hover:border-slate-600 disabled:opacity-40 transition fd-head">
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs text-slate-500 fd-num">{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filteredEmps.length)} of {filteredEmps.length}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-400 hover:border-slate-600 disabled:opacity-40 transition fd-head">
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Pending Approval */}
      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingFtms.length === 0 ? (
            <div className="flex items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-center">
                <CheckCircle2 size={36} className="text-emerald-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400 fd-head">No FTMs pending approval</p>
              </div>
            </div>
          ) : pendingFtms.map(ftm => (
            <div key={ftm.id} className="bg-slate-900 border border-amber-700/30 rounded-2xl p-5 flex items-center gap-5 fd-up hover:border-amber-600/50 transition">
              <div className="w-11 h-11 rounded-xl bg-amber-900/30 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base font-bold text-white fd-head">{ftm.employee_name}</span>
                  <FTMBadge status={ftm.status} />
                </div>
                <p className="text-xs text-slate-400 fd-head">{ftm.pay_label} · {ftm.department_name || "—"}</p>
                <p className="text-xs text-slate-500 fd-head mt-0.5">Created by {ftm.created_by_name} · {fmtDate(ftm.created_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-black text-white fd-num">{fmtPKR(ftm.net_pay)}</div>
                <div className="text-xs text-slate-500 fd-num">Net Pay</div>
              </div>
              <button onClick={() => setViewFTM(ftm)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600/20 border border-emerald-600/40 text-emerald-400 text-sm font-bold rounded-xl hover:bg-emerald-600/30 transition fd-head flex-shrink-0">
                <Eye size={13} /> Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Self */}
      {activeTab === "self" && (
        <div className="max-w-2xl">
          <SelfInfoCard employee={selfData} leaveSummary={selfLeaves} />
        </div>
      )}

      {/* Modals */}
      {(showForm || editFTM) && (
        <FTMFormModal
          ftm={editFTM}
          employees={formEmployees}
          onClose={() => { setShowForm(false); setEditFTM(null); setPreselEmp(null); }}
          onSaved={saved => { upsertFTM(saved); setShowForm(false); setEditFTM(null); setPreselEmp(null); }}
          showToast={showToast}
        />
      )}

      {viewFTM && (
        <FTMSidebar
          ftm={viewFTM}
          myLevel={myLevel}
          onClose={() => setViewFTM(null)}
          onEdit={f => { setViewFTM(null); setEditFTM(f); setShowForm(true); }}
          onUpdated={updated => { upsertFTM(updated); setViewFTM(updated); }}
          showToast={showToast}
        />
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}