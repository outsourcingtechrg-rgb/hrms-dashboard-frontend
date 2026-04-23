import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Plus, X, Loader2, Info, ChevronDown,
  Clock, CheckCircle2, XCircle, Ban, FileText,
  Download, Paperclip, AlertTriangle, RefreshCw,
} from "lucide-react";
import { API } from "../../Components/Apis";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Authenticated file download ───────────────────────────────────────────────
// <a href> cannot send Authorization headers, so we fetch the blob manually,
// create an object URL, click it programmatically, then revoke it.
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

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING:   { label: "Pending",   dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock        },
  APPROVED:  { label: "Approved",  dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  REJECTED:  { label: "Rejected",  dot: "bg-red-400",     text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: XCircle      },
  CANCELLED: { label: "Cancelled", dot: "bg-gray-400",    text: "text-gray-500",    bg: "bg-gray-50",    border: "border-gray-200",    icon: Ban          },
};

const TYPE_COLORS = [
  { icon: "bg-blue-100 text-blue-600"     },
  { icon: "bg-rose-100 text-rose-600"     },
  { icon: "bg-violet-100 text-violet-600" },
  { icon: "bg-emerald-100 text-emerald-600" },
  { icon: "bg-amber-100 text-amber-600"   },
  { icon: "bg-cyan-100 text-cyan-600"     },
];

