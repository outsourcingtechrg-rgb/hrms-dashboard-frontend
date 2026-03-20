import React, { useMemo, useState } from "react";
import {
  X, Search, ChevronLeft, ChevronRight, SlidersHorizontal,
  CheckCircle2, XCircle, Clock, FileText, Plane, DollarSign, Filter
} from "lucide-react";

/* ─── Mock Data ─── */
const NAMES = [
  "Alice Chen","Ben Torres","Chloe Park","David Kim","Elena Russo",
  "Farhan Malik","Grace Liu","Hassan Al-Amin","Iris Novak","James Okafor",
  "Karen Patel","Liam Brooks","Maya Singh","Noah Carter","Olivia Wang",
  "Pablo Diaz","Quinn Foster","Rania El-Sayed","Sam Taylor","Tina Yamamura",
  "Uma Fischer","Victor Nguyen","Wren Johansson","Xia Chen","Yasmine Dubois",
  "Zach Miller","Ana Lima","Bilal Chaudhry","Clara Jensen","Dylan Marsh",
  "Eva Petrov","Felix Wagner","Gina Romano","Hugo Osei","Isla McLeod",
  "Julian Romero","Kira Tanaka","Leo Andersen","Mia Fernandez","Nadia Sousa",
  "Omar Khalil","Priya Mehta","Quincy Adams","Rosa Herrera","Stefan Kowalski",
  "Talia Cohen","Umar Siddiqui","Vera Ivanova","Will Zhang","Yuki Matsuda",
];

const generateData = () =>
  Array.from({ length: 50 }, (_, i) => {
    const statuses = ["Pending", "Approved", "Rejected"];
    const types = ["Leave", "Travel", "Reimbursement"];
    const depts = ["HR", "Engineering", "Sales", "Finance", "Design"];
    const reasons = [
      "Annual leave request", "Client visit - NYC", "Conference attendance",
      "Medical leave", "Team offsite travel", "Hardware expense claim",
    ];
    const rejReasons = [
      "Insufficient leave balance", "Overlapping team absences",
      "Budget exceeded", "Missing documentation",
    ];
    const rejBy = ["Line Manager", "HR Dept", "Department Head"];
    const status = statuses[Math.floor(Math.random() * 3)];
    const type = types[Math.floor(Math.random() * 3)];
    const fromDate = new Date(2026, 1, Math.floor(Math.random() * 25) + 1);
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + Math.floor(Math.random() * 7) + 1);
    return {
      id: 2000 + i,
      employeeId: 1001 + i,
      employeeName: NAMES[i] || `Employee ${i + 1}`,
      department: depts[Math.floor(Math.random() * 5)],
      type, status,
      fromDate: fromDate.toISOString().split("T")[0],
      toDate: toDate.toISOString().split("T")[0],
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      rejectedBy: status === "Rejected" ? rejBy[Math.floor(Math.random() * 3)] : null,
      rejectedReason: status === "Rejected" ? rejReasons[Math.floor(Math.random() * 4)] : null,
    };
  });

