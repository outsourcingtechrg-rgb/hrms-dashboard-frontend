import React, { useState, useMemo } from "react";
import {
  Bell, CheckCircle2, Clock, AlertTriangle, Megaphone,
  ChevronLeft, ChevronRight, Search, X, Info,
  Calendar, Tag, Building2, Pin, PinOff, Eye,
  PlusCircle, Trash2, Edit3, Send, Users,
  BarChart2, TrendingUp, FileText, Filter
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
const CATEGORIES = ["General", "HR Policy", "IT & Systems", "Finance", "Health & Safety", "Events"];
const DEPARTMENTS = ["All Employees", "HR", "Engineering", "Finance", "Sales", "Design", "Operations", "IT"];

const CAT_COLORS = {
  "General":         "bg-blue-50 text-blue-700",
  "HR Policy":       "bg-violet-50 text-violet-700",
  "IT & Systems":    "bg-cyan-50 text-cyan-700",
  "Finance":         "bg-green-50 text-green-700",
  "Health & Safety": "bg-red-50 text-red-700",
  "Events":          "bg-amber-50 text-amber-700",
};

const CAT_ICONS = {
  "General":         Megaphone,
  "HR Policy":       Tag,
  "IT & Systems":    Info,
  "Finance":         Building2,
  "Health & Safety": AlertTriangle,
  "Events":          Calendar,
};

const PRIORITY_CFG = {
  High:   { badge: "bg-red-100 text-red-700 border border-red-200",       dot: "bg-red-500"   },
  Medium: { badge: "bg-amber-100 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  Low:    { badge: "bg-gray-100 text-gray-600 border border-gray-200",    dot: "bg-gray-400"  },
};

const INITIAL_NOTICES = [
  { id: 1,  title: "Office Closure – Public Holiday",             category: "General",         priority: "High",   date: "2026-03-01", createdBy: "Aisha Khan",    department: "All Employees", pinned: true,  ackCount: 42, totalRecipients: 50, body: "Please be informed that the office will remain closed on March 23rd, 2026 in observance of the public holiday. All employees are advised to plan their work accordingly. Any urgent matters should be escalated to your line manager before March 22nd." },
  { id: 2,  title: "Updated Leave Application Process",           category: "HR Policy",       priority: "High",   date: "2026-02-28", createdBy: "Aisha Khan",    department: "All Employees", pinned: true,  ackCount: 38, totalRecipients: 50, body: "Effective April 1st, 2026, all leave applications must be submitted through the new HRMS portal at least 5 working days in advance. Paper-based applications will no longer be accepted." },
  { id: 3,  title: "Planned System Maintenance – March 10",      category: "IT & Systems",    priority: "High",   date: "2026-02-26", createdBy: "Omar Rashid",   department: "All Employees", pinned: false, ackCount: 29, totalRecipients: 50, body: "The HRMS and Finance systems will undergo scheduled maintenance on March 10, 2026 from 10:00 PM to 2:00 AM. During this window, all online services will be unavailable." },
  { id: 4,  title: "Q1 Expense Submissions Deadline",            category: "Finance",         priority: "High",   date: "2026-02-25", createdBy: "Fatima Noor",   department: "All Employees", pinned: false, ackCount: 45, totalRecipients: 50, body: "All Q1 expense claims must be submitted and approved by March 31, 2026. Late submissions will not be processed until the next quarter." },
  { id: 5,  title: "Annual Health & Safety Drill – March 18",    category: "Health & Safety", priority: "Medium", date: "2026-02-24", createdBy: "Yusuf Salem",   department: "All Employees", pinned: false, ackCount: 33, totalRecipients: 50, body: "A mandatory fire safety drill will be conducted on March 18, 2026 at 11:00 AM. All employees must participate. The drill is expected to last approximately 20 minutes." },
  { id: 6,  title: "New Password Policy Effective Immediately",  category: "IT & Systems",    priority: "High",   date: "2026-02-22", createdBy: "Omar Rashid",   department: "All Employees", pinned: false, ackCount: 40, totalRecipients: 50, body: "All employees are required to reset their passwords by March 15, 2026. Passwords must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters." },
  { id: 7,  title: "Town Hall Meeting – March 20",               category: "Events",          priority: "Medium", date: "2026-02-20", createdBy: "Aisha Khan",    department: "All Employees", pinned: false, ackCount: 22, totalRecipients: 50, body: "You are cordially invited to the All-Hands Town Hall on March 20, 2026 at 3:00 PM in the Main Conference Hall." },
  { id: 8,  title: "Ramadan Working Hours 2026",                 category: "HR Policy",       priority: "Medium", date: "2026-02-18", createdBy: "Aisha Khan",    department: "All Employees", pinned: false, ackCount: 47, totalRecipients: 50, body: "During the holy month of Ramadan, official working hours will be reduced to 6 hours per day. The revised schedule is 9:00 AM to 3:00 PM." },
  { id: 9,  title: "Cafeteria Menu Update",                      category: "General",         priority: "Low",    date: "2026-02-15", createdBy: "Sara Ali",      department: "All Employees", pinned: false, ackCount: 18, totalRecipients: 50, body: "The cafeteria has updated its weekly menu starting March 1st. A new healthy options section has been introduced with salads, grilled items, and fresh juices." },
  { id: 10, title: "Employee of the Month – February 2026",      category: "General",         priority: "Low",    date: "2026-02-14", createdBy: "Aisha Khan",    department: "All Employees", pinned: false, ackCount: 35, totalRecipients: 50, body: "We are delighted to announce that Sarah Al-Farsi from the Engineering Department has been selected as Employee of the Month for February 2026." },
  { id: 11, title: "Annual Performance Review Cycle Open",       category: "HR Policy",       priority: "High",   date: "2026-02-12", createdBy: "Aisha Khan",    department: "All Employees", pinned: false, ackCount: 41, totalRecipients: 50, body: "The Annual Performance Review cycle for 2025-2026 is now open. All employees must complete their self-assessment by March 25, 2026." },
  { id: 12, title: "Engineering Sprint Planning – Q2",           category: "IT & Systems",    priority: "Medium", date: "2026-02-10", createdBy: "Omar Rashid",   department: "Engineering",   pinned: false, ackCount: 11, totalRecipients: 12, body: "Q2 sprint planning sessions will be held on March 15–16, 2026. Please ensure your backlog items are groomed and estimated before the session." },
  { id: 13, title: "Finance Team Budget Review",                 category: "Finance",         priority: "Medium", date: "2026-02-08", createdBy: "Fatima Noor",   department: "Finance",       pinned: false, ackCount: 7,  totalRecipients: 8,  body: "The departmental budget review for Q1 is scheduled for March 12, 2026. Please prepare your spend reports and variance analysis." },
  { id: 14, title: "IT Equipment Audit – Week of March 10",      category: "IT & Systems",    priority: "Low",    date: "2026-02-05", createdBy: "Omar Rashid",   department: "All Employees", pinned: false, ackCount: 26, totalRecipients: 50, body: "The IT department will conduct an annual equipment audit during the week of March 10–14, 2026. Please ensure your device is available." },
  { id: 15, title: "Wellness Wednesday – Yoga Sessions",         category: "Events",          priority: "Low",    date: "2026-02-03", createdBy: "Sara Ali",      department: "All Employees", pinned: false, ackCount: 20, totalRecipients: 50, body: "Free yoga sessions will be offered every Wednesday in March at 1:00 PM in the rooftop garden. Sessions are open to all employees." },
];

/* ─── Create / Edit Notice Modal ─── */
function NoticeFormModal({ notice, onClose, onSave }) {
  const isEdit = !!notice;
  const [title, setTitle]         = useState(notice?.title       || "");
  const [category, setCategory]   = useState(notice?.category    || "General");
  const [priority, setPriority]   = useState(notice?.priority    || "Medium");
  const [department, setDept]     = useState(notice?.department  || "All Employees");
  const [pinned, setPinned]       = useState(notice?.pinned      || false);
  const [body, setBody]           = useState(notice?.body        || "");
  const [errors, setErrors]       = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim())  e.title = "Title is required";
    if (!body.trim())   e.body  = "Body content is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ title, category, priority, department, pinned, body });
    onClose();
  };

  const CatIcon = CAT_ICONS[category] || Megaphone;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${CAT_COLORS[category]}`}>
              <CatIcon size={15} />
            </div>
            <span className="font-semibold text-gray-900 text-sm">{isEdit ? "Edit Notice" : "Create New Notice"}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Title */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Notice Title</label>
            <input
              type="text" value={title} onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: "" })); }}
              placeholder="Enter a clear, descriptive title…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 transition ${errors.title ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 cursor-pointer transition">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 cursor-pointer transition">
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Target Audience</label>
            <select value={department} onChange={e => setDept(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 cursor-pointer transition">
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            <div>
              <div className="text-sm font-medium text-gray-800">Pin this notice</div>
              <div className="text-xs text-gray-400 mt-0.5">Pinned notices appear at the top of the list</div>
            </div>
            <button onClick={() => setPinned(p => !p)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${pinned ? "bg-blue-600" : "bg-gray-200"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pinned ? "translate-x-5.5 left-0.5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Body */}
          <div>
            <label className="text-[11px] uppercase tracking-widest font-semibold text-gray-400 mb-1.5 block">Notice Content</label>
            <textarea rows={5} value={body} onChange={e => { setBody(e.target.value); setErrors(p => ({ ...p, body: "" })); }}
              placeholder="Write the full notice content here…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-gray-400 resize-none transition ${errors.body ? "border-red-300" : "border-gray-200"}`} />
            {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body}</p>}
            <div className="text-right text-xs text-gray-400 mt-1">{body.length} chars</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
            <Send size={14} /> {isEdit ? "Save Changes" : "Publish Notice"}
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

