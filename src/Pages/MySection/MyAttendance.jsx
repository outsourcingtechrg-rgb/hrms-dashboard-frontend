import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2, XCircle, Clock, Calendar, TrendingUp,
  ChevronLeft, ChevronRight, Loader2, RefreshCw, X,
  Search, LogIn, LogOut, Timer, Info, AlertCircle,
  BarChart2, User, Moon, Sun, Sunset, ArrowLeft,
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

/* ─── JWT helpers ─── */
function getEmployeeIdFromToken() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.EPI;
  } catch { return null; }
}
function getEmployeeMachineIdFromToken() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.id;
  } catch { return null; }
}

/* ─── Time helpers ─── */
function to12(rawTime) {
  if (!rawTime) return "—";
  const t = String(rawTime).slice(0, 5);
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10), m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return String(rawTime);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
function toMins(t) {
  if (!t) return null;
  const parts = String(t).split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parts[2] ? parseInt(parts[2], 10) : 0;
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m + s / 60;
}
function fmtHours(h) {
  if (h == null) return "—";
  const hrs = Math.floor(h), min = Math.round((h - hrs) * 60);
  return min > 0 ? `${hrs}h ${min}m` : `${hrs}h`;
}
function fmtShiftTotal(s) {
  const mins = toMins(s);
  return mins != null ? fmtHours(mins / 60) : null;
}
function shiftPeriod(startTime) {
  const mins = toMins(startTime);
  if (mins === null) return "day";
  if (mins >= 18 * 60 || mins < 4 * 60) return "night";
  if (mins >= 12 * 60) return "afternoon";
  return "day";
}

/* ─── Shift period meta — now uses CSS var classes ─── */
const PERIOD_META = {
  day:       { label: "Day Shift",       Icon: Sun,    cls: "ed-shift-day",       iconCls: "text-amber-500"  },
  afternoon: { label: "Afternoon Shift", Icon: Sunset, cls: "ed-shift-afternoon", iconCls: "text-orange-500" },
  night:     { label: "Night Shift",     Icon: Moon,   cls: "ed-shift-night",     iconCls: "text-indigo-500" },
};

function isOvernightShift(shift) {
  if (!shift) return false;
  const s = toMins(shift.shift_start_timing);
  const e = toMins(shift.shift_end_timing);
  return s != null && e != null && e < s;
}

/* ─── Status config — CSS var classes ─── */
const STATUS_CFG = {
  Present:      { badge: "ed-badge-present",  dot: "ed-dot-present",  cal: "ed-cal-present"  },
  Late:         { badge: "ed-badge-late",     dot: "ed-dot-late",     cal: "ed-cal-late"     },
  Early:        { badge: "ed-badge-early",    dot: "ed-dot-early",    cal: "ed-cal-early"    },
  "Late & Early":{ badge: "bg-gradient-to-r from-yellow-400 to-blue-500 text-white", dot: "bg-slate-400", cal: "bg-gradient-to-r from-yellow-400 to-blue-500 text-white" },
  Absent:       { badge: "ed-badge-absent",   dot: "ed-dot-absent",   cal: "ed-cal-absent"   },
  Leave:        { badge: "ed-badge-leave",    dot: "ed-dot-leave",    cal: "ed-cal-leave"    },
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

/* ─── Primitives ─── */
function Card({ children, className = "" }) {
  return (
    <div className={`ed-card ${className}`}>
      {children}
    </div>
  );
}

function ErrMsg({ msg, onRetry }) {
  if (!msg) return null;
  return (
    <div className="ed-error flex items-start gap-3 rounded-xl px-4 py-3">
      <AlertCircle size={15} className="mt-0.5 shrink-0" style={{ color: "var(--error-subtext)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: "var(--error-text)" }}>Could not load data</p>
        <p className="text-xs mt-0.5 break-words" style={{ color: "var(--error-subtext)" }}>{msg}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold shrink-0 hover:underline" style={{ color: "var(--error-text)" }}>
          Retry
        </button>
      )}
    </div>
  );
}

function NoAuthBanner() {
  return (
    <div className="ed-warn flex items-start gap-3 rounded-xl px-4 py-4 mb-5">
      <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--warn-subtext)" }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--warn-text)" }}>Not authenticated</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--warn-subtext)" }}>No valid access token found. Please log in.</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Shift Banner
