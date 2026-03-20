import React, { useState, useMemo } from "react";
import {
  FileText, CheckCircle2, Clock, XCircle, PlusCircle,
  ChevronLeft, ChevronRight, Search, X, Plane,
  DollarSign, Calendar, Building2, ChevronDown, AlertCircle,
  Send, Trash2
} from "lucide-react";

/* ─── Shared components ─── */
function IconBadge({ icon: Icon, color }) {
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${color}`}>
      <Icon className="w-5 h-5" />
    </span>
  );
}
function Widget({ title, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex gap-4 items-center">
      <IconBadge icon={icon} color={color} />
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
function Card({ title, children, action }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-500">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── Config ─── */
const TYPE_CONFIG = {
  Leave:         { icon: Calendar,    color: "bg-violet-50 text-violet-700", border: "border-violet-200" },
  Travel:        { icon: Plane,       color: "bg-blue-50 text-blue-700",     border: "border-blue-200"   },
  Reimbursement: { icon: DollarSign,  color: "bg-amber-50 text-amber-700",   border: "border-amber-200"  },
  WFH:           { icon: Building2,   color: "bg-cyan-50 text-cyan-700",     border: "border-cyan-200"   },
  Overtime:      { icon: Clock,       color: "bg-orange-50 text-orange-700", border: "border-orange-200" },
};

const STATUS_CONFIG = {
  Pending:  { badge: "bg-yellow-100 text-yellow-800 border border-yellow-200", dot: "bg-yellow-400", icon: Clock       },
  Approved: { badge: "bg-green-100 text-green-800 border border-green-200",   dot: "bg-green-500",  icon: CheckCircle2 },
  Rejected: { badge: "bg-red-100 text-red-700 border border-red-200",         dot: "bg-red-500",    icon: XCircle      },
};

const LEAVE_TYPES   = ["Annual Leave", "Sick Leave", "Emergency Leave", "Unpaid Leave", "Maternity/Paternity Leave"];
const TRAVEL_TYPES  = ["Local Travel", "International Travel", "Client Visit"];
const REIMB_TYPES   = ["Meals", "Transport", "Accommodation", "Equipment", "Training"];
const OVERTIME_TYPES = ["Weekday Overtime", "Weekend Overtime", "Holiday Overtime"];

const INITIAL_APPLICATIONS = [
  { id: 3001, type: "Leave",         subType: "Annual Leave",      status: "Approved",  fromDate: "2026-02-10", toDate: "2026-02-12", submittedDate: "2026-02-01", reason: "Family vacation",             approvedBy: "Line Manager",  rejectedBy: null,      rejectedReason: null,                        amount: null  },
  { id: 3002, type: "Reimbursement", subType: "Meals",             status: "Approved",  fromDate: "2026-02-15", toDate: "2026-02-15", submittedDate: "2026-02-16", reason: "Client lunch meeting",        approvedBy: "Finance Dept",  rejectedBy: null,      rejectedReason: null,                        amount: 450   },
  { id: 3003, type: "Travel",        subType: "Client Visit",      status: "Approved",  fromDate: "2026-02-18", toDate: "2026-02-19", submittedDate: "2026-02-10", reason: "Quarterly client review",     approvedBy: "Line Manager",  rejectedBy: null,      rejectedReason: null,                        amount: null  },
  { id: 3004, type: "Leave",         subType: "Sick Leave",        status: "Pending",   fromDate: "2026-03-08", toDate: "2026-03-09", submittedDate: "2026-03-05", reason: "Not feeling well",            approvedBy: null,            rejectedBy: null,      rejectedReason: null,                        amount: null  },
  { id: 3005, type: "Reimbursement", subType: "Transport",         status: "Pending",   fromDate: "2026-03-03", toDate: "2026-03-03", submittedDate: "2026-03-04", reason: "Cab to client site",          approvedBy: null,            rejectedBy: null,      rejectedReason: null,                        amount: 120   },
  { id: 3006, type: "WFH",           subType: "WFH",               status: "Pending",   fromDate: "2026-03-10", toDate: "2026-03-11", submittedDate: "2026-03-05", reason: "Home maintenance scheduled",  approvedBy: null,            rejectedBy: null,      rejectedReason: null,                        amount: null  },
  { id: 3007, type: "Leave",         subType: "Annual Leave",      status: "Rejected",  fromDate: "2026-01-25", toDate: "2026-01-28", submittedDate: "2026-01-15", reason: "Personal travel abroad",      approvedBy: null,            rejectedBy: "HR Dept", rejectedReason: "Insufficient leave balance",amount: null  },
  { id: 3008, type: "Overtime",      subType: "Weekend Overtime",  status: "Approved",  fromDate: "2026-02-22", toDate: "2026-02-22", submittedDate: "2026-02-20", reason: "Project delivery deadline",   approvedBy: "Line Manager",  rejectedBy: null,      rejectedReason: null,                        amount: null  },
  { id: 3009, type: "Reimbursement", subType: "Equipment",         status: "Rejected",  fromDate: "2026-02-05", toDate: "2026-02-05", submittedDate: "2026-02-06", reason: "Keyboard replacement",        approvedBy: null,            rejectedBy: "Finance", rejectedReason: "Exceeds single-item limit", amount: 890   },
  { id: 3010, type: "Travel",        subType: "International Travel", status: "Pending", fromDate: "2026-03-20", toDate: "2026-03-23", submittedDate: "2026-03-04", reason: "Tech conference – Dubai",    approvedBy: null,            rejectedBy: null,      rejectedReason: null,                        amount: null  },
  { id: 3011, type: "Leave",         subType: "Emergency Leave",   status: "Approved",  fromDate: "2026-01-08", toDate: "2026-01-08", submittedDate: "2026-01-07", reason: "Family emergency",            approvedBy: "HR Dept",       rejectedBy: null,      rejectedReason: null,                        amount: null  },
  { id: 3012, type: "WFH",           subType: "WFH",               status: "Approved",  fromDate: "2026-02-03", toDate: "2026-02-04", submittedDate: "2026-01-31", reason: "Focus work for sprint",       approvedBy: "Line Manager",  rejectedBy: null,      rejectedReason: null,                        amount: null  },
];

function getDays(from, to) {
  const d = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
  return d <= 0 ? 1 : d;
}

/* ─── New Application Modal ─── */
function NewApplicationModal({ onClose, onSubmit }) {
  const [type, setType]         = useState("Leave");
  const [subType, setSubType]   = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");
  const [reason, setReason]     = useState("");
  const [amount, setAmount]     = useState("");
  const [errors, setErrors]     = useState({});

  const subTypes = type === "Leave" ? LEAVE_TYPES : type === "Travel" ? TRAVEL_TYPES : type === "Reimbursement" ? REIMB_TYPES : type === "Overtime" ? OVERTIME_TYPES : ["WFH"];

  const validate = () => {
    const e = {};
    if (!subType)   e.subType  = "Please select a sub-type";
    if (!fromDate)  e.fromDate = "Required";
    if (!toDate)    e.toDate   = "Required";
    if (!reason.trim()) e.reason = "Please provide a reason";
    if (type === "Reimbursement" && !amount) e.amount = "Required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({ type, subType, fromDate, toDate, reason, amount: amount ? parseFloat(amount) : null });
    onClose();
  };

  const TypeIcon = TYPE_CONFIG[type]?.icon || FileText;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${TYPE_CONFIG[type]?.color}`}>
              <TypeIcon size={15} />
            </div>
            <span className="font-semibold text-gray-900 text-sm">New Application</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Type selector — pill tabs */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-2 block">Application Type</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(TYPE_CONFIG).map(t => {
                const Icon = TYPE_CONFIG[t].icon;
                const active = type === t;
                return (
                  <button key={t} onClick={() => { setType(t); setSubType(""); setErrors({}); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                      ${active ? `${TYPE_CONFIG[t].color} ${TYPE_CONFIG[t].border} shadow-sm` : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    <Icon size={12} /> {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-type */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Sub-Type</label>
            <select value={subType} onChange={e => { setSubType(e.target.value); setErrors(p => ({ ...p, subType: "" })); }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 transition cursor-pointer
                ${errors.subType ? "border-red-300" : "border-gray-200"}`}>
              <option value="">Select sub-type…</option>
              {subTypes.map(s => <option key={s}>{s}</option>)}
            </select>
            {errors.subType && <p className="text-xs text-red-500 mt-1">{errors.subType}</p>}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "From Date", val: fromDate, set: setFromDate, key: "fromDate" },
              { label: "To Date",   val: toDate,   set: setToDate,   key: "toDate"   },
            ].map(({ label, val, set, key }) => (
              <div key={key}>
                <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">{label}</label>
                <input type="date" value={val} onChange={e => { set(e.target.value); setErrors(p => ({ ...p, [key]: "" })); }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 transition
                    ${errors[key] ? "border-red-300" : "border-gray-200"}`} />
                {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>

          {/* Duration preview */}
          {fromDate && toDate && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-blue-700">
              <Calendar size={13} />
              <span className="font-medium">{getDays(fromDate, toDate)} day{getDays(fromDate, toDate) !== 1 ? "s" : ""}</span>
              <span className="text-blue-400">·</span>
              <span>{fromDate} → {toDate}</span>
            </div>
          )}

          {/* Amount (reimbursement only) */}
          {type === "Reimbursement" && (
            <div>
              <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Amount (SAR)</label>
              <div className="relative">
                <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="number" min="0" value={amount} onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: "" })); }}
                  placeholder="0.00"
                  className={`w-full border rounded-xl pl-8 pr-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 transition
                    ${errors.amount ? "border-red-300" : "border-gray-200"}`} />
              </div>
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Reason</label>
            <textarea rows={3} value={reason} onChange={e => { setReason(e.target.value); setErrors(p => ({ ...p, reason: "" })); }}
              placeholder="Briefly describe the reason for this application…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 resize-none transition
                ${errors.reason ? "border-red-300" : "border-gray-200"}`} />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSubmit}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            <Send size={14} /> Submit Application
          </button>
          <button onClick={onClose}
            className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Modal ─── */
function DetailModal({ app, onClose, onCancel }) {
  if (!app) return null;
  const stCfg = STATUS_CONFIG[app.status];
  const typeCfg = TYPE_CONFIG[app.type];
  const TypeIcon = typeCfg?.icon || FileText;
  const StatusIcon = stCfg?.icon || Clock;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${typeCfg?.color}`}>{app.type}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stCfg?.badge}`}>{app.status}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900">{app.subType}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Application #{app.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "From Date",  value: app.fromDate },
              { label: "To Date",    value: app.toDate },
              { label: "Duration",   value: `${getDays(app.fromDate, app.toDate)} day${getDays(app.fromDate, app.toDate) !== 1 ? "s" : ""}` },
              { label: "Submitted",  value: app.submittedDate },
              ...(app.amount ? [{ label: "Amount", value: `SAR ${app.amount}` }] : []),
              ...(app.approvedBy ? [{ label: "Approved By", value: app.approvedBy }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">{label}</div>
                <div className="text-sm font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">Reason</div>
            <p className="text-sm text-gray-700 leading-relaxed">{app.reason}</p>
          </div>

          {app.status === "Rejected" && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-red-400 mb-1.5">Rejection Details</div>
              <p className="text-sm text-red-800"><span className="font-medium">By:</span> {app.rejectedBy}</p>
              <p className="text-sm text-red-800 mt-1"><span className="font-medium">Reason:</span> {app.rejectedReason}</p>
            </div>
          )}

          {app.status === "Pending" && (
            <div className="flex items-center gap-2.5 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
              <Clock size={15} className="text-yellow-500 shrink-0" />
              <p className="text-sm text-yellow-800">This application is awaiting approval from your manager.</p>
            </div>
          )}

          {app.status === "Approved" && (
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <CheckCircle2 size={15} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-800">Approved by <span className="font-semibold">{app.approvedBy}</span>.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {app.status === "Pending" && (
            <button onClick={() => { onCancel(app.id); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition">
              <Trash2 size={13} /> Withdraw
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Application Row ─── */
function AppRow({ app, onClick, idx }) {
  const stCfg   = STATUS_CONFIG[app.status];
  const typeCfg = TYPE_CONFIG[app.type];
  const TypeIcon = typeCfg?.icon || FileText;
  const days = getDays(app.fromDate, app.toDate);

  return (
    <tr
      onClick={onClick}
      className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"} hover:bg-blue-50/30 transition border-b border-gray-50 last:border-b-0 cursor-pointer`}
    >
      <td className="py-3 px-4 text-xs text-gray-400 font-medium tabular-nums">#{app.id}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${typeCfg?.color}`}>
            <TypeIcon size={13} />
          </span>
          <div>
            <div className="text-sm font-medium text-gray-800">{app.subType}</div>
            <div className={`text-[11px] font-medium ${typeCfg?.color.split(" ")[1]}`}>{app.type}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap">
        {app.fromDate} → {app.toDate}
      </td>
      <td className="py-3 px-4 text-center text-xs font-medium text-gray-600">{days}d</td>
      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums">{app.submittedDate}</td>
      {/* Amount column */}
      <td className="py-3 px-4 text-center text-xs font-medium text-gray-700">
        {app.amount ? <span className="font-semibold text-amber-700">SAR {app.amount}</span> : <span className="text-gray-300">—</span>}
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${stCfg?.badge}`}>
          {React.createElement(stCfg?.icon, { size: 11 })} {app.status}
        </span>
      </td>
    </tr>
  );
}

/* ─── Main Page ─── */
export default function MyApplicationsPage() {
  const today = "2026-03-05";
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState(null);
  const [showNew, setShowNew]           = useState(false);
  const PAGE_SIZE = 8;

  /* Stats */
  const stats = useMemo(() => ({
    total:    applications.length,
    pending:  applications.filter(a => a.status === "Pending").length,
    approved: applications.filter(a => a.status === "Approved").length,
    rejected: applications.filter(a => a.status === "Rejected").length,
  }), [applications]);

  /* Filtered + sorted */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...applications]
      .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate))
      .filter(a =>
        (!q || a.type.toLowerCase().includes(q) || a.subType.toLowerCase().includes(q) || String(a.id).includes(q)) &&
        (filterType   === "All" || a.type   === filterType) &&
        (filterStatus === "All" || a.status === filterStatus)
      );
  }, [search, filterType, filterStatus, applications]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const setFilter  = fn => { fn(); setPage(1); };

  const activeFilters = [
    filterType   !== "All" && { key: "type",   label: filterType },
    filterStatus !== "All" && { key: "status", label: filterStatus },
    search                 && { key: "search", label: `"${search}"` },
  ].filter(Boolean);

  const clearFilter = key => {
    setPage(1);
    if (key === "type")   setFilterType("All");
    if (key === "status") setFilterStatus("All");
    if (key === "search") setSearch("");
  };

  const handleSubmit = (data) => {
    const newApp = {
      id: 3000 + applications.length + 1,
      ...data,
      status: "Pending",
      submittedDate: today,
      approvedBy: null, rejectedBy: null, rejectedReason: null,
    };
    setApplications(prev => [newApp, ...prev]);
  };

  const handleWithdraw = id => {
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  /* Summary by type */
  const typeSummary = useMemo(() =>
    Object.keys(TYPE_CONFIG).map(t => ({
      type: t,
      total:    applications.filter(a => a.type === t).length,
      pending:  applications.filter(a => a.type === t && a.status === "Pending").length,
      approved: applications.filter(a => a.type === t && a.status === "Approved").length,
    })).filter(s => s.total > 0),
  [applications]);

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-900">

      {/* Header */}
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Leave, Travel & Requests · {new Date(today).toDateString()}</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <PlusCircle size={16} /> New Application
        </button>
      </header>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Widget title="Total"    value={stats.total}    sub="All applications"    icon={FileText}    color="border-blue-300 bg-blue-50 text-blue-700"    />
        <Widget title="Pending"  value={stats.pending}  sub="Awaiting approval"   icon={Clock}       color="border-yellow-300 bg-yellow-50 text-yellow-700" />
        <Widget title="Approved" value={stats.approved} sub="Processed"           icon={CheckCircle2} color="border-green-300 bg-green-50 text-green-700"  />
        <Widget title="Rejected" value={stats.rejected} sub="Needs resubmission"  icon={XCircle}     color="border-red-300 bg-red-50 text-red-700"         />
      </div>

      {/* Type summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {Object.entries(TYPE_CONFIG).map(([t, cfg]) => {
          const Icon = cfg.icon;
          const summary = typeSummary.find(s => s.type === t) || { total: 0, pending: 0, approved: 0 };
          return (
            <button key={t} onClick={() => setFilter(() => setFilterType(filterType === t ? "All" : t))}
              className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition text-left
                ${filterType === t ? `${cfg.border} shadow-md` : "border-transparent hover:border-gray-200"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cfg.color}`}>
                <Icon size={17} />
              </div>
              <div className="text-sm font-semibold text-gray-800">{t}</div>
              <div className="text-xs text-gray-400 mt-0.5">{summary.total} total · {summary.pending} pending</div>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" value={search} onChange={e => setFilter(() => setSearch(e.target.value))}
              placeholder="Search applications…"
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-gray-400 transition placeholder-gray-400 w-44" />
          </div>

          {[
            { val: filterType,   set: setFilterType,   placeholder: "All Types",    opts: Object.keys(TYPE_CONFIG) },
            { val: filterStatus, set: setFilterStatus, placeholder: "All Statuses", opts: ["Pending", "Approved", "Rejected"] },
          ].map(({ val, set, placeholder, opts }) => (
            <select key={placeholder} value={val} onChange={e => setFilter(() => set(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-gray-400 cursor-pointer transition text-gray-700">
              <option value="All">{placeholder}</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}

          {activeFilters.length > 0 && (
            <button onClick={() => { setSearch(""); setFilterType("All"); setFilterStatus("All"); setPage(1); }}
              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition">
              Clear all
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Active filter pills */}
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
      <Card title="Application History" action={
        <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      }>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["#ID", "Type", "Date Range", "Duration", "Submitted", "Amount", "Status"].map((h, i) => (
                  <th key={h} className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${i <= 1 ? "text-left" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <FileText size={30} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">No applications found.</p>
                  <button onClick={() => setShowNew(true)} className="mt-3 text-sm text-blue-600 font-medium hover:underline">
                    + Submit a new one
                  </button>
                </td></tr>
              ) : paginated.map((a, i) => (
                <AppRow key={a.id} app={a} idx={i} onClick={() => setSelected(a)} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 text-sm pt-3 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-gray-500">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showNew  && <NewApplicationModal onClose={() => setShowNew(false)}  onSubmit={handleSubmit} />}
      {selected && <DetailModal app={selected} onClose={() => setSelected(null)} onCancel={handleWithdraw} />}
    </div>
  );
}