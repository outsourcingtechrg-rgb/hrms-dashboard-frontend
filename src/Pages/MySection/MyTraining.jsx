import React, { useState, useMemo } from "react";
import {
  GraduationCap, CheckCircle2, Clock, PlayCircle, Star,
  ChevronLeft, ChevronRight, Search, X, BookOpen,
  Trophy, Target, Flame, Calendar, ChevronDown, ChevronUp,
  BarChart2, Lock, Play
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
const CATEGORIES = ["Compliance", "Technical", "Soft Skills", "Leadership", "Health & Safety", "Onboarding"];

const TRAINING_DATA = [
  { id: 1,  title: "Workplace Safety Fundamentals",      category: "Health & Safety", status: "Completed",   progress: 100, score: 92, dueDate: "2026-01-15", completedDate: "2026-01-10", duration: 45,  mandatory: true,  instructor: "Sarah M.",  modules: 6  },
  { id: 2,  title: "Anti-Harassment & Code of Conduct",  category: "Compliance",      status: "Completed",   progress: 100, score: 88, dueDate: "2026-01-20", completedDate: "2026-01-18", duration: 30,  mandatory: true,  instructor: "HR Dept",   modules: 4  },
  { id: 3,  title: "Data Privacy & GDPR Essentials",     category: "Compliance",      status: "Completed",   progress: 100, score: 95, dueDate: "2026-02-01", completedDate: "2026-01-28", duration: 60,  mandatory: true,  instructor: "Legal Team",modules: 8  },
  { id: 4,  title: "Effective Communication Skills",     category: "Soft Skills",     status: "In Progress", progress: 65,  score: null,dueDate: "2026-03-20", completedDate: null,         duration: 90,  mandatory: false, instructor: "James R.",  modules: 10 },
  { id: 5,  title: "Excel for Data Analysis",            category: "Technical",       status: "In Progress", progress: 40,  score: null,dueDate: "2026-03-28", completedDate: null,         duration: 120, mandatory: false, instructor: "Tech Dept", modules: 12 },
  { id: 6,  title: "Leadership Essentials",              category: "Leadership",      status: "In Progress", progress: 20,  score: null,dueDate: "2026-04-10", completedDate: null,         duration: 150, mandatory: false, instructor: "Emma W.",   modules: 15 },
  { id: 7,  title: "New Employee Orientation",           category: "Onboarding",      status: "Completed",   progress: 100, score: 100,dueDate: "2025-12-10", completedDate: "2025-12-08", duration: 60,  mandatory: true,  instructor: "HR Dept",   modules: 7  },
  { id: 8,  title: "Project Management Basics",          category: "Technical",       status: "Not Started", progress: 0,   score: null,dueDate: "2026-04-30", completedDate: null,         duration: 180, mandatory: false, instructor: "David K.",  modules: 18 },
  { id: 9,  title: "Conflict Resolution",                category: "Soft Skills",     status: "Not Started", progress: 0,   score: null,dueDate: "2026-05-15", completedDate: null,         duration: 45,  mandatory: false, instructor: "Nina P.",   modules: 5  },
  { id: 10, title: "Cybersecurity Awareness",            category: "Compliance",      status: "Not Started", progress: 0,   score: null,dueDate: "2026-03-31", completedDate: null,         duration: 60,  mandatory: true,  instructor: "IT Dept",   modules: 6  },
  { id: 11, title: "Time Management Mastery",            category: "Soft Skills",     status: "Completed",   progress: 100, score: 78, dueDate: "2026-02-15", completedDate: "2026-02-12", duration: 45,  mandatory: false, instructor: "James R.",  modules: 5  },
  { id: 12, title: "Advanced SQL & Databases",           category: "Technical",       status: "Not Started", progress: 0,   score: null,dueDate: "2026-06-01", completedDate: null,         duration: 240, mandatory: false, instructor: "Tech Dept", modules: 20 },
  { id: 13, title: "Emotional Intelligence at Work",     category: "Soft Skills",     status: "In Progress", progress: 80,  score: null,dueDate: "2026-03-25", completedDate: null,         duration: 60,  mandatory: false, instructor: "Emma W.",   modules: 8  },
  { id: 14, title: "Fire Safety & Emergency Procedures", category: "Health & Safety", status: "Completed",   progress: 100, score: 90, dueDate: "2026-01-31", completedDate: "2026-01-29", duration: 30,  mandatory: true,  instructor: "Safety Mgr",modules: 4  },
  { id: 15, title: "Strategic Thinking for Managers",   category: "Leadership",      status: "Not Started", progress: 0,   score: null,dueDate: "2026-05-30", completedDate: null,         duration: 120, mandatory: false, instructor: "C-Suite",   modules: 10 },
];

const CAT_COLORS = {
  "Compliance":      "bg-violet-50 text-violet-700",
  "Technical":       "bg-cyan-50 text-cyan-700",
  "Soft Skills":     "bg-pink-50 text-pink-700",
  "Leadership":      "bg-amber-50 text-amber-700",
  "Health & Safety": "bg-red-50 text-red-700",
  "Onboarding":      "bg-green-50 text-green-700",
};

const STATUS_CFG = {
  "Completed":   { badge: "bg-green-100 text-green-800",  dot: "bg-green-500"  },
  "In Progress": { badge: "bg-blue-100 text-blue-800",    dot: "bg-blue-500"   },
  "Not Started": { badge: "bg-gray-100 text-gray-600",    dot: "bg-gray-400"   },
  "Overdue":     { badge: "bg-red-100 text-red-700",      dot: "bg-red-500"    },
};

function getEffectiveStatus(t) {
  if (t.status !== "Not Started" && t.status !== "In Progress") return t.status;
  const due = new Date(t.dueDate);
  const today = new Date("2026-03-05");
  if (due < today && t.progress < 100) return "Overdue";
  return t.status;
}

/* ─── Progress ring (SVG) ─── */
function ProgressRing({ pct, size = 44, stroke = 4, color = "#10b981" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .6s ease" }}
      />
    </svg>
  );
}

/* ─── Training Detail Modal ─── */
function TrainingModal({ training, onClose, onResume }) {
  if (!training) return null;
  const status = getEffectiveStatus(training);
  const cfg = STATUS_CFG[status];

  const moduleList = Array.from({ length: training.modules }, (_, i) => {
    const done = i < Math.floor((training.progress / 100) * training.modules);
    const current = i === Math.floor((training.progress / 100) * training.modules);
    return { num: i + 1, title: `Module ${i + 1}: ${["Introduction", "Core Concepts", "Practical Application", "Case Studies", "Advanced Topics", "Assessment"][i % 6]}`, done, current };
  });

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${CAT_COLORS[training.category]}`}>{training.category}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>{status}</span>
              {training.mandatory && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">Mandatory</span>
              )}
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-snug">{training.title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition shrink-0">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Progress + score */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
            <div className="relative shrink-0">
              <ProgressRing pct={training.progress} size={56} stroke={5}
                color={training.progress === 100 ? "#10b981" : training.progress > 0 ? "#3b82f6" : "#d1d5db"}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                {training.progress}%
              </span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-800">
                {training.progress === 100 ? "Completed!" : training.progress > 0 ? "In Progress" : "Not Started"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {Math.floor((training.progress / 100) * training.modules)}/{training.modules} modules · {training.duration} mins
              </div>
              {training.score !== null && (
                <div className="flex items-center gap-1 mt-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-gray-700">Score: {training.score}/100</span>
                </div>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Instructor",  value: training.instructor },
              { label: "Duration",    value: `${training.duration} mins` },
              { label: "Due Date",    value: training.dueDate },
              { label: "Completed",   value: training.completedDate || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-1">{label}</div>
                <div className="text-sm font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>

          {/* Module list */}
          <div>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2">Course Modules</div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {moduleList.map(m => (
                <div key={m.num} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${m.done ? "bg-green-50" : m.current ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold
                    ${m.done ? "bg-green-500 text-white" : m.current ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {m.done ? "✓" : m.num}
                  </div>
                  <span className={`text-xs ${m.done ? "text-green-800 line-through opacity-60" : m.current ? "text-blue-800 font-medium" : "text-gray-600"}`}>
                    {m.title}
                  </span>
                  {!m.done && !m.current && <Lock size={10} className="ml-auto text-gray-300" />}
                  {m.current && <Play size={10} className="ml-auto text-blue-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-3">
          {training.progress < 100 && (
            <button onClick={() => { onResume(training.id); onClose(); }}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2">
              <PlayCircle size={15} />
              {training.progress > 0 ? "Resume Training" : "Start Training"}
            </button>
          )}
          <button onClick={onClose}
            className={`${training.progress < 100 ? "" : "flex-1"} py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition`}>
            {training.progress === 100 ? "Close" : "Later"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Training Card (grid view) ─── */
function TrainingCard({ training, onClick }) {
  const status = getEffectiveStatus(training);
  const cfg = STATUS_CFG[status];
  const daysUntilDue = Math.ceil((new Date(training.dueDate) - new Date("2026-03-05")) / 86400000);

  return (
    <div onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col gap-4">

      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${CAT_COLORS[training.category]}`}>{training.category}</span>
            {training.mandatory && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">Mandatory</span>}
          </div>
          <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{training.title}</h3>
        </div>
        <div className="relative shrink-0">
          <ProgressRing pct={training.progress} size={44} stroke={4}
            color={training.progress === 100 ? "#10b981" : training.progress > 0 ? "#3b82f6" : "#d1d5db"}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600">
            {training.progress}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all ${
              training.progress === 100 ? "bg-emerald-500" : training.progress > 0 ? "bg-blue-500" : "bg-gray-300"
            }`}
            style={{ width: `${training.progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[11px] text-gray-400">
          <span>{Math.floor((training.progress / 100) * training.modules)}/{training.modules} modules</span>
          <span>{training.duration} min</span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{status}</span>
        </div>
        {training.score !== null ? (
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-gray-600">{training.score}/100</span>
          </div>
        ) : (
          <span className={`text-[11px] font-medium ${
            status === "Overdue" ? "text-red-500" :
            daysUntilDue <= 7 ? "text-orange-500" : "text-gray-400"
          }`}>
            {status === "Overdue" ? "Overdue" : `Due in ${daysUntilDue}d`}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function MyTrainingPage() {
  const [trainings, setTrainings] = useState(TRAINING_DATA);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType]     = useState("All");
  const [viewMode, setViewMode]   = useState("grid");   // grid | table
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);
  const PAGE_SIZE_TABLE = 8;

  /* Stats */
  const stats = useMemo(() => {
    const withStatus = trainings.map(t => ({ ...t, eff: getEffectiveStatus(t) }));
    return {
      total:      trainings.length,
      completed:  withStatus.filter(t => t.eff === "Completed").length,
      inProgress: withStatus.filter(t => t.eff === "In Progress").length,
      overdue:    withStatus.filter(t => t.eff === "Overdue").length,
      avgScore:   Math.round(
        withStatus.filter(t => t.score !== null).reduce((s, t) => s + t.score, 0) /
        (withStatus.filter(t => t.score !== null).length || 1)
      ),
      totalHours: Math.round(trainings.reduce((s, t) => s + t.duration, 0) / 60),
    };
  }, [trainings]);

  /* Filtered */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return trainings
      .map(t => ({ ...t, eff: getEffectiveStatus(t) }))
      .filter(t =>
        (!q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) &&
        (filterCat    === "All" || t.category === filterCat) &&
        (filterStatus === "All" || t.eff === filterStatus) &&
        (filterType   === "All" || (filterType === "Mandatory" ? t.mandatory : !t.mandatory))
      );
  }, [search, filterCat, filterStatus, filterType, trainings]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE_TABLE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE_TABLE, page * PAGE_SIZE_TABLE);

  const setFilter = fn => { fn(); setPage(1); };

  const activeFilters = [
    filterCat    !== "All" && { key: "cat",    label: filterCat },
    filterStatus !== "All" && { key: "status", label: filterStatus },
    filterType   !== "All" && { key: "type",   label: filterType },
    search                 && { key: "search", label: `"${search}"` },
  ].filter(Boolean);

  const clearFilter = key => {
    setPage(1);
    if (key === "cat")    setFilterCat("All");
    if (key === "status") setFilterStatus("All");
    if (key === "type")   setFilterType("All");
    if (key === "search") setSearch("");
  };

  const handleResume = id => {
    setTrainings(prev => prev.map(t =>
      t.id === id && t.progress === 0 ? { ...t, status: "In Progress", progress: 5 } : t
    ));
  };

  const completionPct = Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-900">

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">My Training</h1>
        <p className="text-sm text-gray-500 mt-1">Learning & Development · {new Date("2026-03-05").toDateString()}</p>
      </header>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Widget title="Total Courses"  value={stats.total}      sub="Assigned to you"       icon={BookOpen}     color="border-blue-300 bg-blue-50 text-blue-700" />
        <Widget title="Completed"      value={stats.completed}  sub={`${completionPct}% done`} icon={CheckCircle2} color="border-green-300 bg-green-50 text-green-700" />
        <Widget title="In Progress"    value={stats.inProgress} sub="Currently learning"    icon={PlayCircle}   color="border-violet-300 bg-violet-50 text-violet-700" />
        <Widget title="Overdue"        value={stats.overdue}    sub="Needs attention"        icon={Flame}        color="border-red-300 bg-red-50 text-red-700" />
      </div>

      {/* Progress + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Completion bar */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Completion</span>
            <span className="text-sm font-semibold text-gray-900">{stats.completed}/{stats.total} courses</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-linear-to-r from-blue-400 to-blue-600 transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-gray-400">
            <span>{completionPct}% complete</span>
            <span>{stats.total - stats.completed} remaining</span>
          </div>

          {/* Mini breakdown */}
          <div className="flex gap-5 mt-4 flex-wrap border-t border-gray-50 pt-4">
            {[
              { label: "Completed",   val: stats.completed,  dot: "bg-green-500" },
              { label: "In Progress", val: stats.inProgress, dot: "bg-blue-500" },
              { label: "Not Started", val: stats.total - stats.completed - stats.inProgress - stats.overdue, dot: "bg-gray-300" },
              { label: "Overdue",     val: stats.overdue,    dot: "bg-red-500" },
            ].map(({ label, val, dot }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                <span className="text-xs text-gray-500">{label}: <span className="font-semibold text-gray-700">{val}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Score + hours */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500 mb-3">Quick Stats</div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <Trophy size={16} className="text-amber-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{stats.avgScore}<span className="text-sm font-normal text-gray-400">/100</span></div>
                <div className="text-xs text-gray-400">Avg. Assessment Score</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center shrink-0">
                <BarChart2 size={16} className="text-cyan-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{stats.totalHours}<span className="text-sm font-normal text-gray-400">h</span></div>
                <div className="text-xs text-gray-400">Total Learning Hours</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                <Target size={16} className="text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{trainings.filter(t => t.mandatory && t.status === "Completed").length}<span className="text-sm font-normal text-gray-400">/{trainings.filter(t => t.mandatory).length}</span></div>
                <div className="text-xs text-gray-400">Mandatory Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setFilter(() => setSearch(e.target.value))}
              placeholder="Search trainings…"
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-gray-400 transition placeholder-gray-400 w-44"
            />
          </div>

          {[
            { val: filterCat,    set: setFilterCat,    placeholder: "All Categories", opts: CATEGORIES },
            { val: filterStatus, set: setFilterStatus, placeholder: "All Statuses",   opts: ["Completed", "In Progress", "Not Started", "Overdue"] },
            { val: filterType,   set: setFilterType,   placeholder: "All Types",      opts: ["Mandatory", "Optional"] },
          ].map(({ val, set, placeholder, opts }) => (
            <select key={placeholder} value={val} onChange={e => setFilter(() => set(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-gray-400 cursor-pointer transition text-gray-700">
              <option value="All">{placeholder}</option>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}

          {activeFilters.length > 0 && (
            <button onClick={() => { setSearch(""); setFilterCat("All"); setFilterStatus("All"); setFilterType("All"); setPage(1); }}
              className="text-xs text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition">
              Clear all
            </button>
          )}
        </div>

        {/* View toggle + count */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{filtered.length} course{filtered.length !== 1 ? "s" : ""}</span>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { val: "grid",  label: "Grid",  Icon: BarChart2 },
              { val: "table", label: "Table", Icon: BookOpen  },
            ].map(({ val, label, Icon }) => (
              <button key={val} onClick={() => setViewMode(val)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  viewMode === val ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
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

      {/* ── GRID VIEW ── */}
      {viewMode === "grid" && (
        filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <Search size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No trainings match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(t => (
              <TrainingCard key={t.id} training={t} onClick={() => setSelected(t)} />
            ))}
          </div>
        )
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" && (
        <Card title="All Courses" action={
          <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        }>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Course Name", "Category", "Type", "Progress", "Due Date", "Score", "Status", "Action"].map((h, i) => (
                    <th key={h} className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${i === 0 ? "text-left" : "text-center"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="py-14 text-center text-gray-400">
                    <Search size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No courses match your filters.</p>
                  </td></tr>
                ) : paginated.map((t, i) => {
                  const cfg = STATUS_CFG[t.eff];
                  return (
                    <tr key={t.id}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"} hover:bg-blue-50/30 transition border-b border-gray-50 last:border-b-0 cursor-pointer`}
                      onClick={() => setSelected(t)}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {t.mandatory && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                          <span className="font-medium text-gray-800 text-sm">{t.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${CAT_COLORS[t.category]}`}>{t.category}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {t.mandatory
                          ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">Mandatory</span>
                          : <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">Optional</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-1.5 rounded-full ${t.progress === 100 ? "bg-emerald-500" : t.progress > 0 ? "bg-blue-500" : "bg-gray-300"}`}
                              style={{ width: `${t.progress}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right tabular-nums">{t.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums">{t.dueDate}</td>
                      <td className="py-3 px-4 text-center">
                        {t.score !== null ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star size={11} className="text-amber-400 fill-amber-400" />
                            <span className="text-xs font-semibold text-gray-700">{t.score}</span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>{t.eff}</span>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        {t.progress < 100 ? (
                          <button onClick={() => { setSelected(t); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                            <PlayCircle size={11} /> {t.progress > 0 ? "Resume" : "Start"}
                          </button>
                        ) : (
                          <button onClick={() => setSelected(t)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition text-gray-600">
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 text-sm">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-gray-500">Page {page} of {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      <TrainingModal training={selected} onClose={() => setSelected(null)} onResume={handleResume} />
    </div>
  );
}