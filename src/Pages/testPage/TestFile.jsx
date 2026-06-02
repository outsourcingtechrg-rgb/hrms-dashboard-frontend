import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  Users,
  Calendar,
  CalendarClock,
  Layers,
  ToggleLeft,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─────────────────────────────────────────────────────────────────────
   API ENDPOINTS  —  wire these up in your Apis.js:
   
   GetAllEmployees    GET  /api/employees             → Employee[]
   ListShifts         GET  /api/shifts                → Shift[]
   ListAssignments    GET  /api/shift-assignments/    → { total, results[] }
   CreateAssignment   POST /api/shift-assignments/
   UpdateAssignment   PATCH /api/shift-assignments/:id
   EndAssignment      PATCH /api/shift-assignments/:id/end   body: { effective_to }

   DeleteAssignment   DELETE /api/shift-assignments/:id

   Expected Employee shape from backend:
   { id, first_name, last_name, department?, base_shift?: { id, name, start_time, end_time } }

   Expected Shift shape:
   { id, name, start_time, end_time, color? }

   Expected Assignment shape (EmployeeShiftAssignmentRead):
   { id, employee_id, shift_id, effective_from, effective_to|null,
     extra_data|null, created_at, updated_at,
     employee?: { id, first_name, last_name, department? },
     shift?:    { id, name, start_time, end_time } }
───────────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════════ */
const T = {
  bg: "#f8fafc",
  surface: "#ffffff",
  card: "#f8fafc",
  border: "#e5e7eb",
  borderSub: "#d1d5db",
  text: "#0f172a",
  textMuted: "#475569",
  textSub: "#64748b",
  accent: "#3b82f6",
  accentSub: "#2563eb",
  success: "#16a34a",
  warn: "#f59e0b",
  danger: "#ef4444",
  mono: "'Space Mono', monospace",
  sans: "'DM Sans', 'Segoe UI', sans-serif",
};

const DEPT_COLORS = {
  Engineering: "#6366f1",
  HR: "#ec4899",
  Finance: "#f59e0b",
  Operations: "#10b981",
  IT: "#3b82f6",
  Marketing: "#f97316",
  Admin: "#8b5cf6",
};

/* ── Shift colors (fallback palette when backend doesn't send color) ── */
const SHIFT_COLORS = [
  "#f59e0b",
  "#6366f1",
  "#1e40af",
  "#10b981",
  "#ec4899",
  "#f97316",
  "#8b5cf6",
];
const shiftColor = (shift, idx) =>
  shift?.color || SHIFT_COLORS[idx % SHIFT_COLORS.length];

