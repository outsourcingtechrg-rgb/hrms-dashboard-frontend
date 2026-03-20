import React, { useState, useMemo } from "react";
import {
  BookOpen, CheckCircle2, Clock, ShieldAlert, Eye, ChevronLeft,
  ChevronRight, Search, X, FileText, AlertCircle, BadgeCheck
} from "lucide-react";

/* ─── Reused from attendance page ─── */
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
        <h3 className="text-2xl font-semibold">{value}</h3>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
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

/* ─── Mock policy data ─── */
const CATEGORIES = ["HR", "IT & Security", "Finance", "Legal", "Operations", "Health & Safety"];

const POLICY_TITLES = [
  "Code of Conduct", "Remote Work Policy", "Data Privacy & Protection",
  "Anti-Harassment Policy", "Expense Reimbursement Guidelines", "IT Acceptable Use Policy",
  "Annual Leave Policy", "Confidentiality Agreement", "Social Media Policy",
  "Workplace Health & Safety", "Performance Review Process", "Onboarding Handbook",
  "Travel & Accommodation Policy", "Whistleblower Protection Policy", "Conflict of Interest Policy",
  "Password & Access Management", "Disciplinary Procedure", "Equal Opportunity Policy",
  "Payroll & Compensation Policy", "Business Continuity Plan",
];

const generatePolicies = () =>
  POLICY_TITLES.map((title, i) => {
    const isRead = Math.random() > 0.45;
    const updatedDaysAgo = Math.floor(Math.random() * 180);
    const updatedDate = new Date(2026, 2, 5);
    updatedDate.setDate(updatedDate.getDate() - updatedDaysAgo);
    const mandatory = Math.random() > 0.4;
    const version = `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 9)}`;
    return {
      id: 100 + i,
      title,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      isRead,
      readDate: isRead
        ? new Date(updatedDate.getTime() + Math.random() * 7 * 86400000).toISOString().split("T")[0]
        : null,
      updatedDate: updatedDate.toISOString().split("T")[0],
      mandatory,
      version,
      pages: Math.floor(Math.random() * 20) + 2,
    };
  });

/* ─── Category colors ─── */
const CAT_COLORS = {
  "HR":               "bg-pink-50 text-pink-700",
  "IT & Security":    "bg-cyan-50 text-cyan-700",
  "Finance":          "bg-green-50 text-green-700",
  "Legal":            "bg-violet-50 text-violet-700",
  "Operations":       "bg-orange-50 text-orange-700",
  "Health & Safety":  "bg-red-50 text-red-700",
};

