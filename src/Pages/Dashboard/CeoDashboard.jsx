/**
 * CEODashboard.jsx  —  Executive Overview
 *
 * ── APIs CONNECTED ───────────────────────────────────────────────
 *  GetAllEmployees        GET /employees
 *  ListDepartment         GET /departments
 *  GetAllApplications     GET /applications?limit=8
 *  ApplicationStats       GET /applications/stats
 *  AdminAttendanceSummary GET /attendance/admin/summary?month=YYYY-MM
 *  AdminAttendanceRecords GET /attendance/admin/records?month=YYYY-MM&limit=500
 *  GetAllPolicies         GET /policies?limit=200
 *  PolicyStats            GET /policies/stats
 *  notices                GET /notices?limit=5
 *
 * ── COMING SOON (no backend yet) ────────────────────────────────
 *  Revenue / Financials   — no API
 *  KPI / Performance      — no API
 *  Payroll summary        — no API
 *  Turnover rate          — no API
 *  Recruitment pipeline   — no API
 *
 * ── JWT ─────────────────────────────────────────────────────────
 *  EPI > employee_id > id > sub  →  Employee.id
 *  Level 2 = CEO
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, Building2, TrendingUp, TrendingDown, Activity,
  CheckCircle2, XCircle, Clock, AlertCircle, Loader2,
  Bell, FileText, RefreshCw, Crown, ChevronUp, ChevronDown,
  ThumbsUp, Timer, UserCheck, UserX, Briefcase,
  DollarSign, BarChart2, Target, Zap, Shield,
  Construction, CalendarCheck, Plane, Star,
  ChevronRight, ArrowUpRight, Circle,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Styles ─── */
const _S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  @keyframes ceo-in    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ceo-spin  { to{transform:rotate(360deg)} }
  @keyframes ceo-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes ceo-bar   { from{width:0%} to{width:var(--tw)} }
  @keyframes ceo-num   { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
  @keyframes ceo-shine {
    0%   { background-position: -200% center }
    100% { background-position:  200% center }
  }
  .ceo-page * { font-family:'Sora',sans-serif; box-sizing:border-box; }
  .ceo-mono   { font-family:'DM Mono',monospace; }
  .ceo-in     { animation: ceo-in   .3s cubic-bezier(.4,0,.2,1) both; }
  .ceo-spin   { animation: ceo-spin .9s linear infinite; }
  .ceo-pulse  { animation: ceo-pulse 1.6s ease-in-out infinite; }
  .ceo-num    { animation: ceo-num  .45s cubic-bezier(.34,1.56,.64,1) both; }

  .ceo-stagger > *:nth-child(1) { animation-delay:.04s }
  .ceo-stagger > *:nth-child(2) { animation-delay:.09s }
  .ceo-stagger > *:nth-child(3) { animation-delay:.14s }
  .ceo-stagger > *:nth-child(4) { animation-delay:.19s }
  .ceo-stagger > *:nth-child(5) { animation-delay:.24s }
  .ceo-stagger > *:nth-child(6) { animation-delay:.29s }

  .ceo-card {
    background: #ffffff;
    border-radius: 22px;
    border: 1px solid rgba(0,0,0,.06);
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 6px 20px rgba(0,0,0,.05);
  }
  .ceo-glass {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,.5);
    border-radius: 22px;
  }
  .ceo-row:hover { background: rgba(99,102,241,.035); }

  .ceo-cs {          /* coming-soon stripe */
    background-image: repeating-linear-gradient(
      -45deg, rgba(0,0,0,.025) 0, rgba(0,0,0,.025) 1px,
      transparent 0, transparent 50%
    );
    background-size: 7px 7px;
  }
  .ceo-scroll::-webkit-scrollbar { width:3px; height:3px; }
  .ceo-scroll::-webkit-scrollbar-track { background:transparent; }
  .ceo-scroll::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:99px; }

  .ceo-bar-fill { height:100%; border-radius:99px; transition:width .75s cubic-bezier(.4,0,.2,1); }

  .ceo-ring-track { fill:none; }
  .ceo-ring-fill  { fill:none; transition:stroke-dasharray .8s cubic-bezier(.4,0,.2,1); }
