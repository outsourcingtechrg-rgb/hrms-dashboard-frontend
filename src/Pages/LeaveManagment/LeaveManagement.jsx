/**
 * LeaveManagement.jsx  —  Full Leave Management System
 *
 * ── LEVELS ───────────────────────────────────────────────────────
 *  Employee  → Apply, View own leaves, View balance, Cancel
 *  Manager   → Approve/Reject pending leaves, View team leaves
 *  HR        → Leave types, Cycles, Allocate balance, Carry forward, Reports
 *  Admin     → All HR + Employee data, Department stats
 *
 * ── APIs USED ────────────────────────────────────────────────────
 *  GET  /leaves/cycles                     → All leave cycles
 *  POST /leaves/cycles                     → Create cycle (HR)
 *  PUT  /leaves/cycles/{id}               → Update cycle (HR)
 *  POST /leaves/cycles/{id}/deactivate    → Deactivate (HR)
 *  GET  /leaves/types                     → All leave types
 *  POST /leaves/types                     → Create type (HR)
 *  PUT  /leaves/types/{id}               → Update type (HR)
 *  DELETE /leaves/types/{id}             → Delete type (HR)
 *  GET  /leaves/cycles/{id}/types        → Types by cycle
 *  POST /leaves/allocate                  → Allocate balance (HR)
 *  POST /leaves/adjust-carry-forward      → Carry forward (HR)
 *  POST /leaves/apply                     → Apply for leave (Employee)
 *  GET  /leaves/my                        → My leaves (Employee)
 *  GET  /leaves/balance                   → My balance (Employee)
 *  POST /leaves/{id}/cancel              → Cancel (Employee)
 *  POST /leaves/{id}/action              → Approve/Reject (Manager)
 *  GET  /leaves/pending                   → Pending approvals (Manager)
 *  GET  /leaves/employee/{id}            → Employee leaves (Admin)
 *  GET  /leaves/employee/{id}/balance    → Employee balance (Admin)
 *  GET  /leaves/employee/{id}/summary    → Employee summary (Admin)
 *  GET  /leaves/stats/by-status          → Stats (Admin)
 *  GET  /leaves/stats/department/{id}    → Dept stats (Admin)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus,
  RefreshCw, ChevronRight, ChevronDown, ChevronUp, Loader2,
  Users, Building2, BarChart2, Settings, Layers, FileText,
  Edit, Trash2, Check, X, Filter, Search, Download,
  ArrowLeft, Info, TrendingUp, Briefcase, Star,
  Sun, Moon, Coffee, Umbrella, Heart, Shield,
  ToggleLeft, ToggleRight, Eye, Send, Award,
} from "lucide-react";

const mainOrigin = "http://127.0.0.1:8000/api/v1";

/* ─── Styles ─── */
const _S = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Fira+Code:wght@400;500;600&display=swap');

  @keyframes lm-up     { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lm-in     { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes lm-spin   { to{transform:rotate(360deg)} }
  @keyframes lm-slide  { from{transform:translateX(-8px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes lm-shimmer{ 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes lm-pop    { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 100%{transform:scale(1)} }
  @keyframes lm-toast  { 0%{opacity:0;transform:translateY(20px)} 15%,85%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(20px)} }

  .lm-page  { font-family:'Plus Jakarta Sans',sans-serif; }
  .lm-page * { box-sizing:border-box; }
  .lm-mono  { font-family:'Fira Code',monospace; }

  .lm-up    { animation: lm-up   .35s cubic-bezier(.22,1,.36,1) both; }
  .lm-in    { animation: lm-in   .3s  cubic-bezier(.22,1,.36,1) both; }
  .lm-slide { animation: lm-slide .25s cubic-bezier(.22,1,.36,1) both; }
  .lm-spin  { animation: lm-spin .85s linear infinite; }
  .lm-pop   { animation: lm-pop  .3s  cubic-bezier(.22,1,.36,1); }

  .lm-stagger>*:nth-child(1){animation-delay:.04s}
  .lm-stagger>*:nth-child(2){animation-delay:.08s}
  .lm-stagger>*:nth-child(3){animation-delay:.12s}
  .lm-stagger>*:nth-child(4){animation-delay:.16s}
  .lm-stagger>*:nth-child(5){animation-delay:.20s}
  .lm-stagger>*:nth-child(6){animation-delay:.24s}

  .lm-card {
    background:#fff;
    border-radius:20px;
    border:1px solid rgba(15,23,42,.07);
    box-shadow:0 2px 4px rgba(15,23,42,.04),0 8px 24px rgba(15,23,42,.06);
  }

  .lm-shimmer {
    background:linear-gradient(90deg,#f1f5f9 25%,#e8eef5 50%,#f1f5f9 75%);
    background-size:600px 100%;
    animation:lm-shimmer 1.5s ease-in-out infinite;
    border-radius:8px;
  }

  .lm-input {
    width:100%; padding:10px 14px; border-radius:12px;
    border:1.5px solid #e2e8f0; background:#fafafa;
    font-family:'Plus Jakarta Sans',sans-serif;
    font-size:13px; font-weight:500; color:#1e293b;
    transition:border-color .15s,box-shadow .15s;
    outline:none;
  }
  .lm-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); background:#fff; }
  .lm-input::placeholder { color:#94a3b8; font-weight:400; }

  .lm-select {
    width:100%; padding:10px 14px; border-radius:12px;
    border:1.5px solid #e2e8f0; background:#fafafa;
    font-family:'Plus Jakarta Sans',sans-serif;
    font-size:13px; font-weight:500; color:#1e293b;
    outline:none; cursor:pointer;
    transition:border-color .15s,box-shadow .15s;
    -webkit-appearance:none;
  }
  .lm-select:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.12); background:#fff; }

  .lm-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:9px 18px; border-radius:12px;
    font-family:'Plus Jakarta Sans',sans-serif;
    font-size:13px; font-weight:700; cursor:pointer;
    border:none; transition:all .15s; white-space:nowrap;
  }
  .lm-btn:disabled { opacity:.45; cursor:not-allowed; }
  .lm-btn-primary  { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 2px 8px rgba(99,102,241,.3); }
  .lm-btn-primary:hover:not(:disabled)  { box-shadow:0 4px 16px rgba(99,102,241,.4); transform:translateY(-1px); }
  .lm-btn-success  { background:linear-gradient(135deg,#10b981,#059669); color:#fff; box-shadow:0 2px 8px rgba(16,185,129,.3); }
  .lm-btn-success:hover:not(:disabled)  { box-shadow:0 4px 16px rgba(16,185,129,.4); transform:translateY(-1px); }
  .lm-btn-danger   { background:linear-gradient(135deg,#f87171,#ef4444); color:#fff; box-shadow:0 2px 8px rgba(239,68,68,.3); }
  .lm-btn-danger:hover:not(:disabled)   { box-shadow:0 4px 16px rgba(239,68,68,.4); transform:translateY(-1px); }
  .lm-btn-ghost    { background:#f1f5f9; color:#475569; border:1.5px solid #e2e8f0; }
  .lm-btn-ghost:hover:not(:disabled)    { background:#e2e8f0; border-color:#cbd5e1; }
  .lm-btn-warn     { background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; box-shadow:0 2px 8px rgba(245,158,11,.3); }
  .lm-btn-warn:hover:not(:disabled)     { box-shadow:0 4px 16px rgba(245,158,11,.4); transform:translateY(-1px); }

  .lm-tab-bar { display:flex; background:#f1f5f9; padding:4px; border-radius:14px; gap:2px; }
  .lm-tab     { flex:1; padding:8px 12px; border-radius:10px; border:none; background:transparent;
                 font-family:'Plus Jakarta Sans',sans-serif; font-size:12px; font-weight:600;
                 cursor:pointer; color:#64748b; transition:all .15s; white-space:nowrap; }
  .lm-tab.active { background:#fff; color:#4f46e5; box-shadow:0 1px 4px rgba(15,23,42,.12); }

  .lm-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:99px;
              font-size:11px; font-weight:700; letter-spacing:.03em; }

  .lm-row:hover { background:rgba(99,102,241,.035); }

  .lm-progress-track { height:8px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
  .lm-progress-fill  { height:100%; border-radius:99px; transition:width .6s cubic-bezier(.4,0,.2,1); }

  .lm-bg { background:linear-gradient(135deg,#f8faff 0%,#f0f4ff 50%,#fdf4ff 100%); min-height:100vh; }

  .lm-scroll::-webkit-scrollbar { width:3px; height:3px; }
  .lm-scroll::-webkit-scrollbar-track { background:transparent; }
  .lm-scroll::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:99px; }

  .lm-modal-overlay {
    position:fixed; inset:0; background:rgba(15,23,42,.45);
    backdrop-filter:blur(4px); z-index:800;
    display:flex; align-items:center; justify-content:center; padding:20px;
  }
  .lm-modal { background:#fff; border-radius:24px; width:100%; max-width:520px;
               max-height:90vh; overflow-y:auto; box-shadow:0 24px 64px rgba(15,23,42,.2); }

  .lm-toast {
    position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
    z-index:9999; padding:12px 22px; border-radius:14px;
    font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:700;
    box-shadow:0 8px 32px rgba(0,0,0,.18);
    animation:lm-toast 3.2s ease both;
  }
  .lm-toast.success { background:#10b981; color:#fff; }
  .lm-toast.error   { background:#ef4444; color:#fff; }
  .lm-toast.info    { background:#6366f1; color:#fff; }

  .lm-label { font-size:12px; font-weight:700; color:#64748b; letter-spacing:.04em; text-transform:uppercase; margin-bottom:6px; display:block; }

  .lm-stat-ring { transform:rotate(-90deg); }
  .lm-stat-ring circle { fill:none; transition:stroke-dasharray .7s cubic-bezier(.4,0,.2,1); }
`;

if (typeof document !== "undefined" && !document.getElementById("__lm_s__")) {
  const el = document.createElement("style");
  el.id = "__lm_s__";
  el.textContent = _S;
  document.head.appendChild(el);
}

/* ─── JWT decode ─── */
function getAuth() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p   = JSON.parse(atob(raw));
    const idRaw = p.EPI ?? p.employee_id ?? p.id ?? p.sub;
    const level = p.level ?? (p.role?.level) ?? 5;
    return { id: Number(idRaw), name: p.name ?? p.full_name ?? p.username ?? "User", level: Number(level) };
  } catch { return { id: 1, name: "User", level: 5 }; }
}
console.log(getAuth())
/* ─── API base ─── */
function getHeaders() {
  const token = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { headers: getHeaders(), ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ─── Helpers ─── */
const fmtDate = d => d ? new Date(d).toLocaleDateString("default", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtNum  = n => n == null ? "—" : Number(n).toFixed(1).replace(/\.0$/, "");

const STATUS_CFG = {
  pending:   { bg: "#fef9c3", fg: "#92400e", label: "Pending",   icon: Clock      },
  approved:  { bg: "#dcfce7", fg: "#14532d", label: "Approved",  icon: CheckCircle },
  rejected:  { bg: "#fee2e2", fg: "#7f1d1d", label: "Rejected",  icon: XCircle    },
  cancelled: { bg: "#f1f5f9", fg: "#334155", label: "Cancelled", icon: X          },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status?.toLowerCase()] || { bg: "#f1f5f9", fg: "#475569", label: status };
  const Icon = cfg.icon;
  return (
    <span className="lm-badge" style={{ background: cfg.bg, color: cfg.fg }}>
      {Icon && <Icon size={10} />}{cfg.label || status}
    </span>
  );
}

/* ─── Mini components ─── */
function Skel({ w = "100%", h = "16px", className = "" }) {
  return <div className={`lm-shimmer ${className}`} style={{ width: w, height: h }} />;
}

function Toast({ msg, type = "info", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return <div className={`lm-toast ${type}`}>{msg}</div>;
}

function ProgressBar({ used, allocated, color = "#6366f1" }) {
  const pct = allocated ? Math.min(100, Math.round((used / allocated) * 100)) : 0;
  return (
    <div className="lm-progress-track mt-1">
      <div className="lm-progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="lm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="lm-modal lm-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <X size={14} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="lm-label">{label}</label>
      {children}
    </div>
  );
}

/* ─── Leave type icon map ─── */
const TYPE_ICONS = { annual: Sun, sick: Heart, casual: Coffee, maternity: Star, emergency: AlertCircle, hajj: Moon, other: Umbrella };
function LeaveTypeIcon({ name, size = 16, className = "" }) {
  const key = Object.keys(TYPE_ICONS).find(k => (name || "").toLowerCase().includes(k)) || "other";
  const Icon = TYPE_ICONS[key];
  return <Icon size={size} className={className} />;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: Balance Cards
═══════════════════════════════════════════════════════════════ */
function BalanceCards({ balances, loading }) {
  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#0ea5e9", "#ec4899", "#8b5cf6"];
  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[...Array(4)].map((_, i) => <Skel key={i} h="120px" />)}
    </div>
  );
  if (!balances?.length) return (
    <div className="text-center py-10 text-gray-400">
      <Calendar size={32} className="mx-auto mb-2 opacity-40" />
      <p className="text-sm font-medium">No balance data</p>
    </div>
  );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lm-stagger">
      {balances.map((b, i) => {
        const color = COLORS[i % COLORS.length];
        const pct = b.allocated ? Math.min(100, Math.round(((b.used || 0) / b.allocated) * 100)) : 0;
        const remaining = b.remaining ?? (b.allocated - (b.used || 0) - (b.pending || 0));
        return (
          <div key={b.id || i} className="lm-card p-4 lm-up">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${color}15` }}>
                <LeaveTypeIcon name={b.leave_type?.name || b.leave_type_id?.toString()} size={16}
                  className="" style={{ color }} />
              </div>
              <span className="lm-mono text-xs font-bold" style={{ color }}>{remaining}d left</span>
            </div>
            <p className="text-sm font-bold text-gray-800 leading-tight mb-0.5">
              {b.leave_type?.name || `Type ${b.leave_type_id}`}
            </p>
            <p className="text-xs text-gray-400 mb-2">
              {b.used || 0} used · {b.pending || 0} pending of {b.allocated}
            </p>
            <ProgressBar used={(b.used || 0) + (b.pending || 0)} allocated={b.allocated} color={color} />
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION: Leave Request Row
═══════════════════════════════════════════════════════════════ */
function LeaveRow({ leave, onCancel, canCancel, onAction, canAction }) {
  const [acting, setActing] = useState(false);
  const doAction = async (action) => {
    setActing(true);
    await onAction?.(leave.id, action);
    setActing(false);
  };
  return (
    <tr className="lm-row border-b border-gray-50 last:border-0 transition-colors">
      <td className="py-3 px-4">
        <p className="text-sm font-semibold text-gray-800">{leave.leave_type?.name || `Type ${leave.leave_type_id}`}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(leave.start_date)} → {fmtDate(leave.end_date)}</p>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="lm-badge" style={{ background: "#f1f5f9", color: "#475569" }}>
          {leave.days}d{leave.is_half_day ? " (½)" : ""}
        </span>
      </td>
      <td className="py-3 px-4 text-center"><StatusBadge status={leave.status} /></td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {canCancel && leave.status === "pending" && (
            <button onClick={() => onCancel(leave.id)}
              className="lm-btn lm-btn-ghost" style={{ padding: "5px 10px", fontSize: 11 }}>
              Cancel
            </button>
          )}
          {canAction && leave.status === "pending" && (
            <>
              <button onClick={() => doAction("approve")} disabled={acting}
                className="lm-btn lm-btn-success" style={{ padding: "5px 10px", fontSize: 11 }}>
                {acting ? <Loader2 size={11} className="lm-spin" /> : <Check size={11} />} Approve
              </button>
              <button onClick={() => doAction("reject")} disabled={acting}
                className="lm-btn lm-btn-danger" style={{ padding: "5px 10px", fontSize: 11 }}>
                <X size={11} /> Reject
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: Employee — My Leaves + Apply
═══════════════════════════════════════════════════════════════ */
function EmployeeTab({ auth, toast }) {
  const [myLeaves,  setMyLeaves]  = useState([]);
  const [balances,  setBalances]  = useState([]);
  const [leaveTypes,setLeaveTypes]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [subTab,    setSubTab]    = useState("balance");
  const [showApply, setShowApply] = useState(false);
  const [applying,  setApplying]  = useState(false);
  const [form, setForm] = useState({
    leave_type_id: "", start_date: "", end_date: "", is_half_day: false, reason: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leaves, bals, types] = await Promise.all([
        apiFetch(`${mainOrigin}/leaves/my`),
        apiFetch(`${mainOrigin}/leaves/balance`),
        apiFetch(`${mainOrigin}/leaves/types`),
      ]);
      setMyLeaves(Array.isArray(leaves) ? leaves : []);
      setBalances(Array.isArray(bals) ? bals : []);
      console.log(bals)
      setLeaveTypes(Array.isArray(types) ? types : []);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApply = async () => {
    if (!form.leave_type_id || !form.start_date || !form.end_date) {
      toast("Fill all required fields", "error"); return;
    }
    setApplying(true);
    try {
      await apiFetch(`${mainOrigin}/leaves/apply`, {
        method: "POST",
        body: JSON.stringify({ ...form, leave_type_id: Number(form.leave_type_id) }),
      });
      toast("Leave applied successfully!", "success");
      setShowApply(false);
      setForm({ leave_type_id: "", start_date: "", end_date: "", is_half_day: false, reason: "" });
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setApplying(false); }
  };

  const handleCancel = async (id) => {
    try {
      await apiFetch(`${mainOrigin}/leaves/${id}/cancel`, { method: "POST" });
      toast("Leave cancelled", "info");
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  const statusFilter = subTab === "history" ? null : subTab === "pending_tab" ? "pending" : null;
  const filteredLeaves = myLeaves.filter(l => {
    if (subTab === "pending_tab") return l.status === "pending";
    if (subTab === "approved_tab") return l.status === "approved";
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Balance cards */}
      <div className="lm-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-gray-900">My Leave Balance</h3>
          <button onClick={load} disabled={loading}
            className="lm-btn lm-btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
            <RefreshCw size={12} className={loading ? "lm-spin" : ""} /> Refresh
          </button>
        </div>
        <BalanceCards balances={balances} loading={loading} />
      </div>

      {/* My Leaves */}
      <div className="lm-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-extrabold text-gray-900">My Leaves</h3>
          <div className="flex items-center gap-2">
            <div className="lm-tab-bar">
              {[["balance","All"],["pending_tab","Pending"],["approved_tab","Approved"]].map(([k,l]) => (
                <button key={k} onClick={() => setSubTab(k)} className={`lm-tab ${subTab===k?"active":""}`}>{l}</button>
              ))}
            </div>
            <button onClick={() => setShowApply(true)}
              className="lm-btn lm-btn-primary" style={{ padding: "7px 14px", fontSize: 12 }}>
              <Plus size={13} /> Apply
            </button>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_,i) => <Skel key={i} h="52px" />)}</div>
        ) : filteredLeaves.length > 0 ? (
          <div className="overflow-x-auto lm-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Leave Type / Dates","Duration","Status","Action"].map((h,i) => (
                    <th key={h} className={`pb-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${i===0?"text-left":"text-center"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map(l => (
                  <LeaveRow key={l.id} leave={l}
                    canCancel onCancel={handleCancel} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <Calendar size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400 font-medium">No leaves found</p>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApply && (
        <Modal title="Apply for Leave" onClose={() => setShowApply(false)}>
          <div className="space-y-4">
            <FormField label="Leave Type *">
              <select className="lm-select" value={form.leave_type_id}
                onChange={e => setForm(f => ({ ...f, leave_type_id: e.target.value }))}>
                <option value="">Select leave type</option>
                {leaveTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} {t.is_paid ? "(Paid)" : "(Unpaid)"}</option>
                ))}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Date *">
                <input type="date" className="lm-input" value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </FormField>
              <FormField label="End Date *">
                <input type="date" className="lm-input" value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="Reason">
              <textarea className="lm-input" rows={3} placeholder="Reason for leave..."
                style={{ resize: "none" }} value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </FormField>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div onClick={() => setForm(f => ({ ...f, is_half_day: !f.is_half_day }))}
                className="w-10 h-5.5 rounded-full flex items-center transition-colors"
                style={{ background: form.is_half_day ? "#6366f1" : "#e2e8f0", padding: "2px" }}>
                <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: form.is_half_day ? "translateX(20px)" : "translateX(0)" }} />
              </div>
              <span className="text-sm font-semibold text-gray-700">Half Day</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowApply(false)} className="lm-btn lm-btn-ghost flex-1">Cancel</button>
              <button onClick={handleApply} disabled={applying} className="lm-btn lm-btn-primary flex-1">
                {applying ? <Loader2 size={13} className="lm-spin" /> : <Send size={13} />}
                Submit Application
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: Manager — Pending Approvals
═══════════════════════════════════════════════════════════════ */
function ManagerTab({ auth, toast }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${mainOrigin}/leaves/pending`);
      setPending(Array.isArray(data) ? data : []);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id, action) => {
    try {
      await apiFetch(`${mainOrigin}/leaves/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      toast(`Leave ${action}d`, action === "approve" ? "success" : "info");
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  const filtered = pending.filter(l =>
    !search || (l.employee_id?.toString() || "").includes(search)
  );

  return (
    <div className="lm-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-extrabold text-gray-900">Pending Approvals</h3>
          <p className="text-xs text-gray-400 mt-0.5">{pending.length} requests awaiting action</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Search size={13} className="text-gray-400" />
            <input type="text" placeholder="Search by Employee ID…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs font-medium text-gray-700 placeholder-gray-400 outline-none w-36" />
          </div>
          <button onClick={load} disabled={loading}
            className="lm-btn lm-btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }}>
            <RefreshCw size={12} className={loading ? "lm-spin" : ""} />
          </button>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_,i) => <Skel key={i} h="60px" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(l => (
            <div key={l.id} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 hover:border-indigo-100 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#ede9fe" }}>
                <LeaveTypeIcon name={l.leave_type?.name || ""} size={16} style={{ color: "#7c3aed" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-gray-800">Employee #{l.employee_id}</p>
                  <StatusBadge status={l.status} />
                  {l.is_half_day && (
                    <span className="lm-badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>Half Day</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold">{l.leave_type?.name || `Type ${l.leave_type_id}`}</span>
                  {" · "}{fmtDate(l.start_date)} → {fmtDate(l.end_date)} · {l.days} day{l.days !== 1 ? "s" : ""}
                </p>
                {l.reason && <p className="text-xs text-gray-400 mt-1 italic">"{l.reason}"</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleAction(l.id, "approve")}
                  className="lm-btn lm-btn-success" style={{ padding: "6px 14px", fontSize: 12 }}>
                  <Check size={12} /> Approve
                </button>
                <button onClick={() => handleAction(l.id, "reject")}
                  className="lm-btn lm-btn-danger" style={{ padding: "6px 12px", fontSize: 12 }}>
                  <X size={12} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-14">
          <CheckCircle size={36} className="mx-auto mb-3 text-emerald-300" />
          <p className="font-bold text-gray-500">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No pending leave requests</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: HR — Cycles & Types & Allocate
═══════════════════════════════════════════════════════════════ */
function HRTab({ auth, toast }) {
  const [hrSub, setHrSub] = useState("cycles");
  const [cycles, setCycles] = useState([]);
  const [types,  setTypes]  = useState([]);
  const [loading, setLoading] = useState(true);

  /* Modals */
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showTypeModal,  setShowTypeModal]  = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [editCycle, setEditCycle] = useState(null);
  const [editType,  setEditType]  = useState(null);
  const [saving, setSaving] = useState(false);

  const [cycleForm, setCycleForm] = useState({ name:"", start_month:1, start_day:1, end_month:12, end_day:31 });
  const [typeForm,  setTypeForm]  = useState({ name:"", is_paid:true, max_per_cycle:15, carry_forward:false, max_carry_forward:0, leave_cycle_id:"" });
  const [allocForm, setAllocForm] = useState({ employee_id:"", leave_type_id:"", allocated_days:"", cycle_start_date:"", cycle_end_date:"" });
  const [cfForm,    setCfForm]    = useState({ employee_id:"", leave_type_id:"", cycle_start_date:"", carry_forward_days:"" });
  const [showCFModal, setShowCFModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        apiFetch(`${mainOrigin}/leaves/cycles`),
        apiFetch(`${mainOrigin}/leaves/types`),
      ]);
      setCycles(Array.isArray(c) ? c : []);
      setTypes(Array.isArray(t) ? t : []);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Cycle CRUD */
  const saveCycle = async () => {
    setSaving(true);
    try {
      if (editCycle) {
        await apiFetch(`${mainOrigin}/leaves/cycles/${editCycle.id}`, { method:"PUT", body: JSON.stringify(cycleForm) });
        toast("Cycle updated", "success");
      } else {
        await apiFetch(`${mainOrigin}/leaves/cycles`, { method:"POST", body: JSON.stringify(cycleForm) });
        toast("Cycle created", "success");
      }
      setShowCycleModal(false); setEditCycle(null);
      setCycleForm({ name:"", start_month:1, start_day:1, end_month:12, end_day:31 });
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const deactivateCycle = async (id) => {
    try {
      await apiFetch(`${mainOrigin}/leaves/cycles/${id}/deactivate`, { method:"POST" });
      toast("Cycle deactivated", "info"); load();
    } catch (e) { toast(e.message, "error"); }
  };

  /* Type CRUD */
  const saveType = async () => {
    setSaving(true);
    try {
      const payload = { ...typeForm, leave_cycle_id: Number(typeForm.leave_cycle_id), max_per_cycle: Number(typeForm.max_per_cycle), max_carry_forward: Number(typeForm.max_carry_forward) };
      if (editType) {
        await apiFetch(`${mainOrigin}/leaves/types/${editType.id}`, { method:"PUT", body: JSON.stringify(payload) });
        toast("Leave type updated", "success");
      } else {
        await apiFetch(`${mainOrigin}/leaves/types`, { method:"POST", body: JSON.stringify(payload) });
        toast("Leave type created", "success");
      }
      setShowTypeModal(false); setEditType(null);
      setTypeForm({ name:"", is_paid:true, max_per_cycle:15, carry_forward:false, max_carry_forward:0, leave_cycle_id:"" });
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const deleteType = async (id) => {
    try {
      await apiFetch(`${mainOrigin}/leaves/types/${id}`, { method:"DELETE" });
      toast("Leave type deleted", "info"); load();
    } catch (e) { toast(e.message, "error"); }
  };

  /* Allocate */
  const allocate = async () => {
    setSaving(true);
    try {
      const params = new URLSearchParams(allocForm);
      await apiFetch(`${mainOrigin}/leaves/allocate?${params}`, { method:"POST" });
      toast("Balance allocated", "success");
      setShowAllocModal(false);
      setAllocForm({ employee_id:"", leave_type_id:"", allocated_days:"", cycle_start_date:"", cycle_end_date:"" });
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const adjustCF = async () => {
    setSaving(true);
    try {
      const params = new URLSearchParams(cfForm);
      await apiFetch(`${mainOrigin}/leaves/adjust-carry-forward?${params}`, { method:"POST" });
      toast("Carry forward adjusted", "success");
      setShowCFModal(false);
      setCfForm({ employee_id:"", leave_type_id:"", cycle_start_date:"", carry_forward_days:"" });
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="lm-tab-bar">
          {[["cycles","Leave Cycles"],["types","Leave Types"],["allocate","Allocation"]].map(([k,l]) => (
            <button key={k} onClick={() => setHrSub(k)} className={`lm-tab ${hrSub===k?"active":""}`}>{l}</button>
          ))}
        </div>
        <button onClick={load} disabled={loading} className="lm-btn lm-btn-ghost" style={{ padding:"6px 12px",fontSize:12 }}>
          <RefreshCw size={12} className={loading?"lm-spin":""} />
        </button>
      </div>

      {/* ── Cycles ── */}
      {hrSub === "cycles" && (
        <div className="lm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-gray-900">Leave Cycles</h3>
            <button onClick={() => { setEditCycle(null); setCycleForm({ name:"", start_month:1, start_day:1, end_month:12, end_day:31 }); setShowCycleModal(true); }}
              className="lm-btn lm-btn-primary" style={{ padding:"7px 14px",fontSize:12 }}>
              <Plus size={13} /> New Cycle
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_,i) => <Skel key={i} h="64px" />)}</div>
          ) : cycles.length > 0 ? (
            <div className="space-y-3">
              {cycles.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: c.is_active !== false ? "#dcfce7" : "#f1f5f9" }}>
                      <Calendar size={17} style={{ color: c.is_active !== false ? "#16a34a" : "#94a3b8" }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">
                        {MONTHS[(c.start_month||1)-1]} {c.start_day} → {MONTHS[(c.end_month||12)-1]} {c.end_day}
                        {c.is_active === false && <span className="ml-2 lm-badge" style={{ background:"#f1f5f9",color:"#94a3b8",fontSize:9 }}>Inactive</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditCycle(c); setCycleForm({ name:c.name, start_month:c.start_month, start_day:c.start_day, end_month:c.end_month, end_day:c.end_day }); setShowCycleModal(true); }}
                      className="lm-btn lm-btn-ghost" style={{ padding:"5px 10px",fontSize:11 }}>
                      <Edit size={11} /> Edit
                    </button>
                    {c.is_active !== false && (
                      <button onClick={() => deactivateCycle(c.id)} className="lm-btn lm-btn-ghost" style={{ padding:"5px 10px",fontSize:11,color:"#dc2626" }}>
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No cycles yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── Types ── */}
      {hrSub === "types" && (
        <div className="lm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-gray-900">Leave Types</h3>
            <button onClick={() => { setEditType(null); setTypeForm({ name:"", is_paid:true, max_per_cycle:15, carry_forward:false, max_carry_forward:0, leave_cycle_id: cycles[0]?.id?.toString() || "" }); setShowTypeModal(true); }}
              className="lm-btn lm-btn-primary" style={{ padding:"7px 14px",fontSize:12 }}>
              <Plus size={13} /> New Type
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_,i) => <Skel key={i} h="64px" />)}</div>
          ) : types.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {types.map((t, i) => {
                const COLORS = ["#6366f1","#10b981","#f59e0b","#0ea5e9","#ec4899"];
                const col = COLORS[i % COLORS.length];
                return (
                  <div key={t.id} className="rounded-2xl border border-gray-100 p-4 hover:border-indigo-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:`${col}15` }}>
                          <LeaveTypeIcon name={t.name} size={14} style={{ color: col }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{t.name}</p>
                          <p className="text-[10px] text-gray-400">Cycle #{t.leave_cycle_id}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditType(t); setTypeForm({ name:t.name, is_paid:t.is_paid, max_per_cycle:t.max_per_cycle, carry_forward:t.carry_forward, max_carry_forward:t.max_carry_forward||0, leave_cycle_id:t.leave_cycle_id?.toString() }); setShowTypeModal(true); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-indigo-100 transition">
                          <Edit size={11} className="text-gray-500" />
                        </button>
                        <button onClick={() => deleteType(t.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-red-100 transition">
                          <Trash2 size={11} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="lm-badge" style={{ background: t.is_paid?"#dcfce7":"#fee2e2", color: t.is_paid?"#15803d":"#dc2626", fontSize:10 }}>
                        {t.is_paid ? "Paid" : "Unpaid"}
                      </span>
                      <span className="lm-badge" style={{ background:"#f1f5f9",color:"#475569",fontSize:10 }}>
                        {t.max_per_cycle}d / cycle
                      </span>
                      {t.carry_forward && (
                        <span className="lm-badge" style={{ background:"#ede9fe",color:"#7c3aed",fontSize:10 }}>
                          Carry fwd ≤{t.max_carry_forward}d
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <Layers size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No leave types yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── Allocation ── */}
      {hrSub === "allocate" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="lm-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Award size={18} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Allocate Leave</h3>
                <p className="text-xs text-gray-400">Grant leave balance to employee</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label:"Employee ID", key:"employee_id", type:"number", placeholder:"e.g. 42" },
                { label:"Leave Type ID", key:"leave_type_id", type:"number", placeholder:"e.g. 1" },
                { label:"Allocated Days", key:"allocated_days", type:"number", placeholder:"e.g. 15" },
                { label:"Cycle Start", key:"cycle_start_date", type:"date" },
                { label:"Cycle End",   key:"cycle_end_date",   type:"date" },
              ].map(({ label, key, type, placeholder }) => (
                <FormField key={key} label={label}>
                  <input type={type} className="lm-input" placeholder={placeholder}
                    value={allocForm[key]} onChange={e => setAllocForm(f => ({ ...f, [key]: e.target.value }))} />
                </FormField>
              ))}
              <button onClick={allocate} disabled={saving} className="lm-btn lm-btn-primary w-full justify-center mt-2">
                {saving ? <Loader2 size={13} className="lm-spin" /> : <Check size={13} />}
                Allocate Balance
              </button>
            </div>
          </div>

          <div className="lm-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <TrendingUp size={18} className="text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Carry Forward</h3>
                <p className="text-xs text-gray-400">Adjust from previous cycle</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label:"Employee ID", key:"employee_id", type:"number", placeholder:"e.g. 42" },
                { label:"Leave Type ID", key:"leave_type_id", type:"number", placeholder:"e.g. 1" },
                { label:"Cycle Start Date", key:"cycle_start_date", type:"date" },
                { label:"Carry Forward Days", key:"carry_forward_days", type:"number", placeholder:"e.g. 5" },
              ].map(({ label, key, type, placeholder }) => (
                <FormField key={key} label={label}>
                  <input type={type} className="lm-input" placeholder={placeholder}
                    value={cfForm[key]} onChange={e => setCfForm(f => ({ ...f, [key]: e.target.value }))} />
                </FormField>
              ))}
              <button onClick={adjustCF} disabled={saving} className="lm-btn lm-btn-warn w-full justify-center mt-2">
                {saving ? <Loader2 size={13} className="lm-spin" /> : <TrendingUp size={13} />}
                Adjust Carry Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cycle modal */}
      {showCycleModal && (
        <Modal title={editCycle ? "Edit Cycle" : "New Leave Cycle"} onClose={() => setShowCycleModal(false)}>
          <div className="space-y-4">
            <FormField label="Cycle Name *">
              <input className="lm-input" placeholder="e.g. Annual 2025"
                value={cycleForm.name} onChange={e => setCycleForm(f => ({ ...f, name: e.target.value }))} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Month">
                <select className="lm-select" value={cycleForm.start_month}
                  onChange={e => setCycleForm(f => ({ ...f, start_month: Number(e.target.value) }))}>
                  {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Start Day">
                <input type="number" className="lm-input" min={1} max={31}
                  value={cycleForm.start_day} onChange={e => setCycleForm(f => ({ ...f, start_day: Number(e.target.value) }))} />
              </FormField>
              <FormField label="End Month">
                <select className="lm-select" value={cycleForm.end_month}
                  onChange={e => setCycleForm(f => ({ ...f, end_month: Number(e.target.value) }))}>
                  {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="End Day">
                <input type="number" className="lm-input" min={1} max={31}
                  value={cycleForm.end_day} onChange={e => setCycleForm(f => ({ ...f, end_day: Number(e.target.value) }))} />
              </FormField>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCycleModal(false)} className="lm-btn lm-btn-ghost flex-1">Cancel</button>
              <button onClick={saveCycle} disabled={saving} className="lm-btn lm-btn-primary flex-1">
                {saving ? <Loader2 size={13} className="lm-spin" /> : <Check size={13} />}
                {editCycle ? "Update" : "Create"} Cycle
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Type modal */}
      {showTypeModal && (
        <Modal title={editType ? "Edit Leave Type" : "New Leave Type"} onClose={() => setShowTypeModal(false)}>
          <div className="space-y-4">
            <FormField label="Type Name *">
              <input className="lm-input" placeholder="e.g. Annual Leave"
                value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} />
            </FormField>
            <FormField label="Leave Cycle *">
              <select className="lm-select" value={typeForm.leave_cycle_id}
                onChange={e => setTypeForm(f => ({ ...f, leave_cycle_id: e.target.value }))}>
                <option value="">Select cycle</option>
                {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Max Per Cycle (days)">
                <input type="number" className="lm-input" min={0} value={typeForm.max_per_cycle}
                  onChange={e => setTypeForm(f => ({ ...f, max_per_cycle: e.target.value }))} />
              </FormField>
              <FormField label="Max Carry Forward">
                <input type="number" className="lm-input" min={0} value={typeForm.max_carry_forward}
                  onChange={e => setTypeForm(f => ({ ...f, max_carry_forward: e.target.value }))} />
              </FormField>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setTypeForm(f => ({ ...f, is_paid: !f.is_paid }))}
                  className="w-10 rounded-full flex items-center transition-colors"
                  style={{ background: typeForm.is_paid?"#6366f1":"#e2e8f0", padding:"2px", height:"22px" }}>
                  <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: typeForm.is_paid?"translateX(20px)":"translateX(0)" }} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Paid</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setTypeForm(f => ({ ...f, carry_forward: !f.carry_forward }))}
                  className="w-10 rounded-full flex items-center transition-colors"
                  style={{ background: typeForm.carry_forward?"#6366f1":"#e2e8f0", padding:"2px", height:"22px" }}>
                  <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: typeForm.carry_forward?"translateX(20px)":"translateX(0)" }} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Carry Forward</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowTypeModal(false)} className="lm-btn lm-btn-ghost flex-1">Cancel</button>
              <button onClick={saveType} disabled={saving} className="lm-btn lm-btn-primary flex-1">
                {saving ? <Loader2 size={13} className="lm-spin" /> : <Check size={13} />}
                {editType ? "Update" : "Create"} Type
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB: Admin — Reports & Employee Data
═══════════════════════════════════════════════════════════════ */
function AdminTab({ auth, toast }) {
  const [adminSub, setAdminSub]   = useState("stats");
  const [stats,    setStats]      = useState(null);
  const [deptId,   setDeptId]     = useState("");
  const [deptStats,setDeptStats]  = useState(null);
  const [empId,    setEmpId]      = useState("");
  const [empLeaves,setEmpLeaves]  = useState([]);
  const [empBal,   setEmpBal]     = useState([]);
  const [empSumm,  setEmpSumm]    = useState([]);
  const [loading,  setLoading]    = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const s = await apiFetch(`${mainOrigin}/leaves/stats/by-status`);
      setStats(s);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (adminSub === "stats") loadStats(); }, [adminSub]);

  const loadDeptStats = async () => {
    if (!deptId) { toast("Enter Department ID", "error"); return; }
    setLoading(true);
    try {
      const s = await apiFetch(`${mainOrigin}/leaves/stats/department/${deptId}`);
      setDeptStats(s);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const loadEmpData = async () => {
    if (!empId) { toast("Enter Employee ID", "error"); return; }
    setLoading(true);
    try {
      const [leaves, bal, summ] = await Promise.all([
        apiFetch(`${mainOrigin}/leaves/employee/${empId}`),
        apiFetch(`${mainOrigin}/leaves/employee/${empId}/balance`),
        apiFetch(`${mainOrigin}/leaves/employee/${empId}/summary`),
      ]);
      setEmpLeaves(Array.isArray(leaves) ? leaves : []);
      setEmpBal(Array.isArray(bal) ? bal : []);
      setEmpSumm(Array.isArray(summ) ? summ : []);
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const STATUS_COLORS = { pending:"#f59e0b", approved:"#10b981", rejected:"#f87171", cancelled:"#94a3b8" };

  return (
    <div className="space-y-4">
      <div className="lm-tab-bar" style={{ maxWidth: 400 }}>
        {[["stats","Stats"],["dept","Department"],["employee","Employee Lookup"]].map(([k,l]) => (
          <button key={k} onClick={() => setAdminSub(k)} className={`lm-tab ${adminSub===k?"active":""}`}>{l}</button>
        ))}
      </div>

      {/* ── Global Stats ── */}
      {adminSub === "stats" && (
        <div className="lm-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-extrabold text-gray-900">Organisation Leave Statistics</h3>
            <button onClick={loadStats} disabled={loading} className="lm-btn lm-btn-ghost" style={{ padding:"6px 12px",fontSize:12 }}>
              <RefreshCw size={12} className={loading?"lm-spin":""} /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_,i) => <Skel key={i} h="80px" />)}</div>
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lm-stagger">
              {Object.entries(stats).map(([key, val]) => {
                const color = STATUS_COLORS[key] || "#6366f1";
                const Icon = STATUS_CFG[key]?.icon || BarChart2;
                return (
                  <div key={key} className="rounded-2xl p-4 text-center lm-up"
                    style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                    <Icon size={20} className="mx-auto mb-2" style={{ color }} />
                    <p className="text-3xl font-black lm-mono" style={{ color }}>{val}</p>
                    <p className="text-xs font-bold mt-1 capitalize" style={{ color }}>{key}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No stats available</p>
            </div>
          )}
        </div>
      )}

      {/* ── Department ── */}
      {adminSub === "dept" && (
        <div className="lm-card p-5">
          <h3 className="text-base font-extrabold text-gray-900 mb-4">Department Leave Stats</h3>
          <div className="flex gap-2 mb-5">
            <input type="number" className="lm-input" placeholder="Department ID"
              value={deptId} onChange={e => setDeptId(e.target.value)}
              style={{ maxWidth: 200 }} />
            <button onClick={loadDeptStats} disabled={loading} className="lm-btn lm-btn-primary">
              {loading ? <Loader2 size={13} className="lm-spin" /> : <Search size={13} />} Fetch
            </button>
          </div>
          {deptStats && (
            <div className="space-y-4 lm-up">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label:"Dept ID",   val: deptStats.department_id, color:"#6366f1" },
                  { label:"Employees", val: deptStats.total_employees, color:"#0ea5e9" },
                  { label:"Total Leaves", val: deptStats.total_leaves, color:"#8b5cf6" },
                  { label:"Pending",   val: deptStats.pending,  color:"#f59e0b" },
                  { label:"Approved",  val: deptStats.approved, color:"#10b981" },
                  { label:"Rejected",  val: deptStats.rejected, color:"#f87171" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="rounded-2xl p-3 text-center lm-up"
                    style={{ background:`${color}10`, border:`1px solid ${color}25` }}>
                    <p className="text-2xl font-black lm-mono" style={{ color }}>{val ?? "—"}</p>
                    <p className="text-xs font-bold mt-0.5" style={{ color, opacity: 0.8 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Employee Lookup ── */}
      {adminSub === "employee" && (
        <div className="space-y-4">
          <div className="lm-card p-5">
            <h3 className="text-base font-extrabold text-gray-900 mb-4">Employee Leave Lookup</h3>
            <div className="flex gap-2 mb-5">
              <input type="number" className="lm-input" placeholder="Employee ID"
                value={empId} onChange={e => setEmpId(e.target.value)}
                style={{ maxWidth: 200 }} />
              <button onClick={loadEmpData} disabled={loading} className="lm-btn lm-btn-primary">
                {loading ? <Loader2 size={13} className="lm-spin" /> : <Eye size={13} />} Lookup
              </button>
            </div>

            {empSumm.length > 0 && (
              <div className="mb-5">
                <p className="lm-label mb-3">Balance Summary</p>
                <div className="overflow-x-auto lm-scroll">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Type","Allocated","Used","Pending","Carry Fwd","Remaining"].map(h => (
                          <th key={h} className="pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {empSumm.map((s, i) => (
                        <tr key={i} className="lm-row border-b border-gray-50 last:border-0">
                          <td className="py-2.5 px-3 text-sm font-semibold text-gray-800">{s.leave_type}</td>
                          <td className="py-2.5 px-3 text-sm lm-mono text-gray-600">{s.allocated}</td>
                          <td className="py-2.5 px-3 text-sm lm-mono text-red-600">{s.used}</td>
                          <td className="py-2.5 px-3 text-sm lm-mono text-amber-600">{s.pending}</td>
                          <td className="py-2.5 px-3 text-sm lm-mono text-violet-600">{s.carry_forward}</td>
                          <td className="py-2.5 px-3 text-sm lm-mono font-bold text-emerald-600">{s.remaining}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {empLeaves.length > 0 && (
              <div>
                <p className="lm-label mb-3">Leave History</p>
                <div className="overflow-x-auto lm-scroll">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Type","Dates","Days","Status"].map(h => (
                          <th key={h} className="pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {empLeaves.map(l => (
                        <tr key={l.id} className="lm-row border-b border-gray-50 last:border-0">
                          <td className="py-2.5 px-3 text-sm font-semibold text-gray-800">
                            {l.leave_type?.name || `Type ${l.leave_type_id}`}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-gray-500 lm-mono">
                            {fmtDate(l.start_date)} → {fmtDate(l.end_date)}
                          </td>
                          <td className="py-2.5 px-3 text-xs lm-mono font-bold text-gray-700">{l.days}d</td>
                          <td className="py-2.5 px-3"><StatusBadge status={l.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {empId && empLeaves.length === 0 && empSumm.length === 0 && !loading && (
              <div className="text-center py-10">
                <Users size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400 font-medium">No data found. Enter an employee ID and click Lookup.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
export default function LeaveManagement() {
  const auth = useMemo(() => getAuth(), []);

  /* Level mapping:
     1=SuperAdmin, 2=CEO, 3=HRAdmin, 4=HR, 5=finance, 6=HOD 7=lead, 8=Employee, 9=intern, */
  const isEmployee = true;                       // everyone can see employee tab
  const isManager  = auth && auth.level <= 6;    // 1-6
  const isHR       = auth && auth.level <= 4;    // 1-4
  const isAdmin    = auth && auth.level <= 3;    // 1-3
    console.log(auth)
  const tabs = [
    { key: "employee", label: "My Leaves",  Icon: Calendar,  show: true        },
    { key: "manager",  label: "Approvals",  Icon: CheckCircle, show: isManager  },
    { key: "hr",       label: "HR Config",  Icon: Settings,  show: isHR        },
    { key: "admin",    label: "Reports",    Icon: BarChart2, show: isAdmin     },
  ].filter(t => t.show);

  const [activeTab, setActiveTab] = useState(tabs[0]?.key || "employee");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type, key: Date.now() });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="lm-page lm-bg min-h-screen px-4 sm:px-8 py-7">
      {/* Toast */}
      {toast && (
        <Toast key={toast.key} msg={toast.msg} type={toast.type}
          onDone={() => setToast(null)} />
      )}

      {/* ── Header ── */}
      <header className="mb-7 lm-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)", boxShadow: "0 4px 20px rgba(99,102,241,.35)" }}>
              <Umbrella size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Leave Management
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                {greeting}, {auth?.name?.split(" ")[0] || "User"} · {new Date().toLocaleDateString("default", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="lm-badge lm-mono"
              style={{ background: "#ede9fe", color: "#7c3aed", padding: "6px 14px", fontSize: 11 }}>
              Level {auth?.level ?? "—"}
            </span>
            <span className="lm-badge"
              style={{ background: "#dcfce7", color: "#16a34a", padding: "6px 14px", fontSize: 11 }}>
              {isAdmin ? "Admin" : isHR ? "HR" : isManager ? "Manager" : "Employee"}
            </span>
          </div>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex items-center gap-1 mt-6 bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm w-fit flex-wrap">
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === key
                  ? "text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              style={activeTab === key ? { background: "linear-gradient(135deg,#ede9fe,#e0e7ff)" } : {}}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="lm-slide" key={activeTab}>
        {activeTab === "employee" && <EmployeeTab auth={auth} toast={showToast} />}
        {activeTab === "manager"  && <ManagerTab  auth={auth} toast={showToast} />}
        {activeTab === "hr"       && <HRTab       auth={auth} toast={showToast} />}
        {activeTab === "admin"    && <AdminTab     auth={auth} toast={showToast} />}
      </main>
    </div>
  );
}