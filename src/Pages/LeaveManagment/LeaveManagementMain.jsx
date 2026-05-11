import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  BarChart3,
  Search,
  ChevronDown,
  X,
  Loader2,
  AlertTriangle,
  Plus,
  Trash2,
  Settings,
  RefreshCw,
  FileText,
  Paperclip,
  Download,
  TrendingUp,
  ArrowRight,
  Tag,
  Calendar,
  ShieldCheck,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Edit2,
} from "lucide-react";
import { API } from "../../Components/Apis";

const token = () => localStorage.getItem("access_token") || "";
const authHdrs = () => ({ Authorization: `Bearer ${token()}` });
const jsonHdrs = () => ({ ...authHdrs(), "Content-Type": "application/json" });
const apiFetch = async (url, opts = {}) => {
  const res = await fetch(url, { headers: jsonHdrs(), ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
};
async function downloadWithAuth(url, filename) {
  const res = await fetch(url, { headers: authHdrs() });
  if (!res.ok) throw new Error("Download failed");
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
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const PAGE_SIZE = 12;

const SC = {
  PENDING: {
    label: "Pending",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
    grad: "from-amber-400 to-orange-400",
  },
  APPROVED: {
    label: "Approved",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
    grad: "from-emerald-400 to-teal-400",
  },
  REJECTED: {
    label: "Rejected",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
    grad: "from-red-400 to-rose-400",
  },
  CANCELLED: {
    label: "Cancelled",
    text: "text-gray-500",
    bg: "bg-gray-100",
    border: "border-gray-200",
    icon: Ban,
    grad: "from-gray-300 to-gray-400",
  },
};

function StatusBadge({ status, size = "sm" }) {
  const c = SC[status] || SC.PENDING;
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${size === "lg" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"} ${c.text} ${c.bg} ${c.border}`}
    >
      <Icon size={size === "lg" ? 13 : 11} />
      {c.label}
    </span>
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 pointer-events-none items-center">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium text-white ${t.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
        >
          {t.type === "success" ? (
            <CheckCircle2 size={15} />
          ) : (
            <AlertTriangle size={15} />
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function EmpCell({ app }) {
  const emp = app.employee;
  const name = emp
    ? `${emp.f_name || ""} ${emp.l_name || ""}`.trim()
    : `Emp #${app.employee_id}`;
  const dept = emp?.department?.department || "—";
  const role = emp?.designation || emp?.role?.name || "—";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {initials || "?"}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
        <p className="text-xs text-gray-400 truncate">
          {dept} · {role}
        </p>
      </div>
    </div>
  );
}

const SLIDE_STYLE = `@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`;

function AppDetailPanel({ app, onClose, onApprove, onReject, addToast }) {
  const [atts, setAtts] = useState([]);
  const [attsLoading, setAttsLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  useEffect(() => {
    if (!app?.id) return;
    setAttsLoading(true);
    apiFetch(API.GetManagementAttachments(app.id))
      .then(setAtts)
      .catch(() => setAtts([]))
      .finally(() => setAttsLoading(false));
  }, [app?.id]);
  const handleDownload = async (att) => {
    setDownloading(att.id);
    try {
      await downloadWithAuth(
        API.DownloadManagementAttachment(att.id),
        att.file_name,
      );
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setDownloading(null);
    }
  };
  const sc = SC[app.status] || SC.PENDING;
  const Icon = sc.icon;
  const emp = app.employee;
  const empName = emp
    ? `${emp.f_name || ""} ${emp.l_name || ""}`.trim()
    : `Employee #${app.employee_id}`;
  const startD = app.start_date ? new Date(app.start_date) : null;
  const endD = app.end_date ? new Date(app.end_date) : null;
  return (
    <>
      <div
        className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-[160] w-full max-w-[420px] bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideIn .22s ease-out" }}
      >
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${sc.bg} ${sc.border}`}
              >
                <Icon size={18} className={sc.text} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">
                  Application #{app.id}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {app.leave_type?.name || "Leave"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition shrink-0"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={app.status} size="lg" />
            {app.status === "PENDING" && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => onApprove(app)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                >
                  <CheckCircle2 size={12} /> Approve
                </button>
                <button
                  onClick={() => onReject(app)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
                >
                  <XCircle size={12} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-4 mt-4 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-4 text-white">
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-widest mb-3">
              Employee
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {empName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-bold text-white">{empName}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {emp?.department?.department && (
                    <span className="flex items-center gap-1 text-xs text-slate-300">
                      <Building2 size={10} />
                      {emp.department.department}
                    </span>
                  )}
                  {emp?.designation && (
                    <span className="flex items-center gap-1 text-xs text-slate-300">
                      <Briefcase size={10} />
                      {emp.designation}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mx-4 mt-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-600 text-[11px] font-bold uppercase tracking-widest">
                Duration
              </p>
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {app.requested_days} day{app.requested_days !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-black text-blue-800 leading-none">
                  {startD ? startD.getDate() : "—"}
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  {startD
                    ? startD.toLocaleDateString("en-GB", {
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </p>
              </div>
              <ArrowRight size={16} className="text-blue-400 shrink-0" />
              <div className="text-center">
                <p className="text-2xl font-black text-blue-800 leading-none">
                  {endD ? endD.getDate() : "—"}
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  {endD
                    ? endD.toLocaleDateString("en-GB", {
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="mx-4 mt-3 bg-gray-50 rounded-2xl divide-y divide-gray-100 border border-gray-100 overflow-hidden">
            {[
              {
                icon: Tag,
                label: "Leave Type",
                value: app.leave_type?.name || "—",
              },
              {
                icon: Calendar,
                label: "Applied On",
                value: fmt(app.requested_at),
              },
              ...(app.reviewed_at
                ? [
                    {
                      icon: ShieldCheck,
                      label: "Reviewed On",
                      value: fmt(app.reviewed_at),
                    },
                  ]
                : []),
            ].map(({ icon: Ic, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Ic size={12} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>
          {app.employee_note && (
            <div className="mx-4 mt-3">
              <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5">
                Employee Note
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {app.employee_note}
                </p>
              </div>
            </div>
          )}
          {app.hr_note && (
            <div className="mx-4 mt-3">
              <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5">
                HR Note
              </p>
              <div
                className={`rounded-xl p-3 border ${app.status === "REJECTED" ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}
              >
                <p
                  className={`text-sm leading-relaxed ${app.status === "REJECTED" ? "text-red-700" : "text-emerald-800"}`}
                >
                  {app.hr_note}
                </p>
              </div>
            </div>
          )}
          <div className="mx-4 mt-3 mb-6">
            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5">
              Attachments {!attsLoading && `(${atts.length})`}
            </p>
            {attsLoading ? (
              <div className="flex items-center gap-2 py-2 text-gray-400">
                <Loader2 size={13} className="animate-spin" />
                <span className="text-xs">Loading…</span>
              </div>
            ) : atts.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400">No attachments</p>
              </div>
            ) : (
              <div className="space-y-2">
                {atts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-blue-200 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText size={12} className="text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">
                          {a.file_name}
                        </p>
                        {a.file_size && (
                          <p className="text-[10px] text-gray-400">
                            {(a.file_size / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(a)}
                      disabled={downloading === a.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 shrink-0 ml-2"
                    >
                      {downloading === a.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Download size={10} />
                      )}
                      {downloading === a.id ? "…" : "Download"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{SLIDE_STYLE}</style>
    </>
  );
}

function ReviewModal({ app, action, onClose, onDone, addToast }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const isApprove = action === "approve";
  const emp = app.employee;
  const empName = emp
    ? `${emp.f_name || ""} ${emp.l_name || ""}`.trim()
    : `Emp #${app.employee_id}`;
  const submit = async () => {
    setLoading(true);
    try {
      await apiFetch(
        isApprove
          ? API.ApproveApplication(app.id)
          : API.RejectApplication(app.id),
        {
          method: "POST",
          body: JSON.stringify({ hr_note: note || undefined }),
        },
      );
      addToast(`Application ${isApprove ? "approved" : "rejected"}`, "success");
      onDone();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };
  const inp =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div
          className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${isApprove ? "bg-gradient-to-r from-emerald-50 to-teal-50" : "bg-gradient-to-r from-red-50 to-rose-50"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${isApprove ? "bg-emerald-600" : "bg-red-600"}`}
            >
              {isApprove ? (
                <CheckCircle2 size={16} className="text-white" />
              ) : (
                <XCircle size={16} className="text-white" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">
                {isApprove ? "Approve" : "Reject"} Leave
              </h2>
              <p className="text-xs text-gray-400">
                {empName} · #{app.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 transition"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            {[
              ["Employee", empName],
              ["Leave Type", app.leave_type?.name || "—"],
              ["Duration", `${fmt(app.start_date)} – ${fmt(app.end_date)}`],
              ["Days", `${app.requested_days} day(s)`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">{k}</span>
                <span className="text-sm font-semibold text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          {app.employee_note && (
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5">
                Employee Note
              </p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed border border-gray-100">
                {app.employee_note}
              </p>
            </div>
          )}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
              HR Note{" "}
              <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note visible to the employee…"
              className={`${inp} resize-none`}
            />
          </div>
          {!isApprove && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertTriangle
                size={13}
                className="text-red-500 mt-0.5 shrink-0"
              />
              <p className="text-xs text-red-700 leading-relaxed">
                This action cannot be undone. The employee will be notified.
              </p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button
            onClick={submit}
            disabled={loading}
            className={`flex-1 py-2.5 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 ${isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Processing…
              </>
            ) : isApprove ? (
              <>
                <CheckCircle2 size={13} /> Approve
              </>
            ) : (
              <>
                <XCircle size={13} /> Reject
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CyclePanel({ cycle, types, onClose, onEdit, onDelete }) {
  const cycleTypes = types.filter((t) => t.cycle_id === cycle.id);
  return (
    <>
      <div
        className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-[160] w-full max-w-[400px] bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideIn .22s ease-out" }}
      >
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <CalendarDays size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{cycle.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmt(cycle.start_date)} – {fmt(cycle.end_date)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 transition shrink-0"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {cycle.is_active && (
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                Active
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => onEdit(cycle)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 text-indigo-600 text-xs font-semibold rounded-xl hover:bg-indigo-50 transition"
              >
                <Edit2 size={11} /> Edit
              </button>
              <button
                onClick={() => onDelete(cycle.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
            Leave Types in this Cycle ({cycleTypes.length})
          </p>
          {cycleTypes.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">No leave types configured</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cycleTypes.map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-bold text-gray-800">{t.name}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.is_paid ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {t.is_paid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {[
                      ["Min", `${t.min_days}d`],
                      ["Max/use", `${t.max_per_use}d`],
                      [
                        "Total",
                        t.total_per_cycle === 0 ? "∞" : `${t.total_per_cycle}d`,
                      ],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="bg-gray-50 rounded-lg p-2 text-center"
                      >
                        <p className="text-[10px] text-gray-400">{k}</p>
                        <p className="text-sm font-bold text-gray-700">{v}</p>
                      </div>
                    ))}
                  </div>
                  {t.requires_document && (
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-blue-600">
                      <Paperclip size={10} /> Document required ·{" "}
                      {t.allowed_file_types}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{SLIDE_STYLE}</style>
    </>
  );
}

function TypePanel({ type, cycles, apps, onClose, onEdit, onDelete }) {
  const cycle = cycles.find((c) => c.id === type.cycle_id);
  const typeApps = apps.filter(
    (a) => a.leave_type_id === type.id || a.leave_type?.id === type.id,
  );
  const approved = typeApps.filter((a) => a.status === "APPROVED").length;
  const pending = typeApps.filter((a) => a.status === "PENDING").length;
  return (
    <>
      <div
        className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-[160] w-full max-w-[400px] bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideIn .22s ease-out" }}
      >
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                <Settings size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{type.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {cycle?.name || `Cycle #${type.cycle_id}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 transition shrink-0"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(type)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-violet-200 text-violet-600 text-xs font-semibold rounded-xl hover:bg-violet-50 transition"
            >
              <Edit2 size={11} /> Edit
            </button>
            <button
              onClick={() => onDelete(type.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition"
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
              Configuration
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Gender", type.gender_specific],
                ["Payment", type.is_paid ? "Paid" : "Unpaid"],
                ["Min Days", `${type.min_days}d`],
                ["Max / Use", `${type.max_per_use}d`],
                [
                  "Total / Cycle",
                  type.total_per_cycle === 0
                    ? "Unlimited"
                    : `${type.total_per_cycle}d`,
                ],
                ["Doc Required", type.requires_document ? "Yes" : "No"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                >
                  <p className="text-[10px] text-gray-400 font-medium">{k}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {type.requires_document && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                <Paperclip size={11} /> Allowed: {type.allowed_file_types}
              </div>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2">
              Usage (All Time)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Total", typeApps.length, "text-gray-800"],
                ["Approved", approved, "text-emerald-700"],
                ["Pending", pending, "text-amber-700"],
              ].map(([k, v, cls]) => (
                <div
                  key={k}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center"
                >
                  <p className="text-[10px] text-gray-400">{k}</p>
                  <p className={`text-xl font-black mt-0.5 ${cls}`}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{SLIDE_STYLE}</style>
    </>
  );
}

function CycleModal({ cycle, onClose, onDone, addToast }) {
  const [form, setForm] = useState({
    name: cycle?.name || "",
    start_date: cycle?.start_date || "",
    end_date: cycle?.end_date || "",
    is_active: cycle?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const inp =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition";
  const submit = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      addToast("All fields required", "error");
      return;
    }
    setLoading(true);
    try {
      if (cycle)
        await apiFetch(API.UpdateCycle(cycle.id), {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      else
        await apiFetch(API.CreateCycle(), {
          method: "POST",
          body: JSON.stringify(form),
        });
      addToast(cycle ? "Cycle updated" : "Cycle created", "success");
      onDone();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <CalendarDays size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">
              {cycle ? "Edit Cycle" : "New Cycle"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 transition"
          >
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
              Cycle Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={inp}
              placeholder="e.g. FY 2026-27"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["start_date", "Start Date"],
              ["end_date", "End Date"],
            ].map(([k, l]) => (
              <div key={k}>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                  {l} *
                </label>
                <input
                  type="date"
                  value={form[k]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [k]: e.target.value }))
                  }
                  className={inp}
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((p) => ({ ...p, is_active: e.target.checked }))
              }
              className="rounded"
            />
            <span className="text-sm text-gray-700">Set as active cycle</span>
          </label>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Saving…
              </>
            ) : (
              "Save Cycle"
            )}
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function TypeModal({ type, cycles, onClose, onDone, addToast }) {
  const [form, setForm] = useState({
    name: type?.name || "",
    cycle_id: type?.cycle_id || cycles[0]?.id || "",
    gender_specific: type?.gender_specific || "ALL",
    is_paid: type?.is_paid ?? true,
    min_days: type?.min_days || 1,
    max_per_use: type?.max_per_use || 30,
    total_per_cycle: type?.total_per_cycle || 0,
    requires_document: type?.requires_document || false,
    allowed_file_types: type?.allowed_file_types || "pdf,jpg,png,doc,docx",
  });
  const [loading, setLoading] = useState(false);
  const inp =
    "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition";
  const submit = async () => {
    if (!form.name || !form.cycle_id) {
      addToast("Name and cycle required", "error");
      return;
    }
    setLoading(true);
    try {
      if (type)
        await apiFetch(API.UpdateType(type.id), {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      else
        await apiFetch(API.CreateType(), {
          method: "POST",
          body: JSON.stringify({ ...form, cycle_id: Number(form.cycle_id) }),
        });
      addToast(type ? "Leave type updated" : "Leave type created", "success");
      onDone();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <Settings size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">
              {type ? "Edit Leave Type" : "New Leave Type"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 transition"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                Name *
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className={inp}
                placeholder="e.g. Annual Leave"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                Cycle *
              </label>
              <select
                value={form.cycle_id}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cycle_id: e.target.value }))
                }
                className={inp}
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                Gender
              </label>
              <select
                value={form.gender_specific}
                onChange={(e) =>
                  setForm((p) => ({ ...p, gender_specific: e.target.value }))
                }
                className={inp}
              >
                {["ALL", "MALE", "FEMALE"].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            {[
              ["min_days", "Min Days", 1],
              ["max_per_use", "Max Per Use", 1],
              ["total_per_cycle", "Total / Cycle (0=∞)", 0],
            ].map(([k, l, mn]) => (
              <div key={k}>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                  {l}
                </label>
                <input
                  type="number"
                  min={mn}
                  value={form[k]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [k]: Number(e.target.value) }))
                  }
                  className={inp}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-6">
            {[
              ["is_paid", "Paid Leave"],
              ["requires_document", "Requires Document"],
            ].map(([k, l]) => (
              <label
                key={k}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={form[k]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [k]: e.target.checked }))
                  }
                />
                <span className="text-sm text-gray-700">{l}</span>
              </label>
            ))}
          </div>
          {form.requires_document && (
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                Allowed File Types
              </label>
              <input
                value={form.allowed_file_types}
                onChange={(e) =>
                  setForm((p) => ({ ...p, allowed_file_types: e.target.value }))
                }
                className={inp}
                placeholder="pdf,jpg,png"
              />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50 shrink-0">
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Saving…
              </>
            ) : (
              "Save Type"
            )}
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ apps }) {
  const [trendRange, setTrendRange] = useState("month");
  const deptUsage = useMemo(() => {
    const map = {};
    apps
      .filter((a) => a.status === "APPROVED")
      .forEach((a) => {
        const dept = a.employee?.department?.department || "Unassigned";
        map[dept] = (map[dept] || 0) + (a.requested_days || 1);
      });
    return Object.entries(map)
      .map(([department, total_leaves]) => ({ department, total_leaves }))
      .sort((a, b) => b.total_leaves - a.total_leaves);
  }, [apps]);
  const trendData = useMemo(() => {
    const now = new Date();
    const result = {};
    apps
      .filter((a) => a.status === "APPROVED" && a.start_date)
      .forEach((a) => {
        const d = new Date(a.start_date);
        let key;
        if (trendRange === "week") {
          const diff = Math.floor((now - d) / 86400000);
          if (diff > 6) return;
          key = d.toLocaleDateString("en-GB", { weekday: "short" });
        } else if (trendRange === "month") {
          if (
            d.getFullYear() !== now.getFullYear() ||
            d.getMonth() !== now.getMonth()
          )
            return;
          key = `Wk ${Math.ceil(d.getDate() / 7)}`;
        } else {
          if (d.getFullYear() !== now.getFullYear()) return;
          key = d.toLocaleDateString("en-GB", { month: "short" });
        }
        result[key] = (result[key] || 0) + 1;
      });
    const keys =
      trendRange === "week"
        ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        : trendRange === "month"
          ? ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"]
          : [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
    return keys.map((k) => ({ label: k, value: result[k] || 0 }));
  }, [apps, trendRange]);
  const maxTrend = Math.max(...trendData.map((t) => t.value), 1);
  const maxDept = Math.max(...deptUsage.map((d) => d.total_leaves), 1);
  const totalTaken = apps
    .filter((a) => a.status === "APPROVED")
    .reduce((s, a) => s + (a.requested_days || 0), 0);
  const pendingCount = apps.filter((a) => a.status === "PENDING").length;
  const approvedCount = apps.filter((a) => a.status === "APPROVED").length;
  const rejectedCount = apps.filter((a) => a.status === "REJECTED").length;
  const ratio =
    approvedCount + rejectedCount > 0
      ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100)
      : 0;
  const CARDS = [
    {
      label: "Total Days Taken",
      value: totalTaken,
      icon: CalendarDays,
      from: "from-blue-500",
      to: "to-blue-700",
      light: "bg-blue-50 text-blue-600",
    },
    {
      label: "Pending Approvals",
      value: pendingCount,
      icon: Clock,
      from: "from-amber-500",
      to: "to-orange-600",
      light: "bg-amber-50 text-amber-600",
    },
    {
      label: "Approval Rate",
      value: `${ratio}%`,
      icon: TrendingUp,
      from: "from-emerald-500",
      to: "to-teal-600",
      light: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      icon: XCircle,
      from: "from-red-500",
      to: "to-rose-600",
      light: "bg-red-50 text-red-600",
    },
  ];
  const DEPT_COLORS = [
    "from-blue-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-violet-500 to-purple-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-sky-500",
  ];
  const DEPT_BADGES = [
    "bg-blue-50 text-blue-700",
    "bg-emerald-50 text-emerald-700",
    "bg-violet-50 text-violet-700",
    "bg-amber-50 text-amber-700",
    "bg-rose-50 text-rose-700",
    "bg-cyan-50 text-cyan-700",
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ label, value, icon: Icon, from, to, light }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className={`h-1 bg-gradient-to-r ${from} ${to}`} />
            <div className="p-5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${light}`}
              >
                <Icon size={18} />
              </div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-gray-800">Leave Trend</h3>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[
              ["week", "Week"],
              ["month", "Month"],
              ["year", "Year"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTrendRange(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${trendRange === v ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {trendData.every((t) => t.value === 0) ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No approved leaves in this period
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-36">
            {trendData.map((t) => {
              const pct = Math.max(
                (t.value / maxTrend) * 100,
                t.value > 0 ? 8 : 0,
              );
              return (
                <div
                  key={t.label}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  {t.value > 0 && (
                    <span className="absolute -top-5 text-[10px] text-gray-600 font-bold opacity-0 group-hover:opacity-100 transition bg-white border border-gray-200 px-1.5 py-0.5 rounded-lg shadow-sm">
                      {t.value}
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-lg transition-all ${t.value > 0 ? "bg-gradient-to-t from-blue-600 to-blue-400" : "bg-gray-100"}`}
                    style={{
                      height: `${pct}%`,
                      minHeight: t.value > 0 ? "8px" : "4px",
                    }}
                  />
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4">
          Department Usage{" "}
          <span className="text-gray-400 font-normal">(approved days)</span>
        </h3>
        {deptUsage.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No approved leaves yet
          </div>
        ) : (
          <div className="space-y-3">
            {deptUsage.map((d, i) => (
              <div key={d.department} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <Building2 size={13} className="text-gray-400" />
                </div>
                <span className="text-sm text-gray-600 w-36 truncate shrink-0">
                  {d.department}
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${DEPT_COLORS[i % DEPT_COLORS.length]} rounded-full transition-all`}
                    style={{ width: `${(d.total_leaves / maxDept) * 100}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${DEPT_BADGES[i % DEPT_BADGES.length]} shrink-0`}
                >
                  {d.total_leaves}d
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4">
          Applications by Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(SC).map(([status, cfg]) => {
            const count = apps.filter((a) => a.status === status).length;
            const Icon = cfg.icon;
            return (
              <div
                key={status}
                className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}
              >
                <Icon size={16} className={cfg.text} />
                <p className={`text-2xl font-black mt-2 ${cfg.text}`}>
                  {count}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LeaveManagement() {
  const [tab, setTab] = useState("applications");
  const [apps, setApps] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [cycleModal, setCycleModal] = useState(null);
  const [typeModal, setTypeModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, t, e] = await Promise.all([
        apiFetch(API.GetAllApplications()),
        apiFetch(API.GetAllCycles()),
        apiFetch(API.GetAllTypes()),
        apiFetch(API.GetAllEmployees),
      ]);
      const empMap = e.reduce((m, emp) => {
        m[emp.id] = emp;
        return m;
      }, {});
      setApps(
        a.map((app) => ({ ...app, employee: empMap[app.employee_id] || null })),
      );
      setCycles(c);
      setTypes(t);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);
  useEffect(() => {
    loadAll();
  }, [loadAll]);
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);
  useEffect(() => {
    if (selectedApp) {
      const fresh = apps.find((a) => a.id === selectedApp.id);
      if (fresh) setSelectedApp(fresh);
    }
  }, [apps]);
  const filteredApps = useMemo(() => {
    const q = search.toLowerCase();
    return apps
      .filter((a) => statusFilter === "ALL" || a.status === statusFilter)
      .filter((a) => {
        if (!q) return true;
        const emp = a.employee;
        const name = emp
          ? `${emp.f_name || ""} ${emp.l_name || ""}`.toLowerCase()
          : "";
        return (
          name.includes(q) ||
          String(a.employee_id).includes(q) ||
          (a.leave_type?.name || "").toLowerCase().includes(q) ||
          (emp?.department?.department || "").toLowerCase().includes(q) ||
          (emp?.designation || "").toLowerCase().includes(q) ||
          String(a.id).includes(q)
        );
      })
      .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
  }, [apps, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE));
  const pagedApps = filteredApps.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const pendingCount = apps.filter((a) => a.status === "PENDING").length;
  const pageNumbers = useMemo(() => {
    const nums = Array.from({ length: totalPages }, (_, i) => i + 1);
    return nums
      .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
      .reduce((acc, n, i, arr) => {
        if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
        acc.push(n);
        return acc;
      }, []);
  }, [totalPages, page]);
  const deleteCycle = async (id) => {
    if (!confirm("Delete this cycle?")) return;
    try {
      await apiFetch(API.DeleteCycle(id), { method: "DELETE" });
      addToast("Cycle deleted", "success");
      setSelectedCycle(null);
      loadAll();
    } catch (e) {
      addToast(e.message, "error");
    }
  };
  const deleteType = async (id) => {
    if (!confirm("Delete this leave type?")) return;
    try {
      await apiFetch(API.DeleteType(id), { method: "DELETE" });
      addToast("Leave type deleted", "success");
      setSelectedType(null);
      loadAll();
    } catch (e) {
      addToast(e.message, "error");
    }
  };
  const TABS = [
    {
      id: "applications",
      label: "Applications",
      icon: FileText,
      badge: pendingCount || null,
    },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "cycles", label: "Cycles", icon: CalendarDays },
    { id: "types", label: "Leave Types", icon: Settings },
  ];

  return (
    <section className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Leave Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage applications, cycles and leave types
            </p>
          </div>
          <button
            onClick={loadAll}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-blue-600 hover:border-blue-300 transition"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 mb-6 shadow-sm w-fit flex-wrap">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${active ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
              >
                <Icon size={14} />
                {t.label}
                {t.badge && (
                  <span
                    className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${active ? "bg-white text-blue-600" : "bg-amber-400 text-white"}`}
                  >
                    {t.badge}
                  </span>
                )}
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
            {tab === "applications" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-52">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, department, designation, leave type…"
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-blue-400 transition"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatus(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-600 outline-none focus:border-blue-400 transition cursor-pointer"
                    >
                      <option value="ALL">All Status</option>
                      {Object.entries(SC).map(([s, c]) => (
                        <option key={s} value={s}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                  {(search || statusFilter !== "ALL") && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setStatus("ALL");
                      }}
                      className="flex items-center gap-1 px-2 py-2 text-xs text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition"
                    >
                      <X size={11} /> Clear
                    </button>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {filteredApps.length} result
                    {filteredApps.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {pagedApps.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText size={20} className="text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      No applications found
                    </h3>
                    <p className="text-xs text-gray-400">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                          {[
                            "Employee",
                            "Leave Type",
                            "Duration",
                            "Days",
                            "Applied",
                            "Status",
                            "Actions",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {pagedApps.map((app) => {
                          const isSelected = selectedApp?.id === app.id;
                          return (
                            <tr
                              key={app.id}
                              onClick={() =>
                                setSelectedApp(isSelected ? null : app)
                              }
                              className={`cursor-pointer transition ${isSelected ? "bg-blue-50 ring-1 ring-inset ring-blue-200" : "hover:bg-gray-50"}`}
                            >
                              <td className="px-4 py-3.5">
                                <EmpCell app={app} />
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm text-gray-700 font-medium">
                                    {app.leave_type?.name || "—"}
                                  </span>
                                  {app.leave_type?.is_paid === false && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">
                                      Unpaid
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                                {fmt(app.start_date)} – {fmt(app.end_date)}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
                                  {app.requested_days}d
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                                {fmt(app.requested_at)}
                              </td>
                              <td className="px-4 py-3.5">
                                <StatusBadge status={app.status} />
                              </td>
                              <td
                                className="px-4 py-3.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {app.status === "PENDING" ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() =>
                                        setReviewModal({
                                          app,
                                          action: "approve",
                                        })
                                      }
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition"
                                    >
                                      <CheckCircle2 size={11} /> Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        setReviewModal({
                                          app,
                                          action: "reject",
                                        })
                                      }
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition"
                                    >
                                      <XCircle size={11} /> Reject
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className={`flex items-center gap-1 text-xs font-semibold ${isSelected ? "text-blue-500" : "text-gray-300"}`}
                                  >
                                    <ArrowRight size={12} /> View
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {(page - 1) * PAGE_SIZE + 1}–
                      {Math.min(page * PAGE_SIZE, filteredApps.length)} of{" "}
                      {filteredApps.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      {pageNumbers.map((n, i) =>
                        n === "..." ? (
                          <span
                            key={`el-${i}`}
                            className="w-8 h-8 flex items-center justify-center text-xs text-gray-400"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition ${page === n ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}
                          >
                            {n}
                          </button>
                        ),
                      )}
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === "dashboard" && <Dashboard apps={apps} />}
            {tab === "cycles" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">
                    Leave Cycles
                  </h2>
                  <button
                    onClick={() => setCycleModal("new")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2"
                  >
                    <Plus size={13} /> New Cycle
                  </button>
                </div>
                {cycles.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CalendarDays size={20} className="text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">
                      No cycles yet
                    </h3>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {cycles.map((c) => {
                      const isSelected = selectedCycle?.id === c.id;
                      const typeCount = types.filter(
                        (t) => t.cycle_id === c.id,
                      ).length;
                      return (
                        <div
                          key={c.id}
                          onClick={() =>
                            setSelectedCycle(isSelected ? null : c)
                          }
                          className={`px-6 py-4 flex items-center justify-between cursor-pointer transition ${isSelected ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200" : "hover:bg-gray-50"}`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-1.5 h-12 rounded-full ${c.is_active ? "bg-emerald-400" : "bg-gray-200"}`}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-900">
                                  {c.name}
                                </p>
                                {c.is_active && (
                                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full">
                                    Active
                                  </span>
                                )}
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded-full">
                                  {typeCount} type{typeCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {fmt(c.start_date)} – {fmt(c.end_date)}
                              </p>
                            </div>
                          </div>
                          <ArrowRight
                            size={15}
                            className={`transition ${isSelected ? "text-indigo-500" : "text-gray-300"}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {tab === "types" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">
                    Leave Types
                  </h2>
                  <button
                    onClick={() => setTypeModal("new")}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2"
                  >
                    <Plus size={13} /> New Type
                  </button>
                </div>
                {types.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Settings size={20} className="text-gray-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">
                      No leave types yet
                    </h3>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                          {[
                            "Name",
                            "Cycle",
                            "Gender",
                            "Paid",
                            "Min",
                            "Max",
                            "Total/Cycle",
                            "Doc",
                            "",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {types.map((t) => {
                          const cyc = cycles.find((c) => c.id === t.cycle_id);
                          const isSelected = selectedType?.id === t.id;
                          return (
                            <tr
                              key={t.id}
                              onClick={() =>
                                setSelectedType(isSelected ? null : t)
                              }
                              className={`cursor-pointer transition ${isSelected ? "bg-violet-50 ring-1 ring-inset ring-violet-200" : "hover:bg-gray-50"}`}
                            >
                              <td className="px-4 py-3.5 text-sm font-bold text-gray-800">
                                {t.name}
                              </td>
                              <td className="px-4 py-3.5 text-sm text-gray-500">
                                {cyc?.name || `#${t.cycle_id}`}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-gray-500 font-medium">
                                {t.gender_specific}
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.is_paid ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                                >
                                  {t.is_paid ? "Paid" : "Unpaid"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-gray-600">
                                {t.min_days}d
                              </td>
                              <td className="px-4 py-3.5 text-sm text-gray-600">
                                {t.max_per_use}d
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`text-sm font-bold ${t.total_per_cycle === 0 ? "text-indigo-600" : "text-gray-700"}`}
                                >
                                  {t.total_per_cycle === 0
                                    ? "∞"
                                    : `${t.total_per_cycle}d`}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {t.requires_document ? (
                                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                    <Paperclip size={10} />
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-300">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <ArrowRight
                                  size={14}
                                  className={`transition ${isSelected ? "text-violet-500" : "text-gray-300"}`}
                                />
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

      {selectedApp && !reviewModal && (
        <AppDetailPanel
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={(app) => {
            setSelectedApp(null);
            setReviewModal({ app, action: "approve" });
          }}
          onReject={(app) => {
            setSelectedApp(null);
            setReviewModal({ app, action: "reject" });
          }}
          addToast={addToast}
        />
      )}
      {selectedCycle && !cycleModal && (
        <CyclePanel
          cycle={selectedCycle}
          types={types}
          onClose={() => setSelectedCycle(null)}
          onEdit={(c) => {
            setSelectedCycle(null);
            setCycleModal(c);
          }}
          onDelete={deleteCycle}
          addToast={addToast}
        />
      )}
      {selectedType && !typeModal && (
        <TypePanel
          type={selectedType}
          cycles={cycles}
          apps={apps}
          onClose={() => setSelectedType(null)}
          onEdit={(t) => {
            setSelectedType(null);
            setTypeModal(t);
          }}
          onDelete={deleteType}
        />
      )}
      {reviewModal && (
        <ReviewModal
          app={reviewModal.app}
          action={reviewModal.action}
          onClose={() => setReviewModal(null)}
          onDone={() => {
            setReviewModal(null);
            loadAll();
          }}
          addToast={addToast}
        />
      )}
      {cycleModal && (
        <CycleModal
          cycle={cycleModal === "new" ? null : cycleModal}
          onClose={() => setCycleModal(null)}
          onDone={() => {
            setCycleModal(null);
            loadAll();
          }}
          addToast={addToast}
        />
      )}
      {typeModal && (
        <TypeModal
          type={typeModal === "new" ? null : typeModal}
          cycles={cycles}
          onClose={() => setTypeModal(null)}
          onDone={() => {
            setTypeModal(null);
            loadAll();
          }}
          addToast={addToast}
        />
      )}
    </section>
  );
}
