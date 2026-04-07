/**
 * HRDashboard.jsx
 *
 * For: HR Admin (level 3) & HR (level 4)
 * JWT payload shape: { sub, EPI, id, level, exp }
 * Permission-gated sections based on role.extra_data.permissions
 *
 * Sections (permission-gated):
 *  - employees.*   → Headcount, New Hires, Departures, Employee Table
 *  - attendance.*  → Attendance Overview, Today's Status, Summary
 *  - leaves.*      → Pending Leaves, Approval Queue
 *  - departments.* → Department Breakdown
 *  - policies.*    → Policy Acknowledgement Status
 *  - notices.*     → Recent Notices
 *
 * APIs used (from provided Apis.js):
 *  GET /employees
 *  GET /departments
 *  GET /attendance/me/today  (for logged-in user context)
 *  GET /attendance/summary   (admin)
 *  GET /applications         (leaves)
 *  GET /applications/stats
 *  GET /policies/stats
 *  GET /notices/stats
 *  GET /notices/
 */

import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import {
  Users, UserCheck, UserX, UserPlus,
  Building2, Clock, CalendarDays, CalendarCheck,
  FileText, Bell, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, AlertTriangle, AlertCircle,
  ChevronRight, RefreshCw, Loader2,
  ArrowUpRight, ArrowDownRight, Minus,
  Shield, Megaphone, BookOpen,
  LayoutDashboard, Sparkles,
  Activity, BarChart3, PieChart,
  Timer, Moon,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─────────────────────────────────────────────
   INJECT STYLES
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --hr-bg:       #f0f2f8;
    --hr-surface:  #ffffff;
    --hr-border:   #e4e8f0;
    --hr-text:     #1a1f36;
    --hr-muted:    #6b7694;
    --hr-accent:   #4f46e5;
    --hr-accent2:  #7c3aed;
    --hr-green:    #059669;
    --hr-amber:    #d97706;
    --hr-red:      #dc2626;
    --hr-blue:     #2563eb;
  }

  .hr-root * { font-family: 'Sora', sans-serif; box-sizing: border-box; }
  .hr-mono   { font-family: 'JetBrains Mono', monospace !important; }

  @keyframes hrFadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hrFadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes hrSlide    { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes hrSpin     { to{transform:rotate(360deg)} }
  @keyframes hrCount    { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes hrPulse    { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes hrGlow     {
    0%  { box-shadow: 0 0 0 0 rgba(79,70,229,.28); }
    70% { box-shadow: 0 0 0 10px rgba(79,70,229,0); }
    100%{ box-shadow: 0 0 0 0 rgba(79,70,229,0); }
  }
  @keyframes hrBar {
    from { width: 0 }
  }

  .hr-fade-up   { animation: hrFadeUp  .45s cubic-bezier(.4,0,.2,1) both; }
  .hr-fade-in   { animation: hrFadeIn  .3s ease both; }
  .hr-spin      { animation: hrSpin    .9s linear infinite; }
  .hr-count     { animation: hrCount   .5s cubic-bezier(.4,0,.2,1) both; }
  .hr-pulse     { animation: hrPulse   1.8s ease-in-out infinite; }
  .hr-glow      { animation: hrGlow    2.2s ease-out infinite; }

  .hr-card {
    background: var(--hr-surface);
    border: 1px solid var(--hr-border);
    border-radius: 20px;
    padding: 24px;
    transition: box-shadow .2s, transform .2s;
  }
  .hr-card:hover { box-shadow: 0 8px 32px rgba(79,70,229,.07); }

  .hr-stat-card {
    border-radius: 20px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    transition: transform .2s, box-shadow .2s;
  }
  .hr-stat-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,.09); }
  .hr-stat-card::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 130px; height: 130px;
    border-radius: 50%;
    background: rgba(255,255,255,.12);
  }

  .hr-bar-track { background: #eef0f8; border-radius: 99px; height: 8px; overflow: hidden; }
  .hr-bar-fill  {
    height: 100%; border-radius: 99px;
    animation: hrBar .8s cubic-bezier(.4,0,.2,1) both;
  }

  .hr-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 99px;
    font-size: 11px; font-weight: 600; letter-spacing: .02em;
  }

  .hr-avatar {
    width: 36px; height: 36px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; flex-shrink: 0;
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    color: #4338ca;
  }

  .hr-table th {
    font-size: 10px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: var(--hr-muted);
    padding: 10px 16px; border-bottom: 1px solid var(--hr-border);
    background: #f8f9fc; white-space: nowrap;
  }
  .hr-table td {
    padding: 12px 16px; font-size: 13px; color: var(--hr-text);
    border-bottom: 1px solid #f3f4f8; white-space: nowrap;
  }
  .hr-table tr:last-child td { border-bottom: none; }
  .hr-table tr:hover td { background: #f8f9fc; }

  .hr-section-title {
    font-size: 11px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: var(--hr-muted);
    margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
  }
  .hr-section-title::after {
    content: ''; flex: 1; height: 1px; background: var(--hr-border);
  }

  .hr-skeleton {
    background: linear-gradient(90deg, #eef0f8 25%, #f5f6fa 50%, #eef0f8 75%);
    background-size: 200% 100%;
    animation: hrSkeletonWave 1.4s ease-in-out infinite;
    border-radius: 8px;
  }
  @keyframes hrSkeletonWave {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .hr-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
  .hr-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .hr-scrollbar::-webkit-scrollbar-thumb { background: #d1d5e8; border-radius: 99px; }
`;

if (typeof document !== "undefined" && !document.getElementById("__hr_dash_css__")) {
  const el = document.createElement("style");
  el.id = "__hr_dash_css__";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getToken() { return localStorage.getItem("access_token") || ""; }

function getHeaders() {
  const t = getToken();
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

/** Parse JWT without a library */
function parseJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return {}; }
}

/** Get current user's context from JWT */
function useCurrentUser() {
  return useMemo(() => {
    const payload = parseJWT(getToken());
    return {
      id:    payload.id    ?? payload.EPI ?? parseInt(payload.sub) ?? null,
      EPI:   payload.EPI   ?? null,
      level: payload.level ?? 99,
      sub:   payload.sub   ?? null,
    };
  }, []);
}

/** Permission check — reads from stored role data */
function usePermissions() {
  const [perms, setPerms] = useState(new Set());
  const { level } = useCurrentUser();

  // Map of role level → permission sets (from the roles JSON provided)
  const LEVEL_PERMS = {
    1: ["employees.view","employees.create","employees.edit","employees.delete","attendance.view","attendance.manage","attendance.export","leaves.view","leaves.approve","leaves.reject","leaves.manage","departments.view","departments.manage","departments.assign_head","policies.view","policies.create","policies.edit","policies.delete","notices.view","notices.create","notices.manage","payroll.view","payroll.process","payroll.export","roles.view","roles.create","roles.edit","roles.delete"],
    2: ["employees.view","attendance.view","attendance.manage","attendance.export","leaves.view","leaves.approve","leaves.reject","leaves.manage","departments.view","departments.manage","departments.assign_head","policies.view","policies.create","policies.edit","policies.delete","notices.view","notices.create","notices.manage","payroll.view","payroll.process","payroll.export"],
    3: ["employees.view","employees.create","employees.edit","employees.delete","attendance.view","attendance.manage","attendance.export","leaves.view","leaves.approve","leaves.reject","leaves.manage","departments.view","departments.manage","departments.assign_head","policies.view","policies.create","policies.edit","policies.delete","notices.view","notices.create","notices.manage"],
    4: ["employees.view","employees.create","employees.edit","employees.delete","attendance.view","attendance.manage","attendance.export","leaves.view","leaves.approve","leaves.reject","leaves.manage","departments.view","departments.manage","departments.assign_head","policies.view","policies.create","policies.edit","policies.delete","notices.view","notices.create","notices.manage"],
    5: ["employees.view","attendance.view","payroll.view","payroll.process","payroll.export","notices.view"],
    6: ["employees.view","employees.edit","attendance.view","attendance.manage","attendance.export","leaves.view","leaves.approve","leaves.reject","leaves.manage"],
    7: ["attendance.view","policies.view","notices.view","leaves.view"],
    8: ["attendance.view","leaves.view","policies.view","notices.view"],
    9: ["attendance.view"],
  };

  useEffect(() => {
    const p = LEVEL_PERMS[level] || [];
    setPerms(new Set(p));
  }, [level]);

  const can = useCallback((perm) => perms.has(perm), [perms]);
  return { perms, can };
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
}
function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}
function pct(n, d) { return d > 0 ? Math.round((n / d) * 100) : 0; }

/* ─────────────────────────────────────────────
   DATA FETCHER HOOK
───────────────────────────────────────────── */
function useFetch(url, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!url) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [url]);

  useEffect(() => { load(); }, [load, ...deps]);
  return { data, loading, error, reload: load };
}

/* ─────────────────────────────────────────────
   SMALL UI ATOMS
───────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 20, r = 8 }) {
  return <div className="hr-skeleton" style={{ width: w, height: h, borderRadius: r }} />;
}

function Chip({ children, color = "blue" }) {
  const colors = {
    blue:   "background:#dbeafe;color:#1d4ed8",
    green:  "background:#d1fae5;color:#065f46",
    amber:  "background:#fef3c7;color:#92400e",
    red:    "background:#fee2e2;color:#991b1b",
    violet: "background:#ede9fe;color:#5b21b6",
    gray:   "background:#f3f4f6;color:#374151",
  };
  return (
    <span className="hr-chip" style={{ cssText: colors[color] || colors.gray }}>
      {children}
    </span>
  );
}

function StatCard({ title, value, sub, icon: Icon, gradient, trend, loading, delay = 0 }) {
  const gradients = {
    indigo:  "linear-gradient(135deg, #4f46e5, #7c3aed)",
    emerald: "linear-gradient(135deg, #059669, #0d9488)",
    amber:   "linear-gradient(135deg, #d97706, #dc2626)",
    sky:     "linear-gradient(135deg, #0284c7, #4f46e5)",
    rose:    "linear-gradient(135deg, #dc2626, #db2777)",
    teal:    "linear-gradient(135deg, #0d9488, #059669)",
  };
  return (
    <div className="hr-stat-card hr-fade-up"
      style={{ background: gradients[gradient] || gradients.indigo, color: "#fff", animationDelay: `${delay}ms` }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ background:"rgba(255,255,255,.18)", borderRadius:14, padding:10, display:"flex" }}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600,
            background:"rgba(255,255,255,.18)", borderRadius:99, padding:"3px 10px" }}>
            {trend > 0 ? <ArrowUpRight size={13} /> : trend < 0 ? <ArrowDownRight size={13} /> : <Minus size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {loading ? (
        <div style={{ background:"rgba(255,255,255,.25)", height:36, borderRadius:10, marginBottom:8 }} />
      ) : (
        <div className="hr-count" style={{ fontSize:36, fontWeight:800, lineHeight:1, marginBottom:6 }}>{value ?? "—"}</div>
      )}
      <div style={{ fontSize:13, fontWeight:600, opacity:.9 }}>{title}</div>
      {sub && <div style={{ fontSize:11, opacity:.7, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="hr-section-title">
      {Icon && <Icon size={13} />}
      {children}
    </div>
  );
}

function Card({ children, style = {}, className = "", delay = 0 }) {
  return (
    <div className={`hr-card hr-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, msg }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:"40px 20px", gap:12, opacity:.5 }}>
      <Icon size={32} strokeWidth={1.5} />
      <p style={{ fontSize:13, margin:0 }}>{msg}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DONUT CHART (pure SVG, no library)
───────────────────────────────────────────── */
function DonutChart({ segments, size = 120, stroke = 22 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#eef0f8" strokeWidth={stroke} />
      {segments.map((seg, i) => {
        if (!seg.value) return null;
        const len = (seg.value / total) * circ;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${len} ${circ}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        );
        offset += len + 2;
        return el;
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   MINI BAR CHART (SVG sparkline)
───────────────────────────────────────────── */
function BarSparkline({ data = [], color = "#4f46e5", height = 48 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w   = 8;
  const gap = 4;
  const total = data.length * (w + gap) - gap;

  return (
    <svg width={total} height={height} style={{ display:"block" }}>
      {data.map((v, i) => {
        const bh = Math.max((v / max) * height, 3);
        return (
          <rect key={i} x={i * (w + gap)} y={height - bh}
            width={w} height={bh} rx={3}
            fill={color} opacity={.7 + .3 * (v / max)} />
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   PERMISSION GATE
───────────────────────────────────────────── */
function Gate({ perm, can, children, fallback = null }) {
  if (!can(perm)) return fallback;
  return children;
}

/* ─────────────────────────────────────────────
   SECTION: EMPLOYEE OVERVIEW
───────────────────────────────────────────── */
function EmployeeSection({ can }) {
  const { data: employees, loading, error } = useFetch(API.GetAllEmployees);

  const stats = useMemo(() => {
    if (!employees) return null;
    const list = Array.isArray(employees) ? employees : (employees.employees || employees.data || []);
    const active     = list.filter(e => e.employment_status === "active");
    const inactive   = list.filter(e => e.employment_status !== "active");
    const remote     = list.filter(e => e.is_remote);
    // New hires this month
    const now = new Date();
    const newHires = list.filter(e => {
      if (!e.join_date) return false;
      const d = new Date(e.join_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    // Dept breakdown
    const deptMap = {};
    list.forEach(e => {
      const d = e.department?.department || e.department_name || "Unknown";
      deptMap[d] = (deptMap[d] || 0) + 1;
    });
    const depts = Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return { total: list.length, active: active.length, inactive: inactive.length, remote: remote.length, newHires: newHires.length, depts, list: list.slice(0, 8) };
  }, [employees]);

  const DEPT_COLORS = ["#4f46e5","#059669","#d97706","#2563eb","#dc2626","#7c3aed"];

  return (
    <div>
      <SectionTitle icon={Users}>Workforce Overview</SectionTitle>

      {/* Stat grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[
          { title:"Total Headcount",  key:"total",    icon:Users,     gradient:"indigo",  delay:0   },
          { title:"Active",           key:"active",   icon:UserCheck, gradient:"emerald", delay:60  },
          { title:"New This Month",   key:"newHires", icon:UserPlus,  gradient:"sky",     delay:120 },
          { title:"Remote",           key:"remote",   icon:Activity,  gradient:"teal",    delay:180 },
        ].map(({ title, key, icon, gradient, delay }) => (
          <StatCard key={key} title={title} value={stats?.[key]} icon={icon}
            gradient={gradient} loading={loading} delay={delay} />
        ))}
      </div>

      {/* Dept breakdown + recent employees */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.8fr", gap:14 }}>

        {/* Department donut */}
        <Card delay={200}>
          <div style={{ fontWeight:700, fontSize:13, color:"var(--hr-text)", marginBottom:16 }}>By Department</div>
          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={16} />)}
            </div>
          ) : stats?.depts.length ? (
            <div style={{ display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <DonutChart
                  size={120} stroke={22}
                  segments={stats.depts.map((d, i) => ({ value: d[1], color: DEPT_COLORS[i % DEPT_COLORS.length] }))}
                />
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                  justifyContent:"center", flexDirection:"column" }}>
                  <span style={{ fontSize:20, fontWeight:800, color:"var(--hr-text)" }}>{stats.total}</span>
                  <span style={{ fontSize:10, color:"var(--hr-muted)" }}>total</span>
                </div>
              </div>
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:7 }}>
                {stats.depts.map(([dept, count], i) => (
                  <div key={dept} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:DEPT_COLORS[i % DEPT_COLORS.length], flexShrink:0 }} />
                    <span style={{ fontSize:11, color:"var(--hr-text)", flex:1, overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{dept}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"var(--hr-muted)" }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState icon={Building2} msg="No department data" />}
        </Card>

        {/* Recent employees table */}
        <Card delay={240} style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"18px 20px 12px", fontWeight:700, fontSize:13, color:"var(--hr-text)",
            borderBottom:"1px solid var(--hr-border)" }}>
            Recent Employees
          </div>
          <div className="hr-scrollbar" style={{ overflowY:"auto", maxHeight:220 }}>
            {loading ? (
              <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
                {[1,2,3,4].map(i => <Skeleton key={i} h={36} />)}
              </div>
            ) : stats?.list.length ? (
              <table className="hr-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:"left" }}>Employee</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.list.map(emp => {
                    const name = `${emp.f_name || ""} ${emp.l_name || ""}`.trim() || "—";
                    const status = emp.employment_status || "active";
                    const statusColor = status === "active" ? "green" : status === "probation" ? "amber" : "red";
                    return (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div className="hr-avatar"
                              style={{ background:`hsl(${(emp.id * 47) % 360},60%,88%)`,
                                       color:`hsl(${(emp.id * 47) % 360},60%,30%)` }}>
                              {initials(name)}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, fontSize:13 }}>{name}</div>
                              <div style={{ fontSize:11, color:"var(--hr-muted)" }}>{emp.designation || emp.role?.name || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign:"center" }}>
                          <span className="hr-chip" style={{
                            background: statusColor === "green" ? "#d1fae5" : statusColor === "amber" ? "#fef3c7" : "#fee2e2",
                            color:      statusColor === "green" ? "#065f46" : statusColor === "amber" ? "#92400e" : "#991b1b",
                          }}>
                            {status}
                          </span>
                        </td>
                        <td style={{ textAlign:"center", fontSize:12, color:"var(--hr-muted)" }}>
                          {fmtDate(emp.join_date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <EmptyState icon={Users} msg="No employees found" />}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: ATTENDANCE
───────────────────────────────────────────── */
function AttendanceSection({ can, user }) {
  const today = new Date();
  const monthStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;

  const { data: summary, loading: sLoad } = useFetch(
    user.id ? API.AttendanceSummaryAdmin(user.id, monthStr) : null
  );
  const { data: todayData, loading: tLoad } = useFetch(
    user.id ? API.MyAttendanceToday(user.id) : null
  );

  const attendanceSummary = summary || todayData?.summary || {};

  const present  = attendanceSummary.present_days  ?? attendanceSummary.present  ?? 0;
  const absent   = attendanceSummary.absent_days   ?? attendanceSummary.absent   ?? 0;
  const late     = attendanceSummary.late_days      ?? attendanceSummary.late     ?? 0;
  const total    = (present + absent + late) || 22; // working days fallback
  const pctPresent = pct(present, total);

  // Sparkline mock from summary data
  const sparkData = [present, absent, late, present, absent].filter(Boolean);

  return (
    <div>
      <SectionTitle icon={Clock}>Attendance Overview</SectionTitle>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
        <Card delay={300} style={{ background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1px solid #bbf7d0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#166534", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Present Days</div>
              {sLoad ? <Skeleton w={60} h={32} /> : (
                <div className="hr-count" style={{ fontSize:34, fontWeight:800, color:"#15803d" }}>{present}</div>
              )}
              <div style={{ fontSize:11, color:"#166534", marginTop:4 }}>this month</div>
            </div>
            <div style={{ background:"#bbf7d0", borderRadius:12, padding:10 }}>
              <UserCheck size={20} color="#16a34a" />
            </div>
          </div>
          <div className="hr-bar-track" style={{ marginTop:14 }}>
            <div className="hr-bar-fill" style={{ width:`${pctPresent}%`, background:"#16a34a" }} />
          </div>
          <div style={{ fontSize:10, color:"#166534", marginTop:4 }}>{pctPresent}% attendance rate</div>
        </Card>

        <Card delay={360} style={{ background:"linear-gradient(135deg,#fff7ed,#fed7aa)", border:"1px solid #fdba74" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#9a3412", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Late Arrivals</div>
              {sLoad ? <Skeleton w={60} h={32} /> : (
                <div className="hr-count" style={{ fontSize:34, fontWeight:800, color:"#c2410c" }}>{late}</div>
              )}
              <div style={{ fontSize:11, color:"#9a3412", marginTop:4 }}>this month</div>
            </div>
            <div style={{ background:"#fed7aa", borderRadius:12, padding:10 }}>
              <Timer size={20} color="#ea580c" />
            </div>
          </div>
          <div className="hr-bar-track" style={{ marginTop:14 }}>
            <div className="hr-bar-fill" style={{ width:`${pct(late, total)}%`, background:"#ea580c" }} />
          </div>
          <div style={{ fontSize:10, color:"#9a3412", marginTop:4 }}>{pct(late, total)}% late rate</div>
        </Card>

        <Card delay={420} style={{ background:"linear-gradient(135deg,#fef2f2,#fecaca)", border:"1px solid #fca5a5" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#991b1b", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Absent Days</div>
              {sLoad ? <Skeleton w={60} h={32} /> : (
                <div className="hr-count" style={{ fontSize:34, fontWeight:800, color:"#dc2626" }}>{absent}</div>
              )}
              <div style={{ fontSize:11, color:"#991b1b", marginTop:4 }}>this month</div>
            </div>
            <div style={{ background:"#fecaca", borderRadius:12, padding:10 }}>
              <UserX size={20} color="#dc2626" />
            </div>
          </div>
          <div className="hr-bar-track" style={{ marginTop:14 }}>
            <div className="hr-bar-fill" style={{ width:`${pct(absent, total)}%`, background:"#dc2626" }} />
          </div>
          <div style={{ fontSize:10, color:"#991b1b", marginTop:4 }}>{pct(absent, total)}% absence rate</div>
        </Card>
      </div>

      {/* Today's check-in */}
      {todayData && (
        <Card delay={460}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:"var(--hr-text)", marginBottom:4 }}>My Today's Attendance</div>
              <div style={{ fontSize:12, color:"var(--hr-muted)" }}>{new Date().toLocaleDateString("en-PK", { weekday:"long", day:"numeric", month:"long" })}</div>
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {[
                { label:"Check In",  val: todayData.check_in  ?? todayData.in_time  ?? todayData.first_in,  icon: UserCheck,  color:"#059669" },
                { label:"Check Out", val: todayData.check_out ?? todayData.out_time ?? todayData.last_out,  icon: UserX,      color:"#dc2626" },
                { label:"Status",    val: todayData.status    ?? todayData.attendance_status ?? "—",        icon: Activity,   color:"#4f46e5" },
              ].map(({ label, val, icon: Icon, color }) => (
                <div key={label} style={{ textAlign:"center", background:"#f8f9fc", borderRadius:14,
                  padding:"12px 20px", border:"1px solid var(--hr-border)" }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--hr-text)" }}>
                    {typeof val === "string" && val.includes("T") ? fmtTime(val) : (val || "—")}
                  </div>
                  <div style={{ fontSize:10, color:"var(--hr-muted)", marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: LEAVE APPLICATIONS
───────────────────────────────────────────── */
function LeaveSection({ can }) {
  const { data: rawApps, loading: appLoad } = useFetch(API.GetAllApplications);
  const { data: statsData, loading: stLoad } = useFetch(API.ApplicationStats);

  const apps = useMemo(() => {
    if (!rawApps) return [];
    const list = Array.isArray(rawApps) ? rawApps : (rawApps.applications || rawApps.data || []);
    return list;
  }, [rawApps]);

  const stats = statsData || {};
  const pending  = apps.filter(a => (a.status || "").toLowerCase() === "pending");
  const approved = stats.approved ?? apps.filter(a => (a.status || "").toLowerCase() === "approved").length;
  const rejected = stats.rejected ?? apps.filter(a => (a.status || "").toLowerCase() === "rejected").length;
  const totalApps = stats.total ?? apps.length;

  const STATUS_CFG = {
    pending:  { bg:"#fef3c7", color:"#92400e", label:"Pending"  },
    approved: { bg:"#d1fae5", color:"#065f46", label:"Approved" },
    rejected: { bg:"#fee2e2", color:"#991b1b", label:"Rejected" },
    cancelled:{ bg:"#f3f4f6", color:"#374151", label:"Cancelled"},
  };

  return (
    <div>
      <SectionTitle icon={CalendarDays}>Leave Applications</SectionTitle>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[
          { label:"Total",    value: stLoad ? null : totalApps,       bg:"#ede9fe", color:"#5b21b6" },
          { label:"Pending",  value: stLoad ? null : pending.length,  bg:"#fef3c7", color:"#92400e" },
          { label:"Approved", value: stLoad ? null : approved,        bg:"#d1fae5", color:"#065f46" },
          { label:"Rejected", value: stLoad ? null : rejected,        bg:"#fee2e2", color:"#991b1b" },
        ].map(({ label, value, bg, color }) => (
          <div key={label} className="hr-fade-up"
            style={{ background:bg, borderRadius:16, padding:"16px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color, textTransform:"uppercase", letterSpacing:".07em", marginBottom:8 }}>{label}</div>
            {stLoad ? <Skeleton w={40} h={28} /> : (
              <div className="hr-count" style={{ fontSize:28, fontWeight:800, color }}>{value ?? "—"}</div>
            )}
          </div>
        ))}
      </div>

      {/* Pending queue */}
      {can("leaves.approve") && (
        <Card style={{ padding:0, overflow:"hidden" }} delay={300}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--hr-border)",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontWeight:700, fontSize:13, color:"var(--hr-text)", display:"flex", alignItems:"center", gap:8 }}>
              <div className="hr-pulse" style={{ width:8, height:8, borderRadius:"50%", background:"#f59e0b" }} />
              Pending Approvals
              {pending.length > 0 && (
                <span style={{ background:"#f59e0b", color:"#fff", borderRadius:99, padding:"1px 8px",
                  fontSize:11, fontWeight:700 }}>{pending.length}</span>
              )}
            </div>
          </div>
          <div className="hr-scrollbar" style={{ overflowY:"auto", maxHeight:260 }}>
            {appLoad ? (
              <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
                {[1,2,3].map(i => <Skeleton key={i} h={52} />)}
              </div>
            ) : pending.length ? (
              <table className="hr-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:"left" }}>Employee</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Applied</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 10).map(app => {
                    const empName = app.employee_name || app.employee?.name ||
                      `${app.employee?.f_name || ""} ${app.employee?.l_name || ""}`.trim() || `Emp #${app.employee_id}`;
                    const st = (app.status || "pending").toLowerCase();
                    const sc = STATUS_CFG[st] || STATUS_CFG.pending;
                    return (
                      <tr key={app.id}>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                            <div className="hr-avatar"
                              style={{ background:`hsl(${(app.employee_id * 53) % 360},55%,88%)`,
                                       color:`hsl(${(app.employee_id * 53) % 360},55%,28%)` }}>
                              {initials(empName)}
                            </div>
                            <span style={{ fontWeight:600, fontSize:13 }}>{empName}</span>
                          </div>
                        </td>
                        <td style={{ textAlign:"center" }}>
                          <span style={{ fontSize:12, fontWeight:600, color:"var(--hr-muted)" }}>
                            {app.leave_type || app.type || app.application_type || "Leave"}
                          </span>
                        </td>
                        <td style={{ textAlign:"center", fontSize:12, color:"var(--hr-muted)" }}>
                          {app.total_days ? `${app.total_days}d` : "—"}
                        </td>
                        <td style={{ textAlign:"center", fontSize:11, color:"var(--hr-muted)" }}>
                          {fmtDate(app.created_at || app.applied_at)}
                        </td>
                        <td style={{ textAlign:"center" }}>
                          <span className="hr-chip" style={{ background:sc.bg, color:sc.color }}>{sc.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <EmptyState icon={CalendarCheck} msg="No pending leave applications" />}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: POLICY + NOTICE SNAPSHOTS
───────────────────────────────────────────── */
function PolicyNoticeSection({ can }) {
  const { data: pStats, loading: pLoad } = useFetch(
    can("policies.view") ? API.PolicyStats : null
  );
  const { data: nStats, loading: nLoad } = useFetch(
    can("notices.view") ? API.NoticeStats : null
  );
  const { data: noticesRaw, loading: notLoad } = useFetch(
    can("notices.view") ? API.GetAllNotices() : null
  );

  const recentNotices = useMemo(() => {
    if (!noticesRaw) return [];
    const list = Array.isArray(noticesRaw) ? noticesRaw : (noticesRaw.notices || []);
    return list.filter(n => n.is_active).slice(0, 5);
  }, [noticesRaw]);

  const PRIORITY_COLORS = { Urgent:"#dc2626", High:"#d97706", Medium:"#2563eb", Low:"#6b7694" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      {/* Policy snapshot */}
      {can("policies.view") && (
        <Card delay={350}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div style={{ background:"#ede9fe", borderRadius:12, padding:10, display:"flex" }}>
              <BookOpen size={18} color="#7c3aed" />
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:"var(--hr-text)" }}>Policy Tracker</div>
              <div style={{ fontSize:11, color:"var(--hr-muted)" }}>Acknowledgement rates</div>
            </div>
          </div>
          {pLoad ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={20} />)}
            </div>
          ) : pStats ? (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  { label:"Total Policies", value:pStats.total,     bg:"#ede9fe", color:"#5b21b6" },
                  { label:"Active",         value:pStats.active,    bg:"#d1fae5", color:"#065f46" },
                  { label:"Pending Review", value:pStats.review,    bg:"#fef3c7", color:"#92400e" },
                  { label:"Avg Ack Rate",   value:`${Math.round(pStats.avg_ack_rate || 0)}%`, bg:"#dbeafe", color:"#1d4ed8" },
                ].map(({ label, value, bg, color }) => (
                  <div key={label} style={{ background:bg, borderRadius:12, padding:"12px 14px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>{label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color }}>{value ?? "—"}</div>
                  </div>
                ))}
              </div>
              {/* Ack rate bar */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:"var(--hr-muted)" }}>Company Ack Rate</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#7c3aed" }}>{Math.round(pStats.avg_ack_rate || 0)}%</span>
                </div>
                <div className="hr-bar-track">
                  <div className="hr-bar-fill" style={{ width:`${pStats.avg_ack_rate || 0}%`,
                    background:"linear-gradient(90deg,#7c3aed,#4f46e5)" }} />
                </div>
              </div>
            </>
          ) : <EmptyState icon={BookOpen} msg="No policy data" />}
        </Card>
      )}

      {/* Recent notices */}
      {can("notices.view") && (
        <Card delay={400} style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid var(--hr-border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ background:"#fef3c7", borderRadius:12, padding:8, display:"flex" }}>
                <Bell size={16} color="#d97706" />
              </div>
              <div style={{ fontWeight:700, fontSize:13, color:"var(--hr-text)" }}>Recent Notices</div>
            </div>
            {nLoad ? null : nStats && (
              <div style={{ display:"flex", gap:12, marginTop:8 }}>
                {[
                  { label:"Total",  val:nStats.total,  color:"#6b7694" },
                  { label:"Active", val:nStats.active, color:"#059669" },
                  { label:"Urgent", val:nStats.urgent, color:"#dc2626" },
                  { label:"Pinned", val:nStats.pinned, color:"#4f46e5" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ fontSize:11 }}>
                    <span style={{ fontWeight:800, color }}>{val ?? 0}</span>
                    <span style={{ color:"var(--hr-muted)", marginLeft:4 }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="hr-scrollbar" style={{ overflowY:"auto", maxHeight:230 }}>
            {notLoad ? (
              <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
                {[1,2,3].map(i => <Skeleton key={i} h={44} />)}
              </div>
            ) : recentNotices.length ? (
              recentNotices.map((n, i) => (
                <div key={n.id} style={{ padding:"14px 20px", borderBottom:"1px solid #f3f4f8",
                  display:"flex", alignItems:"flex-start", gap:12,
                  background: i % 2 === 0 ? "#fff" : "#fcfcfe" }}>
                  <div style={{
                    width:6, height:6, borderRadius:"50%", marginTop:5, flexShrink:0,
                    background: PRIORITY_COLORS[n.priority] || "#6b7694",
                  }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"var(--hr-text)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize:11, color:"var(--hr-muted)", marginTop:2,
                      display:"flex", alignItems:"center", gap:8 }}>
                      <span>{n.category}</span>
                      <span>·</span>
                      <span>{fmtDate(n.created_at)}</span>
                    </div>
                  </div>
                  <span className="hr-chip" style={{
                    background: n.priority === "Urgent" ? "#fee2e2" : n.priority === "High" ? "#fef3c7" : "#f0f2ff",
                    color: PRIORITY_COLORS[n.priority] || "#6b7694",
                    flexShrink: 0,
                  }}>{n.priority}</span>
                </div>
              ))
            ) : <EmptyState icon={Bell} msg="No active notices" />}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION: DEPARTMENT BREAKDOWN
───────────────────────────────────────────── */
function DepartmentSection({ can }) {
  const { data: rawDepts, loading } = useFetch(
    can("departments.view") ? API.ListDepartment : null
  );

  const depts = useMemo(() => {
    if (!rawDepts) return [];
    return Array.isArray(rawDepts) ? rawDepts : (rawDepts.departments || rawDepts.data || []);
  }, [rawDepts]);

  return (
    <div>
      <SectionTitle icon={Building2}>Departments</SectionTitle>
      <Card style={{ padding:0, overflow:"hidden" }} delay={300}>
        <div className="hr-scrollbar" style={{ overflowX:"auto" }}>
          {loading ? (
            <div style={{ padding:20, display:"flex", flexDirection:"column", gap:12 }}>
              {[1,2,3,4].map(i => <Skeleton key={i} h={48} />)}
            </div>
          ) : depts.length ? (
            <table className="hr-table" style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign:"left" }}>Department</th>
                  <th>Head</th>
                  <th>Employees</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {depts.map((d, idx) => {
                  const headName = d.head_name || d.department_head?.name ||
                    (d.head ? `${d.head.f_name || ""} ${d.head.l_name || ""}`.trim() : null) || "—";
                  const empCount = d.employee_count ?? d.employees_count ?? d.total_employees ?? "—";
                  const DEPT_COLORS_BG = ["#ede9fe","#d1fae5","#dbeafe","#fef3c7","#fee2e2","#f0fdf4"];
                  const DEPT_COLORS_FG = ["#5b21b6","#065f46","#1e40af","#92400e","#991b1b","#166534"];
                  return (
                    <tr key={d.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:10, flexShrink:0,
                            background:DEPT_COLORS_BG[idx % DEPT_COLORS_BG.length],
                            color:DEPT_COLORS_FG[idx % DEPT_COLORS_FG.length],
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:13, fontWeight:800 }}>
                            {(d.department || d.name || "D")[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight:600, fontSize:13 }}>{d.department || d.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign:"center", fontSize:12, color:"var(--hr-muted)" }}>{headName}</td>
                      <td style={{ textAlign:"center" }}>
                        <span className="hr-chip" style={{ background:"#ede9fe", color:"#5b21b6" }}>
                          {empCount}
                        </span>
                      </td>
                      <td style={{ textAlign:"center", fontSize:11, color:"var(--hr-muted)" }}>
                        {fmtDate(d.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <EmptyState icon={Building2} msg="No departments found" />}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HEADER
───────────────────────────────────────────── */
function DashboardHeader({ user, level, onRefresh, refreshing }) {
  const LEVEL_LABELS = {
    1: "Super Admin", 2: "CEO", 3: "HR Admin", 4: "HR",
    5: "Finance", 6: "Department Head", 7: "Lead", 8: "Employee", 9: "Intern",
  };
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const GreetIcon = hour < 12 ? Sparkles : hour < 17 ? LayoutDashboard : Moon;

  return (
    <div className="hr-fade-in" style={{
      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%)",
      borderRadius: 24, padding: "28px 32px", marginBottom: 28, color: "#fff",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative circles */}
      <div style={{ position:"absolute", top:-60, right:-60, width:220, height:220,
        borderRadius:"50%", background:"rgba(255,255,255,.07)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-40, left:200, width:160, height:160,
        borderRadius:"50%", background:"rgba(255,255,255,.05)", pointerEvents:"none" }} />

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, position:"relative" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <GreetIcon size={18} style={{ opacity:.8 }} />
            <span style={{ fontSize:14, fontWeight:500, opacity:.85 }}>{greeting}</span>
          </div>
          <h1 style={{ fontSize:26, fontWeight:800, margin:0, lineHeight:1.1 }}>
            HR Dashboard
          </h1>
          <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, opacity:.75, display:"flex", alignItems:"center", gap:5 }}>
              <Shield size={12} /> {LEVEL_LABELS[level] || "HR"} · Level {level}
            </span>
            <span style={{ width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,.4)" }} />
            <span style={{ fontSize:12, opacity:.75 }}>
              {now.toLocaleDateString("en-PK", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
            </span>
            <span style={{ width:4, height:4, borderRadius:"50%", background:"rgba(255,255,255,.4)" }} />
            <span className="hr-mono" style={{ fontSize:12, opacity:.75 }}>
              EPI #{user.EPI || "—"} · ID #{user.id || "—"}
            </span>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ textAlign:"right", marginRight:4 }}>
            <div style={{ fontSize:11, opacity:.7 }}>Last refreshed</div>
            <div className="hr-mono" style={{ fontSize:12, fontWeight:600 }}>
              {now.toLocaleTimeString("en-PK", { hour:"2-digit", minute:"2-digit" })}
            </div>
          </div>
          <button onClick={onRefresh} disabled={refreshing}
            style={{ background:"rgba(255,255,255,.18)", border:"1px solid rgba(255,255,255,.25)",
              borderRadius:12, padding:"10px 12px", color:"#fff", cursor:"pointer",
              display:"flex", alignItems:"center", gap:7, fontSize:12, fontWeight:600,
              backdropFilter:"blur(8px)", transition:"background .2s" }}>
            <RefreshCw size={14} className={refreshing ? "hr-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Permission chips */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:18 }}>
        {[
          { label:"Employees",  perm:"employees.view", color:"#c7d2fe" },
          { label:"Attendance", perm:"attendance.view",color:"#a7f3d0" },
          { label:"Leaves",     perm:"leaves.view",    color:"#fde68a" },
          { label:"Departments",perm:"departments.view",color:"#bfdbfe"},
          { label:"Policies",   perm:"policies.view",  color:"#e9d5ff" },
          { label:"Notices",    perm:"notices.view",   color:"#fcd34d" },
        ].map(({ label, perm, color }) => (
          <span key={perm} style={{ fontSize:11, fontWeight:700, padding:"3px 10px",
            borderRadius:99, background:"rgba(255,255,255,.16)", color:"rgba(255,255,255,.9)",
            border:"1px solid rgba(255,255,255,.2)", letterSpacing:".03em" }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   QUICK ACTIONS
───────────────────────────────────────────── */
// function QuickActions({ can }) {
//   const actions = [
//     { label:"Add Employee",   icon:UserPlus,   perm:"employees.create", href:"#/employees/new",    bg:"#ede9fe", color:"#5b21b6" },
//     { label:"New Department", icon:Building2,  perm:"departments.manage",href:"#/departments",    bg:"#dbeafe", color:"#1d4ed8" },
//     { label:"Create Policy",  icon:BookOpen,   perm:"policies.create",  href:"#/policies/new",     bg:"#d1fae5", color:"#065f46" },
//     { label:"New Notice",     icon:Megaphone,  perm:"notices.create",   href:"#/notices/new",      bg:"#fef3c7", color:"#92400e" },
//     { label:"Review Leaves",  icon:CalendarCheck,perm:"leaves.approve", href:"#/applications",    bg:"#fee2e2", color:"#991b1b" },
//     { label:"View Attendance",icon:Clock,      perm:"attendance.view",  href:"#/attendance",       bg:"#f0fdf4", color:"#166534" },
//   ].filter(a => can(a.perm));

//   if (!actions.length) return null;

//   return (
//     <div style={{ marginBottom:28 }}>
//       <SectionTitle icon={Sparkles}>Quick Actions</SectionTitle>
//       <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
//         {actions.map(({ label, icon:Icon, href, bg, color }) => (
//           <a key={label} href={href}
//             style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 18px",
//               background:bg, color, borderRadius:14, fontSize:13, fontWeight:700,
//               border:`1px solid ${color}22`, textDecoration:"none", cursor:"pointer",
//               transition:"transform .15s, box-shadow .15s" }}
//             onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 6px 20px ${color}28`; }}
//             onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
//             <Icon size={15} />
//             {label}
//           </a>
//         ))}
//       </div>
//     </div>
//   );
// }

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function HRDashboard() {
  const user = useCurrentUser();
  const { can } = usePermissions();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Gate: only HR Admin (3) and HR (4) — allow higher levels too for flexibility
  const allowedLevels = [1, 2, 3, 4];
  const isAuthorized = allowedLevels.includes(user.level);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  if (!isAuthorized) {
    return (
      <div className="hr-root" style={{ minHeight:"100vh", background:"var(--hr-bg)",
        display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", padding:40 }}>
          <Shield size={48} color="#dc2626" style={{ marginBottom:16 }} />
          <h2 style={{ fontSize:20, fontWeight:800, color:"var(--hr-text)", margin:"0 0 8px" }}>Access Restricted</h2>
          <p style={{ color:"var(--hr-muted)", fontSize:14 }}>This dashboard is available for HR Admin and HR roles only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-root" style={{ minHeight:"100vh", background:"var(--hr-bg)",
      padding:"32px 32px 64px" }}>

      <DashboardHeader user={user} level={user.level} onRefresh={handleRefresh} refreshing={refreshing} />

      {/* <QuickActions can={can} /> */}

      {/* Employees */}
      {can("employees.view") && (
        <div style={{ marginBottom:32 }} key={`emp-${refreshKey}`}>
          <EmployeeSection can={can} />
        </div>
      )}

      {/* Attendance */}
      {can("attendance.view") && (
        <div style={{ marginBottom:32 }} key={`att-${refreshKey}`}>
          <AttendanceSection can={can} user={user} />
        </div>
      )}

      {/* Leave Applications */}
      {can("leaves.view") && (
        <div style={{ marginBottom:32 }} key={`leave-${refreshKey}`}>
          <LeaveSection can={can} />
        </div>
      )}

      {/* Policy + Notices */}
      {(can("policies.view") || can("notices.view")) && (
        <div style={{ marginBottom:32 }} key={`pn-${refreshKey}`}>
          <SectionTitle icon={BarChart3}>Policy & Communications</SectionTitle>
          <PolicyNoticeSection can={can} />
        </div>
      )}

      {/* Departments */}
      {can("departments.view") && (
        <div key={`dept-${refreshKey}`}>
          <DepartmentSection can={can} />
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop:48, textAlign:"center", color:"var(--hr-muted)", fontSize:12 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <Shield size={12} />
          HR Dashboard · Level {user.level} ·
          <span className="hr-mono">EPI #{user.EPI}</span>
        </div>
      </div>
    </div>
  );
}