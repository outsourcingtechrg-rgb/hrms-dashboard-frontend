/**
 * AdminPolicyPage.jsx  —  UPDATED with CEO Approval Workflow
 *
 * New workflow buttons (contextual based on policy.status + role):
 *   HR / HR Admin (level 3-4):
 *     Draft  → "Submit for Review"  → POST /policies/{id}/submit-review
 *     Review (approved) → "Publish" → POST /policies/{id}/publish
 *
 *   CEO / Super Admin (level 1-2):
 *     Review → "Approve"            → POST /policies/{id}/approve
 *     Review → "Reject"             → POST /policies/{id}/reject
 *
 * New sidebar sections:
 *   - Approval badge (Approved by / Pending / Rejected)
 *   - Approve / Reject / Submit / Publish buttons in sidebar footer
 *
 * New stat widget: Pending Approval count
 *
 * API additions consumed:
 *   SubmitReview : POST /policies/{id}/submit-review
 *   Approve      : POST /policies/{id}/approve
 *   Reject       : POST /policies/{id}/reject
 *   Publish      : POST /policies/{id}/publish
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  X, Search, ChevronLeft, ChevronRight, Shield,
  Users, FileText, Edit3, Trash2, Eye, PlusCircle, Send,
  Building2, CheckCircle2, XCircle, Clock,
  AlertTriangle, Lock, Star,
  Filter, TrendingUp, Award,
  Pin, PinOff, ToggleLeft, ToggleRight,
  Layers, Loader2, RefreshCw, AlertCircle,
  ThumbsUp, ThumbsDown, Upload, SendHorizonal,
  BadgeCheck, Hourglass,
} from "lucide-react";
import { API } from "../../Components/Apis";

/* ─── Animations ─── */
const STYLES = `
  @keyframes fadeIn { from{opacity:0}to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
  @keyframes slideInRight { from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1} }
  @keyframes apSpin { to{transform:rotate(360deg)} }
  .fade-in        { animation: fadeIn .22s ease-out; }
  .slide-up       { animation: slideUp .28s ease-out forwards; }
  .slide-in-right { animation: slideInRight .32s cubic-bezier(.4,0,.2,1); }
  .ap-spin        { animation: apSpin .85s linear infinite; }
`;
if (typeof document !== "undefined" && !document.getElementById("__apo_styles__")) {
  const s = document.createElement("style");
  s.id = "__apo_styles__";
  s.innerHTML = STYLES;
  document.head.appendChild(s);
}

/* ─── Auth ─── */
function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ─── JWT decode (level extraction) ─── */
function getMyLevel() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return 99;
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Adjust the key below to match whatever your JWT payload uses
    return payload.level ?? payload.role_level ?? 99;
  } catch {
    return 99;
  }
}

/* ─── Date formatter ─── */
function fmtDate(iso) {
  if (!iso) return "—";
  return String(iso).slice(0, 10);
}

/* ─── Config ─── */
const CATEGORIES = [
  "HR Policy", "IT & Security", "Finance", "Legal",
  "Health & Safety", "Operations", "Code of Conduct", "Benefits",
];

const CAT_CFG = {
  "HR Policy":       { color: "bg-violet-50 text-violet-700",  border: "border-violet-200", icon: Users         },
  "IT & Security":   { color: "bg-cyan-50 text-cyan-700",      border: "border-cyan-200",   icon: Lock          },
  "Finance":         { color: "bg-green-50 text-green-700",    border: "border-green-200",  icon: Building2     },
  "Legal":           { color: "bg-red-50 text-red-700",        border: "border-red-200",    icon: Shield        },
  "Health & Safety": { color: "bg-orange-50 text-orange-700",  border: "border-orange-200", icon: AlertTriangle },
  "Operations":      { color: "bg-blue-50 text-blue-700",      border: "border-blue-200",   icon: Layers        },
  "Code of Conduct": { color: "bg-gray-50 text-gray-700",      border: "border-gray-200",   icon: Award         },
  "Benefits":        { color: "bg-amber-50 text-amber-700",    border: "border-amber-200",  icon: Star          },
};

const STATUS_CFG = {
  Active:   { badge: "bg-green-100 text-green-800",   icon: CheckCircle2  },
  Draft:    { badge: "bg-gray-100 text-gray-600",     icon: Clock         },
  Archived: { badge: "bg-red-100 text-red-700",       icon: XCircle       },
  Review:   { badge: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
};

const AUDIENCES = [
  "All Employees", "HR", "Engineering", "Finance",
  "Sales", "Design", "Operations", "Management", "IT",
];

/* ─── Shared UI ─── */
function IconBadge({ icon: Icon, color }) {
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${color}`}>
      <Icon className="w-5 h-5" />
    </span>
  );
}
function Widget({ title, value, sub, icon, color, loading }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex gap-4 items-center">
      <IconBadge icon={icon} color={color} />
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        {loading
          ? <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse mt-1" />
          : <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>}
        {sub && !loading && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
function Card({ title, children, action }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-sm font-medium text-gray-500">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
function Toast({ msg, type = "success" }) {
  if (!msg) return null;
  const bg = type === "error" ? "bg-red-600" : "bg-emerald-600";
  const Icon = type === "error" ? XCircle : CheckCircle2;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl pointer-events-none fade-in ${bg}`}>
      <Icon size={15} /> {msg}
    </div>
  );
}

