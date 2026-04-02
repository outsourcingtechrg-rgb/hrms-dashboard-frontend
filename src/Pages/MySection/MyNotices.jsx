/**
 * NoticeBoardPage.jsx — Employee Notice Board
 *
 * Who sees this: All employees (level ≥ 5) and also managers.
 * Shows Active, non-expired notices scoped to the employee's audience.
 *
 * Features:
 *   - Gorgeous card layout with priority-based visual styling
 *   - Pinned notices highlighted at top
 *   - Urgent notices with attention-grabbing animation
 *   - Filter by All / Unread / Read tabs
 *   - Filter by category, priority
 *   - Inline expand to read full content
 *   - One-click Acknowledge button
 *   - Overall progress bar
 *
 * APIs:
 *   GET  /notices/my                → EmployeeNoticeItem[]
 *   POST /notices/{id}/acknowledge  → AcknowledgeOut
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Bell, BellOff, Search, Filter, RefreshCw,
  CheckCircle2, AlertTriangle, Clock, ChevronDown, ChevronUp,
  Megaphone, Users, Building2, Shield, Globe,
  Cpu, DollarSign, Layers, Heart, Star, FileText,
  Loader2, AlertCircle, X, ThumbsUp, BadgeCheck,
  Pin, Calendar, Zap,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Inject styles ─── */
