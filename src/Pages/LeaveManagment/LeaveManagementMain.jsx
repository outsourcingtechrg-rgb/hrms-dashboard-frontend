import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Users, Clock, CheckCircle2, XCircle, Ban,
  BarChart3, Search, Filter, ChevronDown, X, Loader2, Info,
  AlertTriangle, Plus, Trash2, Settings, RefreshCw, FileText,
  Paperclip, Download, TrendingUp, Eye
} from "lucide-react";
import { API } from "../../Components/Apis";
// ─── API ──────────────────────────────────────────────────────────────────────

const token = () => localStorage.getItem("access_token") || "";
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });
const jsonHeaders = () => ({ ...authHeaders(), "Content-Type": "application/json" });

const apiFetch = async (url, opts = {}) => {
  const res = await fetch(url, { headers: jsonHeaders(), ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
};
async function downloadWithAuth(url, filename) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Download failed");
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename || "attachment";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const today = () => new Date().toISOString().split("T")[0];

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING:   { label: "Pending",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  icon: Clock,         dot: "bg-amber-400" },
  APPROVED:  { label: "Approved",  text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2,  dot: "bg-emerald-400" },
  REJECTED:  { label: "Rejected",  text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",    icon: XCircle,       dot: "bg-red-400" },
  CANCELLED: { label: "Cancelled", text: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200",   icon: Ban,           dot: "bg-gray-400" },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.PENDING;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.text} ${c.bg} ${c.border}`}>
      <Icon size={11} />{c.label}
    </span>
  );
}



// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white ${t.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
          {t.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Stat Widget ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue:    { bg: "bg-blue-50",    icon: "bg-blue-100 text-blue-600",   val: "text-blue-700" },
    amber:   { bg: "bg-amber-50",   icon: "bg-amber-100 text-amber-600", val: "text-amber-700" },
    emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", val: "text-emerald-700" },
    red:     { bg: "bg-red-50",     icon: "bg-red-100 text-red-600",     val: "text-red-700" },
  }[color] || {};
  return (
    <div className={`rounded-2xl p-5 border border-gray-100 ${colors.bg} bg-white`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors.icon}`}>
        <Icon size={18} />
      </div>
      <p className={`text-2xl font-bold ${colors.val}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
function ReviewModal({ app, action, onClose, onDone, addToast }) {
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState(false);
  const [atts, setAtts]       = useState([]);
  const [downloading, setDownloading] = useState(null);

  
  const handleDownload = async (att) => {
    setDownloading(att.id);
    try {
      await downloadWithAuth(API.DownloadAttachment(att.id), att.file_name);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    apiFetch(API.GetManagementAttachments(app.id)).then(setAtts).catch(() => {});
  }, [app.id]);

  const submit = async () => {
    setLoading(true);
    try {
      const url = action === "approve" ? API.ApproveApplication(app.id) : API.RejectApplication(app.id);
      await apiFetch(url, { method: "POST", body: JSON.stringify({ hr_note: note || undefined }) });
      addToast(`Application ${action === "approve" ? "approved" : "rejected"}`, "success");
      onDone();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const isApprove = action === "approve";
  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${isApprove ? "bg-gradient-to-r from-emerald-50 to-teal-50" : "bg-gradient-to-r from-red-50 to-rose-50"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isApprove ? "bg-emerald-600" : "bg-red-600"}`}>
              {isApprove ? <CheckCircle2 size={16} className="text-white" /> : <XCircle size={16} className="text-white" />}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">{isApprove ? "Approve" : "Reject"} Leave</h2>
              <p className="text-xs text-gray-400">Application #{app.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {[
              ["Employee", `#${app.employee_id}`],
              ["Leave Type", app.leave_type?.name || "—"],
              ["Duration", `${fmt(app.start_date)} – ${fmt(app.end_date)}`],
              ["Days", `${app.requested_days} day(s)`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-xs text-gray-400">{k}</span>
                <span className="text-sm font-semibold text-gray-800">{v}</span>
              </div>
            ))}
          </div>

          {app.employee_note && (
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5">Employee Note</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{app.employee_note}</p>
            </div>
          )}

          {atts.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Attachments</p>
              <div className="space-y-1.5">
                {atts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-600 truncate">{a.file_name}</span>
                    </div>
                    <button
                        onClick={() => handleDownload(a)}
                        disabled={downloading === a.id}
                        className="flex items-center gap-1 text-blue-600 text-xs font-semibold hover:underline ml-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {downloading === a.id
                        ? <Loader2 size={11} className="animate-spin" />
                        : <Download size={11} />}
                        {downloading === a.id ? "Downloading…" : "Download"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HR note */}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">HR Note (optional)</label>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder={`Add a note for the employee…`}
              className={`${inp} resize-none`} />
          </div>

          {!isApprove && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">This action cannot be undone. The employee will be notified.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button onClick={submit} disabled={loading}
            className={`flex-1 py-2.5 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60
              ${isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>
            {loading ? <><Loader2 size={13} className="animate-spin" /> Processing…</> :
              isApprove ? <><CheckCircle2 size={13} /> Approve</> : <><XCircle size={13} /> Reject</>}
          </button>
          <button onClick={onClose} disabled={loading}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-xl transition disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cycle / Type Modals ─────────────────────────────────────────────────────
function CycleModal({ cycle, onClose, onDone, addToast }) {
  const [form, setForm] = useState({ name: cycle?.name || "", start_date: cycle?.start_date || "", end_date: cycle?.end_date || "", is_active: cycle?.is_active ?? true });
  const [loading, setLoading] = useState(false);
  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition";

  const submit = async () => {
    if (!form.name || !form.start_date || !form.end_date) { addToast("All fields required", "error"); return; }
    setLoading(true);
    try {
      if (cycle) await apiFetch(API.UpdateCycle(cycle.id), { method: "PATCH", body: JSON.stringify(form) });
      else       await apiFetch(API.CreateCycle(), { method: "POST", body: JSON.stringify(form) });
      addToast(cycle ? "Cycle updated" : "Cycle created", "success");
      onDone();
    } catch (e) { addToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <CalendarDays size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">{cycle ? "Edit Cycle" : "New Cycle"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 transition">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">Cycle Name *</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inp} placeholder="e.g. FY 2026-27" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["start_date", "Start Date"], ["end_date", "End Date"]].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">{l} *</label>
                <input type="date" value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} className={inp} />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded" />
            <span className="text-sm text-gray-700">Set as active cycle</span>
          </label>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Save Cycle"}
          </button>
          <button onClick={onClose} className="py-2.5 px-5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function TypeModal({ type, cycles, onClose, onDone, addToast }) {
  const [form, setForm] = useState({
    name: type?.name || "", cycle_id: type?.cycle_id || cycles[0]?.id || "",
    gender_specific: type?.gender_specific || "ALL", is_paid: type?.is_paid ?? true,
    min_days: type?.min_days || 1, max_per_use: type?.max_per_use || 30,
    total_per_cycle: type?.total_per_cycle || 0,
    requires_document: type?.requires_document || false,
    document_description: type?.document_description || "",
    allowed_file_types: type?.allowed_file_types || "pdf,jpg,png,doc,docx",
  });
  const [loading, setLoading] = useState(false);
  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition";

  const submit = async () => {
    if (!form.name || !form.cycle_id) { addToast("Name and cycle required", "error"); return; }
    setLoading(true);
    try {
      if (type) await apiFetch(API.UpdateType(type.id), { method: "PATCH", body: JSON.stringify(form) });
      else      await apiFetch(API.CreateType(), { method: "POST", body: JSON.stringify({ ...form, cycle_id: Number(form.cycle_id) }) });
      addToast(type ? "Leave type updated" : "Leave type created", "success");
      onDone();
    } catch (e) { addToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <Settings size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">{type ? "Edit Leave Type" : "New Leave Type"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 transition">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inp} placeholder="e.g. Annual Leave" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">Cycle *</label>
              <select value={form.cycle_id} onChange={(e) => setForm((p) => ({ ...p, cycle_id: e.target.value }))} className={inp}>
                {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">Gender</label>
              <select value={form.gender_specific} onChange={(e) => setForm((p) => ({ ...p, gender_specific: e.target.value }))} className={inp}>
                {["ALL", "MALE", "FEMALE"].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            {[["min_days","Min Days",1],["max_per_use","Max Per Use",1],["total_per_cycle","Total/Cycle (0=unlimited)",0]].map(([k,l,mn]) => (
              <div key={k}>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">{l}</label>
                <input type="number" min={mn} value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: Number(e.target.value) }))} className={inp} />
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            {[["is_paid","Paid Leave"],["requires_document","Requires Document"]].map(([k,l]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.checked }))} />
                <span className="text-sm text-gray-700">{l}</span>
              </label>
            ))}
          </div>
          {form.requires_document && (
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">Allowed File Types</label>
              <input value={form.allowed_file_types} onChange={(e) => setForm((p) => ({ ...p, allowed_file_types: e.target.value }))} className={inp} placeholder="pdf,jpg,png" />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : "Save Type"}
          </button>
          <button onClick={onClose} className="py-2.5 px-5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Leave Management View ────────────────────────────────────────────────────
export default function LeaveManagement() {
  const [tab, setTab]             = useState("applications"); // applications | cycles | types | dashboard
  const [apps, setApps]           = useState([]);
  const [cycles, setCycles]       = useState([]);
  const [types, setTypes]         = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("ALL");
  const [reviewModal, setReview]  = useState(null); // { app, action }
  const [cycleModal, setCycleModal] = useState(null); // null | "new" | cycle obj
  const [typeModal, setTypeModal]   = useState(null);
  const [toasts, setToasts]         = useState([]);
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [appsData, cyclesData, typesData, statsData] = await Promise.all([
        apiFetch(API.GetAllApplications()),
        apiFetch(API.GetAllCycles()),
        apiFetch(API.GetAllTypes()),
        apiFetch(API.GetDashboardStats()).catch(() => null),
      ]);
      setApps(appsData);
      setCycles(cyclesData);
      setTypes(typesData);
      if (statsData) setStats(statsData);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredApps = apps.filter((a) => {
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
    const matchSearch = !search || String(a.employee_id).includes(search) || a.leave_type?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = apps.filter((a) => a.status === "PENDING").length;

  const TABS = [
    { id: "applications", label: "Applications", icon: FileText, badge: pendingCount || null },
    { id: "dashboard",    label: "Dashboard",    icon: BarChart3 },
    { id: "cycles",       label: "Cycles",       icon: CalendarDays },
    { id: "types",        label: "Leave Types",  icon: Settings },
  ];

  const deleteCycle = async (id) => {
    if (!confirm("Delete this cycle? This cannot be undone.")) return;
    try {
      await apiFetch(API.UpdateCycle(id), { method: "DELETE" });
      addToast("Cycle deleted", "success");
      loadAll();
    } catch (e) { addToast(e.message, "error"); }
  };

  const deleteType = async (id) => {
    if (!confirm("Delete this leave type?")) return;
    try {
      await apiFetch(API.DeleteType(id), { method: "DELETE" });
      addToast("Leave type deleted", "success");
      loadAll();
    } catch (e) { addToast(e.message, "error"); }
  };

  return (
    <section className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage applications, cycles and leave types</p>
          </div>
          <button onClick={loadAll} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-white transition">
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 mb-6 shadow-sm w-fit">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition relative ${
                  active ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                <Icon size={14} />
                {t.label}
                {t.badge ? (
                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${active ? "bg-white text-blue-600" : "bg-amber-400 text-white"}`}>
                    {t.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* ── Applications Tab ── */}
            {tab === "applications" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by employee ID or leave type…"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-blue-400 transition" />
                  </div>
                  <div className="relative">
                    <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-600 outline-none focus:border-blue-400 transition">
                      <option value="ALL">All Status</option>
                      {["PENDING","APPROVED","REJECTED","CANCELLED"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">{filteredApps.length} result{filteredApps.length !== 1 ? "s" : ""}</span>
                </div>

                {filteredApps.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText size={20} className="text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">No applications found</h3>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Emp ID", "Leave Type", "Duration", "Days", "Applied On", "Status", "Actions"].map((h) => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredApps.map((app) => (
                          <tr key={app.id} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-4 text-sm font-semibold text-gray-800">#{app.employee_id}</td>
                            <td className="px-5 py-4 text-sm text-gray-700">{app.leave_type?.name || "—"}</td>
                            <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{fmt(app.start_date)} – {fmt(app.end_date)}</td>
                            <td className="px-5 py-4 text-sm font-medium text-gray-700">{app.requested_days}d</td>
                            <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{fmt(app.requested_at)}</td>
                            <td className="px-5 py-4"><StatusBadge status={app.status} /></td>
                            <td className="px-5 py-4">
                              {app.status === "PENDING" ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setReview({ app, action: "approve" })}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition">
                                    <CheckCircle2 size={11} /> Approve
                                  </button>
                                  <button onClick={() => setReview({ app, action: "reject" })}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition">
                                    <XCircle size={11} /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── Dashboard Tab ── */}
            {tab === "dashboard" && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Leaves Taken"  value={stats.total_leaves_taken}              icon={CalendarDays} color="blue"    />
                  <StatCard label="Pending Approvals"   value={stats.pending_approvals}               icon={Clock}        color="amber"   />
                  <StatCard label="Approval Rate"        value={`${stats.approved_vs_rejected?.ratio ?? 0}%`} icon={TrendingUp}  color="emerald" />
                  <StatCard label="Rejected"            value={stats.approved_vs_rejected?.rejected ?? 0} icon={XCircle}  color="red"     />
                </div>

                {/* Monthly trend */}
                {stats.monthly_trend?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Monthly Leave Trend</h3>
                    <div className="flex items-end gap-2 h-32">
                      {stats.monthly_trend.map((m) => {
                        const max = Math.max(...stats.monthly_trend.map((x) => x.total_leaves), 1);
                        const h   = Math.round((m.total_leaves / max) * 100);
                        return (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500 font-medium">{m.total_leaves}</span>
                            <div className="w-full bg-blue-500 rounded-t-lg transition-all" style={{ height: `${h}%`, minHeight: "4px" }} />
                            <span className="text-[10px] text-gray-400">{m.month.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Department usage */}
                {stats.department_usage?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Department Usage</h3>
                    <div className="space-y-3">
                      {stats.department_usage.map((d) => {
                        const max = Math.max(...stats.department_usage.map((x) => x.total_leaves), 1);
                        return (
                          <div key={d.department} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-32 truncate">{d.department}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(d.total_leaves / max) * 100}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 w-8 text-right">{d.total_leaves}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Cycles Tab ── */}
            {tab === "cycles" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">Leave Cycles</h2>
                  <button onClick={() => setCycleModal("new")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2">
                    <Plus size={13} /> New Cycle
                  </button>
                </div>
                {cycles.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CalendarDays size={20} className="text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">No cycles created yet</h3>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {cycles.map((c) => (
                      <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-10 rounded-full ${c.is_active ? "bg-emerald-400" : "bg-gray-200"}`} />
                          <div>
                            <p className="text-sm font-bold text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-400">{fmt(c.start_date)} – {fmt(c.end_date)}</p>
                          </div>
                          {c.is_active && <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">Active</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setCycleModal(c)}
                            className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100 transition">Edit</button>
                          <button onClick={() => deleteCycle(c.id)}
                            className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Types Tab ── */}
            {tab === "types" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">Leave Types</h2>
                  <button onClick={() => setTypeModal("new")}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2">
                    <Plus size={13} /> New Type
                  </button>
                </div>
                {types.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Settings size={20} className="text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">No leave types configured</h3>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Name","Cycle","Gender","Paid","Min","Max","Total/Cycle","Doc Required","Actions"].map((h) => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {types.map((t) => {
                          const cyc = cycles.find((c) => c.id === t.cycle_id);
                          return (
                            <tr key={t.id} className="hover:bg-gray-50 transition">
                              <td className="px-5 py-4 text-sm font-bold text-gray-800">{t.name}</td>
                              <td className="px-5 py-4 text-sm text-gray-500">{cyc?.name || `#${t.cycle_id}`}</td>
                              <td className="px-5 py-4 text-xs text-gray-500">{t.gender_specific}</td>
                              <td className="px-5 py-4">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.is_paid ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                  {t.is_paid ? "Paid" : "Unpaid"}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-600">{t.min_days}d</td>
                              <td className="px-5 py-4 text-sm text-gray-600">{t.max_per_use}d</td>
                              <td className="px-5 py-4 text-sm text-gray-600">{t.total_per_cycle === 0 ? "∞" : `${t.total_per_cycle}d`}</td>
                              <td className="px-5 py-4 text-center">
                                {t.requires_document
                                  ? <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto"><Paperclip size={10} /></span>
                                  : <span className="text-xs text-gray-300">—</span>}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setTypeModal(t)}
                                    className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100 transition">Edit</button>
                                  <button onClick={() => deleteType(t.id)}
                                    className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {reviewModal && (
        <ReviewModal app={reviewModal.app} action={reviewModal.action}
          onClose={() => setReview(null)} onDone={() => { setReview(null); loadAll(); }} addToast={addToast} />
      )}
      {cycleModal && (
        <CycleModal cycle={cycleModal === "new" ? null : cycleModal}
          onClose={() => setCycleModal(null)} onDone={() => { setCycleModal(null); loadAll(); }} addToast={addToast} />
      )}
      {typeModal && (
        <TypeModal type={typeModal === "new" ? null : typeModal} cycles={cycles}
          onClose={() => setTypeModal(null)} onDone={() => { setTypeModal(null); loadAll(); }} addToast={addToast} />
      )}
    </section>
  );
}