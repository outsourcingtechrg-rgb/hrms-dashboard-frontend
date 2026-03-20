/**
 * ShiftsPage.jsx
 * Super Admin / HR — Shift Management
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 *  REQUIRED APIs  — already provided in components/Apis.js
 * ├──────────────────────────────────────────────────────────────────┤
 *  CreateShifts : POST  `${mainOrigin}/shifts`
 *  ListShifts   : GET   `${mainOrigin}/shifts`
 *  shiftDetails : GET   `${mainOrigin}/shifts/:id`
 *  DeleteShift  : DEL   `${mainOrigin}/shifts/:id`
 *  UpdateShifts : PUT   `${mainOrigin}/shifts/:id`
 *
 * ├──────────────────────────────────────────────────────────────────┤
 *  PAYLOAD  (Create / Update)
 * ├──────────────────────────────────────────────────────────────────┤
 *  {
 *    name                : string        required
 *    shift_start_timing  : "HH:MM:SS"   required
 *    shift_end_timing    : "HH:MM:SS"   required
 *    shift_late_on       : "HH:MM:SS" | null
 *    total_hours         : "HH:MM:SS"   auto-calculated on frontend
 *    saturday_on         : boolean       default false
 *    allow_remote        : boolean       default false
 *    extra_data          : object | null
 *  }
 * └──────────────────────────────────────────────────────────────────┘
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock, PlusCircle, Edit3, Trash2, Eye, X, Search,
  RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Sun, Moon, Wifi, Users, Send, ChevronLeft, ChevronRight,
  Coffee, Sunset, Sunrise, Info, Check,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─────────────────────────────────── animations ─── */
const _S = `
  @keyframes _fi  { from{opacity:0}                            to{opacity:1} }
  @keyframes _su  { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes _sir { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes _sp  { to{transform:rotate(360deg)} }
  .sh-fi  { animation:_fi  .2s ease-out; }
  .sh-su  { animation:_su  .25s ease-out both; }
  .sh-sir { animation:_sir .3s cubic-bezier(.4,0,.2,1); }
  .sh-sp  { animation:_sp  .85s linear infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("__shifts_styles__")) {
  const el = Object.assign(document.createElement("style"), { id: "__shifts_styles__", textContent: _S });
  document.head.appendChild(el);
}

/* ─────────────────────────────────── helpers ─── */

/** "HH:MM" → total minutes */
function toMinutes(t = "") {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}

/** minutes → "HH:MM:SS" (backend Time format) */
function minToSS(mins) {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/** "HH:MM" or "HH:MM:SS" → "HH:MM AM/PM" */
function to12(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** "HH:MM:SS" → "HH:MM" (for <input type="time">) */
function toHHMM(t = "") { return t ? t.slice(0, 5) : ""; }

/** Calculate total hours between two "HH:MM" strings (handles overnight) */
function calcTotal(start, end) {
  if (!start || !end) return "";
  let diff = toMinutes(end) - toMinutes(start);
  if (diff < 0) diff += 24 * 60; // overnight
  return minToSS(diff);
}

/** Format "HH:MM:SS" as human-readable "Xh Ym" */
function fmtDuration(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  if (!h && !m) return "—";
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Pick a shift period icon by start hour */
function shiftIcon(startTime) {
  const h = parseInt((startTime || "").split(":")[0], 10);
  if (h >= 5  && h < 12) return Sunrise;
  if (h >= 12 && h < 17) return Sun;
  if (h >= 17 && h < 21) return Sunset;
  return Moon;
}

/** Deterministic color per shift id (cycles) */
const COLORS = [
  { ring: "ring-blue-400",   bg: "bg-blue-50",   text: "text-blue-700",   bar: "bg-blue-400",   badge: "bg-blue-100 text-blue-800"   },
  { ring: "ring-violet-400", bg: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-400", badge: "bg-violet-100 text-violet-800"},
  { ring: "ring-emerald-400",bg: "bg-emerald-50",text: "text-emerald-700",bar: "bg-emerald-400",badge: "bg-emerald-100 text-emerald-800"},
  { ring: "ring-amber-400",  bg: "bg-amber-50",  text: "text-amber-700",  bar: "bg-amber-400",  badge: "bg-amber-100 text-amber-800"  },
  { ring: "ring-rose-400",   bg: "bg-rose-50",   text: "text-rose-700",   bar: "bg-rose-400",   badge: "bg-rose-100 text-rose-800"    },
  { ring: "ring-cyan-400",   bg: "bg-cyan-50",   text: "text-cyan-700",   bar: "bg-cyan-400",   badge: "bg-cyan-100 text-cyan-800"    },
];
function colorFor(id) { return COLORS[(id || 0) % COLORS.length]; }

/* ─────────────────────────────────── mock data ─── */
const MOCK_SHIFTS = [
  { id:1, name:"Morning Shift",  shift_start_timing:"08:00:00", shift_end_timing:"16:00:00", shift_late_on:"08:30:00", total_hours:"08:00:00", saturday_on:false, allow_remote:false, extra_data:null, created_at:"2025-01-10T09:00:00Z" },
  { id:2, name:"Afternoon Shift",shift_start_timing:"12:00:00", shift_end_timing:"20:00:00", shift_late_on:"12:20:00", total_hours:"08:00:00", saturday_on:true,  allow_remote:true,  extra_data:null, created_at:"2025-01-12T09:00:00Z" },
  { id:3, name:"Night Shift",    shift_start_timing:"22:00:00", shift_end_timing:"06:00:00", shift_late_on:"22:15:00", total_hours:"08:00:00", saturday_on:true,  allow_remote:false, extra_data:null, created_at:"2025-02-01T09:00:00Z" },
  { id:4, name:"Half Day",       shift_start_timing:"09:00:00", shift_end_timing:"13:00:00", shift_late_on:null,       total_hours:"04:00:00", saturday_on:false, allow_remote:true,  extra_data:null, created_at:"2025-02-14T09:00:00Z" },
  { id:5, name:"Remote Flex",    shift_start_timing:"10:00:00", shift_end_timing:"18:00:00", shift_late_on:"10:30:00", total_hours:"08:00:00", saturday_on:false, allow_remote:true,  extra_data:null, created_at:"2025-03-01T09:00:00Z" },
];

/* ─────────────────────────────────── shared UI ─── */
function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl shadow-sm ${className}`}>{children}</div>;
}

