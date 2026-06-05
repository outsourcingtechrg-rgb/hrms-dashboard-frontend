/**
 * EmployeeDashboard.jsx — Dark + Light mode (next-themes "class" strategy)
 *
 * Theme engine:  CSS custom properties on :root (light) and .dark (dark).
 *                next-themes sets the "dark" class on <html>; every token
 *                flips automatically. SVG heatmap reads `isDark` for fill
 *                colours because SVG attributes can't consume CSS vars directly.
 *
 * Bug-fix:       Document-2 had `employee?.join_date || none` (ReferenceError).
 *                Fixed to `|| null` throughout.
 *
 * APIs used:
 *   MyAttendanceToday   – /attendance/me/today?employee_id={id}
 *   MyAttendanceSummary – /attendance/me/summary?employee_id={id}&month=YYYY-MM
 *   MyAttendance        – /attendance/me?employee_id={id}&month=YYYY-MM
 *   GetAllApplications  – /applications?limit=5
 *   ApplicationStats    – /applications/stats
 *   employeeDetails     – /employees/{id}
 *
 * JWT field priority for employee id:  EPI › employee_id › id › sub
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  FileText, CalendarCheck, BarChart2, CheckCircle2, Clock, XCircle,
  Loader2, Bell, Shield, GraduationCap, TrendingUp, Hourglass,
  LogIn, LogOut, Timer, Rocket, ThumbsUp, ThumbsDown, Construction,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─────────────────────────────────────────────────────────────────────────────
   CSS — theme tokens + global animations
   Injected once into <head>; idempotent via the __ed_s__ guard.
───────────────────────────────────────────────────────────────────────────── */
const _CSS = `
  /* ── Light tokens ── */
  :root {
    --ed-bg:           #f8fafc;
    --ed-surface:      #ffffff;
    --ed-border:       #f1f5f9;
    --ed-border-md:    #e2e8f0;
    --ed-text-1:       #0f172a;
    --ed-text-2:       #475569;
    --ed-text-3:       #94a3b8;
    --ed-text-4:       #cbd5e1;
    --ed-hover:        #f1f5f9;
    --ed-shadow:       0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.04);

    /* status semantic tokens */
    --st-present-bg:   #ecfdf5;  --st-present-bd: #a7f3d0; --st-present-tx: #065f46;
    --st-late-bg:      #fffbeb;  --st-late-bd:    #fde68a; --st-late-tx:    #92400e;
    --st-early-bg:     #f0f9ff;  --st-early-bd:   #bae6fd; --st-early-tx:   #075985;
    --st-absent-bg:    #fef2f2;  --st-absent-bd:  #fecaca; --st-absent-tx:  #991b1b;
    --st-leave-bg:     #f8fafc;  --st-leave-bd:   #e2e8f0; --st-leave-tx:   #475569;

    /* icon accent fills */
    --ic-green-bg:     #d1fae5;  --ic-green-fg:   #059669;
    --ic-red-bg:       #fee2e2;  --ic-red-fg:     #dc2626;
    --ic-violet-bg:    #ede9fe;  --ic-violet-fg:  #7c3aed;
    --ic-sky-bg:       #e0f2fe;  --ic-sky-fg:     #0284c7;
    --ic-amber-bg:     #fef3c7;  --ic-amber-fg:   #d97706;
    --ic-blue-bg:      #dbeafe;  --ic-blue-fg:    #1d4ed8;
    --ic-indigo-bg:    #e0e7ff;  --ic-indigo-fg:  #4338ca;
  }

  /* ── Dark tokens ── */
  .dark {
    --ed-bg:           #0f172a;
    --ed-surface:      #1e293b;
    --ed-border:       #334155;
    --ed-border-md:    #475569;
    --ed-text-1:       #f1f5f9;
    --ed-text-2:       #94a3b8;
    --ed-text-3:       #64748b;
    --ed-text-4:       #334155;
    --ed-hover:        #334155;
    --ed-shadow:       0 1px 3px rgba(0,0,0,.3), 0 4px 14px rgba(0,0,0,.2);

    --st-present-bg:   #052e16;  --st-present-bd: #166534; --st-present-tx: #86efac;
    --st-late-bg:      #292524;  --st-late-bd:    #78350f; --st-late-tx:    #fcd34d;
    --st-early-bg:     #0c1a2e;  --st-early-bd:   #0369a1; --st-early-tx:   #7dd3fc;
    --st-absent-bg:    #2d0a0a;  --st-absent-bd:  #991b1b; --st-absent-tx:  #fca5a5;
    --st-leave-bg:     #1e293b;  --st-leave-bd:   #334155; --st-leave-tx:   #94a3b8;

    --ic-green-bg:     #052e16;  --ic-green-fg:   #34d399;
    --ic-red-bg:       #2d0a0a;  --ic-red-fg:     #f87171;
    --ic-violet-bg:    #2e1065;  --ic-violet-fg:  #a78bfa;
    --ic-sky-bg:       #0c1a2e;  --ic-sky-fg:     #38bdf8;
    --ic-amber-bg:     #292524;  --ic-amber-fg:   #fbbf24;
    --ic-blue-bg:      #172554;  --ic-blue-fg:    #60a5fa;
    --ic-indigo-bg:    #1e1b4b;  --ic-indigo-fg:  #818cf8;
  }

  /* ── Animations ── */
  @keyframes ed-in    { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes ed-spin  { to   { transform:rotate(360deg) } }
  @keyframes ed-pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }

  .ed-page  { font-family:'Inter',sans-serif; background:var(--ed-bg); color:var(--ed-text-1); min-height:100vh; }
  .ed-in    { animation:ed-in   .28s cubic-bezier(.4,0,.2,1) both; }
  .ed-spin  { animation:ed-spin .9s  linear infinite; }
  .ed-pls   { animation:ed-pulse 1.5s ease-in-out infinite; }

  /* staggered children */
  .ed-stagger > *:nth-child(1) { animation:ed-in .28s .04s cubic-bezier(.4,0,.2,1) both; }
  .ed-stagger > *:nth-child(2) { animation:ed-in .28s .09s cubic-bezier(.4,0,.2,1) both; }
  .ed-stagger > *:nth-child(3) { animation:ed-in .28s .14s cubic-bezier(.4,0,.2,1) both; }
  .ed-stagger > *:nth-child(4) { animation:ed-in .28s .19s cubic-bezier(.4,0,.2,1) both; }

  /* card */
  .ed-card {
    background:   var(--ed-surface);
    border:       1px solid var(--ed-border);
    border-radius: 20px;
    box-shadow:   var(--ed-shadow);
  }

  /* icon bubble */
  .ed-icon { border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; width:44px; height:44px; }

  /* row divider */
  .ed-row            { border-bottom:1px solid var(--ed-border); }
  .ed-row:last-child { border-bottom:none; }

  /* custom scrollbar */
  .ed-scroll::-webkit-scrollbar       { width:4px; height:4px; }
  .ed-scroll::-webkit-scrollbar-track { background:transparent; }
  .ed-scroll::-webkit-scrollbar-thumb { background:var(--ed-border-md); border-radius:99px; }

  /* status badge via data attribute — avoids per-status className proliferation */
  [data-status="Present"] { background:var(--st-present-bg); border-color:var(--st-present-bd); color:var(--st-present-tx); }
  [data-status="Late"]    { background:var(--st-late-bg);    border-color:var(--st-late-bd);    color:var(--st-late-tx);    }
  [data-status="Early"]   { background:var(--st-early-bg);   border-color:var(--st-early-bd);   color:var(--st-early-tx);   }
  [data-status="Absent"]  { background:var(--st-absent-bg);  border-color:var(--st-absent-bd);  color:var(--st-absent-tx);  }
  [data-status="Leave"]   { background:var(--st-leave-bg);   border-color:var(--st-leave-bd);   color:var(--st-leave-tx);   }

  /* progress track */
  .ed-track { background:var(--ed-border); border-radius:99px; overflow:hidden; }

  /* skeleton shimmer */
  .ed-skel { background:var(--ed-hover); border-radius:8px; animation:ed-pulse 1.5s ease-in-out infinite; }
`;