/* ─── Policy Detail Modal ─── */
function PolicyModal({ policy, onClose, onMarkRead }) {
  if (!policy) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${CAT_COLORS[policy.category]}`}>
                {policy.category}
              </span>
              {policy.mandatory && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200">
                  Mandatory
                </span>
              )}
              <span className="text-xs text-gray-400">{policy.version}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900">{policy.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition shrink-0"
          ><X size={15} /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Last Updated", value: policy.updatedDate },
              { label: "Pages",        value: `${policy.pages} pages` },
              { label: "Status",       value: policy.isRead ? "Read" : "Unread" },
              { label: "Read On",      value: policy.readDate || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">{label}</div>
                <div className={`text-sm font-medium ${label === "Status" && !policy.isRead ? "text-amber-600" : label === "Status" ? "text-emerald-600" : "text-gray-800"}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Simulated document preview */}
          <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
              <FileText size={13} /> Document Preview
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-2.5 rounded-full bg-gray-200 ${i === 4 ? "w-2/3" : "w-full"}`} />
            ))}
            <div className="h-2.5 rounded-full bg-gray-200 w-5/6 mt-1" />
            <div className="h-2.5 rounded-full bg-gray-200 w-full mt-1" />
            <div className="h-2.5 rounded-full bg-gray-200 w-3/4 mt-1" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {!policy.isRead && (
            <button
              onClick={() => { onMarkRead(policy.id); onClose(); }}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition"
            >Mark as Read</button>
          )}
          <button
            onClick={onClose}
            className={`${policy.isRead ? "flex-1" : ""} py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition`}
          >{policy.isRead ? "Close" : "Read Later"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MyPoliciesPage() {
  const [policies, setPolicies] = useState(generatePolicies);
  const [search, setSearch]     = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterRead, setFilterRead] = useState("All"); // All | Read | Unread
  const [filterMandatory, setFilterMandatory] = useState("All");
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState(null);
  const PAGE_SIZE = 8;

  /* Stats */
  const stats = useMemo(() => ({
    total:     policies.length,
    read:      policies.filter(p => p.isRead).length,
    unread:    policies.filter(p => !p.isRead).length,
    mandatory: policies.filter(p => p.mandatory && !p.isRead).length,
  }), [policies]);

  /* Filtering */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return policies.filter(p =>
      (!q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) &&
      (filterCat       === "All" || p.category === filterCat) &&
      (filterRead      === "All" || (filterRead === "Read" ? p.isRead : !p.isRead)) &&
      (filterMandatory === "All" || (filterMandatory === "Mandatory" ? p.mandatory : !p.mandatory))
    );
  }, [search, filterCat, filterRead, filterMandatory, policies]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = fn => { fn(); setPage(1); };

  const markRead = id => {
    setPolicies(prev => prev.map(p =>
      p.id === id ? { ...p, isRead: true, readDate: new Date().toISOString().split("T")[0] } : p
    ));
  };

  const markAllRead = () => {
    setPolicies(prev => prev.map(p =>
      !p.isRead ? { ...p, isRead: true, readDate: new Date().toISOString().split("T")[0] } : p
    ));
  };

  /* Active filters */
  const activeFilters = [
    filterCat       !== "All" && { key: "cat",       label: filterCat },
    filterRead      !== "All" && { key: "read",      label: filterRead },
    filterMandatory !== "All" && { key: "mandatory", label: filterMandatory },
    search                    && { key: "search",    label: `"${search}"` },
  ].filter(Boolean);

  const clearFilter = key => {
    setPage(1);
    if (key === "cat")       setFilterCat("All");
    if (key === "read")      setFilterRead("All");
    if (key === "mandatory") setFilterMandatory("All");
    if (key === "search")    setSearch("");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-900">

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">My Policies</h1>
        <p className="text-sm text-gray-500 mt-1">
          Acknowledgement &amp; Compliance · {new Date().toDateString()}
        </p>
      </header>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Widget
          title="Total Policies"
          value={stats.total}
          icon={BookOpen}
          color="border-blue-300 bg-blue-50 text-blue-700"
        />
        <Widget
          title="Read"
          value={stats.read}
          sub={`${Math.round((stats.read / stats.total) * 100)}% completion`}
          icon={CheckCircle2}
          color="border-green-300 bg-green-50 text-green-700"
        />
        <Widget
          title="Unread"
          value={stats.unread}
          sub="Pending your review"
          icon={Clock}
          color="border-yellow-300 bg-yellow-50 text-yellow-700"
        />
        <Widget
          title="Mandatory Unread"
          value={stats.mandatory}
          sub="Requires urgent attention"
          icon={ShieldAlert}
          color="border-red-300 bg-red-50 text-red-700"
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Completion</span>
          <span className="text-sm font-semibold text-gray-900">
            {stats.read}/{stats.total} policies read
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
            style={{ width: `${(stats.read / stats.total) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-400">{Math.round((stats.read / stats.total) * 100)}% complete</span>
          {stats.unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-emerald-600 font-medium hover:underline"
            >Mark all as read</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex gap-3 flex-wrap items-center">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => resetPage(() => setSearch(e.target.value))}
              placeholder="Search policies…"
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-gray-400 transition placeholder-gray-400 w-48"
            />
          </div>

          <select
            value={filterCat}
            onChange={e => resetPage(() => setFilterCat(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <select
            value={filterRead}
            onChange={e => resetPage(() => setFilterRead(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Read">Read</option>
            <option value="Unread">Unread</option>
          </select>

          <select
            value={filterMandatory}
            onChange={e => resetPage(() => setFilterMandatory(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Mandatory">Mandatory</option>
            <option value="Optional">Optional</option>
          </select>

          {activeFilters.length > 0 && (
            <button
              onClick={() => { setSearch(""); setFilterCat("All"); setFilterRead("All"); setFilterMandatory("All"); setPage(1); }}
              className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1.5 rounded-lg hover:bg-red-50"
            >Clear all</button>
          )}
        </div>

        <span className="text-sm text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
              {f.label}
              <button className="opacity-60 hover:opacity-100 transition" onClick={() => clearFilter(f.key)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Policy Table */}
      <Card title="Policy Documents">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 text-left">Policy Name</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-center">Version</th>
                <th className="py-3 px-4 text-center">Last Updated</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Read On</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-gray-400">
                    <Search size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No policies match your filters.</p>
                  </td>
                </tr>
              ) : paginated.map((p, i) => (
                <tr
                  key={p.id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50/40 transition cursor-pointer`}
                  onClick={() => setSelected(p)}
                >
                  {/* Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {!p.isRead && p.mandatory && (
                        <AlertCircle size={14} className="text-red-500 shrink-0" />
                      )}
                      {!p.isRead && !p.mandatory && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                      {p.isRead && (
                        <BadgeCheck size={14} className="text-emerald-500 shrink-0" />
                      )}
                      <span className={`font-medium ${!p.isRead ? "text-gray-900" : "text-gray-500"}`}>
                        {p.title}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${CAT_COLORS[p.category]}`}>
                      {p.category}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-4 text-center">
                    {p.mandatory
                      ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">Mandatory</span>
                      : <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Optional</span>
                    }
                  </td>

                  {/* Version */}
                  <td className="py-3 px-4 text-center text-xs text-gray-400 font-mono">{p.version}</td>

                  {/* Updated */}
                  <td className="py-3 px-4 text-center text-xs text-gray-500">{p.updatedDate}</td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.isRead
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {p.isRead ? "Read" : "Unread"}
                    </span>
                  </td>

                  {/* Read date */}
                  <td className="py-3 px-4 text-center text-xs text-gray-400">
                    {p.readDate || <span className="text-gray-300">—</span>}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelected(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition text-gray-600"
                      >
                        <Eye size={12} /> View
                      </button>
                      {!p.isRead && (
                        <button
                          onClick={() => markRead(p.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                        >
                          <CheckCircle2 size={12} /> Mark Read
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="text-gray-500">Page {page} of {totalPages || 1}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </Card>

      {/* Policy Detail Modal */}
      <PolicyModal
        policy={selected}
        onClose={() => setSelected(null)}
        onMarkRead={id => { markRead(id); }}
      />
    </div>
  );
}