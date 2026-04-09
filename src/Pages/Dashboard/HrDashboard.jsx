/**
 * HRDashboard.jsx  —  Human Resources Overview
 *
 * ── APIs CONNECTED ───────────────────────────────────────────────
 *  GetAllEmployees        GET /employees
 *  ListDepartment         GET /departments
 *  AllRoles               GET /roles
 *  ListShifts             GET /shifts
 *  GetAllApplications     GET /applications?limit=20
 *  ApplicationStats       GET /applications/stats
 *  AdminAttendanceSummary GET /attendance/admin/summary?month=YYYY-MM
 *  AdminAttendanceRecords GET /attendance/admin/records?month=YYYY-MM&limit=500
 *  GetAllPolicies         GET /policies/
 *  PolicyStats            GET /policies/stats
 *  GetAllNotices          GET /notices/
 *  NoticeStats            GET /notices/stats
 *
 * ── JWT ─────────────────────────────────────────────────────────
 *  EPI > employee_id > id > sub  →  Employee.id
 *  Level 3 = HR
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Users,
  Building2,
  Activity,
  Clock,
  AlertCircle,
  Loader2,
  Bell,
  FileText,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Timer,
  UserCheck,
  UserX,
  Briefcase,
  Shield,
  CalendarCheck,
  Star,
  ChevronRight,
  Circle,
  TrendingUp,
  TrendingDown,
  Award,
  Hash,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  PieChart,
  BarChart,
  Layers,
  Zap,
  BookOpen,
  Key,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowRight,
  Sparkles,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Injected Styles ─── */
const _S = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @keyframes hr-fade-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hr-scale-in  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes hr-spin      { to{transform:rotate(360deg)} }
  @keyframes hr-shimmer   { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes hr-pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.6} }
  @keyframes hr-bar-grow  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes hr-count-up  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .hr-page { font-family:'Outfit',sans-serif; }
  .hr-page * { box-sizing:border-box; }
  .hr-mono  { font-family:'JetBrains Mono',monospace; }

  .hr-fade-up  { animation: hr-fade-up  .4s cubic-bezier(.22,1,.36,1) both; }
  .hr-scale-in { animation: hr-scale-in .35s cubic-bezier(.22,1,.36,1) both; }
  .hr-spin     { animation: hr-spin .9s linear infinite; }
  .hr-count    { animation: hr-count-up .5s cubic-bezier(.34,1.56,.64,1) both; }

  .hr-stagger > *:nth-child(1) { animation-delay:.05s }
  .hr-stagger > *:nth-child(2) { animation-delay:.1s }
  .hr-stagger > *:nth-child(3) { animation-delay:.15s }
  .hr-stagger > *:nth-child(4) { animation-delay:.2s }
  .hr-stagger > *:nth-child(5) { animation-delay:.25s }
  .hr-stagger > *:nth-child(6) { animation-delay:.3s }

  .hr-card {
    background: #fff;
    border-radius: 18px;
    border: 1px solid rgba(15,23,42,.07);
    box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06);
  }

  .hr-shimmer {
    background: linear-gradient(90deg, #f1f5f9 25%, #e8eef5 50%, #f1f5f9 75%);
    background-size: 400px 100%;
    animation: hr-shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }

  .hr-dot-live {
    width:7px; height:7px; border-radius:50%; background:#22c55e;
    animation: hr-pulse-dot 1.8s ease-in-out infinite;
    display:inline-block;
  }

  .hr-bar-track {
    height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden;
  }
  .hr-bar-fill {
    height: 100%; border-radius: 99px;
    transform-origin: left;
    animation: hr-bar-grow .7s cubic-bezier(.4,0,.2,1) both;
  }

  .hr-row-hover:hover { background: rgba(99,102,241,.04); }
  .hr-tab-active {
    background: #fff;
    box-shadow: 0 1px 3px rgba(15,23,42,.12);
    color: #4f46e5;
    font-weight: 700;
  }

  .hr-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
  .hr-scroll::-webkit-scrollbar-track { background: transparent; }
  .hr-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

  .hr-gradient-mesh {
    background:
      radial-gradient(ellipse 60% 50% at 10% 0%, rgba(99,102,241,.08) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 90% 20%, rgba(236,72,153,.06) 0%, transparent 70%),
      radial-gradient(ellipse 50% 60% at 50% 100%, rgba(20,184,166,.05) 0%, transparent 70%),
      #f8fafc;
  }

  .hr-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 99px;
  }

  .hr-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    object-fit: cover; border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(15,23,42,.08);
  }

  .hr-section-title {
    font-size: 11px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: #94a3b8;
  }