/* ─── Badge helpers ─── */
const STATUS_CONFIG = {
  Approved: { icon: <CheckCircle2 size={11} />, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  Rejected: { icon: <XCircle size={11} />,      cls: "bg-red-50 text-red-700 border border-red-200" },
  Pending:  { icon: <Clock size={11} />,         cls: "bg-violet-50 text-violet-700 border border-violet-200" },
};
const TYPE_CONFIG = {
  Leave:         { icon: <FileText size={11} />,  cls: "bg-violet-50 text-violet-700" },
  Travel:        { icon: <Plane size={11} />,      cls: "bg-blue-50 text-blue-700" },
  Reimbursement: { icon: <DollarSign size={11} />, cls: "bg-amber-50 text-amber-700" },
};
const DEPT_COLORS = {
  HR:          "bg-pink-50 text-pink-700",
  Engineering: "bg-cyan-50 text-cyan-700",
  Sales:       "bg-orange-50 text-orange-700",
  Finance:     "bg-green-50 text-green-700",
  Design:      "bg-purple-50 text-purple-700",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.icon} {status}
    </span>
  );
}
function TypeChip({ type }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.cls}`}>
      {cfg.icon} {type}
    </span>
  );
}

/* ─── Reject Modal ─── */
function RejectModal({ onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-105 max-w-[calc(100vw-32px)] shadow-2xl">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Reject Application</h2>
        <p className="text-sm text-gray-500 mb-4">Provide a reason — this will be visible to the employee.</p>
        <textarea
          rows={4}
          placeholder="Enter rejection reason…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 resize-none outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            onClick={onCancel}
          >Cancel</button>
          <button
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            onClick={() => onSubmit(reason)}
          >Confirm Rejection</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar ─── */
function Sidebar({ application, onClose, all, onUpdate }) {
  const [showReject, setShowReject] = useState(false);
  if (!application) return null;

  const others = all.filter(a => a.employeeId === application.employeeId && a.id !== application.id);
  const handleApprove = () => { onUpdate(application.id, "Approved"); onClose(); };
  const handleReject = reason => { onUpdate(application.id, "Rejected", reason, "Manager"); setShowReject(false); onClose(); };

  return (
    <>
      <div className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-101 w-full sm:w-105 bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideIn .22s ease" }}
      >
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900 text-sm">
            Application <span className="text-gray-400 font-normal">#{application.id}</span>
          </span>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition"
            onClick={onClose}
          ><X size={15} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Employee */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
            <img
              src={`https://i.pravatar.cc/150?u=${application.employeeId}`}
              alt={application.employeeName}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow"
            />
            <div>
              <div className="font-semibold text-gray-900 text-sm">{application.employeeName}</div>
              <div className="text-xs text-gray-500 mt-0.5">ID #{application.employeeId} · {application.department}</div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Type",      value: <TypeChip type={application.type} /> },
              { label: "Status",    value: <StatusBadge status={application.status} /> },
              { label: "From Date", value: <span className="text-sm text-gray-800">{application.fromDate}</span> },
              { label: "To Date",   value: <span className="text-sm text-gray-800">{application.toDate}</span> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">{label}</div>
                {value}
              </div>
            ))}
          </div>

          {/* Reason */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5">Reason</div>
            <p className="text-sm text-gray-700 leading-relaxed">{application.reason}</p>
          </div>

          {/* Rejection details */}
          {application.status === "Rejected" && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-red-400 mb-2">Rejection Details</div>
              <p className="text-sm text-red-800"><span className="font-medium">By:</span> {application.rejectedBy}</p>
              <p className="text-sm text-red-800 mt-1"><span className="font-medium">Reason:</span> {application.rejectedReason}</p>
            </div>
          )}

          {/* Other applications */}
          {others.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">
                Other Applications ({others.length})
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {others.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{a.type}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{a.fromDate} → {a.toDate}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {application.status === "Pending" && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition"
              onClick={handleApprove}
            >Approve</button>
            <button
              className="flex-1 py-2.5 border border-red-400 text-red-600 hover:bg-red-500 hover:text-white text-sm font-semibold rounded-xl transition"
              onClick={() => setShowReject(true)}
            >Reject</button>
          </div>
        )}
      </div>

      {showReject && <RejectModal onSubmit={handleReject} onCancel={() => setShowReject(false)} />}
    </>
  );
}