function Widget({ icon: Icon, label, value, color }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors shrink-0 ${on ? "bg-blue-600" : "bg-gray-200"}`}>
      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

/* ─────────────────────────────────── Toast ─── */
function Toast({ toast }) {
  if (!toast) return null;
  const cfg = { success: { bg:"bg-emerald-600", I:CheckCircle2 }, error:{ bg:"bg-red-500", I:XCircle }, info:{ bg:"bg-blue-600", I:Info } };
  const { bg, I } = cfg[toast.type] || cfg.info;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-500 flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-2xl text-sm font-medium pointer-events-none sh-fi ${bg}`}>
      <I size={16}/>{toast.msg}
    </div>
  );
}

/* ─────────────────────────────────── Shift Visual Bar ─── */
function ShiftBar({ start, end, color }) {
  if (!start || !end) return null;
  const startMin  = toMinutes(toHHMM(start));
  const endMin    = toMinutes(toHHMM(end));
  const totalDay  = 24 * 60;
  const left      = (startMin / totalDay) * 100;
  let width       = ((endMin - startMin) / totalDay) * 100;
  if (width <= 0) width += 100; // overnight

  return (
    <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-visible mt-2" title={`${to12(start)} – ${to12(end)}`}>
      <div className={`absolute top-0 h-1.5 rounded-full ${color.bar}`}
        style={{ left:`${Math.min(left,98)}%`, width:`${Math.min(width,100-Math.min(left,98))}%` }} />
    </div>
  );
}

