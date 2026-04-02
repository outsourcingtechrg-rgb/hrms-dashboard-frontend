/**
 * SuperAdminDashboard.jsx
 *
 * ── APIs consumed ────────────────────────────────────────────────
 *  GetAllEmployees        GET /employees
 *  ListDepartment         GET /departments
 *  AllRoles               GET /roles
 *  ListShifts             GET /shifts
 *  GetAllApplications     GET /applications
 *  ApplicationStats       GET /applications/stats
 *  AllAttendance          GET /attendance          ← org-wide raw (admin)
 *  AdminAttendanceRecords GET /attendance/admin/records?month=YYYY-MM
 *  AdminAttendanceSummary GET /attendance/admin/summary?month=YYYY-MM
 *  notices                GET /notices
 *
 * ── JWT ─────────────────────────────────────────────────────────
 *  EPI > employee_id > id > sub  →  Employee.id
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, Building2, Shield, Clock, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, AlertCircle, Loader2, Bell,
  FileText, Plane, DollarSign, CalendarCheck, RefreshCw,
  Crown, ChevronRight, Activity, Zap, UserCheck,
  ThumbsUp, BarChart2, Briefcase, UserX, Construction,
  Timer, ChevronUp, ChevronDown,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Styles ─── */
const _S = `
  @keyframes sa-in   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sa-spin { to{transform:rotate(360deg)} }
  @keyframes sa-bar  { from{width:0} to{width:var(--w)} }
  @keyframes sa-num  { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }

  .sa-in     { animation:sa-in  .28s cubic-bezier(.4,0,.2,1) both; }
  .sa-spin   { animation:sa-spin .9s linear infinite; }
  .sa-num    { animation:sa-num .4s cubic-bezier(.4,0,.2,1) both; }
  .sa-stagger>*:nth-child(1){animation-delay:.03s}
  .sa-stagger>*:nth-child(2){animation-delay:.07s}
  .sa-stagger>*:nth-child(3){animation-delay:.11s}
  .sa-stagger>*:nth-child(4){animation-delay:.15s}
  .sa-stagger>*:nth-child(5){animation-delay:.19s}
  .sa-stagger>*:nth-child(6){animation-delay:.23s}
  .sa-stagger>*:nth-child(7){animation-delay:.27s}
  .sa-stagger>*:nth-child(8){animation-delay:.31s}
  .sa-card{background:#fff;border-radius:20px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.05);}
  .sa-row:hover{background:rgba(99,102,241,.04)}
  .sa-scroll::-webkit-scrollbar{width:4px;height:4px}
  .sa-scroll::-webkit-scrollbar-track{background:transparent}
  .sa-scroll::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:99px}
  .sa-bar-fill{height:100%;border-radius:99px;transition:width .7s cubic-bezier(.4,0,.2,1)}
`;
if (typeof document !== "undefined" && !document.getElementById("__sa_s__")) {
  const el = document.createElement("style"); el.id = "__sa_s__"; el.textContent = _S;
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
      id:    Number(idRaw),
      name:  p.name ?? p.full_name ?? p.username ?? "Admin",
      level: p.level ?? 1,
    };
  } catch { return null; }
}

