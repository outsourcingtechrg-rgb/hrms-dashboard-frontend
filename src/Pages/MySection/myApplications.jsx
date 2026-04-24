import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  X,
  Loader2,
  Info,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  FileText,
  Download,
  Paperclip,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API } from "../../Components/Apis";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem("access_token") || "";
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });
const jsonHeaders = () => ({
  ...authHeaders(),
  "Content-Type": "application/json",
});

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

// Read gender from JWT payload
function getMyGender() {
  try {
    const t = token();
    if (!t) return null;
    const payload = JSON.parse(atob(t.split(".")[1]));
    return (payload.gender || "").toUpperCase() || null;
  } catch {
    return null;
  }
}

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING: {
    label: "Pending",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    text: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: Ban,
  },
};

const ACCENTS = [
  { grad: "from-blue-500 to-blue-700", light: "bg-blue-50 text-blue-600" },
  { grad: "from-rose-500 to-rose-700", light: "bg-rose-50 text-rose-600" },
  {
    grad: "from-violet-500 to-violet-700",
    light: "bg-violet-50 text-violet-600",
  },
  {
    grad: "from-emerald-500 to-teal-600",
    light: "bg-emerald-50 text-emerald-600",
  },
  { grad: "from-amber-500 to-orange-600", light: "bg-amber-50 text-amber-600" },
  { grad: "from-cyan-500 to-sky-600", light: "bg-cyan-50 text-cyan-600" },
  {
    grad: "from-fuchsia-500 to-pink-600",
    light: "bg-fuchsia-50 text-fuchsia-600",
  },
  { grad: "from-lime-500 to-green-600", light: "bg-lime-50 text-lime-600" },
];