/* ─────────────────────────────────── Shift Card (grid) ─── */
function ShiftCard({ shift, onView, onEdit, onDelete, idx }) {
  const color     = colorFor(shift.id);
  const Icon      = shiftIcon(shift.shift_start_timing);
  const overnight = toMinutes(toHHMM(shift.shift_end_timing)) < toMinutes(toHHMM(shift.shift_start_timing));

  return (
    <div className={`sh-su bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col gap-4`}
      style={{ animationDelay: `${idx * 60}ms` }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color.bg} ${color.text} border border-opacity-30`}>
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{shift.name}</h3>
            <p className="text-xs text-gray-400">{to12(shift.shift_start_timing)} – {to12(shift.shift_end_timing)}</p>
          </div>
        </div>
        {overnight && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">Overnight</span>
        )}
      </div>

      {/* Timeline bar */}
      <ShiftBar start={shift.shift_start_timing} end={shift.shift_end_timing} color={color} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label:"Duration",   value: fmtDuration(shift.total_hours)                },
          { label:"Late Buffer",value: shift.shift_late_on ? to12(shift.shift_late_on) : "None" },
          { label:"Saturday",   value: shift.saturday_on ? "Included" : "Off"        },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl px-2 py-2 text-center">
            <p className="text-[9px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">{label}</p>
            <p className="text-xs font-bold text-gray-800 leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {shift.allow_remote && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
            <Wifi size={10}/> Remote OK
          </span>
        )}
        {shift.saturday_on && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
            <Coffee size={10}/> Sat Included
          </span>
        )}
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${color.badge}`}>
          <Clock size={10}/> {fmtDuration(shift.total_hours)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button onClick={() => onView(shift)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
          <Eye size={12}/> View
        </button>
        <button onClick={() => onEdit(shift)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition">
          <Edit3 size={12}/> Edit
        </button>
        <button onClick={() => onDelete(shift)}
          className="flex items-center justify-center w-8 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
          <Trash2 size={12}/>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Shift Sidebar (detail) ─── */
function ShiftSidebar({ shift, onClose, onEdit, onDelete }) {
  if (!shift) return null;
  const color = colorFor(shift.id);
  const Icon  = shiftIcon(shift.shift_start_timing);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm sh-fi" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 z-51 w-full sm:w-105 bg-white shadow-2xl flex flex-col sh-sir">

        {/* Header */}
        <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-100">
          <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color.bg} ${color.text}`}>
            <Icon size={22}/>
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">{shift.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">ID #{shift.id} · Created {shift.created_at ? new Date(shift.created_at).toLocaleDateString() : "—"}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition shrink-0">
            <X size={15}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Timeline */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Timeline</p>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Start</p>
                <p className="text-lg font-bold text-gray-900">{to12(shift.shift_start_timing)}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-2 rounded-full ${color.bar}`} />
                <p className="text-xs font-semibold text-gray-500">{fmtDuration(shift.total_hours)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400">End</p>
                <p className="text-lg font-bold text-gray-900">{to12(shift.shift_end_timing)}</p>
              </div>
            </div>
            <ShiftBar start={shift.shift_start_timing} end={shift.shift_end_timing} color={color}/>
          </div>

          {/* Details grid */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Details</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:"Duration",      value: fmtDuration(shift.total_hours)        },
                { label:"Late Buffer",   value: shift.shift_late_on ? to12(shift.shift_late_on) : "No buffer" },
                { label:"Saturday",      value: shift.saturday_on ? "Included" : "Off"},
                { label:"Remote Work",   value: shift.allow_remote ? "Allowed" : "On-site only"},
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl px-3 py-3">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">{label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Settings</p>
            <div className="space-y-2">
              {[
                { label: "Saturday included in work week", on: shift.saturday_on    },
                { label: "Remote / WFH allowed",           on: shift.allow_remote  },
              ].map(({ label, on }) => (
                <div key={label} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${on ? "border-blue-100 bg-blue-50" : "border-gray-100 bg-gray-50"}`}>
                  <span className="text-sm text-gray-700">{label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${on ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>
                    {on ? "Yes" : "No"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Extra data */}
          {shift.extra_data && Object.keys(shift.extra_data).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Extra Data</p>
              <pre className="text-xs text-gray-600 bg-gray-50 rounded-xl px-4 py-3 overflow-x-auto border border-gray-100">
                {JSON.stringify(shift.extra_data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={() => { onEdit(shift); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
            <Edit3 size={13}/> Edit Shift
          </button>
          <button onClick={() => { onDelete(shift); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition">
            <Trash2 size={13}/> Delete
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm rounded-xl transition text-center">
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────────────── Create / Edit Modal ─── */
const EMPTY = {
  name: "", shift_start_timing: "08:00", shift_end_timing: "16:00",
  shift_late_on: "", saturday_on: false, allow_remote: false,
};

function ShiftModal({ shift, onClose, onSaved, showToast }) {
  const isEdit = !!shift;
  const [form, setForm]   = useState(
    isEdit ? {
      name:               shift.name,
      shift_start_timing: toHHMM(shift.shift_start_timing),
      shift_end_timing:   toHHMM(shift.shift_end_timing),
      shift_late_on:      toHHMM(shift.shift_late_on),
      saturday_on:        shift.saturday_on,
      allow_remote:       shift.allow_remote,
    } : { ...EMPTY }
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  /* auto-compute total hours */
  const computedTotal = useMemo(() =>
    fmtDuration(calcTotal(form.shift_start_timing, form.shift_end_timing)),
    [form.shift_start_timing, form.shift_end_timing]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())             e.name               = "Shift name is required.";
    if (!form.shift_start_timing)      e.shift_start_timing = "Start time is required.";
    if (!form.shift_end_timing)        e.shift_end_timing   = "End time is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    const payload = {
      name:               form.name.trim(),
      shift_start_timing: `${form.shift_start_timing}:00`,
      shift_end_timing:   `${form.shift_end_timing}:00`,
      shift_late_on:      form.shift_late_on ? `${form.shift_late_on}:00` : null,
      total_hours:        calcTotal(form.shift_start_timing, form.shift_end_timing),
      saturday_on:        form.saturday_on,
      allow_remote:       form.allow_remote,
      extra_data:         null,
    };

    try {
      const url    = isEdit ? API.UpdateShifts(shift.id) : API.CreateShifts;
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Request failed (${res.status})`);
      }
      const saved = await res.json();
      onSaved(saved, isEdit);
      showToast(isEdit ? "Shift updated successfully." : "Shift created successfully.", "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm sh-fi px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            {isEdit ? <Edit3 size={15} className="text-blue-600"/> : <PlusCircle size={15} className="text-blue-600"/>}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">{isEdit ? "Edit Shift" : "Create Shift"}</p>
            <p className="text-[11px] text-gray-400">{isEdit ? `Editing: ${shift.name}` : "Define a new work shift"}</p>
          </div>
          <button onClick={onClose} disabled={saving}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-40">
            <X size={15}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">Shift Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Morning Shift, Night Shift…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition placeholder-gray-300 ${errors.name ? "border-red-300" : "border-gray-200"}`}/>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">Start Time *</label>
              <input type="time" value={form.shift_start_timing}
                onChange={e => set("shift_start_timing", e.target.value)}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${errors.shift_start_timing ? "border-red-300" : "border-gray-200"}`}/>
              {errors.shift_start_timing && <p className="text-xs text-red-500 mt-1">{errors.shift_start_timing}</p>}
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">End Time *</label>
              <input type="time" value={form.shift_end_timing}
                onChange={e => set("shift_end_timing", e.target.value)}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${errors.shift_end_timing ? "border-red-300" : "border-gray-200"}`}/>
              {errors.shift_end_timing && <p className="text-xs text-red-500 mt-1">{errors.shift_end_timing}</p>}
            </div>
          </div>

          {/* Computed total */}
          {form.shift_start_timing && form.shift_end_timing && (
            <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
              <Clock size={14} className="text-blue-500 shrink-0"/>
              <p className="text-sm text-blue-800">
                Total shift duration: <span className="font-bold">{computedTotal}</span>
                {toMinutes(form.shift_end_timing) < toMinutes(form.shift_start_timing) &&
                  <span className="ml-2 text-xs text-indigo-600 font-semibold">(Overnight)</span>}
              </p>
            </div>
          )}

          {/* Late buffer */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">
              Late Buffer Time <span className="normal-case font-normal text-gray-400">(optional — when to mark as late)</span>
            </label>
            <input type="time" value={form.shift_late_on}
              onChange={e => set("shift_late_on", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition"/>
            {form.shift_late_on && form.shift_start_timing && (
              <p className="text-xs text-gray-400 mt-1">
                Grace period: <span className="font-semibold text-gray-600">{toMinutes(form.shift_late_on) - toMinutes(form.shift_start_timing)} minutes</span>
              </p>
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400">Settings</p>

            {[
              { key:"saturday_on",  label:"Include Saturday in work week", sub:"Employees will be expected on Saturdays", icon: Coffee },
              { key:"allow_remote", label:"Allow remote / work from home",  sub:"Employees can work from any location",   icon: Wifi  },
            ].map(({ key, label, sub, icon: Icon }) => (
              <div key={key}
                className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border transition cursor-pointer
                  ${form[key] ? "border-blue-100 bg-blue-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}
                onClick={() => set(key, !form[key])}>
                <div className="flex items-center gap-3">
                  <Icon size={16} className={form[key] ? "text-blue-600" : "text-gray-400"}/>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                </div>
                <Toggle on={form[key]} onChange={v => set(key, v)} label={label}/>
              </div>
            ))}
          </div>

          {/* Live preview bar */}
          {form.shift_start_timing && form.shift_end_timing && (
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Preview</p>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex justify-between text-[10px] text-gray-400 font-medium mb-1">
                  <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
                </div>
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  {(() => {
                    const s = toMinutes(form.shift_start_timing);
                    const e = toMinutes(form.shift_end_timing);
                    const total = 24*60;
                    const left  = (s/total)*100;
                    let   width = ((e-s)/total)*100;
                    if (width <= 0) width += 100;
                    return (
                      <div className="absolute top-0 h-3 rounded-full bg-blue-500"
                        style={{ left:`${Math.min(left,98)}%`, width:`${Math.min(width,100)}%` }}/>
                    );
                  })()}
                </div>
                {form.shift_late_on && (
                  <div className="relative w-full h-1 mt-0.5">
                    {(() => {
                      const pos = (toMinutes(form.shift_late_on)/(24*60))*100;
                      return <div className="absolute top-0 w-0.5 h-1 bg-red-400 rounded-full" style={{ left:`${pos}%`}} title="Late marker"/>;
                    })()}
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-600 mt-1 font-semibold">
                  <span>{to12(form.shift_start_timing+":00")}</span>
                  <span>{computedTotal}</span>
                  <span>{to12(form.shift_end_timing+":00")}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {saving
              ? <><Loader2 size={14} className="sh-sp"/> {isEdit ? "Saving…" : "Creating…"}</>
              : <><Send size={14}/> {isEdit ? "Save Changes" : "Create Shift"}</>}
          </button>
          <button onClick={onClose} disabled={saving}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Delete confirm ─── */
function DeleteConfirm({ shift, deleting, onConfirm, onCancel }) {
  if (!shift) return null;
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm sh-fi px-4">
      <div className="bg-white rounded-2xl p-6 w-95 max-w-full shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500"/>
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Delete Shift?</h2>
        <p className="text-sm text-gray-500 text-center mb-1">You are about to permanently delete:</p>
        <p className="text-sm font-bold text-gray-800 text-center mb-4">"{shift.name}"</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2 mb-5">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
          <p className="text-xs text-amber-700">Employees currently assigned this shift may be affected. This action cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {deleting ? <><Loader2 size={14} className="sh-sp"/> Deleting…</> : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────── Main page ─── */
const PAGE_SIZE = 9; // grid of 3 — multiples of 3 look cleaner

export default function ShiftsPage() {
  const [shifts,  setShifts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr,setFetchErr]= useState(null);

  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("All"); // All | Remote | Saturday
  const [page,    setPage]    = useState(1);

  const [viewShift,   setViewShift]   = useState(null);
  const [editShift,   setEditShift]   = useState(null);
  const [showCreate,  setShowCreate]  = useState(false);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [deleting,    setDeleting]    = useState(false);

  const [toast, setToast] = useState(null);

  /* ── toast ── */
  const showToast = useCallback((msg, type="info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* ── fetch ── */
  const fetchShifts = useCallback(async () => {
    setLoading(true); setFetchErr(null);
    try {
      const res = await fetch(API.ListShifts);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : data.shifts || []);
    } catch (err) {
      console.warn("[Shifts] ListShifts:", err.message, "→ mock");
      setShifts(MOCK_SHIFTS);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  /* ── CRUD ── */
  const handleSaved = (saved, isEdit) =>
    setShifts(prev => isEdit ? prev.map(s => s.id === saved.id ? saved : s) : [saved, ...prev]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(API.DeleteShift(deleteTarget.id), { method: "DELETE" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setShifts(prev => prev.filter(s => s.id !== deleteTarget.id));
      showToast("Shift deleted successfully.", "success");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || "Failed to delete shift.", "error");
    } finally { setDeleting(false); }
  };

  /* ── filter ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return shifts.filter(s =>
      (!q || s.name.toLowerCase().includes(q)) &&
      (filter === "All" ||
       (filter === "Remote"   && s.allow_remote) ||
       (filter === "Saturday" && s.saturday_on))
    );
  }, [shifts, search, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const sf = fn => { fn(); setPage(1); };

  /* ── stats ── */
  const stats = {
    total:    shifts.length,
    remote:   shifts.filter(s => s.allow_remote).length,
    saturday: shifts.filter(s => s.saturday_on).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Clock size={20} className="text-blue-500"/>
            <h1 className="text-3xl font-semibold">Shift Management</h1>
          </div>
          <p className="text-sm text-gray-500">Create and manage work shifts · Super Admin</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="self-start flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
          <PlusCircle size={16}/> New Shift
        </button>
      </header>

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Widget icon={Clock}  label="Total Shifts"   value={loading?"…":stats.total}    color="border-blue-200 bg-blue-50 text-blue-700"/>
        <Widget icon={Wifi}   label="Remote Allowed" value={loading?"…":stats.remote}   color="border-teal-200 bg-teal-50 text-teal-700"/>
        <Widget icon={Coffee} label="Sat Included"   value={loading?"…":stats.saturday} color="border-orange-200 bg-orange-50 text-orange-700"/>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
          <input value={search} onChange={e => sf(() => setSearch(e.target.value))}
            placeholder="Search shifts…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-300"/>
        </div>
        {/* Quick filters */}
        <div className="flex gap-2">
          {["All","Remote","Saturday"].map(f => (
            <button key={f} onClick={() => sf(() => setFilter(f))}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${filter===f ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
              {f}
            </button>
          ))}
        </div>
        {/* Refresh */}
        <button onClick={fetchShifts} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition disabled:opacity-50">
          {loading ? <Loader2 size={14} className="sh-sp"/> : <RefreshCw size={14}/>} Refresh
        </button>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} shift{filtered.length!==1?"s":""}</span>
      </div>

      {/* Error */}
      {fetchErr && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <XCircle size={16} className="text-red-500 mt-0.5 shrink-0"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Failed to load shifts</p>
            <p className="text-xs text-red-400">{fetchErr}</p>
          </div>
          <button onClick={fetchShifts} className="text-xs font-semibold text-red-600 hover:underline">Retry</button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center py-20">
          <Loader2 size={32} className="sh-sp text-blue-400 mb-4"/>
          <p className="text-sm text-gray-400">Loading shifts…</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <Clock size={36} className="text-gray-200 mb-4"/>
          <p className="text-sm text-gray-400 mb-3">{search || filter !== "All" ? "No shifts match your filters." : "No shifts yet."}</p>
          {!search && filter === "All" && (
            <button onClick={() => setShowCreate(true)} className="text-sm text-blue-600 font-medium hover:underline">+ Create first shift</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {paginated.map((s, i) => (
            <ShiftCard key={s.id} shift={s} idx={i}
              onView={setViewShift} onEdit={setEditShift} onDelete={setDeleteTarget}/>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-2">
          <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">
            <ChevronLeft size={14}/> Previous
          </button>
          <span className="text-xs text-gray-500">
            {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}
          </span>
          <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm">
            Next <ChevronRight size={14}/>
          </button>
        </div>
      )}

      {/* Overlays */}
      {showCreate && (
        <ShiftModal onClose={()=>setShowCreate(false)} onSaved={handleSaved} showToast={showToast}/>
      )}
      {editShift && (
        <ShiftModal shift={editShift} onClose={()=>setEditShift(null)} onSaved={handleSaved} showToast={showToast}/>
      )}
      {viewShift && (
        <ShiftSidebar shift={viewShift} onClose={()=>setViewShift(null)}
          onEdit={s=>{setViewShift(null);setEditShift(s);}}
          onDelete={s=>{setViewShift(null);setDeleteTarget(s);}}/>
      )}
      {deleteTarget && (
        <DeleteConfirm shift={deleteTarget} deleting={deleting}
          onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)}/>
      )}

      <Toast toast={toast}/>
    </div>
  );
}