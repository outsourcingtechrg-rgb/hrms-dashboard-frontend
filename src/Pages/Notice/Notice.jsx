/**
 * AdminNoticePage.jsx — Notice Board Management
 *
 * Who can access: Super Admin (1), CEO (2), HR Admin (3), HR (4), Dept Head (6)
 * Department Heads: can only create notices for their own department.
 *
 * APIs consumed:
 *   GET    /notices/stats
 *   GET    /notices/?category=&priority=&audience_type=&is_active=&search=
 *   GET    /notices/{id}
 *   POST   /notices/
 *   PATCH  /notices/{id}
 *   DELETE /notices/{id}
 *   POST   /notices/{id}/pin
 *   POST   /notices/{id}/toggle
 *
 * Audience types:
 *   all          → Everyone
 *   departments  → Multi-select departments
 *   roles        → Multi-select roles
 *   selective    → Multi-select individual employees
 */

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Users,
  FileText,
  Edit3,
  Trash2,
  Eye,
  PlusCircle,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Filter,
  TrendingUp,
  Pin,
  PinOff,
  ToggleLeft,
  ToggleRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  Globe,
  Zap,
  Calendar,
  Tag,
  Shield,
  Megaphone,
  ChevronDown,
  Star,
  Layers,
  Heart,
  Cpu,
  DollarSign,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Inject styles ─── */
const STYLES = `
  @keyframes nbFadeIn  { from{opacity:0}                          to{opacity:1} }
  @keyframes nbSlideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes nbSlideRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes nbSpin    { to{transform:rotate(360deg)} }
  @keyframes nbPulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
  .nb-fade   { animation: nbFadeIn .2s ease-out; }
  .nb-up     { animation: nbSlideUp .28s cubic-bezier(.4,0,.2,1); }
  .nb-right  { animation: nbSlideRight .3s cubic-bezier(.4,0,.2,1); }
  .nb-spin   { animation: nbSpin .85s linear infinite; }
  .nb-pulse  { animation: nbPulse 1.8s ease-in-out infinite; }
`;
if (
  typeof document !== "undefined" &&
  !document.getElementById("__nb_admin_styles__")
) {
  const s = document.createElement("style");
  s.id = "__nb_admin_styles__";
  s.innerHTML = STYLES;
  document.head.appendChild(s);
}

/* ─── Auth ─── */
function getHeaders() {
  const t = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}
function getMyLevel() {
  try {
    const t = localStorage.getItem("access_token");
    if (!t) return 99;
    return JSON.parse(atob(t.split(".")[1])).level ?? 99;
  } catch {
    return 99;
  }
}

/* ─── Helpers ─── */
function fmtDate(iso) {
  return iso ? String(iso).slice(0, 10) : "—";
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ─── Config ─── */
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const CATEGORIES = [
  "General",
  "HR",
  "IT",
  "Finance",
  "Operations",
  "Health & Safety",
  "Event",
  "Policy Update",
];
const AUDIENCE_TYPES = [
  { value: "all", label: "All Employees", icon: Globe },
  { value: "departments", label: "By Department", icon: Building2 },
  { value: "roles", label: "By Role", icon: Shield },
  { value: "selective", label: "Specific Employees", icon: Users },
];
const ROLES_LIST = [
  "Super Admin",
  "CEO",
  "Finance",
  "HR Admin",
  "HR",
  "Department Head",
  "Lead",
  "Employee",
  "Intern",
];

const PRIORITY_CFG = {
  Low: {
    badge: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
    ring: "border-l-gray-300",
  },
  Medium: {
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    ring: "border-l-blue-400",
  },
  High: {
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    ring: "border-l-orange-400",
  },
  Urgent: {
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    ring: "border-l-red-500",
    extra: "nb-pulse",
  },
};

const CAT_CFG = {
  General: { color: "bg-gray-100 text-gray-700", icon: Megaphone },
  HR: { color: "bg-violet-100 text-violet-700", icon: Users },
  IT: { color: "bg-cyan-100 text-cyan-700", icon: Cpu },
  Finance: { color: "bg-green-100 text-green-700", icon: DollarSign },
  Operations: { color: "bg-blue-100 text-blue-700", icon: Layers },
  "Health & Safety": { color: "bg-orange-100 text-orange-700", icon: Heart },
  Event: { color: "bg-pink-100 text-pink-700", icon: Star },
  "Policy Update": { color: "bg-amber-100 text-amber-700", icon: FileText },
};

/* ─── Small shared components ─── */
function Toast({ msg, type = "success" }) {
  if (!msg) return null;
  const bg = type === "error" ? "bg-red-600" : "bg-emerald-600";
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl pointer-events-none nb-fade ${bg}`}
    >
      {type === "error" ? (
        <AlertCircle size={15} />
      ) : (
        <CheckCircle2 size={15} />
      )}{" "}
      {msg}
    </div>
  );
}

function PriorityDot({ priority, size = "sm" }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.Medium;
  const sz = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  return (
    <span
      className={`${sz} rounded-full flex-shrink-0 ${cfg.dot} ${priority === "Urgent" ? cfg.extra : ""}`}
    />
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.Medium;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}
    >
      <PriorityDot priority={priority} /> {priority}
    </span>
  );
}

function CategoryBadge({ category }) {
  const cfg = CAT_CFG[category] || CAT_CFG["General"];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${cfg.color}`}
    >
      <Icon size={11} /> {category}
    </span>
  );
}

