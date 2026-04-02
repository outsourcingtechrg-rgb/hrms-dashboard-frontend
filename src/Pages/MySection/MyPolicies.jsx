/**
 * MyPoliciesPage.jsx  —  Employee Policy View
 *
 * Fetches from GET /policies/my (EmployeePolicyItem list)
 * Each item includes:
 *   acknowledged : bool   — has THIS employee acknowledged it?
 *   acked_at     : string — when they acknowledged
 *   mandatory    : bool   — requires acknowledgement
 *
 * Features:
 *   - Filter by All / Acknowledged / Pending tabs
 *   - Filter by category, mandatory
 *   - Search
 *   - Click to expand full policy + acknowledge button
 *   - Mandatory unacknowledged policies highlighted at top
 *
 * API:
 *   GET  /policies/my                    → EmployeePolicyItem[]
 *   POST /policies/{id}/acknowledge      → AcknowledgeOut
 *   GET  /policies/{id}                  → PolicyOut (full content)
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Star,
  Users,
  FileText,
  Building2,
  Shield,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  BadgeCheck,
  AlertCircle,
  Loader2,
  X,
  BookOpen,
  ThumbsUp,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Animations ─── */
const STYLES = `
  @keyframes fadeIn { from{opacity:0}to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
  @keyframes mpSpin { to{transform:rotate(360deg)} }
  .mp-fade  { animation: fadeIn .2s ease-out; }
  .mp-up    { animation: slideUp .25s ease-out forwards; }
  .mp-spin  { animation: mpSpin .85s linear infinite; }
`;
if (
  typeof document !== "undefined" &&
  !document.getElementById("__mpp_styles__")
) {
  const s = document.createElement("style");
  s.id = "__mpp_styles__";
  s.innerHTML = STYLES;
  document.head.appendChild(s);
}

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function fmtDate(iso) {
  if (!iso) return "—";
  return String(iso).slice(0, 10);
}

/* ─── Config ─── */
const CATEGORIES = [
  "HR Policy",
  "IT & Security",
  "Finance",
  "Legal",
  "Health & Safety",
  "Operations",
  "Code of Conduct",
  "Benefits",
];

const CAT_CFG = {
  "HR Policy": {
    color: "bg-violet-50 text-violet-700",
    border: "border-violet-200",
    icon: Users,
  },
  "IT & Security": {
    color: "bg-cyan-50 text-cyan-700",
    border: "border-cyan-200",
    icon: Lock,
  },
  Finance: {
    color: "bg-green-50 text-green-700",
    border: "border-green-200",
    icon: Building2,
  },
  Legal: {
    color: "bg-red-50 text-red-700",
    border: "border-red-200",
    icon: Shield,
  },
  "Health & Safety": {
    color: "bg-orange-50 text-orange-700",
    border: "border-orange-200",
    icon: AlertTriangle,
  },
  Operations: {
    color: "bg-blue-50 text-blue-700",
    border: "border-blue-200",
    icon: Layers,
  },
  "Code of Conduct": {
    color: "bg-gray-50 text-gray-700",
    border: "border-gray-200",
    icon: Award,
  },
  Benefits: {
    color: "bg-amber-50 text-amber-700",
    border: "border-amber-200",
    icon: Star,
  },
};

