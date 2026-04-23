/**
 * LeaveBalanceOverview.jsx
 * Display all leave types with usage statistics
 *
 * Shows:
 *   - Summary cards for each leave type
 *   - Total allocated, used, pending, remaining days
 *   - Visual progress bars
 *   - Leave history table
 */

import React, { useState, useEffect, useMemo } from "react";
import { API } from "../../Components/Apis";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  X,
  Sun,
  Loader2,
  RefreshCw,
  ChevronDown,
  Filter,
} from "lucide-react";

/* ─── Font Injection ─── */
const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap";
const STYLES = `
  @import url('${FONT_URL}');
  .lbo-root { font-family: 'DM Sans', sans-serif; }
  .lbo-root h1, .lbo-root h2, .lbo-root h3, .lbo-root .sora { font-family: 'Sora', sans-serif; }
  @keyframes lboFadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lboFadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes lboSpin    { to{transform:rotate(360deg)} }
  @keyframes lboSlideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
  @keyframes lboPop     { 0%{transform:scale(.92);opacity:0} 100%{transform:scale(1);opacity:1} }
  .lbo-fade-up  { animation: lboFadeUp .32s cubic-bezier(.22,1,.36,1) both; }
  .lbo-fade-in  { animation: lboFadeIn .2s ease both; }
  .lbo-slide-in { animation: lboSlideIn .28s cubic-bezier(.22,1,.36,1) both; }
  .lbo-pop      { animation: lboPop .22s cubic-bezier(.22,1,.36,1) both; }
  .lbo-spin     { animation: lboSpin .8s linear infinite; }
  .lbo-root table { width: 100%; border-collapse: collapse; }
  .lbo-root th, .lbo-root td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
  .lbo-root th { background: #f9fafb; font-weight: 600; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .lbo-root tr:hover { background: #f9fafb; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById("__lbo_sty__")
) {
  const s = document.createElement("style");
  s.id = "__lbo_sty__";
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ─── Auth Helpers ─── */
function getHeaders() {
  const t = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

/* ─── Date Helpers ─── */
const fmtDate = (iso) => (iso ? String(iso).slice(0, 10) : "—");
const fmtPretty = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return fmtDate(iso);
  }
};
const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  return Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000) + 1);
};

/* ─── Status Config ─── */
const SC = {
  PENDING: {
    label: "Pending",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    bar: "bg-amber-400",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    bar: "bg-emerald-500",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    bar: "bg-red-400",
    icon: Ban,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-slate-500",
    bg: "bg-slate-50 border-slate-200",
    bar: "bg-slate-400",
    icon: X,
  },
};

const CARD_ACCENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-rose-600",
  "from-amber-500 to-orange-600",
];

/* ─── Spinner ─── */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-blue-500 lbo-spin" />
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ msg, type }) {
  if (!msg) return null;
  const Icon = type === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[900] flex items-center gap-2.5 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl lbo-pop pointer-events-none ${
        type === "error" ? "bg-red-600" : "bg-emerald-600"
      }`}
    >
      <Icon size={14} strokeWidth={2.5} />
      {msg}
    </div>
  );
}