function AudiencePill({ notice }) {
  if (notice.audience_type === "all")
    return (
      <span className="text-xs text-gray-500 flex items-center gap-1">
        <Globe size={11} /> All Employees
      </span>
    );
  if (notice.audience_type === "departments") {
    const names = notice.department_names || [];
    return (
      <span className="text-xs text-gray-500 flex items-center gap-1">
        <Building2 size={11} />{" "}
        {names.length > 0
          ? names.slice(0, 2).join(", ") +
            (names.length > 2 ? ` +${names.length - 2}` : "")
          : "—"}
      </span>
    );
  }
  if (notice.audience_type === "roles") {
    const roles = notice.audience_roles || [];
    return (
      <span className="text-xs text-gray-500 flex items-center gap-1">
        <Shield size={11} />{" "}
        {roles.length > 0
          ? roles.slice(0, 2).join(", ") +
            (roles.length > 2 ? ` +${roles.length - 2}` : "")
          : "—"}
      </span>
    );
  }
  if (notice.audience_type === "selective") {
    const ids = notice.employee_ids || [];
    return (
      <span className="text-xs text-gray-500 flex items-center gap-1">
        <Users size={11} /> {ids.length} employee{ids.length !== 1 ? "s" : ""}
      </span>
    );
  }
  return null;
}