/* ─── Helpers ─── */
const CURR_MONTH = new Date().toISOString().slice(0, 7);
const PREV_MONTH = (() => {
  const d = new Date(); d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

function pct(n, t) { return t ? Math.round((n / t) * 100) : 0; }
function fmtNum(n)  { return n == null ? "—" : Number(n).toLocaleString(); }

const STATUS_CLR = {
  Present:      { bg: "#10b981", pill: "bg-emerald-100 text-emerald-700" },
  Late:         { bg: "#f59e0b", pill: "bg-amber-100 text-amber-700"     },
  Early:        { bg: "#38bdf8", pill: "bg-sky-100 text-sky-700"         },
  Absent:       { bg: "#f87171", pill: "bg-red-100 text-red-700"         },
  Leave:        { bg: "#94a3b8", pill: "bg-slate-100 text-slate-600"     },
};

const APP_CLR = {
  Pending:      "bg-violet-100 text-violet-700",
  HOD_Approved: "bg-sky-100 text-sky-700",
  HOD_Rejected: "bg-orange-100 text-orange-700",
  Approved:     "bg-emerald-100 text-emerald-700",
  Rejected:     "bg-red-100 text-red-700",
};

/* ─── Shared Card wrapper ─── */
function Card({ title, action, children, className = "" }) {
  return (
    <div className={`sa-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-600">{title}</p>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

/* ─── KPI tile ─── */
function KPI({ label, value, sub, Icon, grad, loading, trend, trendVal }) {
  return (
    <div className="sa-card px-5 py-5 flex items-start justify-between gap-3 sa-in">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        {loading
          ? <div className="h-8 w-20 bg-gray-100 rounded-xl animate-pulse mt-1" />
          : <p className="text-3xl font-extrabold text-gray-900 sa-num leading-none">{fmtNum(value)}</p>}
        {sub && !loading && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
        {trendVal != null && !loading && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${trendVal >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trendVal >= 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {Math.abs(trendVal)}% vs last month
          </div>
        )}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${grad}`}>
        <Icon size={19} className="text-white" />
      </div>
    </div>
  );
}

/* ─── Donut ring (pure SVG) ─── */
function DonutRing({ segments, size = 80, stroke = 12 }) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx  = size / 2, cy = size / 2;
  let offset = 0;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {segments.map(({ value, color }, i) => {
        const dash = (value / 100) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset * circ / 100}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray .7s cubic-bezier(.4,0,.2,1)" }}
          />
        );
        offset += value;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke}
        strokeDasharray={`${(100 - offset) * circ / 100} ${offset * circ / 100}`}
        strokeDashoffset={-offset * circ / 100}
      />
    </svg>
  );
}

/* ─── Heatmap strip (last 90 days) ─── */
const HM_COLORS = { Present:"#10b981", Late:"#f59e0b", Early:"#38bdf8", Absent:"#f87171", Leave:"#94a3b8" };

