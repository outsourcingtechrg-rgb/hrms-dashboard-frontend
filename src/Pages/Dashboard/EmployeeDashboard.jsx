/**
 * EmployeeDashboard.jsx
 *
 * ── APIs used ────────────────────────────────────────────────────
 *  MyAttendanceToday   : `${mainOrigin}/attendance/me/today?employee_id={id}`
 *  MyAttendanceSummary : `${mainOrigin}/attendance/me/summary?employee_id={id}&month=YYYY-MM`
 *  MyAttendance        : `${mainOrigin}/attendance/me?employee_id={id}&month=YYYY-MM`
 *  shiftDetailsById    : `${mainOrigin}/shifts/{id}`  (or ?employee_id=)
 *  GetAllApplications  : `${mainOrigin}/applications`     ← scoped by JWT; returns own apps
 *  ApplicationStats    : `${mainOrigin}/applications/stats`
 *
 * ── Coming Soon (not yet implemented) ───────────────────────────
 *  Notice board, Policies, Trainings — shown as "Coming Soon" cards
 *
 * ── JWT field priority (Employee.id) ────────────────────────────
 *  EPI > employee_id > id > sub  →  Number()
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
/* recharts removed — heatmap is pure CSS/SVG */
import {
  BookOpen,
  FileText,
  CalendarCheck,
  BarChart2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Bell,
  Shield,
  GraduationCap,
  TrendingUp,
  Zap,
  Hourglass,
  LogIn,
  LogOut,
  Timer,
  User,
  Rocket,
  ThumbsUp,
  ThumbsDown,
  Construction,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Inject styles ─── */
const _S = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  @keyframes ed-in    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ed-spin  { to{transform:rotate(360deg)} }
  @keyframes ed-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes ed-bar   { from{width:0} to{width:var(--w)} }
  .ed-page * { font-family:'Inter',sans-serif; }
  .ed-in     { animation:ed-in   .28s cubic-bezier(.4,0,.2,1) both; }
  .ed-spin   { animation:ed-spin .9s  linear infinite; }
  .ed-pulse  { animation:ed-pulse 1.5s ease-in-out infinite; }
  .ed-bar    { animation:ed-bar  .8s  cubic-bezier(.4,0,.2,1) forwards; }
  .ed-stagger > *:nth-child(1){animation-delay:.04s}
  .ed-stagger > *:nth-child(2){animation-delay:.09s}
  .ed-stagger > *:nth-child(3){animation-delay:.14s}
  .ed-stagger > *:nth-child(4){animation-delay:.19s}
  .ed-stagger > *:nth-child(5){animation-delay:.24s}
  .ed-stagger > *:nth-child(6){animation-delay:.29s}
  .ed-card{background:#fff;border-radius:20px;box-shadow:0 1px 3px rgba(0,0,0,.05),0 4px 14px rgba(0,0,0,.04);border:1px solid rgba(0,0,0,.05);}
  .ed-scroll::-webkit-scrollbar{width:4px;height:4px}
  .ed-scroll::-webkit-scrollbar-track{background:transparent}
  .ed-scroll::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:99px}
`;
if (typeof document !== "undefined" && !document.getElementById("__ed_s__")) {
  const el = document.createElement("style");
  el.id = "__ed_s__";
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
      name: p.name ?? p.full_name ?? p.username ?? "Employee",
      level: p.level ?? 99,
      month: new Date().toISOString().slice(0, 7),
    };
  } catch {
    return null;
  }
}

/* ─── Helpers ─── */
function fmt12(t) {
  if (!t) return "—";
  const [h, m] = String(t).split(":").map(Number);
  if (isNaN(h)) return t;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtHours(h) {
  if (!h) return "—";
  const hr = Math.floor(h),
    mn = Math.round((h - hr) * 60);
  return mn > 0 ? `${hr}h ${mn}m` : `${hr}h`;
}
const CURR_MONTH = new Date().toISOString().slice(0, 7);

/* ─── Status colours ─── */
const STATUS_DOT = {
  Present: "bg-emerald-500",
  Late: "bg-amber-400",
  Early: "bg-sky-400",
  Absent: "bg-red-500",
  Leave: "bg-slate-400",
};
const STATUS_TEXT = {
  Present: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Late: "text-amber-700 bg-amber-50 border-amber-200",
  Early: "text-sky-700 bg-sky-50 border-sky-200",
  Absent: "text-red-700 bg-red-50 border-red-200",
  Leave: "text-slate-600 bg-slate-50 border-slate-200",
};

/* ─── Reusable card ─── */
function Card({ title, children, action, className = "" }) {
  return (
    <div className={`ed-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── Coming Soon overlay card ─── */
function ComingSoonCard({ title, icon: Icon, color, description }) {
  return (
    <div className="ed-card p-6 relative overflow-hidden">
      {/* Subtle stripe pattern */}
      <div
        className="absolute inset-0 opacity-[.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
          backgroundSize: "8px 8px",
        }}
      />

      <div className="relative flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500">{title}</h2>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          <Construction size={10} /> Coming Soon
        </span>
      </div>

      <div className="relative flex flex-col items-center justify-center py-8 gap-3">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}
        >
          <Icon size={24} className="opacity-70" />
        </div>
        <p className="text-sm text-gray-500 text-center leading-relaxed max-w-[200px]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ─── Top stat widget ─── */