/* ─── Toast ─── */
function Toast({ msg, type = "success" }) {
  if (!msg) return null;
  const bg = type === "error" ? "bg-red-600" : "bg-emerald-600";
  const Icon = type === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-500 flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl pointer-events-none mp-fade ${bg}`}
    >
      <Icon size={15} /> {msg}
    </div>
  );
}

/* ─── Policy Card ─── */
function PolicyCard({ policy, onAcknowledge }) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [acking, setAcking] = useState(false);
  const [localAcked, setLocalAcked] = useState(policy.acknowledged);
  const [localAckedAt, setLocalAckedAt] = useState(policy.acked_at);

  const catCfg = CAT_CFG[policy.category] || {};
  const CatIcon = catCfg.icon || FileText;

  const handleExpand = async () => {
    if (!expanded && !content) {
      setLoadingContent(true);
      try {
        const res = await fetch(API.PolicyById(policy.id), {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
        }
      } catch {
        /* silent */
      } finally {
        setLoadingContent(false);
      }
    }
    setExpanded((v) => !v);
  };

  const handleAcknowledge = async () => {
    setAcking(true);
    try {
      const res = await fetch(API.AcknowledgePolicy(policy.id), {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail || "Failed");
      }
      const data = await res.json();
      setLocalAcked(true);
      setLocalAckedAt(data.acked_at);
      onAcknowledge(policy.id);
    } catch (err) {
      /* toast handled by parent via onAcknowledge */
    } finally {
      setAcking(false);
    }
  };

  const urgency = policy.mandatory && !localAcked;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border transition-all mp-up ${urgency ? "border-red-200 ring-1 ring-red-100" : "border-gray-100"}`}
    >
      {/* Card Header */}
      <div className="p-5 flex items-start gap-4">
        {/* Category icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${catCfg.color} ${catCfg.border}`}
        >
          <CatIcon size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-lg ${catCfg.color}`}
            >
              {policy.category}
            </span>
            {policy.mandatory && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                ★ Mandatory
              </span>
            )}
            {policy.pinned && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                Pinned
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-900 leading-snug">
            {policy.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
            {policy.summary}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
            <span>v{policy.version}</span>
            <span>·</span>
            <span>Updated {fmtDate(policy.updated_at)}</span>
            {policy.ack_count > 0 && (
              <>
                <span>·</span>
                <span>
                  {policy.ack_count}/{policy.total_recipients} acknowledged
                </span>
              </>
            )}
          </div>
        </div>

        {/* Ack status + read button */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Ack status badge */}
          {localAcked ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
              <BadgeCheck size={13} />
              <span>Acknowledged</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
              <Clock size={12} />
              <span>Pending</span>
            </div>
          )}

          {/* Expand toggle */}
          <button
            onClick={handleExpand}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition"
          >
            <BookOpen size={12} />
            {expanded ? "Collapse" : "Read"}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4 mp-fade">
          {loadingContent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="mp-spin text-gray-300" />
            </div>
          ) : (
            <>
              <div className="bg-gray-50 rounded-xl p-4 max-h-72 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {content || policy.summary}
                </pre>
              </div>

              {/* Acknowledgement section */}
              <div
                className={`rounded-xl p-4 flex items-center justify-between gap-4 ${localAcked ? "bg-emerald-50 border border-emerald-100" : "bg-amber-50 border border-amber-100"}`}
              >
                <div>
                  {localAcked ? (
                    <>
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                        <BadgeCheck size={16} /> You have acknowledged this
                        policy
                      </div>
                      {localAckedAt && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Acknowledged on {fmtDate(localAckedAt)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-amber-700 font-semibold text-sm">
                        {policy.mandatory
                          ? "⚠️ Acknowledgement Required"
                          : "Acknowledge this policy?"}
                      </div>
                      <p className="text-xs text-amber-600 mt-0.5">
                        {policy.mandatory
                          ? "This is a mandatory policy. Please read and acknowledge it."
                          : "Click to confirm you have read and understood this policy."}
                      </p>
                    </>
                  )}
                </div>
                {!localAcked && (
                  <button
                    onClick={handleAcknowledge}
                    disabled={acking}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition shrink-0"
                  >
                    {acking ? (
                      <>
                        <Loader2 size={13} className="mp-spin" /> Acknowledging…
                      </>
                    ) : (
                      <>
                        <ThumbsUp size={13} /> Acknowledge
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MyPoliciesPage — Main
═══════════════════════════════════════════════════════════════ */
export default function MyPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterTab, setFilterTab] = useState("All"); // All | Pending | Acknowledged
  const [filterMand, setFilterMand] = useState("All"); // All | Mandatory | Optional
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API.MyPolicies(), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Called when a card acknowledges — update local state
  const handleAcknowledge = useCallback(
    (policyId) => {
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === policyId
            ? { ...p, acknowledged: true, acked_at: new Date().toISOString() }
            : p,
        ),
      );
      showToast("Policy acknowledged!", "success");
    },
    [showToast],
  );

  /* Stats */
  const total = policies.length;
  const acknowledged = policies.filter((p) => p.acknowledged).length;
  const pending = total - acknowledged;
  const mandatory = policies.filter((p) => p.mandatory).length;
  const mandPending = policies.filter(
    (p) => p.mandatory && !p.acknowledged,
  ).length;

  /* Filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...policies]
      .sort((a, b) => {
        // Pinned first
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        // Mandatory + unacknowledged first
        const urgA = a.mandatory && !a.acknowledged ? 0 : 1;
        const urgB = b.mandatory && !b.acknowledged ? 0 : 1;
        if (urgA !== urgB) return urgA - urgB;
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      })
      .filter((p) => {
        if (filterTab === "Pending") return !p.acknowledged;
        if (filterTab === "Acknowledged") return p.acknowledged;
        return true;
      })
      .filter((p) => filterCat === "All" || p.category === filterCat)
      .filter((p) => {
        if (filterMand === "Mandatory") return p.mandatory;
        if (filterMand === "Optional") return !p.mandatory;
        return true;
      })
      .filter(
        (p) =>
          !q ||
          (p.title || "").toLowerCase().includes(q) ||
          (p.summary || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q),
      );
  }, [policies, filterTab, filterCat, filterMand, search]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">My Policies</h1>
          <p className="text-sm text-gray-500 mt-1">
            Read and acknowledge company policies · {new Date().toDateString()}
          </p>
        </div>
        <button
          onClick={fetchPolicies}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 text-xs font-semibold rounded-xl transition disabled:opacity-40 self-start"
        >
          <RefreshCw size={13} className={loading ? "mp-spin" : ""} />
          Refresh
        </button>
      </header>

      {/* Mandatory urgent banner */}
      {mandPending > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {mandPending} mandatory polic{mandPending !== 1 ? "ies" : "y"}{" "}
              need your acknowledgement
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Please read and acknowledge these policies as soon as possible.
            </p>
          </div>
          <button
            onClick={() => {
              setFilterTab("Pending");
              setFilterMand("Mandatory");
            }}
            className="text-xs font-semibold text-red-700 hover:underline shrink-0"
          >
            View now
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button
            onClick={fetchPolicies}
            className="text-xs font-semibold text-red-600 hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Policies",
            value: total,
            icon: FileText,
            color: "bg-blue-50 text-blue-700 border-blue-200",
          },
          {
            label: "Acknowledged",
            value: acknowledged,
            icon: BadgeCheck,
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          },
          {
            label: "Pending",
            value: pending,
            icon: Clock,
            color: "bg-amber-50 text-amber-700 border-amber-200",
          },
          {
            label: "Mandatory",
            value: mandatory,
            icon: AlertTriangle,
            color: "bg-red-50 text-red-700 border-red-200",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`bg-white rounded-2xl p-5 shadow-sm border ${color.split(" ").find((c) => c.startsWith("border-"))}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${color}`}
              >
                <Icon size={16} />
              </div>
              <div>
                <div className="text-xs text-gray-400">{label}</div>
                {loading ? (
                  <div className="h-7 w-10 bg-gray-100 rounded animate-pulse mt-0.5" />
                ) : (
                  <div className="text-2xl font-semibold text-gray-900">
                    {value}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {!loading && total > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Acknowledgement Progress
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {acknowledged}/{total}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-700 bg-linear-to-r from-emerald-400 to-emerald-600"
              style={{
                width: `${total > 0 ? Math.round((acknowledged / total) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>
              {total > 0 ? Math.round((acknowledged / total) * 100) : 0}%
              complete
            </span>
            {mandPending > 0 && (
              <span className="text-red-500 font-medium">
                {mandPending} mandatory pending
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="bg-white rounded-2xl shadow-sm mb-5 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { key: "All", label: "All Policies", count: total },
            { key: "Pending", label: "Pending", count: pending },
            { key: "Acknowledged", label: "Acknowledged", count: acknowledged },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
                filterTab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  filterTab === key
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <Filter size={13} className="text-gray-400" />
          <div className="relative flex-1 min-w-40">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-400"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 cursor-pointer transition text-gray-700"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterMand}
            onChange={(e) => setFilterMand(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 cursor-pointer transition text-gray-700"
          >
            <option value="All">All Types</option>
            <option value="Mandatory">Mandatory</option>
            <option value="Optional">Optional</option>
          </select>
          {(filterCat !== "All" || filterMand !== "All" || search) && (
            <button
              onClick={() => {
                setFilterCat("All");
                setFilterMand("All");
                setSearch("");
              }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              <X size={11} /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {filtered.length} polic{filtered.length !== 1 ? "ies" : "y"}
          </span>
        </div>
      </div>

      {/* Policy List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 size={28} className="mp-spin text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading your policies…</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <FileText size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-400">
              {filterTab === "Acknowledged"
                ? "No acknowledged policies yet"
                : filterTab === "Pending"
                  ? "All caught up! No pending policies."
                  : "No policies found"}
            </p>
            {(filterCat !== "All" || filterMand !== "All" || search) && (
              <button
                onClick={() => {
                  setFilterCat("All");
                  setFilterMand("All");
                  setSearch("");
                }}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onAcknowledge={handleAcknowledge}
            />
          ))}
        </div>
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}