const _CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:#d1d5db;}
  ::-webkit-scrollbar-thumb{background:#9ca3af;border-radius:99px;}
  @keyframes _fi  {from{opacity:0}to{opacity:1}}
  @keyframes _su  {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes _sir {from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes _sp  {to{transform:rotate(360deg)}}
  @keyframes _pulse{0%,100%{opacity:1}50%{opacity:.35}}
  .as-fi  {animation:_fi   .2s  ease-out both;}
  .as-su  {animation:_su   .25s ease-out both;}
  .as-sir {animation:_sir  .3s  cubic-bezier(.4,0,.2,1);}
  .as-sp  {animation:_sp   .85s linear infinite;}
  .as-pulse{animation:_pulse 2s ease-in-out infinite;}
  .emp-row{transition:background .15s;}
  .emp-row:hover{background:#f1f5f9!important;}
  .icon-btn{transition:border-color .15s,color .15s,background .15s;}
  select option{background:#fff;color:#0f172a;}
`;
if (typeof document !== "undefined" && !document.getElementById("__sa_lgt__")) {
  const el = Object.assign(document.createElement("style"), {
    id: "__sa_lgt__",
    textContent: _CSS,
  });
  document.head.appendChild(el);
}

/* ═══════════════════════════════════════════════════════════════════════
   DATA NORMALISATION
   Backend sends first_name + last_name; we merge to `name` once on load.
   base_shift may come from the Employee model or need a separate lookup.
═══════════════════════════════════════════════════════════════════════ */

/**
 * Normalise a raw employee record from the backend into the shape
 * the UI expects: { id, name, avatar, department, base_shift }
 *
 * `shiftsMap` is a Map<id, shift> built from the shifts endpoint,
 * used to fill base_shift if the employee record doesn't include it.
 */
function normaliseEmployee(raw, shiftsMap = new Map()) {
  const name =
    [raw.first_name, raw.last_name].filter(Boolean).join(" ") ||
    `Employee #${raw.id}`;
  const initials =
    [raw.f_name?.[0], raw.l_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "??";

  // base_shift can arrive nested on the employee, or we look it up by shift_id / base_shift_id
  let base_shift =
    raw.base_shift ||
    (raw.base_shift_id ? shiftsMap.get(raw.base_shift_id) : null) ||
    (raw.shift_id ? shiftsMap.get(raw.shift_id) : null) ||
    null;

  // Handle department: can be string or object { id, department }
  const dept = raw.department
    ? typeof raw.department === "string"
      ? raw.department
      : raw.department.department || raw.department.name || "—"
    : "—";

  return {
    ...raw,
    name,
    avatar: initials,
    department: dept,
    base_shift,
  };
}

/**
 * Normalise a raw assignment from the backend.
 * The `shift` nested object may or may not be present;
 * fall back to the shiftsMap if not.
 */
function normaliseAssignment(raw, shiftsMap = new Map()) {
  return {
    ...raw,
    // effective_from / effective_to arrive as "YYYY-MM-DD" strings — keep as-is
    shift: raw.shift || shiftsMap.get(raw.shift_id) || null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */
const today = () => new Date().toISOString().split("T")[0];

const fmtDate = (d) => {
  if (!d) return "Open";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtTime12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12 || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const getActiveAssignment = (empId, assignments) => {
  const now = today();
  return (
    assignments
      .filter(
        (a) =>
          a.employee_id === empId &&
          a.effective_from <= now &&
          (!a.effective_to || a.effective_to >= now),
      )
      .sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0] ||
    null
  );
};

const getEmpAssignments = (empId, assignments) =>
  [...assignments.filter((a) => a.employee_id === empId)].sort((a, b) =>
    b.effective_from.localeCompare(a.effective_from),
  );

/* ── Generic fetch with error extraction ── */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail || JSON.stringify(body);
    } catch {
      detail = (await res.text()) || detail;
    }
    throw new Error(detail);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/* ═══════════════════════════════════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════════════════════════════════ */
function ShiftPill({ shift, size = "sm" }) {
  if (!shift) return null;
  const c = shift.color || T.textMuted;
  const pad = size === "xs" ? "2px 8px" : "3px 11px";
  const fs = size === "xs" ? 10 : 12;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: pad,
        borderRadius: 99,
        fontSize: fs,
        fontWeight: 600,
        background: c + "22",
        color: c,
        border: `1px solid ${c}44`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c,
          flexShrink: 0,
        }}
      />
      {shift.name}
    </span>
  );
}

function EmpAvatar({ initials, department }) {
  const bg = DEPT_COLORS[department] || T.textMuted;
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: bg + "20",
        border: `2px solid ${bg}35`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 12,
        color: bg,
        flexShrink: 0,
        fontFamily: T.mono,
      }}
    >
      {initials}
    </div>
  );
}