`;

if (typeof document !== "undefined" && !document.getElementById("__ceo_s__")) {
  const el = document.createElement("style");
  el.id = "__ceo_s__";
  el.textContent = _S;
  document.head.appendChild(el);
}

/* ─── JWT ─── */
function getAuth() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p   = JSON.parse(atob(raw));
    const idRaw = p.EPI ?? p.employee_id ?? p.id ?? p.sub;
    return {
      id:   Number(idRaw),
      name: p.name ?? p.full_name ?? p.username ?? "CEO",
      level: p.level ?? 2,
    };
  } catch { return null; }
}

/* ─── Helpers ─── */
const CURR_MONTH = new Date().toISOString().slice(0, 7);
const PREV_MONTH = (() => {
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();
const MONTH_LABEL = new Date().toLocaleString("default", { month: "long", year: "numeric" });

function pct(n, t)  { return t ? Math.round((n / t) * 100) : 0; }
function fmtN(n)    { return n == null ? "—" : Number(n).toLocaleString(); }
function fmtPct(n)  { return n == null ? "—" : `${Math.round(n)}%`; }

/* ─── Colour palettes ─── */
const DEPT_COLORS = [
  "#6366f1","#7c3aed","#0ea5e9","#10b981",
  "#f59e0b","#f87171","#ec4899","#14b8a6",
];

const APP_STATUS_CLR = {
  Pending:      { bg: "#7c3aed", light: "bg-violet-100 text-violet-700" },
  HOD_Approved: { bg: "#0ea5e9", light: "bg-sky-100 text-sky-700"       },
  HOD_Rejected: { bg: "#f97316", light: "bg-orange-100 text-orange-700" },
  Approved:     { bg: "#10b981", light: "bg-emerald-100 text-emerald-700"},
  Rejected:     { bg: "#f87171", light: "bg-red-100 text-red-700"       },
};

const ATT_CLR = { Present:"#10b981", Late:"#f59e0b", Early:"#38bdf8", Absent:"#f87171", Leave:"#94a3b8" };

/* ─── Shared primitives ─── */
function InlineBar({ value, max, color }) {
  const w = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
      <div className="ceo-bar-fill h-full rounded-full" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

function DonutRing({ segments, size = 100, stroke = 14, centerLabel, centerSub }) {
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const cx    = size / 2, cy = size / 2;
  let   off   = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        {segments.map(({ value, color }, i) => {
          const dash = (value / 100) * circ;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r}
              className="ceo-ring-fill"
              stroke={color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-(off / 100) * circ}
            />
          );
          off += value;
          return el;
        })}
        <circle cx={cx} cy={cy} r={r} className="ceo-ring-track"
          stroke="#f1f5f9" strokeWidth={stroke}
          strokeDasharray={`${((100 - off) / 100) * circ} ${(off / 100) * circ}`}
          strokeDashoffset={-(off / 100) * circ}
        />
      </svg>
      {(centerLabel || centerSub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && <p className="text-xl font-extrabold text-gray-900 ceo-mono leading-none">{centerLabel}</p>}
          {centerSub   && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{centerSub}</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Coming Soon card ─── */
function ComingSoon({ title, icon: Icon, iconColor, description, height = "h-48" }) {
  return (
    <div className="ceo-card relative overflow-hidden">
      <div className="absolute inset-0 ceo-cs" />
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <Construction size={9} /> Coming Soon
          </span>
        </div>
        <div className={`flex flex-col items-center justify-center gap-3 ${height}`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${iconColor}`}>
            <Icon size={22} className="opacity-60" />
          </div>
          <p className="text-sm text-gray-400 text-center max-w-[200px] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI tile ─── */
