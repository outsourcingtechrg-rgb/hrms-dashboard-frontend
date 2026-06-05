/**
 * MyTickets.jsx — Employee Self-Service Ticket Portal
 *
 * Features:
 *  - Ticket list with search, filter by status/priority/category
 *  - Create ticket modal (subject, category, priority, summary, attachments)
 *  - Ticket detail drawer with comment thread + attachment download
 *  - Status timeline
 *  - Pagination
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Ticket,
  Plus,
  Search,
  X,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Download,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  MessageSquare,
  Tag,
  Zap,
  Filter,
  FileText,
  Eye,
  Calendar,
  User,
  Building2,
  Hash,
  ArrowUpRight,
  Circle,
  AlertCircle,
  CheckCheck,
  Inbox,
  Info,
} from "lucide-react";
import { API as TICKET_API } from "../../Components/Apis";

// ─── Font injection ───────────────────────────────────────────────────────────

const STYLES = `
  @keyframes tkFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tkFadeIn { from{opacity:0} to{opacity:1} }
  @keyframes tkSlide  { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
  @keyframes tkPop    { 0%{opacity:0;transform:scale(.94)} 100%{opacity:1;transform:scale(1)} }
  @keyframes tkSpin   { to{transform:rotate(360deg)} }
  .tk-fade-up { animation:tkFadeUp .3s cubic-bezier(.22,1,.36,1) both; }
  .tk-fade-in { animation:tkFadeIn .2s ease both; }
  .tk-slide   { animation:tkSlide .32s cubic-bezier(.22,1,.36,1) both; }
  .tk-pop     { animation:tkPop .22s cubic-bezier(.22,1,.36,1) both; }
  .tk-spin    { animation:tkSpin .8s linear infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("__tk_sty__")) {
  const s = document.createElement("style");
  s.id = "__tk_sty__";
  s.textContent = STYLES;
  document.head.appendChild(s);
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const tkToken = () => localStorage.getItem("access_token") || "";
const tkAuth = () => ({ Authorization: `Bearer ${tkToken()}` });
const tkJSON = () => ({ ...tkAuth(), "Content-Type": "application/json" });

const tkFetch = async (url, opts = {}) => {
  const res = await fetch(url, { headers: tkJSON(), ...opts });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(e.detail || "Request failed");
  }
  return res.json();
};

async function tkDownload(url, filename) {
  const res = await fetch(url, { headers: tkAuth() });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PRIORITY = {
  LOW: {
    label: "Low",
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  HIGH: {
    label: "High",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-300",
    dot: "bg-amber-500",
  },
  CRITICAL: {
    label: "Critical",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-300",
    dot: "bg-red-500",
  },
};

const STATUS = {
  OPEN: {
    label: "Open",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Circle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    icon: Zap,
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  CLOSED: {
    label: "Closed",
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    icon: CheckCheck,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
  },
};

const PAGE_SIZE = 10;
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtFull = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY.MEDIUM;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${p.color} ${p.bg} ${p.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
      {p.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.OPEN;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.color} ${s.bg} ${s.border}`}
    >
      <Icon size={10} strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[500] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white tk-pop
          ${t.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
        >
          {t.type === "success" ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertTriangle size={14} />
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Create Ticket Modal ──────────────────────────────────────────────────────
function CreateModal({ categories, onClose, onCreated, addToast }) {
  const [form, setForm] = useState({
    subject: "",
    category_id: "",
    priority: "MEDIUM",
    summary: "",
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deptFilter, setDeptFilter] = useState("All");
  const fileRef = useRef(null);

  const selectedCat = categories.find(
    (c) => String(c.id) === String(form.category_id),
  );

  const deptOptions = useMemo(() => {
    const set_ = new Set();
    (categories || []).forEach((c) =>
      set_.add(c.department_name || c.department || "Unassigned"),
    );
    return ["All", ...Array.from(set_)];
  }, [categories]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const addFiles = (incoming) => {
    const arr = Array.from(incoming);
    setFiles((p) => {
      const ex = new Set(p.map((f) => f.name + f.size));
      return [...p, ...arr.filter((f) => !ex.has(f.name + f.size))];
    });
  };

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = "Required";
    if (!form.category_id) e.category_id = "Select a category";
    if (!form.summary.trim()) e.summary = "Please describe the issue";
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
      const ticket = await tkFetch(TICKET_API.create(), {
        method: "POST",
        body: JSON.stringify({
          ...form,
          category_id: Number(form.category_id),
        }),
      });
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        await fetch(TICKET_API.uploadAtt(ticket.id), {
          method: "POST",
          headers: tkAuth(),
          body: fd,
        });
      }
      addToast("Ticket created successfully!", "success");
      onCreated(ticket);
      onClose();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inp =
    "w-full border rounded-xl px-3.5 py-2.5 text-sm bg-zinc-50 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 transition placeholder-zinc-400";

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm tk-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[92vh] flex flex-col overflow-hidden tk-pop">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-950">
          <div>
            <h2 className="tk-serif text-white text-lg">Raise a Ticket</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Describe your issue and we'll route it automatically
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Category + Department pills */}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap mb-3">
              {deptOptions.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeptFilter(d)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    deptFilter === d
                      ? "bg-zinc-950 text-white"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <label className="block text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
              Category *
            </label>
            <select
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              className={`${inp} ${errors.category_id ? "border-red-300" : "border-zinc-200"}`}
            >
              <option value="">Select category…</option>
              {(categories || [])
                .filter(
                  (c) =>
                    deptFilter === "All" ||
                    (c.department_name || c.department || "Unassigned") ===
                      deptFilter,
                )
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name +
                      " - " +
                      (c.department_name || c.department || "Unassigned")}
                  </option>
                ))}
            </select>
            {selectedCat?.description && (
              <p className="text-[11px] text-zinc-400 mt-1.5 flex items-start gap-1.5">
                <Info size={11} className="mt-0.5 flex-shrink-0" />
                {selectedCat.description}
              </p>
            )}
            {errors.category_id && (
              <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
              Subject *
            </label>
            <input
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Brief description of the issue…"
              className={`${inp} ${errors.subject ? "border-red-300" : "border-zinc-200"}`}
            />
            {errors.subject && (
              <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(PRIORITY).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("priority", key)}
                  className={`py-2 rounded-xl border text-xs font-semibold transition ${
                    form.priority === key
                      ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-300 bg-zinc-50"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
              Description *
            </label>
            <textarea
              rows={4}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="Provide full details of the issue — what happened, when, and any steps to reproduce…"
              className={`${inp} resize-none leading-relaxed ${errors.summary ? "border-red-300" : "border-zinc-200"}`}
            />
            {errors.summary && (
              <p className="text-red-500 text-xs mt-1">{errors.summary}</p>
            )}
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
              Attachments
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-zinc-200 rounded-xl px-4 py-4 flex flex-col items-center gap-2 cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition"
            >
              <Paperclip size={18} className="text-zinc-400" />
              <p className="text-sm text-zinc-500">
                <span className="font-semibold text-zinc-700">
                  Click to upload
                </span>{" "}
                or drag & drop
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText
                        size={12}
                        className="text-zinc-400 flex-shrink-0"
                      />
                      <span className="text-xs text-zinc-700 truncate">
                        {f.name}
                      </span>
                      <span className="text-xs text-zinc-400 flex-shrink-0">
                        ({(f.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setFiles((p) => p.filter((_, j) => j !== i))
                      }
                      className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-red-500 transition ml-2"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-3 bg-zinc-50">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="tk-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Ticket size={13} />
                Submit Ticket
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 border border-zinc-200 text-zinc-600 text-sm font-medium rounded-xl hover:bg-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Detail Drawer ─────────────────────────────────────────────────────
function DetailDrawer({ ticketId, onClose, onUpdated, addToast }) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [atts, setAtts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, attsData] = await Promise.all([
        tkFetch(TICKET_API.detail(ticketId)),
        tkFetch(TICKET_API.attachments(ticketId)),
      ]);
      setTicket(t);
      setComments(t.comments || []);
      setAtts(attsData);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const c = await tkFetch(TICKET_API.comment(ticketId), {
        method: "POST",
        body: JSON.stringify({ content: comment.trim() }),
      });
      setComments((p) => [...p, c]);
      setComment("");
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setSending(false);
    }
  };

  const cancelTicket = async () => {
    if (!confirm("Cancel this ticket?")) return;
    setCancelling(true);
    try {
      await tkFetch(TICKET_API.cancel(ticketId), { method: "POST" });
      addToast("Ticket cancelled", "success");
      onUpdated();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setCancelling(false);
    }
  };

  const handleDownload = async (att) => {
    setDownloading(att.id);
    try {
      await tkDownload(TICKET_API.downloadAtt(att.id), att.file_name);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm tk-fade-in"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 z-[201] w-full sm:w-[500px] bg-white shadow-2xl flex flex-col tk-slide">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-950 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {ticket && (
              <div className="flex items-center gap-2 mb-1.5">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            )}
            <h2 className="tk-serif text-white text-base leading-snug truncate">
              {ticket ? ticket.subject : "Loading…"}
            </h2>
            {ticket && (
              <p className="text-xs text-zinc-400 mt-1">
                #{ticket.id} · {ticket.category_name || "—"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition mt-0.5"
          >
            <X size={15} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="tk-spin text-zinc-300" />
          </div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto">
            {/* Meta grid */}
            <div className="px-6 py-4 border-b border-zinc-100">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Submitted", value: fmt(ticket.created_at) },
                  { label: "Last Update", value: fmt(ticket.updated_at) },
                  { label: "Category", value: ticket.category_name || "—" },
                  {
                    label: "Assigned To",
                    value: ticket.assigned_to_name || "Unassigned",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-zinc-50 rounded-xl p-3 border border-zinc-100"
                  >
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mb-1">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-zinc-800">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="px-6 py-4 border-b border-zinc-100">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-2">
                Description
              </p>
              <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                {ticket.summary}
              </p>
            </div>

            {/* Attachments */}
            {atts.length > 0 && (
              <div className="px-6 py-4 border-b border-zinc-100">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-3">
                  Attachments ({atts.length})
                </p>
                <div className="space-y-2">
                  {atts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip
                          size={12}
                          className="text-zinc-400 flex-shrink-0"
                        />
                        <span className="text-sm text-zinc-700 truncate">
                          {a.file_name}
                        </span>
                        {a.file_size && (
                          <span className="text-xs text-zinc-400 flex-shrink-0">
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
                          <Loader2 size={11} className="tk-spin" />
                        ) : (
                          <Download size={11} />
                        )}
                        {downloading === a.id ? "…" : "Download"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="px-6 py-4">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mb-3">
                Comments ({comments.length})
              </p>
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare
                    size={24}
                    className="mx-auto mb-2 text-zinc-200"
                  />
                  <p className="text-xs text-zinc-400">No comments yet</p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {comments.map((c, i) => (
                    <div
                      key={c.id || i}
                      className={`rounded-2xl p-3.5 ${c.is_hr ? "bg-violet-50 border border-violet-100" : "bg-zinc-50 border border-zinc-100"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0
                          ${c.is_hr ? "bg-violet-600" : "bg-zinc-600"}`}
                        >
                          {(c.author_name || "U")[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-zinc-700">
                          {c.author_name || "User"}
                        </span>
                        {c.is_hr && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                            HR
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400 ml-auto">
                          {fmtFull(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-700 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment input */}
              {ticket.status !== "CLOSED" && ticket.status !== "CANCELLED" && (
                <div className="flex gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendComment()
                    }
                    placeholder="Add a comment…"
                    className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-zinc-50 outline-none focus:border-zinc-400 transition placeholder-zinc-400"
                  />
                  <button
                    onClick={sendComment}
                    disabled={sending || !comment.trim()}
                    className="w-10 h-10 flex items-center justify-center bg-zinc-950 hover:bg-zinc-800 disabled:opacity-40 rounded-xl transition flex-shrink-0"
                  >
                    {sending ? (
                      <Loader2 size={14} className="tk-spin text-white" />
                    ) : (
                      <Send size={14} className="text-white" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        {ticket && ticket.status === "OPEN" && (
          <div className="px-6 py-4 border-t border-zinc-100">
            <button
              onClick={cancelTicket}
              disabled={cancelling}
              className="w-full py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 size={13} className="tk-spin" />
              ) : (
                <XCircle size={13} />
              )}
              Cancel Ticket
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ═══ MAIN PAGE ════════════════════════════════════════════════════════════════
export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [priorityFilter, setPriority] = useState("All");
  const [categoryFilter, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        tkFetch(TICKET_API.list()),
        tkFetch(TICKET_API.categories()).catch(() => []),
      ]);
      setTickets(Array.isArray(t) ? t : t.items || []);
      setCategories(Array.isArray(c) ? c : []);
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
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tickets
      .filter((t) => statusFilter === "All" || t.status === statusFilter)
      .filter((t) => priorityFilter === "All" || t.priority === priorityFilter)
      .filter(
        (t) => categoryFilter === "All" || t.category_name === categoryFilter,
      )
      .filter(
        (t) =>
          !q ||
          (t.subject || "").toLowerCase().includes(q) ||
          (t.category_name || "").toLowerCase().includes(q) ||
          String(t.id).includes(q),
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === "OPEN").length,
      inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    }),
    [tickets],
  );

  const catOptions = useMemo(
    () => [...new Set(tickets.map((t) => t.category_name).filter(Boolean))],
    [tickets],
  );

  // Page numbers with ellipsis
  const pageNums = useMemo(() => {
    const nums = Array.from({ length: totalPages }, (_, i) => i + 1);
    return nums
      .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
      .reduce((acc, n, i, arr) => {
        if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
        acc.push(n);
        return acc;
      }, []);
  }, [totalPages, page]);

  if (loading)
    return (
      <div className="tk-root min-h-screen bg-zinc-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
        <Loader2
          size={28}
          className="tk-spin text-zinc-400 dark:text-slate-400"
        />
      </div>
    );

  return (
    <div className="tk-root min-h-screen bg-zinc-50 dark:bg-slate-950 transition-colors duration-200">
      <Toast toasts={toasts} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="tk-serif text-3xl text-zinc-900">My Tickets</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Track and manage your support requests
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={load}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-700 hover:border-zinc-300 transition"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <Plus size={15} />
              New Ticket
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            {
              label: "Open",
              value: counts.open,
              color: "from-blue-500 to-blue-700",
              textColor: "text-blue-50",
              sub: "text-blue-200",
            },
            {
              label: "In Progress",
              value: counts.inProgress,
              color: "from-violet-500 to-violet-700",
              textColor: "text-violet-50",
              sub: "text-violet-200",
            },
            {
              label: "Resolved",
              value: counts.resolved,
              color: "from-emerald-500 to-teal-600",
              textColor: "text-emerald-50",
              sub: "text-emerald-200",
            },
          ].map(({ label, value, color, textColor, sub }) => (
            <div
              key={label}
              className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white shadow-sm`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-widest ${sub}`}
              >
                {label}
              </p>
              <p className={`tk-serif text-4xl mt-2 ${textColor}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-44">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
                className="w-full pl-8 pr-3 py-2 border border-zinc-200 rounded-xl text-sm bg-zinc-50 outline-none focus:border-zinc-400 transition placeholder-zinc-400"
              />
            </div>

            {[
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatus,
                opts: [
                  ["All", "All Status"],
                  ...Object.entries(STATUS).map(([k, v]) => [k, v.label]),
                ],
              },
              {
                label: "Priority",
                value: priorityFilter,
                onChange: setPriority,
                opts: [
                  ["All", "All Priority"],
                  ...Object.entries(PRIORITY).map(([k, v]) => [k, v.label]),
                ],
              },
              {
                label: "Category",
                value: categoryFilter,
                onChange: setCategory,
                opts: [
                  ["All", "All Categories"],
                  ...catOptions.map((n) => [n, n]),
                ],
              },
            ].map(({ label, value, onChange, opts }) => (
              <div key={label} className="relative">
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-zinc-200 rounded-xl text-sm text-zinc-600 bg-white outline-none focus:border-zinc-400 transition cursor-pointer"
                >
                  {opts.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
              </div>
            ))}

            {(search ||
              statusFilter !== "All" ||
              priorityFilter !== "All" ||
              categoryFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatus("All");
                  setPriority("All");
                  setCategory("All");
                }}
                className="flex items-center gap-1 px-2.5 py-2 text-xs text-zinc-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition"
              >
                <X size={11} />
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-zinc-400">
              {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table */}
          {paged.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Inbox size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-800 mb-1">
                No tickets found
              </h3>
              <p className="text-sm text-zinc-500">
                {search || statusFilter !== "All"
                  ? "Try adjusting your filters."
                  : "Submit your first ticket to get started."}
              </p>
              {!search && statusFilter === "All" && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-950 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition"
                >
                  <Plus size={14} />
                  New Ticket
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/60">
                    {[
                      "#",
                      "Subject",
                      "Category",
                      "Priority",
                      "Status",
                      "Created",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[11px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {paged.map((t, i) => (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-50 transition group tk-fade-up cursor-pointer"
                      style={{ animationDelay: `${i * 25}ms` }}
                      onClick={() => setDetailId(t.id)}
                    >
                      <td className="px-5 py-4 text-xs text-zinc-400 font-mono">
                        #{t.id}
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-sm font-semibold text-zinc-800 truncate">
                          {t.subject}
                        </p>
                        {t.summary && (
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {t.summary.slice(0, 60)}…
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg">
                          {t.category_name || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-400 whitespace-nowrap">
                        {fmt(t.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-zinc-700 transition">
                          <Eye size={12} />
                          View
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100">
              <span className="text-xs text-zinc-400">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:border-zinc-400 disabled:opacity-40 transition"
                >
                  <ChevronLeft size={14} />
                </button>
                {pageNums.map((n, i) =>
                  n === "..." ? (
                    <span
                      key={`el-${i}`}
                      className="w-8 h-8 flex items-center justify-center text-xs text-zinc-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition
                        ${page === n ? "bg-zinc-950 text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:border-zinc-400 disabled:opacity-40 transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            load();
          }}
          addToast={addToast}
        />
      )}
      {detailId && (
        <DetailDrawer
          ticketId={detailId}
          onClose={() => setDetailId(null)}
          onUpdated={() => {
            setDetailId(null);
            load();
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