/* ─── Pagination ─── */
function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const arr = [1];
    if (page > 3) arr.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) arr.push(i);
    if (page < totalPages - 2) arr.push("…");
    arr.push(totalPages);
    return arr;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <span className="text-xs text-gray-400">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
        ><ChevronLeft size={14} /></button>

        {pages.map((p, i) =>
          p === "…"
            ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
            : <button
                key={p}
                onClick={() => onChange(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition border
                  ${p === page
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
              >{p}</button>
        )}

        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
        ><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ApplicationsPage() {
  const [allApplications, setAllApplications] = useState(generateData);
  const [search, setSearch]       = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus]       = useState("All");
  const [type, setType]           = useState("All");
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);
  const PAGE_SIZE = 10;

  const stats = useMemo(() => ({
    total:    allApplications.length,
    pending:  allApplications.filter(a => a.status === "Pending").length,
    approved: allApplications.filter(a => a.status === "Approved").length,
    rejected: allApplications.filter(a => a.status === "Rejected").length,
  }), [allApplications]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allApplications.filter(a =>
      (!q ||
        a.employeeName.toLowerCase().includes(q) ||
        String(a.employeeId).includes(q) ||
        a.department.toLowerCase().includes(q)
      ) &&
      (department === "All" || a.department === department) &&
      (status     === "All" || a.status     === status)     &&
      (type       === "All" || a.type       === type)
    );
  }, [search, department, status, type, allApplications]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setFilter = setter => { setter(); setPage(1); };

  const activeFilters = [
    department !== "All" && { key: "dept",   label: department },
    type       !== "All" && { key: "type",   label: type },
    status     !== "All" && { key: "status", label: status },
    search               && { key: "search", label: `"${search}"` },
  ].filter(Boolean);

  const clearFilter = key => {
    setPage(1);
    if (key === "dept")   setDepartment("All");
    if (key === "type")   setType("All");
    if (key === "status") setStatus("All");
    if (key === "search") setSearch("");
  };

  const handleUpdate = (id, newStatus, reason, by) => {
    setAllApplications(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: newStatus, rejectedReason: reason ?? a.rejectedReason, rejectedBy: by ?? a.rejectedBy }
        : a
    ));
    setSelected(prev =>
      prev?.id === id ? { ...prev, status: newStatus, rejectedReason: reason, rejectedBy: by } : prev
    );
  };

  const STAT_CARDS = [
    { label: "Total",    value: stats.total,    icon: <FileText size={16} />,     iconBg: "bg-gray-100",    iconColor: "text-gray-500",    numColor: "text-gray-800"    },
    { label: "Pending",  value: stats.pending,  icon: <Clock size={16} />,        iconBg: "bg-violet-100",  iconColor: "text-violet-600",  numColor: "text-violet-700"  },
    { label: "Approved", value: stats.approved, icon: <CheckCircle2 size={16} />, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", numColor: "text-emerald-700" },
    { label: "Rejected", value: stats.rejected, icon: <XCircle size={16} />,      iconBg: "bg-red-100",     iconColor: "text-red-500",     numColor: "text-red-700"     },
  ];

  return (
    <div className="p-6 space-y-5 min-h-screen bg-gray-50">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Employee Applications</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and manage leave, travel &amp; reimbursement requests</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon, iconBg, iconColor, numColor }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
              {icon}
            </div>
            <div>
              <div className={`text-2xl font-bold leading-none ${numColor}`}>{value}</div>
              <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-3">
        <SlidersHorizontal size={15} className="text-gray-400 shrink-0" />

        <div className="relative flex-1 min-w-45">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-400"
            placeholder="Search name, ID, department…"
            value={search}
            onChange={e => setFilter(() => setSearch(e.target.value))}
          />
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {[
          { placeholder: "All Departments", value: department, setter: setDepartment, options: ["HR","Engineering","Sales","Finance","Design"] },
          { placeholder: "All Types",       value: type,       setter: setType,       options: ["Leave","Travel","Reimbursement"] },
          { placeholder: "All Statuses",    value: status,     setter: setStatus,     options: ["Pending","Approved","Rejected"] },
        ].map(({ placeholder, value, setter, options }) => (
          <select
            key={placeholder}
            value={value}
            onChange={e => setFilter(() => setter(e.target.value))}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400 cursor-pointer transition text-gray-700"
          >
            <option value="All">{placeholder}</option>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}

        {activeFilters.length > 0 && (
          <>
            <div className="w-px h-6 bg-gray-200 hidden sm:block" />
            <button
              className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1.5 rounded-lg hover:bg-red-50 whitespace-nowrap"
              onClick={() => { setSearch(""); setDepartment("All"); setType("All"); setStatus("All"); setPage(1); }}
            >Clear all</button>
          </>
        )}
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(f => (
            <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
              <Filter size={9} /> {f.label}
              <button className="ml-0.5 opacity-60 hover:opacity-100 transition" onClick={() => clearFilter(f.key)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-800 text-sm">All Applications</span>
          <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  { label: "#ID",         center: false },
                  { label: "Employee",    center: false },
                  { label: "Department",  center: false },
                  { label: "Type",        center: false },
                  { label: "Date Range",  center: false },
                  { label: "Status",      center: true  },
                ].map(({ label, center }) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${center ? "text-center" : "text-left"}`}
                  >{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Search size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-400">No applications match your filters.</p>
                  </td>
                </tr>
              ) : paginated.map((a, idx) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${idx < paginated.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <td className="px-4 py-3.5 text-xs text-gray-400 font-medium">#{a.id}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={`https://i.pravatar.cc/150?u=${a.employeeId}`}
                        alt={a.employeeName}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                      />
                      <div>
                        <div className="font-medium text-gray-800 text-sm leading-tight">{a.employeeName}</div>
                        <div className="text-xs text-gray-400">#{a.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${DEPT_COLORS[a.department] ?? "bg-gray-100 text-gray-600"}`}>
                      {a.department}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><TypeChip type={a.type} /></td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap tabular-nums">{a.fromDate} → {a.toDate}</td>
                  <td className="px-4 py-3.5 text-center"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Detail Sidebar */}
      <Sidebar
        application={selected}
        onClose={() => setSelected(null)}
        all={allApplications}
        onUpdate={handleUpdate}
      />
    </div>
  );
}