function KPI({ label, value, sub, Icon, grad, loading, delta, deltaLabel }) {
  const up = delta != null && delta >= 0;
  return (
    <div className="ceo-card px-5 py-5 flex items-start justify-between gap-3 ceo-in">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
        {loading
          ? <div className="h-9 w-24 bg-gray-100 rounded-xl animate-pulse" />
          : <p className="text-3xl font-extrabold text-gray-900 ceo-num ceo-mono leading-none">{value}</p>}
        {sub && !loading && <p className="text-[11px] text-gray-400 mt-2">{sub}</p>}
        {delta != null && !loading && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${up ? "text-emerald-600" : "text-red-500"}`}>
            {up ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {Math.abs(delta)}% {deltaLabel || "vs last month"}
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${grad}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  );
}

/* ─── Attendance heatmap strip ─── */
function HeatmapStrip({ records, loading }) {
  const [tip, setTip] = useState(null);

  const cells = useMemo(() => {
    const map = {};
    records.forEach(r => { map[r.date] = r; });
    const today = new Date(); today.setHours(12);
    const out = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      out.push({ date: iso, rec: map[iso], isWkd: [0,6].includes(d.getDay()) });
    }
    return out;
  }, [records]);

  if (loading) return (
    <div className="h-16 flex items-center justify-center">
      <Loader2 size={16} className="ceo-spin text-gray-300" />
    </div>
  );

  const C = 11, G = 2;
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="relative">
      <div className="overflow-x-auto ceo-scroll pb-1">
        <svg width={weeks.length * (C + G)} height={7 * (C + G)} style={{ display: "block" }}>
          {weeks.map((wk, wi) => wk.map((day, di) => {
            const fill = day.isWkd ? "#f1f5f9" : day.rec ? (ATT_CLR[day.rec.status] || "#e2e8f0") : "#e8edf2";
            return (
              <rect key={day.date} x={wi*(C+G)} y={di*(C+G)} width={C} height={C} rx={2}
                fill={fill}
                style={{ cursor: day.rec ? "pointer" : "default" }}
                onMouseEnter={e => day.rec && setTip({ x: e.clientX, y: e.clientY, ...day })}
                onMouseLeave={() => setTip(null)}
              />
            );
          }))}
        </svg>
      </div>
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {Object.entries(ATT_CLR).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1 text-[10px] text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} /> {s}
          </span>
        ))}
      </div>
      {tip && (
        <div className="fixed z-[500] pointer-events-none ceo-card px-3 py-2 text-xs shadow-xl"
          style={{ left: tip.x + 14, top: tip.y - 8 }}>
          <p className="font-bold text-gray-800">{tip.date}</p>
          <p className="font-semibold mt-0.5" style={{ color: ATT_CLR[tip.rec?.status] }}>{tip.rec?.status}</p>
          {tip.rec?.in_time  && <p className="text-gray-400">In:  {tip.rec.in_time}</p>}
          {tip.rec?.out_time && <p className="text-gray-400">Out: {tip.rec.out_time}</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Application status mini-bar ─── */
function AppBreakdownBar({ stats, loading }) {
  if (loading) return <div className="h-6 bg-gray-100 rounded-full animate-pulse" />;
  if (!stats || !stats.total) return <p className="text-sm text-gray-300 text-center py-2">No data</p>;

  const segments = [
    { key: "approved",     label: "Approved",     color: "#10b981" },
    { key: "hod_approved", label: "HOD Approved",  color: "#0ea5e9" },
    { key: "pending",      label: "Pending",       color: "#7c3aed" },
    { key: "hod_rejected", label: "HOD Rejected",  color: "#f97316" },
    { key: "rejected",     label: "Rejected",      color: "#f87171" },
  ].map(s => ({ ...s, val: stats[s.key] || 0, pct: pct(stats[s.key] || 0, stats.total) }))
   .filter(s => s.val > 0);

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden">
        {segments.map(s => (
          <div key={s.key} style={{ width: `${s.pct}%`, background: s.color }}
            className="transition-all duration-700" title={`${s.label}: ${s.val}`} />
        ))}
      </div>
      {/* Legend rows */}
      <div className="space-y-1.5">
        {segments.map(s => (
          <div key={s.key} className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-500 flex-1">{s.label}</span>
            <InlineBar value={s.val} max={stats.total} color={s.color} />
            <span className="text-xs font-bold text-gray-700 ceo-mono w-6 text-right">{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Dashboard
═══════════════════════════════════════════════════════════════ */
export default function CEODashboard() {
  const auth  = useMemo(() => getAuth(), []);
  const token = localStorage.getItem("access_token");
  const H     = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  /* ─── Data state ─── */
  const [employees,    setEmployees]    = useState([]);
  const [departments,  setDepts]        = useState([]);
  const [appStats,     setAppStats]     = useState(null);
  const [recentApps,   setRecentApps]   = useState([]);
  const [attSummary,   setAttSummary]   = useState(null);
  const [attSummaryPrev, setAttSummaryPrev] = useState(null);
  const [attRecords,   setAttRecords]   = useState([]);
  const [policies,     setPolicies]     = useState([]);
  const [policyStats,  setPolicyStats]  = useState(null);
  const [notices,      setNotices]      = useState([]);

  /* ─── Loading ─── */
  const [empLoad,  setEmpLoad]  = useState(true);
  const [appLoad,  setAppLoad]  = useState(true);
  const [attLoad,  setAttLoad]  = useState(true);
  const [polLoad,  setPolLoad]  = useState(true);
  const [notLoad,  setNotLoad]  = useState(true);

  const g = useCallback(async (url, setter, onDone, transform) => {
    try {
      const res = await fetch(url, { headers: H });
      if (!res.ok) return;
      const d = await res.json();
      setter(transform ? transform(d) : d);
    } catch { /* silent */ }
    finally { onDone?.(); }
  }, [H]);

  const fetchAll = useCallback(() => {
    /* Employees + departments */
    setEmpLoad(true);
    Promise.all([
      fetch(API.GetAllEmployees, { headers: H }),
      fetch(API.ListDepartment,  { headers: H }),
    ]).then(async ([er, dr]) => {
      if (er.ok) setEmployees(await er.json().then(d => Array.isArray(d) ? d : d.employees || []));
      if (dr.ok) setDepts(await dr.json().then(d => Array.isArray(d) ? d : d.departments || []));
    }).catch(() => {}).finally(() => setEmpLoad(false));

    /* Applications */
    setAppLoad(true);
    Promise.all([
      fetch(API.ApplicationStats, { headers: H }),
      fetch(`${API.GetAllApplications}?limit=8`, { headers: H }),
    ]).then(async ([sr, lr]) => {
      if (sr.ok) setAppStats(await sr.json());
      if (lr.ok) {
        const d = await lr.json();
        setRecentApps(Array.isArray(d) ? d.slice(0, 8) : (d.items || []).slice(0, 8));
      }
    }).catch(() => {}).finally(() => setAppLoad(false));

    /* Attendance — current + previous month for trend */
    setAttLoad(true);
    const attBase = `${API.AllAttendance}/admin`;
    Promise.all([
      fetch(`${attBase}/summary?month=${CURR_MONTH}`, { headers: H }),
      fetch(`${attBase}/summary?month=${PREV_MONTH}`, { headers: H }),
      fetch(`${attBase}/records?month=${CURR_MONTH}&limit=500`, { headers: H }),
    ]).then(async ([cur, prv, rec]) => {
      if (cur.ok) setAttSummary(await cur.json());
      if (prv.ok) setAttSummaryPrev(await prv.json());
      if (rec.ok) {
        const d = await rec.json();
        setAttRecords(Array.isArray(d) ? d : d.records || []);
      }
    }).catch(() => {}).finally(() => setAttLoad(false));

    /* Policies */
    setPolLoad(true);
    Promise.all([
      fetch(`${API.GetAllPolicies}?limit=200`, { headers: H }),
      fetch(API.PolicyStats, { headers: H }),
    ]).then(async ([pr, sr]) => {
      if (pr.ok) setPolicies(await pr.json().then(d => Array.isArray(d) ? d : d.policies || []));
      if (sr.ok) setPolicyStats(await sr.json());
    }).catch(() => {}).finally(() => setPolLoad(false));

    /* Notices */
    g(`${API.notices}?limit=5`, setNotices, () => setNotLoad(false),
      d => Array.isArray(d) ? d : d.notices || []);
  }, [H, g]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── Derived ─── */
  const activeEmps   = employees.filter(e => !e.is_deleted && e.employment_status === "active");
  const totalEmps    = employees.filter(e => !e.is_deleted).length;

  /* Attendance trend delta */
  const attDelta = useMemo(() => {
    if (!attSummary?.rate || !attSummaryPrev?.rate) return null;
    return Math.round((attSummary.rate - attSummaryPrev.rate) * 10) / 10;
  }, [attSummary, attSummaryPrev]);

  /* Dept headcount */
  const deptHeadcount = useMemo(() =>
    departments.map((d, i) => ({
      ...d,
      count: employees.filter(e => !e.is_deleted && e.department_id === d.id).length,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count),
  [departments, employees]);

  /* Policy compliance */
  const polCompliance = useMemo(() => {
    if (!policyStats) return null;
    return Math.round(policyStats.avg_ack_rate ?? 0);
  }, [policyStats]);

  /* Attendance donut */
  const attDonut = useMemo(() => {
    if (!attSummary) return [];
    const t = attSummary.total_records || 1;
    return [
      { value: pct(attSummary.present || 0, t), color: "#10b981" },
      { value: pct(attSummary.late    || 0, t), color: "#f59e0b" },
      { value: pct(attSummary.early   || 0, t), color: "#38bdf8" },
      { value: pct(attSummary.absent  || 0, t), color: "#f87171" },
    ].filter(s => s.value > 0);
  }, [attSummary]);

  /* Greeting */
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (auth?.name || "CEO").split(" ")[0];
  const anyLoad  = empLoad || attLoad || appLoad || polLoad;

  return (
    <div className="ceo-page min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-5 sm:px-8 py-8">

      {/* ══ Header ══ */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ceo-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-200/60">
              <Crown size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {greeting}, {firstName}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Executive Overview · {new Date().toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 self-start">
          {/* Month badge */}
          <span className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-semibold text-indigo-700 ceo-mono">
            {MONTH_LABEL}
          </span>
          <button onClick={fetchAll} disabled={anyLoad}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-500 text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-40">
            <RefreshCw size={13} className={anyLoad ? "ceo-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* ══ Row 1 — 6 KPI tiles ══ */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5 ceo-stagger">
        <KPI label="Total Headcount"  value={fmtN(totalEmps)}       sub="All employees"               Icon={Users}        grad="bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-200/60"   loading={empLoad} />
        <KPI label="Active Staff"     value={fmtN(activeEmps.length)} sub={`${pct(activeEmps.length, totalEmps || 1)}% of total`} Icon={UserCheck} grad="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200/60" loading={empLoad} />
        <KPI label="Departments"      value={fmtN(departments.length)} sub="Org structure"             Icon={Building2}    grad="bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-200/60"           loading={empLoad} />
        <KPI label="Attendance Rate"  value={fmtPct(attSummary?.rate)} sub={MONTH_LABEL}              Icon={Activity}     grad="bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-200/60"      loading={attLoad} delta={attDelta} />
        <KPI label="Pending Apps"     value={fmtN(appStats?.pending)}  sub="Awaiting approval"         Icon={Timer}        grad="bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-violet-200/60"  loading={appLoad} />
        <KPI label="Policy Compliance" value={fmtPct(polCompliance)} sub={`${policyStats?.active ?? "—"} active policies`} Icon={Shield} grad="bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-200/60" loading={polLoad} />
      </section>

      {/* ══ Row 2 — Attendance donut + Dept breakdown + App breakdown ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Attendance donut */}
        <div className="ceo-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">Attendance Breakdown</p>
            <span className="text-[10px] text-gray-400 ceo-mono">{MONTH_LABEL}</span>
          </div>
          {attLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="ceo-spin text-gray-300" /></div>
          ) : attSummary ? (
            <div className="flex flex-col items-center gap-5">
              <DonutRing
                segments={attDonut}
                size={130}
                stroke={20}
                centerLabel={`${Math.round(attSummary.rate ?? 0)}%`}
                centerSub="Rate"
              />
              <div className="w-full space-y-2">
                {[
                  { label: "Present", val: attSummary.present || 0, color: "#10b981" },
                  { label: "Late",    val: attSummary.late    || 0, color: "#f59e0b" },
                  { label: "Early",   val: attSummary.early   || 0, color: "#38bdf8" },
                  { label: "Absent",  val: attSummary.absent  || 0, color: "#f87171" },
                  { label: "Leave",   val: attSummary.leave   || 0, color: "#94a3b8" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs text-gray-500 w-14">{label}</span>
                    <InlineBar value={val} max={attSummary.total_records || 1} color={color} />
                    <span className="text-xs font-bold text-gray-700 ceo-mono w-8 text-right">{val}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                {fmtN(attSummary.total_employees)} employees · {fmtN(attSummary.total_records)} records
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No attendance data</p>
            </div>
          )}
        </div>

        {/* Department headcount */}
        <div className="ceo-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">Headcount by Department</p>
            <span className="text-[10px] text-gray-400">{totalEmps} total</span>
          </div>
          {empLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="ceo-spin text-gray-300" /></div>
          ) : deptHeadcount.length > 0 ? (
            <div className="space-y-3">
              {deptHeadcount.slice(0, 8).map(d => (
                <div key={d.id} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-600 font-medium w-28 truncate">{d.department}</span>
                  <InlineBar value={d.count} max={deptHeadcount[0].count} color={d.color} />
                  <span className="text-xs font-extrabold text-gray-800 ceo-mono w-6 text-right">{d.count}</span>
                  <span className="text-[10px] text-gray-400 w-8 text-right">{pct(d.count, totalEmps)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No department data</p>
            </div>
          )}
        </div>

        {/* Application status breakdown */}
        <div className="ceo-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">Application Status</p>
            {!appLoad && appStats && (
              <span className="text-[10px] font-semibold ceo-mono text-gray-400">{appStats.total} total</span>
            )}
          </div>
          <AppBreakdownBar stats={appStats} loading={appLoad} />

          {/* Quick stat row */}
          {!appLoad && appStats && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: "Approved",  val: appStats.approved || 0,    cls: "bg-emerald-50 text-emerald-700" },
                { label: "Pending",   val: appStats.pending  || 0,    cls: "bg-violet-50 text-violet-700"   },
                { label: "Rejected",  val: (appStats.rejected || 0) + (appStats.hod_rejected || 0), cls: "bg-red-50 text-red-700" },
                { label: "HOD Apprvd",val: appStats.hod_approved || 0, cls: "bg-sky-50 text-sky-700"        },
              ].map(({ label, val, cls }) => (
                <div key={label} className={`rounded-xl px-3 py-2.5 text-center ${cls}`}>
                  <p className="text-xl font-extrabold ceo-mono leading-none">{val}</p>
                  <p className="text-[10px] font-semibold mt-0.5 opacity-80">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ Row 3 — Heatmap + Policy compliance ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Org attendance heatmap */}
        <div className="ceo-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">Organisation Attendance — Last 90 Days</p>
            <span className="text-[10px] text-gray-400">{attRecords.length} records</span>
          </div>
          <HeatmapStrip records={attRecords} loading={attLoad} />
        </div>

        {/* Policy compliance */}
        <div className="ceo-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">Policy Compliance</p>
            {!polLoad && policyStats && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                polCompliance >= 80 ? "bg-emerald-100 text-emerald-700" :
                polCompliance >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
              }`}>{polCompliance}%</span>
            )}
          </div>
          {polLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="ceo-spin text-gray-300" /></div>
          ) : policyStats ? (
            <div>
              {/* Compliance ring */}
              <div className="flex items-center justify-center mb-4">
                <DonutRing
                  segments={[{ value: polCompliance, color: polCompliance >= 80 ? "#10b981" : polCompliance >= 60 ? "#f59e0b" : "#f87171" }]}
                  size={110} stroke={16}
                  centerLabel={`${polCompliance}%`}
                  centerSub="Ack'd"
                />
              </div>
              {/* Counts */}
              <div className="space-y-2">
                {[
                  { label: "Active",    val: policyStats.active   || 0, color: "#10b981" },
                  { label: "Draft",     val: policyStats.draft    || 0, color: "#94a3b8" },
                  { label: "Review",    val: policyStats.review   || 0, color: "#f59e0b" },
                  { label: "Archived",  val: policyStats.archived || 0, color: "#f87171" },
                  { label: "Mandatory", val: policyStats.mandatory|| 0, color: "#7c3aed" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs text-gray-500 flex-1">{label}</span>
                    <span className="text-xs font-bold ceo-mono text-gray-800">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Shield size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No policy data</p>
            </div>
          )}
        </div>
      </div>

      {/* ══ Row 4 — Recent applications + Notices ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Recent applications table */}
        <div className="ceo-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">Recent Applications</p>
            {!appLoad && <span className="text-[10px] text-gray-400 ceo-mono">{recentApps.length} shown</span>}
          </div>
          {appLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="ceo-spin text-gray-300" /></div>
          ) : recentApps.length > 0 ? (
            <div className="overflow-x-auto ceo-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Employee", "Type", "Status", "Date"].map((h, i) => (
                      <th key={h} className={`py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${i === 0 ? "text-left" : "text-center"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map(a => {
                    const sc = APP_STATUS_CLR[a.status] || { light: "bg-gray-100 text-gray-600" };
                    const TypeIcon = a.type === "Travel" ? Plane : a.type === "Reimbursement" ? DollarSign : FileText;
                    return (
                      <tr key={a.id} className="ceo-row border-b border-gray-50 last:border-0 transition-colors">
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <img src={a.employee_image || `https://i.pravatar.cc/150?u=${a.employee_id}`}
                              className="w-6 h-6 rounded-full object-cover border border-gray-100 shrink-0" alt="" />
                            <p className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">
                              {a.employee_name || `#${a.employee_id}`}
                            </p>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">
                            <TypeIcon size={9} /> {a.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.light}`}>
                            {(a.status || "").replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-xs text-gray-400 ceo-mono whitespace-nowrap">{a.from_date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No recent applications</p>
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="ceo-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">Notice Board</p>
            {!notLoad && notices.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">{notices.length}</span>
            )}
          </div>
          {notLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={18} className="ceo-spin text-gray-300" /></div>
          ) : notices.length > 0 ? (
            <div className="space-y-2.5">
              {notices.map((n, i) => (
                <div key={n.id ?? i} className="flex items-start gap-2.5 bg-gray-50 rounded-2xl px-3.5 py-3">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={12} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
                      {n.title || n.message || n.content || "Notice"}
                    </p>
                    {n.created_at && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Bell size={20} className="text-indigo-400" />
              </div>
              <p className="text-sm text-gray-400">No notices yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ══ Row 5 — Employee status breakdown + Coming Soon trio ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

        {/* Employment status breakdown */}
        <div className="ceo-card p-5">
          <p className="text-sm font-semibold text-gray-600 mb-4">Workforce Status</p>
          {empLoad ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={18} className="ceo-spin text-gray-300" /></div>
          ) : (
            <div className="space-y-2.5">
              {[
                { label: "Active",     count: employees.filter(e => !e.is_deleted && e.employment_status === "active").length,     color: "#10b981", cls: "bg-emerald-50 text-emerald-700" },
                { label: "Inactive",   count: employees.filter(e => !e.is_deleted && e.employment_status === "inactive").length,   color: "#f87171", cls: "bg-red-50 text-red-600"         },
                { label: "Resigned",   count: employees.filter(e => !e.is_deleted && e.employment_status === "resigned").length,   color: "#f59e0b", cls: "bg-amber-50 text-amber-700"     },
                { label: "Terminated", count: employees.filter(e => !e.is_deleted && e.employment_status === "terminated").length, color: "#94a3b8", cls: "bg-slate-50 text-slate-600"     },
              ].map(({ label, count, color, cls }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs text-gray-500 truncate">{label}</span>
                  </div>
                  <InlineBar value={count} max={totalEmps || 1} color={color} />
                  <span className={`text-[10px] font-bold ml-2 px-2 py-0.5 rounded-full shrink-0 ${cls}`}>{count}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-50 flex justify-between text-xs">
                <span className="text-gray-400">Total headcount</span>
                <span className="font-extrabold text-gray-800 ceo-mono">{totalEmps}</span>
              </div>
            </div>
          )}
        </div>

        {/* Coming Soon — Revenue / P&L */}
        <ComingSoon
          title="Revenue & P&L"
          icon={DollarSign}
          iconColor="bg-emerald-100 text-emerald-600"
          description="Financial performance, revenue trends, and P&L summary will appear here."
        />

        {/* Coming Soon — KPI / Performance */}
        <ComingSoon
          title="KPI & Performance"
          icon={Target}
          iconColor="bg-indigo-100 text-indigo-600"
          description="Individual and department KPI scores, ratings, and goal completion."
        />

        {/* Coming Soon — Payroll */}
        <ComingSoon
          title="Payroll Overview"
          icon={Briefcase}
          iconColor="bg-violet-100 text-violet-600"
          description="Monthly payroll totals, cost per department, and salary distribution."
        />
      </div>

      {/* ══ Row 6 — Turnover + Recruitment + Training ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ComingSoon
          title="Turnover & Retention"
          icon={TrendingDown}
          iconColor="bg-rose-100 text-rose-600"
          description="Monthly turnover rate, voluntary vs involuntary exits, and retention trends."
        />
        <ComingSoon
          title="Recruitment Pipeline"
          icon={UserCheck}
          iconColor="bg-sky-100 text-sky-600"
          description="Open roles, candidates in pipeline, time-to-hire metrics, and offer acceptance rate."
        />
        <ComingSoon
          title="Training & Learning"
          icon={Star}
          iconColor="bg-amber-100 text-amber-600"
          description="Training completion rates, mandatory compliance, and learning hours logged."
        />
      </div>

    </div>
  );
}