/* ─── Notice Detail Modal ─── */
function ViewModal({ notice, onClose, onEdit, onDelete, onTogglePin }) {
  if (!notice) return null;
  const priCfg = PRIORITY_CFG[notice.priority];
  const CatIcon = CAT_ICONS[notice.category] || Megaphone;
  const ackPct = Math.round((notice.ackCount / notice.totalRecipients) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${CAT_COLORS[notice.category]}`}>{notice.category}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priCfg.badge}`}>{notice.priority}</span>
              {notice.pinned && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                  <Pin size={9} /> Pinned
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-snug">{notice.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition flex-shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Created By",  value: notice.createdBy },
              { label: "Date",        value: notice.date },
              { label: "Audience",    value: notice.department },
              { label: "Priority",    value: notice.priority },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">{label}</div>
                <div className="text-sm font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Content</div>
            <p className="text-sm text-gray-700 leading-relaxed">{notice.body}</p>
          </div>

          {/* Acknowledgement stats */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Acknowledgements</div>
              <span className="text-sm font-semibold text-gray-900">{notice.ackCount}/{notice.totalRecipients}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className={`h-2 rounded-full transition-all duration-500 ${ackPct >= 80 ? "bg-emerald-500" : ackPct >= 50 ? "bg-blue-500" : "bg-amber-400"}`}
                style={{ width: `${ackPct}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1.5">{ackPct}% of recipients acknowledged</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-2 flex-wrap">
          <button onClick={() => { onEdit(notice); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
            <Edit3 size={13} /> Edit
          </button>
          <button onClick={() => { onTogglePin(notice.id); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-xl transition">
            {notice.pinned ? <><PinOff size={13} /> Unpin</> : <><Pin size={13} /> Pin</>}
          </button>
          <button onClick={() => { onDelete(notice.id); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition">
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition text-center">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ─── */
function DeleteConfirm({ notice, onConfirm, onCancel }) {
  if (!notice) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-[calc(100vw-32px)] shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Delete Notice?</h2>
        <p className="text-sm text-gray-500 text-center mb-1">This will permanently remove:</p>
        <p className="text-sm font-medium text-gray-800 text-center mb-5 px-4">"{notice.title}"</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Notice Table Row ─── */
function NoticeRow({ notice, idx, onView, onEdit, onDelete, onTogglePin }) {
  const priCfg = PRIORITY_CFG[notice.priority];
  const CatIcon = CAT_ICONS[notice.category] || Megaphone;
  const ackPct = Math.round((notice.ackCount / notice.totalRecipients) * 100);

  return (
    <tr className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"} hover:bg-blue-50/20 transition border-b border-gray-50 last:border-b-0 group`}>
      {/* Title */}
      <td className="py-3 px-4 cursor-pointer" onClick={onView}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${CAT_COLORS[notice.category]}`}>
            <CatIcon size={13} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              {notice.pinned && <Pin size={11} className="text-blue-500 flex-shrink-0" />}
              <span className="text-sm font-medium text-gray-800 line-clamp-1">{notice.title}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{notice.body.substring(0, 60)}…</div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="py-3 px-4 text-center">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${CAT_COLORS[notice.category]}`}>{notice.category}</span>
      </td>

      {/* Priority */}
      <td className="py-3 px-4 text-center">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${priCfg.badge}`}>{notice.priority}</span>
      </td>

      {/* Created by */}
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <img src={`https://i.pravatar.cc/150?u=${notice.createdBy}`} alt={notice.createdBy}
            className="w-6 h-6 rounded-full border border-white shadow-sm" />
          <span className="text-xs text-gray-600 whitespace-nowrap">{notice.createdBy}</span>
        </div>
      </td>

      {/* Audience */}
      <td className="py-3 px-4 text-center">
        <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
          <Users size={10} className="text-gray-400" /> {notice.department}
        </span>
      </td>

      {/* Date */}
      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap">{notice.date}</td>

      {/* Ack rate */}
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-1.5 rounded-full ${ackPct >= 80 ? "bg-emerald-500" : ackPct >= 50 ? "bg-blue-500" : "bg-amber-400"}`}
              style={{ width: `${ackPct}%` }} />
          </div>
          <span className="text-xs font-medium text-gray-600 tabular-nums w-10 text-left">{notice.ackCount}/{notice.totalRecipients}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={onView}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition" title="View">
            <Eye size={13} />
          </button>
          <button onClick={onEdit}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 transition" title="Edit">
            <Edit3 size={13} />
          </button>
          <button onClick={() => onTogglePin(notice.id)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition ${notice.pinned ? "border-blue-200 text-blue-500 bg-blue-50" : "border-gray-200 text-gray-400 hover:border-blue-200 hover:text-blue-500"}`} title={notice.pinned ? "Unpin" : "Pin"}>
            <Pin size={13} />
          </button>
          <button onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition" title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Main Page ─── */
export default function AdminNoticePage() {
  const today = "2026-03-05";
  const currentUser = "Aisha Khan";

  const [notices, setNotices]       = useState(INITIAL_NOTICES);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("All");
  const [filterPri, setFilterPri]   = useState("All");
  const [filterBy, setFilterBy]     = useState("All");
  const [page, setPage]             = useState(1);
  const [viewNotice, setViewNotice] = useState(null);
  const [editNotice, setEditNotice] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const PAGE_SIZE = 8;

  /* Stats */
  const stats = useMemo(() => ({
    total:    notices.length,
    pinned:   notices.filter(n => n.pinned).length,
    highPri:  notices.filter(n => n.priority === "High").length,
    mine:     notices.filter(n => n.createdBy === currentUser).length,
    avgAck:   Math.round(notices.reduce((s, n) => s + Math.round((n.ackCount / n.totalRecipients) * 100), 0) / notices.length),
  }), [notices]);

  /* Unique creators */
  const creators = useMemo(() => [...new Set(notices.map(n => n.createdBy))], [notices]);

  /* Filtered + sorted */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...notices]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.date) - new Date(a.date);
      })
      .filter(n =>
        (!q || n.title.toLowerCase().includes(q) || n.createdBy.toLowerCase().includes(q) || n.category.toLowerCase().includes(q)) &&
        (filterCat === "All" || n.category   === filterCat) &&
        (filterPri === "All" || n.priority   === filterPri) &&
        (filterBy  === "All" || n.createdBy  === filterBy)
      );
  }, [search, filterCat, filterPri, filterBy, notices]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const setFilter  = fn => { fn(); setPage(1); };

  const activeFilters = [
    filterCat !== "All" && { key: "cat", label: filterCat },
    filterPri !== "All" && { key: "pri", label: `${filterPri} Priority` },
    filterBy  !== "All" && { key: "by",  label: `By: ${filterBy}` },
    search              && { key: "q",   label: `"${search}"` },
  ].filter(Boolean);

  const clearFilter = key => {
    setPage(1);
    if (key === "cat") setFilterCat("All");
    if (key === "pri") setFilterPri("All");
    if (key === "by")  setFilterBy("All");
    if (key === "q")   setSearch("");
  };

  /* CRUD handlers */
  const handleCreate = (data) => {
    setNotices(prev => [{
      id: prev.length + 100 + 1,
      ...data,
      date: today,
      createdBy: currentUser,
      ackCount: 0,
      totalRecipients: data.department === "All Employees" ? 50 : 12,
    }, ...prev]);
  };

  const handleEdit = (data) => {
    setNotices(prev => prev.map(n => n.id === editNotice.id ? { ...n, ...data } : n));
    setEditNotice(null);
  };

  const handleDelete = (id) => {
    setNotices(prev => prev.filter(n => n.id !== id));
    setDeleteTarget(null);
  };

  const handleTogglePin = (id) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-900">

      {/* Header */}
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Notice Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create & manage company-wide announcements · {new Date(today).toDateString()}</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm whitespace-nowrap flex-shrink-0">
          <PlusCircle size={16} /> New Notice
        </button>
      </header>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Widget title="Total Notices"  value={stats.total}   sub="Published"            icon={Bell}        color="border-blue-300 bg-blue-50 text-blue-700"    />
        <Widget title="My Notices"     value={stats.mine}    sub="Created by you"        icon={FileText}    color="border-violet-300 bg-violet-50 text-violet-700" />
        <Widget title="High Priority"  value={stats.highPri} sub="Urgent notices"        icon={AlertTriangle} color="border-red-300 bg-red-50 text-red-700"     />
        <Widget title="Avg. Ack Rate"  value={`${stats.avgAck}%`} sub="Across all notices" icon={TrendingUp}  color="border-green-300 bg-green-50 text-green-700"  />
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {CATEGORIES.map(cat => {
          const CatIcon = CAT_ICONS[cat];
          const count = notices.filter(n => n.category === cat).length;
          const active = filterCat === cat;
          return (
            <button key={cat} onClick={() => setFilter(() => setFilterCat(active ? "All" : cat))}
              className={`bg-white rounded-2xl p-3.5 shadow-sm border-2 transition text-left ${active ? `${CAT_COLORS[cat].replace("bg-", "border-").split(" ")[0].replace("50", "300")} shadow-md` : "border-transparent hover:border-gray-200"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${CAT_COLORS[cat]}`}>
                <CatIcon size={15} />
              </div>
              <div className="text-xs font-semibold text-gray-800 leading-tight">{cat}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{count} notice{count !== 1 ? "s" : ""}</div>
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
              placeholder="Search notices…"
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-gray-400 transition placeholder-gray-400 w-44" />
          </div>

          {[
            { val: filterCat, set: setFilterCat, placeholder: "All Categories", opts: CATEGORIES },
            { val: filterPri, set: setFilterPri, placeholder: "All Priorities",  opts: ["High", "Medium", "Low"] },
            { val: filterBy,  set: setFilterBy,  placeholder: "All Creators",    opts: creators },
          ].map(({ val, set, placeholder, opts }) => (
            <select key={placeholder} value={val} onChange={e => setFilter(() => set(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-gray-400 cursor-pointer transition text-gray-700">
              <option value="All">{placeholder}</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}

          {activeFilters.length > 0 && (
            <button onClick={() => { setSearch(""); setFilterCat("All"); setFilterPri("All"); setFilterBy("All"); setPage(1); }}
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
      <Card title="All Notices" action={
        <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      }>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Notice", "Category", "Priority", "Created By", "Audience", "Date", "Ack Rate", "Actions"].map((h, i) => (
                  <th key={h} className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${i === 0 ? "text-left" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Bell size={30} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">No notices found.</p>
                  <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-blue-600 font-medium hover:underline">+ Create first notice</button>
                </td></tr>
              ) : paginated.map((n, i) => (
                <NoticeRow
                  key={n.id}
                  notice={n}
                  idx={i}
                  onView={() => setViewNotice(n)}
                  onEdit={() => setEditNotice(n)}
                  onDelete={() => setDeleteTarget(n)}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 text-sm">
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
      {showCreate  && <NoticeFormModal onClose={() => setShowCreate(false)}  onSave={handleCreate} />}
      {editNotice  && <NoticeFormModal notice={editNotice} onClose={() => setEditNotice(null)} onSave={handleEdit} />}
      {viewNotice  && <ViewModal notice={viewNotice} onClose={() => setViewNotice(null)} onEdit={n => { setViewNotice(null); setEditNotice(n); }} onDelete={id => { setViewNotice(null); setDeleteTarget(notices.find(n => n.id === id)); }} onTogglePin={handleTogglePin} />}
      {deleteTarget && <DeleteConfirm notice={deleteTarget} onConfirm={() => handleDelete(deleteTarget.id)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}