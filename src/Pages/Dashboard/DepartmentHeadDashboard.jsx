/**
 * HODDashboard.jsx  —  Department Head Dashboard
 *
 * ── Two views ────────────────────────────────────────────────────
 *  "Department View"  — HOD managing their team
 *  "My View"          — HOD as an individual employee
 *
 * ── APIs connected ───────────────────────────────────────────────
 *  GetAllEmployees              GET /employees         (dept scoped client-side)
 *  DepartmentDetails            GET /departments/{id}
 *  AdminAttendanceRecords       GET /attendance/admin/records?month=&department_id=
 *  AdminAttendanceSummary       GET /attendance/admin/summary?month=&department_id=
 *  GetAllApplications           GET /applications      (backend scopes to dept)
 *  ApplicationStats             GET /applications/stats
 *  HODAction                    POST /applications/{id}/hod
 *  AdminNoticeList              GET /notices/admin/    (scoped by JWT)
 *  AdminNoticeStats             GET /notices/admin/stats
 *  MyAttendanceToday            GET /attendance/me/today?employee_id=
 *  MyAttendanceSummary          GET /attendance/me/summary?employee_id=&month=
 *  MyAttendanceByMonth          GET /attendance/me?employee_id=&month=
 *  MyNoticeList                 GET /notices/my/
 *  MyNoticeStats                GET /notices/my/stats
 *  MyNoticeAcked                GET /notices/my/acked
 *  AcknowledgeNotice            POST /notices/my/{id}/acknowledge
 *
 * ── Coming Soon ──────────────────────────────────────────────────
 *  KPI / Performance scores     — no backend yet
 *  Training module              — no backend yet
 *
 * ── JWT ─────────────────────────────────────────────────────────
 *  EPI > employee_id > id > sub  →  Employee.id
 *  department_id from token payload
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Bell,
  GraduationCap,
  Target,
  TrendingUp,
  Building2,
  UserCheck,
  LogIn,
  LogOut,
  Timer,
  Activity,
  Loader2,
  RefreshCw,
  Construction,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Pin,
  Megaphone,
  Calendar,
  Info,
  AlertCircle,
  ChevronLeft,
  Search,
  Eye,
  X,
} from "lucide-react";
import { API } from "../../Components/Apis";
import { filterEmployeesByDepartment } from "../../utils/authUtils";

/* ─── Styles ─── */
const _S = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  @keyframes hd-in    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hd-spin  { to{transform:rotate(360deg)} }
  @keyframes hd-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes hd-bar   { from{width:0} to{width:var(--tw,0%)} }
  @keyframes hd-scale { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  .hd-page * { font-family:'Inter',sans-serif; box-sizing:border-box; }
  .hd-in    { animation: hd-in    .28s cubic-bezier(.4,0,.2,1) both; }
  .hd-spin  { animation: hd-spin  .9s  linear infinite; }
  .hd-pulse { animation: hd-pulse 1.6s ease-in-out infinite; }
  .hd-scale { animation: hd-scale .22s cubic-bezier(.4,0,.2,1) both; }
  .hd-stagger>*:nth-child(1){animation-delay:.03s}
  .hd-stagger>*:nth-child(2){animation-delay:.07s}
  .hd-stagger>*:nth-child(3){animation-delay:.11s}
  .hd-stagger>*:nth-child(4){animation-delay:.15s}
  .hd-stagger>*:nth-child(5){animation-delay:.19s}
  .hd-stagger>*:nth-child(6){animation-delay:.23s}
  .hd-card {
    background:#fff;
    border-radius:20px;
    border:1px solid rgba(0,0,0,.06);
    box-shadow:0 1px 3px rgba(0,0,0,.04),0 5px 18px rgba(0,0,0,.05);
  }
  .hd-cs {
    background-image:repeating-linear-gradient(
      -45deg,rgba(0,0,0,.025) 0,rgba(0,0,0,.025) 1px,
      transparent 0,transparent 50%
    );
    background-size:7px 7px;
  }
  .hd-row:hover { background:rgba(99,102,241,.04); }
  .hd-scroll::-webkit-scrollbar { width:3px; height:3px; }
  .hd-scroll::-webkit-scrollbar-track { background:transparent; }
  .hd-scroll::-webkit-scrollbar-thumb { background:#d1d5db;border-radius:99px; }
  .hd-bar-inner { height:100%;border-radius:99px;transition:width .7s cubic-bezier(.4,0,.2,1); }
`;
if (typeof document !== "undefined" && !document.getElementById("__hd_s__")) {
  const el = document.createElement("style");
  el.id = "__hd_s__";
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
      name: p.name ?? p.full_name ?? p.username ?? "Head",
      level: p.level ?? 6,
      department_id: p.department_id ?? null,
    };
  } catch {
    return null;
  }
}

/* ─── Constants & helpers ─── */
const CURR_MONTH = new Date().toISOString().slice(0, 7);
const MONTH_LBL = new Date().toLocaleString("default", {
  month: "long",
  year: "numeric",
});

function H() {
  const t = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}
function fmtDate(iso) {
  return iso ? String(iso).slice(0, 10) : "—";
}
function fmt12(t) {
  if (!t) return "—";
  const [h, m] = String(t).split(":").map(Number);
  if (isNaN(h)) return t;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtHrs(h) {
  if (!h) return "—";
  const hr = Math.floor(h),
    mn = Math.round((h - hr) * 60);
  return mn > 0 ? `${hr}h ${mn}m` : `${hr}h`;
}
function pct(n, t) {
  return t ? Math.round((n / t) * 100) : 0;
}

/* ─── Status config ─── */
const ATT_STATUS = {
  Present: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Late: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  Early: { dot: "bg-sky-400", badge: "bg-sky-50 text-sky-700 border-sky-200" },
  Absent: { dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
  Leave: {
    dot: "bg-slate-400",
    badge: "bg-slate-50 text-slate-600 border-slate-200",
  },
};
const APP_STATUS = {
  Pending: "bg-violet-100 text-violet-700",
  HOD_Approved: "bg-sky-100 text-sky-700",
  HOD_Rejected: "bg-orange-100 text-orange-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
};
const PRIORITY_CLR = {
  High: {
    badge: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  Medium: {
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
  },
  Low: {
    badge: "bg-gray-100 text-gray-500 border border-gray-200",
    dot: "bg-gray-400",
  },
};

/* ─── Shared primitives ─── */
function InlineBar({ value, max, color = "#6366f1" }) {
  const w = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="hd-bar-inner h-full"
        style={{ width: `${w}%`, background: color }}
      />
    </div>
  );
}

function KpiTile({ label, value, sub, Icon, grad, loading, delta }) {
  return (
    <div className="hd-card px-5 py-5 flex items-start justify-between gap-3 hd-in">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
          {label}
        </p>
        {loading ? (
          <div className="h-8 w-20 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <p className="text-2xl font-extrabold text-gray-900 leading-none">
            {value ?? "—"}
          </p>
        )}
        {sub && !loading && (
          <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>
        )}
        {delta != null && !loading && (
          <p
            className={`text-xs font-semibold mt-1 ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs last month
          </p>
        )}
      </div>
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${grad}`}
      >
        <Icon size={18} className="text-white" />
      </div>
    </div>
  );
}

function Card({ title, children, action, className = "" }) {
  return (
    <div className={`hd-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-600">{title}</p>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