if (typeof document !== "undefined" && !document.getElementById("__ed_s__")) {
  const el = document.createElement("style");
  el.id = "__ed_s__";
  el.textContent = _CSS;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Auth helpers
───────────────────────────────────────────────────────────────────────────── */
function getAuth() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p   = JSON.parse(atob(raw));
    return {
      id:   Number(p.EPI ?? p.employee_id ?? p.id ?? p.sub),
      EPI:  p.EPI ?? null,
      name: p.name ?? p.full_name ?? p.username ?? "Employee",
    };
  } catch { return null; }
}

function buildFallbackUser(auth) {
  const fullName = auth?.name || "Current User";
  const initials = fullName.split(" ").filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase()).join("") || "CU";
  return {
    fullName,
    email:           "",
    employeeCode:    auth?.id    || "N/A",
    employeeDbId:    auth?.EPI   ?? auth?.id ?? null,
    employeeJoinDate: null,
    image:           "",
    initials,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Utility helpers
───────────────────────────────────────────────────────────────────────────── */
function fmt12(t) {
  if (!t) return "—";
  const [h, m] = String(t).split(":").map(Number);
  if (isNaN(h)) return t;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtHours(h) {
  if (!h) return "—";
  const hr = Math.floor(h), mn = Math.round((h - hr) * 60);
  return mn > 0 ? `${hr}h ${mn}m` : `${hr}h`;
}
const CURR_MONTH = new Date().toISOString().slice(0, 7);

/* Status dot colours — decorative only, so fixed values work in both themes */
const STATUS_DOT_COLOR = {
  Present: "#10b981",
  Late:    "#f59e0b",
  Early:   "#38bdf8",
  Absent:  "#ef4444",
  Leave:   "#94a3b8",
};

/* ─────────────────────────────────────────────────────────────────────────────
   Shared UI primitives
───────────────────────────────────────────────────────────────────────────── */

/** Generic card shell */
function Card({ title, children, action }) {
  return (
    <div className="ed-card" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px 14px" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ed-text-2)" }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: "0 24px 24px" }}>{children}</div>
    </div>
  );
}

