import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
  Search,
  LogIn,
  LogOut,
  Timer,
  Info,
  AlertCircle,
  BarChart2,
  User,
  Moon,
  Sun,
  Sunset,
  ArrowLeft,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Animations ─── */
const _STYLES = `
  @keyframes _fadeIn  { from{opacity:0}                           to{opacity:1} }
  @keyframes _slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes _spin    { to{transform:rotate(360deg)} }
  .att-fade  { animation:_fadeIn  .2s ease-out; }
  .att-slide { animation:_slideUp .25s ease-out both; }
  .att-spin  { animation:_spin .85s linear infinite; }
`;
(() => {
  if (typeof document === "undefined") return;
  if (!document.getElementById("__att_styles__")) {
    const el = document.createElement("style");
    el.id = "__att_styles__";
    el.textContent = _STYLES;
    document.head.appendChild(el);
  }
})();

/* ─── Time helpers ─── */

/** "HH:MM" or "HH:MM:SS" → 12-hour string */
function to12(rawTime) {
  if (!rawTime) return "—";
  const t = String(rawTime).slice(0, 5);
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10),
    m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return String(rawTime);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** "HH:MM" or "HH:MM:SS" → total minutes from midnight */
function toMins(t) {
  if (!t) return null;
  const [hStr, mStr] = String(t).split(":");
  const h = parseInt(hStr, 10),
    m = parseInt(mStr, 10);
  return isNaN(h) || isNaN(m) ? null : h * 60 + m;
}

/** decimal hours → "Xh Ym" */
function fmtHours(h) {
  if (h == null) return "—";
  const hrs = Math.floor(h),
    min = Math.round((h - hrs) * 60);
  return min > 0 ? `${hrs}h ${min}m` : `${hrs}h`;
}

/** "HH:MM:SS" shift total_hours → "Xh Ym" */
function fmtShiftTotal(s) {
  const mins = toMins(s);
  return mins != null ? fmtHours(mins / 60) : null;
}

function shiftPeriod(startTime) {
  const mins = toMins(startTime);
  if (mins === null) return "day";
  /* Overnight/evening:  18:00 (1080) – 03:59 (wraps) */
  if (mins >= 18 * 60 || mins < 4 * 60) return "night";
  /* Afternoon:          12:00 – 17:59 */
  if (mins >= 12 * 60) return "afternoon";
  /* Day:                04:00 – 11:59 */
  return "day";
}

const PERIOD_META = {
  day: {
    label: "Day Shift",
    Icon: Sun,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
  },
  afternoon: {
    label: "Afternoon Shift",
    Icon: Sunset,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
  },
  night: {
    label: "Night Shift",
    Icon: Moon,
    color: "text-indigo-500",
    bg: "bg-indigo-50 border-indigo-200",
  },
};

/* True when a shift's end < start (crosses midnight) */
function isOvernightShift(shift) {
  if (!shift) return false;
  const s = toMins(shift.shift_start_timing);
  const e = toMins(shift.shift_end_timing);
  return s != null && e != null && e < s;
}

/* ─── Status display config ─── */
const STATUS_CFG = {
  Present: {
    badge: "bg-emerald-100 text-emerald-600",
    dot: "bg-emerald-500",
    cal: "bg-emerald-300 text-white",
  },
  Late: {
    badge: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-400",
    cal: "bg-yellow-400 text-white",
  },
  Early: {
    badge: "bg-blue-100 text-yellow-800",
    dot: "bg-blue-400",
    cal: "bg-blue-400 text-white",
  },
  Absent: {
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    cal: "bg-red-400 text-white",
  },
  Leave: {
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    cal: "bg-slate-400 text-white",
  },
  "Late & Early": {
    badge: "bg-gradient-to-r from-yellow-400 to-blue-500 text-white",
    dot: "bg-slate-400",
    cal: "bg-gradient-to-r from-yellow-400 to-blue-500 text-white",
  },
};

/* ─── Month options ─── */
function buildMonths() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "long", year: "numeric" }),
    };
  });
}
const MONTHS = buildMonths();
const CURR_MONTH = MONTHS[0].value;
const TODAY_STR = new Date().toISOString().split("T")[0];

/* ─── Shared primitives ─── */
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}
function ErrMsg({ msg, onRetry }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-700">
          Could not load data
        </p>
        <p className="text-xs text-red-400 mt-0.5 wrap-break-word">{msg}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-red-600 hover:underline shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}