function DeptBadge({ dept }) {
  const c = DEPT_COLORS[dept] || T.textMuted;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 5,
        background: c + "18",
        color: c,
        border: `1px solid ${c}30`,
      }}
    >
      {dept}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: color + "18",
          border: `1px solid ${color}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <div>
        <p
          style={{
            fontSize: 11,
            color: T.textMuted,
            fontWeight: 600,
            marginBottom: 2,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: T.text,
            fontFamily: T.mono,
            lineHeight: 1,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const map = {
    success: { bg: "#16a34a", I: CheckCircle2 },
    error: { bg: T.danger, I: XCircle },
    info: { bg: T.accent, I: ToggleLeft },
  };
  const { bg, I } = map[toast.type] || map.info;
  return (
    <div
      className="as-fi"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 20px",
        borderRadius: 14,
        background: bg,
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 8px 32px rgba(0,0,0,.3)",
        pointerEvents: "none",
        fontFamily: T.sans,
        whiteSpace: "nowrap",
      }}
    >
      <I size={15} /> {toast.msg}
    </div>
  );
}

function ErrBanner({ msg, onRetry }) {
  if (!msg) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: T.danger + "0f",
        border: `1px solid ${T.danger}35`,
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 16,
      }}
    >
      <XCircle
        size={15}
        color={T.danger}
        style={{ marginTop: 1, flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: T.danger,
            marginBottom: 2,
          }}
        >
          Failed to load
        </p>
        <p style={{ fontSize: 12, color: T.danger }}>{msg}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: T.danger,
            background: "none",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

function Overlay({ onClick }) {
  return (
    <div
      className="as-fi"
      onClick={onClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        backdropFilter: "blur(3px)",
        zIndex: 50,
      }}
    />
  );
}

function AssignBadge({ assignment }) {
  if (!assignment)
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "2px 10px",
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 700,
          background: T.borderSub,
          color: T.textMuted,
          border: `1px solid ${T.borderSub}`,
        }}
      >
        Base Shift
      </span>
    );
  const isOpen = !assignment.effective_to;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        background: isOpen ? "#dcfce7" : "#dbeafe",
        color: isOpen ? T.success : T.accent,
        border: `1px solid ${isOpen ? "#86efac" : "#93c5fd"}`,
      }}
    >
      <span
        className={isOpen ? "as-pulse" : ""}
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: isOpen ? T.success : T.accentSub,
        }}
      />
      {isOpen ? "Open-Ended" : "Fixed Duration"}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   EMPLOYEE DETAIL SIDEBAR
═══════════════════════════════════════════════════════════════════════ */
function EmployeeSidebar({
  employee,
  assignments,
  shifts,
  onClose,
  onAssign,
  onEditAssign,
  onDeleteAssignment,
  onEndAssignment,
}) {
  if (!employee) return null;
  const active = getActiveAssignment(employee.id, assignments);
  const history = getEmpAssignments(employee.id, assignments);
  const now = today();

  return (
    <>
      <Overlay onClick={onClose} />
      <aside
        className="as-sir"
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 51,
          width: "100%",
          maxWidth: 440,
          background: T.surface,
          borderLeft: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          fontFamily: T.sans,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "20px 24px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <EmpAvatar
            initials={employee.avatar}
            department={employee.department}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: T.text,
                marginBottom: 3,
              }}
            >
              {employee.name}
            </p>
            <DeptBadge dept={employee.department} />
            <div style={{ marginTop: 6 }}>
              <AssignBadge assignment={active} />
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: "none",
              color: T.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Current shift */}
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 10,
              }}
            >
              Current Shift
            </p>
            {active ? (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.success}33`,
                  borderRadius: 12,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <ShiftPill shift={active.shift} />
                  <span
                    style={{
                      fontSize: 12,
                      color: T.textMuted,
                      fontFamily: T.mono,
                    }}
                  >
                    {fmtTime12(active.shift?.start_time)} –{" "}
                    {fmtTime12(active.shift?.end_time)}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      label: "From",
                      val: fmtDate(active.effective_from),
                      hi: false,
                    },
                    {
                      label: "To",
                      val: fmtDate(active.effective_to),
                      hi: !active.effective_to,
                    },
                  ].map(({ label, val, hi }) => (
                    <div
                      key={label}
                      style={{
                        background: T.surface,
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10,
                          color: T.textMuted,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: hi ? T.success : T.textSub,
                          fontFamily: T.mono,
                        }}
                      >
                        {val}
                      </p>
                    </div>
                  ))}
                </div>
                {employee.base_shift && (
                  <p style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}>
                    Base:{" "}
                    <span style={{ color: T.textSub }}>
                      {employee.base_shift.name} ·{" "}
                      {fmtTime12(employee.base_shift.start_time)} –{" "}
                      {fmtTime12(employee.base_shift.end_time)}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                }}
              >
                {employee.base_shift ? (
                  <>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <ShiftPill shift={employee.base_shift} />
                      <span
                        style={{
                          fontSize: 12,
                          color: T.textMuted,
                          fontFamily: T.mono,
                        }}
                      >
                        {fmtTime12(employee.base_shift.start_time)} –{" "}
                        {fmtTime12(employee.base_shift.end_time)}
                      </span>
                    </div>
                    <p
                      style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}
                    >
                      No override — using base shift.
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: T.textMuted }}>
                    No base shift configured.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Assignment history */}
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.textMuted,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 10,
              }}
            >
              Assignment History ({history.length})
            </p>
            {history.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: T.textMuted,
                  fontSize: 13,
                }}
              >
                No assignments yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {history.map((a) => {
                  const isActive =
                    a.effective_from <= now &&
                    (!a.effective_to || a.effective_to >= now);
                  const isPast = a.effective_to && a.effective_to < now;
                  const s =
                    shifts.find((sh) => sh.id === a.shift_id) || a.shift;
                  return (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: isActive ? T.success + "18" : T.card,
                        border: `1px solid ${isActive ? T.success + "55" : T.border}`,
                      }}
                    >
                      <ShiftPill shift={s} size="xs" />
                      <div
                        style={{ flex: 1, fontSize: 11, color: T.textMuted }}
                      >
                        <span style={{ color: T.textSub, fontFamily: T.mono }}>
                          {fmtDate(a.effective_from)}
                        </span>
                        <span style={{ margin: "0 5px" }}>→</span>
                        <span
                          style={{
                            color: !a.effective_to ? T.success : T.textSub,
                            fontFamily: T.mono,
                          }}
                        >
                          {fmtDate(a.effective_to)}
                        </span>
                      </div>
                      {isActive && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: 99,
                            background: T.success + "22",
                            color: T.success,
                            border: `1px solid ${T.success}44`,
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                      {isPast && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 99,
                            background: T.borderSub,
                            color: T.textMuted,
                          }}
                        >
                          ENDED
                        </span>
                      )}
                      <div style={{ display: "flex", gap: 4 }}>
                        {isActive && !a.effective_to && (
                          <button
                            onClick={() => onEndAssignment(a)}
                            style={{
                              padding: "3px 8px",
                              borderRadius: 6,
                              border: `1px solid ${T.warn}44`,
                              background: T.warn + "11",
                              color: T.warn,
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            End
                          </button>
                        )}
                        <button
                          onClick={() =>
                            onEditAssign({ employee, assignment: a })
                          }
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: `1px solid ${T.accent}33`,
                            background: T.accent + "11",
                            color: T.accentSub,
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteAssignment(a.id)}
                          style={{
                            padding: "3px 7px",
                            borderRadius: 6,
                            border: `1px solid ${T.danger}33`,
                            background: T.danger + "11",
                            color: T.danger,
                            fontSize: 10,
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={() => {
              onAssign(employee);
              onClose();
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg,${T.accent},${T.accentSub})`,
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <PlusCircle size={14} /> Assign Shift
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: "none",
              color: T.textMuted,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ASSIGN / EDIT MODAL
═══════════════════════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  shift_id: "",
  effective_from: today(),
  effective_to: "",
  open_ended: true,
};

function AssignModal({
  employee,
  assignment,
  shifts,
  onClose,
  onSaved,
  showToast,
}) {
  const isEdit = !!assignment;
  const [form, setForm] = useState(
    isEdit
      ? {
          shift_id: String(assignment.shift_id),
          effective_from: assignment.effective_from,
          effective_to: assignment.effective_to || "",
          open_ended: !assignment.effective_to,
        }
      : { ...EMPTY_FORM },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    
    // Validate shift selection
    if (!form.shift_id) {
      e.shift_id = "Please select a shift.";
    } else if (parseInt(form.shift_id) <= 0) {
      e.shift_id = "Invalid shift selected.";
    }
    
    // Validate employee
    if (!employee?.id || employee.id <= 0) {
      e.employee = "Invalid employee.";
    }
    
    // Validate dates
    if (!form.effective_from) {
      e.effective_from = "Start date is required.";
    }
    
    if (!form.open_ended && !form.effective_to) {
      e.effective_to = "End date is required when fixed duration is selected.";
    }
    
    if (
      form.effective_from &&
      form.effective_to &&
      form.effective_to < form.effective_from
    ) {
      e.effective_to = "End date must be on or after start date.";
    }
    
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);

    // Build payload matching EmployeeShiftAssignmentCreate / Update schema
    const payload = {
      employee_id: employee.id,
      shift_id: parseInt(form.shift_id),
      effective_from: form.effective_from,
      effective_to: form.open_ended ? null : form.effective_to || null,
    };

    try {
      const url = isEdit
        ? API.UpdateAssignment(assignment.id)
        : API.CreateAssignment;
      const method = isEdit ? "PATCH" : "POST";
      // POST → EmployeeShiftAssignmentCreate (requires employee_id)
      // PATCH → EmployeeShiftAssignmentUpdate (all fields optional, no employee_id needed)
      const body = isEdit
        ? {
            shift_id: payload.shift_id,
            effective_from: payload.effective_from,
            effective_to: payload.effective_to,
          }
        : payload;

      const saved = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      onSaved(saved, isEdit);
      showToast(isEdit ? "Assignment updated." : "Shift assigned.", "success");
      onClose();
    } catch (err) {
      let errorMsg = err.message || "Something went wrong.";
      
      // Parse Pydantic validation errors from FastAPI
      if (err.message?.includes("Validation error") || err.message?.includes("not found")) {
        try {
          const msg = err.message.toLowerCase();
          if (msg.includes("employee")) {
            errorMsg = "Employee not found or invalid.";
          } else if (msg.includes("shift")) {
            errorMsg = "Shift not found or invalid.";
          } else if (msg.includes("date") || msg.includes("effective")) {
            errorMsg = "Invalid date range. Check start and end dates.";
          }
        } catch {/* silent */}
      }
      
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputSt = (err) => ({
    width: "100%",
    background: T.card,
    border: `1px solid ${err ? T.danger : T.border}`,
    borderRadius: 10,
    padding: "10px 13px",
    color: T.text,
    fontSize: 14,
    fontFamily: T.sans,
    outline: "none",
  });
  const labelSt = {
    fontSize: 11,
    fontWeight: 700,
    color: T.textMuted,
    display: "block",
    marginBottom: 7,
    textTransform: "uppercase",
    letterSpacing: 1,
  };

  return (
    <div
      className="as-fi"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.5)",
        backdropFilter: "blur(4px)",
        padding: 16,
      }}
    >
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
          fontFamily: T.sans,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 24px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: T.accent + "20",
              border: `1px solid ${T.accent}35`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isEdit ? (
              <Edit3 size={15} color={T.accentSub} />
            ) : (
              <PlusCircle size={15} color={T.accentSub} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
              {isEdit ? "Edit Assignment" : "Assign Shift"}
            </p>
            <p style={{ fontSize: 11, color: T.textMuted }}>
              {employee?.f_name} {employee?.l_name} · {employee?.department}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: "none",
              color: T.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Shift select */}
          <div>
            <label style={labelSt}>Shift *</label>
            <select
              value={form.shift_id}
              onChange={(e) => set("shift_id", e.target.value)}
              style={{ ...inputSt(errors.shift_id), cursor: "pointer" }}
            >
              <option value="">Select a shift…</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {fmtTime12(s.start_time)} – {fmtTime12(s.end_time)}
                </option>
              ))}
            </select>
            {errors.shift_id && (
              <p style={{ fontSize: 11, color: T.danger, marginTop: 5 }}>
                {errors.shift_id}
              </p>
            )}
          </div>

          {/* Effective From */}
          <div>
            <label style={labelSt}>Effective From *</label>
            <input
              type="date"
              value={form.effective_from}
              onChange={(e) => set("effective_from", e.target.value)}
              style={inputSt(errors.effective_from)}
            />
            {errors.effective_from && (
              <p style={{ fontSize: 11, color: T.danger, marginTop: 5 }}>
                {errors.effective_from}
              </p>
            )}
          </div>

          {/* Open-ended toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              background: T.card,
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              cursor: "pointer",
            }}
            onClick={() => set("open_ended", !form.open_ended)}
          >
            <div
              style={{
                width: 38,
                height: 21,
                borderRadius: 99,
                background: form.open_ended ? T.success : T.borderSub,
                position: "relative",
                flexShrink: 0,
                transition: "background .2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: form.open_ended ? 19 : 3,
                  width: 15,
                  height: 15,
                  borderRadius: "50%",
                  background: T.surface,
                  transition: "left .2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                }}
              />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                Open-Ended
              </p>
              <p style={{ fontSize: 11, color: T.textMuted }}>
                No end date — active until manually closed
              </p>
            </div>
          </div>

          {/* Effective To */}
          {!form.open_ended && (
            <div>
              <label style={labelSt}>Effective To</label>
              <input
                type="date"
                value={form.effective_to}
                onChange={(e) => set("effective_to", e.target.value)}
                style={inputSt(errors.effective_to)}
              />
              {errors.effective_to && (
                <p style={{ fontSize: 11, color: T.danger, marginTop: 5 }}>
                  {errors.effective_to}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              background: saving
                ? T.accentSub
                : `linear-gradient(135deg,${T.accent},${T.accentSub})`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="as-sp" />
                {isEdit ? "Saving…" : "Assigning…"}
              </>
            ) : (
              <>
                <Send size={14} />
                {isEdit ? "Save Changes" : "Assign Shift"}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "11px 20px",
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: "none",
              color: T.textMuted,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   END ASSIGNMENT MODAL
   Calls PATCH /shift-assignments/:id/end  →  { effective_to }
   (dedicated endpoint in your api.py that validates the assignment
    isn't already closed before setting effective_to)
═══════════════════════════════════════════════════════════════════════ */
function EndModal({ assignment, onConfirm, onCancel }) {
  const [endDate, setEndDate] = useState(today());
  const [saving, setSaving] = useState(false);
  if (!assignment) return null;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(assignment.id, endDate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="as-fi"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.5)",
        backdropFilter: "blur(4px)",
        padding: 16,
      }}
    >
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 380,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
          fontFamily: T.sans,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: T.warn + "18",
            border: `1px solid ${T.warn}35`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Clock size={20} color={T.warn} />
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: T.text,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          End Assignment
        </h2>
        <p
          style={{
            fontSize: 13,
            color: T.textMuted,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Set the last active date for this shift override.
        </p>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.textMuted,
            display: "block",
            marginBottom: 7,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          End Date
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{
            width: "100%",
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            padding: "10px 13px",
            color: T.text,
            fontSize: 14,
            outline: "none",
            marginBottom: 20,
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: "none",
              color: T.textMuted,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: T.warn,
              color: "#000",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            {saving ? <Loader2 size={13} className="as-sp" /> : null} Confirm
            End
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DELETE CONFIRM
═══════════════════════════════════════════════════════════════════════ */
function DeleteConfirm({ assignmentId, onConfirm, onCancel, deleting }) {
  if (!assignmentId) return null;
  return (
    <div
      className="as-fi"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,.5)",
        backdropFilter: "blur(4px)",
        padding: 16,
      }}
    >
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 360,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
          fontFamily: T.sans,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: T.danger + "18",
            border: `1px solid ${T.danger}35`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Trash2 size={20} color={T.danger} />
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: T.text,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Remove Assignment?
        </h2>
        <p
          style={{
            fontSize: 13,
            color: T.textMuted,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          This will permanently delete the shift assignment record.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            background: T.warn + "22",
            border: `1px solid ${T.warn}35`,
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 20,
          }}
        >
          <AlertTriangle
            size={13}
            color={T.warn}
            style={{ marginTop: 1, flexShrink: 0 }}
          />
          <p style={{ fontSize: 12, color: T.warn }}>
            Deleting this may affect attendance accuracy if the employee's
            records relied on this shift.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: "none",
              color: T.textMuted,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: T.danger,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: deleting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            {deleting ? (
              <>
                <Loader2 size={13} className="as-sp" />
                Removing…
              </>
            ) : (
              "Yes, Remove"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10;

export default function ShiftAssignerPage() {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState(null);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [sidebarEmp, setSidebarEmp] = useState(null);
  const [assignEmp, setAssignEmp] = useState(null);
  const [editAssign, setEditAssign] = useState(null);
  const [endAssign, setEndAssign] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  /* ── fetchAll ──────────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const [rawEmps, rawShifts, rawAssignResp] = await Promise.all([
        apiFetch(API.GetAllEmployees),
        apiFetch(API.ListShifts),
        apiFetch(API.ListAssignments), // returns { total, results }
      ]);

      // Build a shifts lookup map for normalisation
      const shiftsArr = Array.isArray(rawShifts) ? rawShifts : [];
      const shiftsMap = new Map(
        shiftsArr.map((s, i) => [
          s.id,
          { ...s, color: s.color || SHIFT_COLORS[i % SHIFT_COLORS.length] },
        ]),
      );

      // Normalise employees — merge first_name + last_name → name, build avatar initials
      const empsArr = Array.isArray(rawEmps) ? rawEmps : [];
      setEmployees(empsArr.map((e) => normaliseEmployee(e, shiftsMap)));

      // Normalise shifts (add fallback color)
      setShifts([...shiftsMap.values()]);

      // ListAssignments returns { total, results }  (EmployeeShiftAssignmentListResponse)
      const assignArr = Array.isArray(rawAssignResp)
        ? rawAssignResp
        : (rawAssignResp?.results ?? []);
      setAssignments(assignArr.map((a) => normaliseAssignment(a, shiftsMap)));
    } catch (err) {
      setFetchErr(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── CRUD handlers ─────────────────────────────────────────────────── */

  // Called after create or update — server response is EmployeeShiftAssignmentRead
  const handleSaved = useCallback(
    (saved, isEdit) => {
      // Re-attach the shift object from our local map in case the server omits it
      const shiftsMap = new Map(shifts.map((s) => [s.id, s]));
      const normalised = normaliseAssignment(saved, shiftsMap);
      setAssignments((prev) =>
        isEdit
          ? prev.map((a) => (a.id === normalised.id ? normalised : a))
          : [normalised, ...prev],
      );
    },
    [shifts],
  );

  // End → PATCH /shift-assignments/:id/end  body: { effective_to }
  const handleEnd = async (assignmentId, endDate) => {
    try {
      const updated = await apiFetch(API.EndAssignment(assignmentId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ effective_to: endDate }),
      });
      const shiftsMap = new Map(shifts.map((s) => [s.id, s]));
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId ? normaliseAssignment(updated, shiftsMap) : a,
        ),
      );
      showToast("Assignment ended.", "success");
      setEndAssign(null);
    } catch (err) {
      showToast(err.message || "Failed to end assignment.", "error");
    }
  };

  // Delete → DELETE /shift-assignments/:id  (204 No Content)
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(API.DeleteAssignment(deleteId), { method: "DELETE" });
      setAssignments((prev) => prev.filter((a) => a.id !== deleteId));
      showToast("Assignment removed.", "success");
      setDeleteId(null);
    } catch (err) {
      showToast(err.message || "Failed to remove.", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Stats ─────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const now = today();
    const assigned = employees.filter(
      (e) => getActiveAssignment(e.id, assignments) !== null,
    );
    const openEnded = assignments.filter(
      (a) => !a.effective_to && a.effective_from <= now,
    );
    return {
      total: employees.length,
      assigned: assigned.length,
      unassigned: employees.length - assigned.length,
      openEnded: openEnded.length,
    };
  }, [employees, assignments]);

  /* ── Filters ────────────────────────────────────────────────────────── */
  const departments = useMemo(() => {
    const deptSet = new Set(
      employees.map((e) => {
        // Ensure we always get a string, handling both string and object formats
        const d = e.department;
        return typeof d === "string" ? d : d?.department || d?.name || "—";
      }),
    );
    return ["All", ...Array.from(deptSet)];
  }, [employees]);
  const shiftOptions = useMemo(
    () => ["All", ...shifts.map((s) => s.name)],
    [shifts],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      const active = getActiveAssignment(e.id, assignments);
      const currentShift = active ? active.shift : e.base_shift;
      return (
        (!q ||
          e.name.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)) &&
        (deptFilter === "All" || e.department === deptFilter) &&
        (shiftFilter === "All" || currentShift?.name === shiftFilter)
      );
    });
  }, [employees, assignments, search, deptFilter, shiftFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sf = (fn) => {
    fn();
    setPage(1);
  };

  /* ─────────────────────────────────── RENDER ── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: T.sans,
        padding: "36px 28px",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 5,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: `linear-gradient(135deg,${T.accent},${T.accentSub})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CalendarClock size={17} color="#fff" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: T.accent,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  fontFamily: T.mono,
                }}
              >
                RIG-HRMS
              </p>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: T.text,
                  margin: 0,
                  letterSpacing: -0.4,
                }}
              >
                Shift Assigner
              </h1>
            </div>
          </div>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>
            Override employee shifts for a duration or open-endedly, without
            disrupting attendance records.
          </p>
        </div>
        <button
          onClick={() => employees.length && setAssignEmp(employees[0])}
          disabled={!employees.length}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg,${T.accent},${T.accentSub})`,
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: employees.length ? "pointer" : "not-allowed",
            boxShadow: `0 4px 18px ${T.accent}33`,
            opacity: employees.length ? 1 : 0.6,
          }}
        >
          <PlusCircle size={15} /> Assign Shift
        </button>
      </header>

      {/* STAT CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={Users}
          label="Total Employees"
          value={loading ? "…" : stats.total}
          color={T.accent}
        />
        <StatCard
          icon={CalendarClock}
          label="Assigned"
          value={loading ? "…" : stats.assigned}
          color={T.success}
        />
        <StatCard
          icon={Calendar}
          label="Unassigned"
          value={loading ? "…" : stats.unassigned}
          color={T.textMuted}
        />
        <StatCard
          icon={Layers}
          label="Open-Ended"
          value={loading ? "…" : stats.openEnded}
          color={T.warn}
        />
      </div>

      {/* ERROR */}
      {fetchErr && <ErrBanner msg={fetchErr} onRetry={fetchAll} />}

      {/* TOOLBAR */}
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: "12px 16px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: T.textMuted,
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => sf(() => setSearch(e.target.value))}
            placeholder="Search employee or department…"
            style={{
              width: "100%",
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 9,
              padding: "9px 12px 9px 32px",
              color: T.text,
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => sf(() => setDeptFilter(d))}
              style={{
                padding: "7px 13px",
                borderRadius: 8,
                border: `1px solid ${deptFilter === d ? T.accent : T.border}`,
                background: deptFilter === d ? T.accent + "22" : "none",
                color: deptFilter === d ? T.accentSub : T.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <select
          value={shiftFilter}
          onChange={(e) => sf(() => setShiftFilter(e.target.value))}
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 9,
            padding: "9px 13px",
            color: T.textSub,
            fontSize: 13,
            cursor: "pointer",
            outline: "none",
          }}
        >
          {shiftOptions.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={fetchAll}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 9,
            border: `1px solid ${T.border}`,
            background: T.card,
            color: T.textMuted,
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <Loader2 size={13} className="as-sp" />
          ) : (
            <Search size={13} />
          )}{" "}
          Refresh
        </button>

        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: T.textMuted,
            fontFamily: T.mono,
          }}
        >
          {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* TABLE */}
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  background: T.card,
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                {[
                  "#",
                  "Employee",
                  "Current Shift",
                  "Assignment",
                  "Period",
                  "Base Shift",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      color: T.textMuted,
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: "60px 0", textAlign: "center" }}
                  >
                    <Loader2
                      size={26}
                      className="as-sp"
                      style={{
                        margin: "0 auto 10px",
                        display: "block",
                        color: T.accent,
                      }}
                    />
                    <p style={{ color: T.textMuted, fontSize: 13 }}>Loading…</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: "60px 0", textAlign: "center" }}
                  >
                    <CalendarClock
                      size={32}
                      style={{
                        margin: "0 auto 12px",
                        display: "block",
                        color: T.border,
                      }}
                    />
                    <p style={{ color: T.textMuted, fontSize: 14 }}>
                      {search || deptFilter !== "All" || shiftFilter !== "All"
                        ? "No employees match your filters."
                        : "No employees found."}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((emp, i) => {
                  const active = getActiveAssignment(emp.id, assignments);
                  const currentShift = active ? active.shift : emp.base_shift;

                  return (
                    <tr
                      key={emp.id}
                      className="emp-row"
                      style={{
                        background: i % 2 === 0 ? T.surface : T.card + "80",
                        borderBottom: `1px solid ${T.border}`,
                      }}
                    >
                      {/* ID */}
                      <td
                        style={{
                          padding: "13px 16px",
                          color: T.textMuted,
                          fontSize: 11,
                          fontFamily: T.mono,
                        }}
                      >
                        #{emp.id}
                      </td>

                      {/* Employee */}
                      <td
                        style={{ padding: "13px 16px", cursor: "pointer" }}
                        onClick={() => setSidebarEmp(emp)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <EmpAvatar
                            initials={emp.avatar}
                            department={emp.department}
                          />
                          <div>
                            <p
                              style={{
                                fontWeight: 600,
                                color: T.accentSub,
                                fontSize: 13,
                              }}
                            >
                              {emp.f_name} {emp.l_name}
                            </p>
                            <DeptBadge dept={emp.department} />
                          </div>
                        </div>
                      </td>

                      {/* Current shift */}
                      <td style={{ padding: "13px 16px" }}>
                        <ShiftPill shift={currentShift} />
                        <div
                          style={{
                            fontSize: 11,
                            color: T.textMuted,
                            marginTop: 4,
                            fontFamily: T.mono,
                          }}
                        >
                          {fmtTime12(currentShift?.start_time)} –{" "}
                          {fmtTime12(currentShift?.end_time)}
                        </div>
                      </td>

                      {/* Assignment badge */}
                      <td style={{ padding: "13px 16px" }}>
                        <AssignBadge assignment={active} />
                      </td>

                      {/* Period */}
                      <td style={{ padding: "13px 16px" }}>
                        {active ? (
                          <div
                            style={{
                              fontSize: 11,
                              color: T.textMuted,
                              fontFamily: T.mono,
                            }}
                          >
                            <span style={{ color: T.textSub }}>
                              {fmtDate(active.effective_from)}
                            </span>
                            <span style={{ margin: "0 5px" }}>→</span>
                            <span
                              style={{
                                color: !active.effective_to
                                  ? T.success
                                  : T.textSub,
                              }}
                            >
                              {fmtDate(active.effective_to)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: T.textMuted, fontSize: 11 }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Base shift */}
                      <td style={{ padding: "13px 16px" }}>
                        <ShiftPill shift={emp.base_shift} size="xs" />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <button
                            onClick={() => setSidebarEmp(emp)}
                            className="icon-btn"
                            title="View history"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              border: `1px solid ${T.border}`,
                              background: "none",
                              color: T.textMuted,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => setAssignEmp(emp)}
                            className="icon-btn"
                            title="Assign shift"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              border: `1px solid ${T.accent}44`,
                              background: T.accent + "11",
                              color: T.accentSub,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <PlusCircle size={13} />
                          </button>
                          {active && (
                            <button
                              onClick={() =>
                                setEditAssign({
                                  employee: emp,
                                  assignment: active,
                                })
                              }
                              className="icon-btn"
                              title="Edit assignment"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                border: `1px solid ${T.warn}44`,
                                background: T.warn + "11",
                                color: T.warn,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Edit3 size={12} />
                            </button>
                          )}
                          {active && (
                            <button
                              onClick={() => setDeleteId(active.id)}
                              className="icon-btn"
                              title="Remove assignment"
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                border: `1px solid ${T.danger}33`,
                                background: T.danger + "0e",
                                color: T.danger,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderTop: `1px solid ${T.border}`,
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 9,
                border: `1px solid ${T.border}`,
                background: T.card,
                color: T.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span
              style={{ fontSize: 12, color: T.textMuted, fontFamily: T.mono }}
            >
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 14px",
                borderRadius: 9,
                border: `1px solid ${T.border}`,
                background: T.card,
                color: T.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.4 : 1,
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ════ OVERLAYS ════ */}
      {sidebarEmp && (
        <EmployeeSidebar
          employee={sidebarEmp}
          assignments={assignments}
          shifts={shifts}
          onClose={() => setSidebarEmp(null)}
          onAssign={(emp) => {
            setSidebarEmp(null);
            setAssignEmp(emp);
          }}
          onEditAssign={(obj) => {
            setSidebarEmp(null);
            setEditAssign(obj);
          }}
          onDeleteAssignment={(id) => {
            setSidebarEmp(null);
            setDeleteId(id);
          }}
          onEndAssignment={(a) => {
            setSidebarEmp(null);
            setEndAssign(a);
          }}
        />
      )}

      {assignEmp && (
        <AssignModal
          employee={assignEmp}
          shifts={shifts}
          onClose={() => setAssignEmp(null)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}

      {editAssign && (
        <AssignModal
          employee={editAssign.employee}
          assignment={editAssign.assignment}
          shifts={shifts}
          onClose={() => setEditAssign(null)}
          onSaved={handleSaved}
          showToast={showToast}
        />
      )}

      {endAssign && (
        <EndModal
          assignment={endAssign}
          onConfirm={handleEnd}
          onCancel={() => setEndAssign(null)}
        />
      )}

      {deleteId && (
        <DeleteConfirm
          assignmentId={deleteId}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
