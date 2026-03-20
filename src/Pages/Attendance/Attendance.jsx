import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  X, Mail, Phone, MapPin, Search, ChevronLeft, ChevronRight,
  Users, CheckCircle2, Clock, XCircle, AlertTriangle,
  Crown, Shield, UserCheck, TrendingUp, Calendar,
  Building2, Filter, BarChart2, RefreshCw,
} from "lucide-react";

/* ─── Animation styles ─── */
const STYLES = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .slide-in-right { animation: slideInRight 0.35s cubic-bezier(.4,0,.2,1); }
  .fade-in        { animation: fadeIn 0.25s ease-out; }
  .fade-in-up     { animation: fadeInUp 0.4s ease-out forwards; }
`;
if (typeof document !== "undefined") {
  const s = document.createElement("style");
  s.innerHTML = STYLES;
  document.head.appendChild(s);
}

/* ─── Shared UI ─── */
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

/* ─── Role config ─── */
const ROLES = {
  CEO:       { label: "CEO",             icon: Crown,     color: "bg-amber-50 text-amber-700 border-amber-200",    seesAll: true  },
  HR_HEAD:   { label: "HR Head",         icon: Shield,    color: "bg-violet-50 text-violet-700 border-violet-200", seesAll: true  },
  HR:        { label: "HR Officer",      icon: Users,     color: "bg-green-50 text-green-700 border-green-200",    seesAll: true  },
  DEPT_HEAD: { label: "Department Head", icon: UserCheck, color: "bg-blue-50 text-blue-700 border-blue-200",       seesAll: false },
};

const VIEWER_USERS = [
  { id: "v1", name: "Khalid Al-Mansouri", role: "CEO",       dept: null,          avatar: "khalid"  },
  { id: "v2", name: "Aisha Khan",         role: "HR_HEAD",   dept: "HR",          avatar: "aisha"   },
  { id: "v3", name: "Sara Ali",           role: "HR",        dept: "HR",          avatar: "sara"    },
  { id: "v4", name: "Omar Rashid",        role: "DEPT_HEAD", dept: "Engineering", avatar: "omar"    },
  { id: "v5", name: "Fatima Noor",        role: "DEPT_HEAD", dept: "Finance",     avatar: "fatima"  },
  { id: "v6", name: "Nadia Sousa",        role: "DEPT_HEAD", dept: "Sales",       avatar: "nadia"   },
  { id: "v7", name: "David Kim",          role: "DEPT_HEAD", dept: "Design",      avatar: "david"   },
];

/* ─── Static mock data (deterministic) ─── */
const DEPARTMENTS = ["Engineering", "HR", "Sales", "Finance", "Design", "Operations"];
const EMP_TYPES   = ["Full-time", "Lead", "Intern"];
const STATUSES    = ["Present", "Late", "Absent", "Leave"];

const NAMES = [
  "Alice Chen","Ben Torres","Chloe Park","David Kim","Elena Russo",
  "Farhan Malik","Grace Liu","Hassan Al-Amin","Iris Novak","James Okafor",
  "Karen Patel","Liam Brooks","Maya Singh","Noah Carter","Olivia Wang",
  "Pablo Diaz","Quinn Foster","Rania El-Sayed","Sam Taylor","Tina Yamamura",
  "Uma Fischer","Victor Nguyen","Wren Johansson","Xia Chen","Yasmine Dubois",
  "Zach Miller","Ana Lima","Bilal Chaudhry","Clara Jensen","Dylan Marsh",
  "Eva Petrov","Felix Wagner","Gina Romano","Hugo Osei","Isla McLeod",
  "Julian Romero","Kira Tanaka","Leo Andersen","Mia Fernandez","Priya Mehta",
  "Quincy Adams","Rosa Herrera","Stefan Kowalski","Talia Cohen","Umar Siddiqui",
  "Vera Ivanova","Will Zhang","Yuki Matsuda","Adam Fox","Bea Santos",
  "Carlos Reyes","Dana White","Eli Grant","Fiona Bell","George Lee",
  "Hana Morita","Ivan Petrov","Julia Mara",
];

const ALL_EMPLOYEES = Array.from({ length: 57 }, (_, i) => {
  const dept    = DEPARTMENTS[i % DEPARTMENTS.length];
  const status  = STATUSES[(i * 3 + 1) % 4];
  const empType = EMP_TYPES[i % 3];
  const isIn    = status === "Present" || status === "Late";
  const inH     = status === "Late" ? 9 + (i % 2) : 8;
  const inM     = (i * 13) % 60;
  const outH    = 17 + (i % 2);
  const outM    = (i * 17) % 60;
  const day     = (i % 27) + 1;

  return {
    id:         1001 + i,
    name:       NAMES[i] || `Employee ${i + 1}`,
    department: dept,
    empType,
    date:       `2026-03-${String(day).padStart(2, "0")}`,
    status,
    inTime:  isIn ? `${String(inH).padStart(2,"0")}:${String(inM).padStart(2,"0")}` : "—",
    outTime: isIn ? `${String(outH).padStart(2,"0")}:${String(outM).padStart(2,"0")}` : "—",
    hours:   isIn ? outH - inH : 0,
  };
});

/* ─── Status / dept config ─── */
const STATUS_CFG = {
  Present: { badge: "bg-green-100 text-green-800",   dot: "bg-green-500",  icon: CheckCircle2 },
  Late:    { badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-400", icon: Clock        },
  Absent:  { badge: "bg-red-100 text-red-800",       dot: "bg-red-500",    icon: XCircle      },
  Leave:   { badge: "bg-gray-100 text-gray-600",     dot: "bg-gray-400",   icon: Calendar     },
};

const DEPT_COLORS = {
  Engineering: "bg-indigo-50 text-indigo-700",
  HR:          "bg-violet-50 text-violet-700",
  Sales:       "bg-orange-50 text-orange-700",
  Finance:     "bg-green-50 text-green-700",
  Design:      "bg-pink-50 text-pink-700",
  Operations:  "bg-cyan-50 text-cyan-700",
};

const EMPTYPE_COLORS = {
  "Full-time": "bg-blue-50 text-blue-700",
  "Lead":      "bg-purple-50 text-purple-700",
  "Intern":    "bg-amber-50 text-amber-700",
};

/* ─── Employee Sidebar ─── */
function EmployeeSidebar({ employee, onClose }) {
  if (!employee) return null;

  const attendanceRate = 91; // mock
  const stCfg = STATUS_CFG[employee.status];

  return (
    <div className="fixed inset-0 z-50 fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[390px] bg-white shadow-2xl flex flex-col overflow-y-auto slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-900 text-sm">Employee Details</span>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 space-y-5">

          {/* Profile card */}
          <div className="fade-in-up flex items-center gap-4 bg-gray-50 rounded-xl p-4">
            <img src={`https://i.pravatar.cc/150?u=${employee.id}`} alt={employee.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-900 text-base">{employee.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">ID #{employee.id}</div>
              <div className="flex items-center flex-wrap gap-1.5 mt-2">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${DEPT_COLORS[employee.department] || "bg-gray-100 text-gray-600"}`}>
                  {employee.department}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${EMPTYPE_COLORS[employee.empType] || "bg-gray-100 text-gray-600"}`}>
                  {employee.empType}
                </span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="fade-in-up space-y-2" style={{ animationDelay: "0.05s" }}>
            {[
              { Icon: Mail,      label: "Email",      value: `${employee.name.split(" ")[0].toLowerCase()}@company.com` },
              { Icon: Phone,     label: "Phone",      value: `+92-300-${String(employee.id).slice(-7)}` },
              { Icon: MapPin,    label: "Location",   value: "Karachi, Pakistan" },
              { Icon: Building2, label: "Department", value: employee.department },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Icon size={13} className="text-gray-400" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">{label}</div>
                  <div className="text-sm font-medium text-gray-800">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Today's record */}
          <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2.5">Today's Record</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Status",   value: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${stCfg?.badge}`}>{employee.status}</span> },
                { label: "In Time",  value: employee.inTime  },
                { label: "Out Time", value: employee.outTime },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-400 mb-1">{label}</div>
                  <div className="text-sm font-semibold text-gray-800">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly summary */}
          <div className="fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mb-2.5">Monthly Summary</div>

            {/* Rate bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Attendance Rate</span>
                <span className="font-semibold text-gray-700">{attendanceRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-2 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: "Present", val: 18, badge: "bg-green-100 text-green-800"  },
                { label: "Late",    val: 2,  badge: "bg-yellow-100 text-yellow-800" },
                { label: "Absent",  val: 1,  badge: "bg-red-100 text-red-800"       },
                { label: "Leave",   val: 1,  badge: "bg-gray-100 text-gray-600"     },
              ].map(({ label, val, badge }) => (
                <div key={label} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>{val} day{val !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="w-full py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function EmployeesAttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* Viewer (role switcher for demo) */
  const [viewerIdx, setViewerIdx] = useState(0);
  const currentViewer = VIEWER_USERS[viewerIdx];
  const viewerRole    = ROLES[currentViewer.role];
  const ViewerIcon    = viewerRole.icon;

  /* Filters — sync with URL params */
  const [search,      setSearch]      = useState(searchParams.get("search")   || "");
  const [fromDate,    setFromDate]    = useState(searchParams.get("fromDate") || "");
  const [toDate,      setToDate]      = useState(searchParams.get("toDate")   || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "All");
  const [filterDept,  setFilterDept]  = useState(searchParams.get("dept")    || "All");
  const [filterType,  setFilterType]  = useState(searchParams.get("type")    || "All");
  const [page,        setPage]        = useState(parseInt(searchParams.get("page")) || 1);
  const [selected,    setSelected]    = useState(null);
  const PAGE_SIZE = 10;

  /* Sync URL */
  useEffect(() => {
    const p = new URLSearchParams();
    if (search)              p.set("search",   search);
    if (fromDate)            p.set("fromDate", fromDate);
    if (toDate)              p.set("toDate",   toDate);
    if (filterStatus !== "All") p.set("status", filterStatus);
    if (filterDept   !== "All") p.set("dept",   filterDept);
    if (filterType   !== "All") p.set("type",   filterType);
    if (page !== 1)          p.set("page",     page);
    setSearchParams(p);
  }, [search, fromDate, toDate, filterStatus, filterDept, filterType, page, setSearchParams]);

  /* ── Scope: what this viewer can see ── */
  const scopedEmployees = useMemo(() => {
    if (viewerRole.seesAll) return ALL_EMPLOYEES;
    // Dept head: only sees Leads and Interns in their own department
    return ALL_EMPLOYEES.filter(e =>
      e.department === currentViewer.dept &&
      (e.empType === "Lead" || e.empType === "Intern")
    );
  }, [currentViewer, viewerRole]);

  /* Stats */
  const stats = useMemo(() => ({
    total:   scopedEmployees.length,
    present: scopedEmployees.filter(e => e.status === "Present").length,
    late:    scopedEmployees.filter(e => e.status === "Late").length,
    absent:  scopedEmployees.filter(e => e.status === "Absent").length,
    leave:   scopedEmployees.filter(e => e.status === "Leave").length,
  }), [scopedEmployees]);

  const attendanceRate = stats.total
    ? Math.round(((stats.present + stats.late) / stats.total) * 100)
    : 0;

  /* Dept breakdown (for seesAll) */
  const deptBreakdown = useMemo(() => {
    const map = {};
    scopedEmployees.forEach(e => { map[e.department] = (map[e.department] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [scopedEmployees]);

  /* Available depts for filter */
  const availableDepts = viewerRole.seesAll ? DEPARTMENTS : [currentViewer.dept].filter(Boolean);

  /* Filtered */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scopedEmployees.filter(e =>
      (!q || e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || String(e.id).includes(q)) &&
      (!fromDate    || e.date >= fromDate) &&
      (!toDate      || e.date <= toDate) &&
      (filterStatus === "All" || e.status     === filterStatus) &&
      (filterDept   === "All" || e.department === filterDept) &&
      (filterType   === "All" || e.empType    === filterType)
    );
  }, [search, fromDate, toDate, filterStatus, filterDept, filterType, scopedEmployees]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setFilter = fn => { fn(); setPage(1); };

  const resetFilters = () => {
    setSearch(""); setFromDate(""); setToDate("");
    setFilterStatus("All"); setFilterDept("All"); setFilterType("All");
    setPage(1);
  };

  const activeFilters = [
    filterDept   !== "All" && { key: "dept",   label: filterDept },
    filterStatus !== "All" && { key: "status", label: filterStatus },
    filterType   !== "All" && { key: "type",   label: filterType },
    fromDate               && { key: "from",   label: `From ${fromDate}` },
    toDate                 && { key: "to",     label: `To ${toDate}` },
    search                 && { key: "q",      label: `"${search}"` },
  ].filter(Boolean);

  const clearFilter = key => {
    setPage(1);
    if (key === "dept")   setFilterDept("All");
    if (key === "status") setFilterStatus("All");
    if (key === "type")   setFilterType("All");
    if (key === "from")   setFromDate("");
    if (key === "to")     setToDate("");
    if (key === "q")      setSearch("");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-900">

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Employees Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Daily records & overview · March 2026</p>
      </header>

      {/* ── Role Switcher (demo) ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 border-2 border-dashed border-gray-200">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Demo: Switch Role to see filtered view</p>
        <div className="flex flex-wrap gap-2">
          {VIEWER_USERS.map((u, idx) => {
            const r    = ROLES[u.role];
            const Icon = r.icon;
            const active = idx === viewerIdx;
            return (
              <button key={u.id}
                onClick={() => { setViewerIdx(idx); setPage(1); setFilterDept("All"); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition
                  ${active ? r.color + " shadow-sm" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                <img src={`https://i.pravatar.cc/150?u=${u.avatar}`} alt={u.name} className="w-5 h-5 rounded-full flex-shrink-0" />
                <span className="whitespace-nowrap">{u.name}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? "bg-white/70" : "bg-gray-200/70"}`}>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Context banner */}
        <div className={`mt-3 flex items-center gap-3 px-4 py-2.5 rounded-xl border ${viewerRole.color}`}>
          <ViewerIcon size={14} />
          <span className="text-xs font-semibold">
            {currentViewer.name} · {viewerRole.label}
            {currentViewer.dept ? ` · ${currentViewer.dept} Dept` : ""}
          </span>
          <span className="ml-auto text-[11px] opacity-70">
            {viewerRole.seesAll
              ? "✦ Full visibility — all employees across all departments"
              : `Sees Leads & Interns in ${currentViewer.dept} only`}
          </span>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Widget title="Total"   value={stats.total}   sub="In scope"        icon={Users}        color="border-blue-300 bg-blue-50 text-blue-700"      />
        <Widget title="Present" value={stats.present} sub="On time"         icon={CheckCircle2} color="border-green-300 bg-green-50 text-green-700"   />
        <Widget title="Late"    value={stats.late}    sub="Checked in late" icon={Clock}        color="border-yellow-300 bg-yellow-50 text-yellow-700" />
        <Widget title="Absent"  value={stats.absent}  sub="No check-in"     icon={XCircle}      color="border-red-300 bg-red-50 text-red-700"         />
        <Widget title="On Leave" value={stats.leave}  sub="Approved"        icon={Calendar}     color="border-gray-300 bg-gray-50 text-gray-600"      />
      </div>

      {/* Attendance rate + dept breakdown */}
      <div className={`grid gap-4 mb-6 ${viewerRole.seesAll ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"}`}>

        {/* Rate card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
            <span className="text-sm font-semibold text-gray-900">{attendanceRate}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                attendanceRate >= 80 ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : attendanceRate >= 60 ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "bg-gradient-to-r from-red-400 to-red-500"
              }`}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50 flex-wrap">
            {[
              { label: "Present", dot: "bg-green-500",  val: stats.present },
              { label: "Late",    dot: "bg-yellow-400", val: stats.late    },
              { label: "Absent",  dot: "bg-red-500",    val: stats.absent  },
              { label: "Leave",   dot: "bg-gray-400",   val: stats.leave   },
            ].map(({ label, dot, val }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs text-gray-500">{label}: <span className="font-semibold text-gray-700">{val}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Dept breakdown — only for seesAll */}
        {viewerRole.seesAll && (
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">Attendance by Department</span>
              <span className="text-xs text-gray-400">click to filter</span>
            </div>
            <div className="space-y-2.5">
              {deptBreakdown.map(([dept, total]) => {
                const present = scopedEmployees.filter(e => e.department === dept && (e.status === "Present" || e.status === "Late")).length;
                const pct     = Math.round((present / total) * 100);
                const active  = filterDept === dept;
                return (
                  <div key={dept}
                    onClick={() => setFilter(() => setFilterDept(active ? "All" : dept))}
                    className={`flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 group transition ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <span className={`w-24 text-xs font-medium truncate flex-shrink-0 transition ${active ? "text-blue-700" : "text-gray-600 group-hover:text-blue-600"}`}>{dept}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full transition-all ${active ? "bg-blue-600" : "bg-blue-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-gray-500 tabular-nums w-24 text-right whitespace-nowrap">
                      {present}/{total} present
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dept head: scope info card */}
        {!viewerRole.seesAll && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <UserCheck size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-blue-900 mb-1.5">Department Head View</div>
              <p className="text-xs text-blue-700 leading-relaxed">
                You are viewing attendance for <strong>Leads</strong> and <strong>Interns</strong> in the{" "}
                <strong>{currentViewer.dept}</strong> department. Full-time employee records are managed by HR.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="text-xs font-medium text-blue-800">
                  Leads: <span className="font-semibold">{scopedEmployees.filter(e => e.empType === "Lead").length}</span>
                </div>
                <div className="text-xs font-medium text-blue-800">
                  Interns: <span className="font-semibold">{scopedEmployees.filter(e => e.empType === "Intern").length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Filter bar ── */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">

          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Search</label>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setFilter(() => setSearch(e.target.value))}
                placeholder="Name, ID, Department…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-gray-400 transition placeholder-gray-400" />
            </div>
          </div>

          {/* From date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFilter(() => setFromDate(e.target.value))}
              className="w-full py-2 px-3 text-sm border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-gray-400 transition text-gray-700" />
          </div>

          {/* To date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">To Date</label>
            <input type="date" value={toDate} onChange={e => setFilter(() => setToDate(e.target.value))}
              className="w-full py-2 px-3 text-sm border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-gray-400 transition text-gray-700" />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Status</label>
            <select value={filterStatus} onChange={e => setFilter(() => setFilterStatus(e.target.value))}
              className="w-full py-2 px-3 text-sm border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-gray-400 cursor-pointer transition text-gray-700">
              <option value="All">All Statuses</option>
              <option>Present</option><option>Late</option><option>Absent</option><option>Leave</option>
            </select>
          </div>

          {/* Reset */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 opacity-0 select-none">Reset</label>
            <button onClick={resetFilters}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition">
              <RefreshCw size={13} /> Reset
            </button>
          </div>

        </div>

        {/* Second row: dept + emp type (only when relevant) */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
          {viewerRole.seesAll && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Department:</label>
              <select value={filterDept} onChange={e => setFilter(() => setFilterDept(e.target.value))}
                className="py-1.5 px-3 text-sm border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-gray-400 cursor-pointer transition text-gray-700">
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Employee Type:</label>
            <select value={filterType} onChange={e => setFilter(() => setFilterType(e.target.value))}
              className="py-1.5 px-3 text-sm border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-gray-400 cursor-pointer transition text-gray-700">
              <option value="All">All Types</option>
              {/* Dept heads can only see Lead & Intern — don't show Full-time option for them */}
              {(viewerRole.seesAll ? EMP_TYPES : ["Lead", "Intern"]).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {activeFilters.length > 0 && (
            <>
              <div className="w-px h-6 bg-gray-200 self-center" />
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.map(f => (
                  <span key={f.key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-medium rounded-full">
                    {f.label}
                    <button className="opacity-60 hover:opacity-100 transition" onClick={() => clearFilter(f.key)}><X size={9} /></button>
                  </span>
                ))}
              </div>
            </>
          )}

          <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} employee{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </Card>

      {/* ── Table ── */}
      <div className="mt-4">
        <Card title="Attendance Records" action={
          <span className="text-xs text-gray-400">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        }>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["#ID", "Employee", "Department", "Type", "Date", "Status", "In", "Out", "Hours"].map((h, i) => (
                    <th key={h} className={`py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap ${i <= 1 ? "text-left" : "text-center"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <Users size={30} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-400">No records match your filters.</p>
                    </td>
                  </tr>
                ) : paginated.map((e, i) => {
                  const stCfg = STATUS_CFG[e.status];
                  const StatusIcon = stCfg?.icon || Clock;
                  return (
                    <tr key={`${e.id}-${i}`}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"} hover:bg-blue-50/30 transition border-b border-gray-50 last:border-b-0`}>
                      <td className="py-3 px-4 text-xs text-gray-400 font-medium tabular-nums">#{e.id}</td>
                      <td className="py-3 px-4 cursor-pointer" onClick={() => setSelected(e)}>
                        <div className="flex items-center gap-2.5">
                          <img src={`https://i.pravatar.cc/150?u=${e.id}`} alt={e.name}
                            className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
                          <span className="text-sm font-medium text-blue-600 hover:underline whitespace-nowrap">{e.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${DEPT_COLORS[e.department] || "bg-gray-100 text-gray-600"}`}>
                          {e.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${EMPTYPE_COLORS[e.empType] || "bg-gray-100 text-gray-600"}`}>
                          {e.empType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums whitespace-nowrap">{e.date}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${stCfg?.badge}`}>
                          <StatusIcon size={11} /> {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums">{e.inTime}</td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500 tabular-nums">{e.outTime}</td>
                      <td className="py-3 px-4 text-center text-xs font-medium text-gray-700 tabular-nums">
                        {e.hours ? `${e.hours}h` : "—"}
                      </td>
                    </tr>
                  );
                })}
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
              <span className="text-xs text-gray-500">
                Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition text-gray-600">
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Sidebar */}
      <EmployeeSidebar employee={selected} onClose={() => setSelected(null)} />
    </div>
  );
}