───────────────────────────────────────── */
function ShiftBanner({ shift, loading }) {
  if (loading) return <div className="h-10 ed-subtle animate-pulse rounded-xl mb-5" />;
  if (!shift) return null;

  const period = shiftPeriod(shift.shift_start_timing);
  const meta = PERIOD_META[period];
  const ShiftIcon = meta.Icon;
  const overnight = isOvernightShift(shift);

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-5 ${meta.cls}`}>
      <ShiftIcon size={15} className={meta.iconCls} />
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className={`font-semibold ${meta.iconCls}`}>{meta.label}</span>
        <span style={{ color: "var(--border-focus)" }}>·</span>
        <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{shift.name}</span>
        <span style={{ color: "var(--border-focus)" }}>·</span>
        <span style={{ color: "var(--text-tertiary)" }}>
          {to12(shift.shift_start_timing)} → {to12(shift.shift_end_timing)}
          {overnight && <span className="ml-1.5 font-semibold text-indigo-600"> (Overnight +1 day)</span>}
        </span>
        {shift.shift_late_on && (
          <>
            <span style={{ color: "var(--border-focus)" }}>·</span>
            <span style={{ color: "var(--text-tertiary)" }}>Late after {to12(shift.shift_late_on)}</span>
          </>
        )}
        {shift.total_hours && (
          <>
            <span style={{ color: "var(--border-focus)" }}>·</span>
            <span style={{ color: "var(--text-tertiary)" }}>{fmtShiftTotal(shift.total_hours)} shift</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Countdown
───────────────────────────────────────── */
function CountdownToCheckout({ rec, shift }) {
  const [remaining, setRemaining] = React.useState(null);

  React.useEffect(() => {
    if (!rec?.in_time || !shift?.total_hours) { setRemaining(null); return; }
    function update() {
      const nowPKT = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
      const now = new Date(nowPKT);
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();
      const [inH, inM] = String(rec.in_time).split(":").map(Number);
      const inMins = inH * 60 + inM;
      const [shH, shM] = String(shift.total_hours).split(":").map(Number);
      const dur = shH * 60 + shM;
      let target = inMins + dur;
      if (target >= 24 * 60) target -= 24 * 60;
      let diff = target - currentTotalMins;
      if (diff < 0) diff += 24 * 60;
      if (diff <= 0) setRemaining(null);
      else setRemaining({ hours: Math.floor(diff / 60), mins: diff % 60, totalMins: diff });
    }
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [rec, shift]);

  if (!remaining) return null;

  return (
    //  px-4 py-3 mb-4
    <div className="ed-countdown flex items-center gap-3 rounded-xl px-4 py-3 mb-4">
      <Clock size={16} className="animate-pulse" style={{ color: "var(--countdown-text)" }} />
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold leading-none mb-1" style={{ color: "var(--countdown-text)" }}>
          Until Checkout
        </p>
        <p className="text-lg font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {remaining.hours}h {remaining.mins}m
        </p>
      </div>
      {remaining.totalMins <= 60 && (
        <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-lg ed-badge-absent animate-pulse">
          Approaching
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Today Card
───────────────────────────────────────── */
function TodayCard({ rec, shift, loading, error, onRetry }) {
  const cfg = rec ? STATUS_CFG[rec.status] : null;
  const dayFmt = new Date().toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const period = shift ? shiftPeriod(shift.shift_start_timing) : "day";
  const periodMeta = PERIOD_META[period];
  const overnight = isOvernightShift(shift);
  const expIn = shift?.shift_start_timing ? to12(shift.shift_start_timing) : null;
  const expOut = shift?.shift_end_timing ? to12(shift.shift_end_timing) : null;
  const shiftTotal = shift?.total_hours ? fmtShiftTotal(shift.total_hours) : null;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-0.5" style={{ color: "var(--text-tertiary)" }}>Today</p>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{dayFmt}</h2>
          {shift && (
            <p className={`text-xs mt-0.5 font-medium ${periodMeta.iconCls}`}>
              {periodMeta.label} · {to12(shift.shift_start_timing)} – {to12(shift.shift_end_timing)}
              {overnight && <span className="ml-1 font-semibold text-indigo-500"> (+1 day)</span>}
            </p>
          )}
        </div>
        {cfg && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.badge}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} /> {rec.status}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-2">
          <Loader2 size={18} className="att-spin text-blue-400" />
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>Checking today's record…</span>
        </div>
      )}

      {!loading && !error && rec && !rec.out_time && <CountdownToCheckout rec={rec} shift={shift} />}
      {!loading && error && <ErrMsg msg={error} onRetry={onRetry} />}

      {!loading && !error && !rec && (
        <div className="flex items-center gap-3 ed-subtle rounded-xl px-4 py-3">
          <Clock size={16} style={{ color: "var(--text-disabled)" }} />
          <div>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No attendance record found for today.</p>
            {expIn && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Expected check-in: <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{expIn}</span>
                {overnight && <span style={{ color: "var(--text-tertiary)" }}> · out next day at {expOut}</span>}
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && !error && rec && (
        <div className="att-slide space-y-4">
          {overnight && rec.in_time && (
            <div className="ed-shift-night flex items-center gap-2 rounded-xl px-3 py-2">
              <Moon size={13} className="text-indigo-500 shrink-0" />
              <p className="text-xs font-medium text-indigo-700">
                Night shift — started <span className="font-bold">{rec.date}</span>
                {rec.out_time ? <>, ends next calendar day</> : <>, still in progress</>}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Check In",      value: to12(rec.in_time),   sub: expIn  ? `Expected ${expIn}`  : null, Icon: LogIn,  bg: "ed-badge-present", ic: "text-emerald-600" },
              { label: "Check Out",     value: to12(rec.out_time),  sub: expOut ? `Expected ${expOut}` : null, Icon: LogOut, bg: "ed-badge-absent",  ic: "text-red-500"     },
              { label: "Hours Worked",  value: fmtHours(rec.hours), sub: shiftTotal ? `Shift ${shiftTotal}` : null, Icon: Timer, bg: "bg-blue-50",  ic: "text-blue-600"    },
            ].map(({ label, value, sub, Icon, bg, ic }) => (
              <div key={label} className={`flex flex-col items-center gap-1.5 rounded-xl py-4 px-2 ${bg}`}>
                <div className="w-9 h-9 ed-card rounded-lg shadow-sm flex items-center justify-center">
                  <Icon size={16} className={ic} />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-center leading-tight" style={{ color: "var(--text-tertiary)" }}>
                  {label}
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</span>
                {sub && <span className="text-[10px] text-center leading-tight" style={{ color: "var(--text-tertiary)" }}>{sub}</span>}
              </div>
            ))}
          </div>

          {rec.note && (
            <div className="flex items-center gap-2.5 ed-warn rounded-xl px-3 py-2.5">
              <Info size={14} className="shrink-0" style={{ color: "var(--warn-subtext)" }} />
              <p className="text-xs" style={{ color: "var(--warn-text)" }}>{rec.note}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────
   Rate Card
───────────────────────────────────────── */
function RateCard({ summary, loading }) {
  const rate = summary?.rate ?? 0;
  const rateColor = rate >= 90 ? "text-emerald-600" : rate >= 75 ? "text-amber-500" : "text-red-500";
  const rateBar   = rate >= 90 ? "bg-emerald-500"   : rate >= 75 ? "bg-amber-400"   : "bg-red-500";
  const rateLabel = rate >= 90 ? "Excellent"         : rate >= 75 ? "Good"            : "Needs Attention";

  return (
    <Card className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Rate</span>
        <TrendingUp size={14} style={{ color: "var(--text-disabled)" }} />
      </div>
      {loading ? (
        <Loader2 size={18} className="att-spin text-blue-400" />
      ) : (
        <>
          <div className="flex items-end gap-2 mb-2">
            <span className={`text-3xl font-bold ${rateColor}`}>{rate}%</span>
            <span className={`text-xs font-semibold mb-0.5 ${rateColor}`}>{rateLabel}</span>
          </div>
          <div className="ed-track w-full h-2">
            <div className={`h-2 rounded-full transition-all ${rateBar}`} style={{ width: `${rate}%` }} />
          </div>
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--text-disabled)" }}>
            <span>0%</span><span>Target 90%</span><span>100%</span>
          </div>
        </>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────
   Summary Section
───────────────────────────────────────── */
function SummarySection({ summary, loading, error, onRetry, records, shift }) {
  const monthlyHours = useMemo(() => records.reduce((total, r) => {
    if (!r.date || !r.hours) return total;
    const dow = new Date(r.date + "T12:00:00").getDay();
    return (dow === 0 || dow === 6) ? total : total + r.hours;
  }, 0), [records]);

  const expectedMonthlyHours = useMemo(() => {
    if (!summary?.total_days && records.length === 0) return 0;
    let dailyHours = 9;
    if (shift?.total_hours) {
      const mins = toMins(shift.total_hours);
      dailyHours = mins ? mins / 60 : 9;
    } else if (summary?.shift_duration) {
      const [hStr, mStr] = String(summary.shift_duration).split(":");
      dailyHours = parseInt(hStr, 10) + parseInt(mStr, 10) / 60;
    }
    const workingDays = records.reduce((count, r) => {
      if (!r.date) return count;
      const dow = new Date(r.date + "T12:00:00").getDay();
      return (dow === 0 || dow === 6) ? count : count + 1;
    }, 0);
    return workingDays > 0 ? workingDays * dailyHours : summary.total_days * 8;
  }, [summary, records, shift]);

  const stats = [
    { key: "Present", val: summary?.present, bar: "bg-emerald-500", badge: "ed-badge-present", Icon: CheckCircle2 },
    { key: "Late",    val: summary?.late,    bar: "bg-yellow-400",  badge: "ed-badge-late",    Icon: Clock        },
    { key: "Absent",  val: summary?.absent,  bar: "bg-red-400",     badge: "ed-badge-absent",  Icon: XCircle      },
    { key: "Early",   val: summary?.early,   bar: "bg-blue-400",    badge: "ed-badge-early",   Icon: Clock        },
    { key: "Leave",   val: summary?.leave,   bar: "bg-slate-400",   badge: "ed-badge-leave",   Icon: Calendar     },
  ];

  if (error && !loading) return <div className="mb-5"><ErrMsg msg={error} onRetry={onRetry} /></div>;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
      {stats.map(({ key, val, bar, badge, Icon }) => {
        const total = summary?.total_days;
        const pct = total && val != null ? Math.round((val / total) * 100) : 0;
        return (
          <Card key={key} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${badge}`}>
                  <Icon size={15} />
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{key}</span>
              </div>
              {loading
                ? <Loader2 size={16} className="att-spin text-blue-400" />
                : <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{val ?? "—"}</span>
              }
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium" style={{ color: "var(--text-tertiary)" }}>
                <span>of {total ?? "—"} days</span>
                <span>{pct}%</span>
              </div>
              <div className="ed-track w-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${bar}`} style={{ width: loading ? "0%" : `${pct}%` }} />
              </div>
            </div>
          </Card>
        );
      })}

      {/* Monthly Hours */}
      <Card className="p-5 flex flex-col col-span-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Monthly Hours</span>
          <Timer size={14} style={{ color: "var(--text-tertiary)" }} />
        </div>
        {loading ? (
          <Loader2 size={18} className="att-spin text-blue-400" />
        ) : (
          <>
            <div className="mb-3">
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-3xl font-bold tabular-nums ${monthlyHours < expectedMonthlyHours ? "text-red-600" : "text-blue-600"}`}>
                  {fmtHours(monthlyHours)}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>/ {fmtHours(expectedMonthlyHours)}</span>
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                {expectedMonthlyHours > 0 ? `${Math.round((monthlyHours / expectedMonthlyHours) * 100)}% complete` : "No target set"}
              </p>
            </div>
            {expectedMonthlyHours > 0 && (
              <div className="ed-track w-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${monthlyHours < expectedMonthlyHours ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min((monthlyHours / expectedMonthlyHours) * 100, 100)}%` }}
                />
              </div>
            )}
            {monthlyHours < expectedMonthlyHours && (
              <div className="flex items-center gap-2 mt-3 px-2.5 py-1.5 ed-badge-absent rounded-lg">
                <AlertCircle size={12} className="shrink-0" style={{ color: "var(--absent-text)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--absent-text)" }}>
                  {fmtHours(expectedMonthlyHours - monthlyHours)} remaining
                </span>
              </div>
            )}
            {monthlyHours >= expectedMonthlyHours && (
              <div className="flex items-center gap-2 mt-3 px-2.5 py-1.5 ed-badge-present rounded-lg">
                <CheckCircle2 size={12} className="shrink-0" style={{ color: "var(--present-text)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--present-text)" }}>Target completed ✓</span>
              </div>
            )}
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

  const map = useMemo(() => {
    const m = {};
    records.forEach((r) => { if (r.date) m[r.date] = r.status; });
    return m;
  }, [records]);

  const DAY_HDR = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function cellCls(day) {
    const date = `${yr}-${String(mo).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const dow = new Date(date + "T12:00:00").getDay();
    const wknd = dow === 0 || dow === 6;
    const st = map[date];
    const isToday = date === TODAY_STR;
    const base = st
      ? STATUS_CFG[st]?.cal || "ed-subtle"
      : wknd ? "ed-subtle opacity-50" : "ed-subtle";
    return `${base}${isToday ? " ring-2 ring-offset-1 ring-blue-500" : ""}`;
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Monthly Heatmap</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {[["Present","ed-cal-present"],["Late","ed-cal-late"],["Early","ed-cal-early"],["Absent","ed-cal-absent"],["Leave","ed-cal-leave"]].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-sm ${c}`} />
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HDR.map((l) => (
          <div key={l} className="text-[10px] font-semibold text-center py-0.5" style={{ color: "var(--text-tertiary)" }}>{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMo }, (_, i) => {
          const d = i + 1;
          const date = `${yr}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
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

/* ─────────────────────────────────────────
   Records Table
───────────────────────────────────────── */
const PAGE_SIZE = 10;

function RecordsTable({ records, loading, error, onRetry, month, onMonthChange, shift }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const reset = (fn) => { fn(); setPage(1); };
  const overnight = isOvernightShift(shift);

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return records.filter((r) =>
      (status === "All" || r.status === status) &&
      (!lq || r.date?.includes(lq) || r.status?.toLowerCase().includes(lq))
    );
  }, [records, q, status]);

  const total = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pills = [status !== "All" && status, q && `"${q}"`].filter(Boolean);

  return (
    <Card className="p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h3 className="text-sm font-medium flex-1 min-w-20" style={{ color: "var(--text-secondary)" }}>
          Records {!loading && <span style={{ color: "var(--text-tertiary)" }}>({filtered.length})</span>}
        </h3>
        <select
          value={month}
          onChange={(e) => { onMonthChange(e.target.value); setPage(1); }}
          className="text-sm ed-input px-3 py-1.5 outline-none cursor-pointer"
        >
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
          <input
            value={q}
            onChange={(e) => reset(() => setQ(e.target.value))}
            placeholder="Search…"
            className="pl-7 pr-2 py-1.5 text-xs ed-input outline-none w-28 transition"
          />
        </div>
        <select
          value={status}
          onChange={(e) => reset(() => setStatus(e.target.value))}
          className="text-xs ed-input px-2.5 py-1.5 outline-none cursor-pointer"
        >
          <option value="All">All Statuses</option>
          {["Present","Late","Absent","Leave"].map((s) => <option key={s}>{s}</option>)}
        </select>
        {pills.length > 0 && (
          <button
            onClick={() => { setQ(""); setStatus("All"); setPage(1); }}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition ed-badge-absent"
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {pills.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-full"
              style={{ background: "var(--text-primary)", color: "var(--bg-card)" }}>
              {p}
              <button onClick={() => { if (p === status) reset(() => setStatus("All")); else reset(() => setQ("")); }} className="opacity-60 hover:opacity-100">
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && !loading && <div className="mb-4"><ErrMsg msg={error} onRetry={onRetry} /></div>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="ed-table-head border-b ed-table-border">
              {[["Date","text-left"],["Day","text-center"],["Status","text-center"],["Check In","text-center"],["Check Out","text-center"],["Hours","text-center"]].map(([h, a]) => (
                <th key={h} className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap ${a}`}
                  style={{ color: "var(--text-tertiary)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <Loader2 size={24} className="mx-auto att-spin text-blue-400 mb-3" />
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading records…</p>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <BarChart2 size={28} className="mx-auto mb-3" style={{ color: "var(--text-disabled)" }} />
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No records found.</p>
              </td></tr>
            ) : rows.map((r, i) => {
              const cfg = STATUS_CFG[r.status] || {};
              const dObj = new Date(r.date + "T12:00:00");
              const dName = dObj.toLocaleDateString("default", { weekday: "short" });
              const dFmt  = dObj.toLocaleDateString("default", { month: "short", day: "numeric" });
              const isWknd = [0,6].includes(dObj.getDay());
              const outCrossed = overnight && r.in_time && r.out_time && (toMins(r.out_time) ?? 9999) < (toMins(r.in_time) ?? 0);

              return (
                <tr key={`${r.date}-${i}`}
                  className={`border-b ed-table-border last:border-b-0 transition ${isWknd ? "opacity-50" : ""}`}
                  style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--table-row-alt)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--table-row-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "var(--bg-card)" : "var(--table-row-alt)"}
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div>
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{dFmt}</p>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{r.date}</p>
                      </div>
                      {outCrossed && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ed-shift-night shrink-0">
                          <Moon size={9} />+1
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${isWknd ? "ed-subtle" : "ed-badge-early"}`}>
                      {dName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge || "ed-subtle"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot || "bg-gray-400"}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <p className="text-sm font-medium tabular-nums" style={{ color: "var(--text-secondary)" }}>{to12(r.in_time)}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{r.date}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <p className="text-sm font-medium tabular-nums" style={{ color: "var(--text-secondary)" }}>{to12(r.out_time)}</p>
                    {outCrossed
                      ? <p className="text-[10px] font-medium text-indigo-500">next day</p>
                      : <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{r.date}</p>
                    }
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{fmtHours(r.hours)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {total > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ed-btn-ghost disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <button onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={page === total}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ed-btn-ghost disabled:opacity-40 disabled:cursor-not-allowed">
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   Root Page
═══════════════════════════════════════════════════════════ */
export default function MyAttendancePage() {
  const employeeId        = useMemo(() => getEmployeeIdFromToken(), []);
  const employeeMachineId = useMemo(() => getEmployeeMachineIdFromToken(), []);
  const [month, setMonth] = useState(CURR_MONTH);

  const [shift,     setShift]     = useState(null);
  const [shiftLoad, setShiftLoad] = useState(true);

  const [todayRec,  setTodayRec]  = useState(null);
  const [todayLoad, setTodayLoad] = useState(true);
  const [todayErr,  setTodayErr]  = useState(null);

  const [summary,   setSummary]   = useState(null);
  const [sumLoad,   setSumLoad]   = useState(true);
  const [sumErr,    setSumErr]    = useState(null);

  const [records,   setRecords]   = useState([]);
  const [recLoad,   setRecLoad]   = useState(true);
  const [recErr,    setRecErr]    = useState(null);

  const loadShift = useCallback(async () => {
    if (!employeeId) { setShiftLoad(false); return; }
    setShiftLoad(true);
    try {
      const url = typeof API.shiftDetailsById === "function" ? API.shiftDetailsById(employeeId) : `${API.shiftDetailsById}/${employeeId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setShift(Array.isArray(data) ? (data[0] ?? null) : data);
    } catch (e) { console.warn("[Shift]", e.message); setShift(null); }
    finally { setShiftLoad(false); }
  }, [employeeId]);

  const loadToday = useCallback(async () => {
    if (!employeeId) { setTodayLoad(false); return; }
    setTodayLoad(true); setTodayErr(null);
    try {
      const url = typeof API.MyAttendanceToday === "function" ? API.MyAttendanceToday(employeeId) : `${API.MyAttendanceToday}?employee_id=${employeeId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setTodayRec((await res.json()) ?? null);
    } catch (e) { setTodayErr(e.message); }
    finally { setTodayLoad(false); }
  }, [employeeId]);

  const loadSummary = useCallback(async () => {
    if (!employeeId) { setSumLoad(false); return; }
    setSumLoad(true); setSumErr(null);
    try {
      const url = typeof API.MyAttendanceSummary === "function" ? API.MyAttendanceSummary(employeeId, month) : `${API.MyAttendanceSummary}?employee_id=${employeeId}&month=${month}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setSummary(await res.json());
    } catch (e) { setSumErr(e.message); }
    finally { setSumLoad(false); }
  }, [employeeId, month]);

  const loadRecords = useCallback(async () => {
    if (!employeeId) { setRecLoad(false); return; }
    setRecLoad(true); setRecErr(null);
    try {
      const url = typeof API.MyAttendanceByMonth === "function" ? API.MyAttendanceByMonth(employeeId, month) : `${API.MyAttendance}?employee_id=${employeeId}&month=${month}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : (data.records ?? []));
    } catch (e) { setRecErr(e.message); }
    finally { setRecLoad(false); }
  }, [employeeId, month]);

  useEffect(() => { loadShift(); loadToday(); }, [loadShift, loadToday]);
  useEffect(() => { loadSummary(); loadRecords(); }, [loadSummary, loadRecords]);

  const refreshAll = () => { loadShift(); loadToday(); loadSummary(); loadRecords(); };

  return (
    <div className="min-h-screen ed-page px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>My Attendance</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Your personal attendance record & monthly overview</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          {employeeMachineId && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 ed-card rounded-xl text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}>
              <User size={12} style={{ color: "var(--text-tertiary)" }} /> Employee #{employeeMachineId}
            </div>
          )}
          <button
            onClick={refreshAll}
            disabled={!employeeId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl shadow-sm transition ed-btn-ghost disabled:opacity-40"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {!employeeId && <NoAuthBanner />}

      <ShiftBanner shift={shift} loading={shiftLoad} />

      <div className="mb-5">
        <TodayCard rec={todayRec} shift={shift} loading={todayLoad} error={todayErr} onRetry={loadToday} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="lg:col-span-2 md:grid-cols-2 gap-5">
          <SummarySection summary={summary} loading={sumLoad} error={sumErr} onRetry={loadSummary} records={records} shift={shift} />
        </div>
        <div>
          <CalHeatmap records={records} month={month} />
        </div>
      </div>

      <div className="my-2">
        <RateCard summary={summary} loading={sumLoad} />
      </div>

      <RecordsTable
        records={records} loading={recLoad} error={recErr} onRetry={loadRecords}
        month={month} onMonthChange={setMonth} shift={shift}
      />
    </div>
  );
}