function NoAuthBanner() {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 mb-5">
      <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-800">
          Not authenticated
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          No valid access token found. Please log in.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Shift Banner
───────────────────────────────────────── */
function ShiftBanner({ shift, loading }) {
  if (loading)
    return <div className="h-10 bg-gray-100 animate-pulse rounded-xl mb-5" />;
  if (!shift) return null;

  const period = shiftPeriod(shift.shift_start_timing);
  const meta = PERIOD_META[period];
  const ShiftIcon = meta.Icon;
  const overnight = isOvernightShift(shift);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border mb-5 ${meta.bg}`}
    >
      <ShiftIcon size={15} className={meta.color} />
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-600 font-medium">{shift.name}</span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500">
          {to12(shift.shift_start_timing)} → {to12(shift.shift_end_timing)}
          {overnight && (
            <span className="ml-1.5 font-semibold text-indigo-600">
              (Overnight +1 day)
            </span>
          )}
        </span>
        {shift.shift_late_on && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400">
              Late after {to12(shift.shift_late_on)}
            </span>
          </>
        )}
        {shift.total_hours && (
          <>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400">
              {fmtShiftTotal(shift.total_hours)} shift
            </span>
          </>
        )}
      </div>
    </div>
  );
}
function TodayCard({ rec, shift, loading, error, onRetry }) {
  const cfg = rec ? STATUS_CFG[rec.status] : null;
  const dayFmt = new Date().toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const period = shift ? shiftPeriod(shift.shift_start_timing) : "day";
  const periodMeta = PERIOD_META[period];
  const overnight = isOvernightShift(shift);

  const expIn = shift?.shift_start_timing
    ? to12(shift.shift_start_timing)
    : null;
  const expOut = shift?.shift_end_timing ? to12(shift.shift_end_timing) : null;
  const shiftTotal = shift?.total_hours
    ? fmtShiftTotal(shift.total_hours)
    : null;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-0.5">
            Today
          </p>
          <h2 className="text-base font-semibold text-gray-900">{dayFmt}</h2>
          {shift && (
            <p className={`text-xs mt-0.5 font-medium ${periodMeta.color}`}>
              {periodMeta.label} · {to12(shift.shift_start_timing)} –{" "}
              {to12(shift.shift_end_timing)}
              {overnight && (
                <span className="ml-1 text-indigo-500 font-semibold">
                  {" "}
                  (+1 day)
                </span>
              )}
            </p>
          )}
        </div>
        {cfg && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.badge}`}
          >
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} /> {rec.status}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-2">
          <Loader2 size={18} className="att-spin text-blue-400" />
          <span className="text-sm text-gray-400">
            Checking today's record…
          </span>
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrMsg msg={error} onRetry={onRetry} />}

      {/* No record (backend returned null — employee is off-shift or hasn't clocked in) */}
      {!loading && !error && !rec && (
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
          <Clock size={16} className="text-gray-300" />
          <div>
            <p className="text-sm text-gray-400">
              No attendance record found for today.
            </p>
            {expIn && (
              <p className="text-xs text-gray-400 mt-0.5">
                Expected check-in:{" "}
                <span className="font-semibold text-gray-600">{expIn}</span>
                {overnight && (
                  <span className="text-gray-400">
                    {" "}
                    · out next day at {expOut}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Record */}
      {!loading && !error && rec && (
        <div className="att-slide space-y-4">
          {/* Overnight info strip */}
          {overnight && rec.in_time && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
              <Moon size={13} className="text-indigo-500 shrink-0" />
              <p className="text-xs text-indigo-700 font-medium">
                Night shift — started{" "}
                <span className="font-bold">{rec.date}</span>
                {rec.out_time ? (
                  <>, ends next calendar day</>
                ) : (
                  <>, still in progress</>
                )}
              </p>
            </div>
          )}

          {/* ✅ in_time = Check In,  out_time = Check Out — never swapped */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Check In",
                value: to12(rec.in_time), // ← punch False (IN)
                sub: expIn ? `Expected ${expIn}` : null,
                Icon: LogIn,
                bg: "bg-emerald-50",
                ic: "text-emerald-600",
              },
              {
                label: "Check Out",
                value: to12(rec.out_time), // ← punch True (OUT)
                sub: expOut ? `Expected ${expOut}` : null,
                Icon: LogOut,
                bg: "bg-red-50",
                ic: "text-red-500",
              },
              {
                label: "Hours Worked",
                value: fmtHours(rec.hours), // ← backend computed
                sub: shiftTotal ? `Shift ${shiftTotal}` : null,
                Icon: Timer,
                bg: "bg-blue-50",
                ic: "text-blue-600",
              },
            ].map(({ label, value, sub, Icon, bg, ic }) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-4 px-2 ${bg}`}
              >
                <div className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center">
                  <Icon size={16} className={ic} />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 text-center leading-tight">
                  {label}
                </span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">
                  {value}
                </span>
                {sub && (
                  <span className="text-[10px] text-gray-400 text-center leading-tight">
                    {sub}
                  </span>
                )}
              </div>
            ))}
          </div>

          {rec.note && (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <Info size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">{rec.note}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────
   Summary Section
───────────────────────────────────────── */
function SummarySection({ summary, loading, error, onRetry }) {
  const rate = summary?.rate ?? 0;
  const rateColor =
    rate >= 90
      ? "text-emerald-600"
      : rate >= 75
        ? "text-amber-500"
        : "text-red-500";
  const rateBar =
    rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-400" : "bg-red-500";
  const rateLabel =
    rate >= 90 ? "Excellent" : rate >= 75 ? "Good" : "Needs Attention";

  const stats = [
    {
      key: "Present",
      val: summary?.present,
      total: summary?.total_days,
      bar: "bg-emerald-500",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icon: CheckCircle2,
    },
    {
      key: "Late",
      val: summary?.late,
      total: summary?.total_days,
      bar: "bg-yellow-400",
      badge: "border-yellow-200 bg-yellow-50 text-yellow-700",
      Icon: Clock,
    },
    {
      key: "Absent",
      val: summary?.absent,
      total: summary?.total_days,
      bar: "bg-red-400",
      badge: "border-red-200 bg-red-50 text-red-700",
      Icon: XCircle,
    },
    {
      key: "Leave",
      val: summary?.leave,
      total: summary?.total_days,
      bar: "bg-slate-400",
      badge: "border-slate-200 bg-slate-50 text-slate-600",
      Icon: Calendar,
    },
  ];

  if (error && !loading)
    return (
      <div className="mb-5">
        <ErrMsg msg={error} onRetry={onRetry} />
      </div>
    );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
      {stats.map(({ key, val, total, bar, badge, Icon }) => {
        const pct = total && val != null ? Math.round((val / total) * 100) : 0;
        return (
          <Card key={key} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${badge}`}
                >
                  <Icon size={15} />
                </span>
                <span className="text-sm text-gray-500 font-medium">{key}</span>
              </div>
              {loading ? (
                <Loader2 size={16} className="att-spin text-blue-400" />
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  {val ?? "—"}
                </span>
              )}
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1 font-medium">
                <span>of {total ?? "—"} days</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${bar}`}
                  style={{ width: loading ? "0%" : `${pct}%` }}
                />
              </div>
            </div>
          </Card>
        );
      })}

      {/* Rate card */}
      <Card className="p-5 flex flex-col col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 font-medium">Rate</span>
          <TrendingUp size={14} className="text-gray-300" />
        </div>
        {loading ? (
          <Loader2 size={18} className="att-spin text-blue-400" />
        ) : (
          <>
            <div className="flex items-end gap-2 mb-2">
              <span className={`text-3xl font-bold ${rateColor}`}>{rate}%</span>
              <span className={`text-xs font-semibold mb-0.5 ${rateColor}`}>
                {rateLabel}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${rateBar}`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-300 mt-1">
              <span>0%</span>
              <span>Target 90%</span>
              <span>100%</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────
   Calendar Heatmap
───────────────────────────────────────── */
function CalHeatmap({ records, month }) {
  const [yr, mo] = month.split("-").map(Number);
  const firstDay = new Date(yr, mo - 1, 1).getDay();
  const daysInMo = new Date(yr, mo, 0).getDate();

  /* Each record.date is the IN-punch date — use directly */
  const map = useMemo(() => {
    const m = {};
    records.forEach((r) => {
      if (r.date) m[r.date] = r.status;
    });
    return m;
  }, [records]);

  const DAY_HDR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  function cellCls(day) {
    const date = `${yr}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dow = new Date(date + "T12:00:00").getDay();
    const wknd = dow === 0 || dow === 6;
    const st = map[date];
    const isToday = date === TODAY_STR;
    const base = st
      ? STATUS_CFG[st]?.cal || "bg-gray-100 text-gray-400"
      : wknd
        ? "bg-gray-50 text-gray-300 border border-gray-100"
        : "bg-gray-100 text-gray-400";
    return `${base} ${isToday ? "ring-2 ring-offset-1 ring-blue-500" : ""}`;
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">Monthly Heatmap</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            ["Present", "bg-emerald-400"],
            ["Late", "bg-yellow-400"],
            ["Absent", "bg-red-400"],
            ["Leave", "bg-slate-400"],
          ].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-sm ${c}`} />
              <span className="text-[10px] text-gray-400">{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HDR.map((l) => (
          <div
            key={l}
            className="text-[10px] font-semibold text-center text-gray-400 py-0.5"
          >
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMo }, (_, i) => {
          const d = i + 1;
          const date = `${yr}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const st = map[date];
          return (
            <div
              key={d}
              title={st ? `${date}: ${st}` : date}
              className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-semibold cursor-default select-none transition ${cellCls(d)}`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

const PAGE_SIZE = 10;

function RecordsTable({
  records,
  loading,
  error,
  onRetry,
  month,
  onMonthChange,
  shift,
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  const reset = (fn) => {
    fn();
    setPage(1);
  };

  const overnight = isOvernightShift(shift);

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return records.filter(
      (r) =>
        (status === "All" || r.status === status) &&
        (!lq ||
          r.date?.includes(lq) ||
          r.status?.toLowerCase().includes(lq) ||
          r.note?.toLowerCase().includes(lq)),
    );
  }, [records, q, status]);

  const total = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pills = [status !== "All" && status, q && `"${q}"`].filter(Boolean);

  return (
    <Card className="p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="text-sm font-medium text-gray-500 flex-1 min-w-20">
          Records{" "}
          {!loading && (
            <span className="text-gray-400 font-normal">
              ({filtered.length})
            </span>
          )}
        </h3>
        <select
          value={month}
          onChange={(e) => {
            onMonthChange(e.target.value);
            setPage(1);
          }}
          className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 cursor-pointer text-gray-700"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={q}
            onChange={(e) => reset(() => setQ(e.target.value))}
            placeholder="Search…"
            className="pl-7 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none w-28 focus:border-gray-400 transition"
          />
        </div>
        <select
          value={status}
          onChange={(e) => reset(() => setStatus(e.target.value))}
          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-gray-700"
        >
          <option value="All">All Statuses</option>
          {["Present", "Late", "Absent", "Leave"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {pills.length > 0 && (
          <button
            onClick={() => {
              setQ("");
              setStatus("All");
              setPage(1);
            }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition"
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {pills.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-900 text-white text-[11px] font-medium rounded-full"
            >
              {p}
              <button
                onClick={() => {
                  if (p === status) reset(() => setStatus("All"));
                  else reset(() => setQ(""));
                }}
                className="opacity-60 hover:opacity-100"
              >
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="mb-4">
          <ErrMsg msg={error} onRetry={onRetry} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                ["Date", "text-left"],
                ["Day", "text-center"],
                ["Status", "text-center"],
                ["Check In", "text-center"],
                ["Check Out", "text-center"],
                ["Hours", "text-center"],
                ["Note", "text-center"],
              ].map(([h, a]) => (
                <th
                  key={h}
                  className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${a}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Loader2
                    size={24}
                    className="mx-auto att-spin text-blue-400 mb-3"
                  />
                  <p className="text-sm text-gray-400">Loading records…</p>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <BarChart2 size={28} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">No records found.</p>
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const cfg = STATUS_CFG[r.status] || {};
                const dObj = new Date(r.date + "T12:00:00");
                const dName = dObj.toLocaleDateString("default", {
                  weekday: "short",
                });
                const dFmt = dObj.toLocaleDateString("default", {
                  month: "short",
                  day: "numeric",
                });
                const isWknd = [0, 6].includes(dObj.getDay());

                /*
                 * Overnight indicator: out_time exists AND
                 * its minutes < in_time minutes (crossed midnight).
                 * Backend already computed hours correctly.
                 */
                const outCrossedMidnight =
                  overnight &&
                  r.in_time &&
                  r.out_time &&
                  (toMins(r.out_time) ?? 9999) < (toMins(r.in_time) ?? 0);

                return (
                  <tr
                    key={`${r.date}-${i}`}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} border-b border-gray-50 last:border-b-0 hover:bg-blue-50/30 transition ${isWknd ? "opacity-50" : ""}`}
                  >
                    {/* Date — always the IN-punch date from backend */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div>
                          <p className="font-semibold text-gray-900">{dFmt}</p>
                          <p className="text-xs text-gray-400">{r.date}</p>
                        </div>
                        {outCrossedMidnight && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 shrink-0">
                            <Moon size={9} />
                            +1
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-lg ${isWknd ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-blue-700"}`}
                      >
                        {dName}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge || "bg-gray-100 text-gray-600"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${cfg.dot || "bg-gray-400"}`}
                        />
                        {r.status}
                      </span>
                    </td>

                    {/* Check In — in_time from backend (punch False) */}
                    <td className="py-3 px-4 text-center">
                      <p className="text-sm font-medium text-gray-700 tabular-nums">
                        {to12(r.in_time)}
                      </p>
                      <p className="text-[10px] text-gray-400">{r.date}</p>
                    </td>

                    {/* Check Out — out_time from backend (punch True), may be next day */}
                    <td className="py-3 px-4 text-center">
                      <p className="text-sm font-medium text-gray-700 tabular-nums">
                        {to12(r.out_time)}
                      </p>
                      {outCrossedMidnight ? (
                        <p className="text-[10px] text-indigo-500 font-medium">
                          next day
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400">{r.date}</p>
                      )}
                    </td>

                    {/* Hours — backend computed cross-midnight correctly */}
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-800 tabular-nums">
                        {fmtHours(r.hours)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {r.note ? (
                        <span
                          title={r.note}
                          className="inline-block max-w-27.5 truncate text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg"
                        >
                          {r.note}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-xs text-gray-500">
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(total, p + 1))}
            disabled={page === total}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </Card>
  );
}

export default function MyAttendancePage({ employeeId: propEmpId, onBack }) {
  // const employeeId = useMemo(() => getEmployeeIdFromToken(), []);
  const [month, setMonth] = useState(CURR_MONTH);

  const [shift, setShift] = useState(null);
  const [shiftLoad, setShiftLoad] = useState(true);

  const [todayRec, setTodayRec] = useState(null);
  const [todayLoad, setTodayLoad] = useState(true);
  const [todayErr, setTodayErr] = useState(null);

  const [summary, setSummary] = useState(null);
  const [sumLoad, setSumLoad] = useState(true);
  const [sumErr, setSumErr] = useState(null);

  const [records, setRecords] = useState([]);
  const [recLoad, setRecLoad] = useState(true);
  const [recErr, setRecErr] = useState(null);

  const [user, setUser] = useState({
    fullName: "Loading...",
    email: "",
    employeeCode: null,
    employeeDbId: propEmpId,
    image: "",
    initials: "—",
    role: null,
    department: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !propEmpId) return;

    let ignore = false;

    async function loadEmployeeDetails() {
      try {
        const res = await fetch(API.employeeDetails(propEmpId), {
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
          "Unknown Employee";
        const initials = fullName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join("");

        setUser({
          fullName,
          email: employee?.email || "",
          employeeCode: employee?.employee_id || employee?.id || null,
          employeeDbId: employee?.id || propEmpId,
          image: employee?.image || "",
          initials: initials || "—",
          role: employee?.role?.name || null,
          department: employee?.department?.department || null,
        });
      } catch (err) {
        console.warn("[EmployeeDetails]", err.message);
        if (!ignore) {
          setUser((prev) => ({
            ...prev,
            fullName: "Error loading employee",
          }));
        }
      }
    }

    loadEmployeeDetails();
    return () => {
      ignore = true;
    };
  }, [propEmpId]);

  /* ── Fetch shift (display only — banner & expected times) ── */
  const loadShift = useCallback(async () => {
    if (!user.employeeCode) {
      setShiftLoad(false);
      return;
    }
    setShiftLoad(true);
    const token = localStorage.getItem("access_token");
    try {
      const url =
        typeof API.shiftDetailsById === "function"
          ? API.shiftDetailsById(user.employeeCode)
          : `${API.shiftDetailsById}/${user.employeeCode}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setShift(Array.isArray(data) ? (data[0] ?? null) : data);
    } catch (e) {
      console.warn("[Shift]", e.message);
      setShift(null);
    } finally {
      setShiftLoad(false);
    }
  }, [user.employeeCode]);

  /* ── Fetch today (/me/today) ──
     Backend resolves overnight post-midnight automatically.
     Returns null when employee is outside shift window. */
  const loadToday = useCallback(async () => {
    if (!user.employeeCode) {
      setTodayLoad(false);
      return;
    }
    setTodayLoad(true);
    setTodayErr(null);
    const token = localStorage.getItem("access_token");
    try {
      const url =
        typeof API.MyAttendanceToday === "function"
          ? API.MyAttendanceToday(user.employeeCode)
          : `${API.MyAttendanceToday}?employee_id=${user.employeeCode}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setTodayRec(data ?? null);
    } catch (e) {
      setTodayErr(e.message);
    } finally {
      setTodayLoad(false);
    }
  }, [user.employeeCode]);

  /* ── Fetch summary ── */
  const loadSummary = useCallback(async () => {
    if (!user.employeeCode) {
      setSumLoad(false);
      return;
    }
    setSumLoad(true);
    setSumErr(null);
    const token = localStorage.getItem("access_token");
    try {
      const url =
        typeof API.MyAttendanceSummary === "function"
          ? API.MyAttendanceSummary(user.employeeCode, month)
          : `${API.MyAttendanceSummary}?employee_id=${user.employeeCode}&month=${month}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setSummary(await res.json());
    } catch (e) {
      setSumErr(e.message);
    } finally {
      setSumLoad(false);
    }
  }, [user.employeeCode, month]);

  /* ── Fetch records (/me?month) ──
     Backend returns records dated on IN-punch date.
     No client-side merging needed. */
  const loadRecords = useCallback(async () => {
    if (!user.employeeCode) {
      setRecLoad(false);
      return;
    }
    setRecLoad(true);
    setRecErr(null);
    const token = localStorage.getItem("access_token");
    try {
      const url =
        typeof API.MyAttendanceByMonth === "function"
          ? API.MyAttendanceByMonth(user.employeeCode, month)
          : `${API.MyAttendance}?employee_id=${user.employeeCode}&month=${month}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : (data.records ?? []));
    } catch (e) {
      setRecErr(e.message);
    } finally {
      setRecLoad(false);
    }
  }, [user.employeeCode, month]);

  useEffect(() => {
    loadShift();
  }, [loadShift]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const refreshAll = () => {
    loadShift();
    loadToday();
    loadSummary();
    loadRecords();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:border-gray-300 text-sm font-medium rounded-xl shadow-sm transition"
        >
          <ArrowLeft size={14} /> All Employees
        </button>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {user.fullName}'s Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Attendance record & monthly overview
          </p>
          {(user.designation || user.role || user.department) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {user.role && (
                <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  {user.role}
                </span>
              )}
              {user.department && (
                <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">
                  {user.department}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 self-start">
          {user.employeeCode && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-500 shadow-sm">
              <User size={12} className="text-gray-400" /> Employee #
              {user.employeeCode}
            </div>
          )}
          <button
            onClick={refreshAll}
            disabled={!user.employeeCode}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-600 text-sm font-medium rounded-xl shadow-sm transition disabled:opacity-40"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {!user.employeeCode && <NoAuthBanner />}

      <ShiftBanner shift={shift} loading={shiftLoad} />

      <div className="mb-5">
        <TodayCard
          rec={todayRec}
          shift={shift}
          loading={todayLoad}
          error={todayErr}
          onRetry={loadToday}
        />
      </div>

      <SummarySection
        summary={summary}
        loading={sumLoad}
        error={sumErr}
        onRetry={loadSummary}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <CalHeatmap records={records} month={month} />
        </div>
        <div className="lg:col-span-2">
          <RecordsTable
            records={records}
            loading={recLoad}
            error={recErr}
            onRetry={loadRecords}
            month={month}
            onMonthChange={setMonth}
            shift={shift}
          />
        </div>
      </div>
    </div>
  );
}