/** Stat tile (top row) */
function StatWidget({ title, value, sub, Icon, iconBg, iconColor, loading }) {
  return (
    <div className="ed-card ed-in" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <div className="ed-icon" style={{ background: iconBg }}>
        <Icon size={18} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: "var(--ed-text-3)", margin: 0 }}>{title}</p>
        {loading
          ? <div className="ed-skel" style={{ height: 28, width: 64, marginTop: 4 }} />
          : <h3 style={{ fontSize: 24, fontWeight: 700, color: "var(--ed-text-1)", margin: "2px 0 0", lineHeight: 1.2 }}>{value}</h3>}
        {sub && !loading &&
          <p style={{ fontSize: 11, color: "var(--ed-text-3)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</p>}
      </div>
    </div>
  );
}

/** Coloured status badge (uses data-status for CSS-var colours) */
function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span
      data-status={status}
      style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, border: "1px solid", display: "inline-flex", alignItems: "center", gap: 5 }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_DOT_COLOR[status] || "#94a3b8" }} />
      {status}
    </span>
  );
}

/** Spinner centred in a block */
function Spin() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0" }}>
      <Loader2 size={20} className="ed-spin" style={{ color: "var(--ed-text-4)" }} />
    </div>
  );
}

/** Empty state */
function Empty({ icon: Icon, text }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", textAlign: "center" }}>
      <Icon size={26} style={{ color: "var(--ed-text-4)", marginBottom: 10 }} />
      <p style={{ fontSize: 13, color: "var(--ed-text-3)", margin: 0 }}>{text}</p>
    </div>
  );
}

/** Thin progress bar */
function ProgressBar({ pct, color }) {
  return (
    <div className="ed-track" style={{ height: 6 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

/** "Coming Soon" placeholder card */
function ComingSoonCard({ title, icon: Icon, iconBg, iconColor, description }) {
  return (
    <div className="ed-card" style={{ position: "relative", overflow: "hidden" }}>
      {/* subtle stripe overlay */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "repeating-linear-gradient(-45deg,currentColor 0,currentColor 1px,transparent 0,transparent 50%)",
        backgroundSize: "8px 8px" }} />

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px 14px" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ed-text-2)" }}>{title}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 99,
          background: "var(--st-late-bg)", color: "var(--st-late-tx)", border: "1px solid var(--st-late-bd)" }}>
          <Construction size={10} /> Coming Soon
        </span>
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "24px 24px 28px", gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: iconBg }}>
          <Icon size={24} color={iconColor} style={{ opacity: 0.8 }} />
        </div>
        <p style={{ fontSize: 13, color: "var(--ed-text-2)", textAlign: "center", lineHeight: 1.6, maxWidth: 200, margin: 0 }}>{description}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Attendance Heatmap
   SVG cell fills switch between two hardcoded palettes based on `isDark`
   because SVG `fill` attributes cannot consume CSS custom properties.
───────────────────────────────────────────────────────────────────────────── */
const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const HEATMAP_FILLS = {
  light: { Present:"#10b981", Late:"#f59e0b", Early:"#38bdf8", Absent:"#f87171", Leave:"#94a3b8", empty:"#f1f5f9" },
  dark:  { Present:"#059669", Late:"#d97706", Early:"#0284c7", Absent:"#dc2626", Leave:"#475569", empty:"#1e293b" },
};

function cellFill(status, isDark) {
  const pal = isDark ? HEATMAP_FILLS.dark : HEATMAP_FILLS.light;
  return pal[status] ?? pal.empty;
}

