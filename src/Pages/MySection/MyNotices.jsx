import React, { useState, useMemo } from "react";
import {
  Bell, CheckCircle2, Clock, AlertTriangle, Megaphone,
  ChevronLeft, ChevronRight, Search, X, Info,
  Calendar, Tag, Building2, Pin, Eye, Check
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

/* ─── Data ─── */
const CATEGORIES = ["General", "HR Policy", "IT & Systems", "Finance", "Health & Safety", "Events"];

const CAT_COLORS = {
  "General":         "bg-blue-50 text-blue-700",
  "HR Policy":       "bg-violet-50 text-violet-700",
  "IT & Systems":    "bg-cyan-50 text-cyan-700",
  "Finance":         "bg-green-50 text-green-700",
  "Health & Safety": "bg-red-50 text-red-700",
  "Events":          "bg-amber-50 text-amber-700",
};

const PRIORITY_CFG = {
  High:   { badge: "bg-red-100 text-red-700 border border-red-200",    dot: "bg-red-500",    label: "High"   },
  Medium: { badge: "bg-amber-100 text-amber-700 border border-amber-200", dot: "bg-amber-400", label: "Medium" },
  Low:    { badge: "bg-gray-100 text-gray-600 border border-gray-200", dot: "bg-gray-400",   label: "Low"    },
};

const NOTICES = [
  { id: 1,  title: "Office Closure – Public Holiday",             category: "General",         priority: "High",   date: "2026-03-01", postedBy: "HR Department",   pinned: true,  body: "Please be informed that the office will remain closed on March 23rd, 2026 in observance of the public holiday. All employees are advised to plan their work accordingly. Any urgent matters should be escalated to your line manager before March 22nd." },
  { id: 2,  title: "Updated Leave Application Process",           category: "HR Policy",       priority: "High",   date: "2026-02-28", postedBy: "HR Department",   pinned: true,  body: "Effective April 1st, 2026, all leave applications must be submitted through the new HRMS portal at least 5 working days in advance. Paper-based applications will no longer be accepted. Please ensure you have completed your HRMS profile before submitting any requests." },
  { id: 3,  title: "Planned System Maintenance – March 10",      category: "IT & Systems",    priority: "High",   date: "2026-02-26", postedBy: "IT Department",   pinned: false, body: "The HRMS and Finance systems will undergo scheduled maintenance on March 10, 2026 from 10:00 PM to 2:00 AM. During this window, all online services will be unavailable. Please save your work and log out before 10:00 PM." },
  { id: 4,  title: "Q1 Expense Submissions Deadline",            category: "Finance",         priority: "High",   date: "2026-02-25", postedBy: "Finance Team",    pinned: false, body: "All Q1 expense claims must be submitted and approved by March 31, 2026. Late submissions will not be processed until the next quarter. Please ensure all receipts are attached and claims are properly categorized." },
  { id: 5,  title: "Annual Health & Safety Drill – March 18",    category: "Health & Safety", priority: "Medium", date: "2026-02-24", postedBy: "Safety Officer",  pinned: false, body: "A mandatory fire safety drill will be conducted on March 18, 2026 at 11:00 AM. All employees must participate. Please familiarise yourself with the emergency exit routes on your floor. The drill is expected to last approximately 20 minutes." },
  { id: 6,  title: "New Password Policy Effective Immediately",  category: "IT & Systems",    priority: "High",   date: "2026-02-22", postedBy: "IT Department",   pinned: false, body: "In line with our updated cybersecurity standards, all employees are required to reset their passwords by March 15, 2026. Passwords must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters. Two-factor authentication is now mandatory." },
  { id: 7,  title: "Town Hall Meeting – March 20",               category: "Events",          priority: "Medium", date: "2026-02-20", postedBy: "CEO Office",      pinned: false, body: "You are cordially invited to the All-Hands Town Hall on March 20, 2026 at 3:00 PM in the Main Conference Hall. The agenda includes Q1 performance review, upcoming initiatives, and an open Q&A session with the leadership team. Attendance is strongly encouraged." },
  { id: 8,  title: "Ramadan Working Hours 2026",                 category: "HR Policy",       priority: "Medium", date: "2026-02-18", postedBy: "HR Department",   pinned: false, body: "During the holy month of Ramadan (March 1 – March 31, 2026), official working hours will be reduced to 6 hours per day. The revised schedule is 9:00 AM to 3:00 PM. All employees are expected to adhere to this schedule regardless of their religious affiliation." },
  { id: 9,  title: "Cafeteria Menu Update",                      category: "General",         priority: "Low",    date: "2026-02-15", postedBy: "Admin Team",      pinned: false, body: "The cafeteria has updated its weekly menu starting March 1st. A new healthy options section has been introduced with salads, grilled items, and fresh juices. Pricing remains unchanged. The full menu is available on the notice board outside the cafeteria." },
  { id: 10, title: "Employee of the Month – February 2026",      category: "General",         priority: "Low",    date: "2026-02-14", postedBy: "HR Department",   pinned: false, body: "We are delighted to announce that Sarah Al-Farsi from the Engineering Department has been selected as Employee of the Month for February 2026. Sarah demonstrated exceptional dedication and leadership during the Q1 project delivery. Please join us in congratulating her!" },
  { id: 11, title: "Annual Performance Review Cycle Open",       category: "HR Policy",       priority: "High",   date: "2026-02-12", postedBy: "HR Department",   pinned: false, body: "The Annual Performance Review cycle for 2025-2026 is now open. All employees must complete their self-assessment by March 25, 2026. Managers are required to schedule review meetings and submit final ratings by April 10, 2026. Detailed guidelines have been shared via email." },
  { id: 12, title: "Parking Lot Renovation – Temporary Changes", category: "General",         priority: "Medium", date: "2026-02-10", postedBy: "Facilities",      pinned: false, body: "The main parking lot will undergo renovation from March 5 to March 20, 2026. During this period, employees are requested to use the alternate parking area on the east side of the building. Shuttle service will be available every 30 minutes from 7:30 AM to 9:30 AM and 4:30 PM to 6:30 PM." },
  { id: 13, title: "Updated Travel & Accommodation Policy",      category: "Finance",         priority: "Medium", date: "2026-02-08", postedBy: "Finance Team",    pinned: false, body: "The company's travel and accommodation policy has been revised effective March 1, 2026. Key changes include updated per diem rates, mandatory use of the approved travel booking portal, and new approval thresholds. Please review the updated policy document on the HR portal before your next business trip." },
  { id: 14, title: "IT Equipment Audit – Week of March 10",      category: "IT & Systems",    priority: "Low",    date: "2026-02-05", postedBy: "IT Department",   pinned: false, body: "The IT department will conduct an annual equipment audit during the week of March 10–14, 2026. A team member will visit your workstation to verify serial numbers and software licenses. Please ensure your device is available and do not remove any asset tags. Cooperation is appreciated." },
  { id: 15, title: "Wellness Wednesday – Yoga Sessions",         category: "Events",          priority: "Low",    date: "2026-02-03", postedBy: "Wellness Team",   pinned: false, body: "As part of our employee wellness initiative, free yoga sessions will be offered every Wednesday in March at 1:00 PM in the rooftop garden. Sessions are open to all employees and no prior experience is required. Please bring your own mat. Register via the wellness portal by Tuesday each week." },
];

/* ─── Notice Detail Modal ─── */
function NoticeModal({ notice, onClose, onAcknowledge }) {
  if (!notice) return null;
  const priCfg = PRIORITY_CFG[notice.priority];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${CAT_COLORS[notice.category]}`}>{notice.category}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priCfg.badge}`}>{notice.priority} Priority</span>
              {notice.pinned && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                  <Pin size={9} /> Pinned
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-snug">{notice.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Meta row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Building2 size={12} className="text-gray-400" />
              <span>{notice.postedBy}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar size={12} className="text-gray-400" />
              <span>{notice.date}</span>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{notice.body}</p>
          </div>

          {/* Acknowledgement status */}
          {notice.acknowledged ? (
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-green-800">Acknowledged</div>
                <div className="text-xs text-green-600 mt-0.5">on {notice.acknowledgedDate}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <Clock size={16} className="text-amber-500 shrink-0" />
              <p className="text-sm text-amber-800">Please read and acknowledge this notice.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {!notice.acknowledged && (
            <button
              onClick={() => { onAcknowledge(notice.id); onClose(); }}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Check size={15} /> Acknowledge
            </button>
          )}
          <button
            onClick={onClose}
            className={`${notice.acknowledged ? "flex-1" : ""} py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition`}
          >Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Notice Row Card (list item) ─── */
function NoticeRow({ notice, onClick, onQuickAck }) {
  const priCfg = PRIORITY_CFG[notice.priority];
  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${notice.acknowledged
          ? "bg-white border-gray-100 hover:border-gray-200"
          : "bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm"
        }
        ${notice.pinned ? "border-l-4 border-l-blue-400" : ""}
      `}
    >
      {/* Unread dot */}
      {!notice.acknowledged && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
      )}

      {/* Category icon area */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${CAT_COLORS[notice.category]}`}>
        {notice.category === "HR Policy"       ? <Tag size={16} />       :
         notice.category === "IT & Systems"    ? <Info size={16} />      :
         notice.category === "Finance"         ? <Building2 size={16} /> :
         notice.category === "Health & Safety" ? <AlertTriangle size={16} /> :
         notice.category === "Events"          ? <Calendar size={16} />  :
         <Megaphone size={16} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {notice.pinned && <Pin size={11} className="text-blue-500" />}
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${CAT_COLORS[notice.category]}`}>{notice.category}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priCfg.badge}`}>{notice.priority}</span>
        </div>
        <h3 className={`text-sm font-semibold leading-snug mb-1 ${notice.acknowledged ? "text-gray-500" : "text-gray-900"}`}>
          {notice.title}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-1">{notice.body}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[11px] text-gray-400 flex items-center gap-1"><Building2 size={10} />{notice.postedBy}</span>
          <span className="text-[11px] text-gray-400 flex items-center gap-1"><Calendar size={10} />{notice.date}</span>
          {notice.acknowledged && (
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 size={10} /> Acknowledged {notice.acknowledgedDate}
            </span>
          )}
        </div>
      </div>

      {/* Quick ack button — shows on hover */}
      {!notice.acknowledged && (
        <button
          onClick={e => { e.stopPropagation(); onQuickAck(notice.id); }}
          className="opacity-0 group-hover:opacity-100 absolute right-4 bottom-4 flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition-all"
        >
          <Check size={10} /> Acknowledge
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function MyNoticePage() {
  const today = "2026-03-05";

  const [notices, setNotices] = useState(() =>
    NOTICES.map(n => ({
      ...n,
      acknowledged: Math.random() > 0.6,
      acknowledgedDate: Math.random() > 0.6 ? "2026-03-01" : null,
    }))
  );

  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("All");
  const [filterAck, setFilterAck]   = useState("All");      // All | Acknowledged | Unacknowledged
  const [filterPri, setFilterPri]   = useState("All");
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);
  const PAGE_SIZE = 8;

  /* Stats */
  const stats = useMemo(() => ({
    total:    notices.length,
    acked:    notices.filter(n => n.acknowledged).length,
    unacked:  notices.filter(n => !n.acknowledged).length,
    highPri:  notices.filter(n => n.priority === "High" && !n.acknowledged).length,
  }), [notices]);

  /* Filtered */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...notices]
      .sort((a, b) => {
        // Pinned first, then by date desc
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.date) - new Date(a.date);
      })
      .filter(n =>
        (!q || n.title.toLowerCase().includes(q) || n.category.toLowerCase().includes(q) || n.postedBy.toLowerCase().includes(q)) &&
        (filterCat === "All" || n.category === filterCat) &&
        (filterAck === "All" || (filterAck === "Acknowledged" ? n.acknowledged : !n.acknowledged)) &&
        (filterPri === "All" || n.priority === filterPri)
      );
  }, [search, filterCat, filterAck, filterPri, notices]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setFilter = fn => { fn(); setPage(1); };

  const acknowledge = id => {
    setNotices(prev => prev.map(n =>
      n.id === id ? { ...n, acknowledged: true, acknowledgedDate: today } : n
    ));
    setSelected(prev => prev?.id === id ? { ...prev, acknowledged: true, acknowledgedDate: today } : prev);
  };

  const acknowledgeAll = () => {
    setNotices(prev => prev.map(n => n.acknowledged ? n : { ...n, acknowledged: true, acknowledgedDate: today }));
  };

  const activeFilters = [
    filterCat !== "All" && { key: "cat", label: filterCat },
    filterAck !== "All" && { key: "ack", label: filterAck },
    filterPri !== "All" && { key: "pri", label: `${filterPri} Priority` },
    search              && { key: "search", label: `"${search}"` },
  ].filter(Boolean);

  const clearFilter = key => {
    setPage(1);
    if (key === "cat")    setFilterCat("All");
    if (key === "ack")    setFilterAck("All");
    if (key === "pri")    setFilterPri("All");
    if (key === "search") setSearch("");
  };

  const ackPct = Math.round((stats.acked / stats.total) * 100);

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-900">

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">My Notices</h1>
        <p className="text-sm text-gray-500 mt-1">Company Announcements · {new Date(today).toDateString()}</p>
      </header>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Widget title="Total Notices"     value={stats.total}   sub="All announcements"         icon={Bell}         color="border-blue-300 bg-blue-50 text-blue-700" />
        <Widget title="Acknowledged"      value={stats.acked}   sub={`${ackPct}% completion`}   icon={CheckCircle2} color="border-green-300 bg-green-50 text-green-700" />
        <Widget title="Unacknowledged"    value={stats.unacked} sub="Pending your action"        icon={Clock}        color="border-yellow-300 bg-yellow-50 text-yellow-700" />
        <Widget title="High Priority"     value={stats.highPri} sub="Unread urgent notices"      icon={AlertTriangle} color="border-red-300 bg-red-50 text-red-700" />
      </div>


      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text" value={search}
              onChange={e => setFilter(() => setSearch(e.target.value))}
              placeholder="Search notices…"
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-gray-400 transition placeholder-gray-400 w-44"
            />
          </div>

          {[
            { val: filterCat, set: setFilterCat, placeholder: "All Categories", opts: CATEGORIES },
            { val: filterPri, set: setFilterPri, placeholder: "All Priorities",  opts: ["High", "Medium", "Low"] },
            { val: filterAck, set: setFilterAck, placeholder: "All Statuses",    opts: ["Acknowledged", "Unacknowledged"] },
          ].map(({ val, set, placeholder, opts }) => (
            <select key={placeholder} value={val} onChange={e => setFilter(() => set(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-gray-400 cursor-pointer transition text-gray-700">
              <option value="All">{placeholder}</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}

          {activeFilters.length > 0 && (
            <button onClick={() => { setSearch(""); setFilterCat("All"); setFilterAck("All"); setFilterPri("All"); setPage(1); }}
              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition">
              Clear all
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400">{filtered.length} notice{filtered.length !== 1 ? "s" : ""}</span>
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

      {/* Notice list */}
      <Card
        title="All Notices"
        action={<span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>}
      >
        {paginated.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No notices match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map(n => (
              <NoticeRow
                key={n.id}
                notice={n}
                onClick={() => setSelected(n)}
                onQuickAck={acknowledge}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100 text-sm">
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

      {/* Detail modal */}
      <NoticeModal notice={selected} onClose={() => setSelected(null)} onAcknowledge={acknowledge} />
    </div>
  );
}