// ─── Badge ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.PENDING;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.text} ${c.bg} ${c.border}`}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white
            ${t.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
        >
          {t.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Apply Modal ──────────────────────────────────────────────────────────────
function ApplyModal({ leaveTypes, onClose, onSuccess, addToast }) {
  const [form, setForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    employee_note: "",
  });
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [files, setFiles]     = useState([]);
  const fileInputRef           = React.useRef(null);

  const selectedType = leaveTypes.find((t) => String(t.id) === String(form.leave_type_id));
  const requiresDoc  = selectedType?.requires_document ?? false;
  const allowedExts  = selectedType?.allowed_file_types || "pdf,jpg,png,doc,docx";

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const addFiles = (incoming) => {
    const arr = Array.from(incoming);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...arr.filter((f) => !existing.has(f.name + f.size))];
    });
    setErrors((p) => ({ ...p, files: "" }));
  };

  const removeFile = (idx) => setFiles((p) => p.filter((_, i) => i !== idx));

  const validate = () => {
    const e = {};
    if (!form.leave_type_id) e.leave_type_id = "Select a leave type";
    if (!form.start_date)    e.start_date    = "Start date is required";
    if (!form.end_date)      e.end_date      = "End date is required";
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      e.end_date = "End date must be after start date";
    if (requiresDoc && files.length === 0)
      e.files = "This leave type requires at least one supporting document";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      // Step 1 — create the application
      const created = await apiFetch(API.ApplyLeave(), {
        method: "POST",
        body: JSON.stringify({
          leave_type_id: Number(form.leave_type_id),
          start_date:    form.start_date,
          end_date:      form.end_date,
          employee_note: form.employee_note || undefined,
        }),
      });

      // Step 2 — upload attachments (sequential so errors are attributable)
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(API.UploadAttachment(created.id), {
          method:  "POST",
          headers: authHeaders(),   // no Content-Type – browser sets multipart boundary
          body:    fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(err.detail || `Upload failed: ${file.name}`);
        }
      }

      addToast("Leave application submitted!", "success");
      onSuccess();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inp =
    "w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <CalendarDays size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Apply for Leave</h2>
              <p className="text-xs text-gray-400">Submit a new leave request</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-50">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Leave Type */}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">Leave Type *</label>
            <select value={form.leave_type_id} onChange={(e) => set("leave_type_id", e.target.value)}
              className={`${inp} ${errors.leave_type_id ? "border-red-300" : "border-gray-200"}`}>
              <option value="">Select leave type…</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.is_paid ? "" : " (Unpaid)"}
                </option>
              ))}
            </select>
            {errors.leave_type_id && <p className="text-xs text-red-500 mt-1">{errors.leave_type_id}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">Start Date *</label>
              <input type="date" value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className={`${inp} ${errors.start_date ? "border-red-300" : "border-gray-200"}`} />
              {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">End Date *</label>
              <input type="date" min={form.start_date || undefined} value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
                className={`${inp} ${errors.end_date ? "border-red-300" : "border-gray-200"}`} />
              {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">Note (optional)</label>
            <textarea rows={3} value={form.employee_note}
              onChange={(e) => set("employee_note", e.target.value)}
              placeholder="Any additional context for HR…"
              className={`${inp} border-gray-200 resize-none leading-relaxed`} />
          </div>

          {/* Attachments */}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 flex items-center gap-1.5">
              Attachments
              {requiresDoc && <span className="text-red-500">*</span>}
              {requiresDoc && (
                <span className="normal-case font-normal text-gray-400">(required for this leave type)</span>
              )}
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-xl px-4 py-5 flex flex-col items-center gap-2 cursor-pointer transition
                ${errors.files
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"}`}
            >
              <Paperclip size={20} className={errors.files ? "text-red-400" : "text-gray-400"} />
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-blue-600">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-gray-400">Allowed: {allowedExts}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={allowedExts.split(",").map((e) => `.${e.trim()}`).join(",")}
              onChange={(e) => addFiles(e.target.files)}
            />
            {errors.files && <p className="text-xs text-red-500 mt-1">{errors.files}</p>}

            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={13} className="text-blue-500 flex-shrink-0" />
                      <span className="text-xs text-gray-700 truncate">{f.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button onClick={() => removeFile(i)}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 transition flex-shrink-0 ml-2">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Info size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Your request will be reviewed by HR. You'll receive a notification once a decision is made.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2">
            {saving
              ? <><Loader2 size={13} className="animate-spin" /> Submitting…</>
              : <><CalendarDays size={13} /> Submit Request</>}
          </button>
          <button onClick={onClose} disabled={saving}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-xl transition disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ appId, onClose, onCancel, addToast }) {
  const [app, setApp]             = useState(null);
  const [atts, setAtts]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(null); // attachment id being downloaded

  useEffect(() => {
    if (!appId) return;
    setLoading(true);
    Promise.all([
      apiFetch(API.ApplicationById(appId)),
      apiFetch(API.GetApplicationAttachments(appId)),
    ])
      .then(([a, at]) => { setApp(a); setAtts(at); })
      .catch((e) => addToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [appId]);

  const cancel = async () => {
    if (!confirm("Cancel this leave application?")) return;
    setCancelling(true);
    try {
      await apiFetch(API.CancelApplication(appId), { method: "POST" });
      addToast("Application cancelled", "success");
      onCancel();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setCancelling(false);
    }
  };

  // Authenticated download — fetches blob with Bearer token, triggers save-as dialog
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

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg mx-0 sm:mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Application Details</h2>
              <p className="text-xs text-gray-400">#{appId}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : app ? (
            <div className="space-y-5">
              {/* Status + cancel */}
              <div className="flex items-center justify-between">
                <StatusBadge status={app.status} />
                {app.status === "PENDING" && (
                  <button onClick={cancel} disabled={cancelling}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-100 transition disabled:opacity-50">
                    {cancelling ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                    Cancel Request
                  </button>
                )}
              </div>

              {/* Info grid */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                {[
                  ["Leave Type", app.leave_type?.name || "-"],
                  ["Duration",   `${fmt(app.start_date)} – ${fmt(app.end_date)}`],
                  ["Days",       `${app.requested_days} day${app.requested_days !== 1 ? "s" : ""}`],
                  ["Applied On", fmt(app.requested_at)],
                  ...(app.reviewed_at ? [["Reviewed On", fmt(app.reviewed_at)]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">{k}</span>
                    <span className="text-sm font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {app.employee_note && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Your Note</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{app.employee_note}</p>
                </div>
              )}
              {app.hr_note && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">HR Note</p>
                  <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed">{app.hr_note}</p>
                </div>
              )}

              {/* Attachments */}
              {atts.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
                    Attachments ({atts.length})
                  </p>
                  <div className="space-y-2">
                    {atts.map((a) => (
                      <div key={a.id}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{a.file_name}</span>
                          {a.file_size && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              ({(a.file_size / 1024).toFixed(0)} KB)
                            </span>
                          )}
                        </div>

                        {/* ── Authenticated download button ── */}
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── My Leaves Page ───────────────────────────────────────────────────────────
export default function MyLeaves() {
  const [summary, setSummary]       = useState(null);
  const [apps, setApps]             = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [filter, setFilter]         = useState("All");
  const [loading, setLoading]       = useState(true);
  const [showApply, setShowApply]   = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [toasts, setToasts]         = useState([]);

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, appsData, typesData] = await Promise.all([
        apiFetch(API.GetMySummary()),
        apiFetch(API.GetMyApplications()),
        apiFetch(API.GetAllTypes()),
      ]);
      setSummary(sumData);
      setApps(appsData);
      setLeaveTypes(typesData);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const filtered =
    filter === "All" ? apps : apps.filter((a) => a.status === filter);

  const totalBalance =
    summary?.summaries?.reduce(
      (s, x) => (x.total_allocated > 0 ? s + x.remaining : s),
      0
    ) ?? 0;

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );

  return (
    <section className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Apply for leave and manage requests</p>
          </div>
          <button
            onClick={() => setShowApply(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2"
          >
            <Plus size={15} /> Apply for Leave
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <CalendarDays size={18} className="text-white" />
            </div>
            <p className="text-3xl font-bold">{totalBalance}</p>
            <p className="text-blue-100 text-sm mt-1">Total Leave Balance</p>
          </div>

          {(summary?.summaries || []).slice(0, 3).map((s, i) => {
            const col = TYPE_COLORS[i % TYPE_COLORS.length];
            return (
              <div key={s.leave_type_id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${col.icon}`}>
                  <CalendarDays size={16} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {s.remaining < 0 ? "∞" : s.remaining}
                </p>
                <p className="text-sm text-gray-500 mt-1">{s.leave_type_name}</p>
              </div>
            );
          })}
        </div>

        {/* Leave History Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">My Leave History</h2>
            <div className="flex items-center gap-2">
              <button onClick={load}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                <RefreshCw size={13} />
              </button>
              <div className="relative">
                <select value={filter} onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white outline-none focus:border-blue-400 transition cursor-pointer">
                  <option>All</option>
                  <option>PENDING</option>
                  <option>APPROVED</option>
                  <option>REJECTED</option>
                  <option>CANCELLED</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays size={24} className="text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No applications found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filter or submit a new leave request.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Leave Type", "Duration", "Days", "Applied On", "Status"].map((h) => (
                      <th key={h}
                        className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((app) => (
                    <tr key={app.id} onClick={() => setSelectedId(app.id)}
                      className="hover:bg-gray-50 cursor-pointer transition">
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-800">
                          {app.leave_type?.name || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {fmt(app.start_date)} – {fmt(app.end_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 font-medium">{app.requested_days}d</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{fmt(app.requested_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showApply && (
        <ApplyModal
          leaveTypes={leaveTypes}
          onClose={() => setShowApply(false)}
          onSuccess={() => { setShowApply(false); load(); }}
          addToast={addToast}
        />
      )}
      {selectedId && (
        <DetailDrawer
          appId={selectedId}
          onClose={() => setSelectedId(null)}
          onCancel={() => { setSelectedId(null); load(); }}
          addToast={addToast}
        />
      )}
    </section>
  );
}