/* ─── Status Badge ─── */
function Badge({ status }) {
  const s = SC[status] || SC.PENDING;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.color}`}
    >
      <Icon size={10} strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

/* ─── Balance Card ─── */
function BalanceCard({ item, idx, onClick, active }) {
  const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
  const {
    leave_type_name,
    total_allocated,
    used_days,
    pending_days,
    remaining_days,
    is_paid,
  } = item;

  const pctUsed =
    total_allocated > 0
      ? Math.min(100, (used_days / total_allocated) * 100)
      : 0;
  const pctPending =
    total_allocated > 0
      ? Math.min(100, (pending_days / total_allocated) * 100)
      : 0;
  const low = remaining_days <= Math.max(1, Math.floor(total_allocated * 0.2));

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden select-none lbo-fade-up
        ${
          active
            ? "ring-2 ring-blue-500 border-blue-300 shadow-lg"
            : "border-slate-200 hover:border-slate-300 hover:shadow-md"
        }`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
              {is_paid ? "Paid" : "Unpaid"}
            </p>
            <h3 className="sora text-sm font-bold text-slate-800 leading-tight">
              {leave_type_name}
            </h3>
          </div>
          <div
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center`}
          >
            <Sun size={14} className="text-white" />
          </div>
        </div>

        <div className="mb-3">
          <span
            className={`sora text-4xl font-extrabold tracking-tight ${
              low ? "text-red-500" : "text-slate-900"
            }`}
          >
            {remaining_days}
          </span>
          <span className="text-slate-400 text-sm ml-2">
            / {total_allocated} days
          </span>
        </div>

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2.5">
          <div className="h-full flex">
            <div
              className={`h-full bg-gradient-to-r ${accent} transition-all duration-700`}
              style={{ width: `${pctUsed}%` }}
            />
            <div
              className="h-full bg-amber-300 transition-all duration-700"
              style={{ width: `${pctPending}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
          <span>
            {used_days} used
            {pending_days > 0 ? ` · ${pending_days} pending` : ""}
          </span>
          {low && (
            <span className="text-red-400 font-semibold">Low balance</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN PAGE ═══ */
export default function LeaveBalanceOverview() {
  const [balance, setBalance] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const [filter, setFilter] = useState("All");

  /* ─── Fetch data ─── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch balance summary
        const balRes = await fetch(API.GetMySummary(), {
          headers: getHeaders(),
        });
        if (!balRes.ok) throw new Error("Failed to fetch balance");
        const balData = await balRes.json();
        setBalance(Array.isArray(balData) ? balData : []);

        // Fetch leave history
        const histRes = await fetch(API.GetMyApplications(), {
          headers: getHeaders(),
        });
        if (!histRes.ok) throw new Error("Failed to fetch history");
        const histData = await histRes.json();
        setHistory(Array.isArray(histData) ? histData : []);

        if (balData.length > 0) {
          setActiveCard(0);
        }
      } catch (e) {
        setError(e.message || "Failed to load leaves");
        setToast(e.message);
        setToastType("error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ─── Filter history ─── */
  const filteredHistory = useMemo(() => {
    if (filter === "All") return history;
    return history.filter((h) => h.status === filter);
  }, [history, filter]);

  /* ─── Total balance ─── */
  const totalBalance = useMemo(
    () => balance.reduce((sum, item) => sum + (item.total_allocated || 0), 0),
    [balance],
  );

  return (
    <div className="lbo-root min-h-screen bg-slate-50 p-6">
      <Toast msg={toast} type={toastType} />

      {/* ─── Header ─── */}
      <div className="mb-8 lbo-fade-up">
        <h1 className="sora text-3xl font-bold text-slate-900 mb-2">
          Leave Management
        </h1>
        <p className="text-slate-600 text-sm">
          View your leave balance and application history
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm lbo-fade-up">
          {error}
        </div>
      ) : (
        <>
          {/* ─── Total Balance Card ─── */}
          {balance.length > 0 && (
            <div
              className="mb-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white lbo-fade-up"
              style={{
                animation:
                  "lboFadeUp 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
              }}
            >
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wide mb-2">
                Total Leave Balance
              </p>
              <div className="flex items-end gap-3">
                <span className="sora text-5xl font-extrabold tracking-tight">
                  {totalBalance}
                </span>
                <span className="text-blue-100 text-base mb-2">days</span>
              </div>
            </div>
          )}

          {/* ─── Balance Cards Grid ─── */}
          {balance.length > 0 ? (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {balance.map((item, idx) => (
                  <BalanceCard
                    key={item.leave_type_id || idx}
                    item={item}
                    idx={idx}
                    onClick={() => setActiveCard(idx)}
                    active={activeCard === idx}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center lbo-fade-up">
              <p className="text-slate-500 text-sm">No leave types available</p>
            </div>
          )}

          {/* ─── Leave History ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden lbo-fade-up">
            <div className="px-6 py-5 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="sora text-lg font-bold text-slate-900">
                  My Leave History
                </h2>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                >
                  {["All", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map(
                    (st) => (
                      <option key={st} value={st}>
                        {st === "All" ? "All Statuses" : st}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredHistory.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Days</th>
                      <th>Applied On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((req, idx) => {
                      const days = daysBetween(req.start_date, req.end_date);
                      return (
                        <tr key={idx} className="lbo-fade-in">
                          <td className="font-medium text-slate-900">—</td>
                          <td className="text-slate-700">
                            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                              {req.leave_type_name || "—"}
                            </span>
                          </td>
                          <td className="text-slate-600 text-sm">
                            {fmtDate(req.start_date)} – {fmtDate(req.end_date)}
                          </td>
                          <td className="font-semibold text-slate-900">
                            {days} days
                          </td>
                          <td className="text-slate-600 text-sm">
                            {fmtPretty(req.requested_at)}
                          </td>
                          <td>
                            <Badge status={req.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-10 text-center">
                  <p className="text-slate-500 text-sm">No leaves found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