const LEGEND_STATUSES = [
  { label: "Present", lFill: "#10b981", dFill: "#059669" },
  { label: "Late",    lFill: "#f59e0b", dFill: "#d97706" },
  { label: "Early",   lFill: "#38bdf8", dFill: "#0284c7" },
  { label: "Absent",  lFill: "#f87171", dFill: "#dc2626" },
  { label: "Leave",   lFill: "#94a3b8", dFill: "#475569" },
];

function AttendanceHeatmap({ records, loading, joiningDate, isDark }) {
  const [tooltip,  setTooltip]  = useState(null);
  const [hovDate,  setHovDate]  = useState(null);

  const { weeks, monthMarkers } = useMemo(() => {
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const join  = joiningDate ? new Date(joiningDate) : null;
    if (join) join.setHours(0, 0, 0, 0);

    const recMap = {};
    records.forEach((r) => { recMap[r.date] = r; });

    const start = new Date(today);
    start.setMonth(start.getMonth() - 6);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    const weeks = [], monthMarkers = [];
    let col = [], colIdx = 0, lastMon = -1;
    const cur = new Date(start);

    while (cur <= today || col.length % 7 !== 0) {
      const iso  = cur.toISOString().split("T")[0];
      const dow  = cur.getDay();
      const mon  = cur.getMonth();
      const isFut        = cur > today;
      const isWkd        = dow === 0 || dow === 6;
      const isBeforeJoin = join && cur < join;

      if (dow === 0 && col.length > 0) { weeks.push(col); col = []; colIdx++; }
      if (dow === 0 && mon !== lastMon && !isFut) { monthMarkers.push({ colIdx, label: MONTH_NAMES[mon] }); lastMon = mon; }

      const rec    = recMap[iso];
      let   status = isBeforeJoin ? "NotJoined"
                   : isFut        ? "Future"
                   : isWkd        ? "Weekend"
                   : rec          ? rec.status
                   :                "Absent";

      col.push({ date: iso, status, hours: rec?.hours || null, in: rec?.in_time || null, out: rec?.out_time || null, dow, isFut, isWkd, isBeforeJoin });
      cur.setDate(cur.getDate() + 1);
    }
    if (col.length) weeks.push(col);
    return { weeks, monthMarkers };
  }, [records, joiningDate]);

  if (loading) return (
    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={20} className="ed-spin" style={{ color: "var(--ed-text-4)" }} />
    </div>
  );

  const CELL = 13, STEP = 16, LEFT = 28, TOP = 22;
  const svgW = LEFT + weeks.length * STEP;
  const svgH = TOP + 7 * STEP + 6;
  const labelColor = "var(--ed-text-3)";

  return (
    <div>
      <div className="ed-scroll" style={{ overflowX: "auto", paddingBottom: 4 }}>
        <svg width={svgW} height={svgH} style={{ display: "block", minWidth: svgW }}>
          {/* Month labels */}
          {monthMarkers.map(({ colIdx, label }) => (
            <text key={label + colIdx} x={LEFT + colIdx * STEP} y={13} fontSize={10} fill={labelColor}>{label}</text>
          ))}
          {/* Day-of-week labels (Mon, Wed, Fri only) */}
          {[1, 3, 5].map((d) => (
            <text key={d} x={0} y={TOP + d * STEP + CELL - 2} fontSize={9} fill={labelColor}>{WEEK_LABELS[d]}</text>
          ))}
          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((day) => {
              if (day.isBeforeJoin) return null;
              const x     = LEFT + wi * STEP;
              const y     = TOP  + day.dow * STEP;
              const fill  = (day.isFut || day.isWkd) ? (isDark ? "#1e293b" : "#f1f5f9") : cellFill(day.status, isDark);
              const alpha = day.isFut ? 0.3 : day.isWkd ? 0.5 : 1;
              const isH   = hovDate === day.date;
              return (
                <rect
                  key={day.date} x={x} y={y} width={CELL} height={CELL} rx={3}
                  fill={fill} opacity={alpha}
                  stroke={isH ? (isDark ? "#f1f5f9" : "#1e293b") : "none"} strokeWidth={isH ? 1.5 : 0}
                  style={{ cursor: day.isFut || day.isWkd ? "default" : "pointer" }}
                  onMouseEnter={(e) => { if (day.isFut || day.isBeforeJoin) return; setHovDate(day.date); setTooltip({ x: e.clientX, y: e.clientY, ...day }); }}
                  onMouseLeave={() => { setHovDate(null); setTooltip(null); }}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 16px", marginTop: 10 }}>
        {LEGEND_STATUSES.map(({ label, lFill, dFill }) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ed-text-2)" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: isDark ? dFill : lFill, flexShrink: 0 }} />
            {label}
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ed-text-3)" }}>
          {records.length} day{records.length !== 1 ? "s" : ""} tracked
        </span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position: "fixed", zIndex: 999, pointerEvents: "none", left: tooltip.x + 14, top: tooltip.y - 10 }}>
          <div className="ed-card" style={{ padding: "10px 14px", minWidth: 140, fontSize: 12 }}>
            <p style={{ fontWeight: 700, margin: "0 0 6px", color: "var(--ed-text-1)" }}>{tooltip.date}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cellFill(tooltip.status, isDark) }} />
              <span style={{ color: "var(--ed-text-2)" }}>{tooltip.status}</span>
            </div>
            {tooltip.in    && <p style={{ margin: "2px 0", color: "var(--ed-text-2)" }}>In: {fmt12(tooltip.in)}</p>}
            {tooltip.out   && <p style={{ margin: "2px 0", color: "var(--ed-text-2)" }}>Out: {fmt12(tooltip.out)}</p>}
            {tooltip.hours && <p style={{ margin: "2px 0", color: "var(--ed-text-2)" }}>Hours: {fmtHours(tooltip.hours)}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Application mini-row
───────────────────────────────────────────────────────────────────────────── */
const APP_STATUS_CFG = {
  Pending:      { bgVar: "var(--st-late-bg)",    bdVar: "var(--st-late-bd)",    txVar: "var(--st-late-tx)",    Icon: Clock        },
  HOD_Approved: { bgVar: "var(--st-early-bg)",   bdVar: "var(--st-early-bd)",   txVar: "var(--st-early-tx)",   Icon: ThumbsUp     },
  HOD_Rejected: { bgVar: "var(--st-absent-bg)",  bdVar: "var(--st-absent-bd)",  txVar: "var(--st-absent-tx)",  Icon: ThumbsDown   },
  Approved:     { bgVar: "var(--st-present-bg)", bdVar: "var(--st-present-bd)", txVar: "var(--st-present-tx)", Icon: CheckCircle2 },
  Rejected:     { bgVar: "var(--st-absent-bg)",  bdVar: "var(--st-absent-bd)",  txVar: "var(--st-absent-tx)",  Icon: XCircle      },
};
const APP_TYPE_ICON = { Leave: FileText, Travel: Rocket, Reimbursement: BarChart2 };

function AppMini({ app }) {
  const cfg   = APP_STATUS_CFG[app.status] || APP_STATUS_CFG.Pending;
  const SIcon = cfg.Icon;
  const TIcon = APP_TYPE_ICON[app.type] || FileText;
  return (
    <div className="ed-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--ed-border-md)",
          background: "var(--ed-hover)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <TIcon size={13} style={{ color: "var(--ed-text-2)" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ed-text-1)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.type}</p>
          <p style={{ fontSize: 10, color: "var(--ed-text-3)", margin: 0 }}>{app.from_date} → {app.to_date}</p>
        </div>
      </div>
      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "3px 8px",
        borderRadius: 99, flexShrink: 0, marginLeft: 8,
        background: cfg.bgVar, border: `1px solid ${cfg.bdVar}`, color: cfg.txVar }}>
        <SIcon size={9} /> {app.status.replace("_", " ")}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Attendance row (recent days list)
───────────────────────────────────────────────────────────────────────────── */
function AttendanceRow({ rec }) {
  return (
    <div className="ed-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_DOT_COLOR[rec.status] || "#94a3b8", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ed-text-1)", margin: 0 }}>{rec.date}</p>
          <p style={{ fontSize: 10, color: "var(--ed-text-3)", margin: 0 }}>{fmt12(rec.in_time)} – {fmt12(rec.out_time)}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {rec.hours && <span style={{ fontSize: 10, color: "var(--ed-text-3)", fontWeight: 500 }}>{fmtHours(rec.hours)}</span>}
        <StatusBadge status={rec.status} />
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════════
   Main Dashboard Component
═════════════════════════════════════════════════════════════════════════════ */
export default function EmployeeDashboard() {
  /* ── Auth ── */
  const auth         = useMemo(() => getAuth(), []);
  const fallbackUser = useMemo(() => buildFallbackUser(auth), [auth]);
  const [user, setUser] = useState(fallbackUser);

  /* ── Theme (next-themes) ──
     `mounted` guard prevents SSR hydration mismatch;
     only read `resolvedTheme` after mount.                  */
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  /* ── Load full employee profile ── */
  useEffect(() => {
    const token  = localStorage.getItem("access_token");
    const dbId   = auth?.EPI ?? auth?.employee_id ?? auth?.id ?? auth?.sub;
    if (!token || !dbId) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(API.employeeDetails(dbId), {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) return;
        const e = await res.json();
        if (ignore) return;
        const fullName = [e?.f_name, e?.l_name].filter(Boolean).join(" ") || e?.name || fallbackUser.fullName;
        setUser((prev) => ({
          ...prev,
          fullName,
          email:            e?.email      || prev.email,
          image:            e?.image      || "",
          employeeCode:     e?.employee_id || e?.id || prev.employeeCode,
          employeeDbId:     e?.id         || prev.employeeDbId,
          employeeJoinDate: e?.join_date  || null,   // ← was `|| none` (bug) in v2
          initials: fullName.split(" ").filter(Boolean).slice(0, 2)
            .map((p) => p[0]?.toUpperCase()).join("") || prev.initials,
        }));
      } catch { /* keep JWT-based fallback values */ }
    })();
    return () => { ignore = true; };
  }, [auth?.EPI, auth?.employee_id, auth?.id, auth?.sub, fallbackUser.fullName]);

  /* ── Data state ── */
  const [todayRec,   setTodayRec]   = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [records,    setRecords]    = useState([]);
  const [appStats,   setAppStats]   = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [todayLoad,  setTodayLoad]  = useState(true);
  const [summLoad,   setSummLoad]   = useState(true);
  const [recsLoad,   setRecsLoad]   = useState(true);
  const [appLoad,    setAppLoad]    = useState(true);

  const token   = localStorage.getItem("access_token");
  const headers = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token],
  );

  /* ── Fetch today ── */
  const fetchToday = useCallback(async () => {
    if (!auth?.id) { setTodayLoad(false); return; }
    try {
      const url = typeof API.MyAttendanceToday === "function"
        ? API.MyAttendanceToday(auth.id)
        : `${API.MyAttendanceToday}?employee_id=${auth.id}`;
      const res = await fetch(url, { headers });
      if (res.ok) setTodayRec(await res.json());
    } catch { /* silent */ } finally { setTodayLoad(false); }
  }, [auth, headers]);

  /* ── Fetch monthly summary ── */
  const fetchSummary = useCallback(async () => {
    if (!auth?.id) { setSummLoad(false); return; }
    try {
      const url = typeof API.MyAttendanceSummary === "function"
        ? API.MyAttendanceSummary(auth.id, CURR_MONTH)
        : `${API.MyAttendanceSummary}?employee_id=${auth.id}&month=${CURR_MONTH}`;
      const res = await fetch(url, { headers });
      if (res.ok) setSummary(await res.json());
    } catch { /* silent */ } finally { setSummLoad(false); }
  }, [auth, headers]);

  /* ── Fetch records for heatmap (last 12 months in parallel) ── */
  const fetchRecords = useCallback(async () => {
    if (!auth?.id) { setRecsLoad(false); return; }
    try {
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      });
      const results = await Promise.all(months.map(async (month) => {
        try {
          const url = typeof API.MyAttendanceByMonth === "function"
            ? API.MyAttendanceByMonth(auth.id, month)
            : `${API.MyAttendance}?employee_id=${auth.id}&month=${month}`;
          const res = await fetch(url, { headers });
          if (!res.ok) return [];
          const d = await res.json();
          return Array.isArray(d) ? d : d.records || [];
        } catch { return []; }
      }));
      const all = [];
      results.forEach((r) => all.push(...r));
      setRecords(all);
    } catch { /* silent */ } finally { setRecsLoad(false); }
  }, [auth, headers]);

  /* ── Fetch application stats + recent list ── */
  const fetchApps = useCallback(async () => {
    if (!auth?.id) { setAppLoad(false); return; }
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(API.ApplicationStats, { headers }),
        fetch(API.GetAllApplications + "?limit=5", { headers }),
      ]);
      if (sRes.ok) setAppStats(await sRes.json());
      if (lRes.ok) {
        const d = await lRes.json();
        setRecentApps((Array.isArray(d) ? d : d.items || []).slice(0, 5));
      }
    } catch { /* silent */ } finally { setAppLoad(false); }
  }, [auth, headers]);

  useEffect(() => {
    fetchToday(); fetchSummary(); fetchRecords(); fetchApps();
  }, [fetchToday, fetchSummary, fetchRecords, fetchApps]);

  /* ── Derived values ── */
  const todayStatus = todayRec?.status || (todayLoad ? null : "No record");
  const attendRate  = summary?.rate ?? null;
  const pendingApps = appStats?.pending ?? 0;
  const firstName   = user.fullName || "Employee";
  const recentRecs  = records.slice(0, 5);
  const joiningDate = user.employeeJoinDate;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* Today status pill style — switches via CSS vars automatically */
  const pillStyle = (() => {
    if (todayLoad)                return { background: "var(--ed-hover)",        color: "var(--ed-text-3)",    borderColor: "var(--ed-border-md)"  };
    if (todayStatus === "Present") return { background: "var(--st-present-bg)",  color: "var(--st-present-tx)", borderColor: "var(--st-present-bd)" };
    if (todayStatus === "Late")    return { background: "var(--st-late-bg)",     color: "var(--st-late-tx)",    borderColor: "var(--st-late-bd)"    };
    return                               { background: "var(--ed-surface)",      color: "var(--ed-text-2)",     borderColor: "var(--ed-border-md)"  };
  })();

  /* Attendance-rate icon colour shifts by performance */
  const rateIconBg    = attendRate == null ? "var(--ed-hover)"    : attendRate >= 90 ? "var(--ic-green-bg)"  : attendRate >= 75 ? "var(--ic-amber-bg)"  : "var(--ic-red-bg)";
  const rateIconColor = attendRate == null ? "var(--ed-text-3)"   : attendRate >= 90 ? "var(--ic-green-fg)"  : attendRate >= 75 ? "var(--ic-amber-fg)"  : "var(--ic-red-fg)";

  /* ── Render ── */
  return (
    <div className="ed-page" style={{ padding: "32px 20px" }}>

      {/* ───────────── Header ───────────── */}
      <header className="ed-in" style={{ marginBottom: 32, display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ed-text-1)", margin: 0, letterSpacing: "-0.3px" }}>
            {greeting}, <span style={{ color: "#6366f1" }}>{firstName}</span> 👋
          </h1>
          <p style={{ fontSize: 13, color: "var(--ed-text-3)", margin: "4px 0 0" }}>
            {new Date().toLocaleDateString("default", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Today's status pill */}
        <div className={todayLoad ? "ed-pls" : ""}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
            borderRadius: 16, border: `1px solid ${pillStyle.borderColor}`,
            fontSize: 14, fontWeight: 600, background: pillStyle.background, color: pillStyle.color }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%",
            background: STATUS_DOT_COLOR[todayStatus] || "var(--ed-text-4)", flexShrink: 0 }} />
          {todayLoad ? "Loading…" : todayStatus || "No record today"}
        </div>
      </header>

      {/* ───────────── Stat widgets ───────────── */}
      <div className="ed-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
        <StatWidget title="Check In"
          value={todayLoad ? "…" : fmt12(todayRec?.in_time)}
          sub={todayRec?.in_time ? "Punched in" : "Not yet punched"}
          Icon={LogIn} iconBg="var(--ic-green-bg)" iconColor="var(--ic-green-fg)" loading={todayLoad} />

        <StatWidget title="Check Out"
          value={todayLoad ? "…" : fmt12(todayRec?.out_time)}
          sub={todayRec?.out_time ? fmtHours(todayRec?.hours) + " worked" : "Shift ongoing"}
          Icon={LogOut} iconBg="var(--ic-red-bg)" iconColor="var(--ic-red-fg)" loading={todayLoad} />

        <StatWidget title="Attendance Rate"
          value={summLoad ? "…" : attendRate != null ? `${attendRate}%` : "—"}
          sub={new Date().toLocaleString("default", { month: "long" })}
          Icon={TrendingUp} iconBg={rateIconBg} iconColor={rateIconColor} loading={summLoad} />

        <StatWidget title="Pending Apps"
          value={appLoad ? "…" : String(pendingApps)}
          sub={`${pendingApps} awaiting approval`}
          Icon={Hourglass} iconBg="var(--ic-violet-bg)" iconColor="var(--ic-violet-fg)" loading={appLoad} />
      </div>

      {/* ───────────── Summary pills ───────────── */}
      {!summLoad && summary && (
        <div className="ed-in" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {[
            { label: "Present", val: summary.present, dot: "#10b981" },
            { label: "Late",    val: summary.late,    dot: "#f59e0b" },
            { label: "Early",   val: summary.early,   dot: "#38bdf8" },
            { label: "Absent",  val: summary.absent,  dot: "#ef4444" },
            { label: "Leave",   val: summary.leave,   dot: "#94a3b8" },
          ].filter((i) => i.val > 0).map(({ label, val, dot }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", background: "var(--ed-surface)", border: "1px solid var(--ed-border)",
              borderRadius: 99, fontSize: 12, fontWeight: 600, color: "var(--ed-text-1)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
              {label}: {val}
            </span>
          ))}
          <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
            background: "var(--st-early-bg)", border: "1px solid var(--st-early-bd)",
            borderRadius: 99, fontSize: 12, fontWeight: 600, color: "var(--st-early-tx)" }}>
            <Timer size={11} /> {summary.total_days} day{summary.total_days !== 1 ? "s" : ""} tracked
          </span>
        </div>
      )}

      {/* ───────────── Main grid ───────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Row 1: Heatmap + Today detail */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

          <Card title="Attendance Heatmap — Last 6 Months">
            <AttendanceHeatmap records={records} loading={recsLoad} joiningDate={joiningDate} isDark={isDark} />
          </Card>

          <Card title="Today's Detail">
            {todayLoad ? <Spin /> : todayRec ? (
              <div>
                {[
                  { label: "Status", value: <StatusBadge status={todayRec.status} /> },
                  { label: "In",     value: <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ed-text-1)" }}>{fmt12(todayRec.in_time)}</span>  },
                  { label: "Out",    value: <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ed-text-1)" }}>{fmt12(todayRec.out_time)}</span> },
                  { label: "Hours",  value: <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ed-text-1)" }}>{fmtHours(todayRec.hours)}</span> },
                  { label: "Mode",   value: (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                      background: todayRec.attendance_mode === "remote" ? "var(--st-early-bg)" : "var(--ed-hover)",
                      color:      todayRec.attendance_mode === "remote" ? "var(--st-early-tx)" : "var(--ed-text-2)",
                      border:     `1px solid ${todayRec.attendance_mode === "remote" ? "var(--st-early-bd)" : "var(--ed-border-md)"}` }}>
                      {todayRec.attendance_mode || "onsite"}
                    </span>
                  )},
                ].map(({ label, value }) => (
                  <div key={label} className="ed-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ed-text-3)" }}>{label}</span>
                    {value}
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon={CalendarCheck} text="No punch record for today." />
            )}
          </Card>
        </div>

        {/* Row 2: Recent Days + Applications + Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>

          <Card title="Recent Days">
            {recsLoad ? <Spin /> : recentRecs.length > 0
              ? <div>{recentRecs.map((r) => <AttendanceRow key={r.date} rec={r} />)}</div>
              : <Empty icon={BarChart2} text="No records found." />}
          </Card>

          <Card title="My Applications" action={
            !appLoad && appStats && (
              <div style={{ display: "flex", gap: 6 }}>
                {appStats.pending  > 0 &&
                  <span data-status="Late"    style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, border: "1px solid" }}>{appStats.pending} Pending</span>}
                {appStats.approved > 0 &&
                  <span data-status="Present" style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, border: "1px solid" }}>{appStats.approved} Approved</span>}
              </div>
            )
          }>
            {appLoad ? <Spin /> : recentApps.length > 0
              ? <div>{recentApps.map((a) => <AppMini key={a.id} app={a} />)}</div>
              : <Empty icon={FileText} text="No applications yet." />}
          </Card>

          {!appLoad && appStats ? (
            <Card title="Application Breakdown">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Pending",      val: appStats.pending,                                  color: "var(--ic-violet-fg)" },
                  { label: "HOD Approved", val: appStats.hod_approved,                             color: "var(--ic-sky-fg)"    },
                  { label: "Approved",     val: appStats.approved,                                 color: "var(--ic-green-fg)"  },
                  { label: "Rejected",     val: (appStats.rejected || 0) + (appStats.hod_rejected || 0), color: "var(--ic-red-fg)" },
                ].map(({ label, val, color }) => {
                  const pct = Math.round(((val || 0) / (appStats.total || 1)) * 100);
                  return (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "var(--ed-text-2)", fontWeight: 500 }}>{label}</span>
                        <span style={{ color, fontWeight: 700 }}>{val || 0}</span>
                      </div>
                      <ProgressBar pct={pct} color={color} />
                    </div>
                  );
                })}
                <p style={{ fontSize: 10, color: "var(--ed-text-3)", margin: "4px 0 0" }}>
                  {appStats.total} total application{appStats.total !== 1 ? "s" : ""}
                </p>
              </div>
            </Card>
          ) : <div />}
        </div>

        {/* Row 3: Coming Soon */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          <ComingSoonCard title="Notice Board"        icon={Bell}          iconBg="var(--ic-violet-bg)" iconColor="var(--ic-violet-fg)"
            description="Company-wide announcements and notices will appear here." />
          <ComingSoonCard title="Policies"            icon={Shield}        iconBg="var(--ic-blue-bg)"   iconColor="var(--ic-blue-fg)"
            description="Access and acknowledge your company policies from this card." />
          <ComingSoonCard title="Training & Learning" icon={GraduationCap} iconBg="var(--ic-amber-bg)"  iconColor="var(--ic-amber-fg)"
            description="Track assigned trainings, progress, and completions here." />
        </div>

      </div>
    </div>
  );
}