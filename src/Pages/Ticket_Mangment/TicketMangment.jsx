/**
 * TicketManagement.jsx — HR / Admin Ticket Management
 *
 * Dynamic role gating — reads role from /api/v1/auth/me:
 *  - role === "hr" or "admin"        → All Tickets + Dashboard
 *  - role === "super_admin"           → All above + full Category config
 *                                       (department_id + incharge_id fields visible)
 *
 * ZERO hardcoded employee IDs or role strings beyond what the API returns.
 * The component checks `currentUser.role` at runtime.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Ticket,
  Search,
  X,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Download,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  MessageSquare,
  Zap,
  FileText,
  Eye,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Users,
  Building2,
  CheckCheck,
  Circle,
  User,
  Mail,
  Tag,
  Inbox,
  Shield,
  Lock,
  Star,
} from "lucide-react";
import { API } from "../../Components/Apis";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  :root {
    --tm-serif: 'Libre Baskerville', Georgia, serif;
    --tm-sans: 'Outfit', system-ui, sans-serif;
    --tm-ink: #111827;
    --tm-accent: #0f172a;
    --tm-rose: #be123c;
    --tm-surface: #f9fafb;
    --tm-border: #e5e7eb;
    --tm-muted: #9ca3af;
  }
  .tm-root { font-family: var(--tm-sans); }
  .tm-serif { font-family: var(--tm-serif); }
  @keyframes tmFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tmFadeIn { from{opacity:0} to{opacity:1} }
  @keyframes tmSlide  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
  @keyframes tmPop    { 0%{opacity:0;transform:scale(.95)} 100%{opacity:1;transform:scale(1)} }
  @keyframes tmSpin   { to{transform:rotate(360deg)} }
  .tm-fade-up { animation:tmFadeUp .28s cubic-bezier(.22,1,.36,1) both; }
  .tm-fade-in { animation:tmFadeIn .18s ease both; }
  .tm-slide   { animation:tmSlide .3s cubic-bezier(.22,1,.36,1) both; }
  .tm-pop     { animation:tmPop .2s cubic-bezier(.22,1,.36,1) both; }
  .tm-spin    { animation:tmSpin .8s linear infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("__tm_sty__")) {
  const s = document.createElement("style");
  s.id = "__tm_sty__";
  s.textContent = STYLES;
  document.head.appendChild(s);
}

const tmToken = () => localStorage.getItem("access_token") || "";

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const getTokenData = () => decodeJWT(tmToken());
const tmAuth = () => ({ Authorization: `Bearer ${tmToken()}` });
const tmJSON = () => ({ ...tmAuth(), "Content-Type": "application/json" });

const tmFetch = async (url, opts = {}) => {
  const res = await fetch(url, { headers: tmJSON(), ...opts });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(e.detail || "Request failed");
  }
  return res.json();
};

async function tmDownload(url, filename) {
  const res = await fetch(url, { headers: tmAuth() });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename || "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

const ROLE_LEVELS = {
  SUPER_ADMIN: 1,
  CEO: 2,
  HR_ADMIN: 3,
  HR: 4,
  FINANCE: 5,
  DEPARTMENT_HEAD: 6,
  LEAD: 7,
  EMPLOYEE: 8,
  INTERN: 9,
};

const isSuperAdmin = (user) => {
  return user?.level === ROLE_LEVELS.SUPER_ADMIN;
};

const isHR = (user) => {
  return [
    ROLE_LEVELS.SUPER_ADMIN,
    ROLE_LEVELS.CEO,
    ROLE_LEVELS.HR_ADMIN,
    ROLE_LEVELS.HR,
  ].includes(user?.level);
};

const isDepartmentHead = (user) => user?.level === ROLE_LEVELS.DEPARTMENT_HEAD;

const PRIORITY = {
  LOW: {
    label: "Low",
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#e5e7eb",
    dot: "#9ca3af",
  },
  MEDIUM: {
    label: "Medium",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    dot: "#3b82f6",
  },
  HIGH: {
    label: "High",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fcd34d",
    dot: "#f59e0b",
  },
  CRITICAL: {
    label: "Critical",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5",
    dot: "#ef4444",
  },
};

const STATUS = {
  OPEN: {
    label: "Open",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    Icon: Circle,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    Icon: Zap,
  },
  RESOLVED: {
    label: "Resolved",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    Icon: CheckCircle2,
  },
  CLOSED: {
    label: "Closed",
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#e5e7eb",
    Icon: CheckCheck,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fca5a5",
    Icon: XCircle,
  },
};

const PAGE_SIZE = 12;
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const fmtFull = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const employeeName = (e) =>
  `${e?.f_name || ""} ${e?.l_name || ""}`.trim() ||
  e?.email ||
  `Employee #${e?.id}`;
const normParticipant = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();
const getParticipantList = (source) =>
  source?.participants || source?.default_participants || [];
const employeeParticipantKeys = (e) =>
  [
    e?.id,
    e?.email,
    employeeName(e),
    `${e?.f_name || ""} ${e?.l_name || ""}`.trim(),
  ]
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(normParticipant);
const participantMatchesEmployee = (participant, employee) =>
  employeeParticipantKeys(employee).includes(normParticipant(participant));
const participantLabel = (participant, employees) => {
  const emp = employees.find((e) => participantMatchesEmployee(participant, e));
  return emp ? employeeName(emp) : String(participant);
};
const sameId = (a, b) =>
  a !== undefined &&
  a !== null &&
  b !== undefined &&
  b !== null &&
  String(a) === String(b);
const currentEmployeeDbId = (user) => user?.id ?? null;
const resolveCurrentEmployee = (me, employees) => {
  const tokenData = getTokenData() || {};
  const fromDbId = employees.find((e) => sameId(e.id, me?.id));
  const fromTokenEpi = employees.find((e) =>
    sameId(e.employee_id, tokenData.EPI),
  );
  return fromDbId || fromTokenEpi || null;
};
const employeeForTicket = (ticket, employeeById, employeeByEmployeeId) =>
  employeeById[ticket.employee_id] ||
  employeeByEmployeeId[ticket.employee_id] ||
  null;
const categoryForTicket = (ticket, categories) =>
  categories.find(
    (c) => sameId(c.id, ticket.category_id) || c.name === ticket.category_name,
  ) || null;
const isTicketInUserDepartment = (ticket, category, user) => {
  const tokenData = getTokenData() || {};
  const deptId =
    user?.department_id ?? user?.department?.id ?? tokenData.department_id;
  if (deptId === undefined || deptId === null) return false;
  return (
    sameId(ticket.department_id, deptId) ||
    sameId(ticket.employee?.department_id, deptId) ||
    sameId(ticket.employee?.department?.id, deptId) ||
    sameId(category?.department_id, deptId)
  );
};
const isTicketForIncharge = (ticket, category, user) => {
  const employeeId = currentEmployeeDbId(user);
  return (
    sameId(category?.incharge_id, employeeId) ||
    sameId(ticket.assigned_to, employeeId)
  );
};
const canOpenTicketManagement = (user, categories = []) => {
  if (isHR(user) || isDepartmentHead(user)) return true;
  const employeeId = currentEmployeeDbId(user);
  return categories.some((c) => sameId(c.incharge_id, employeeId));
};
const ticketVisibleToUser = (ticket, categories, user) => {
  if (isHR(user)) return true;
  const category = categoryForTicket(ticket, categories);
  if (
    isDepartmentHead(user) &&
    isTicketInUserDepartment(ticket, category, user)
  )
    return true;
  return isTicketForIncharge(ticket, category, user);
};

function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY.MEDIUM;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        border: `1px solid ${p.border}`,
        color: p.color,
        background: p.bg,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: "50%", background: p.dot }}
      />
      {p.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.OPEN;
  const { Icon } = s;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        border: `1px solid ${s.border}`,
        color: s.color,
        background: s.bg,
      }}
    >
      <Icon size={9} strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

function Toast({ toasts }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 600,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="tm-pop"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: t.type === "success" ? "#059669" : "#dc2626",
          }}
        >
          {t.type === "success" ? (
            <CheckCircle2 size={14} />
          ) : (
            <AlertTriangle size={14} />
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Ticket Detail Sidebar ────────────────────────────────────────────────────
function TicketSidebar({
  ticketId,
  employees,
  categories,
  onClose,
  onUpdated,
  addToast,
}) {
  const [ticket, setTicket] = useState(null);
  const [atts, setAtts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [assigneeId, setAssigneeId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, attsData] = await Promise.all([
        tmFetch(API.detail(ticketId)),
        tmFetch(API.mgmtAtts(ticketId)).catch(() => []),
      ]);
      setTicket(t);
      setComments(t.comments || []);
      setAtts(attsData);
      setAssigneeId(t.assigned_to || "");
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action, url, body = {}) => {
    setActing(action);
    try {
      await tmFetch(url, { method: "POST", body: JSON.stringify(body) });
      addToast(`Ticket ${action}d`, "success");
      onUpdated();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setActing(null);
    }
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const c = await tmFetch(API.comment(ticketId), {
        method: "POST",
        body: JSON.stringify({ content: comment.trim(), is_hr: true }),
      });
      setComments((p) => [...p, c]);
      setComment("");
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async (att) => {
    setDownloading(att.id);
    try {
      await tmDownload(API.downloadAtt(att.id), att.file_name);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setDownloading(null);
    }
  };

  const isPending =
    ticket && !["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.status);
  const ticketCategory = useMemo(() => {
    if (!ticket) return null;
    return (
      categories.find(
        (c) => c.id === ticket.category_id || c.name === ticket.category_name,
      ) || null
    );
  }, [categories, ticket]);
  const ticketParticipants = useMemo(() => {
    if (!ticket) return [];
    return getParticipantList(ticket).length
      ? getParticipantList(ticket)
      : getParticipantList(ticketCategory);
  }, [ticket, ticketCategory]);
  const assignableEmployees = useMemo(() => {
    const participants = ticketParticipants
      .map(normParticipant)
      .filter(Boolean);
    if (!participants.length) return [];
    return employees.filter((e) =>
      participants.some((p) => employeeParticipantKeys(e).includes(p)),
    );
  }, [employees, ticketParticipants]);

  return (
    <>
      <div
        className="tm-fade-in"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(17,24,39,0.4)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        className="tm-slide"
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 301,
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-6px 0 48px rgba(17,24,39,0.12)",
          borderLeft: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            background: "#111827",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            {ticket && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    fontFamily: "monospace",
                  }}
                >
                  #{ticket.id}
                </span>
              </div>
            )}
            <h2
              className="tm-serif"
              style={{
                color: "#fff",
                fontSize: 17,
                margin: 0,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ticket ? ticket.subject : "Loading…"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              border: "1px solid #374151",
              background: "transparent",
              color: "#6b7280",
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

        {loading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader2
              size={24}
              className="tm-spin"
              style={{ color: "#e5e7eb" }}
            />
          </div>
        ) : ticket ? (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* Employee */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  color: "#9ca3af",
                  margin: "0 0 10px",
                }}
              >
                Raised By
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {(ticket.employee?.f_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                      margin: 0,
                    }}
                  >
                    {ticket.employee
                      ? `${ticket.employee.f_name} ${ticket.employee.l_name}`
                      : `Employee #${ticket.employee_id}`}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 3,
                      flexWrap: "wrap",
                    }}
                  >
                    {ticket.employee?.designation && (
                      <span style={{ fontSize: 12, color: "#6b7280" }}>
                        {ticket.employee.designation}
                      </span>
                    )}
                    {ticket.employee?.department?.name && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Building2 size={10} />
                        {ticket.employee.department.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  { label: "Category", value: ticket.category_name || "—" },
                  { label: "Submitted", value: fmt(ticket.created_at) },
                  { label: "Last Update", value: fmt(ticket.updated_at) },
                  {
                    label: "Assigned To",
                    value: ticket.assigned_to_name || "Unassigned",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      background: "#f9fafb",
                      borderRadius: 10,
                      padding: "10px 12px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 600,
                        color: "#9ca3af",
                        margin: "0 0 4px",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                        margin: 0,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Assign */}
            {isPending && (
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    color: "#9ca3af",
                    margin: "0 0 8px",
                  }}
                >
                  Reassign To
                </p>
                {assignableEmployees.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed #e5e7eb",
                      borderRadius: 10,
                      padding: "11px 12px",
                      background: "#f9fafb",
                    }}
                  >
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                      No participants are configured for this ticket category.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      style={{
                        flex: 1,
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: "9px 12px",
                        fontSize: 13,
                        background: "#f9fafb",
                        outline: "none",
                        fontFamily: "inherit",
                        appearance: "none",
                        color: "#111827",
                      }}
                    >
                      <option value="">Select participant…</option>
                      {assignableEmployees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {employeeName(e)}
                          {e.designation ? ` — ${e.designation}` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        act("assign", API.assign(ticketId), {
                          assignee_id: Number(assigneeId),
                        })
                      }
                      disabled={!assigneeId || acting === "assign"}
                      style={{
                        padding: "9px 16px",
                        background: "#111827",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#fff",
                        cursor:
                          !assigneeId || acting === "assign"
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: !assigneeId ? 0.4 : 1,
                      }}
                    >
                      {acting === "assign" ? (
                        <Loader2 size={12} className="tm-spin" />
                      ) : (
                        <User size={12} />
                      )}
                      Assign
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  color: "#9ca3af",
                  margin: "0 0 8px",
                }}
              >
                Description
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.7,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {ticket.summary}
              </p>
            </div>

            {/* Attachments */}
            {atts.length > 0 && (
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    color: "#9ca3af",
                    margin: "0 0 10px",
                  }}
                >
                  Attachments ({atts.length})
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {atts.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: "8px 12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                        }}
                      >
                        <Paperclip
                          size={12}
                          style={{ color: "#9ca3af", flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "#111827",
                          }}
                        >
                          {a.file_name}
                        </span>
                        {a.file_size && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#9ca3af",
                              flexShrink: 0,
                            }}
                          >
                            ({(a.file_size / 1024).toFixed(0)} KB)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDownload(a)}
                        disabled={downloading === a.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          color: "#2563eb",
                          fontSize: 11,
                          fontWeight: 600,
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                          marginLeft: 8,
                          opacity: downloading === a.id ? 0.5 : 1,
                        }}
                      >
                        {downloading === a.id ? (
                          <Loader2 size={11} className="tm-spin" />
                        ) : (
                          <Download size={11} />
                        )}
                        {downloading === a.id ? "…" : "Download"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div style={{ padding: "16px 24px" }}>
              <p
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  color: "#9ca3af",
                  margin: "0 0 12px",
                }}
              >
                Comments ({comments.length})
              </p>
              {comments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <MessageSquare
                    size={20}
                    style={{
                      margin: "0 auto 8px",
                      color: "#e5e7eb",
                      display: "block",
                    }}
                  />
                  <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                    No comments yet
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  {comments.map((c, i) => (
                    <div
                      key={c.id || i}
                      style={{
                        borderRadius: 14,
                        padding: "12px 14px",
                        background: c.is_hr ? "#f5f3ff" : "#f9fafb",
                        border: `1px solid ${c.is_hr ? "#c4b5fd" : "#e5e7eb"}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: c.is_hr ? "#7c3aed" : "#111827",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {(c.author_name || "?")[0].toUpperCase()}
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#111827",
                          }}
                        >
                          {c.author_name || "User"}
                        </span>
                        {c.is_hr && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 99,
                              background: "#ede9fe",
                              color: "#7c3aed",
                            }}
                          >
                            HR
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginLeft: "auto",
                          }}
                        >
                          {fmtFull(c.created_at)}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#374151",
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {isPending && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendComment()
                    }
                    placeholder="Add HR note…"
                    style={{
                      flex: 1,
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      background: "#f9fafb",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    onClick={sendComment}
                    disabled={sending || !comment.trim()}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      border: "none",
                      background: "#111827",
                      cursor:
                        sending || !comment.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      opacity: sending || !comment.trim() ? 0.4 : 1,
                    }}
                  >
                    {sending ? (
                      <Loader2
                        size={14}
                        className="tm-spin"
                        style={{ color: "#fff" }}
                      />
                    ) : (
                      <Send size={14} style={{ color: "#fff" }} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {ticket && isPending && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              gap: 10,
            }}
          >
            {ticket.status !== "RESOLVED" && (
              <button
                onClick={() => act("resolve", API.resolve(ticketId))}
                disabled={!!acting}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  border: "none",
                  background: "#059669",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: acting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: acting ? 0.6 : 1,
                }}
              >
                {acting === "resolve" ? (
                  <Loader2 size={12} className="tm-spin" />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                Mark Resolved
              </button>
            )}
            <button
              onClick={() => act("close", API.close(ticketId))}
              disabled={!!acting}
              style={{
                flex: 1,
                padding: "11px 0",
                border: "none",
                background: "#374151",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                cursor: acting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: acting ? 0.6 : 1,
              }}
            >
              {acting === "close" ? (
                <Loader2 size={12} className="tm-spin" />
              ) : (
                <CheckCheck size={12} />
              )}
              Close Ticket
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ stats, tickets }) {
  const [range, setRange] = useState("month");

  const trendData = useMemo(() => {
    if (!tickets.length) return [];
    const now = new Date();
    if (range === "week") {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return {
          label: d.toLocaleDateString("en-GB", { weekday: "short" }),
          key: d.toISOString().slice(0, 10),
          count: 0,
        };
      });
      tickets.forEach((t) => {
        const k = (t.created_at || "").slice(0, 10);
        const day = days.find((d) => d.key === k);
        if (day) day.count++;
      });
      return days;
    }
    if (range === "month") {
      const weeks = Array.from({ length: 5 }, (_, i) => ({
        label: `W${i + 1}`,
        count: 0,
      }));
      tickets.forEach((t) => {
        const d = new Date(t.created_at || now);
        const diff = Math.floor((now - d) / 86400000);
        if (diff >= 0 && diff < 35) {
          const wk = Math.floor(diff / 7);
          if (wk < 5) weeks[4 - wk].count++;
        }
      });
      return weeks;
    }
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), i, 1);
      return {
        label: d.toLocaleDateString("en-US", { month: "short" }),
        month: i,
        count: 0,
      };
    });
    tickets.forEach((t) => {
      const d = new Date(t.created_at || now);
      if (d.getFullYear() === now.getFullYear()) months[d.getMonth()].count++;
    });
    return months;
  }, [tickets, range]);

  const deptData = useMemo(() => {
    const map = {};
    tickets
      .filter((t) => t.status !== "CANCELLED")
      .forEach((t) => {
        const dept = t.employee?.department?.department || "Unknown";
        if (!map[dept])
          map[dept] = { name: dept, open: 0, resolved: 0, total: 0 };
        map[dept].total++;
        if (["OPEN", "IN_PROGRESS"].includes(t.status)) map[dept].open++;
        if (["RESOLVED", "CLOSED"].includes(t.status)) map[dept].resolved++;
      });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [tickets]);

  const maxTrend = Math.max(...trendData.map((d) => d.count), 1);
  const maxDept = Math.max(...deptData.map((d) => d.total), 1);
  const counts = {
    open: tickets.filter((t) => t.status === "OPEN" && t.status !== "CANCELLED")
      .length,
    progress: tickets.filter(
      (t) => t.status === "IN_PROGRESS" && t.status !== "CANCELLED",
    ).length,
    resolved: tickets.filter(
      (t) => t.status === "RESOLVED" && t.status !== "CANCELLED",
    ).length,
    critical: tickets.filter(
      (t) => t.priority === "CRITICAL" && t.status !== "CANCELLED",
    ).length,
  };

  // Calculate category counts excluding cancelled tickets
  const categoryCountsLocal = useMemo(() => {
    const map = {};
    tickets
      .filter((t) => t.status !== "CANCELLED")
      .forEach((t) => {
        const cat = t.category_name || "Uncategorized";
        map[cat] = (map[cat] || 0) + 1;
      });
    return map;
  }, [tickets]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
        }}
      >
        {[
          {
            label: "Open",
            value: counts.open,
            Icon: Circle,
            color: "#2563eb",
            bg: "#eff6ff",
          },
          {
            label: "In Progress",
            value: counts.progress,
            Icon: Zap,
            color: "#7c3aed",
            bg: "#f5f3ff",
          },
          {
            label: "Resolved",
            value: counts.resolved,
            Icon: CheckCircle2,
            color: "#059669",
            bg: "#ecfdf5",
          },
          {
            label: "Critical",
            value: counts.critical,
            Icon: AlertTriangle,
            color: "#dc2626",
            bg: "#fef2f2",
          },
        ].map(({ label, value, Icon, color, bg }) => (
          <div
            key={label}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "20px",
              border: "1px solid #e5e7eb",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: color,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                marginTop: 4,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                {label}
              </p>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={13} style={{ color }} />
              </div>
            </div>
            <p
              className="tm-serif"
              style={{
                fontSize: 38,
                color: "#111827",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h3
              className="tm-serif"
              style={{ fontSize: 20, color: "#111827", margin: 0 }}
            >
              Ticket Volume
            </h3>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>
              Submissions over time
            </p>
          </div>
          <div
            style={{
              display: "flex",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 4,
              gap: 4,
            }}
          >
            {[
              ["week", "Week"],
              ["month", "Month"],
              ["year", "Year"],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setRange(k)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "none",
                  background: range === k ? "#111827" : "transparent",
                  color: range === k ? "#fff" : "#6b7280",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            height: 160,
          }}
        >
          {trendData.map((d) => {
            const h = Math.max(4, Math.round((d.count / maxTrend) * 100));
            return (
              <div
                key={d.label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                {d.count > 0 && (
                  <span
                    style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}
                  >
                    {d.count}
                  </span>
                )}
                <div
                  style={{
                    width: "100%",
                    background: "#111827",
                    borderRadius: "4px 4px 0 0",
                    height: `${h}%`,
                    transition: "height .5s",
                    minHeight: 4,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: "#9ca3af",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dept breakdown */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: "24px",
        }}
      >
        <h3
          className="tm-serif"
          style={{ fontSize: 20, color: "#111827", margin: "0 0 6px" }}
        >
          By Department
        </h3>
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 20px" }}>
          Open vs resolved across teams
        </p>
        {deptData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Building2
              size={24}
              style={{
                margin: "0 auto 10px",
                color: "#e5e7eb",
                display: "block",
              }}
            />
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              No department data yet
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {deptData.map((dept) => (
              <div key={dept.name}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#111827",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Building2 size={12} style={{ color: "#9ca3af" }} />
                    {dept.name}
                  </span>
                  <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                    <span style={{ color: "#2563eb", fontWeight: 500 }}>
                      {dept.open} open
                    </span>
                    <span style={{ color: "#059669", fontWeight: 500 }}>
                      {dept.resolved} resolved
                    </span>
                    <span style={{ color: "#6b7280", fontWeight: 600 }}>
                      {dept.total} total
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: 8,
                    background: "#f3f4f6",
                    borderRadius: 99,
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#3b82f6",
                      width: `${(dept.open / maxDept) * 100}%`,
                      transition: "width .6s",
                      borderRadius: "99px 0 0 99px",
                    }}
                  />
                  <div
                    style={{
                      height: "100%",
                      background: "#10b981",
                      width: `${(dept.resolved / maxDept) * 100}%`,
                      transition: "width .6s",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category counts */}
      {Object.keys(categoryCountsLocal).length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            padding: "24px",
          }}
        >
          <h3
            className="tm-serif"
            style={{ fontSize: 20, color: "#111827", margin: "0 0 20px" }}
          >
            By Category
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
              gap: 12,
            }}
          >
            {Object.entries(categoryCountsLocal).map(([cat, count]) => (
              <div
                key={cat}
                style={{
                  background: "#f9fafb",
                  borderRadius: 12,
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "#6b7280",
                    margin: "0 0 8px",
                  }}
                >
                  {cat}
                </p>
                <p
                  className="tm-serif"
                  style={{ fontSize: 32, color: "#111827", margin: 0 }}
                >
                  {count}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Categories Tab (Super Admin only) ───────────────────────────────────────
function CategoriesTab({
  categories,
  employees,
  departments,
  onRefresh,
  addToast,
  isSA,
}) {
  const [editCat, setEditCat] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    department_id: "",
    incharge_id: "",
    email_recipients: "",
    default_participants: [],
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const openEdit = (cat) => {
    if (cat === "new") {
      setForm({
        name: "",
        description: "",
        department_id: "",
        incharge_id: "",
        email_recipients: "",
        default_participants: [],
        is_active: true,
      });
    } else {
      setForm({
        name: cat.name || "",
        description: cat.description || "",
        department_id: cat.department_id || "",
        incharge_id: cat.incharge_id || "",
        email_recipients: (cat.email_recipients || []).join(", "),
        default_participants: getParticipantList(cat).map((p) => String(p)),
        is_active: cat.is_active !== undefined ? cat.is_active : true,
      });
    }
    setEditCat(cat);
  };

  const saveCategory = async () => {
    if (!form.name.trim()) {
      addToast("Category name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        email_recipients: form.email_recipients
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        default_participants: form.default_participants,
        is_active: form.is_active,
        // Super-admin-only fields — only included if isSA
        ...(isSA && {
          department_id: form.department_id ? Number(form.department_id) : null,
        }),
        ...(isSA && {
          incharge_id: form.incharge_id ? Number(form.incharge_id) : null,
        }),
      };
      if (editCat === "new") {
        await tmFetch(API.createCategory(), {
          method: "POST",
          body: JSON.stringify(body),
        });
        addToast("Category created", "success");
      } else {
        await tmFetch(API.updateCategory(editCat.id), {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        addToast("Category updated", "success");
      }
      setEditCat(null);
      onRefresh();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteCat = async (cat) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    setDeleting(cat.id);
    try {
      await tmFetch(API.deleteCategory(cat.id), { method: "DELETE" });
      addToast("Category deleted", "success");
      onRefresh();
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  const inp = {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    background: "#f9fafb",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  const selectedParticipantSet = useMemo(
    () => new Set(form.default_participants.map(normParticipant)),
    [form.default_participants],
  );
  const availableParticipants = useMemo(
    () =>
      employees.filter(
        (e) =>
          !employeeParticipantKeys(e).some((k) =>
            selectedParticipantSet.has(k),
          ),
      ),
    [employees, selectedParticipantSet],
  );
  const addParticipant = (employeeId) => {
    if (!employeeId) return;
    setForm((p) =>
      selectedParticipantSet.has(normParticipant(employeeId))
        ? p
        : {
            ...p,
            default_participants: [
              ...p.default_participants,
              String(employeeId),
            ],
          },
    );
  };
  const removeParticipant = (participant) => {
    const key = normParticipant(participant);
    setForm((p) => ({
      ...p,
      default_participants: p.default_participants.filter(
        (item) => normParticipant(item) !== key,
      ),
    }));
  };

  return (
    <div>
      {/* Super Admin indicator */}
      {isSA && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fefce8",
            border: "1px solid #fcd34d",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 20,
          }}
        >
          <Star size={14} style={{ color: "#d97706", flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
            <strong>Super Admin view</strong> — You can set department routing
            and default incharge per category. These fields are hidden from HR
            users.
          </p>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            className="tm-serif"
            style={{ fontSize: 22, color: "#111827", margin: 0 }}
          >
            Category Templates
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
            Configure routing, email recipients, and participants per category
          </p>
        </div>
        <button
          onClick={() => openEdit("new")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={14} />
          New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            padding: "64px",
            textAlign: "center",
          }}
        >
          <Tag
            size={32}
            style={{
              margin: "0 auto 12px",
              color: "#e5e7eb",
              display: "block",
            }}
          />
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#6b7280",
              margin: "0 0 4px",
            }}
          >
            No categories yet
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
            Create your first category to configure ticket routing
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))",
            gap: 16,
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="tm-fade-up"
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 3,
                  background: cat.is_active ? "#111827" : "#e5e7eb",
                }}
              />
              <div style={{ padding: "18px 20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#111827",
                          margin: 0,
                        }}
                      >
                        {cat.name}
                      </h3>
                      {!cat.is_active && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 99,
                            background: "#f3f4f6",
                            color: "#6b7280",
                          }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    {cat.description && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          margin: "4px 0 0",
                          lineHeight: 1.5,
                        }}
                      >
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(cat)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "transparent",
                        color: "#9ca3af",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => deleteCat(cat)}
                      disabled={deleting === cat.id}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "transparent",
                        color: "#9ca3af",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: deleting === cat.id ? 0.5 : 1,
                      }}
                    >
                      {deleting === cat.id ? (
                        <Loader2 size={12} className="tm-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Super Admin fields */}
                {isSA && (cat.department_name || cat.incharge_name) && (
                  <div
                    style={{
                      background: "#fefce8",
                      border: "1px solid #fcd34d",
                      borderRadius: 10,
                      padding: "10px 12px",
                      marginBottom: 12,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: "#92400e",
                        margin: "0 0 6px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Shield size={10} />
                      Routing Config
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {cat.department_name && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#78350f",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <Building2 size={10} />
                          Dept: <strong>{cat.department_name}</strong>
                        </span>
                      )}
                      {cat.incharge_name && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#78350f",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <User size={10} />
                          Incharge: <strong>{cat.incharge_name}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {/* Email recipients */}
                  <div>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: "#9ca3af",
                        margin: "0 0 6px",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Mail size={10} />
                      Email Recipients
                    </p>
                    {(cat.email_recipients || []).length === 0 ? (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#d1d5db",
                          fontStyle: "italic",
                          margin: 0,
                        }}
                      >
                        None configured
                      </p>
                    ) : (
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {(cat.email_recipients || []).map((email) => (
                          <span
                            key={email}
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              padding: "3px 8px",
                              borderRadius: 8,
                              background: "#f3f4f6",
                              color: "#374151",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            {email}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Participants */}
                  <div>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: "#9ca3af",
                        margin: "0 0 6px",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Users size={10} />
                      Default Participants
                    </p>
                    {getParticipantList(cat).length === 0 ? (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#d1d5db",
                          fontStyle: "italic",
                          margin: 0,
                        }}
                      >
                        None configured
                      </p>
                    ) : (
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                      >
                        {getParticipantList(cat).map((p) => (
                          <span
                            key={p}
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              padding: "3px 8px",
                              borderRadius: 8,
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            {participantLabel(p, employees)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create modal */}
      {editCat !== null && (
        <div
          className="tm-fade-in"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(17,24,39,0.65)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="tm-pop"
            style={{
              background: "#fff",
              borderRadius: 20,
              width: "100%",
              maxWidth: 520,
              margin: "0 16px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
                background: "#111827",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  className="tm-serif"
                  style={{ color: "#fff", fontSize: 18, margin: 0 }}
                >
                  {editCat === "new" ? "New Category" : "Edit Category"}
                </h2>
                <p
                  style={{ color: "#6b7280", fontSize: 12, margin: "4px 0 0" }}
                >
                  Configure routing for this ticket type
                </p>
              </div>
              <button
                onClick={() => setEditCat(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  border: "1px solid #374151",
                  background: "transparent",
                  color: "#6b7280",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    color: "#9ca3af",
                    marginBottom: 8,
                  }}
                >
                  Category Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. IT Support, Maintenance…"
                  style={inp}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    color: "#9ca3af",
                    marginBottom: 8,
                  }}
                >
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="What kind of tickets belong here?"
                  style={{ ...inp, resize: "none" }}
                />
              </div>

              {/* Super Admin only fields */}
              {isSA && (
                <div
                  style={{
                    background: "#fefce8",
                    border: "1px solid #fcd34d",
                    borderRadius: 12,
                    padding: "16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#92400e",
                      margin: "0 0 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Shield size={12} /> Super Admin — Routing Config
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight: 600,
                          color: "#78350f",
                          marginBottom: 6,
                        }}
                      >
                        Department (auto-route)
                      </label>
                      <select
                        value={form.department_id}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            department_id: e.target.value,
                          }))
                        }
                        style={{ ...inp, appearance: "none", color: "#111827" }}
                      >
                        <option value="">No specific department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.department}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight: 600,
                          color: "#78350f",
                          marginBottom: 6,
                        }}
                      >
                        Default Incharge (auto-assignee)
                      </label>
                      <select
                        value={form.incharge_id}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            incharge_id: e.target.value,
                          }))
                        }
                        style={{ ...inp, appearance: "none", color: "#111827" }}
                      >
                        <option value="">No default incharge</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.f_name} {e.l_name}
                            {e.designation ? ` — ${e.designation}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontWeight: 600,
                          color: "#78350f",
                          marginBottom: 6,
                        }}
                      >
                        Status
                      </label>
                      <div style={{ display: "flex", gap: 10 }}>
                        {[true, false].map((v) => (
                          <button
                            key={String(v)}
                            onClick={() =>
                              setForm((p) => ({ ...p, is_active: v }))
                            }
                            style={{
                              flex: 1,
                              padding: "8px",
                              borderRadius: 9,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              border: `1.5px solid ${form.is_active === v ? "#111827" : "#e5e7eb"}`,
                              background:
                                form.is_active === v ? "#111827" : "#fff",
                              color: form.is_active === v ? "#fff" : "#6b7280",
                            }}
                          >
                            {v ? "Active" : "Inactive"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    color: "#9ca3af",
                    marginBottom: 8,
                  }}
                >
                  Email Recipients{" "}
                  <span style={{ fontWeight: 400, color: "#d1d5db" }}>
                    (comma-separated)
                  </span>
                </label>
                <input
                  value={form.email_recipients}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email_recipients: e.target.value }))
                  }
                  placeholder="hr@company.com, admin@company.com"
                  style={inp}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                    color: "#9ca3af",
                    marginBottom: 8,
                  }}
                >
                  Default Participants
                </label>
                <select
                  value=""
                  onChange={(e) => addParticipant(e.target.value)}
                  style={{
                    ...inp,
                    appearance: "none",
                    color: availableParticipants.length ? "#111827" : "#9ca3af",
                  }}
                >
                  <option value="">
                    {availableParticipants.length
                      ? "Select employee to add…"
                      : "All employees selected"}
                  </option>
                  {availableParticipants.map((e) => (
                    <option key={e.id} value={e.id}>
                      {employeeName(e)}
                      {e.designation ? ` — ${e.designation}` : ""}
                    </option>
                  ))}
                </select>
                {form.default_participants.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 10,
                    }}
                  >
                    {form.default_participants.map((p) => (
                      <span
                        key={p}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "5px 8px",
                          borderRadius: 8,
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {participantLabel(p, employees)}
                        <button
                          type="button"
                          onClick={() => removeParticipant(p)}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            border: "none",
                            background: "#dbeafe",
                            color: "#1d4ed8",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                          }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: 10,
                background: "#f9fafb",
              }}
            >
              <button
                onClick={saveCategory}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: saving ? "#6b7280" : "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="tm-spin" />
                    Saving…
                  </>
                ) : editCat === "new" ? (
                  "Create Category"
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                onClick={() => setEditCat(null)}
                style={{
                  padding: "12px 20px",
                  background: "transparent",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  fontSize: 13,
                  color: "#6b7280",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ MAIN ═════════════════════════════════════════════════════════════════════
export default function TicketManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets");
  const [detailId, setDetailId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [priorityFilter, setPriority] = useState("All");
  const [categoryFilter, setCategory] = useState("All");
  const [deptFilter, setDept] = useState("All");
  const [page, setPage] = useState(1);

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, t, c, e, d, s] = await Promise.all([
        tmFetch(API.me()),
        tmFetch(API.all()),
        tmFetch(API.categories()).catch(() => []),
        tmFetch(API.employees()).catch(() => []),
        tmFetch(API.departments()).catch(() => []),
        tmFetch(API.stats()).catch(() => null),
      ]);
      const empList = Array.isArray(e) ? e : e.employees || [];
      const currentEmployee = resolveCurrentEmployee(me, empList);
      setCurrentUser({
        ...me,
        ...(currentEmployee ? { id: currentEmployee.id } : {}),
        employee_code: currentEmployee?.employee_id ?? me?.employee_id,
        department_id: currentEmployee?.department_id ?? me?.department_id,
        department: currentEmployee?.department ?? me?.department,
        permissions: me?.extra_data?.permissions || [],
      });
      const empMap = empList.reduce((m, emp) => {
        m[emp.id] = emp;
        return m;
      }, {});
      const empCodeMap = empList.reduce((m, emp) => {
        if (emp.employee_id !== undefined && emp.employee_id !== null)
          m[emp.employee_id] = emp;
        return m;
      }, {});
      const ticketList = Array.isArray(t) ? t : t.items || [];
      setTickets(
        ticketList.map((ticket) => ({
          ...ticket,
          employee: employeeForTicket(ticket, empMap, empCodeMap),
        })),
      );
      setCategories(Array.isArray(c) ? c : []);
      setEmployees(empList);
      setDepartments(Array.isArray(d) ? d : d.departments || []);
      if (s) setStats(s);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);
  const hasPermission = (user, permission) => {
    return user?.permissions?.includes(permission);
  };
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, categoryFilter, deptFilter]);

  const SA = isSuperAdmin(currentUser);

  // Dynamic tab list — Categories only for Super Admin
  const TABS = useMemo(() => {
    const tabs = [];

    if (
      canOpenTicketManagement(currentUser, categories) ||
      hasPermission(currentUser, "tickets.view")
    ) {
      tabs.push({
        id: "tickets",
        label:
          isSuperAdmin(currentUser) || isHR(currentUser)
            ? "All Tickets"
            : "Tickets",
        Icon: Ticket,
      });
    }

    if (isSuperAdmin(currentUser) || isHR(currentUser)) {
      tabs.push({
        id: "dashboard",
        label: "Dashboard",
        Icon: BarChart3,
      });
    }

    if (isSuperAdmin(currentUser)) {
      tabs.push({
        id: "categories",
        label: "Categories",
        Icon: Settings,
        adminOnly: true,
      });
    }

    return tabs;
  }, [currentUser, categories]);

  useEffect(() => {
    if (TABS.length > 0 && !TABS.some((t) => t.id === activeTab))
      setActiveTab(TABS[0].id);
  }, [TABS, activeTab]);

  const scopedTickets = useMemo(
    () =>
      tickets.filter(
        (t) =>
          t.status !== "CANCELLED" &&
          ticketVisibleToUser(t, categories, currentUser),
      ),
    [tickets, categories, currentUser],
  );
  const catOptions = useMemo(
    () => [
      ...new Set(scopedTickets.map((t) => t.category_name).filter(Boolean)),
    ],
    [scopedTickets],
  );
  const deptOptions = useMemo(
    () => [
      ...new Set(
        scopedTickets
          .map((t) => t.employee?.department?.department)
          .filter(Boolean),
      ),
    ],
    [scopedTickets],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scopedTickets
      .filter((t) => statusFilter === "All" || t.status === statusFilter)
      .filter((t) => priorityFilter === "All" || t.priority === priorityFilter)
      .filter(
        (t) => categoryFilter === "All" || t.category_name === categoryFilter,
      )
      .filter(
        (t) =>
          deptFilter === "All" ||
          t.employee?.department?.department === deptFilter,
      )
      .filter(
        (t) =>
          !q ||
          (t.subject || "").toLowerCase().includes(q) ||
          (t.employee?.f_name || "").toLowerCase().includes(q) ||
          (t.employee?.l_name || "").toLowerCase().includes(q) ||
          String(t.id).includes(q),
      )
      .sort((a, b) => {
        const pO = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        const pd = (pO[a.priority] || 2) - (pO[b.priority] || 2);
        return pd !== 0 ? pd : new Date(b.created_at) - new Date(a.created_at);
      });
  }, [
    scopedTickets,
    search,
    statusFilter,
    priorityFilter,
    categoryFilter,
    deptFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pendingCount = scopedTickets.filter((t) => t.status === "OPEN").length;

  const pageNums = useMemo(() => {
    const nums = Array.from({ length: totalPages }, (_, i) => i + 1);
    return nums
      .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
      .reduce((acc, n, i, arr) => {
        if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
        acc.push(n);
        return acc;
      }, []);
  }, [totalPages, page]);

  const sel = {
    padding: "8px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    appearance: "none",
  };

  if (loading)
    return (
      <div
        className="tm-root"
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 size={28} className="tm-spin" style={{ color: "#9ca3af" }} />
      </div>
    );
  if (!canOpenTicketManagement(currentUser, categories)) {
    return (
      <div
        className="tm-root"
        style={{
          minHeight: "100vh",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: 40,
            maxWidth: 420,
            textAlign: "center",
          }}
        >
          <Lock size={36} style={{ color: "#dc2626", marginBottom: 14 }} />

          <h2
            className="tm-serif"
            style={{
              margin: "0 0 10px",
              color: "#111827",
            }}
          >
            Access Denied
          </h2>

          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            You do not have permission to access Ticket Management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="tm-root"
      style={{ minHeight: "100vh", background: "#f9fafb" }}
    >
      <Toast toasts={toasts} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 28,
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <h1
                className="tm-serif"
                style={{ fontSize: 34, margin: 0, color: "#111827" }}
              >
                Ticket Management
              </h1>
              {SA && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#fef3c7",
                    border: "1px solid #fcd34d",
                    borderRadius: 99,
                    padding: "3px 10px",
                  }}
                >
                  <Star size={10} style={{ color: "#d97706" }} />
                  <span
                    style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}
                  >
                    Super Admin
                  </span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              HR · Manage, resolve and route employee support tickets
            </p>
          </div>
          <button
            onClick={load}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 4,
            marginBottom: 24,
            width: "fit-content",
          }}
        >
          {TABS.map(({ id, label, Icon, adminOnly }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 18px",
                  borderRadius: 11,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: "none",
                  position: "relative",
                  transition: "all .15s",
                  background: active ? "#111827" : "transparent",
                  color: active ? "#fff" : "#6b7280",
                }}
              >
                <Icon size={14} />
                {label}
                {adminOnly && <Lock size={10} style={{ opacity: 0.6 }} />}
                {id === "tickets" && pendingCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: active ? "#fff" : "#111827",
                      color: active ? "#111827" : "#fff",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by subject, name, dept…"
                  style={{
                    width: "100%",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: "8px 12px 8px 34px",
                    fontSize: 13,
                    background: "#f9fafb",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {[
                {
                  value: statusFilter,
                  set: setStatus,
                  opts: [
                    ["All", "All Status"],
                    ...Object.entries(STATUS).map(([k, v]) => [k, v.label]),
                  ],
                },
                {
                  value: priorityFilter,
                  set: setPriority,
                  opts: [
                    ["All", "All Priority"],
                    ...Object.entries(PRIORITY).map(([k, v]) => [k, v.label]),
                  ],
                },
                {
                  value: categoryFilter,
                  set: setCategory,
                  opts: [
                    ["All", "All Categories"],
                    ...catOptions.map((n) => [n, n]),
                  ],
                },
                {
                  value: deptFilter,
                  set: setDept,
                  opts: [
                    ["All", "All Depts"],
                    ...deptOptions.map((n) => [n, n]),
                  ],
                },
              ].map(({ value, set, opts }, i) => (
                <select
                  key={i}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  style={sel}
                >
                  {opts.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ))}
              {(search ||
                statusFilter !== "All" ||
                priorityFilter !== "All" ||
                categoryFilter !== "All" ||
                deptFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatus("All");
                    setPriority("All");
                    setCategory("All");
                    setDept("All");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "#9ca3af",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    borderRadius: 8,
                  }}
                >
                  <X size={11} />
                  Clear
                </button>
              )}
              <span
                style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}
              >
                {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {paged.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <Inbox
                  size={24}
                  style={{
                    color: "#e5e7eb",
                    display: "block",
                    margin: "0 auto 12px",
                  }}
                />
                <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
                  No tickets match your filters
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        background: "#fafafa",
                      }}
                    >
                      {[
                        "#",
                        "Subject",
                        "Employee",
                        "Dept · Role",
                        "Category",
                        "Priority",
                        "Status",
                        "Submitted",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#9ca3af",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((t, i) => {
                      const emp = t.employee;
                      const fullName = emp
                        ? `${emp.f_name || ""} ${emp.l_name || ""}`.trim()
                        : `#${t.employee_id}`;
                      const dept = emp?.department?.department || "—";
                      const role = emp?.designation || "—";
                      return (
                        <tr
                          key={t.id}
                          className="tm-fade-up"
                          onClick={() => setDetailId(t.id)}
                          style={{
                            borderBottom: "1px solid #f9fafb",
                            cursor: "pointer",
                            animationDelay: `${i * 20}ms`,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#fafafa")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 12,
                              color: "#9ca3af",
                              fontFamily: "monospace",
                            }}
                          >
                            #{t.id}
                          </td>
                          <td style={{ padding: "14px 16px", maxWidth: 160 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#111827",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t.subject}
                            </p>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  background: "#111827",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                {(fullName[0] || "?").toUpperCase()}
                              </div>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: "#111827",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {fullName}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: "#374151",
                                margin: 0,
                              }}
                            >
                              {dept}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                margin: "2px 0 0",
                              }}
                            >
                              {role}
                            </p>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span
                              style={{
                                fontSize: 11,
                                background: "#f9fafb",
                                color: "#4b5563",
                                padding: "4px 10px",
                                borderRadius: 8,
                                border: "1px solid #e5e7eb",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t.category_name || "—"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <PriorityBadge priority={t.priority} />
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <StatusBadge status={t.status} />
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: 12,
                              color: "#9ca3af",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmt(t.created_at)}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                color: "#9ca3af",
                              }}
                            >
                              <Eye size={12} />
                              Open
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 20px",
                  borderTop: "1px solid #f3f4f6",
                }}
              >
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#9ca3af",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: page === 1 ? 0.4 : 1,
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {pageNums.map((n, i) =>
                    n === "..." ? (
                      <span
                        key={`el-${i}`}
                        style={{
                          width: 32,
                          height: 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "#9ca3af",
                        }}
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: page === n ? "none" : "1px solid #e5e7eb",
                          background: page === n ? "#111827" : "#fff",
                          color: page === n ? "#fff" : "#4b5563",
                        }}
                      >
                        {n}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#9ca3af",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: page === totalPages ? 0.4 : 1,
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "dashboard" && (
          <DashboardTab stats={stats} tickets={scopedTickets} />
        )}

        {activeTab === "categories" && SA && (
          <CategoriesTab
            categories={categories}
            employees={employees}
            departments={departments}
            onRefresh={load}
            addToast={addToast}
            isSA={SA}
          />
        )}
      </div>

      {detailId && (
        <TicketSidebar
          ticketId={detailId}
          employees={employees}
          categories={categories}
          onClose={() => setDetailId(null)}
          onUpdated={() => {
            setDetailId(null);
            load();
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