`;

if (typeof document !== "undefined" && !document.getElementById("__hr_s__")) {
  const el = document.createElement("style");
  el.id = "__hr_s__";
  el.textContent = _S;
  document.head.appendChild(el);
}

/* ─── JWT ─── */
function getAuth() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(raw));
    const idRaw = p.EPI ?? p.employee_id ?? p.id ?? p.sub;
    return {
      id: Number(idRaw),
      name: p.name ?? p.full_name ?? p.username ?? "HR Manager",
      level: p.level ?? 3,
    };
  } catch {
    return null;
  }
}

/* ─── Constants ─── */
const CURR_MONTH = new Date().toISOString().slice(0, 7);
const PREV_MONTH = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();
const MONTH_LABEL = new Date().toLocaleString("default", {
  month: "long",
  year: "numeric",
});

/* ─── Helpers ─── */
const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);
const fmtN = (n) => (n == null ? "—" : Number(n).toLocaleString());
const fmtPct = (n) => (n == null ? "—" : `${Math.round(n)}%`);
const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);

/* ─── Color maps ─── */
const DEPT_PALETTE = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#eab308",
  "#10b981",
  "#14b8a6",
  "#0ea5e9",
];

const STATUS_MAP = {
  active: { label: "Active", bg: "#dcfce7", fg: "#16a34a" },
  inactive: { label: "Inactive", bg: "#fee2e2", fg: "#dc2626" },
  resigned: { label: "Resigned", bg: "#fef9c3", fg: "#ca8a04" },
  terminated: { label: "Terminated", bg: "#f1f5f9", fg: "#64748b" },
};

const APP_STATUS_MAP = {
  Pending: { bg: "#ede9fe", fg: "#7c3aed" },
  HOD_Approved: { bg: "#e0f2fe", fg: "#0369a1" },
  HOD_Rejected: { bg: "#ffedd5", fg: "#c2410c" },
  Approved: { bg: "#dcfce7", fg: "#15803d" },
  Rejected: { bg: "#fee2e2", fg: "#dc2626" },
};

const ATT_COLORS = {
  Present: "#10b981",
  Late: "#f59e0b",
  Early: "#38bdf8",
  Absent: "#f87171",
  Leave: "#94a3b8",
};

/* ─── Skeleton loader ─── */
const Skel = ({ w = "100%", h = "16px", className = "" }) => (
  <div className={`hr-shimmer ${className}`} style={{ width: w, height: h }} />
);

/* ─── Mini bar ─── */
function MiniBar({ value, max, color, delay = 0 }) {
  const w = max ? clamp(Math.round((value / max) * 100), 0, 100) : 0;
  return (
    <div className="hr-bar-track flex-1">
      <div
        className="hr-bar-fill"
        style={{
          width: `${w}%`,
          background: color,
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
}

/* ─── Donut ring ─── */
function DonutRing({ segments = [], size = 100, stroke = 14, center, sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2,
    cy = size / 2;
  let off = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", display: "block" }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        {segments.map(({ value, color }, i) => {
          const dash = (value / 100) * circ;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={-(off / 100) * circ}
              strokeLinecap="round"
            />
          );
          off += value;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {center && (
          <p className="text-2xl font-black text-gray-900 hr-mono leading-none">
            {center}
          </p>
        )}
        {sub && (
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── KPI card ─── */
function KPICard({
  label,
  value,
  sub,
  Icon,
  accentColor,
  loading,
  trend,
  trendLabel,
}) {
  const up = trend != null && trend >= 0;
  return (
    <div className="hr-card px-5 py-5 hr-fade-up flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}18` }}
        >
          <Icon size={18} style={{ color: accentColor }} />
        </div>
        {trend != null && !loading && (
          <div
            className={`flex items-center gap-0.5 text-xs font-bold ${up ? "text-emerald-600" : "text-red-500"}`}
          >
            {up ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {loading ? (
        <>
          <Skel h="36px" w="60%" />
          <Skel h="12px" w="80%" />
        </>
      ) : (
        <>
          <p className="text-3xl font-black text-gray-900 hr-mono hr-count leading-none">
            {value}
          </p>
          <div>
            <p className="text-xs font-semibold text-gray-500">{label}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
            {trendLabel && trend != null && (
              <p className="text-[10px] text-gray-400 mt-0.5">{trendLabel}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Employee table row ─── */
function EmpRow({ emp, depts }) {
  const dept = depts.find((d) => d.id === emp.department_id);
  const st = STATUS_MAP[emp.employment_status] || {
    label: emp.employment_status,
    bg: "#f1f5f9",
    fg: "#64748b",
  };
  const fullName =
    [emp.f_name, emp.l_name].filter(Boolean).join(" ") ||
    emp.full_name ||
    `Employee #${emp.id}`;
  const empCode = emp.employee_code || emp.employee_id || `#${emp.id}`;
  const empImage =
    emp.image || emp.profile_image || `https://i.pravatar.cc/150?u=${emp.id}`;
  return (
    <tr className="hr-row-hover border-b border-gray-50 last:border-0 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <img src={empImage} className="hr-avatar" alt="" />
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {fullName}
            </p>
            <p className="text-[11px] text-gray-400 hr-mono">{empCode}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">
        {dept?.department || "—"}
      </td>
      <td className="py-3 px-4">
        <span className="hr-badge" style={{ background: st.bg, color: st.fg }}>
          {st.label}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-gray-400 hr-mono">
        {emp.join_date ? new Date(emp.join_date).toLocaleDateString() : "—"}
      </td>
    </tr>
  );
}

/* ─── Attendance heatmap (90-day) ─── */
function AttHeatmap({ records, loading }) {
  const [tip, setTip] = useState(null);
  const cells = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      if (r.date) map[r.date] = r;
    });
    const today = new Date();
    today.setHours(12);
    const out = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      out.push({
        date: iso,
        rec: map[iso],
        isWkd: [0, 6].includes(d.getDay()),
      });
    }
    return out;
  }, [records]);

  if (loading) return <div className="hr-shimmer h-24 rounded-xl" />;

  const C = 11,
    G = 2;
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="relative">
      <div className="overflow-x-auto hr-scroll pb-1">
        <svg
          width={weeks.length * (C + G)}
          height={7 * (C + G)}
          style={{ display: "block" }}
        >
          {weeks.map((wk, wi) =>
            wk.map((day, di) => {
              const fill = day.isWkd
                ? "#f8fafc"
                : day.rec
                  ? ATT_COLORS[day.rec.status] || "#e2e8f0"
                  : "#e8edf2";
              return (
                <rect
                  key={day.date}
                  x={wi * (C + G)}
                  y={di * (C + G)}
                  width={C}
                  height={C}
                  rx={2.5}
                  fill={fill}
                  style={{ cursor: day.rec ? "pointer" : "default" }}
                  onMouseEnter={(e) =>
                    day.rec && setTip({ x: e.clientX, y: e.clientY, ...day })
                  }
                  onMouseLeave={() => setTip(null)}
                />
              );
            }),
          )}
        </svg>
      </div>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {Object.entries(ATT_COLORS).map(([s, c]) => (
          <span
            key={s}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium"
          >
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: c }}
            />{" "}
            {s}
          </span>
        ))}
      </div>
      {tip && (
        <div
          className="fixed z-[600] pointer-events-none hr-card px-3 py-2.5 shadow-xl text-xs"
          style={{ left: tip.x + 14, top: tip.y - 8 }}
        >
          <p className="font-bold text-gray-800 hr-mono">{tip.date}</p>
          <p
            className="font-semibold mt-0.5"
            style={{ color: ATT_COLORS[tip.rec?.status] }}
          >
            {tip.rec?.status}
          </p>
          {tip.rec?.in_time && (
            <p className="text-gray-400">In: {tip.rec.in_time}</p>
          )}
          {tip.rec?.out_time && (
            <p className="text-gray-400">Out: {tip.rec.out_time}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Tab bar ─── */
function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${active === t.key ? "hr-tab-active" : "text-gray-500 hover:text-gray-700"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Dashboard
══════════════════════════════════════════════ */
export default function HRDashboard() {
  const auth = useMemo(() => getAuth(), []);
  const token = localStorage.getItem("access_token");
  const H = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  /* ─── State ─── */
  const [employees, setEmployees] = useState([]);
  const [departments, setDepts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [appStats, setAppStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [attSummary, setAttSummary] = useState(null);
  const [attSummaryPrev, setAttSummaryPrev] = useState(null);
  const [attRecords, setAttRecords] = useState([]);
  const [policyStats, setPolicyStats] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [noticeStats, setNoticeStats] = useState(null);
  const [notices, setNotices] = useState([]);

  /* ─── Loading ─── */
  const [empLoad, setEmpLoad] = useState(true);
  const [appLoad, setAppLoad] = useState(true);
  const [attLoad, setAttLoad] = useState(true);
  const [polLoad, setPolLoad] = useState(true);
  const [notLoad, setNotLoad] = useState(true);

  /* ─── UI state ─── */
  const [empTab, setEmpTab] = useState("all");
  const [empSearch, setEmpSearch] = useState("");
  const [appTab, setAppTab] = useState("all");

  /* ─── Fetch ─── */
  const fetchAll = useCallback(async () => {
    const headers = H;

    // Employees + Depts + Roles + Shifts
    setEmpLoad(true);
    Promise.all([
      fetch(API.GetAllEmployees, { headers }),
      fetch(API.ListDepartment, { headers }),
      fetch(API.AllRoles, { headers }),
      fetch(API.ListShifts, { headers }),
    ])
      .then(async ([er, dr, rr, sr]) => {
        if (er.ok)
          setEmployees(
            await er
              .json()
              .then((d) => (Array.isArray(d) ? d : d.employees || [])),
          );
        if (dr.ok)
          setDepts(
            await dr
              .json()
              .then((d) => (Array.isArray(d) ? d : d.departments || [])),
          );
        if (rr.ok)
          setRoles(
            await rr.json().then((d) => (Array.isArray(d) ? d : d.roles || [])),
          );
        if (sr.ok)
          setShifts(
            await sr
              .json()
              .then((d) => (Array.isArray(d) ? d : d.shifts || [])),
          );
      })
      .catch(() => {})
      .finally(() => setEmpLoad(false));

    // Applications
    setAppLoad(true);
    Promise.all([
      fetch(API.ApplicationStats, { headers }),
      fetch(`${API.GetAllApplications}?limit=20`, { headers }),
    ])
      .then(async ([sr, lr]) => {
        if (sr.ok) setAppStats(await sr.json());
        if (lr.ok) {
          const d = await lr.json();
          setRecentApps(
            Array.isArray(d) ? d.slice(0, 20) : (d.items || []).slice(0, 20),
          );
        }
      })
      .catch(() => {})
      .finally(() => setAppLoad(false));

    // Attendance
    setAttLoad(true);
    const attBase = `${API.AllAttendance}/admin`;
    Promise.all([
      fetch(`${attBase}/summary?month=${CURR_MONTH}`, { headers }),
      fetch(`${attBase}/summary?month=${PREV_MONTH}`, { headers }),
      fetch(`${attBase}/records?month=${CURR_MONTH}&limit=500`, { headers }),
    ])
      .then(async ([cur, prv, rec]) => {
        if (cur.ok) setAttSummary(await cur.json());
        if (prv.ok) setAttSummaryPrev(await prv.json());
        if (rec.ok) {
          const d = await rec.json();
          setAttRecords(Array.isArray(d) ? d : d.records || []);
        }
      })
      .catch(() => {})
      .finally(() => setAttLoad(false));

    // Policies
    setPolLoad(true);
    Promise.all([
      fetch(API.GetAllPolicies({}), { headers }),
      fetch(API.PolicyStats, { headers }),
    ])
      .then(async ([pr, sr]) => {
        if (pr.ok)
          setPolicies(
            await pr
              .json()
              .then((d) => (Array.isArray(d) ? d : d.policies || [])),
          );
        if (sr.ok) setPolicyStats(await sr.json());
      })
      .catch(() => {})
      .finally(() => setPolLoad(false));

    // Notices
    setNotLoad(true);
    Promise.all([
      fetch(API.GetAllNotices({}), { headers }),
      fetch(API.NoticeStats, { headers }),
    ])
      .then(async ([nr, sr]) => {
        if (nr.ok)
          setNotices(
            await nr
              .json()
              .then((d) => (Array.isArray(d) ? d : d.notices || [])),
          );
        if (sr.ok) setNoticeStats(await sr.json());
      })
      .catch(() => {})
      .finally(() => setNotLoad(false));
  }, [H]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ─── Derived data ─── */
  const validEmps = employees.filter((e) => !e.is_deleted);
  const activeEmps = validEmps.filter((e) => e.employment_status === "active");

  const attDelta = useMemo(() => {
    if (!attSummary?.rate || !attSummaryPrev?.rate) return null;
    return Math.round((attSummary.rate - attSummaryPrev.rate) * 10) / 10;
  }, [attSummary, attSummaryPrev]);

  const deptHeadcount = useMemo(
    () =>
      departments
        .map((d, i) => ({
          ...d,
          count: validEmps.filter((e) => e.department_id === d.id).length,
          color: DEPT_PALETTE[i % DEPT_PALETTE.length],
        }))
        .filter((d) => d.count > 0)
        .sort((a, b) => b.count - a.count),
    [departments, validEmps],
  );

  const attDonut = useMemo(() => {
    if (!attSummary) return [];
    const t = attSummary.total_records || 1;
    return [
      { value: pct(attSummary.present || 0, t), color: "#10b981" },
      { value: pct(attSummary.late || 0, t), color: "#f59e0b" },
      { value: pct(attSummary.early || 0, t), color: "#38bdf8" },
      { value: pct(attSummary.absent || 0, t), color: "#f87171" },
    ].filter((s) => s.value > 0);
  }, [attSummary]);

  const polCompliance = Math.round(policyStats?.avg_ack_rate ?? 0);

  /* Filtered employees for table */
  const filteredEmps = useMemo(() => {
    let list = validEmps;
    if (empTab !== "all")
      list = list.filter((e) => e.employment_status === empTab);
    if (empSearch) {
      const q = empSearch.toLowerCase();
      list = list.filter(
        (e) =>
          (e.full_name || "").toLowerCase().includes(q) ||
          (e.employee_code || "").toLowerCase().includes(q),
      );
    }
    return list.slice(0, 12);
  }, [validEmps, empTab, empSearch]);

  /* Filtered apps */
  const filteredApps = useMemo(() => {
    if (appTab === "all") return recentApps;
    return recentApps.filter((a) => a.status === appTab);
  }, [recentApps, appTab]);

  /* Greeting */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (auth?.name || "HR Manager").split(" ")[0];
  const anyLoad = empLoad || attLoad || appLoad || polLoad;

  return (
    <div className="hr-page min-h-screen hr-gradient-mesh px-5 sm:px-8 py-7">
      {/* ══ Header ══ */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 hr-fade-up">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#6366f1,#ec4899)",
              boxShadow: "0 4px 16px rgba(99,102,241,.3)",
            }}
          >
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              HR Dashboard ·{" "}
              {new Date().toLocaleDateString("default", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1.5">
              HR Lead: Mahanoor Faruqi • HR Department
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className="hr-badge"
            style={{
              background: "#ede9fe",
              color: "#7c3aed",
              fontSize: "11px",
              padding: "5px 12px",
            }}
          >
            <span className="hr-dot-live mr-1" /> {MONTH_LABEL}
          </span>
          <button
            onClick={fetchAll}
            disabled={anyLoad}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-500 text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-40"
          >
            <RefreshCw size={13} className={anyLoad ? "hr-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* ══ Row 1 — 6 KPI Cards ══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5 hr-stagger">
        <KPICard
          label="Total Employees"
          value={fmtN(validEmps.length)}
          sub="All records"
          Icon={Users}
          accentColor="#6366f1"
          loading={empLoad}
        />
        <KPICard
          label="Active Staff"
          value={fmtN(activeEmps.length)}
          sub={`${pct(activeEmps.length, validEmps.length || 1)}% active`}
          Icon={UserCheck}
          accentColor="#10b981"
          loading={empLoad}
        />
        <KPICard
          label="Departments"
          value={fmtN(departments.length)}
          sub={`${roles.length} roles`}
          Icon={Building2}
          accentColor="#0ea5e9"
          loading={empLoad}
        />
        <KPICard
          label="Attendance Rate"
          value={fmtPct(attSummary?.rate)}
          sub={MONTH_LABEL}
          Icon={CalendarCheck}
          accentColor="#14b8a6"
          loading={attLoad}
          trend={attDelta}
          trendLabel="vs last month"
        />
        <KPICard
          label="Pending Leave"
          value={fmtN(appStats?.pending)}
          sub="Awaiting action"
          Icon={Timer}
          accentColor="#f59e0b"
          loading={appLoad}
        />
        <KPICard
          label="Policy Compliance"
          value={fmtPct(polCompliance)}
          sub={`${policyStats?.active ?? "—"} active`}
          Icon={Shield}
          accentColor="#ec4899"
          loading={polLoad}
        />
      </div>

      {/* ══ Row 2 — Attendance Breakdown + Dept Headcount + App Status ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Attendance breakdown */}
        <div className="hr-card p-5 hr-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">
              Attendance Breakdown
            </p>
            <span className="text-[10px] text-gray-400 hr-mono">
              {MONTH_LABEL}
            </span>
          </div>
          {attLoad ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="hr-spin text-gray-200" />
            </div>
          ) : attSummary ? (
            <div className="flex flex-col items-center gap-5">
              <DonutRing
                segments={attDonut}
                size={120}
                stroke={18}
                center={`${Math.round(attSummary.rate ?? 0)}%`}
                sub="Present Rate"
              />
              <div className="w-full space-y-2.5">
                {[
                  {
                    label: "Present",
                    val: attSummary.present || 0,
                    color: "#10b981",
                  },
                  {
                    label: "Late",
                    val: attSummary.late || 0,
                    color: "#f59e0b",
                  },
                  {
                    label: "Early",
                    val: attSummary.early || 0,
                    color: "#38bdf8",
                  },
                  {
                    label: "Absent",
                    val: attSummary.absent || 0,
                    color: "#f87171",
                  },
                  {
                    label: "Leave",
                    val: attSummary.leave || 0,
                    color: "#94a3b8",
                  },
                ].map(({ label, val, color }, i) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-xs text-gray-500 w-12 font-medium">
                      {label}
                    </span>
                    <MiniBar
                      value={val}
                      max={attSummary.total_records || 1}
                      color={color}
                      delay={i * 0.1}
                    />
                    <span className="text-xs font-bold text-gray-800 hr-mono w-8 text-right">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                {fmtN(attSummary.total_employees)} employees ·{" "}
                {fmtN(attSummary.total_records)} records
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-2">
              <Activity size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">No attendance data</p>
            </div>
          )}
        </div>

        {/* Department headcount */}
        <div className="hr-card p-5 hr-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">
              Headcount by Department
            </p>
            <span className="text-[10px] text-gray-400">
              {validEmps.length} total
            </span>
          </div>
          {empLoad ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skel key={i} h="20px" />
              ))}
            </div>
          ) : deptHeadcount.length > 0 ? (
            <div className="space-y-3.5">
              {deptHeadcount.slice(0, 8).map((d, i) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${d.color}18` }}
                  >
                    <span
                      className="text-[10px] font-black"
                      style={{ color: d.color }}
                    >
                      {d.count}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-28 truncate">
                    {d.department}
                  </span>
                  <MiniBar
                    value={d.count}
                    max={deptHeadcount[0].count}
                    color={d.color}
                    delay={i * 0.08}
                  />
                  <span className="text-[10px] text-gray-400 hr-mono w-8 text-right">
                    {pct(d.count, validEmps.length)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-2">
              <Building2 size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">No department data</p>
            </div>
          )}
        </div>

        {/* Application status */}
        <div className="hr-card p-5 hr-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">
              Leave / App Status
            </p>
            {!appLoad && appStats && (
              <span className="text-[10px] text-gray-400 hr-mono">
                {appStats.total} total
              </span>
            )}
          </div>
          {appLoad ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skel key={i} h="20px" />
              ))}
            </div>
          ) : appStats ? (
            <div className="space-y-4">
              {/* Stacked bar */}
              <div className="flex h-2.5 rounded-full overflow-hidden">
                {[
                  { key: "approved", color: "#10b981" },
                  { key: "hod_approved", color: "#0ea5e9" },
                  { key: "pending", color: "#7c3aed" },
                  { key: "hod_rejected", color: "#f97316" },
                  { key: "rejected", color: "#f87171" },
                ].map((s) => {
                  const val = appStats[s.key] || 0;
                  const w = pct(val, appStats.total || 1);
                  return w > 0 ? (
                    <div
                      key={s.key}
                      style={{ width: `${w}%`, background: s.color }}
                      className="transition-all duration-700"
                      title={`${s.key}: ${val}`}
                    />
                  ) : null;
                })}
              </div>
              {/* Stat tiles */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Approved",
                    val: appStats.approved || 0,
                    bg: "#dcfce7",
                    fg: "#16a34a",
                  },
                  {
                    label: "Pending",
                    val: appStats.pending || 0,
                    bg: "#ede9fe",
                    fg: "#7c3aed",
                  },
                  {
                    label: "HOD Approved",
                    val: appStats.hod_approved || 0,
                    bg: "#e0f2fe",
                    fg: "#0369a1",
                  },
                  {
                    label: "Rejected",
                    val:
                      (appStats.rejected || 0) + (appStats.hod_rejected || 0),
                    bg: "#fee2e2",
                    fg: "#dc2626",
                  },
                ].map(({ label, val, bg, fg }) => (
                  <div
                    key={label}
                    className="rounded-2xl px-3 py-3 text-center"
                    style={{ background: bg }}
                  >
                    <p
                      className="text-2xl font-black hr-mono leading-none"
                      style={{ color: fg }}
                    >
                      {val}
                    </p>
                    <p
                      className="text-[10px] font-bold mt-1 opacity-75"
                      style={{ color: fg }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              {/* Breakdown rows */}
              <div className="space-y-1.5 pt-1">
                {[
                  {
                    label: "Approved",
                    val: appStats.approved || 0,
                    color: "#10b981",
                  },
                  {
                    label: "HOD Approved",
                    val: appStats.hod_approved || 0,
                    color: "#0ea5e9",
                  },
                  {
                    label: "Pending",
                    val: appStats.pending || 0,
                    color: "#7c3aed",
                  },
                  {
                    label: "HOD Rejected",
                    val: appStats.hod_rejected || 0,
                    color: "#f97316",
                  },
                  {
                    label: "Rejected",
                    val: appStats.rejected || 0,
                    color: "#f87171",
                  },
                ]
                  .filter((s) => s.val > 0)
                  .map(({ label, val, color }, i) => (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <span className="text-xs text-gray-500 flex-1">
                        {label}
                      </span>
                      <MiniBar
                        value={val}
                        max={appStats.total || 1}
                        color={color}
                        delay={i * 0.08}
                      />
                      <span className="text-xs font-bold hr-mono text-gray-800 w-6 text-right">
                        {val}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-2">
              <ClipboardList size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">No application data</p>
            </div>
          )}
        </div>
      </div>

      {/* ══ Row 3 — 90-day Heatmap + Policy compliance ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Heatmap */}
        <div className="hr-card p-5 lg:col-span-1 hr-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">
              Organisation Attendance — Last 90 Days
            </p>
            <span className="text-[10px] text-gray-400">
              {attRecords.length} records
            </span>
          </div>
          <AttHeatmap records={attRecords} loading={attLoad} />
        </div>

        {/* Policy compliance */}
        <div className="hr-card p-5 hr-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">Policy Compliance</p>
            {!polLoad && policyStats && (
              <span
                className="hr-badge"
                style={{
                  background:
                    polCompliance >= 80
                      ? "#dcfce7"
                      : polCompliance >= 60
                        ? "#fef9c3"
                        : "#fee2e2",
                  color:
                    polCompliance >= 80
                      ? "#16a34a"
                      : polCompliance >= 60
                        ? "#ca8a04"
                        : "#dc2626",
                }}
              >
                {polCompliance}%
              </span>
            )}
          </div>
          {polLoad ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={22} className="hr-spin text-gray-200" />
            </div>
          ) : policyStats ? (
            <>
              <div className="flex justify-center mb-5">
                <DonutRing
                  segments={[
                    {
                      value: polCompliance,
                      color:
                        polCompliance >= 80
                          ? "#10b981"
                          : polCompliance >= 60
                            ? "#f59e0b"
                            : "#f87171",
                    },
                  ]}
                  size={110}
                  stroke={16}
                  center={`${polCompliance}%`}
                  sub="Acknowledged"
                />
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    label: "Active",
                    val: policyStats.active || 0,
                    color: "#10b981",
                  },
                  {
                    label: "Draft",
                    val: policyStats.draft || 0,
                    color: "#94a3b8",
                  },
                  {
                    label: "Review",
                    val: policyStats.review || 0,
                    color: "#f59e0b",
                  },
                  {
                    label: "Archived",
                    val: policyStats.archived || 0,
                    color: "#f87171",
                  },
                  {
                    label: "Mandatory",
                    val: policyStats.mandatory || 0,
                    color: "#7c3aed",
                  },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-xs text-gray-500 flex-1 font-medium">
                      {label}
                    </span>
                    <span className="text-xs font-black hr-mono text-gray-800">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-10 gap-2">
              <Shield size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">No policy data</p>
            </div>
          )}
        </div>
      </div>

      {/* ══ Row 4 — Employee Table ══ */}
      <div className="hr-card p-5 mb-4 hr-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm font-bold text-gray-700">Employee Directory</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs
              tabs={[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "inactive", label: "Inactive" },
                { key: "resigned", label: "Resigned" },
                { key: "terminated", label: "Terminated" },
              ]}
              active={empTab}
              onChange={setEmpTab}
            />
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              <Search size={13} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search name, code…"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="text-xs font-medium bg-transparent outline-none text-gray-700 placeholder-gray-400 w-36"
              />
            </div>
          </div>
        </div>

        {empLoad ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skel w="32px" h="32px" className="rounded-full" />
                <Skel w="140px" h="14px" />
                <Skel w="100px" h="14px" />
                <Skel w="70px" h="22px" className="rounded-full" />
                <Skel w="80px" h="14px" />
              </div>
            ))}
          </div>
        ) : filteredEmps.length > 0 ? (
          <div className="overflow-x-auto hr-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Employee", "Department", "Status", "Joined"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${i === 0 ? "text-left" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEmps.map((emp) => (
                  <EmpRow key={emp.id} emp={emp} depts={departments} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 gap-2">
            <Users size={28} className="text-gray-200" />
            <p className="text-sm text-gray-400">No employees found</p>
          </div>
        )}
        {!empLoad && (
          <p className="text-[11px] text-gray-400 mt-3 font-medium">
            Showing {filteredEmps.length} of{" "}
            {empTab === "all"
              ? validEmps.length
              : validEmps.filter((e) => e.employment_status === empTab)
                  .length}{" "}
            employees
          </p>
        )}
      </div>

      {/* ══ Row 5 — Recent Applications + Notices ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Applications table */}
        <div className="hr-card p-5 lg:col-span-2 hr-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <p className="text-sm font-bold text-gray-700">
              Recent Applications
            </p>
            <Tabs
              tabs={[
                { key: "all", label: "All" },
                { key: "Pending", label: "Pending" },
                { key: "HOD_Approved", label: "HOD Appr." },
                { key: "Approved", label: "Approved" },
                { key: "Rejected", label: "Rejected" },
              ]}
              active={appTab}
              onChange={setAppTab}
            />
          </div>
          {appLoad ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skel key={i} h="42px" />
              ))}
            </div>
          ) : filteredApps.length > 0 ? (
            <div className="overflow-x-auto hr-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Employee", "Type", "Dates", "Status"].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${i === 0 ? "text-left" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((a) => {
                    const sc = APP_STATUS_MAP[a.status] || {
                      bg: "#f1f5f9",
                      fg: "#64748b",
                    };
                    return (
                      <tr
                        key={a.id}
                        className="hr-row-hover border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                a.employee_image ||
                                `https://i.pravatar.cc/150?u=${a.employee_id}`
                              }
                              className="hr-avatar"
                              alt=""
                              style={{ width: 28, height: 28 }}
                            />
                            <span className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">
                              {a.employee_name || `#${a.employee_id}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className="hr-badge"
                            style={{ background: "#f1f5f9", color: "#475569" }}
                          >
                            {(a.type || "—").replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-gray-400 hr-mono whitespace-nowrap">
                          {a.from_date}
                          {a.to_date && a.to_date !== a.from_date
                            ? ` → ${a.to_date}`
                            : ""}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className="hr-badge"
                            style={{ background: sc.bg, color: sc.fg }}
                          >
                            {(a.status || "").replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-2">
              <FileText size={28} className="text-gray-200" />
              <p className="text-sm text-gray-400">No applications found</p>
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="hr-card p-5 hr-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">Notice Board</p>
            {!notLoad && notices.length > 0 && (
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                style={{ background: "#6366f1" }}
              >
                {notices.length}
              </span>
            )}
          </div>
          {notLoad ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skel key={i} h="64px" />
              ))}
            </div>
          ) : notices.length > 0 ? (
            <div className="space-y-2.5">
              {notices.slice(0, 6).map((n, i) => (
                <div
                  key={n.id ?? i}
                  className="flex items-start gap-3 rounded-2xl px-3.5 py-3"
                  style={{
                    background: i === 0 ? "rgba(99,102,241,.07)" : "#f8fafc",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: i === 0 ? "rgba(99,102,241,.15)" : "#f1f5f9",
                    }}
                  >
                    <Bell
                      size={13}
                      style={{ color: i === 0 ? "#6366f1" : "#94a3b8" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
                      {n.title || n.message || n.content || "Notice"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {n.is_pinned && (
                        <span
                          className="hr-badge"
                          style={{
                            background: "#fef9c3",
                            color: "#ca8a04",
                            fontSize: "9px",
                          }}
                        >
                          Pinned
                        </span>
                      )}
                      {n.created_at && (
                        <p className="text-[10px] text-gray-400">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "#ede9fe" }}
              >
                <Bell size={20} style={{ color: "#7c3aed" }} />
              </div>
              <p className="text-sm text-gray-400">No notices</p>
            </div>
          )}
        </div>
      </div>

      {/* ══ Row 6 — Roles, Shifts, Workforce Summary ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Roles */}
        <div className="hr-card p-5 hr-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">Roles</p>
            <span
              className="hr-badge"
              style={{ background: "#ede9fe", color: "#7c3aed" }}
            >
              {roles.length}
            </span>
          </div>
          {empLoad ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skel key={i} h="32px" />
              ))}
            </div>
          ) : roles.length > 0 ? (
            <div
              className="space-y-2 overflow-y-auto hr-scroll"
              style={{ maxHeight: 220 }}
            >
              {roles.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-gray-50"
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `${DEPT_PALETTE[i % DEPT_PALETTE.length]}18`,
                    }}
                  >
                    <Key
                      size={11}
                      style={{ color: DEPT_PALETTE[i % DEPT_PALETTE.length] }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 truncate flex-1">
                    {r.role_name || r.name || `Role #${r.id}`}
                  </span>
                  <span className="text-[10px] text-gray-400 hr-mono">
                    Lv.{r.level ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-2">
              <Key size={24} className="text-gray-200" />
              <p className="text-xs text-gray-400">No roles found</p>
            </div>
          )}
        </div>

        {/* Shifts */}
        <div className="hr-card p-5 hr-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">Shifts</p>
            <span
              className="hr-badge"
              style={{ background: "#e0f2fe", color: "#0369a1" }}
            >
              {shifts.length}
            </span>
          </div>
          {empLoad ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skel key={i} h="40px" />
              ))}
            </div>
          ) : shifts.length > 0 ? (
            <div
              className="space-y-2 overflow-y-auto hr-scroll"
              style={{ maxHeight: 220 }}
            >
              {shifts.map((s, i) => (
                <div
                  key={s.id}
                  className="px-3 py-2.5 rounded-xl bg-gray-50 flex items-center gap-2.5"
                >
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${DEPT_PALETTE[(i + 2) % DEPT_PALETTE.length]}18`,
                    }}
                  >
                    <Clock
                      size={12}
                      style={{
                        color: DEPT_PALETTE[(i + 2) % DEPT_PALETTE.length],
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {s.shift_name || s.name || `Shift #${s.id}`}
                    </p>
                    {(s.shift_start_timing ||
                      s.start_time ||
                      s.shift_end_timing ||
                      s.end_time) && (
                      <p className="text-[10px] text-gray-400 hr-mono">
                        {(s.shift_start_timing || s.start_time)?.slice(0, 5)} –{" "}
                        {(s.shift_end_timing || s.end_time)?.slice(0, 5)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-2">
              <Clock size={24} className="text-gray-200" />
              <p className="text-xs text-gray-400">No shifts found</p>
            </div>
          )}
        </div>

        {/* Workforce Summary */}
        <div className="hr-card p-5 hr-fade-up">
          <p className="text-sm font-bold text-gray-700 mb-4">
            Workforce Summary
          </p>
          {empLoad ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skel key={i} h="20px" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: "Active",
                  count: activeEmps.length,
                  color: "#10b981",
                  bg: "#dcfce7",
                  fg: "#16a34a",
                },
                {
                  label: "Inactive",
                  count: validEmps.filter(
                    (e) => e.employment_status === "inactive",
                  ).length,
                  color: "#f87171",
                  bg: "#fee2e2",
                  fg: "#dc2626",
                },
                {
                  label: "Resigned",
                  count: validEmps.filter(
                    (e) => e.employment_status === "resigned",
                  ).length,
                  color: "#f59e0b",
                  bg: "#fef9c3",
                  fg: "#ca8a04",
                },
                {
                  label: "Terminated",
                  count: validEmps.filter(
                    (e) => e.employment_status === "terminated",
                  ).length,
                  color: "#94a3b8",
                  bg: "#f1f5f9",
                  fg: "#64748b",
                },
              ].map(({ label, count, color, bg, fg }, i) => (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-xs font-semibold text-gray-600 flex-1">
                    {label}
                  </span>
                  <MiniBar
                    value={count}
                    max={validEmps.length || 1}
                    color={color}
                    delay={i * 0.1}
                  />
                  <span
                    className="hr-badge shrink-0"
                    style={{ background: bg, color: fg, fontSize: "11px" }}
                  >
                    {count}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">
                  Total headcount
                </span>
                <span className="text-lg font-black hr-mono text-gray-900">
                  {validEmps.length}
                </span>
              </div>
              {/* Gender / join stats if available */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ background: "#ede9fe" }}
                >
                  <p className="text-xl font-black hr-mono text-indigo-700">
                    {departments.length}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-500 mt-0.5">
                    Departments
                  </p>
                </div>
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ background: "#e0f2fe" }}
                >
                  <p className="text-xl font-black hr-mono text-sky-700">
                    {roles.length}
                  </p>
                  <p className="text-[10px] font-bold text-sky-500 mt-0.5">
                    Roles
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