const STYLES = `
  @keyframes nbeFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes nbeSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes nbeSpin    { to{transform:rotate(360deg)} }
  @keyframes nbeGlow    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
  @keyframes nbePulse   { 0%,100%{opacity:1} 50%{opacity:.6} }
  .nbe-fade  { animation: nbeFadeIn .2s ease-out; }
  .nbe-up    { animation: nbeSlideUp .3s cubic-bezier(.4,0,.2,1) both; }
  .nbe-spin  { animation: nbeSpin .85s linear infinite; }
  .nbe-glow  { animation: nbeGlow 2s ease-in-out infinite; }
  .nbe-pulse { animation: nbePulse 1.6s ease-in-out infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("__nbe_styles__")) {
  const s = document.createElement("style"); s.id = "__nbe_styles__"; s.innerHTML = STYLES;
  document.head.appendChild(s);
}

function getHeaders() {
  const t = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}
function fmtDate(iso) { return iso ? String(iso).slice(0, 10) : "—"; }
function fmtAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 7)  return fmtDate(iso);
  if (d >= 1) return `${d}d ago`;
  if (h >= 1) return `${h}h ago`;
  if (m >= 1) return `${m}m ago`;
  return "Just now";
}

/* ─── Config ─── */
const CATEGORIES = ["General","HR","IT","Finance","Operations","Health & Safety","Event","Policy Update"];
const PRIORITIES = ["Low","Medium","High","Urgent"];

const PRIORITY_CFG = {
  Low:    { border: "border-l-gray-300",  bg: "bg-white",           header: "bg-gray-50",    badge: "bg-gray-100 text-gray-600",      dot: "bg-gray-400",    label: "text-gray-500"   },
  Medium: { border: "border-l-blue-400",  bg: "bg-white",           header: "bg-blue-50/40", badge: "bg-blue-100 text-blue-700",      dot: "bg-blue-500",    label: "text-blue-600"   },
  High:   { border: "border-l-orange-500",bg: "bg-white",           header: "bg-orange-50/40",badge:"bg-orange-100 text-orange-700",  dot: "bg-orange-500",  label: "text-orange-600" },
  Urgent: { border: "border-l-red-500",   bg: "bg-red-50/30",       header: "bg-red-50",     badge: "bg-red-100 text-red-700",        dot: "bg-red-500",     label: "text-red-600",   urgent: true },
};

const CAT_CFG = {
  "General":         { color: "text-gray-500",   bg: "bg-gray-100",    icon: Megaphone  },
  "HR":              { color: "text-violet-600",  bg: "bg-violet-100",  icon: Users      },
  "IT":              { color: "text-cyan-600",    bg: "bg-cyan-100",    icon: Cpu        },
  "Finance":         { color: "text-green-600",   bg: "bg-green-100",   icon: DollarSign },
  "Operations":      { color: "text-blue-600",    bg: "bg-blue-100",    icon: Layers     },
  "Health & Safety": { color: "text-orange-600",  bg: "bg-orange-100",  icon: Heart      },
  "Event":           { color: "text-pink-600",    bg: "bg-pink-100",    icon: Star       },
  "Policy Update":   { color: "text-amber-600",   bg: "bg-amber-100",   icon: FileText   },
};

/* ─── Toast ─── */
function Toast({ msg, type = "success" }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl pointer-events-none nbe-fade ${type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
      {type === "error" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />} {msg}
    </div>
  );
}

/* ─── Audience label ─── */
function AudienceLabel({ notice }) {
  const aud = notice.audience_type;
  if (aud === "all") return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400"><Globe size={10} /> Company-wide</span>
  );
  if (aud === "departments") return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400"><Building2 size={10} /> Department</span>
  );
  if (aud === "roles") return (
    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400"><Shield size={10} /> Role-based</span>
  );
  return <span className="inline-flex items-center gap-1 text-[10px] text-gray-400"><Users size={10} /> Selective</span>;
}

/* ─── Individual Notice Card ─── */
function NoticeCard({ notice, onAcknowledge, delay = 0 }) {
  const [expanded,       setExpanded]       = useState(false);
  const [acking,         setAcking]         = useState(false);
  const [localAcked,     setLocalAcked]     = useState(notice.acknowledged);
  const [localAckedAt,   setLocalAckedAt]   = useState(notice.acked_at);

  const pCfg = PRIORITY_CFG[notice.priority] || PRIORITY_CFG.Medium;
  const cCfg = CAT_CFG[notice.category]     || CAT_CFG["General"];
  const CatIcon = cCfg.icon;
  const isExpired = notice.expires_at && new Date(notice.expires_at) < new Date();

  const handleAck = async () => {
    setAcking(true);
    try {
      const res = await fetch(API.AcknowledgeNotice(notice.id), { method: "POST", headers: getHeaders() });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.detail || "Failed"); }
      const data = await res.json();
      setLocalAcked(true);
      setLocalAckedAt(data.acked_at);
      onAcknowledge(notice.id);
    } catch { /* handled by parent */ }
    finally { setAcking(false); }
  };

  return (
    <div
      className={`rounded-2xl border-l-4 border border-gray-100 overflow-hidden nbe-up shadow-sm hover:shadow-md transition-shadow ${pCfg.border} ${pCfg.bg} ${pCfg.urgent && !localAcked ? "nbe-glow" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Card header */}
      <div className={`px-5 pt-5 pb-4 ${pCfg.header}`}>
        <div className="flex items-start gap-3">

          {/* Category icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cCfg.bg}`}>
            <CatIcon size={18} className={cCfg.color} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {/* Priority badge */}
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${pCfg.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot} ${pCfg.urgent && !localAcked ? "nbe-pulse" : ""}`} />
                {notice.priority}
              </span>
              {/* Category badge */}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cCfg.bg} ${cCfg.color}`}>{notice.category}</span>
              {/* Pinned */}
              {notice.pinned && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  <Pin size={8} /> Pinned
                </span>
              )}
              {/* Expired */}
              {isExpired && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Expired</span>
              )}
            </div>

            {/* Title */}
            <h3 className={`text-base font-bold leading-snug ${pCfg.urgent ? "text-red-900" : "text-gray-900"}`}>
              {notice.title}
            </h3>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <AudienceLabel notice={notice} />
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">{notice.created_by_name || "—"}</span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] text-gray-400">{fmtAgo(notice.created_at)}</span>
              {notice.expires_at && !isExpired && (
                <>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                    <Calendar size={9} /> Expires {fmtDate(notice.expires_at)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: ack status */}
          <div className="flex-shrink-0">
            {localAcked ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <BadgeCheck size={13} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Read</span>
                </div>
                {localAckedAt && (
                  <span className="text-[10px] text-gray-400">{fmtDate(localAckedAt)}</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock size={12} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-600">Unread</span>
              </div>
            )}
          </div>
        </div>

        {/* Ack progress bar (small) */}
        {notice.total_recipients > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-gray-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.round((notice.ack_count / notice.total_recipients) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">
              {notice.ack_count}/{notice.total_recipients} acknowledged
            </span>
          </div>
        )}
      </div>

      {/* Preview / Expand */}
      <div className="px-5 pb-4">
        {/* Content preview */}
        <p className={`text-sm text-gray-600 leading-relaxed mb-3 ${expanded ? "" : "line-clamp-2"}`}>
          {notice.content}
        </p>

        {/* Expand + Ack row */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition"
          >
            {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read full notice</>}
          </button>

          {!localAcked && (
            <button
              onClick={handleAck}
              disabled={acking}
              className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 ${
                pCfg.urgent
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {acking
                ? <><Loader2 size={12} className="nbe-spin" /> Acknowledging…</>
                : <><ThumbsUp size={12} /> Acknowledge</>}
            </button>
          )}

          {localAcked && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <BadgeCheck size={14} /> Acknowledged
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Pinned Notice Hero ─── */
function PinnedBanner({ notice, onAcknowledge }) {
  const [acking,      setAcking]      = useState(false);
  const [localAcked,  setLocalAcked]  = useState(notice.acknowledged);
  const [localAckedAt,setLocalAckedAt]= useState(notice.acked_at);
  const pCfg = PRIORITY_CFG[notice.priority] || PRIORITY_CFG.Medium;

  const handleAck = async () => {
    setAcking(true);
    try {
      const res = await fetch(API.AcknowledgeNotice(notice.id), { method: "POST", headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLocalAcked(true); setLocalAckedAt(data.acked_at);
        onAcknowledge(notice.id);
      }
    } finally { setAcking(false); }
  };

  return (
    <div className={`rounded-2xl border-l-4 overflow-hidden mb-5 ${pCfg.border} ${
      notice.priority === "Urgent" ? "bg-gradient-to-r from-red-50 to-orange-50 border border-red-200" : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
    }`}>
      <div className="px-6 py-5 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${notice.priority === "Urgent" ? "bg-red-100" : "bg-blue-100"}`}>
          {notice.priority === "Urgent" ? <Zap size={20} className="text-red-600" /> : <Pin size={20} className="text-blue-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold text-blue-600 flex items-center gap-1"><Pin size={10} /> Pinned</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pCfg.badge}`}>{notice.priority}</span>
          </div>
          <h3 className="text-lg font-black text-gray-900 leading-tight">{notice.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">{notice.content}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-gray-400">{notice.created_by_name} · {fmtAgo(notice.created_at)}</span>
            {!localAcked && (
              <button onClick={handleAck} disabled={acking}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-bold rounded-xl transition ${notice.priority === "Urgent" ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}`}>
                {acking ? <Loader2 size={11} className="nbe-spin" /> : <ThumbsUp size={11} />} Acknowledge
              </button>
            )}
            {localAcked && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold"><BadgeCheck size={13} /> Acknowledged {localAckedAt ? fmtDate(localAckedAt) : ""}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NoticeBoardPage — Main
═══════════════════════════════════════════════════════════════ */
export default function NoticeBoardPage() {
  const [notices,  setNotices]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [tab,         setTab]         = useState("All");      // All | Unread | Read
  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("All");
  const [filterPri,   setFilterPri]   = useState("All");
  const [toast,       setToast]       = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchNotices = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(API.MyNotices, { headers: getHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const handleAcknowledge = useCallback((noticeId) => {
    setNotices(prev => prev.map(n =>
      n.id === noticeId ? { ...n, acknowledged: true, acked_at: new Date().toISOString() } : n
    ));
    showToast("Notice acknowledged! ✓");
  }, [showToast]);

  // Stats
  const total     = notices.length;
  const read      = notices.filter(n => n.acknowledged).length;
  const unread    = total - read;
  const urgent    = notices.filter(n => n.priority === "Urgent" && !n.acknowledged).length;
  const pinned    = notices.filter(n => n.pinned);

  // Filtered
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...notices]
      .sort((a, b) => {
        // Pinned first
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        // Unacknowledged urgent first
        const urgA = a.priority === "Urgent" && !a.acknowledged ? 0 : 1;
        const urgB = b.priority === "Urgent" && !b.acknowledged ? 0 : 1;
        if (urgA !== urgB) return urgA - urgB;
        // Priority order
        const pOrd = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
        if (a.priority !== b.priority) return (pOrd[a.priority] ?? 2) - (pOrd[b.priority] ?? 2);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      })
      .filter(n => {
        if (tab === "Unread") return !n.acknowledged;
        if (tab === "Read")   return n.acknowledged;
        return true;
      })
      .filter(n => filterCat === "All" || n.category === filterCat)
      .filter(n => filterPri === "All" || n.priority === filterPri)
      .filter(n => !q || (n.title || "").toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q))
      // Exclude pinned notices (they show as banners at top)
      .filter(n => !(n.pinned && tab === "All" && !filterCat && !filterPri && !search && !q));
  }, [notices, tab, search, filterCat, filterPri]);

  // Pinned notices to show as banners (only in "All" unfiltered view)
  const showPinnedBanners = tab === "All" && filterCat === "All" && filterPri === "All" && !search;
  const pinnedToShow = showPinnedBanners ? pinned : [];

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-10 text-gray-900">

      {/* Header */}
      <header className="mb-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Notice Board</h1>
              <p className="text-sm text-gray-400 mt-0.5">Stay informed · {new Date().toDateString()}</p>
            </div>
          </div>
          <button onClick={fetchNotices} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 text-xs font-bold rounded-xl transition disabled:opacity-40 shadow-sm self-start">
            <RefreshCw size={13} className={loading ? "nbe-spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {/* Urgent banner */}
      {urgent > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 mb-6 nbe-glow">
          <Zap size={16} className="text-red-500 mt-0.5 flex-shrink-0 nbe-pulse" />
          <div className="flex-1">
            <p className="text-sm font-black text-red-900">
              {urgent} urgent notice{urgent !== 1 ? "s" : ""} require{urgent === 1 ? "s" : ""} your attention
            </p>
            <p className="text-xs text-red-600 mt-0.5">Please read and acknowledge immediately.</p>
          </div>
          <button onClick={() => { setTab("Unread"); setFilterPri("Urgent"); }}
            className="text-xs font-bold text-red-700 hover:underline flex-shrink-0">View now →</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6">
          <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button onClick={fetchNotices} className="text-xs font-bold text-red-600 hover:underline">Retry</button>
        </div>
      )}

      {/* Summary stats + progress */}
      {!loading && total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              { label: "Total",   value: total,  color: "text-gray-900",   bg: "bg-gray-50" },
              { label: "Unread",  value: unread, color: "text-amber-700",  bg: "bg-amber-50"   },
              { label: "Read",    value: read,   color: "text-emerald-700",bg: "bg-emerald-50" },
              { label: "Urgent",  value: notices.filter(n => n.priority === "Urgent").length,  color: "text-red-700", bg: "bg-red-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray-500">Reading Progress</span>
              <span className="text-xs font-bold text-gray-700">{read}/{total} read</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                style={{ width: `${total > 0 ? Math.round((read / total) * 100) : 0}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-400 mt-1">
              {total > 0 ? Math.round((read / total) * 100) : 0}% complete
            </div>
          </div>
        </div>
      )}

      {/* Pinned notice banners */}
      {!loading && pinnedToShow.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-3">
            <Pin size={13} className="text-blue-500" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Pinned Notices</span>
          </div>
          {pinnedToShow.map(n => (
            <PinnedBanner key={n.id} notice={n} onAcknowledge={handleAcknowledge} />
          ))}
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { key: "All",    label: "All Notices", count: total  },
            { key: "Unread", label: "Unread",       count: unread },
            { key: "Read",   label: "Read",         count: read   },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition ${
                tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {label}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                tab === key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
              }`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Filter size={13} className="text-gray-400" />
          <div className="relative flex-1 min-w-[160px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search notices…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-400 transition placeholder-gray-400" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 cursor-pointer transition text-gray-700">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterPri} onChange={e => setFilterPri(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 cursor-pointer transition text-gray-700">
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          {(filterCat !== "All" || filterPri !== "All" || search) && (
            <button onClick={() => { setFilterCat("All"); setFilterPri("All"); setSearch(""); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-xl hover:bg-red-50 transition">
              <X size={11} /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} notice{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Notice list */}
      {loading ? (
        <div className="flex items-center justify-center py-28">
          <div className="text-center">
            <Loader2 size={32} className="nbe-spin text-gray-200 mx-auto mb-4" />
            <p className="text-sm text-gray-400">Loading your notices…</p>
          </div>
        </div>
      ) : filtered.length === 0 && pinnedToShow.length === 0 ? (
        <div className="flex items-center justify-center py-28">
          <div className="text-center">
            {tab === "Read" ? (
              <>
                <BellOff size={42} className="text-gray-200 mx-auto mb-4" />
                <p className="text-base font-bold text-gray-400">No read notices yet</p>
                <p className="text-sm text-gray-400 mt-1">Start acknowledging notices to see them here.</p>
              </>
            ) : tab === "Unread" && unread === 0 ? (
              <>
                <CheckCircle2 size={42} className="text-emerald-300 mx-auto mb-4" />
                <p className="text-base font-bold text-emerald-600">All caught up!</p>
                <p className="text-sm text-gray-400 mt-1">You've read all your notices.</p>
              </>
            ) : (
              <>
                <Bell size={42} className="text-gray-200 mx-auto mb-4" />
                <p className="text-base font-bold text-gray-400">No notices found</p>
                {(filterCat !== "All" || filterPri !== "All" || search) && (
                  <button onClick={() => { setFilterCat("All"); setFilterPri("All"); setSearch(""); }}
                    className="mt-3 text-sm text-blue-600 font-bold hover:underline">Clear filters</button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notice, i) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onAcknowledge={handleAcknowledge}
              delay={i * 40}
            />
          ))}
        </div>
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}