function StatWidget({ title, value, sub, Icon, color, loading }) {
  return (
    <div className="ed-card px-5 py-5 flex items-center gap-4 ed-in">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{title}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-100 rounded-lg mt-0.5 animate-pulse" />
        ) : (
          <h3 className="text-2xl font-bold text-gray-900 leading-tight">
            {value}
          </h3>
        )}
        {sub && !loading && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Attendance Heatmap ─── */
const STATUS_COLORS = {
  Present: { bg: "#10b981", light: "#d1fae5", label: "Present" },
  Late: { bg: "#f59e0b", light: "#fef3c7", label: "Late" },
  Early: { bg: "#38bdf8", light: "#e0f2fe", label: "Early" },
  Absent: { bg: "#f87171", light: "#fee2e2", label: "Absent" },
  Leave: { bg: "#94a3b8", light: "#f1f5f9", label: "Leave" },
  Weekend: { bg: "#f9fafb", light: "#f9fafb", label: "Weekend" },
  Future: { bg: "#f9fafb", light: "#f9fafb", label: "Future" },
  Empty: { bg: "#f1f5f9", light: "#f1f5f9", label: "No data" },
};

const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function AttendanceHeatmap({ records, loading, joiningDate }) {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  const { weeks, monthMarkers } = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // ✅ Parse joining date safely (your format: "2026-03-24")
    const join = joiningDate ? new Date(joiningDate) : null;
    join?.setHours(0, 0, 0, 0);

    const recMap = {};
    records.forEach((r) => {
      recMap[r.date] = r;
    });

    const start = new Date(today);

    // 🔥 go back exactly 6 months
    start.setMonth(start.getMonth() - 6);

    // align to Sunday (same as before)
    start.setDate(start.getDate() - start.getDay());

    const weeks = [];
    const monthMarkers = [];

    let col = [];
    let colIdx = 0;
    let lastMonth = -1;

    const cur = new Date(start);

    while (cur <= today || col.length % 7 !== 0) {
      const iso = cur.toISOString().split("T")[0];
      const dow = cur.getDay();
      const mon = cur.getMonth();

      const isFut = cur > today;
      const isWkd = dow === 0 || dow === 6;
      const isBeforeJoin = join && cur < join;

      if (dow === 0 && col.length > 0) {
        weeks.push(col);
        col = [];
        colIdx++;
      }

      if (dow === 0 && mon !== lastMonth && !isFut) {
        monthMarkers.push({ colIdx, label: MONTH_NAMES[mon] });
        lastMonth = mon;
      }

      const rec = recMap[iso];

      let status;

      // ✅ FIXED LOGIC
      if (isBeforeJoin) {
        status = "NotJoined";
      } else if (isFut) {
        status = "Future";
      } else if (isWkd) {
        status = "Weekend";
      } else if (rec) {
        status = rec.status;
      } else {
        status = "Absent"; // ✅ correct after joining
      }

      col.push({
        date: iso,
        status,
        hours: rec?.hours || null,
        in: rec?.in_time || null,
        out: rec?.out_time || null,
        dow,
        isFut,
        isWkd,
        isBeforeJoin,
      });

      cur.setDate(cur.getDate() + 1);
    }

    if (col.length) weeks.push(col);

    return { weeks, monthMarkers };
  }, [records, joiningDate]);

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <Loader2 size={20} className="ed-spin text-gray-300" />
      </div>
    );
  }

  const CELL = 13;
  const GAP = 3;
  const STEP = CELL + GAP;
  const LEFT = 28;
  const TOP = 22;

  const svgW = LEFT + weeks.length * STEP;
  const svgH = TOP + 7 * STEP + 6;

  return (
    <div>
      <div className="overflow-x-auto ed-scroll pb-1">
        <svg
          width={svgW}
          height={svgH}
          style={{ display: "block", minWidth: svgW }}
        >
          {/* Month Labels */}
          {monthMarkers.map(({ colIdx, label }) => (
            <text
              key={label + colIdx}
              x={LEFT + colIdx * STEP}
              y={13}
              fontSize={10}
              fill="#9ca3af"
            >
              {label}
            </text>
          ))}

          {/* Day Labels */}
          {[1, 3, 5].map((d) => (
            <text
              key={d}
              x={0}
              y={TOP + d * STEP + CELL - 2}
              fontSize={9}
              fill="#9ca3af"
            >
              {WEEK_LABELS[d].slice(0, 3)}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const cfg = STATUS_COLORS[day.status] || STATUS_COLORS.Empty;
              const x = LEFT + wi * STEP;
              const y = TOP + di * STEP;

              const isH = hoveredDate === day.date;

              // ✅ Hide pre-joining days
              if (day.isBeforeJoin) {
                return null;
              }

              return (
                <rect
                  key={day.date}
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  ry={3}
                  fill={day.isFut || day.isWkd ? "#f1f5f9" : cfg.bg}
                  opacity={day.isFut ? 0.3 : day.isWkd ? 0.5 : 1}
                  stroke={isH ? "#1e293b" : "none"}
                  strokeWidth={isH ? 1.5 : 0}
                  style={{
                    cursor: day.isFut || day.isWkd ? "default" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (day.isFut || day.isBeforeJoin) return;

                    setHoveredDate(day.date);
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      ...day,
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredDate(null);
                    setTooltip(null);
                  }}
                />
              );
            }),
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
        {Object.entries(STATUS_COLORS)
          .filter(
            ([k]) => !["Weekend", "Future", "Empty", "NotJoined"].includes(k),
          )
          .map(([status, { bg, label }]) => (
            <span
              key={status}
              className="flex items-center gap-1.5 text-[11px] text-gray-500"
            >
              <span className="w-3 h-3 rounded-sm" style={{ background: bg }} />
              {label}
            </span>
          ))}

        <span className="ml-auto text-[11px] text-gray-400">
          {records.length} day{records.length !== 1 ? "s" : ""} tracked
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[999] pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div className="ed-card px-3 py-2 text-xs shadow-xl min-w-[140px]">
            <p className="font-bold mb-1">{tooltip.date}</p>

            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: STATUS_COLORS[tooltip.status]?.bg,
                }}
              />
              <span>{tooltip.status}</span>
            </div>

            {tooltip.in && <p>In: {fmt12(tooltip.in)}</p>}
            {tooltip.out && <p>Out: {fmt12(tooltip.out)}</p>}
            {tooltip.hours && <p>Hours: {fmtHours(tooltip.hours)}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Application mini list ─── */
const APP_STATUS_CFG = {
  Pending: { cls: "bg-violet-100 text-violet-700", Icon: Clock },
  HOD_Approved: { cls: "bg-sky-100 text-sky-700", Icon: ThumbsUp },
  HOD_Rejected: { cls: "bg-orange-100 text-orange-700", Icon: ThumbsDown },
  Approved: { cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  Rejected: { cls: "bg-red-100 text-red-700", Icon: XCircle },
};
const APP_TYPE_ICON = {
  Leave: FileText,
  Travel: Rocket,
  Reimbursement: BarChart2,
};

function AppMini({ app }) {
  const cfg = APP_STATUS_CFG[app.status] || APP_STATUS_CFG.Pending;
  const Icon = cfg.Icon;
  const TIcon = APP_TYPE_ICON[app.type] || FileText;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
          <TIcon size={13} className="text-gray-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {app.type}
          </p>
          <p className="text-[10px] text-gray-400">
            {app.from_date} → {app.to_date}
          </p>
        </div>
      </div>
      <span
        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ml-2 ${cfg.cls}`}
      >
        <Icon size={9} /> {app.status.replace("_", " ")}
      </span>
    </div>
  );
}

/* ─── Recent attendance rows ─── */
function AttendanceRow({ rec }) {
  const cfg = STATUS_TEXT[rec.status] || STATUS_TEXT.Absent;
  const dot = STATUS_DOT[rec.status] || "bg-slate-300";
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
        <div>
          <p className="text-sm font-semibold text-gray-800">{rec.date}</p>
          <p className="text-[10px] text-gray-400">
            {fmt12(rec.in_time)} – {fmt12(rec.out_time)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {rec.hours && (
          <span className="text-[10px] text-gray-400 font-medium">
            {fmtHours(rec.hours)}
          </span>
        )}
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg}`}
        >
          {rec.status}
        </span>
      </div>
    </div>
  );
}