/* ─── Approval Status Badge ─── */
function ApprovalBadge({ policy }) {
  if (policy.status === "Active") return null; // already published
  if (policy.status === "Draft" && !policy.approved_by) return null;

  if (policy.status === "Review" && policy.approved_by) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
        <BadgeCheck size={14} className="text-emerald-600 flex-shrink-0" />
        <div>
          <span className="font-semibold text-emerald-700">CEO Approved</span>
          <span className="text-emerald-600"> by {policy.approved_by_name}</span>
          {policy.approved_at && <span className="text-emerald-500"> · {fmtDate(policy.approved_at)}</span>}
          {policy.approval_note && <p className="text-emerald-600 mt-0.5 italic">"{policy.approval_note}"</p>}
        </div>
      </div>
    );
  }

  if (policy.status === "Review" && !policy.approved_by) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs">
        <Hourglass size={14} className="text-amber-600 flex-shrink-0" />
        <div>
          <span className="font-semibold text-amber-700">Awaiting CEO Approval</span>
          {policy.submitted_for_review_at && (
            <span className="text-amber-600"> · Submitted {fmtDate(policy.submitted_for_review_at)}</span>
          )}
        </div>
      </div>
    );
  }

  if (policy.status === "Draft" && policy.approval_note) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs">
        <ThumbsDown size={14} className="text-red-500 flex-shrink-0" />
        <div>
          <span className="font-semibold text-red-700">Returned by CEO</span>
          <p className="text-red-600 mt-0.5 italic">"{policy.approval_note}"</p>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Reject Modal ─── */
function RejectModal({ onConfirm, onCancel, loading }) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-[calc(100vw-32px)] shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <ThumbsDown size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Reject Policy?</h2>
        <p className="text-sm text-gray-500 text-center mb-4">Add a note explaining what needs to be changed.</p>
        <textarea
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Rejection reason (optional but recommended)…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
            Cancel
          </button>
          <button onClick={() => onConfirm(note)} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {loading ? <Loader2 size={13} className="ap-spin" /> : null} Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Approve Modal ─── */
function ApproveModal({ onConfirm, onCancel, loading }) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-[calc(100vw-32px)] shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <ThumbsUp size={22} className="text-emerald-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Approve Policy?</h2>
        <p className="text-sm text-gray-500 text-center mb-4">Optionally add a note for the HR team.</p>
        <textarea
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional approval note…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
            Cancel
          </button>
          <button onClick={() => onConfirm(note)} disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {loading ? <Loader2 size={13} className="ap-spin" /> : null} Approve
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Policy Form Modal ─── */
const EMPTY_FORM = {
  title: "", category: "HR Policy", status: "Draft",
  audience: "All Employees", version: "v1.0",
  mandatory: false, pinned: false, summary: "", content: "",
};