const PAGE_SIZE = 10;

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.PENDING;
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.text} ${c.bg} ${c.border}`}
    >
      <Icon size={11} />
      {c.label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-500 flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-medium pointer-events-none em-fi">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white
          ${t.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
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

// ─── BalanceWidget ────────────────────────────────────────────────────────────
// total_allocated === 0  →  unlimited
function BalanceWidget({ summary, idx }) {
  const acc = ACCENTS[idx % ACCENTS.length];
  const unlimited = summary.total_allocated === 0;
  const taken = summary.total_taken || 0;
  const pending = summary.total_pending || 0;
  const remaining = summary.remaining;
  const pctTaken = unlimited
    ? 0
    : summary.total_allocated > 0
      ? Math.min(100, (taken / summary.total_allocated) * 100)
      : 0;
  const pctPending = unlimited
    ? 0
    : summary.total_allocated > 0
      ? Math.min(100, (pending / summary.total_allocated) * 100)
      : 0;
  const low =
    !unlimited &&
    remaining !== null &&
    remaining >= 0 &&
    remaining <= Math.max(1, Math.floor((summary.total_allocated || 1) * 0.2));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className={`h-1.5 bg-linear-to-r ${acc.grad}`} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${acc.light}`}
          >
            <CalendarDays size={16} />
          </div>
          {unlimited && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              Unlimited
            </span>
          )}
          {!unlimited && low && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
              Low
            </span>
          )}
        </div>

        <p
          className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1 truncate"
          title={summary.leave_type_name}
        >
          {summary.leave_type_name}
        </p>

        {/* Big number */}
        <div className="mb-3">
          {unlimited ? (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-indigo-600">∞</span>
              <span className="text-xs text-gray-400">days</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span
                className={`text-3xl font-black ${low ? "text-red-600" : "text-gray-900"}`}
              >
                {remaining}
              </span>
              <span className="text-xs text-gray-400">
                / {summary.total_allocated}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!unlimited && (
          <>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="h-full flex">
                <div
                  className={`h-full bg-linear-to-r ${acc.grad} transition-all`}
                  style={{ width: `${pctTaken}%` }}
                />
                <div
                  className="h-full bg-amber-300 transition-all"
                  style={{ width: `${pctPending}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              {taken} used{pending > 0 ? ` · ${pending} pending` : ""}
            </p>
          </>
        )}

        {unlimited && (
          <p className="text-[11px] text-gray-400 mt-auto">
            {taken > 0 ? `${taken} used` : "No usage yet"}
            {pending > 0 ? ` · ${pending} pending` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Apply Modal ──────────────────────────────────────────────────────────────
function ApplyModal({ leaveTypes, summary, onClose, onSuccess, addToast }) {
  const myGender = useMemo(() => getMyGender(), []);

  // Only show leave types the employee is eligible for based on gender
  const eligibleTypes = useMemo(
    () =>
      leaveTypes.filter((t) => {
        const gs = (t.gender_specific || "ALL").toUpperCase();
        if (gs === "ALL") return true;
        if (!myGender) return true; // unknown gender — show all
        return gs === myGender;
      }),
    [leaveTypes, myGender],
  );

  const [form, setForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    employee_note: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = React.useRef(null);

  const selectedType = eligibleTypes.find(
    (t) => String(t.id) === String(form.leave_type_id),
  );
  const requiresDoc = selectedType?.requires_document ?? false;
  const allowedExts =
    selectedType?.allowed_file_types || "pdf,jpg,png,doc,docx";
  const selectedSummary = summary?.summaries?.find(
    (s) => String(s.leave_type_id) === String(form.leave_type_id),
  );
  const unlimited = selectedSummary
    ? selectedSummary.total_allocated === 0
    : selectedType?.total_per_cycle === 0;
  const balance = selectedSummary
    ? selectedSummary.remaining
    : selectedType?.total_per_cycle || 0;

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
    if (!form.start_date) e.start_date = "Start date is required";
    if (!form.end_date) e.end_date = "End date is required";
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      e.end_date = "End date must be after start date";
    if (requiresDoc && files.length === 0)
      e.files = "This leave type requires at least one supporting document";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      const created = await apiFetch(API.ApplyLeave(), {
        method: "POST",
        body: JSON.stringify({
          leave_type_id: Number(form.leave_type_id),
          start_date: form.start_date,
          end_date: form.end_date,
          employee_note: form.employee_note || undefined,
        }),
      });
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(API.UploadAttachment(created.id), {
          method: "POST",
          headers: authHeaders(),
          body: fd,
        });
        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ detail: res.statusText }));
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
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center">
              <CalendarDays size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">
                Apply for Leave
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Leave Type */}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
              Leave Type *
            </label>
            <select
              value={form.leave_type_id}
              onChange={(e) => set("leave_type_id", e.target.value)}
              className={`${inp} ${errors.leave_type_id ? "border-red-300" : "border-gray-200"}`}
            >
              <option value="">Select leave type…</option>
              {eligibleTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {!t.is_paid ? " (Unpaid)" : ""}
                  {t.total_per_cycle === 0
                    ? " · Unlimited"
                    : ` · ${t.total_per_cycle} days/cycle`}
                </option>
              ))}
            </select>
            {errors.leave_type_id && (
              <p className="text-xs text-red-500 mt-1">
                {errors.leave_type_id}
              </p>
            )}
          </div>

          {/* Balance preview */}
          {form.leave_type_id && (
            <div
              className={`rounded-xl p-3.5 border flex items-center justify-between
              ${unlimited ? "bg-indigo-50 border-indigo-200" : balance <= 0 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}
            >
              <div>
                <p
                  className={`text-xs font-semibold ${unlimited ? "text-indigo-700" : balance <= 0 ? "text-red-700" : "text-blue-700"}`}
                >
                  {selectedType?.name} Balance
                </p>
                {selectedSummary && !unlimited && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedSummary.total_taken} used ·{" "}
                    {selectedSummary.total_pending} pending
                  </p>
                )}
              </div>
              <div
                className={`text-2xl font-black ${unlimited ? "text-indigo-600" : balance <= 0 ? "text-red-600" : "text-blue-600"}`}
              >
                {unlimited ? "∞" : balance}
                <span className="text-xs font-normal ml-1">
                  {unlimited ? "unlimited" : "left"}
                </span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                Start Date *
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className={`${inp} ${errors.start_date ? "border-red-300" : "border-gray-200"}`}
              />
              {errors.start_date && (
                <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                End Date *
              </label>
              <input
                type="date"
                min={form.start_date || undefined}
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
                className={`${inp} ${errors.end_date ? "border-red-300" : "border-gray-200"}`}
              />
              {errors.end_date && (
                <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
              Note (optional)
            </label>
            <textarea
              rows={3}
              value={form.employee_note}
              onChange={(e) => set("employee_note", e.target.value)}
              placeholder="Any additional context for HR…"
              className={`${inp} border-gray-200 resize-none leading-relaxed`}
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 flex items-center gap-1.5">
              Attachments
              {requiresDoc && <span className="text-red-500">*</span>}
              {requiresDoc && (
                <span className="normal-case font-normal text-gray-400">
                  (required for this leave type)
                </span>
              )}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-xl px-4 py-5 flex flex-col items-center gap-2 cursor-pointer transition
                ${errors.files ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"}`}
            >
              <Paperclip
                size={20}
                className={errors.files ? "text-red-400" : "text-gray-400"}
              />
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-blue-600">
                  Click to upload
                </span>{" "}
                or drag & drop
              </p>
              <p className="text-xs text-gray-400">Allowed: {allowedExts}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={allowedExts
                .split(",")
                .map((e) => `.${e.trim()}`)
                .join(",")}
              onChange={(e) => addFiles(e.target.files)}
            />
            {errors.files && (
              <p className="text-xs text-red-500 mt-1">{errors.files}</p>
            )}
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText
                        size={13}
                        className="text-blue-500 shrink-0"
                      />
                      <span className="text-xs text-gray-700 truncate">
                        {f.name}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        ({(f.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 transition shrink-0 ml-2"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Info size={13} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Your request will be reviewed by HR. Only eligible leave types
              based on your gender are shown.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <CalendarDays size={13} /> Submit Request
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-xl transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ appId, onClose, onCancel, addToast }) {
  const [app, setApp] = useState(null);
  const [atts, setAtts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!appId) return;
    setLoading(true);
    Promise.all([
      apiFetch(API.GetApplication(appId)),
      apiFetch(API.GetApplicationAttachments(appId)),
    ])
      .then(([a, at]) => {
        setApp(a);
        setAtts(at);
      })
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
    <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg mx-0 sm:mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-slate-50 to-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">
                Application Details
              </h2>
              <p className="text-xs text-gray-400">#{appId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : app ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <StatusBadge status={app.status} />
                {app.status === "PENDING" && (
                  <button
                    onClick={cancel}
                    disabled={cancelling}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-100 transition disabled:opacity-50"
                  >
                    {cancelling ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <X size={11} />
                    )}
                    Cancel Request
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                {[
                  ["Leave Type", app.leave_type?.name || "-"],
                  ["Duration", `${fmt(app.start_date)} – ${fmt(app.end_date)}`],
                  [
                    "Days",
                    `${app.requested_days} day${app.requested_days !== 1 ? "s" : ""}`,
                  ],
                  ["Applied On", fmt(app.requested_at)],
                  ...(app.reviewed_at
                    ? [["Reviewed On", fmt(app.reviewed_at)]]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">
                      {k}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              {app.employee_note && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
                    Your Note
                  </p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
                    {app.employee_note}
                  </p>
                </div>
              )}
              {app.hr_note && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
                    HR Note
                  </p>
                  <p
                    className={`text-sm rounded-xl p-3 leading-relaxed border
                    ${app.status === "REJECTED" ? "bg-red-50 border-red-100 text-red-700" : "bg-amber-50 border-amber-100 text-amber-800"}`}
                  >
                    {app.hr_note}
                  </p>
                </div>
              )}

              {atts.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
                    Attachments ({atts.length})
                  </p>
                  <div className="space-y-2">
                    {atts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip
                            size={13}
                            className="text-gray-400 shrink-0"
                          />
                          <span className="text-sm text-gray-700 truncate">
                            {a.file_name}
                          </span>
                          {a.file_size && (
                            <span className="text-xs text-gray-400 shrink-0">
                              ({(a.file_size / 1024).toFixed(0)} KB)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDownload(a)}
                          disabled={downloading === a.id}
                          className="flex items-center gap-1 text-blue-600 text-xs font-semibold hover:underline ml-2 disabled:opacity-50 transition"
                        >
                          {downloading === a.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Download size={11} />
                          )}
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

// ═══════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════
export default function MyLeaves() {
  const [summary, setSummary] = useState(null);
  const [apps, setApps] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showApply, setShowApply] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [toasts, setToasts] = useState([]);

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
        apiFetch(API.GetAllTypesEmployees()),
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

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, search]);

  // Leave type names derived from actual applications (for filter dropdown)
  const typeOptions = useMemo(() => {
    const names = [
      ...new Set(apps.map((a) => a.leave_type?.name).filter(Boolean)),
    ];
    return names;
  }, [apps]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return apps
      .filter((a) => statusFilter === "All" || a.status === statusFilter)
      .filter((a) => typeFilter === "All" || a.leave_type?.name === typeFilter)
      .filter(
        (a) =>
          !q ||
          (a.leave_type?.name || "").toLowerCase().includes(q) ||
          (a.employee_note || "").toLowerCase().includes(q) ||
          String(a.id).includes(q),
      )
      .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
  }, [apps, statusFilter, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summaries = summary?.summaries || [];
  const totalBalance = summaries.reduce(
    (s, x) => (x.total_allocated > 0 ? s + x.remaining : s),
    0,
  );
  const hasUnlimited = summaries.some((s) => s.total_allocated === 0);

  // Page number list with ellipsis
  const pageNumbers = useMemo(() => {
    const nums = Array.from({ length: totalPages }, (_, i) => i + 1);
    return nums
      .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
      .reduce((acc, n, idx, arr) => {
        if (idx > 0 && n - arr[idx - 1] > 1) acc.push("...");
        acc.push(n);
        return acc;
      }, []);
  }, [totalPages, page]);

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
            <h1 className="text-2xl font-bold text-gray-900">My Leaves</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {summary?.cycle_name && (
                <span className="font-medium text-blue-600">
                  {summary.cycle_name} ·{" "}
                </span>
              )}
              Apply for leave and track your requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-blue-600 hover:border-blue-300 transition"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setShowApply(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Plus size={15} /> Apply for Leave
            </button>
          </div>
        </div>

        {/* Hero summary */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white flex items-center justify-between shadow-lg shadow-blue-500/20">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">
              Available Balance
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{totalBalance}</span>
              <span className="text-blue-200 text-sm">days</span>
              {hasUnlimited && (
                <span className="text-blue-200 text-sm">+ ∞ unlimited</span>
              )}
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-blue-200 text-sm">
              {summaries.length} leave type{summaries.length !== 1 ? "s" : ""}
            </p>
            <p className="text-blue-100 text-sm font-medium">
              {apps.filter((a) => a.status === "PENDING").length} pending
            </p>
            <p className="text-blue-100 text-sm font-medium">
              {apps.filter((a) => a.status === "APPROVED").length} approved
            </p>
          </div>
        </div>

        {/* ── Balance widgets — one per leave type, all shown ── */}
        {summaries.length > 0 && (
          <div className="mb-7">
            <h2 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3">
              Leave Balances
            </h2>
            {/* Responsive grid — fits 2 on mobile, up to 5 on XL */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {summaries.map((s, i) => (
                <BalanceWidget key={s.leave_type_id} summary={s} idx={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Applications table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters row */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-base font-bold text-gray-900 mr-auto">
                My Leave History
              </h2>

              {/* Free-text search */}
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-blue-400 transition w-36 placeholder-gray-400"
                />
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white outline-none focus:border-blue-400 transition cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>

              {/* Leave type filter — built from actual application data */}
              {typeOptions.length > 1 && (
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white outline-none focus:border-blue-400 transition cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    {typeOptions.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              )}

              {/* Clear */}
              {(search || statusFilter !== "All" || typeFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                    setTypeFilter("All");
                  }}
                  className="flex items-center gap-1 px-2 py-2 text-xs text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition"
                >
                  <X size={11} />
                  Clear
                </button>
              )}

              <span className="text-xs text-gray-400">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Table body */}
          {paged.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays size={24} className="text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                No applications found
              </h3>
              <p className="text-sm text-gray-500">
                {search || statusFilter !== "All" || typeFilter !== "All"
                  ? "Try adjusting your filters."
                  : "Submit your first leave request to get started."}
              </p>
              {!search && statusFilter === "All" && typeFilter === "All" && (
                <button
                  onClick={() => setShowApply(true)}
                  className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition inline-flex items-center gap-2"
                >
                  <Plus size={14} />
                  Apply for Leave
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {[
                      "#",
                      "Leave Type",
                      "Duration",
                      "Days",
                      "Applied On",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.map((app, i) => (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedId(app.id)}
                      className="hover:bg-blue-50/30 cursor-pointer transition"
                    >
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">
                            {app.leave_type?.name || "—"}
                          </span>
                          {app.leave_type?.is_paid === false && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">
                              Unpaid
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                        {fmt(app.start_date)} – {fmt(app.end_date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-gray-700">
                          {app.requested_days}d
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {fmt(app.requested_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
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
                      className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition
                        ${
                          page === n
                            ? "bg-blue-600 text-white shadow-sm"
                            : "border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                        }`}
                    >
                      {n}
                    </button>
                  ),
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showApply && (
        <ApplyModal
          leaveTypes={leaveTypes}
          summary={summary}
          onClose={() => setShowApply(false)}
          onSuccess={() => {
            setShowApply(false);
            load();
          }}
          addToast={addToast}
        />
      )}
      {selectedId && (
        <DetailDrawer
          appId={selectedId}
          onClose={() => setSelectedId(null)}
          onCancel={() => {
            setSelectedId(null);
            load();
          }}
          addToast={addToast}
        />
      )}
    </section>
  );
}
