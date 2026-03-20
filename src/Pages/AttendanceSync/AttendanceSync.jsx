import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wifi, WifiOff, RefreshCw, PlusCircle, Edit3, Trash2,
  Eye, X, Search, Send, Loader2, CheckCircle2, XCircle,
  AlertTriangle, Info, Clock, Activity, Shield,
  ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
  Radio, Server, Zap, Calendar, Timer,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─────────────────────────────────── animations ─── */
const _S = `
  @keyframes _fi  { from{opacity:0}                            to{opacity:1} }
  @keyframes _su  { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
  @keyframes _sir { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes _sp  { to{transform:rotate(360deg)} }
  @keyframes _pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .as-fi   { animation:_fi   .2s  ease-out; }
  .as-su   { animation:_su   .25s ease-out both; }
  .as-sir  { animation:_sir  .3s  cubic-bezier(.4,0,.2,1); }
  .as-sp   { animation:_sp   .85s linear infinite; }
  .as-pulse{ animation:_pulse 2s  ease-in-out infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("__as_styles__")) {
  const el = Object.assign(document.createElement("style"), { id: "__as_styles__", textContent: _S });
  document.head.appendChild(el);
}

/* ─────────────────────────────────── helpers ─── */
function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("default", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso) {
  if (!iso) return "Never";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function isValidIP(ip) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = parseInt(p, 10);
    return String(n) === p && n >= 0 && n <= 255;
  });
}

/* ─────────────────────────────────── mock data ─── */
// const MOCK_DEVICES = [
//   { id:1, device_ip:"192.168.1.101", last_synced_at:"2026-03-16T08:02:00Z", sync_interval_minutes:5,  is_enabled:true,  created_at:"2025-01-10T09:00:00Z", updated_at:"2026-03-16T08:02:00Z" },
//   { id:2, device_ip:"192.168.1.102", last_synced_at:"2026-03-16T07:45:00Z", sync_interval_minutes:10, is_enabled:true,  created_at:"2025-01-12T09:00:00Z", updated_at:"2026-03-16T07:45:00Z" },
//   { id:3, device_ip:"192.168.1.103", last_synced_at:"2026-03-15T22:10:00Z", sync_interval_minutes:15, is_enabled:false, created_at:"2025-02-01T09:00:00Z", updated_at:"2026-03-15T22:10:00Z" },
//   { id:4, device_ip:"10.0.0.50",     last_synced_at:"2026-03-16T07:55:00Z", sync_interval_minutes:10, is_enabled:true,  created_at:"2025-03-01T09:00:00Z", updated_at:"2026-03-16T07:55:00Z" },
//   { id:5, device_ip:"10.0.0.51",     last_synced_at:null,                   sync_interval_minutes:30, is_enabled:false, created_at:"2026-03-10T09:00:00Z", updated_at:"2026-03-10T09:00:00Z" },
// ];

/* ─────────────────────────────────── shared UI ─── */
function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl shadow-sm ${className}`}>{children}</div>;
}

function Widget({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function Toggle({ on, onChange, disabled = false }) {
  return (
    <button type="button" disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed
        ${on ? "bg-emerald-500" : "bg-gray-300"}`}>
      <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const cfg = {
    success: { bg: "bg-emerald-600", I: CheckCircle2 },
    error:   { bg: "bg-red-500",     I: XCircle      },
    info:    { bg: "bg-blue-600",    I: Info         },
  }[toast.type] || { bg: "bg-gray-800", I: Info };
  const { bg, I } = cfg;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-500 flex items-center gap-3 px-5 py-3 rounded-2xl text-white shadow-2xl text-sm font-medium pointer-events-none as-fi ${bg}`}>
      <I size={16} /> {toast.msg}
    </div>
  );
}

function ErrBanner({ msg, onRetry }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <XCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-red-700">Failed to load</p>
        <p className="text-xs text-red-400 mt-0.5 wrap-break-word">{msg}</p>
      </div>
      {onRetry && <button onClick={onRetry} className="text-xs font-semibold text-red-600 hover:underline shrink-0">Retry</button>}
    </div>
  );
}

/* ─────────────────────────────────── Status badge ─── */
function StatusBadge({ enabled, lastSynced }) {
  if (!enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Disabled
      </span>
    );
  }
  const minutesAgo = lastSynced ? (Date.now() - new Date(lastSynced).getTime()) / 60000 : Infinity;
  if (minutesAgo < 30) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 as-pulse" /> Online
      </span>
    );
  }
  if (minutesAgo < 120) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Idle
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Offline
    </span>
  );
}