function PolicyFormModal({ policy, onClose, onSaved, showToast }) {
  const isEdit = !!policy;
  const [form,   setForm]   = useState(isEdit ? {
    title:     policy.title,
    category:  policy.category,
    status:    policy.status,
    audience:  policy.audience,
    version:   policy.version,
    mandatory: policy.mandatory,
    pinned:    policy.pinned,
    summary:   policy.summary,
    content:   policy.content || "",
  } : { ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [tab,    setTab]    = useState("details");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title   = "Required";
    if (!form.summary.trim()) e.summary = "Required";
    if (!form.content.trim()) e.content = "Required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(), summary: form.summary.trim(),
      content: form.content.trim(), version: form.version,
      category: form.category, status: form.status,
      audience: form.audience, mandatory: form.mandatory, pinned: form.pinned,
    };
    try {
      const url    = isEdit ? API.UpdatePolicy(policy.id) : API.CreatePolicy;
      const method = isEdit ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.detail || `Error ${res.status}`); }
      const saved = await res.json();
      showToast(isEdit ? "Policy updated." : "Policy created.", "success");
      onSaved(saved);
      onClose();
    } catch (err) { showToast(err.message, "error"); }
    finally { setSaving(false); }
  };

  const CatIcon = CAT_CFG[form.category]?.icon || FileText;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[94vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${CAT_CFG[form.category]?.color} ${CAT_CFG[form.category]?.border}`}>
              <CatIcon size={15} />
            </div>
            <span className="font-semibold text-gray-900 text-sm">{isEdit ? "Edit Policy" : "Create New Policy"}</span>
          </div>
          <button onClick={onClose} disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition disabled:opacity-40">
            <X size={15} />
          </button>
        </div>

        {/* Workflow hint */}
        <div className="px-6 pt-3 pb-0">
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <SendHorizonal size={12} />
            <span>Policies must be submitted for CEO approval before publishing.</span>
          </div>
        </div>

        <div className="flex border-b border-gray-100 px-6 mt-3">
          {[["details", "Details"], ["content", "Policy Content"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`py-3 px-1 mr-5 text-sm font-medium border-b-2 transition ${tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {label}
              {key === "content" && errors.content && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "details" ? (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Policy Title *</label>
                <input type="text" value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="e.g. Annual Leave Policy"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 transition ${errors.title ? "border-red-300" : "border-gray-200"}`} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Category", key: "category", opts: CATEGORIES },
                  { label: "Status",   key: "status",   opts: ["Draft", "Review", "Archived"] }, // No "Active" — must go through workflow
                  { label: "Audience", key: "audience", opts: AUDIENCES },
                ].map(({ label, key, opts }) => (
                  <div key={key}>
                    <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">{label}</label>
                    <select value={form[key]} onChange={e => set(key, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 cursor-pointer transition">
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Version</label>
                  <input type="text" value={form.version} onChange={e => set("version", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 transition" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "mandatory", label: "Mandatory Policy", desc: "Requires acknowledgement" },
                  { key: "pinned",    label: "Pin Policy",       desc: "Show at top of list"      },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{label}</div>
                      <div className="text-xs text-gray-400">{desc}</div>
                    </div>
                    <button onClick={() => set(key, !form[key])}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form[key] ? "bg-blue-600" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form[key] ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Summary *</label>
                <textarea rows={3} value={form.summary} onChange={e => set("summary", e.target.value)}
                  placeholder="Brief description visible in the policy list…"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 resize-none transition ${errors.summary ? "border-red-300" : "border-gray-200"}`} />
                {errors.summary && <p className="text-xs text-red-500 mt-1">{errors.summary}</p>}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Full Policy Content *</label>
              <textarea rows={18} value={form.content} onChange={e => set("content", e.target.value)}
                placeholder="Write the full policy content here…"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 resize-none transition font-mono text-xs leading-relaxed ${errors.content ? "border-red-300" : "border-gray-200"}`} />
              {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
              <div className="text-right text-xs text-gray-400 mt-1">{form.content.length} chars</div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="ap-spin" /> Saving…</> : <><Send size={14} /> {isEdit ? "Save Changes" : "Save Draft"}</>}
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

/* ─── Policy Detail Sidebar ─── */
function PolicySidebar({ policyId, myLevel, onClose, onEdit, onDelete, onPinned, onStatusToggled, onWorkflowAction, showToast }) {
  const [policy,       setPolicy]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [acting,       setActing]       = useState(false);
  const [showApprove,  setShowApprove]  = useState(false);
  const [showReject,   setShowReject]   = useState(false);

  useEffect(() => {
    if (!policyId) return;
    setLoading(true);
    fetch(API.PolicyById(policyId), { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => setPolicy(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [policyId]);

  if (!policyId) return null;

  const stCfg  = policy ? STATUS_CFG[policy.status]  || {} : {};
  const catCfg = policy ? CAT_CFG[policy.category]   || {} : {};
  const CatIcon = catCfg.icon || FileText;
  const ackPct = policy?.total_recipients > 0
    ? Math.round((policy.ack_count / policy.total_recipients) * 100) : 0;

  const isCEO = myLevel <= 2;
  const isHR  = myLevel <= 4;

  const doAction = async (url, method = "POST", body = null) => {
    setActing(true);
    try {
      const res = await fetch(url, {
        method, headers: getAuthHeaders(),
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.detail || `Error ${res.status}`); }
      return await res.json();
    } catch (err) { showToast(err.message, "error"); return null; }
    finally { setActing(false); }
  };

  const handlePin = async () => {
    const updated = await doAction(API.PinPolicy(policyId));
    if (updated) { setPolicy(updated); onPinned(updated); showToast(updated.pinned ? "Policy pinned." : "Policy unpinned."); }
  };

  const handleToggleStatus = async () => {
    const updated = await doAction(API.TogglePolicyStatus(policyId));
    if (updated) { setPolicy(updated); onStatusToggled(updated); showToast(`Policy ${updated.status}.`); }
  };

  const handleSubmitReview = async () => {
    const updated = await doAction(API.SubmitPolicyReview(policyId));
    if (updated) { setPolicy(updated); onWorkflowAction(updated); showToast("Submitted for CEO review."); }
  };

  const handleApprove = async (note) => {
    const updated = await doAction(API.ApprovePolicy(policyId), "POST", { note });
    if (updated) { setPolicy(updated); onWorkflowAction(updated); showToast("Policy approved!", "success"); }
    setShowApprove(false);
  };

  const handleReject = async (note) => {
    const updated = await doAction(API.RejectPolicy(policyId), "POST", { note });
    if (updated) { setPolicy(updated); onWorkflowAction(updated); showToast("Policy returned to HR.", "error"); }
    setShowReject(false);
  };

  const handlePublish = async () => {
    const updated = await doAction(API.PublishPolicy(policyId));
    if (updated) { setPolicy(updated); onWorkflowAction(updated); showToast("Policy published!", "success"); }
  };

  const handleDelete = () => { onDelete(policy); onClose(); };
  const handleEdit   = () => { onEdit(policy);   onClose(); };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-[51] w-full sm:w-[520px] bg-white shadow-2xl flex flex-col slide-in-right">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          {loading ? (
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-3 w-32 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ) : policy ? (
            <div className="flex-1 pr-4">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${catCfg.color}`}>{policy.category}</span>
                {stCfg.badge && (
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${stCfg.badge}`}>
                    {stCfg.icon && React.createElement(stCfg.icon, { size: 11 })} {policy.status}
                  </span>
                )}
                {policy.mandatory && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">Mandatory</span>}
                {policy.pinned    && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1"><Pin size={9} /> Pinned</span>}
              </div>
              <h2 className="text-base font-semibold text-gray-900 leading-snug">{policy.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{policy.version} · Updated {fmtDate(policy.updated_at)}</p>
            </div>
          ) : <p className="text-sm text-red-500">Policy not found.</p>}
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition flex-shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={22} className="ap-spin text-gray-300" />
          </div>
        ) : policy ? (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Approval status banner */}
            <ApprovalBadge policy={policy} />

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Category",     value: policy.category },
                { label: "Audience",     value: policy.audience },
                { label: "Created By",   value: policy.created_by_name || "—" },
                { label: "Created",      value: fmtDate(policy.created_at) },
                { label: "Last Updated", value: fmtDate(policy.updated_at) },
                { label: "Version",      value: policy.version },
                ...(policy.approved_by_name ? [
                  { label: "Approved By", value: policy.approved_by_name },
                  { label: "Approved",    value: fmtDate(policy.approved_at) },
                ] : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">{label}</div>
                  <div className="text-sm font-medium text-gray-800">{value}</div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Summary</div>
              <p className="text-sm text-gray-700 leading-relaxed">{policy.summary}</p>
            </div>

            {/* Ack progress */}
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Acknowledgements</div>
                <span className="text-sm font-semibold text-gray-900">{policy.ack_count}/{policy.total_recipients}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className={`h-2 rounded-full transition-all duration-500 ${ackPct >= 80 ? "bg-emerald-500" : ackPct >= 50 ? "bg-blue-500" : "bg-amber-400"}`}
                  style={{ width: `${ackPct}%` }} />
              </div>
              <div className="text-xs text-gray-400 mt-1.5">{ackPct}% acknowledged</div>
            </div>

            {/* Content */}
            <div>
              <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Policy Content</div>
              <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{policy.content}</pre>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer — contextual workflow buttons */}
        {policy && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-2">

            {/* Workflow action row */}
            <div className="flex gap-2 flex-wrap">
              {/* HR: Submit for review (only when Draft) */}
              {isHR && !isCEO && policy.status === "Draft" && (
                <button onClick={handleSubmitReview} disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition">
                  <SendHorizonal size={13} /> Submit for Review
                </button>
              )}

              {/* CEO: Approve / Reject (only when Review + not yet approved) */}
              {isCEO && policy.status === "Review" && !policy.approved_by && (
                <>
                  <button onClick={() => setShowApprove(true)} disabled={acting}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition">
                    <ThumbsUp size={13} /> Approve
                  </button>
                  <button onClick={() => setShowReject(true)} disabled={acting}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
                    <ThumbsDown size={13} /> Reject
                  </button>
                </>
              )}

              {/* HR: Publish (only when Review + approved_by is set) */}
              {isHR && policy.status === "Review" && policy.approved_by && (
                <button onClick={handlePublish} disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition">
                  <Upload size={13} /> Publish
                </button>
              )}
            </div>

            {/* Standard action row */}
            <div className="flex gap-2 flex-wrap">
              {isHR && (
                <button onClick={handleEdit} disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition">
                  <Edit3 size={13} /> Edit
                </button>
              )}
              {isHR && (
                <button onClick={handlePin} disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
                  {policy.pinned ? <><PinOff size={13} /> Unpin</> : <><Pin size={13} /> Pin</>}
                </button>
              )}
              {isHR && policy.status === "Active" && (
                <button onClick={handleToggleStatus} disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
                  <ToggleLeft size={13} /> Archive
                </button>
              )}
              {isHR && policy.status === "Archived" && (
                <button onClick={handleToggleStatus} disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
                  <ToggleRight size={13} /> Re-activate
                </button>
              )}
              {isHR && (
                <button onClick={handleDelete} disabled={acting}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">
                  <Trash2 size={13} /> Delete
                </button>
              )}
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition text-center min-w-[60px]">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {showApprove && <ApproveModal onConfirm={handleApprove} onCancel={() => setShowApprove(false)} loading={acting} />}
      {showReject  && <RejectModal  onConfirm={handleReject}  onCancel={() => setShowReject(false)}  loading={acting} />}
    </>
  );
}

/* ─── Delete Confirm Modal ─── */
function DeleteConfirm({ policy, onConfirm, onCancel, loading }) {
  if (!policy) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-[calc(100vw-32px)] shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Delete Policy?</h2>
        <p className="text-sm text-gray-500 text-center mb-1">This will permanently remove:</p>
        <p className="text-sm font-semibold text-gray-800 text-center mb-2 px-4">"{policy.title}"</p>
        <p className="text-xs text-gray-400 text-center mb-5">{policy.version} · {policy.category}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-sm font-medium rounded-xl transition">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            {loading ? <Loader2 size={13} className="ap-spin" /> : null} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Policy Table Row ─── */
function PolicyRow({ policy, idx, myLevel, onView, onEdit, onDelete, onTogglePin, onWorkflowQuick }) {
  const stCfg   = STATUS_CFG[policy.status] || {};
  const catCfg  = CAT_CFG[policy.category]  || {};
  const CatIcon = catCfg.icon || FileText;
  const ackPct  = policy.total_recipients > 0
    ? Math.round(((policy.ack_count ?? 0) / policy.total_recipients) * 100) : 0;
  const isHR  = myLevel <= 4;
  const isCEO = myLevel <= 2;

  return (
    <tr className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"} hover:bg-blue-50/20 transition border-b border-gray-50 last:border-b-0`}>
      <td className="py-3 px-4 cursor-pointer max-w-xs" onClick={onView}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${catCfg.color} ${catCfg.border}`}>
            <CatIcon size={13} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {policy.pinned    && <Pin size={11} className="text-blue-500 flex-shrink-0" />}
              {policy.mandatory && <span className="text-[10px] font-bold text-red-600">★</span>}
              {/* Approval indicator in row */}
              {policy.status === "Review" && policy.approved_by && (
                <span title="CEO Approved"><BadgeCheck size={11} className="text-emerald-500" /></span>
              )}
              {policy.status === "Review" && !policy.approved_by && (
                <span title="Awaiting CEO"><Hourglass size={11} className="text-amber-500" /></span>
              )}
              <span className="text-sm font-medium text-gray-800 line-clamp-1">{policy.title}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{(policy.summary || "").substring(0, 60)}…</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${catCfg.color}`}>{policy.category}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${stCfg.badge}`}>
          {stCfg.icon && React.createElement(stCfg.icon, { size: 11 })} {policy.status}
        </span>
      </td>
      <td className="py-3 px-4 text-center text-xs text-gray-500 whitespace-nowrap">{policy.audience}</td>
      <td className="py-3 px-4 text-center text-xs font-medium text-gray-600">{policy.version}</td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${ackPct >= 80 ? "bg-emerald-500" : ackPct >= 50 ? "bg-blue-500" : "bg-amber-400"}`}
              style={{ width: `${ackPct}%` }} />
          </div>
          <span className="text-xs font-medium text-gray-600 tabular-nums whitespace-nowrap">{policy.ack_count ?? 0}/{policy.total_recipients}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap">{fmtDate(policy.updated_at)}</td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <button onClick={onView}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition" title="View">
            <Eye size={13} />
          </button>
          {isHR && (
            <button onClick={() => onEdit(policy)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 transition" title="Edit">
              <Edit3 size={13} />
            </button>
          )}
          {isHR && (
            <button onClick={() => onTogglePin(policy)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition ${
                policy.pinned ? "border-blue-200 text-blue-500 bg-blue-50" : "border-gray-200 text-gray-400 hover:border-blue-200 hover:text-blue-500"
              }`} title="Pin"><Pin size={13} /></button>
          )}
          {/* Quick workflow button in row */}
          {isHR && !isCEO && policy.status === "Draft" && (
            <button onClick={() => onWorkflowQuick(policy, "submit")} title="Submit for review"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition">
              <SendHorizonal size={13} />
            </button>
          )}
          {isCEO && policy.status === "Review" && !policy.approved_by && (
            <button onClick={() => onWorkflowQuick(policy, "approve")} title="Approve"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition">
              <ThumbsUp size={13} />
            </button>
          )}
          {isHR && policy.status === "Review" && policy.approved_by && (
            <button onClick={() => onWorkflowQuick(policy, "publish")} title="Publish"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition">
              <Upload size={13} />
            </button>
          )}
          {isHR && (
            <button onClick={() => onDelete(policy)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition" title="Delete">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════════════ */
const PAGE_SIZE = 10;

export default function AdminPolicyPage() {
  const myLevel = useMemo(() => getMyLevel(), []);
  const isCEO   = myLevel <= 2;
  const isHR    = myLevel <= 4;

  const [policies,     setPolicies]     = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [statsLoad,    setStatsLoad]    = useState(true);
  const [error,        setError]        = useState(null);

  const [search,          setSearch]          = useState("");
  const [filterCat,       setFilterCat]       = useState("All");
  const [filterStatus,    setFilterStatus]    = useState("All");
  const [filterAudience,  setFilterAudience]  = useState("All");
  const [filterMandatory, setFilterMandatory] = useState("All");
  const [page,            setPage]            = useState(1);

  const [viewPolicyId,  setViewPolicyId]  = useState(null);
  const [editPolicy,    setEditPolicy]    = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast,         setToast]         = useState(null);

  // Quick workflow confirm state
  const [quickAction,   setQuickAction]   = useState(null); // { policy, action }

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const fetchPolicies = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(API.GetAllPolicies(), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : data.policies || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoad(true);
    try {
      const res = await fetch(API.PolicyStats, { headers: getAuthHeaders() });
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
    finally { setStatsLoad(false); }
  }, []);

  useEffect(() => { fetchPolicies(); fetchStats(); }, [fetchPolicies, fetchStats]);

  const upsertPolicy = useCallback((updated) => {
    setPolicies(prev => {
      const idx = prev.findIndex(p => p.id === updated.id);
      return idx >= 0 ? prev.map(p => p.id === updated.id ? updated : p) : [updated, ...prev];
    });
  }, []);

  const removePolicy = useCallback((id) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleRowPin = useCallback(async (policy) => {
    try {
      const res = await fetch(API.PinPolicy(policy.id), { method: "POST", headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const updated = await res.json();
      upsertPolicy(updated);
      showToast(updated.pinned ? "Policy pinned." : "Policy unpinned.");
    } catch (e) { showToast(e.message, "error"); }
  }, [upsertPolicy, showToast]);

  // Quick workflow action from row
  const handleWorkflowQuick = useCallback(async (policy, action) => {
    try {
      let url, method = "POST", body = null;
      if (action === "submit")  url = API.SubmitPolicyReview(policy.id);
      if (action === "approve") url = API.ApprovePolicy(policy.id);
      if (action === "publish") url = API.PublishPolicy(policy.id);

      const res = await fetch(url, { method, headers: getAuthHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d?.detail || `Error ${res.status}`); }
      const updated = await res.json();
      upsertPolicy(updated);
      const msgs = { submit: "Submitted for review.", approve: "Policy approved!", publish: "Policy published!" };
      showToast(msgs[action] || "Done.");
      fetchStats();
    } catch (e) { showToast(e.message, "error"); }
  }, [upsertPolicy, showToast, fetchStats]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(API.DeletePolicy(deleteTarget.id), { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      removePolicy(deleteTarget.id);
      setDeleteTarget(null);
      showToast("Policy deleted.");
      fetchStats();
    } catch (e) { showToast(e.message, "error"); }
    finally { setDeleteLoading(false); }
  }, [deleteTarget, removePolicy, showToast, fetchStats]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...policies]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      })
      .filter(p =>
        (!q || (p.title || "").toLowerCase().includes(q) ||
               (p.category || "").toLowerCase().includes(q) ||
               (p.created_by_name || "").toLowerCase().includes(q)) &&
        (filterCat       === "All" || p.category === filterCat) &&
        (filterStatus    === "All" || p.status   === filterStatus) &&
        (filterAudience  === "All" || p.audience === filterAudience) &&
        (filterMandatory === "All" ||
          (filterMandatory === "Mandatory" ? p.mandatory : !p.mandatory))
      );
  }, [policies, search, filterCat, filterStatus, filterAudience, filterMandatory]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sf         = fn => { fn(); setPage(1); };

  const activeFilters = [
    filterCat       !== "All" && { key: "cat",       label: filterCat },
    filterStatus    !== "All" && { key: "status",    label: filterStatus },
    filterAudience  !== "All" && { key: "audience",  label: filterAudience },
    filterMandatory !== "All" && { key: "mandatory", label: filterMandatory },
    search                    && { key: "q",         label: `"${search}"` },
  ].filter(Boolean);

  const clearFilter = key => {
    setPage(1);
    if (key === "cat")       setFilterCat("All");
    if (key === "status")    setFilterStatus("All");
    if (key === "audience")  setFilterAudience("All");
    if (key === "mandatory") setFilterMandatory("All");
    if (key === "q")         setSearch("");
  };

  const catBreakdown = useMemo(() => {
    const map = {};
    policies.forEach(p => { map[p.category] = (map[p.category] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [policies]);

  const ackOverview = useMemo(() =>
    policies
      .filter(p => p.status === "Active")
      .map(p => ({ ...p, pct: p.total_recipients > 0 ? Math.round(((p.ack_count ?? 0) / p.total_recipients) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 7),
  [policies]);

  // CEO-focused: policies pending approval
  const pendingApproval = useMemo(() =>
    policies.filter(p => p.status === "Review" && !p.approved_by),
  [policies]);

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-900">

      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Policy Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isCEO ? "Approve, review & manage company-wide policies" : "Create, manage & track company-wide policies"} · {new Date().toDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button onClick={() => { fetchPolicies(); fetchStats(); }} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-500 text-xs font-semibold rounded-xl transition disabled:opacity-40">
            <RefreshCw size={13} className={loading ? "ap-spin" : ""} />
          </button>
          {isHR && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm whitespace-nowrap">
              <PlusCircle size={16} /> New Policy
            </button>
          )}
        </div>
      </header>

      {/* CEO Pending Approval Alert */}
      {isCEO && pendingApproval.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5">
          <Hourglass size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{pendingApproval.length} polic{pendingApproval.length !== 1 ? "ies" : "y"} awaiting your approval</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {pendingApproval.slice(0, 3).map(p => p.title).join(", ")}{pendingApproval.length > 3 ? ` and ${pendingApproval.length - 3} more` : ""}
            </p>
          </div>
          <button onClick={() => sf(() => setFilterStatus("Review"))}
            className="text-xs font-semibold text-amber-700 hover:underline shrink-0">View all</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5">
          <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button onClick={() => { fetchPolicies(); fetchStats(); }} className="text-xs font-semibold text-red-600 hover:underline shrink-0">Retry</button>
        </div>
      )}

      {/* Stat widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Widget title="Total Policies"    value={stats?.total            ?? "—"} sub="All records"             icon={FileText}     color="border-blue-300 bg-blue-50 text-blue-700"       loading={statsLoad} />
        <Widget title="Active"            value={stats?.active           ?? "—"} sub="Published"              icon={CheckCircle2} color="border-green-300 bg-green-50 text-green-700"    loading={statsLoad} />
        <Widget title="Pending Approval"  value={stats?.pending_approval ?? "—"} sub="Awaiting CEO"           icon={Hourglass}    color="border-amber-300 bg-amber-50 text-amber-700"    loading={statsLoad} />
        <Widget title="Mandatory"         value={stats?.mandatory        ?? "—"} sub="Require acknowledgement" icon={AlertTriangle} color="border-red-300 bg-red-50 text-red-700"        loading={statsLoad} />
        <Widget title="Avg. Ack Rate"     value={stats ? `${Math.round(stats.avg_ack_rate)}%` : "—"} sub="Across active" icon={TrendingUp} color="border-violet-300 bg-violet-50 text-violet-700" loading={statsLoad} />
      </div>

      {/* Workflow guide for HR */}
      {isHR && !isCEO && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 mb-5 text-xs text-gray-500 shadow-sm overflow-x-auto">
          <span className="font-semibold text-gray-700 whitespace-nowrap">Publish workflow:</span>
          <span className="whitespace-nowrap">📝 Create Draft</span>
          <ChevronRight size={12} />
          <span className="whitespace-nowrap text-amber-600 font-medium">📤 Submit for Review</span>
          <ChevronRight size={12} />
          <span className="whitespace-nowrap text-emerald-600 font-medium">✅ CEO Approves</span>
          <ChevronRight size={12} />
          <span className="whitespace-nowrap text-blue-600 font-medium">🚀 HR Publishes</span>
          <ChevronRight size={12} />
          <span className="whitespace-nowrap text-green-700 font-medium">🟢 Active</span>
        </div>
      )}

      {/* Status pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "Active",   val: stats?.active   ?? 0, key: "Active",   color: "bg-green-50 text-green-700 border-green-200"    },
          { label: "Draft",    val: stats?.draft    ?? 0, key: "Draft",    color: "bg-gray-100 text-gray-600 border-gray-200"      },
          { label: "Review",   val: stats?.review   ?? 0, key: "Review",   color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
          { label: "Archived", val: stats?.archived ?? 0, key: "Archived", color: "bg-red-50 text-red-600 border-red-200"          },
        ].map(({ label, val, key, color }) => (
          <button key={key}
            onClick={() => sf(() => setFilterStatus(filterStatus === key ? "All" : key))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition shadow-sm hover:shadow-md ${color} ${filterStatus === key ? "ring-2 ring-offset-1 ring-current" : ""}`}>
            <span className="text-lg font-bold">{statsLoad ? "…" : val}</span>
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card title="Policies by Category" action={<span className="text-xs text-gray-400">click to filter</span>}>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="ap-spin text-gray-300" /></div>
          ) : catBreakdown.length > 0 ? (
            <div className="space-y-2.5">
              {catBreakdown.map(([cat, count]) => {
                const CatIcon = CAT_CFG[cat]?.icon || FileText;
                const pct    = policies.length ? Math.round((count / policies.length) * 100) : 0;
                const active = filterCat === cat;
                return (
                  <div key={cat} onClick={() => sf(() => setFilterCat(active ? "All" : cat))}
                    className={`flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 group transition ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border ${CAT_CFG[cat]?.color} ${CAT_CFG[cat]?.border}`}>
                      <CatIcon size={11} />
                    </div>
                    <span className={`w-28 text-xs font-medium truncate flex-shrink-0 transition ${active ? "text-blue-700" : "text-gray-600 group-hover:text-blue-600"}`}>{cat}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all ${active ? "bg-blue-600" : "bg-blue-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-6 text-right tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No policies yet</p>
            </div>
          )}
        </Card>

        <Card title="Acknowledgement Overview">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={20} className="ap-spin text-gray-300" /></div>
          ) : ackOverview.length > 0 ? (
            <div className="space-y-2.5">
              {ackOverview.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 truncate flex-shrink-0 w-36">{p.title.substring(0, 24)}…</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${p.pct >= 80 ? "bg-emerald-500" : p.pct >= 50 ? "bg-blue-400" : "bg-amber-400"}`}
                      style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 tabular-nums w-12 text-right">{p.pct}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <TrendingUp size={26} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No active policies</p>
            </div>
          )}
        </Card>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-gray-400 flex-shrink-0" />
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => sf(() => setSearch(e.target.value))}
            placeholder="Search policies…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-400" />
        </div>
        {[
          { val: filterCat,      set: setFilterCat,       ph: "All Categories", opts: CATEGORIES },
          { val: filterStatus,   set: setFilterStatus,    ph: "All Statuses",   opts: ["Active", "Draft", "Review", "Archived"] },
          { val: filterAudience, set: setFilterAudience,  ph: "All Audiences",  opts: AUDIENCES },
          { val: filterMandatory,set: setFilterMandatory, ph: "All Types",      opts: ["Mandatory", "Optional"] },
        ].map(({ val, set, ph, opts }) => (
          <select key={ph} value={val} onChange={e => sf(() => set(e.target.value))}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 cursor-pointer transition text-gray-700">
            <option value="All">{ph}</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {activeFilters.length > 0 && (
          <button onClick={() => { setSearch(""); setFilterCat("All"); setFilterStatus("All"); setFilterAudience("All"); setFilterMandatory("All"); setPage(1); }}
            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition whitespace-nowrap">
            Clear all
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} polic{filtered.length !== 1 ? "ies" : "y"}</span>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
              {f.label}
              <button className="opacity-60 hover:opacity-100 transition" onClick={() => clearFilter(f.key)}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <Card
        title="All Policies"
        action={<span className="text-xs text-gray-400">{filtered.length} polic{filtered.length !== 1 ? "ies" : "y"}</span>}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Policy", "Category", "Status", "Audience", "Version", "Ack Rate", "Updated", "Actions"].map((h, i) => (
                  <th key={h} className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${i === 0 ? "text-left" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Loader2 size={24} className="mx-auto mb-3 ap-spin text-gray-300" />
                  <p className="text-sm text-gray-400">Loading policies…</p>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <FileText size={30} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">No policies found.</p>
                  {isHR && (
                    <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-blue-600 font-medium hover:underline">
                      + Create first policy
                    </button>
                  )}
                </td></tr>
              ) : paginated.map((p, i) => (
                <PolicyRow
                  key={p.id} policy={p} idx={i} myLevel={myLevel}
                  onView={() => setViewPolicyId(p.id)}
                  onEdit={pol => setEditPolicy(pol)}
                  onDelete={pol => setDeleteTarget(pol)}
                  onTogglePin={handleRowPin}
                  onWorkflowQuick={handleWorkflowQuick}
                />
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 text-sm">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showCreate && (
        <PolicyFormModal
          onClose={() => setShowCreate(false)}
          onSaved={saved => { upsertPolicy(saved); fetchStats(); }}
          showToast={showToast}
        />
      )}
      {editPolicy && (
        <PolicyFormModal
          policy={editPolicy}
          onClose={() => setEditPolicy(null)}
          onSaved={saved => { upsertPolicy(saved); setEditPolicy(null); fetchStats(); }}
          showToast={showToast}
        />
      )}
      {viewPolicyId && (
        <PolicySidebar
          policyId={viewPolicyId}
          myLevel={myLevel}
          onClose={() => setViewPolicyId(null)}
          onEdit={p => { setViewPolicyId(null); setEditPolicy(p); }}
          onDelete={p => { setViewPolicyId(null); setDeleteTarget(p); }}
          onPinned={upsertPolicy}
          onStatusToggled={p => { upsertPolicy(p); fetchStats(); }}
          onWorkflowAction={p => { upsertPolicy(p); fetchStats(); }}
          showToast={showToast}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          policy={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}