function HeatmapStrip({ records, loading }) {
  const [tip, setTip] = useState(null);

  const cells = useMemo(() => {
    const map = {};
    records.forEach(r => { map[r.date] = r; });
    const today = new Date(); today.setHours(12);
    const result = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const dow = d.getDay();
      const rec = map[iso];
      result.push({ date: iso, rec, isWkd: dow === 0 || dow === 6 });
    }
    return result;
  }, [records]);

  if (loading) return (
    <div className="h-20 flex items-center justify-center">
      <Loader2 size={18} className="sa-spin text-gray-300" />
    </div>
  );

  const CELL = 11, GAP = 2, ROWS = 7;
  const cols = Math.ceil(cells.length / ROWS);
  const svgW = cols * (CELL + GAP);
  const svgH = ROWS * (CELL + GAP);

  /* group into columns of 7 */
  const weeks = [];
  for (let i = 0; i < cells.length; i += ROWS) weeks.push(cells.slice(i, i + ROWS));

  return (
    <div className="relative">
      <div className="overflow-x-auto sa-scroll pb-1">
        <svg width={svgW} height={svgH} style={{ display: "block" }}>
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const color = day.isWkd ? "#f1f5f9" : day.rec ? (HM_COLORS[day.rec.status] || "#e2e8f0") : "#e2e8f0";
              const x = wi * (CELL + GAP), y = di * (CELL + GAP);
              return (
                <rect key={day.date} x={x} y={y} width={CELL} height={CELL} rx={2} fill={color}
                  style={{ cursor: day.rec ? "pointer" : "default" }}
                  onMouseEnter={e => day.rec && setTip({ x: e.clientX, y: e.clientY, ...day })}
                  onMouseLeave={() => setTip(null)}
                />
              );
            })
          )}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {Object.entries(HM_COLORS).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1 text-[10px] text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} /> {s}
          </span>
        ))}
      </div>
      {/* Tooltip */}
      {tip && (
        <div className="fixed z-[500] pointer-events-none sa-card px-3 py-2 text-xs shadow-xl"
          style={{ left: tip.x + 12, top: tip.y - 8 }}>
          <p className="font-bold text-gray-800">{tip.date}</p>
          <p className="font-semibold mt-0.5" style={{ color: HM_COLORS[tip.rec?.status] || "#94a3b8" }}>
            {tip.rec?.status}
          </p>
          {tip.rec?.in_time  && <p className="text-gray-400">In:  {tip.rec.in_time}</p>}
          {tip.rec?.out_time && <p className="text-gray-400">Out: {tip.rec.out_time}</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Inline bar ─── */
function InlineBar({ value, max, color = "#6366f1" }) {
  const w = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div className="sa-bar-fill h-full rounded-full" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════════════ */
export default function SuperAdminDashboard() {
  const auth = useMemo(() => getAuth(), []);
  const token = localStorage.getItem("access_token");
  const H = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  /* ─── Data state ─── */
  const [employees,   setEmployees]   = useState([]);
  const [departments, setDepts]       = useState([]);
  const [roles,       setRoles]       = useState([]);
  const [shifts,      setShifts]      = useState([]);
  const [appStats,    setAppStats]    = useState(null);
  const [recentApps,  setRecentApps]  = useState([]);
  const [attSummary,  setAttSummary]  = useState(null);
  const [attRecords,  setAttRecords]  = useState([]);
  const [notices,     setNotices]     = useState([]);

  /* ─── Loading flags ─── */
  const [empLoad,  setEmpLoad]  = useState(true);
  const [deptLoad, setDeptLoad] = useState(true);
  const [roleLoad, setRoleLoad] = useState(true);
  const [shiftLoad,setShiftLoad]= useState(true);
  const [appLoad,  setAppLoad]  = useState(true);
  const [attLoad,  setAttLoad]  = useState(true);
  const [notLoad,  setNotLoad]  = useState(true);

  /* ─── Fetch helpers ─── */
  const g = useCallback(async (url, setter, setLoad, transform) => {
    try {
      const res = await fetch(url, { headers: H });
      if (!res.ok) return;
      const d = await res.json();
      setter(transform ? transform(d) : d);
    } catch { /* silent */ }
    finally { setLoad && setLoad(false); }
  }, [H]);

  const fetchAll = useCallback(() => {
    /* Employees */
    g(API.GetAllEmployees, setEmployees, setEmpLoad, d => Array.isArray(d) ? d : d.employees || []);

    /* Departments */
    g(API.ListDepartment,  setDepts, setDeptLoad, d => Array.isArray(d) ? d : d.departments || []);

    /* Roles */
    g(API.AllRoles, setRoles, setRoleLoad, d => Array.isArray(d) ? d : d.roles || []);

    /* Shifts */
    g(API.ListShifts, setShifts, setShiftLoad, d => Array.isArray(d) ? d : d.shifts || []);

    /* Applications — stats + recent */
    setAppLoad(true);
    Promise.all([
      fetch(API.ApplicationStats, { headers: H }),
      fetch(`${API.GetAllApplications}?limit=6`, { headers: H }),
    ]).then(async ([sr, lr]) => {
      if (sr.ok) setAppStats(await sr.json());
      if (lr.ok) {
        const d = await lr.json();
        setRecentApps(Array.isArray(d) ? d.slice(0,6) : (d.items || []).slice(0,6));
      }
    }).catch(() => {}).finally(() => setAppLoad(false));

    /* Attendance — summary + records for heatmap */
    setAttLoad(true);
    const attBase = typeof API.AdminAttendanceSummary === "function"
      ? `${(API.AllAttendance || "").replace(/\/attendance$/, "")}/attendance/admin/summary?month=${CURR_MONTH}`
      : `${API.AllAttendance}/admin/summary?month=${CURR_MONTH}`;

    const attRecBase = typeof API.AllAttendance === "string"
      ? `${API.AllAttendance}/admin/records?month=${CURR_MONTH}&limit=500`
      : null;

    Promise.all([
      fetch(attBase, { headers: H }).catch(() => null),
      attRecBase ? fetch(attRecBase, { headers: H }).catch(() => null) : Promise.resolve(null),
    ]).then(async ([sr, rr]) => {
      if (sr?.ok) setAttSummary(await sr.json());
      if (rr?.ok) {
        const d = await rr.json();
        setAttRecords(Array.isArray(d) ? d : d.records || []);
      }
    }).catch(() => {}).finally(() => setAttLoad(false));

    /* Notices */
    g(API.notices, setNotices, setNotLoad, d => Array.isArray(d) ? d.slice(0,5) : (d.notices || []).slice(0,5));

  }, [g, H]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── Derived values ─── */
  const activeEmps   = employees.filter(e => !e.is_deleted && e.employment_status === "active");
  const inactiveEmps = employees.filter(e => !e.is_deleted && e.employment_status !== "active");
  const totalEmps    = employees.filter(e => !e.is_deleted).length;

  /* Dept breakdown */
  const deptBreakdown = useMemo(() => {
    if (!departments.length) return [];
    return departments.map(d => {
      const count = employees.filter(e => !e.is_deleted && e.department_id === d.id).length;
      return { ...d, count };
    }).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [departments, employees]);

  /* Attendance donut */
  const attDonut = useMemo(() => {
    if (!attSummary) return [];
    const t = attSummary.total_records || 1;
    return [
      { label: "Present", value: pct(attSummary.present || 0, t), color: "#10b981" },
      { label: "Late",    value: pct(attSummary.late    || 0, t), color: "#f59e0b" },
      { label: "Early",   value: pct(attSummary.early   || 0, t), color: "#38bdf8" },
      { label: "Absent",  value: pct(attSummary.absent  || 0, t), color: "#f87171" },
    ].filter(s => s.value > 0);
  }, [attSummary]);

  /* Application donut */
  const appDonut = useMemo(() => {
    if (!appStats) return [];
    const t = appStats.total || 1;
    return [
      { label: "Approved",    value: pct(appStats.approved || 0, t),    color: "#10b981" },
      { label: "Pending",     value: pct(appStats.pending  || 0, t),    color: "#7c3aed" },
      { label: "HOD Approved",value: pct(appStats.hod_approved || 0, t),color: "#0ea5e9" },
      { label: "Rejected",    value: pct((appStats.rejected||0)+(appStats.hod_rejected||0), t), color: "#f87171" },
    ].filter(s => s.value > 0);
  }, [appStats]);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (auth?.name || "Admin").split(" ")[0];
  const anyLoading = empLoad || deptLoad || roleLoad || shiftLoad;

  /* ─── DEPT_PALETTE ─── */
  const PALETTE = ["#6366f1","#7c3aed","#0ea5e9","#10b981","#f59e0b","#f87171"];

  return (
    <div className="sa-page min-h-screen bg-[#f8fafc] px-5 sm:px-8 py-8">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 sa-in">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Crown size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {greeting}, <span className="text-indigo-600">{firstName}</span>
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-11">
            Super Admin · {new Date().toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <button onClick={fetchAll} disabled={anyLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-500 text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-40 self-start">
          <RefreshCw size={13} className={anyLoading ? "sa-spin" : ""} /> Refresh All
        </button>
      </header>

      {/* ── Row 1: KPI tiles ── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 mb-6 sa-stagger">
        <KPI label="Total Employees" value={totalEmps}         Icon={Users}        grad="bg-gradient-to-br from-indigo-500 to-indigo-700"  loading={empLoad}  />
        <KPI label="Active"          value={activeEmps.length} Icon={UserCheck}    grad="bg-gradient-to-br from-emerald-500 to-teal-600"    loading={empLoad}  />
        <KPI label="Inactive"        value={inactiveEmps.length}Icon={UserX}       grad="bg-gradient-to-br from-rose-400 to-rose-600"       loading={empLoad}  />
        <KPI label="Departments"     value={departments.length} Icon={Building2}   grad="bg-gradient-to-br from-sky-400 to-blue-600"        loading={deptLoad} />
        <KPI label="Roles"           value={roles.length}       Icon={Shield}      grad="bg-gradient-to-br from-violet-500 to-purple-700"   loading={roleLoad} />
        <KPI label="Shifts"          value={shifts.length}      Icon={Clock}       grad="bg-gradient-to-br from-amber-400 to-orange-500"    loading={shiftLoad}/>
        <KPI label="Attend. Rate"    value={attLoad ? null : (attSummary?.rate != null ? `${Math.round(attSummary.rate)}%` : "—")}
                                                                Icon={Activity}    grad="bg-gradient-to-br from-teal-400 to-emerald-600"    loading={attLoad}  />
        <KPI label="Pending Apps"    value={appLoad ? null : (appStats?.pending ?? 0)} Icon={Timer}
                                                                                   grad="bg-gradient-to-br from-fuchsia-500 to-violet-600"  loading={appLoad}  />
      </section>

      {/* ── Row 2: Attendance summary + Dept breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Attendance donut */}
        <Card title={`Attendance — ${CURR_MONTH}`}>
          {attLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="sa-spin text-gray-300" /></div>
          ) : attSummary ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <DonutRing segments={attDonut} size={120} stroke={18} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-extrabold text-gray-900">{Math.round(attSummary.rate ?? 0)}%</p>
                  <p className="text-[10px] text-gray-400 font-semibold">Rate</p>
                </div>
              </div>
              <div className="w-full space-y-2.5">
                {[
                  { label: "Present", val: attSummary.present || 0, color: "#10b981" },
                  { label: "Late",    val: attSummary.late    || 0, color: "#f59e0b" },
                  { label: "Early",   val: attSummary.early   || 0, color: "#38bdf8" },
                  { label: "Absent",  val: attSummary.absent  || 0, color: "#f87171" },
                  { label: "Leave",   val: attSummary.leave   || 0, color: "#94a3b8" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs text-gray-500 w-16">{label}</span>
                    <InlineBar value={val} max={attSummary.total_records || 1} color={color} />
                    <span className="text-xs font-bold text-gray-700 w-8 text-right">{val}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">{fmtNum(attSummary.total_employees)} employees · {fmtNum(attSummary.total_records)} records</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Activity size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No attendance data</p>
            </div>
          )}
        </Card>

        {/* Department headcount */}
        <Card title="Headcount by Department" className="lg:col-span-2">
          {deptLoad || empLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="sa-spin text-gray-300" /></div>
          ) : deptBreakdown.length > 0 ? (
            <div className="space-y-3">
              {deptBreakdown.map(({ id, department, count }, i) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="text-sm text-gray-700 font-medium w-36 truncate">{department}</span>
                  <InlineBar value={count} max={deptBreakdown[0].count || 1} color={PALETTE[i % PALETTE.length]} />
                  <span className="text-sm font-extrabold text-gray-800 w-8 text-right">{count}</span>
                  <span className="text-[10px] text-gray-400 w-10 text-right">{pct(count, totalEmps)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No department data</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 3: Applications donut + Recent apps ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* App donut */}
        <Card title="Applications Overview">
          {appLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="sa-spin text-gray-300" /></div>
          ) : appStats ? (
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <DonutRing segments={appDonut} size={120} stroke={18} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-extrabold text-gray-900">{fmtNum(appStats.total)}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">Total</p>
                </div>
              </div>
              <div className="w-full grid grid-cols-2 gap-2">
                {[
                  { label: "Pending",      val: appStats.pending      || 0, cls: "bg-violet-50 text-violet-700" },
                  { label: "HOD Approved", val: appStats.hod_approved || 0, cls: "bg-sky-50 text-sky-700"       },
                  { label: "Approved",     val: appStats.approved     || 0, cls: "bg-emerald-50 text-emerald-700"},
                  { label: "Rejected",     val: (appStats.rejected||0)+(appStats.hod_rejected||0), cls: "bg-red-50 text-red-700" },
                ].map(({ label, val, cls }) => (
                  <div key={label} className={`rounded-xl px-3 py-2 text-center ${cls}`}>
                    <p className="text-xl font-extrabold">{val}</p>
                    <p className="text-[10px] font-semibold opacity-80">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No application data</p>
            </div>
          )}
        </Card>

        {/* Recent applications table */}
        <Card title="Recent Applications" className="lg:col-span-2">
          {appLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="sa-spin text-gray-300" /></div>
          ) : recentApps.length > 0 ? (
            <div className="overflow-x-auto sa-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["#","Employee","Type","Status","Date"].map(h => (
                      <th key={h} className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map(a => (
                    <tr key={a.id} className="sa-row border-b border-gray-50 last:border-0 transition-colors">
                      <td className="px-2 py-2.5 text-xs text-gray-400 font-medium">#{a.id}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2">
                          <img src={a.employee_image || `https://i.pravatar.cc/150?u=${a.employee_id}`}
                            className="w-6 h-6 rounded-full object-cover border border-gray-100 shrink-0" alt="" />
                          <p className="text-xs font-semibold text-gray-800 truncate max-w-[90px]">
                            {a.employee_name || `#${a.employee_id}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">{a.type}</span>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${APP_CLR[a.status] || "bg-gray-100 text-gray-600"}`}>
                          {(a.status || "").replace("_"," ")}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-400 whitespace-nowrap">{a.from_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No recent applications</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 4: Org heatmap + Notices + Roles/Shifts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Attendance heatmap */}
        <Card title="Org Attendance — Last 90 Days" className="lg:col-span-2">
          <HeatmapStrip records={attRecords} loading={attLoad} />
        </Card>

        {/* Notices */}
        <Card title="Notice Board"
          action={
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <Construction size={9} /> Coming Soon
            </span>
          }
        >
          {notLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={18} className="sa-spin text-gray-300" /></div>
          ) : notices.length > 0 ? (
            <div className="space-y-2.5">
              {notices.map((n, i) => (
                <div key={n.id ?? i} className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={11} className="text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-snug">{n.title || n.message || "Notice"}</p>
                    {n.created_at && <p className="text-[10px] text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Bell size={20} className="text-violet-400" />
              </div>
              <p className="text-sm text-gray-400">No notices yet</p>
              <p className="text-xs text-gray-300">Notice board API coming soon</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 5: Roles table + Shifts table + Employee status breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Roles */}
        <Card title="Roles">
          {roleLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={18} className="sa-spin text-gray-300" /></div>
          ) : roles.length > 0 ? (
            <div className="space-y-2">
              {roles.slice(0, 8).map((r, i) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white"
                      style={{ background: PALETTE[i % PALETTE.length] }}>
                      {r.level ?? i + 1}
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    L{r.level}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Shield size={24} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No roles found</p>
            </div>
          )}
        </Card>

        {/* Shifts */}
        <Card title="Shifts">
          {shiftLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={18} className="sa-spin text-gray-300" /></div>
          ) : shifts.length > 0 ? (
            <div className="space-y-2">
              {shifts.slice(0, 6).map((s, i) => {
                const start = s.shift_start_timing || s.start_time || "—";
                const end   = s.shift_end_timing   || s.end_time   || "—";
                return (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-8 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.shift_name || s.name || `Shift ${s.id}`}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {typeof start === "object" ? JSON.stringify(start).slice(0,8) : String(start).slice(0,5)}
                          {" → "}
                          {typeof end === "object" ? JSON.stringify(end).slice(0,8) : String(end).slice(0,5)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">#{s.id}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock size={24} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No shifts found</p>
            </div>
          )}
        </Card>

        {/* Employee employment status breakdown */}
        <Card title="Employee Status Breakdown">
          {empLoad ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={18} className="sa-spin text-gray-300" /></div>
          ) : (
            <div>
              <div className="flex items-center justify-center mb-4">
                <DonutRing segments={[
                  { value: pct(activeEmps.length, totalEmps || 1),    color: "#10b981" },
                  { value: pct(inactiveEmps.length, totalEmps || 1),  color: "#f87171" },
                ]} size={100} stroke={16} />
              </div>
              <div className="space-y-3">
                {[
                  { label: "Active",     count: activeEmps.length,              color: "#10b981", cls: "bg-emerald-50 text-emerald-700" },
                  { label: "Inactive",   count: employees.filter(e=>!e.is_deleted&&e.employment_status==="inactive").length,   color: "#f87171", cls: "bg-red-50 text-red-700"     },
                  { label: "Resigned",   count: employees.filter(e=>!e.is_deleted&&e.employment_status==="resigned").length,   color: "#f59e0b", cls: "bg-amber-50 text-amber-700"  },
                  { label: "Terminated", count: employees.filter(e=>!e.is_deleted&&e.employment_status==="terminated").length, color: "#94a3b8", cls: "bg-slate-50 text-slate-600"  },
                ].map(({ label, count, color, cls }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs text-gray-600 flex-1">{label}</span>
                    <InlineBar value={count} max={totalEmps || 1} color={color} />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 ${cls}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 6: Recent employees ── */}
      <Card title="Employees — Recent Additions">
        {empLoad ? (
          <div className="flex items-center justify-center py-10"><Loader2 size={20} className="sa-spin text-gray-300" /></div>
        ) : employees.length > 0 ? (
          <div className="overflow-x-auto sa-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Employee","Email","Department","Role","Status","Joined"].map(h => (
                    <th key={h} className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...employees]
                  .filter(e => !e.is_deleted)
                  .sort((a,b) => new Date(b.join_date||0) - new Date(a.join_date||0))
                  .slice(0, 8)
                  .map(emp => {
                    const dept = departments.find(d => d.id === emp.department_id);
                    const role = roles.find(r => r.id === emp.role_id);
                    const stcls = emp.employment_status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : emp.employment_status === "inactive"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600";
                    return (
                      <tr key={emp.id} className="sa-row border-b border-gray-50 last:border-0 transition-colors">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={emp.image || `https://i.pravatar.cc/150?u=${emp.id}`}
                              className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm shrink-0" alt="" />
                            <div>
                              <p className="text-sm font-semibold text-gray-800 leading-tight">{emp.f_name} {emp.l_name}</p>
                              <p className="text-[10px] text-gray-400">#{emp.employee_id || emp.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500 max-w-[160px] truncate">{emp.email}</td>
                        <td className="px-3 py-3">
                          {dept
                            ? <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">{dept.department}</span>
                            : <span className="text-xs text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600">{role?.name || "—"}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${stcls}`}>
                            {emp.employment_status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">{emp.join_date || "—"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users size={28} className="text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No employees found</p>
          </div>
        )}
      </Card>

    </div>
  );
}