/* ─── Multi-select dropdown ─── */
function MultiSelect({ options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
    else onChange([...selected, val]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 transition text-left"
      >
        <span
          className={selected.length === 0 ? "text-gray-400" : "text-gray-800"}
        >
          {selected.length === 0
            ? placeholder
            : selected.slice(0, 3).join(", ") +
              (selected.length > 3 ? ` +${selected.length - 3}` : "")}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto nb-fade">
          {options.map((opt) => {
            const label = typeof opt === "object" ? opt.label : opt;
            const value = typeof opt === "object" ? opt.value : opt;
            const checked = selected.includes(value);
            return (
              <label
                key={value}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(value)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Notice Form Modal ─── */
const EMPTY_FORM = {
  title: "",
  content: "",
  category: "General",
  priority: "Medium",
  audience_type: "all",
  department_ids: [],
  audience_roles: [],
  employee_ids: [],
  pinned: false,
  is_active: true,
  send_email: false,
  expires_at: "",
};

function NoticeFormModal({
  notice,
  departments,
  employees,
  myLevel,
  myDeptId,
  onClose,
  onSaved,
  showToast,
}) {
  const isEdit = !!notice;
  const isDeptHead = myLevel === 6;

  const [form, setForm] = useState(
    isEdit
      ? {
          title: notice.title,
          content: notice.content,
          category: notice.category,
          priority: notice.priority,
          audience_type: isDeptHead ? "departments" : notice.audience_type,
          department_ids: isDeptHead ? [myDeptId] : notice.department_ids || [],
          audience_roles: notice.audience_roles || [],
          employee_ids: notice.employee_ids || [],
          pinned: notice.pinned,
          is_active: notice.is_active,
          send_email: notice.send_email || false,
          expires_at: notice.expires_at
            ? String(notice.expires_at).slice(0, 10)
            : "",
        }
      : {
          ...EMPTY_FORM,
          ...(isDeptHead
            ? { audience_type: "departments", department_ids: [myDeptId] }
            : {}),
        },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.content.trim()) e.content = "Required";
    if (
      form.audience_type === "departments" &&
      form.department_ids.length === 0
    )
      e.audience = "Select at least one department";
    if (form.audience_type === "roles" && form.audience_roles.length === 0)
      e.audience = "Select at least one role";
    if (form.audience_type === "selective" && form.employee_ids.length === 0)
      e.audience = "Enter at least one employee ID";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      priority: form.priority,
      audience_type: form.audience_type,
      department_ids: form.department_ids,
      audience_roles: form.audience_roles,
      employee_ids: form.employee_ids,
      pinned: form.pinned,
      is_active: form.is_active,
      send_email: form.send_email,
      expires_at: form.expires_at || null,
    };

    try {
      const url = isEdit ? API.UpdateNotice(notice.id) : API.CreateNotice;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail || `Error ${res.status}`);
      }
      const saved = await res.json();
      showToast(isEdit ? "Notice updated." : "Notice published!", "success");
      onSaved(saved);
      onClose();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const AudType = AUDIENCE_TYPES.find((a) => a.value === form.audience_type);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm nb-fade">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Megaphone size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">
                {isEdit ? "Edit Notice" : "Create Notice"}
              </h2>
              <p className="text-xs text-gray-400">
                {isEdit ? "Update notice details" : "Publish to your audience"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
              Notice Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Office closed for Eid holidays"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition ${errors.title ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Category", key: "category", opts: CATEGORIES },
              { label: "Priority", key: "priority", opts: PRIORITIES },
            ].map(({ label, key, opts }) => (
              <div key={key}>
                <label className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                  {label}
                </label>
                <select
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 cursor-pointer transition"
                >
                  {opts.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Priority preview */}
          <div className="flex items-center gap-2">
            <PriorityBadge priority={form.priority} />
            <CategoryBadge category={form.category} />
            {form.priority === "Urgent" && (
              <span className="text-xs text-red-600 font-medium">
                Urgent notices are highlighted prominently
              </span>
            )}
          </div>

          {/* Audience Type */}
          {!isDeptHead && (
            <div>
              <label className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">
                Audience
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCE_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set("audience_type", value)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition ${
                      form.audience_type === value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon
                      size={15}
                      className={
                        form.audience_type === value
                          ? "text-blue-600"
                          : "text-gray-400"
                      }
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Audience Details */}
          {(form.audience_type === "departments" || isDeptHead) && (
            <div>
              <label className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                {isDeptHead ? "Department (your dept)" : "Select Departments *"}
              </label>
              {isDeptHead ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600">
                  {departments.find((d) => d.id === myDeptId)?.department ||
                    `Dept #${myDeptId}`}{" "}
                  (locked)
                </div>
              ) : (
                <MultiSelect
                  options={departments.map((d) => ({
                    value: d.id,
                    label: d.department,
                  }))}
                  selected={form.department_ids}
                  onChange={(v) => set("department_ids", v)}
                  placeholder="Choose departments…"
                />
              )}
              {errors.audience && (
                <p className="text-xs text-red-500 mt-1">{errors.audience}</p>
              )}
            </div>
          )}

          {!isDeptHead && form.audience_type === "roles" && (
            <div>
              <label className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                Select Roles *
              </label>
              <MultiSelect
                options={ROLES_LIST}
                selected={form.audience_roles}
                onChange={(v) => set("audience_roles", v)}
                placeholder="Choose roles…"
              />
              {errors.audience && (
                <p className="text-xs text-red-500 mt-1">{errors.audience}</p>
              )}
            </div>
          )}

          {!isDeptHead && form.audience_type === "selective" && (
            <div>
              <label className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                Select Employees *
              </label>
              <MultiSelect
                options={(employees || []).map((e) => ({
                  value: e.id,
                  label: `${e.f_name} ${e.l_name}${e.employee_id ? ` (ID: ${e.employee_id})` : ""}`,
                }))}
                selected={form.employee_ids}
                onChange={(v) => set("employee_ids", v)}
                placeholder="Choose employees…"
              />
              {form.employee_ids.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {form.employee_ids.length} employee
                  {form.employee_ids.length !== 1 ? "s" : ""} selected
                </p>
              )}
              {errors.audience && (
                <p className="text-xs text-red-500 mt-1">{errors.audience}</p>
              )}
            </div>
          )}

          {/* Content */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
              Notice Content *
            </label>
            <textarea
              rows={6}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Write your notice here…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 resize-none transition leading-relaxed ${errors.content ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.content && (
              <p className="text-xs text-red-500 mt-1">{errors.content}</p>
            )}
            <div className="text-right text-xs text-gray-400 mt-1">
              {form.content.length} chars
            </div>
          </div>

          {/* Expiry + Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
                Expires On{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => set("expires_at", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition"
              />
            </div>
            <div className="space-y-2 pt-5">
              {[
                { key: "pinned", label: "Pin Notice", desc: "Float to top" },
                {
                  key: "is_active",
                  label: "Publish Now",
                  desc: "Make visible",
                },
                {
                  key: "send_email",
                  label: "Send Email",
                  desc: "Email to users",
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-200"
                >
                  <div>
                    <div className="text-xs font-semibold text-gray-700">
                      {label}
                    </div>
                    <div className="text-[10px] text-gray-400">{desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => set(key, !form[key])}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${form[key] ? "bg-blue-600" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form[key] ? "left-[18px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50/50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="nb-spin" /> Saving…
              </>
            ) : (
              <>
                <Megaphone size={14} />{" "}
                {isEdit ? "Save Changes" : "Publish Notice"}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 text-sm font-medium rounded-xl transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Notice Detail Sidebar ─── */
function NoticeSidebar({
  noticeId,
  myLevel,
  onClose,
  onEdit,
  onDelete,
  onUpdated,
  showToast,
}) {
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!noticeId) return;
    setLoading(true);
    fetch(API.NoticeById(noticeId), { headers: getHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setNotice(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [noticeId]);

  const canManage = [1, 2, 3, 4, 6].includes(myLevel);
  const canAdmin = [1, 2, 3, 4].includes(myLevel);

  const doAction = async (url, method = "POST") => {
    setActing(true);
    try {
      const res = await fetch(url, { method, headers: getHeaders() });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail || `Error ${res.status}`);
      }
      const updated = await res.json();
      setNotice(updated);
      onUpdated(updated);
      return updated;
    } catch (err) {
      showToast(err.message, "error");
      return null;
    } finally {
      setActing(false);
    }
  };

  const ackPct = notice
    ? notice.total_recipients > 0
      ? Math.round((notice.ack_count / notice.total_recipients) * 100)
      : 0
    : 0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm nb-fade"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 z-[51] w-full sm:w-[500px] bg-white shadow-2xl flex flex-col nb-right">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b border-gray-100 ${notice ? `border-l-4 ${PRIORITY_CFG[notice.priority]?.ring || "border-l-gray-300"}` : ""}`}
        >
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 w-48 bg-gray-100 rounded-lg" />
              <div className="h-3 w-32 bg-gray-100 rounded-lg" />
            </div>
          ) : notice ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <PriorityBadge priority={notice.priority} />
                  <CategoryBadge category={notice.category} />
                  {notice.pinned && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                      <Pin size={9} /> Pinned
                    </span>
                  )}
                  {!notice.is_active && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-gray-900 leading-snug">
                  {notice.title}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  By {notice.created_by_name || "Unknown"} ·{" "}
                  {fmtDateTime(notice.created_at)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition flex-shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-red-500">Notice not found.</p>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="nb-spin text-gray-300" />
          </div>
        ) : notice ? (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Audience info */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
                Audience
              </div>
              <AudiencePill notice={notice} />
              {notice.audience_type === "departments" &&
                notice.department_names?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {notice.department_names.map((n) => (
                      <span
                        key={n}
                        className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg font-medium"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                )}
              {notice.audience_type === "roles" &&
                notice.audience_roles?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {notice.audience_roles.map((r) => (
                      <span
                        key={r}
                        className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-lg font-medium"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              {notice.audience_type === "selective" && (
                <p className="text-xs text-gray-500 mt-1">
                  {(notice.employee_ids || []).length} specific employee
                  {(notice.employee_ids || []).length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Created", value: fmtDate(notice.created_at) },
                { label: "Updated", value: fmtDate(notice.updated_at) },
                {
                  label: "Expires",
                  value: notice.expires_at
                    ? fmtDate(notice.expires_at)
                    : "Never",
                },
                {
                  label: "Status",
                  value: notice.is_active ? "Active" : "Inactive",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                >
                  <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">
                    {label}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Acknowledgement */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                  Acknowledgements
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {notice.ack_count}/{notice.total_recipients}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${ackPct >= 80 ? "bg-emerald-500" : ackPct >= 50 ? "bg-blue-500" : "bg-amber-400"}`}
                  style={{ width: `${ackPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>{ackPct}% acknowledged</span>
                {notice.total_recipients - notice.ack_count > 0 && (
                  <span>
                    {notice.total_recipients - notice.ack_count} pending
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">
                Content
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 max-h-72 overflow-y-auto">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {notice.content}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer actions */}
        {notice && canManage && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2">
            <button
              onClick={() => {
                onEdit(notice);
                onClose();
              }}
              disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-40"
            >
              <Edit3 size={13} /> Edit
            </button>
            {canAdmin && (
              <>
                <button
                  onClick={() =>
                    doAction(API.PinNotice(notice.id)).then(
                      (u) => u && showToast(u.pinned ? "Pinned!" : "Unpinned."),
                    )
                  }
                  disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-xl transition disabled:opacity-40"
                >
                  {notice.pinned ? (
                    <>
                      <PinOff size={13} /> Unpin
                    </>
                  ) : (
                    <>
                      <Pin size={13} /> Pin
                    </>
                  )}
                </button>
                <button
                  onClick={() =>
                    doAction(API.ToggleNotice(notice.id)).then(
                      (u) =>
                        u &&
                        showToast(u.is_active ? "Activated." : "Deactivated."),
                    )
                  }
                  disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition disabled:opacity-40"
                >
                  {notice.is_active ? (
                    <>
                      <ToggleLeft size={13} /> Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight size={13} /> Activate
                    </>
                  )}
                </button>
              </>
            )}
            <button
              onClick={() => {
                onDelete(notice);
                onClose();
              }}
              disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition disabled:opacity-40"
            >
              <Trash2 size={13} /> Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition text-center"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Delete Confirm ─── */
function DeleteConfirm({ notice, onConfirm, onCancel, loading }) {
  if (!notice) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm nb-fade">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-[calc(100vw-32px)] shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900 text-center mb-1">
          Delete Notice?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-2">
          This will permanently remove:
        </p>
        <p className="text-sm font-bold text-gray-800 text-center mb-5 px-4 line-clamp-2">
          "{notice.title}"
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={13} className="nb-spin" /> : null} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Notice Card (table row) ─── */
function NoticeRow({ notice, idx, myLevel, onView, onEdit, onDelete, onPin }) {
  const pCfg = PRIORITY_CFG[notice.priority] || PRIORITY_CFG.Medium;
  const ackPct =
    notice.total_recipients > 0
      ? Math.round(((notice.ack_count || 0) / notice.total_recipients) * 100)
      : 0;
  const canManage = [1, 2, 3, 4, 6].includes(myLevel);
  const canAdmin = [1, 2, 3, 4].includes(myLevel);

  return (
    <tr
      className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-blue-50/30 transition border-b border-gray-50 last:border-0 border-l-2 ${notice.pinned ? "border-l-blue-400" : `border-l-transparent`}`}
    >
      {/* Title */}
      <td className="py-3 px-4 cursor-pointer max-w-xs" onClick={onView}>
        <div className="flex items-start gap-2">
          <PriorityDot priority={notice.priority} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {notice.pinned && (
                <Pin size={10} className="text-blue-500 flex-shrink-0" />
              )}
              {!notice.is_active && (
                <BellOff size={10} className="text-gray-400 flex-shrink-0" />
              )}
              <span className="text-sm font-semibold text-gray-800 line-clamp-1">
                {notice.title}
              </span>
            </div>
            <div className="mt-0.5">
              <AudiencePill notice={notice} />
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <PriorityBadge priority={notice.priority} />
      </td>
      <td className="py-3 px-4 text-center">
        <CategoryBadge category={notice.category} />
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${ackPct >= 80 ? "bg-emerald-500" : ackPct >= 50 ? "bg-blue-500" : "bg-amber-400"}`}
              style={{ width: `${ackPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 tabular-nums whitespace-nowrap">
            {notice.ack_count || 0}/{notice.total_recipients}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-center text-xs text-gray-400 tabular-nums whitespace-nowrap">
        {fmtDate(notice.created_at)}
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={onView}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition"
            title="View"
          >
            <Eye size={13} />
          </button>
          {canManage && (
            <button
              onClick={() => onEdit(notice)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 transition"
              title="Edit"
            >
              <Edit3 size={13} />
            </button>
          )}
          {canAdmin && (
            <button
              onClick={() => onPin(notice)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition ${notice.pinned ? "border-blue-200 text-blue-500 bg-blue-50" : "border-gray-200 text-gray-400 hover:border-blue-200 hover:text-blue-500"}`}
              title="Pin"
            >
              <Pin size={13} />
            </button>
          )}
          {canManage && (
            <button
              onClick={() => onDelete(notice)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Admin Notice Page
═══════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 12;

export default function AdminNoticePage() {
  const myLevel = useMemo(() => getMyLevel(), []);
  const canManage = [1, 2, 3, 4, 6].includes(myLevel);

  // Get own dept id from JWT (adjust key as needed)
  const myDeptId = useMemo(() => {
    try {
      const t = localStorage.getItem("access_token");
      if (!t) return null;
      return JSON.parse(atob(t.split(".")[1])).department_id ?? null;
    } catch {
      return null;
    }
  }, []);

  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoad, setStatsLoad] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCat, setFilterCat] = useState("All");
  const [filterAudType, setFilterAudType] = useState("All");
  const [filterActive, setFilterActive] = useState("All");
  const [page, setPage] = useState(1);

  const [viewNoticeId, setViewNoticeId] = useState(null);
  const [editNotice, setEditNotice] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch departments for the form
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch(
        API.ListDepartment || `${API.BaseURL}/departments/`,
        { headers: getHeaders() },
      );
      if (res.ok) {
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : data.departments || []);
      }
    } catch {
      /* silent */
    }
  }, []);

  // Fetch employees for the form
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(API.GetAllEmployees(), { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : data.employees || []);
      }
    } catch {
      /* silent */
    }
  }, []);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API.GetAllNotices(), { headers: getHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setNotices(Array.isArray(data) ? data : data.notices || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoad(true);
    try {
      const res = await fetch(API.NoticeStats, { headers: getHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {
      /* silent */
    } finally {
      setStatsLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
    fetchStats();
    fetchDepartments();
    fetchEmployees();
  }, []);

  const upsertNotice = useCallback((updated) => {
    setNotices((prev) => {
      const idx = prev.findIndex((n) => n.id === updated.id);
      return idx >= 0
        ? prev.map((n) => (n.id === updated.id ? updated : n))
        : [updated, ...prev];
    });
  }, []);

  const removeNotice = useCallback(
    (id) => setNotices((prev) => prev.filter((n) => n.id !== id)),
    [],
  );

  const handlePin = useCallback(
    async (notice) => {
      try {
        const res = await fetch(API.PinNotice(notice.id), {
          method: "POST",
          headers: getHeaders(),
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const updated = await res.json();
        upsertNotice(updated);
        showToast(updated.pinned ? "Notice pinned." : "Notice unpinned.");
      } catch (e) {
        showToast(e.message, "error");
      }
    },
    [upsertNotice, showToast],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(API.DeleteNotice(deleteTarget.id), {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      removeNotice(deleteTarget.id);
      setDeleteTarget(null);
      showToast("Notice deleted.");
      fetchStats();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, removeNotice, showToast, fetchStats]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...notices]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        // Priority order: Urgent > High > Medium > Low
        const pOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
        if (a.priority !== b.priority)
          return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      })
      .filter(
        (n) =>
          (!q ||
            (n.title || "").toLowerCase().includes(q) ||
            (n.category || "").toLowerCase().includes(q) ||
            (n.created_by_name || "").toLowerCase().includes(q)) &&
          (filterPriority === "All" || n.priority === filterPriority) &&
          (filterCat === "All" || n.category === filterCat) &&
          (filterAudType === "All" || n.audience_type === filterAudType) &&
          (filterActive === "All" ||
            (filterActive === "Active" ? n.is_active : !n.is_active)),
      );
  }, [notices, search, filterPriority, filterCat, filterAudType, filterActive]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sf = (fn) => {
    fn();
    setPage(1);
  };

  // Category breakdown for chart
  const catBreakdown = useMemo(() => {
    const map = {};
    notices.forEach((n) => {
      map[n.category] = (map[n.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [notices]);

  // Priority breakdown
  const priorityBreakdown = useMemo(() => {
    const order = ["Urgent", "High", "Medium", "Low"];
    return order.map((p) => ({
      priority: p,
      count: notices.filter((n) => n.priority === p).length,
    }));
  }, [notices]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 lg:px-8 py-10 text-gray-900">
      {/* Header */}
      <header className="mb-7 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <Megaphone size={18} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Notice Board</h1>
          </div>
          <p className="text-sm text-gray-500 ml-[52px]">
            Manage & publish company announcements · {new Date().toDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => {
              fetchNotices();
              fetchStats();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 text-xs font-semibold rounded-xl transition disabled:opacity-40 shadow-sm"
          >
            <RefreshCw size={13} className={loading ? "nb-spin" : ""} />
          </button>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-sm whitespace-nowrap"
            >
              <PlusCircle size={16} /> New Notice
            </button>
          )}
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-6">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button
            onClick={() => {
              fetchNotices();
              fetchStats();
            }}
            className="text-xs font-semibold text-red-600 hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          {
            title: "Total",
            value: stats?.total ?? "—",
            icon: Bell,
            color: "bg-blue-50 text-blue-700 border-blue-200",
          },
          {
            title: "Active",
            value: stats?.active ?? "—",
            icon: CheckCircle2,
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          },
          {
            title: "Pinned",
            value: stats?.pinned ?? "—",
            icon: Pin,
            color: "bg-indigo-50 text-indigo-700 border-indigo-200",
          },
          {
            title: "Urgent",
            value: stats?.urgent ?? "—",
            icon: Zap,
            color: "bg-red-50 text-red-700 border-red-200",
          },
          {
            title: "Avg Ack Rate",
            value: stats ? `${Math.round(stats.avg_ack_rate)}%` : "—",
            icon: TrendingUp,
            color: "bg-amber-50 text-amber-700 border-amber-200",
          },
        ].map(({ title, value, icon: Icon, color }) => (
          <div
            key={title}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${color}`}
            >
              <Icon size={17} />
            </div>
            <div>
              <div className="text-xs text-gray-400">{title}</div>
              {statsLoad ? (
                <div className="h-7 w-10 bg-gray-100 rounded animate-pulse mt-0.5" />
              ) : (
                <div className="text-2xl font-bold text-gray-900">{value}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Priority pills (quick filter) */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: "All", val: "All" },
          ...priorityBreakdown.map((p) => ({
            label: p.priority,
            val: p.priority,
            count: p.count,
          })),
        ].map(({ label, val, count }) => {
          const cfg = PRIORITY_CFG[val] || {};
          const active = filterPriority === val;
          return (
            <button
              key={val}
              onClick={() => sf(() => setFilterPriority(val))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition shadow-sm hover:shadow-md ${
                val === "All"
                  ? active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  : active
                    ? `${cfg.badge} border-current ring-2 ring-offset-1 ring-current`
                    : `bg-white border-gray-200 text-gray-600 hover:border-gray-300`
              }`}
            >
              {val !== "All" && <PriorityDot priority={val} />}
              {label}
              {count !== undefined && (
                <span className="text-xs opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Category breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            By Category
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="nb-spin text-gray-300" />
            </div>
          ) : catBreakdown.length > 0 ? (
            <div className="space-y-2.5">
              {catBreakdown.map(([cat, count]) => {
                const Icon = CAT_CFG[cat]?.icon || Megaphone;
                const pct = notices.length
                  ? Math.round((count / notices.length) * 100)
                  : 0;
                const active = filterCat === cat;
                return (
                  <div
                    key={cat}
                    onClick={() => sf(() => setFilterCat(active ? "All" : cat))}
                    className={`flex items-center gap-3 cursor-pointer rounded-xl px-2 py-1.5 group transition ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${CAT_CFG[cat]?.color}`}
                    >
                      <Icon size={12} />
                    </div>
                    <span
                      className={`w-28 text-xs font-semibold truncate flex-shrink-0 transition ${active ? "text-blue-700" : "text-gray-600"}`}
                    >
                      {cat}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${active ? "bg-blue-600" : "bg-blue-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600 w-5 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-gray-400">
              No notices yet
            </div>
          )}
        </div>

        {/* Top notices by ack rate */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Acknowledgement Overview
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="nb-spin text-gray-300" />
            </div>
          ) : notices.filter((n) => n.is_active).length > 0 ? (
            <div className="space-y-2.5">
              {notices
                .filter((n) => n.is_active)
                .map((n) => {
                  const pct =
                    n.total_recipients > 0
                      ? Math.round(
                          ((n.ack_count || 0) / n.total_recipients) * 100,
                        )
                      : 0;
                  return (
                    <div key={n.id} className="flex items-center gap-3">
                      <PriorityDot priority={n.priority} />
                      <span className="text-xs text-gray-600 truncate flex-shrink-0 w-32">
                        {n.title.substring(0, 22)}
                        {n.title.length > 22 ? "…" : ""}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600 tabular-nums w-10 text-right">
                        {pct}%
                      </span>
                    </div>
                  );
                })
                .slice(0, 7)}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-gray-400">
              No active notices
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-gray-400 flex-shrink-0" />
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => sf(() => setSearch(e.target.value))}
            placeholder="Search notices…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition placeholder-gray-400"
          />
        </div>
        {[
          {
            val: filterCat,
            set: setFilterCat,
            ph: "All Categories",
            opts: CATEGORIES,
          },
          {
            val: filterAudType,
            set: setFilterAudType,
            ph: "All Audiences",
            opts: [
              { v: "all", l: "All Employees" },
              { v: "departments", l: "Departments" },
              { v: "roles", l: "Roles" },
              { v: "selective", l: "Selective" },
            ],
          },
          {
            val: filterActive,
            set: setFilterActive,
            ph: "All Status",
            opts: ["Active", "Inactive"],
          },
        ].map(({ val, set, ph, opts }) => (
          <select
            key={ph}
            value={val}
            onChange={(e) => sf(() => set(e.target.value))}
            className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-400 cursor-pointer transition text-gray-700"
          >
            <option value="All">{ph}</option>
            {opts.map((o) =>
              typeof o === "string" ? (
                <option key={o}>{o}</option>
              ) : (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ),
            )}
          </select>
        ))}
        {(filterPriority !== "All" ||
          filterCat !== "All" ||
          filterAudType !== "All" ||
          filterActive !== "All" ||
          search) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterPriority("All");
              setFilterCat("All");
              setFilterAudType("All");
              setFilterActive("All");
              setPage(1);
            }}
            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition whitespace-nowrap"
          >
            Clear all
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} notice{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">All Notices</h2>
          <span className="text-xs text-gray-400">
            {filtered.length} notice{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Notice",
                  "Priority",
                  "Category",
                  "Ack Rate",
                  "Created",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`py-3 px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap ${i === 0 ? "text-left" : "text-center"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2
                      size={24}
                      className="mx-auto mb-3 nb-spin text-gray-300"
                    />
                    <p className="text-sm text-gray-400">Loading notices…</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Bell size={36} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-400">No notices found.</p>
                    {canManage && (
                      <button
                        onClick={() => setShowCreate(true)}
                        className="mt-3 text-sm text-blue-600 font-semibold hover:underline"
                      >
                        + Create first notice
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((n, i) => (
                  <NoticeRow
                    key={n.id}
                    notice={n}
                    idx={i}
                    myLevel={myLevel}
                    onView={() => setViewNoticeId(n.id)}
                    onEdit={(notice) => setEditNotice(notice)}
                    onDelete={(notice) => setDeleteTarget(notice)}
                    onPin={handlePin}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 text-sm text-gray-600 transition"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs text-gray-500">
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 text-sm text-gray-600 transition"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <NoticeFormModal
          departments={departments}
          employees={employees}
          myLevel={myLevel}
          myDeptId={myDeptId}
          onClose={() => setShowCreate(false)}
          onSaved={(saved) => {
            upsertNotice(saved);
            fetchStats();
          }}
          showToast={showToast}
        />
      )}
      {editNotice && (
        <NoticeFormModal
          notice={editNotice}
          departments={departments}
          employees={employees}
          myLevel={myLevel}
          myDeptId={myDeptId}
          onClose={() => setEditNotice(null)}
          onSaved={(saved) => {
            upsertNotice(saved);
            setEditNotice(null);
            fetchStats();
          }}
          showToast={showToast}
        />
      )}
      {viewNoticeId && (
        <NoticeSidebar
          noticeId={viewNoticeId}
          myLevel={myLevel}
          onClose={() => setViewNoticeId(null)}
          onEdit={(n) => {
            setViewNoticeId(null);
            setEditNotice(n);
          }}
          onDelete={(n) => {
            setViewNoticeId(null);
            setDeleteTarget(n);
          }}
          onUpdated={upsertNotice}
          showToast={showToast}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          notice={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}