function ComingSoon({ title, icon: Icon, iconBg, description }) {
  return (
    <div className="hd-card relative overflow-hidden">
      <div className="absolute inset-0 hd-cs" />
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <Construction size={9} /> Coming Soon
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}
          >
            <Icon size={22} className="opacity-60" />
          </div>
          <p className="text-sm text-gray-400 text-center max-w-[200px] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Attendance heatmap (dept) ─── */
const HM_CLR = {
  Present: "#10b981",
  Late: "#f59e0b",
  Early: "#38bdf8",
  Absent: "#f87171",
  Leave: "#94a3b8",
};

function HeatmapStrip({ records, loading }) {
  const [tip, setTip] = useState(null);
  const cells = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      map[r.date] = r;
    });
    const today = new Date();
    today.setHours(12);
    return Array.from({ length: 60 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (59 - i));
      const iso = d.toISOString().split("T")[0];
      return { date: iso, rec: map[iso], isWkd: [0, 6].includes(d.getDay()) };
    });
  }, [records]);

  if (loading)
    return (
      <div className="h-14 flex items-center justify-center">
        <Loader2 size={16} className="hd-spin text-gray-300" />
      </div>
    );

  const C = 11,
    G = 2;
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="relative">
      <div className="overflow-x-auto hd-scroll pb-1">
        <svg
          width={weeks.length * (C + G)}
          height={7 * (C + G)}
          style={{ display: "block" }}
        >
          {weeks.map((wk, wi) =>
            wk.map((day, di) => (
              <rect
                key={day.date}
                x={wi * (C + G)}
                y={di * (C + G)}
                width={C}
                height={C}
                rx={2}
                fill={
                  day.isWkd
                    ? "#f1f5f9"
                    : day.rec
                      ? HM_CLR[day.rec.status] || "#e2e8f0"
                      : "#e8edf2"
                }
                style={{ cursor: day.rec ? "pointer" : "default" }}
                onMouseEnter={(e) =>
                  day.rec && setTip({ x: e.clientX, y: e.clientY, ...day })
                }
                onMouseLeave={() => setTip(null)}
              />
            )),
          )}
        </svg>
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {Object.entries(HM_CLR).map(([s, c]) => (
          <span
            key={s}
            className="flex items-center gap-1 text-[10px] text-gray-400"
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
          className="fixed z-[500] pointer-events-none hd-card px-3 py-2 text-xs shadow-xl"
          style={{ left: tip.x + 14, top: tip.y - 8 }}
        >
          <p className="font-bold text-gray-800">{tip.date}</p>
          <p
            className="font-semibold mt-0.5"
            style={{ color: HM_CLR[tip.rec?.status] }}
          >
            {tip.rec?.status}
          </p>
          {tip.rec?.employee_name && (
            <p className="text-gray-400">{tip.rec.employee_name}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── HOD Application action row ─── */
function AppActionRow({ app, onApprove, onReject, acting }) {
  const sc = APP_STATUS[app.status] || "bg-gray-100 text-gray-600";
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <img
        src={
          app.employee_image || `https://i.pravatar.cc/150?u=${app.employee_id}`
        }
        className="w-7 h-7 rounded-full object-cover border border-gray-100 shrink-0"
        alt=""
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {app.employee_name || `#${app.employee_id}`}
        </p>
        <p className="text-[10px] text-gray-400">
          {app.type} · {app.from_date}
        </p>
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${sc}`}
      >
        {(app.status || "").replace("_", " ")}
      </span>
      {app.status === "Pending" && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onApprove(app.id)}
            disabled={acting}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-600 hover:text-white transition disabled:opacity-40"
            title="HOD Approve"
          >
            <ThumbsUp size={11} />
          </button>
          <button
            onClick={() => onReject(app.id)}
            disabled={acting}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-600 hover:text-white transition disabled:opacity-40"
            title="HOD Reject"
          >
            <ThumbsDown size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Reject reason mini-modal ─── */
function RejectModal({ onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm hd-in px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl hd-scale">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          HOD Rejection
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          This reason will be visible to the employee and HR.
        </p>
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
          placeholder="Reason for rejection…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-red-400 resize-none transition"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason)}
            disabled={!reason.trim()}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ── DEPARTMENT VIEW ──
═══════════════════════════════════════════════════════════════ */
function DepartmentView({ auth, dept }) {
  const deptId = auth?.department_id;

  /* ─── Data ─── */
  const [employees, setEmployees] = useState([]);
  const [attSummary, setAttSummary] = useState(null);
  const [attRecords, setAttRecords] = useState([]);
  const [appStats, setAppStats] = useState(null);
  const [pendingApps, setPendingApps] = useState([]);
  const [notices, setNotices] = useState([]);
  const [noticeStats, setNoticeStats] = useState(null);
  const [month, setMonth] = useState(CURR_MONTH);

  const [empLoad, setEmpLoad] = useState(true);
  const [attLoad, setAttLoad] = useState(true);
  const [appLoad, setAppLoad] = useState(true);
  const [notLoad, setNotLoad] = useState(true);

  /* ─── HOD action ─── */
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* ─── Fetch ─── */
  const fetchAll = useCallback(async () => {
    const headers = H();

    /* Employees */
    setEmpLoad(true);
    fetch(API.GetAllEmployees, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const all = Array.isArray(d) ? d : d.employees || [];
        setEmployees(filterEmployeesByDepartment(all, auth));
      })
      .catch(() => {})
      .finally(() => setEmpLoad(false));

    /* Attendance summary + records */
    setAttLoad(true);
    const attBase = `${API.AllAttendance}/admin`;
    Promise.all([
      fetch(
        `${attBase}/summary?month=${month}${deptId ? `&department_id=${deptId}` : ""}`,
        { headers },
      ),
      fetch(
        `${attBase}/records?month=${month}${deptId ? `&department_id=${deptId}` : ""}&limit=500`,
        { headers },
      ),
    ])
      .then(async ([sr, rr]) => {
        if (sr.ok) setAttSummary(await sr.json());
        if (rr.ok) {
          const d = await rr.json();
          setAttRecords(Array.isArray(d) ? d : d.records || []);
        }
      })
      .catch(() => {})
      .finally(() => setAttLoad(false));

    /* Applications — stats + pending */
    setAppLoad(true);
    Promise.all([
      fetch(API.ApplicationStats, { headers }),
      fetch(`${API.GetAllApplications}?status=Pending&limit=20`, { headers }),
    ])
      .then(async ([sr, lr]) => {
        if (sr.ok) setAppStats(await sr.json());
        if (lr.ok) {
          const d = await lr.json();
          setPendingApps(Array.isArray(d) ? d : d.items || []);
        }
      })
      .catch(() => {})
      .finally(() => setAppLoad(false));

    /* Notices — admin scoped to dept by JWT */
    setNotLoad(true);
    Promise.all([
      fetch(`${API.AdminNoticeList}?limit=5`, { headers }),
      fetch(API.AdminNoticeStats, { headers }),
    ])
      .then(async ([nr, sr]) => {
        if (nr.ok) {
          const d = await nr.json();
          setNotices(Array.isArray(d) ? d : d.notices || []);
        }
        if (sr.ok) setNoticeStats(await sr.json());
      })
      .catch(() => {})
      .finally(() => setNotLoad(false));
  }, [deptId, month]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ─── HOD approve/reject ─── */
  const handleApprove = useCallback(
    async (appId) => {
      setActing(true);
      try {
        const res = await fetch(API.HODAction(appId), {
          method: "POST",
          headers: H(),
          body: JSON.stringify({ action: "approve" }),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        setPendingApps((prev) => prev.filter((a) => a.id !== appId));
        showToast("Application approved.", "success");
      } catch (e) {
        showToast(e.message, "error");
      } finally {
        setActing(false);
      }
    },
    [showToast],
  );

  const handleReject = useCallback(
    async (reason) => {
      if (!rejectTargetId) return;
      setActing(true);
      try {
        const res = await fetch(API.HODAction(rejectTargetId), {
          method: "POST",
          headers: H(),
          body: JSON.stringify({ action: "reject", rejection_reason: reason }),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        setPendingApps((prev) => prev.filter((a) => a.id !== rejectTargetId));
        setRejectTargetId(null);
        showToast("Application rejected.", "success");
      } catch (e) {
        showToast(e.message, "error");
      } finally {
        setActing(false);
      }
    },
    [rejectTargetId, showToast],
  );

  /* ─── Derived ─── */
  const total = employees.length;
  const activeEmps = employees.filter((e) => e.employment_status === "active");
  const attRate = attSummary?.rate ?? null;
  const attDot =
    attRate != null
      ? attRate >= 90
        ? "#10b981"
        : attRate >= 75
          ? "#f59e0b"
          : "#f87171"
      : "#94a3b8";

  /* Employee attendance merge */
  const empWithAtt = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayMap = {};
    attRecords
      .filter((r) => r.date === todayStr)
      .forEach((r) => {
        todayMap[r.employee_db_id || r.employee_id] = r;
      });
    return employees.slice(0, 10).map((e) => ({
      ...e,
      todayStatus: todayMap[e.id]?.status || "—",
    }));
  }, [employees, attRecords]);

  const months = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
          value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          label: d.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
        };
      }),
    [],
  );

  return (
    <div className="space-y-5">
      {/* ── KPI row ── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 hd-stagger">
        <KpiTile
          label="Total Staff"
          value={empLoad ? null : total}
          sub="In your dept"
          Icon={Users}
          grad="bg-gradient-to-br from-indigo-500 to-indigo-700"
          loading={empLoad}
        />
        <KpiTile
          label="Active"
          value={empLoad ? null : activeEmps.length}
          sub={`${pct(activeEmps.length, total || 1)}% active`}
          Icon={UserCheck}
          grad="bg-gradient-to-br from-emerald-500 to-teal-600"
          loading={empLoad}
        />
        <KpiTile
          label="Attend. Rate"
          value={
            attLoad ? null : attRate != null ? `${Math.round(attRate)}%` : "—"
          }
          sub={MONTH_LBL}
          Icon={Activity}
          grad="bg-gradient-to-br from-teal-500 to-emerald-600"
          loading={attLoad}
        />
        <KpiTile
          label="Absent Today"
          value={attLoad ? null : (attSummary?.absent ?? 0)}
          sub="Needs follow-up"
          Icon={AlertTriangle}
          grad="bg-gradient-to-br from-rose-400 to-red-600"
          loading={attLoad}
        />
        <KpiTile
          label="Pending Apps"
          value={appLoad ? null : (appStats?.pending ?? 0)}
          sub="Awaiting HOD action"
          Icon={Timer}
          grad="bg-gradient-to-br from-violet-500 to-fuchsia-600"
          loading={appLoad}
        />
        <KpiTile
          label="Notices"
          value={notLoad ? null : (noticeStats?.total ?? 0)}
          sub="In your board"
          Icon={Bell}
          grad="bg-gradient-to-br from-sky-500 to-blue-600"
          loading={notLoad}
        />
      </section>

      {/* ── Row 2: Attendance summary + employee table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Attendance summary card */}
        <div className="hd-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">
              Attendance Summary
            </p>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 outline-none cursor-pointer text-gray-600"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          {attLoad ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="hd-spin text-gray-300" />
            </div>
          ) : attSummary ? (
            <div>
              {/* Rate circle */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative w-20 h-20 shrink-0">
                  <svg
                    width="80"
                    height="80"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="10"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke={attDot}
                      strokeWidth="10"
                      strokeDasharray={`${(Math.round(attRate || 0) / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                      style={{
                        transition:
                          "stroke-dasharray .7s cubic-bezier(.4,0,.2,1)",
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-lg font-extrabold text-gray-900 leading-none">
                      {Math.round(attRate || 0)}%
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      Rate
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 space-y-0.5">
                  <p>
                    <span className="font-bold text-gray-800">
                      {attSummary.total_employees}
                    </span>{" "}
                    employees tracked
                  </p>
                  <p>
                    <span className="font-bold text-gray-800">
                      {attSummary.total_records}
                    </span>{" "}
                    records this month
                  </p>
                </div>
              </div>

              {/* Status bars */}
              <div className="space-y-2.5">
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
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-xs text-gray-500 w-14">{label}</span>
                    <InlineBar
                      value={val}
                      max={attSummary.total_records || 1}
                      color={color}
                    />
                    <span className="text-xs font-bold text-gray-800 w-6 text-right">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No data available</p>
            </div>
          )}
        </div>

        {/* Employee list with today's status */}
        <div className="hd-card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">Team Today</p>
            <span className="text-[10px] text-gray-400">
              {employees.length} members
            </span>
          </div>
          {empLoad ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="hd-spin text-gray-300" />
            </div>
          ) : empWithAtt.length > 0 ? (
            <div className="overflow-x-auto hd-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Employee", "Designation", "Status"].map((h, i) => (
                      <th
                        key={h}
                        className={`py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${i === 0 ? "text-left" : "text-center"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empWithAtt.map((e) => {
                    const sc = ATT_STATUS[e.todayStatus] || {};
                    return (
                      <tr
                        key={e.id}
                        className="hd-row border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                e.image || `https://i.pravatar.cc/150?u=${e.id}`
                              }
                              className="w-7 h-7 rounded-full object-cover border border-gray-100 shrink-0"
                              alt=""
                            />
                            <div>
                              <p className="text-xs font-semibold text-gray-800">
                                {e.f_name} {e.l_name}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                #{e.employee_id || e.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="text-[10px] text-gray-500">
                            {e.designation || "—"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {e.todayStatus !== "—" ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badge}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                              />{" "}
                              {e.todayStatus}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-300">
                              No record
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No employees found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Heatmap + Pending apps + Notices ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Heatmap */}
        <div className="hd-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">
              Attendance — Last 60 Days
            </p>
          </div>
          <HeatmapStrip records={attRecords} loading={attLoad} />
        </div>

        {/* Pending applications */}
        <div className="hd-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">
              Pending Approvals
            </p>
            {!appLoad && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                {pendingApps.length}
              </span>
            )}
          </div>
          {appLoad ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={18} className="hd-spin text-gray-300" />
            </div>
          ) : pendingApps.length > 0 ? (
            <div className="space-y-0 overflow-y-auto hd-scroll max-h-52">
              {pendingApps.slice(0, 8).map((app) => (
                <AppActionRow
                  key={app.id}
                  app={app}
                  acting={acting}
                  onApprove={handleApprove}
                  onReject={(id) => setRejectTargetId(id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 size={26} className="text-emerald-200 mb-2" />
              <p className="text-sm text-gray-400">All caught up!</p>
              <p className="text-xs text-gray-300 mt-1">
                No pending applications
              </p>
            </div>
          )}
        </div>

        {/* Recent dept notices */}
        <div className="hd-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">
              Department Notices
            </p>
            <span className="text-[10px] text-gray-400">
              {noticeStats?.total ?? "—"} total
            </span>
          </div>
          {notLoad ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="hd-spin text-gray-300" />
            </div>
          ) : notices.length > 0 ? (
            <div className="space-y-2.5">
              {notices.slice(0, 5).map((n, i) => {
                const pc = PRIORITY_CLR[n.priority] || {};
                return (
                  <div
                    key={n.id ?? i}
                    className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5"
                  >
                    <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                      <span
                        className={`w-2 h-2 rounded-full ${pc.dot || "bg-gray-300"}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
                        {n.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {n.category} · {fmtDate(n.created_at)}
                      </p>
                    </div>
                    {n.pinned && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                        📌
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell size={24} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No notices yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Coming soon ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ComingSoon
          title="Department KPI Overview"
          icon={Target}
          iconBg="bg-indigo-100 text-indigo-600"
          description="KPI scores, ratings, and performance goals for your team members."
        />
        <ComingSoon
          title="Training & Compliance"
          icon={GraduationCap}
          iconBg="bg-amber-100 text-amber-600"
          description="Training assignments, completion rates, and mandatory compliance for your dept."
        />
      </div>

      {/* Reject modal */}
      {rejectTargetId && (
        <RejectModal
          onSubmit={handleReject}
          onCancel={() => setRejectTargetId(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl pointer-events-none hd-in ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}{" "}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ── MY VIEW ──
═══════════════════════════════════════════════════════════════ */
function MyView({ auth }) {
  const empId = auth?.id;

  /* ─── Data ─── */
  const [todayRec, setTodayRec] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [appStats, setAppStats] = useState(null);
  const [myNotices, setMyNotices] = useState([]);
  const [notStats, setNotStats] = useState(null);
  const [ackedIds, setAckedIds] = useState(new Set());
  const [detailId, setDetailId] = useState(null);
  const [noticeBody, setNoticeBody] = useState(null);
  const [acking, setAcking] = useState(false);

  const [todayLoad, setTodayLoad] = useState(true);
  const [summLoad, setSummLoad] = useState(true);
  const [recsLoad, setRecsLoad] = useState(true);
  const [appLoad, setAppLoad] = useState(true);
  const [notLoad, setNotLoad] = useState(true);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchMyData = useCallback(async () => {
    if (!empId) return;
    const headers = H();

    setTodayLoad(true);
    fetch(API.MyAttendanceToday(empId), { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then(setTodayRec)
      .catch(() => {})
      .finally(() => setTodayLoad(false));

    setSummLoad(true);
    fetch(API.MyAttendanceSummary(empId, CURR_MONTH), { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then(setSummary)
      .catch(() => {})
      .finally(() => setSummLoad(false));

    setRecsLoad(true);
    fetch(API.MyAttendanceByMonth(empId, CURR_MONTH), { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) =>
        setRecords(d ? (Array.isArray(d) ? d : d.records || []) : []),
      )
      .catch(() => {})
      .finally(() => setRecsLoad(false));

    setAppLoad(true);
    fetch(API.ApplicationStats, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAppStats)
      .catch(() => {})
      .finally(() => setAppLoad(false));

    setNotLoad(true);
    Promise.all([
      fetch(`${API.MyNoticeList}?limit=10`, { headers }),
      fetch(API.MyNoticeStats, { headers }),
      fetch(API.MyNoticeAcked, { headers }),
    ])
      .then(async ([nr, sr, ar]) => {
        if (nr.ok) {
          const d = await nr.json();
          setMyNotices(Array.isArray(d) ? d : d.notices || []);
        }
        if (sr.ok) setNotStats(await sr.json());
        if (ar.ok) setAckedIds(new Set(await ar.json()));
      })
      .catch(() => {})
      .finally(() => setNotLoad(false));
  }, [empId]);

  useEffect(() => {
    fetchMyData();
  }, [fetchMyData]);

  /* Acknowledge */
  const handleAck = useCallback(
    async (noticeId) => {
      setAcking(true);
      try {
        const res = await fetch(API.AcknowledgeNotice(noticeId), {
          method: "POST",
          headers: H(),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        setAckedIds((prev) => new Set([...prev, noticeId]));
        setNotStats((prev) =>
          prev
            ? { ...prev, unread: Math.max(0, (prev.unread || 0) - 1) }
            : prev,
        );
        showToast("Acknowledged.", "success");
      } catch (e) {
        showToast(e.message, "error");
      } finally {
        setAcking(false);
      }
    },
    [showToast],
  );

  /* Detail fetch */
  const openNotice = useCallback(async (id) => {
    setDetailId(id);
    setNoticeBody(null);
    try {
      const res = await fetch(`${API.MyNoticeList.replace(/\/$/, "")}/${id}`, {
        headers: H(),
      });
      if (res.ok) setNoticeBody(await res.json());
    } catch {
      /* show skeleton */
    }
  }, []);

  /* Attendance heatmap cells */
  const hmCells = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      map[r.date] = r;
    });
    const today = new Date();
    today.setHours(12);
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (34 - i));
      const iso = d.toISOString().split("T")[0];
      return { date: iso, rec: map[iso], isWkd: [0, 6].includes(d.getDay()) };
    });
  }, [records]);

  /* Derived */
  const checkIn = todayRec?.in_time;
  const checkOut = todayRec?.out_time;
  const attRate = summary?.rate ?? null;
  const unread =
    notStats?.unread ?? myNotices.filter((n) => !ackedIds.has(n.id)).length;

  return (
    <div className="space-y-5">
      {/* ── Personal KPIs ── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 hd-stagger">
        <KpiTile
          label="Check In"
          value={todayLoad ? null : fmt12(checkIn)}
          sub={checkIn ? "On time" : "Not yet"}
          Icon={LogIn}
          grad="bg-gradient-to-br from-emerald-500 to-teal-600"
          loading={todayLoad}
        />
        <KpiTile
          label="Check Out"
          value={todayLoad ? null : fmt12(checkOut)}
          sub={checkOut ? "Clocked out" : "Ongoing"}
          Icon={LogOut}
          grad="bg-gradient-to-br from-rose-400 to-rose-600"
          loading={todayLoad}
        />
        <KpiTile
          label="Attend. Rate"
          value={
            summLoad ? null : attRate != null ? `${Math.round(attRate)}%` : "—"
          }
          sub={MONTH_LBL}
          Icon={TrendingUp}
          grad="bg-gradient-to-br from-teal-500 to-emerald-600"
          loading={summLoad}
        />
        <KpiTile
          label="Days Present"
          value={summLoad ? null : (summary?.present ?? 0)}
          sub="This month"
          Icon={CheckCircle2}
          grad="bg-gradient-to-br from-indigo-500 to-indigo-700"
          loading={summLoad}
        />
        <KpiTile
          label="My Apps"
          value={appLoad ? null : (appStats?.total ?? 0)}
          sub={`${appStats?.pending ?? 0} pending`}
          Icon={FileText}
          grad="bg-gradient-to-br from-violet-500 to-fuchsia-600"
          loading={appLoad}
        />
        <KpiTile
          label="Unread Notices"
          value={notLoad ? null : unread}
          sub="Requires attention"
          Icon={Bell}
          grad="bg-gradient-to-br from-sky-500 to-blue-600"
          loading={notLoad}
        />
      </section>

      {/* ── Row 2: Today's card + attendance mini-heatmap + notices ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's detail */}
        <div className="hd-card p-5">
          <p className="text-sm font-semibold text-gray-600 mb-4">
            Today's Attendance
          </p>
          {todayLoad ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="hd-spin text-gray-300" />
            </div>
          ) : todayRec ? (
            <div className="space-y-3">
              {[
                {
                  label: "Status",
                  value: (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ATT_STATUS[todayRec.status]?.badge || "bg-gray-50 text-gray-600 border-gray-200"}`}
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
                      {fmtHrs(todayRec.hours)}
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No record today</p>
              <p className="text-xs text-gray-300 mt-1">
                Updates after machine sync
              </p>
            </div>
          )}

          {/* Monthly summary pills */}
          {!summLoad && summary && (
            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
              {[
                {
                  label: "Present",
                  val: summary.present || 0,
                  dot: "bg-emerald-500",
                },
                { label: "Late", val: summary.late || 0, dot: "bg-amber-400" },
                {
                  label: "Absent",
                  val: summary.absent || 0,
                  dot: "bg-red-500",
                },
              ]
                .filter((s) => s.val > 0)
                .map(({ label, val, dot }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-gray-600"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{" "}
                    {label}: {val}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Mini attendance heatmap */}
        <div className="hd-card p-5">
          <p className="text-sm font-semibold text-gray-600 mb-4">
            My Attendance — Last 35 Days
          </p>
          {recsLoad ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={18} className="hd-spin text-gray-300" />
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto hd-scroll pb-1">
                {(() => {
                  const C = 13,
                    G = 3;
                  const weeks = [];
                  for (let i = 0; i < hmCells.length; i += 7)
                    weeks.push(hmCells.slice(i, i + 7));
                  return (
                    <svg
                      width={weeks.length * (C + G)}
                      height={7 * (C + G)}
                      style={{ display: "block" }}
                    >
                      {weeks.map((wk, wi) =>
                        wk.map((day, di) => (
                          <rect
                            key={day.date}
                            x={wi * (C + G)}
                            y={di * (C + G)}
                            width={C}
                            height={C}
                            rx={3}
                            fill={
                              day.isWkd
                                ? "#f1f5f9"
                                : day.rec
                                  ? HM_CLR[day.rec.status] || "#e2e8f0"
                                  : "#e8edf2"
                            }
                          />
                        )),
                      )}
                    </svg>
                  );
                })()}
              </div>
              <div className="flex gap-3 mt-3 flex-wrap">
                {Object.entries(HM_CLR).map(([s, c]) => (
                  <span
                    key={s}
                    className="flex items-center gap-1 text-[10px] text-gray-400"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ background: c }}
                    />{" "}
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* My notices */}
        <div className="hd-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600">My Notices</p>
            {unread > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                {unread} unread
              </span>
            )}
          </div>
          {notLoad ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="hd-spin text-gray-300" />
            </div>
          ) : myNotices.length > 0 ? (
            <div className="space-y-2 overflow-y-auto hd-scroll max-h-52">
              {myNotices.map((n) => {
                const isAcked = ackedIds.has(n.id);
                const pc = PRIORITY_CLR[n.priority] || {};
                return (
                  <div
                    key={n.id}
                    onClick={() => openNotice(n.id)}
                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition hover:shadow-sm
                      ${isAcked ? "bg-gray-50" : "bg-blue-50 border border-blue-100"}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 mt-1 ${pc.dot || "bg-gray-300"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold leading-snug line-clamp-2 ${isAcked ? "text-gray-500" : "text-gray-900"}`}
                      >
                        {n.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {n.category} · {fmtDate(n.created_at)}
                      </p>
                    </div>
                    {!isAcked && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell size={24} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No notices for you</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Application summary + Coming soon ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* My application stats */}
        <div className="hd-card p-5">
          <p className="text-sm font-semibold text-gray-600 mb-4">
            My Applications
          </p>
          {appLoad ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="hd-spin text-gray-300" />
            </div>
          ) : appStats ? (
            <div className="space-y-2.5">
              {[
                {
                  label: "Pending",
                  val: appStats.pending || 0,
                  color: "#7c3aed",
                  cls: "bg-violet-50 text-violet-700",
                },
                {
                  label: "HOD Approved",
                  val: appStats.hod_approved || 0,
                  color: "#0ea5e9",
                  cls: "bg-sky-50 text-sky-700",
                },
                {
                  label: "Approved",
                  val: appStats.approved || 0,
                  color: "#10b981",
                  cls: "bg-emerald-50 text-emerald-700",
                },
                {
                  label: "Rejected",
                  val: (appStats.rejected || 0) + (appStats.hod_rejected || 0),
                  color: "#f87171",
                  cls: "bg-red-50 text-red-700",
                },
              ].map(({ label, val, color, cls }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="text-xs text-gray-500 flex-1">{label}</span>
                  <InlineBar
                    value={val}
                    max={appStats.total || 1}
                    color={color}
                  />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}
                  >
                    {val}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-50 flex justify-between text-xs">
                <span className="text-gray-400">Total</span>
                <span className="font-extrabold text-gray-800">
                  {appStats.total}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-400">No data</p>
            </div>
          )}
        </div>

        <ComingSoon
          title="My KPI Score"
          icon={Target}
          iconBg="bg-indigo-100 text-indigo-600"
          description="Your personal KPI scores, goals, and performance evaluation will appear here."
        />
        <ComingSoon
          title="My Training"
          icon={GraduationCap}
          iconBg="bg-amber-100 text-amber-600"
          description="Assigned training modules, progress, and completion records."
        />
      </div>

      {/* Notice detail mini-modal */}
      {detailId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm hd-in px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden hd-scale">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm">
                {noticeBody?.title || "Loading…"}
              </p>
              <button
                onClick={() => {
                  setDetailId(null);
                  setNoticeBody(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {!noticeBody ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="hd-spin text-gray-300" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {noticeBody.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_CLR[noticeBody.priority]?.badge}`}
                    >
                      {noticeBody.priority}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {noticeBody.body}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    By {noticeBody.created_by_name || "HR"} ·{" "}
                    {fmtDate(noticeBody.created_at)}
                  </p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              {!ackedIds.has(detailId) ? (
                <button
                  onClick={() => handleAck(detailId)}
                  disabled={acking}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                  {acking ? (
                    <>
                      <Loader2 size={13} className="hd-spin" /> Acknowledging…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Acknowledge
                    </>
                  )}
                </button>
              ) : (
                <div className="flex-1 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle2 size={13} /> Acknowledged
                </div>
              )}
              <button
                onClick={() => {
                  setDetailId(null);
                  setNoticeBody(null);
                }}
                className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl pointer-events-none hd-in ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}{" "}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Root Page
═══════════════════════════════════════════════════════════════ */
export default function HODDashboard() {
  const auth = useMemo(() => getAuth(), []);
  const [view, setView] = useState("department");
  const [dept, setDept] = useState(null);
  const [deptLoad, setDeptLoad] = useState(true);

  /* Fetch dept name */
  useEffect(() => {
    if (!auth?.department_id) {
      setDeptLoad(false);
      return;
    }
    fetch(
      typeof API.DepartmentDetails === "function"
        ? API.DepartmentDetails(auth.department_id)
        : `${API.ListDepartment}/${auth.department_id}`,
      { headers: H() },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setDept(d))
      .catch(() => {})
      .finally(() => setDeptLoad(false));
  }, [auth]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (auth?.name || "Head").split(" ")[0];
  const deptName = dept?.department || (deptLoad ? "…" : "Your Department");

  return (
    <div className="hd-page min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 px-5 sm:px-8 py-8">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7 hd-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200/60">
              <UserCheck size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {greeting}, {firstName}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Department Head ·{" "}
                <span className="text-indigo-600 font-semibold">
                  {deptName}
                </span>
                {" · "}
                {new Date().toLocaleDateString("default", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── View switcher ── */}
      <div className="flex gap-2 mb-7">
        {[
          { key: "department", label: "🏢  Department View" },
          { key: "my", label: "👤  My View" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition border ${
              view === key
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200/50"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {view === "department" ? (
        <DepartmentView auth={auth} dept={dept} />
      ) : (
        <MyView auth={auth} />
      )}
    </div>
  );
}