/* ─────────────────────────────────── Detail Sidebar ─── */
function DeviceSidebar({ device, onClose, onEdit, onDelete, onToggle, toggling }) {
  if (!device) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm as-fi" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 z-[51] w-full sm:w-[420px] bg-white shadow-2xl flex flex-col as-sir">

        {/* Header */}
        <div className="flex items-start gap-4 px-6 py-5 border-b border-gray-100">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${device.is_enabled ? "bg-emerald-50 border border-emerald-200" : "bg-gray-100 border border-gray-200"}`}>
            {device.is_enabled ? <Wifi size={22} className="text-emerald-600" /> : <WifiOff size={22} className="text-gray-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 font-mono">{device.device_ip}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Device ID #{device.id}</p>
            <div className="mt-1.5">
              <StatusBadge enabled={device.is_enabled} lastSynced={device.last_synced_at} />
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Device ID",     value: `#${device.id}` },
              { label: "Interval",      value: `${device.sync_interval_minutes}m` },
              { label: "Status",        value: device.is_enabled ? "Active" : "Disabled" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest font-semibold text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Details */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2.5">Device Details</p>
            <div className="space-y-2">
              {[
                { icon: Server,   label: "IP Address",       value: device.device_ip,            mono: true  },
                { icon: Timer,    label: "Sync Interval",    value: `Every ${device.sync_interval_minutes} minutes` },
                { icon: RefreshCw,label: "Last Synced",      value: fmtDateTime(device.last_synced_at) || "Never synced" },
                { icon: Calendar, label: "Created",          value: fmtDateTime(device.created_at) },
                { icon: Clock,    label: "Last Updated",     value: fmtDateTime(device.updated_at) },
              ].map(({ icon: Icon, label, value, mono }) => (
                <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">{label}</p>
                    <p className={`text-sm font-medium text-gray-800 truncate ${mono ? "font-mono" : ""}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enable / Disable toggle */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2.5">Device Control</p>
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border transition
              ${device.is_enabled ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-3">
                {device.is_enabled ? <Wifi size={16} className="text-emerald-600" /> : <WifiOff size={16} className="text-gray-400" />}
                <div>
                  <p className="text-sm font-medium text-gray-800">Sync {device.is_enabled ? "Enabled" : "Disabled"}</p>
                  <p className="text-xs text-gray-400">{device.is_enabled ? "Device is actively syncing attendance" : "Device is paused and not syncing"}</p>
                </div>
              </div>
              {toggling
                ? <Loader2 size={16} className="as-sp text-gray-400" />
                : <Toggle on={device.is_enabled} onChange={() => onToggle(device)} />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={() => { onEdit(device); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
            <Edit3 size={13} /> Edit
          </button>
          <button onClick={() => { onDelete(device); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition">
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm rounded-xl transition">
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────────────── Create / Edit Modal ─── */
const EMPTY_FORM = { device_ip: "", sync_interval_minutes: 10, is_enabled: true };

const INTERVAL_PRESETS = [
  { label: "1 min",   value: 1   },
  { label: "5 min",   value: 5   },
  { label: "10 min",  value: 10  },
  { label: "15 min",  value: 15  },
  { label: "30 min",  value: 30  },
  { label: "1 hour",  value: 60  },
];

function DeviceFormModal({ device, onClose, onSaved, showToast }) {
  const isEdit = !!device;
  const [form,   setForm]   = useState(
    isEdit
      ? { device_ip: device.device_ip, sync_interval_minutes: device.sync_interval_minutes, is_enabled: device.is_enabled }
      : { ...EMPTY_FORM }
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.device_ip.trim())          e.device_ip = "Device IP is required.";
    else if (!isValidIP(form.device_ip)) e.device_ip = "Enter a valid IPv4 address (e.g. 192.168.1.100).";
    if (!form.sync_interval_minutes || form.sync_interval_minutes < 1 || form.sync_interval_minutes > 1440)
      e.sync_interval_minutes = "Interval must be between 1 and 1440 minutes.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      device_ip:             form.device_ip.trim(),
      sync_interval_minutes: Number(form.sync_interval_minutes),
      is_enabled:            form.is_enabled,
    };
    try {
      const url    = isEdit ? API.UpdateAttendanceSync(device.id) : API.CreateAttendanceSync;
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
      showToast(isEdit ? "Device updated." : "Device added.", "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Something went wrong.", "error");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm as-fi px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            {isEdit ? <Edit3 size={15} className="text-blue-600" /> : <PlusCircle size={15} className="text-blue-600" />}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{isEdit ? "Edit Device" : "Add Sync Device"}</p>
            <p className="text-[11px] text-gray-400">{isEdit ? `Editing: ${device.device_ip}` : "Register a new attendance sync device"}</p>
          </div>
          <button onClick={onClose} disabled={saving}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-40">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Device IP */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">
              Device IP Address *
            </label>
            <div className="relative">
              <Server size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input value={form.device_ip} onChange={e => set("device_ip", e.target.value)}
                placeholder="e.g. 192.168.1.101"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm bg-gray-50 outline-none focus:border-blue-400 transition font-mono placeholder-gray-300
                  ${errors.device_ip ? "border-red-300" : "border-gray-200"}`} />
            </div>
            {errors.device_ip && <p className="text-xs text-red-500 mt-1">{errors.device_ip}</p>}
            {form.device_ip && !errors.device_ip && isValidIP(form.device_ip) && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Valid IPv4 address</p>
            )}
          </div>

          {/* Sync Interval */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">
              Sync Interval *
            </label>
            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-2">
              {INTERVAL_PRESETS.map(p => (
                <button key={p.value} type="button" onClick={() => set("sync_interval_minutes", p.value)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition
                    ${form.sync_interval_minutes === p.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
                  {p.label}
                </button>
              ))}
            </div>
            {/* Custom input */}
            <div className="relative">
              <Timer size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="number" min={1} max={1440}
                value={form.sync_interval_minutes}
                onChange={e => set("sync_interval_minutes", Number(e.target.value))}
                className={`w-full pl-9 pr-16 py-2.5 border rounded-xl text-sm bg-gray-50 outline-none focus:border-blue-400 transition
                  ${errors.sync_interval_minutes ? "border-red-300" : "border-gray-200"}`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">minutes</span>
            </div>
            {errors.sync_interval_minutes && <p className="text-xs text-red-500 mt-1">{errors.sync_interval_minutes}</p>}
            {form.sync_interval_minutes >= 1 && (
              <p className="text-xs text-gray-400 mt-1">
                Device will sync every <span className="font-semibold text-gray-600">
                  {form.sync_interval_minutes < 60
                    ? `${form.sync_interval_minutes} minute${form.sync_interval_minutes > 1 ? "s" : ""}`
                    : `${form.sync_interval_minutes / 60} hour${form.sync_interval_minutes / 60 > 1 ? "s" : ""}`}
                </span>
              </p>
            )}
          </div>

          {/* Enable toggle */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">
              Sync Status
            </label>
            <div
              className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border cursor-pointer transition
                ${form.is_enabled ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
              onClick={() => set("is_enabled", !form.is_enabled)}>
              <div className="flex items-center gap-3">
                {form.is_enabled ? <Wifi size={16} className="text-emerald-600" /> : <WifiOff size={16} className="text-gray-400" />}
                <div>
                  <p className="text-sm font-medium text-gray-800">{form.is_enabled ? "Sync Enabled" : "Sync Disabled"}</p>
                  <p className="text-xs text-gray-400">{form.is_enabled ? "Device will actively sync attendance data" : "Device is paused — no syncing"}</p>
                </div>
              </div>
              <Toggle on={form.is_enabled} onChange={v => set("is_enabled", v)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {saving
              ? <><Loader2 size={14} className="as-sp" />{isEdit ? "Saving…" : "Adding…"}</>
              : <><Send size={14} />{isEdit ? "Save Changes" : "Add Device"}</>}
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

/* ─────────────────────────────────── Delete Confirm ─── */
function DeleteConfirm({ device, deleting, onConfirm, onCancel }) {
  if (!device) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm as-fi px-4">
      <div className="bg-white rounded-2xl p-6 w-[380px] max-w-full shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Remove Device?</h2>
        <p className="text-sm text-gray-500 text-center mb-1">You are about to remove sync device:</p>
        <p className="text-sm font-bold text-gray-800 text-center font-mono mb-4">{device.device_ip}</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start gap-2 mb-5">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">Removing this device will stop attendance syncing from its IP. This cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {deleting ? <><Loader2 size={14} className="as-sp" />Removing…</> : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════ */
const PAGE_SIZE = 10;

export default function AttendanceSyncPage() {
  const [devices,  setDevices]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(null);

  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page,         setPage]         = useState(1);

  const [viewDevice,   setViewDevice]   = useState(null);
  const [editDevice,   setEditDevice]   = useState(null);
  const [showCreate,   setShowCreate]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toggling,     setToggling]     = useState(null); // device id being toggled

  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* ── fetch all ── */
  const fetchDevices = useCallback(async () => {
    setLoading(true); setFetchErr(null);
    try {
      const res = await fetch(API.ListAttendnaceSync);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : data.devices || []);
    } catch (err) {
        setFetchErr(err.message || "Failed to load devices.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  /* ── CRUD ── */
  const handleSaved = (saved, isEdit) =>
    setDevices(prev => isEdit ? prev.map(d => d.id === saved.id ? saved : d) : [saved, ...prev]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(API.DeleteAttendnaceSync(deleteTarget.id), { method: "DELETE" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setDevices(prev => prev.filter(d => d.id !== deleteTarget.id));
      showToast("Device removed.", "success");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || "Failed to remove device.", "error");
    } finally { setDeleting(false); }
  };

  /* ── Toggle is_enabled ── */
  const handleToggle = async (device) => {
    setToggling(device.id);
    // Optimistic update
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, is_enabled: !d.is_enabled } : d));
    // Also update the open sidebar device
    setViewDevice(prev => prev?.id === device.id ? { ...prev, is_enabled: !prev.is_enabled } : prev);
    try {
      const res = await fetch(API.UpdateAttendanceSync(device.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: !device.is_enabled }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const updated = await res.json();
      setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
      showToast(updated.is_enabled ? "Device enabled." : "Device disabled.", "success");
    } catch (err) {
      // Revert on fail
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, is_enabled: device.is_enabled } : d));
      setViewDevice(prev => prev?.id === device.id ? { ...prev, is_enabled: device.is_enabled } : prev);
      showToast(err.message || "Toggle failed.", "error");
    } finally { setToggling(null); }
  };

  /* ── Stats ── */
  const stats = useMemo(() => {
    const enabled  = devices.filter(d => d.is_enabled);
    const online   = enabled.filter(d => d.last_synced_at && (Date.now() - new Date(d.last_synced_at).getTime()) < 30 * 60 * 1000);
    const offline  = devices.filter(d => !d.is_enabled);
    return { total: devices.length, enabled: enabled.length, online: online.length, offline: offline.length };
  }, [devices]);

  /* ── Filter ── */
  const devStatus = (d) => {
    if (!d.is_enabled) return "Disabled";
    const mins = d.last_synced_at ? (Date.now() - new Date(d.last_synced_at).getTime()) / 60000 : Infinity;
    if (mins < 30)  return "Online";
    if (mins < 120) return "Idle";
    return "Offline";
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return devices.filter(d =>
      (!q || d.device_ip.includes(q) || String(d.id).includes(q)) &&
      (filterStatus === "All" || devStatus(d) === filterStatus)
    );
  }, [devices, search, filterStatus]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sf = fn => { fn(); setPage(1); };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <Radio size={20} className="text-blue-500" />
            <h1 className="text-3xl font-semibold">Attendance Sync</h1>
          </div>
          <p className="text-sm text-gray-500">Manage biometric device sync configurations</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="self-start flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
          <PlusCircle size={16} /> Add Device
        </button>
      </header>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Widget icon={Server}   label="Total Devices"   value={loading ? "…" : stats.total}   sub="Registered"       color="border-blue-200 bg-blue-50 text-blue-700"      />
        <Widget icon={Wifi}     label="Online"          value={loading ? "…" : stats.online}  sub="Synced < 30 min"  color="border-emerald-200 bg-emerald-50 text-emerald-700" />
        <Widget icon={Activity} label="Enabled"         value={loading ? "…" : stats.enabled} sub="Active configs"   color="border-violet-200 bg-violet-50 text-violet-700" />
        <Widget icon={WifiOff}  label="Disabled"        value={loading ? "…" : stats.offline} sub="Paused"           color="border-gray-200 bg-gray-100 text-gray-600"     />
      </div>

      {/* Error */}
      {fetchErr && <div className="mb-4"><ErrBanner msg={fetchErr} onRetry={fetchDevices} /></div>}

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => sf(() => setSearch(e.target.value))}
            placeholder="Search by IP address…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-300 font-mono" />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5">
          {["All", "Online", "Idle", "Offline", "Disabled"].map(f => (
            <button key={f} onClick={() => sf(() => setFilterStatus(f))}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition whitespace-nowrap
                ${filterStatus === f
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
              {f}
            </button>
          ))}
        </div>

        <button onClick={fetchDevices} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition disabled:opacity-50">
          {loading ? <Loader2 size={14} className="as-sp" /> : <RefreshCw size={14} />}
          Refresh
        </button>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} device{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  ["#",            "w-12  text-center"  ],
                  ["Device IP",    "text-left"          ],
                  ["Status",       "text-center"        ],
                  ["Last Synced",  "text-center"        ],
                  ["Interval",     "text-center"        ],
                  ["Enabled",      "text-center"        ],
                  ["Created",      "text-center hidden sm:table-cell"],
                  ["Actions",      "text-center"        ],
                ].map(([h, cls]) => (
                  <th key={h} className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Loader2 size={26} className="mx-auto as-sp text-blue-400 mb-3" />
                  <p className="text-sm text-gray-400">Loading devices…</p>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Server size={30} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400 mb-3">{search || filterStatus !== "All" ? "No devices match your filters." : "No sync devices configured yet."}</p>
                  {!search && filterStatus === "All" && (
                    <button onClick={() => setShowCreate(true)} className="text-sm text-blue-600 font-medium hover:underline">+ Add first device</button>
                  )}
                </td></tr>
              ) : paginated.map((d, i) => {
                const isToggling = toggling === d.id;
                return (
                  <tr key={d.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/20 transition border-b border-gray-50 last:border-b-0`}>

                    {/* ID */}
                    <td className="py-3 px-4 text-center text-xs text-gray-400 tabular-nums font-medium">#{d.id}</td>

                    {/* IP */}
                    <td className="py-3 px-4 cursor-pointer" onClick={() => setViewDevice(d)}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${d.is_enabled ? "bg-emerald-50 border border-emerald-200" : "bg-gray-100 border border-gray-200"}`}>
                          {d.is_enabled ? <Wifi size={14} className="text-emerald-600" /> : <WifiOff size={14} className="text-gray-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-blue-600 hover:underline font-mono">{d.device_ip}</p>
                          <p className="text-xs text-gray-400">ID #{d.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <StatusBadge enabled={d.is_enabled} lastSynced={d.last_synced_at} />
                    </td>

                    {/* Last synced */}
                    <td className="py-3 px-4 text-center">
                      <p className="text-xs font-medium text-gray-700">{timeAgo(d.last_synced_at)}</p>
                      {d.last_synced_at && <p className="text-[10px] text-gray-400">{new Date(d.last_synced_at).toLocaleDateString()}</p>}
                    </td>

                    {/* Interval */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        <Timer size={10} /> {d.sync_interval_minutes}m
                      </span>
                    </td>

                    {/* Toggle */}
                    <td className="py-3 px-4 text-center">
                      {isToggling
                        ? <Loader2 size={16} className="as-sp text-gray-400 mx-auto" />
                        : <Toggle on={d.is_enabled} onChange={() => handleToggle(d)} />
                      }
                    </td>

                    {/* Created */}
                    <td className="py-3 px-4 text-center text-xs text-gray-400 tabular-nums whitespace-nowrap hidden sm:table-cell">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewDevice(d)} title="View"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => setEditDevice(d)} title="Edit"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 transition">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(d)} title="Remove"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 text-sm">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs text-gray-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Overlays */}
      {showCreate && (
        <DeviceFormModal onClose={() => setShowCreate(false)} onSaved={handleSaved} showToast={showToast} />
      )}
      {editDevice && (
        <DeviceFormModal device={editDevice} onClose={() => setEditDevice(null)} onSaved={handleSaved} showToast={showToast} />
      )}
      {viewDevice && (
        <DeviceSidebar
          device={viewDevice}
          onClose={() => setViewDevice(null)}
          onEdit={d => { setViewDevice(null); setEditDevice(d); }}
          onDelete={d => { setViewDevice(null); setDeleteTarget(d); }}
          onToggle={handleToggle}
          toggling={toggling === viewDevice.id}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm device={deleteTarget} deleting={deleting}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      <Toast toast={toast} />
    </div>
  );
}