function decodeAuthToken() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function buildFallbackUser(auth) {
  const fullName =
    auth?.name ||
    auth?.full_name ||
    [auth?.f_name, auth?.l_name].filter(Boolean).join(" ") ||
    auth?.username ||
    "Current User";
  const email = auth?.email || auth?.user_email || "No email available";
  const employeeCode = auth?.employee_id || auth?.id || auth?.sub || "N/A";
  const employeeDbId =
    auth?.EPI ?? auth?.employee_id ?? auth?.id ?? auth?.sub ?? null;
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CU";

  return {
    fullName,
    email,
    employeeCode,
    employeeDbId,
    image: "",
    initials,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Main Dashboard
═══════════════════════════════════════════════════════════════ */
export default function EmployeeDashboard() {
  const auth = useMemo(() => getAuth(), []);
  const fallbackUser = React.useMemo(() => buildFallbackUser(auth), [auth]);
  const [user, setUser] = React.useState(fallbackUser);
  const joiningDate = user.employeeJoinDate;
  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    const employeeDbId =
      auth?.EPI ?? auth?.employee_id ?? auth?.id ?? auth?.sub;
    if (!token || !employeeDbId) return;

    let ignore = false;

    async function loadCurrentUser() {
      try {
        const res = await fetch(API.employeeDetails(employeeDbId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const employee = await res.json();
        if (ignore) return;

        const fullName =
          [employee?.f_name, employee?.l_name].filter(Boolean).join(" ") ||
          employee?.name ||
          fallbackUser.fullName;

        setUser((prev) => ({
          ...prev,
          fullName,
          email: employee?.email || prev.email,
          image: employee?.image || "",
          employeeCode:
            employee?.employee_id || employee?.id || prev.employeeCode,
          employeeDbId: employee?.id || prev.employeeDbId,
          employeeJoinDate: employee?.join_date || none,
          initials:
            fullName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("") || prev.initials,
        }));
      } catch {
        // Keep token-based fallback values if profile fetch fails.
      }
    }

    loadCurrentUser();
    return () => {
      ignore = true;
    };
  }, [
    auth?.EPI,
    auth?.employee_id,
    auth?.id,
    auth?.sub,
    fallbackUser.fullName,
  ]);

  /* ── State ── */
  const [todayRec, setTodayRec] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [appStats, setAppStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);

  const [todayLoad, setTodayLoad] = useState(true);
  const [summLoad, setSummLoad] = useState(true);
  const [recsLoad, setRecsLoad] = useState(true);
  const [appLoad, setAppLoad] = useState(true);

  const token = localStorage.getItem("access_token");
  console.log(user.employeeJoinDate);
  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  /* ── Fetch today's attendance ── */
  const fetchToday = useCallback(async () => {
    if (!auth?.id) {
      setTodayLoad(false);
      return;
    }
    try {
      const base =
        typeof API.MyAttendanceToday === "function"
          ? API.MyAttendanceToday(auth.id)
          : `${API.MyAttendanceToday}?employee_id=${auth.id}`;
      const res = await fetch(base, { headers });
      if (res.ok) setTodayRec(await res.json());
    } catch {
      /* silent */
    } finally {
      setTodayLoad(false);
    }
  }, [auth, headers]);

  /* ── Fetch monthly summary ── */
  const fetchSummary = useCallback(async () => {
    if (!auth?.id) {
      setSummLoad(false);
      return;
    }
    try {
      const base =
        typeof API.MyAttendanceSummary === "function"
          ? API.MyAttendanceSummary(auth.id, CURR_MONTH)
          : `${API.MyAttendanceSummary}?employee_id=${auth.id}&month=${CURR_MONTH}`;
      const res = await fetch(base, { headers });
      if (res.ok) setSummary(await res.json());
    } catch {
      /* silent */
    } finally {
      setSummLoad(false);
    }
  }, [auth, headers]);

  /* ── Fetch records for heatmap (last 12 months) ── */
  const fetchRecords = useCallback(async () => {
    if (!auth?.id) {
      setRecsLoad(false);
      return;
    }
    try {
      const allRecs = [];
      /* Fetch the last 12 months in parallel */
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      });
      const results = await Promise.all(
        months.map(async (month) => {
          try {
            const base =
              typeof API.MyAttendanceByMonth === "function"
                ? API.MyAttendanceByMonth(auth.id, month)
                : `${API.MyAttendance}?employee_id=${auth.id}&month=${month}`;
            const res = await fetch(base, { headers });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : data.records || [];
          } catch {
            return [];
          }
        }),
      );
      results.forEach((r) => allRecs.push(...r));
      setRecords(allRecs);
    } catch {
      /* silent */
    } finally {
      setRecsLoad(false);
    }
  }, [auth, headers]);

  /* ── Fetch application stats + recent ── */
  const fetchApps = useCallback(async () => {
    if (!auth?.id) {
      setAppLoad(false);
      return;
    }
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch(API.ApplicationStats, { headers }),
        fetch(API.GetAllApplications + "?limit=5", { headers }),
      ]);
      if (statsRes.ok) setAppStats(await statsRes.json());
      if (listRes.ok) {
        const d = await listRes.json();
        setRecentApps((Array.isArray(d) ? d : d.items || []).slice(0, 5));
      }
    } catch {
      /* silent */
    } finally {
      setAppLoad(false);
    }
  }, [auth, headers]);

  useEffect(() => {
    fetchToday();
    fetchSummary();
    fetchRecords();
    fetchApps();
  }, [fetchToday, fetchSummary, fetchRecords, fetchApps]);

  /* ── Computed values ── */
  const todayStatus = todayRec?.status || (todayLoad ? null : "No record");
  const checkIn = todayRec?.in_time || null;
  const checkOut = todayRec?.out_time || null;
  const hoursWorked = todayRec?.hours || null;
  const attendRate = summary?.rate ?? null;
  const pendingApps = appStats?.pending ?? 0;
  const firstName = user.fullName || "Employee";

  const recentRecs = records.slice(0, 5);

  /* ── Greeting ── */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="ed-page min-h-screen bg-[#f8fafc] px-5 sm:px-8 py-8 text-gray-900">
      {/* ── Header ── */}
      <header className="mb-8 ed-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}, <span className="text-indigo-600">{firstName}</span>{" "}
              👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("default", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {/* Today's status pill */}
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold self-start sm:self-auto ${
              todayLoad
                ? "bg-gray-50 text-gray-400 border-gray-200 ed-pulse"
                : todayStatus === "Present"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : todayStatus === "Late"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                todayLoad
                  ? "bg-gray-300"
                  : todayStatus === "Present"
                    ? "bg-emerald-500"
                    : todayStatus === "Late"
                      ? "bg-amber-500"
                      : "bg-gray-400"
              }`}
            />
            {todayLoad ? "Loading…" : todayStatus || "No record today"}
          </div>
        </div>
      </header>

      {/* ── Top stat widgets ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7 ed-stagger">
        {/* Check-in */}
        <StatWidget
          title="Check In"
          value={todayLoad ? "…" : fmt12(checkIn)}
          sub={checkIn ? "On time" : "Not yet punched"}
          Icon={LogIn}
          color="bg-emerald-100 text-emerald-600"
          loading={todayLoad}
        />

        {/* Check-out */}
        <StatWidget
          title="Check Out"
          value={todayLoad ? "…" : fmt12(checkOut)}
          sub={checkOut ? fmtHours(hoursWorked) + " worked" : "Shift ongoing"}
          Icon={LogOut}
          color="bg-rose-100 text-rose-600"
          loading={todayLoad}
        />

        {/* Monthly attendance rate */}
        <StatWidget
          title="Attendance Rate"
          value={summLoad ? "…" : attendRate != null ? `${attendRate}%` : "—"}
          sub={`${new Date().toLocaleString("default", { month: "long" })}`}
          Icon={TrendingUp}
          color={
            attendRate == null
              ? "bg-gray-100 text-gray-500"
              : attendRate >= 90
                ? "bg-emerald-100 text-emerald-600"
                : attendRate >= 75
                  ? "bg-amber-100 text-amber-600"
                  : "bg-red-100 text-red-600"
          }
          loading={summLoad}
        />

        {/* Pending applications */}
        <StatWidget
          title="Pending Apps"
          value={appLoad ? "…" : String(pendingApps)}
          sub={
            pendingApps === 1
              ? "1 awaiting approval"
              : `${pendingApps} awaiting approval`
          }
          Icon={Hourglass}
          color="bg-violet-100 text-violet-600"
          loading={appLoad}
        />
      </section>

      {/* ── Monthly summary pills ── */}
      {!summLoad && summary && (
        <div className="flex flex-wrap gap-2 mb-7 ed-in">
          {[
            { label: "Present", val: summary.present, dot: "bg-emerald-500" },
            { label: "Late", val: summary.late, dot: "bg-amber-400" },
            { label: "Early", val: summary.early, dot: "bg-sky-400" },
            { label: "Absent", val: summary.absent, dot: "bg-red-500" },
            { label: "Leave", val: summary.leave, dot: "bg-slate-400" },
          ]
            .filter((i) => i.val > 0)
            .map(({ label, val, dot }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-full text-xs font-semibold text-gray-700 shadow-sm"
              >
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {label}: <span className="text-gray-900">{val}</span>
              </span>
            ))}
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-indigo-700 shadow-sm">
            <Timer size={11} /> {summary.total_days} day
            {summary.total_days !== 1 ? "s" : ""} tracked
          </span>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Attendance Heatmap — col-span-2 on xl */}
        <div className="xl:col-span-2">
          <Card title="Attendance Heatmap — Last 12 Months">
            <AttendanceHeatmap records={records} loading={recsLoad} />
          </Card>
        </div>

        {/* Today's detail */}
        <Card title="Today's Detail">
          {todayLoad ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="ed-spin text-gray-300" />
            </div>
          ) : todayRec ? (
            <div className="space-y-3">
              {[
                {
                  label: "Status",
                  value: (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_TEXT[todayRec.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}
                    >
                      {todayRec.status}
                    </span>
                  ),
                },
                {
                  label: "In",
                  value: (
                    <span className="text-sm font-bold text-gray-900">
                      {fmt12(todayRec.in_time)}
                    </span>
                  ),
                },
                {
                  label: "Out",
                  value: (
                    <span className="text-sm font-bold text-gray-900">
                      {fmt12(todayRec.out_time)}
                    </span>
                  ),
                },
                {
                  label: "Hours",
                  value: (
                    <span className="text-sm font-bold text-gray-900">
                      {fmtHours(todayRec.hours)}
                    </span>
                  ),
                },
                {
                  label: "Mode",
                  value: (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${todayRec.attendance_mode === "remote" ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {todayRec.attendance_mode || "onsite"}
                    </span>
                  ),
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-xs font-medium text-gray-400">
                    {label}
                  </span>
                  {value}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarCheck size={28} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">
                No punch record for today.
              </p>
              <p className="text-xs text-gray-300 mt-1">
                This updates automatically after machine sync.
              </p>
            </div>
          )}
        </Card>

        {/* Recent Attendance */}
        <Card title="Recent Days">
          {recsLoad ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="ed-spin text-gray-300" />
            </div>
          ) : recentRecs.length > 0 ? (
            <div>
              {recentRecs.map((r) => (
                <AttendanceRow key={r.date} rec={r} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart2 size={24} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No records found.</p>
            </div>
          )}
        </Card>

        {/* Applications */}
        <Card
          title="My Applications"
          action={
            <div className="flex items-center gap-2">
              {appLoad ? null : (
                <>
                  {appStats?.pending > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                      {appStats.pending} Pending
                    </span>
                  )}
                  {appStats?.approved > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {appStats.approved} Approved
                    </span>
                  )}
                </>
              )}
            </div>
          }
        >
          {appLoad ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="ed-spin text-gray-300" />
            </div>
          ) : recentApps.length > 0 ? (
            <div>
              {recentApps.map((a) => (
                <AppMini key={a.id} app={a} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText size={24} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No applications yet.</p>
            </div>
          )}
        </Card>

        {/* Application stats mini breakdown */}
        {!appLoad && appStats && (
          <Card title="Application Breakdown">
            <div className="space-y-3">
              {[
                {
                  label: "Pending",
                  val: appStats.pending,
                  color: "#7c3aed",
                  bg: "bg-violet-500",
                },
                {
                  label: "HOD Approved",
                  val: appStats.hod_approved,
                  color: "#0284c7",
                  bg: "bg-sky-500",
                },
                {
                  label: "Approved",
                  val: appStats.approved,
                  color: "#059669",
                  bg: "bg-emerald-500",
                },
                {
                  label: "Rejected",
                  val: (appStats.rejected || 0) + (appStats.hod_rejected || 0),
                  color: "#dc2626",
                  bg: "bg-red-500",
                },
              ].map(({ label, val, color, bg }) => {
                const total = appStats.total || 1;
                const pct = Math.round((val / total) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{label}</span>
                      <span className="font-bold" style={{ color }}>
                        {val}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${bg}`}
                        style={{
                          width: `${pct}%`,
                          transition: "width .6s cubic-bezier(.4,0,.2,1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-gray-400 pt-1">
                {appStats.total} total application
                {appStats.total !== 1 ? "s" : ""}
              </p>
            </div>
          </Card>
        )}

        {/* ── Coming Soon Cards ── */}
        <ComingSoonCard
          title="Notice Board"
          icon={Bell}
          color="bg-purple-100 text-purple-600"
          description="Company-wide announcements and notices will appear here."
        />

        <ComingSoonCard
          title="Policies"
          icon={Shield}
          color="bg-blue-100 text-blue-600"
          description="Access and acknowledge your company policies from this card."
        />

        <ComingSoonCard
          title="Training & Learning"
          icon={GraduationCap}
          color="bg-amber-100 text-amber-600"
          description="Track assigned trainings, progress, and completions here."
        />
      </div>
    </div>
  );
}
