/**
 * AssignedTickets.jsx — "My Assigned Tickets" view
 * Dark / Light mode via globals.css CSS variables (at-* + tk-* classes)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ClipboardList, Search, X, Loader2, ChevronLeft, ChevronRight,
  Download, Paperclip, Send, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, MessageSquare, Zap, Eye, Circle, CheckCheck, Inbox,
  Building2,
} from "lucide-react";
import { API } from "../../Components/Apis";

// ─── Animations injected once ─────────────────────────────────────────────────
const STYLES = `
  @keyframes atFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes atFadeIn { from{opacity:0} to{opacity:1} }
  @keyframes atSlide  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
  @keyframes atPop    { 0%{opacity:0;transform:scale(.96)} 100%{opacity:1;transform:scale(1)} }
  @keyframes atSpin   { to{transform:rotate(360deg)} }
  .at-fade-up { animation:atFadeUp .28s cubic-bezier(.22,1,.36,1) both; }
  .at-fade-in { animation:atFadeIn .18s ease both; }
  .at-slide   { animation:atSlide  .3s  cubic-bezier(.22,1,.36,1) both; }
  .at-pop     { animation:atPop    .2s  cubic-bezier(.22,1,.36,1) both; }
  .at-spin    { animation:atSpin   .8s  linear infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("__at_sty__")) {
  const s = document.createElement("style");
  s.id = "__at_sty__"; s.textContent = STYLES;
  document.head.appendChild(s);
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const atToken = () => localStorage.getItem("access_token") || "";
const atAuth  = () => ({ Authorization: `Bearer ${atToken()}` });
const atJSON  = () => ({ ...atAuth(), "Content-Type": "application/json" });

const atFetch = async (url, opts = {}) => {
  const res = await fetch(url, { headers: atJSON(), ...opts });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(e.detail || "Request failed");
  }
  return res.json();
};

async function atDownload(url, filename) {
  const res = await fetch(url, { headers: atAuth() });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href; a.download = filename || "file";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(href);
}

// ─── Config ───────────────────────────────────────────────────────────────────
// Maps to CSS var classes defined in globals.css
const PRIORITY_CLS = {
  LOW:      { cls: "tk-p-low",  dot: "tk-dot-low",  label: "Low"      },
  MEDIUM:   { cls: "tk-p-med",  dot: "tk-dot-med",  label: "Medium"   },
  HIGH:     { cls: "tk-p-high", dot: "tk-dot-high", label: "High"     },
  CRITICAL: { cls: "tk-p-crit", dot: "tk-dot-crit", label: "Critical" },
};

const STATUS_CLS = {
  OPEN:        { cls: "tk-s-open", Icon: Circle,       label: "Open"        },
  IN_PROGRESS: { cls: "tk-s-prog", Icon: Zap,          label: "In Progress" },
  RESOLVED:    { cls: "tk-s-res",  Icon: CheckCircle2, label: "Resolved"    },
  CLOSED:      { cls: "tk-s-clos", Icon: CheckCheck,   label: "Closed"      },
  CANCELLED:   { cls: "tk-s-canc", Icon: XCircle,      label: "Cancelled"   },
};

const PAGE_SIZE = 12;
const fmt     = d => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtFull = d => d ? new Date(d).toLocaleString("en-GB",     { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const isAssignedToCurrentUser = (ticket, user) => {
  const id = user?.id ?? null;
  return sameId(ticket.assigned_to, id) || sameId(ticket.assignee_id, id) || sameId(ticket.assigned_to_id, id);
};

// ─── Shared badge components ──────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const p = PRIORITY_CLS[priority] || PRIORITY_CLS.MEDIUM;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${p.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
      {p.label}
    </span>
  );
}
function StatusBadge({ status }) {
  const s = STATUS_CLS[status] || STATUS_CLS.OPEN;
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      <Icon size={9} strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[500] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="at-pop flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white"
          style={{ background: t.type === "success" ? "var(--tk-toast-success)" : "var(--tk-toast-error)" }}>
          {t.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Assignee Sidebar ─────────────────────────────────────────────────────────
function AssigneeSidebar({ ticketId, onClose, onUpdated, addToast }) {
  const [ticket,    setTicket]    = useState(null);
  const [atts,      setAtts]      = useState([]);
  const [comments,  setComments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [comment,   setComment]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [resolving, setResolving] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, attsData] = await Promise.all([
        atFetch(API.detail(ticketId)),
        atFetch(API.mgmtAtts(ticketId)).catch(() => []),
      ]);
      setTicket(t); setComments(t.comments || []); setAtts(attsData);
    } catch (e) { addToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const c = await atFetch(API.comment(ticketId), {
        method: "POST", body: JSON.stringify({ content: comment.trim(), is_hr: true }),
      });
      setComments(p => [...p, c]); setComment("");
    } catch (e) { addToast(e.message, "error"); }
    finally { setSending(false); }
  };

  const resolveTicket = async () => {
    if (!confirm("Mark this ticket as resolved?")) return;
    setResolving(true);
    try {
      await atFetch(API.resolve(ticketId), { method: "POST" });
      addToast("Ticket marked as resolved", "success"); onUpdated();
    } catch (e) { addToast(e.message, "error"); }
    finally { setResolving(false); }
  };

  const handleDownload = async att => {
    setDownloading(att.id);
    try { await atDownload(API.downloadAtt(att.id), att.file_name); }
    catch (e) { addToast(e.message, "error"); }
    finally { setDownloading(null); }
  };

  const canResolve = ticket && ["OPEN", "IN_PROGRESS"].includes(ticket.status);
  const canComment = ticket && !["CLOSED", "CANCELLED", "RESOLVED"].includes(ticket.status);

  return (
    <>
      {/* Backdrop */}
      <div className="at-fade-in fixed inset-0 z-[300]"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
        onClick={onClose} />

      {/* Drawer */}
      <div className="at-slide at-sidebar fixed right-0 top-0 bottom-0 z-[301] flex flex-col shadow-2xl"
        style={{ width: "100%", maxWidth: 500 }}>

        {/* Hero header */}
        <div className="at-sidebar-hero">
          <div style={{ minWidth: 0, flex: 1 }}>
            {ticket && (
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <span className="font-mono text-xs" style={{ color: "var(--at-hero-sub)" }}>#{ticket.id}</span>
              </div>
            )}
            <h2 className="text-lg font-semibold leading-snug truncate" style={{ color: "var(--at-hero-text)", margin: 0 }}>
              {ticket ? ticket.subject : "Loading…"}
            </h2>
          </div>
          <button onClick={onClose} className="at-sidebar-close">
            <X size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="at-spin" style={{ color: "var(--tk-text-tertiary)" }} />
          </div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto">

            {/* Raised By */}
            <div className="at-raised-panel">
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-2.5"
                style={{ color: "var(--tk-text-tertiary)", margin: "0 0 10px" }}>Raised By</p>
              <div className="flex items-center gap-3">
                <div className="at-avatar-lg">
                  {(ticket.employee?.f_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--tk-text-primary)", margin: 0 }}>
                    {ticket.employee
                      ? `${ticket.employee.f_name} ${ticket.employee.l_name}`
                      : `Employee #${ticket.employee_id}`}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {ticket.employee?.designation && (
                      <span className="text-xs" style={{ color: "var(--tk-text-tertiary)" }}>
                        {ticket.employee.designation}
                      </span>
                    )}
                    {ticket.employee?.department?.name && (
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--tk-text-tertiary)" }}>
                        <Building2 size={10} />{ticket.employee.department.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta grid */}
            <div className="at-section">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Category",    value: ticket.category_name || "—" },
                  { label: "Submitted",   value: fmt(ticket.created_at) },
                  { label: "Last Update", value: fmt(ticket.updated_at) },
                  { label: "Assignee",    value: ticket.assigned_to_name || "You" },
                ].map(({ label, value }) => (
                  <div key={label} className="at-meta-box">
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                      style={{ color: "var(--tk-text-tertiary)", margin: "0 0 4px" }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--tk-text-primary)", margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="at-section">
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: "var(--tk-text-tertiary)", margin: "0 0 8px" }}>Issue Description</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--tk-text-secondary)", margin: 0 }}>{ticket.summary}</p>
            </div>

            {/* Attachments */}
            {atts.length > 0 && (
              <div className="at-section">
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-2.5"
                  style={{ color: "var(--tk-text-tertiary)", margin: "0 0 10px" }}>
                  Attachments ({atts.length})
                </p>
                <div className="flex flex-col gap-2">
                  {atts.map(a => (
                    <div key={a.id} className="at-att-row">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip size={12} style={{ color: "var(--tk-text-tertiary)", flexShrink: 0 }} />
                        <span className="text-sm truncate" style={{ color: "var(--tk-text-primary)" }}>{a.file_name}</span>
                        {a.file_size && (
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--tk-text-tertiary)" }}>
                            ({(a.file_size / 1024).toFixed(0)} KB)
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDownload(a)} disabled={downloading === a.id}
                        className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 ml-2 disabled:opacity-50 hover:underline transition"
                        style={{ color: "var(--at-accent-text)", border: "none", background: "none", cursor: "pointer" }}>
                        {downloading === a.id ? <Loader2 size={11} className="at-spin" /> : <Download size={11} />}
                        {downloading === a.id ? "…" : "Download"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments thread */}
            <div style={{ padding: "16px 24px" }}>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-3"
                style={{ color: "var(--tk-text-tertiary)", margin: "0 0 12px" }}>
                Thread ({comments.length})
              </p>

              {comments.length === 0 ? (
                <div className="text-center py-7">
                  <MessageSquare size={20} className="mx-auto mb-2" style={{ color: "var(--tk-text-muted)", display: "block" }} />
                  <p className="text-xs" style={{ color: "var(--tk-text-tertiary)", margin: 0 }}>No comments yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 mb-3.5">
                  {comments.map((c, i) => (
                    <div key={c.id || i} className={c.is_hr ? "at-comment-res" : "at-comment-emp"}>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0
                          ${c.is_hr ? "at-comment-avatar-res" : "at-comment-avatar-emp"}`}>
                          {(c.author_name || "?")[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: "var(--tk-text-primary)" }}>
                          {c.author_name || "User"}
                        </span>
                        {c.is_hr && <span className="at-resolver-badge">Resolver</span>}
                        <span className="text-[11px] ml-auto" style={{ color: "var(--tk-text-tertiary)" }}>
                          {fmtFull(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--tk-text-secondary)", margin: 0 }}>
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {canComment && (
                <div className="flex gap-2">
                  <input value={comment} onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendComment()}
                    placeholder="Add a resolution note…"
                    className="at-comment-input" />
                  <button onClick={sendComment} disabled={sending || !comment.trim()} className="at-send-btn">
                    {sending
                      ? <Loader2 size={14} className="at-spin" style={{ color: "#fff" }} />
                      : <Send size={14} style={{ color: "#fff" }} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Resolve footer */}
        {canResolve && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--tk-border-subtle)" }}>
            <button onClick={resolveTicket} disabled={resolving} className="at-resolve-btn">
              {resolving
                ? <><Loader2 size={13} className="at-spin" /> Resolving…</>
                : <><CheckCircle2 size={13} /> Mark as Resolved</>}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ═══ MAIN PAGE ════════════════════════════════════════════════════════════════
export default function AssignedTickets() {
  const [currentUser,    setCurrentUser]    = useState(null);
  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [detailId,       setDetailId]       = useState(null);
  const [toasts,         setToasts]         = useState([]);
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatus]         = useState("All");
  const [priorityFilter, setPriority]       = useState("All");
  const [page,           setPage]           = useState(1);

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, allTickets] = await Promise.all([
        atFetch(API.me()),
        atFetch(API.all()),
      ]);
      setCurrentUser(me);
      const list = Array.isArray(allTickets) ? allTickets : allTickets.items || [];
      setTickets(list.filter(t => isAssignedToCurrentUser(t, me)));
    } catch (e) { addToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const PRI_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return tickets
      .filter(t => statusFilter   === "All" || t.status   === statusFilter)
      .filter(t => priorityFilter === "All" || t.priority === priorityFilter)
      .filter(t => !q || (t.subject || "").toLowerCase().includes(q)
        || (t.category_name || "").toLowerCase().includes(q) || String(t.id).includes(q))
      .sort((a, b) => {
        const pd = (PRI_ORDER[a.priority] ?? 2) - (PRI_ORDER[b.priority] ?? 2);
        return pd !== 0 ? pd : new Date(b.created_at) - new Date(a.created_at);
      });
  }, [tickets, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    open:     tickets.filter(t => t.status === "OPEN").length,
    progress: tickets.filter(t => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter(t => t.status === "RESOLVED").length,
    critical: tickets.filter(t => t.priority === "CRITICAL").length,
  }), [tickets]);

  const pageNums = useMemo(() => {
    const nums = Array.from({ length: totalPages }, (_, i) => i + 1);
    return nums
      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
      .reduce((acc, n, i, arr) => {
        if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
        acc.push(n); return acc;
      }, []);
  }, [totalPages, page]);

  const hasFilters = search || statusFilter !== "All" || priorityFilter !== "All";

  // ── Loading spinner ──
  if (loading) return (
    <div className="at-page flex items-center justify-center">
      <Loader2 size={28} className="at-spin" style={{ color: "var(--tk-text-tertiary)" }} />
    </div>
  );

  // ── Empty state (no tickets assigned) ──
  if (!loading && tickets.length === 0 && currentUser) return (
    <div className="at-empty-page">
      <div className="text-center" style={{ maxWidth: 360, padding: "0 24px" }}>
        <div className="at-empty-icon-box">
          <ClipboardList size={28} style={{ color: "var(--at-accent-solid)" }} />
        </div>
        <h2 className="text-2xl font-semibold mb-2.5" style={{ color: "var(--tk-text-primary)" }}>
          No Assigned Tickets
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--tk-text-secondary)" }}>
          You don't have any tickets assigned to you right now. When HR assigns a ticket, it will appear here.
        </p>
      </div>
    </div>
  );

  // ── Stat card definitions ──
  const STAT_CARDS = [
    { label: "Open",        value: counts.open,     tint: "var(--at-stat-open-tint)", text: "var(--at-stat-open-text)", bar: "var(--at-stat-open-bar)" },
    { label: "In Progress", value: counts.progress, tint: "var(--at-stat-prog-tint)", text: "var(--at-stat-prog-text)", bar: "var(--at-stat-prog-bar)" },
    { label: "Resolved",    value: counts.resolved, tint: "var(--at-stat-res-tint)",  text: "var(--at-stat-res-text)",  bar: "var(--at-stat-res-bar)"  },
    { label: "Critical",    value: counts.critical, tint: "var(--at-stat-crit-tint)", text: "var(--at-stat-crit-text)", bar: "var(--at-stat-crit-bar)" },
  ];

  return (
    <div className="at-page">
      <Toast toasts={toasts} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            {/* Label pill */}
            <div className="at-label-pill mb-2.5">
              <ClipboardList size={12} style={{ color: "var(--at-accent-text)" }} />
              <span>Assigned to Me</span>
            </div>
            <h1 className="text-4xl font-semibold" style={{ color: "var(--tk-text-primary)", margin: 0 }}>
              My Work Queue
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--tk-text-tertiary)" }}>
              Tickets assigned to {currentUser?.f_name} {currentUser?.l_name}
            </p>
          </div>
          <button onClick={load} className="at-icon-btn">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-7">
          {STAT_CARDS.map(({ label, value, tint, text, bar }) => (
            <div key={label} className="at-stat-card" style={{ borderColor: tint }}>
              {/* Coloured top bar */}
              <div className="at-stat-card-bar" style={{ background: bar }} />
              <p className="text-[11px] font-semibold uppercase tracking-widest mt-2 mb-1.5"
                style={{ color: "var(--tk-text-tertiary)" }}>{label}</p>
              <p className="text-4xl font-semibold leading-none" style={{ color: text }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Table card ── */}
        <div className="at-table-card">

          {/* Toolbar */}
          <div className="at-toolbar">
            <div className="at-search-wrap">
              <Search size={13} className="at-search-icon" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tickets…" className="at-search-input" />
            </div>

            <select value={statusFilter}   onChange={e => setStatus(e.target.value)}   className="at-select">
              <option value="All">All Status</option>
              {Object.entries(STATUS_CLS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>

            <select value={priorityFilter} onChange={e => setPriority(e.target.value)} className="at-select">
              <option value="All">All Priority</option>
              {Object.entries(PRIORITY_CLS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>

            {hasFilters && (
              <button onClick={() => { setSearch(""); setStatus("All"); setPriority("All"); }}
                className="at-clear-btn">
                <X size={11} /> Clear
              </button>
            )}

            <span className="ml-auto text-xs" style={{ color: "var(--tk-text-tertiary)" }}>
              {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Empty state */}
          {paged.length === 0 ? (
            <div className="at-empty">
              <Inbox size={24} style={{ color: "var(--at-empty-icon)", display: "block", margin: "0 auto 12px" }} />
              <p className="text-sm" style={{ color: "var(--tk-text-tertiary)", margin: 0 }}>
                No tickets match your filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead className="at-thead">
                  <tr>
                    {["#", "Subject", "Raised By", "Category", "Priority", "Status", "Submitted", ""].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((t, i) => {
                    const empName = t.employee
                      ? `${t.employee.f_name} ${t.employee.l_name}`
                      : `#${t.employee_id}`;
                    return (
                      <tr key={t.id} className="at-tr at-fade-up"
                        style={{ animationDelay: `${i * 20}ms` }}
                        onClick={() => setDetailId(t.id)}>

                        {/* ID */}
                        <td style={{ padding: "14px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--tk-text-tertiary)" }}>
                          #{t.id}
                        </td>

                        {/* Subject */}
                        <td style={{ padding: "14px 16px", maxWidth: 180 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.subject}
                          </p>
                        </td>

                        {/* Raised by */}
                        <td style={{ padding: "14px 16px" }}>
                          <div className="flex items-center gap-2">
                            <div className="at-avatar-sm">{(empName[0] || "?").toUpperCase()}</div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--tk-text-primary)", whiteSpace: "nowrap" }}>
                              {empName}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "14px 16px" }}>
                          <span className="at-cat-chip">{t.category_name || "—"}</span>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: "14px 16px" }}><PriorityBadge priority={t.priority} /></td>

                        {/* Status */}
                        <td style={{ padding: "14px 16px" }}><StatusBadge status={t.status} /></td>

                        {/* Date */}
                        <td style={{ padding: "14px 16px", fontSize: 12, color: "var(--tk-text-tertiary)", whiteSpace: "nowrap" }}>
                          {fmt(t.created_at)}
                        </td>

                        {/* View */}
                        <td style={{ padding: "14px 16px" }}>
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--tk-text-tertiary)" }}>
                            <Eye size={12} /> View
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="at-pager">
              <span className="text-xs" style={{ color: "var(--tk-text-tertiary)" }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="at-page-btn"><ChevronLeft size={14} /></button>

                {pageNums.map((n, i) => n === "..." ? (
                  <span key={`el-${i}`} className="w-8 h-8 flex items-center justify-center text-xs"
                    style={{ color: "var(--tk-text-tertiary)" }}>…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n)}
                    className={`at-page-btn ${page === n ? "at-page-btn-active" : ""}`}>
                    {n}
                  </button>
                ))}

                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="at-page-btn"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailId && (
        <AssigneeSidebar
          ticketId={detailId}
          onClose={() => setDetailId(null)}
          onUpdated={() => { setDetailId(null); load(); }}
          addToast={addToast}
        />
      )}
    </div>
  );
}