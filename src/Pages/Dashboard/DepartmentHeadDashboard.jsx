import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Megaphone,
  GraduationCap,
} from "lucide-react";

/* ================= ICON BADGE ================= */
function IconBadge({ icon: Icon, color }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${color}`}
    >
      <Icon className="w-5 h-5" />
    </span>
  );
}

/* ================= WIDGET ================= */
function Widget({ title, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
      <IconBadge icon={icon} color={color} />
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h3 className="text-2xl font-semibold">{value}</h3>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

/* ================= CARD ================= */
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-medium text-gray-500 mb-4">{title}</h2>
      {children}
    </div>
  );
}

/* ================= ATTENDANCE CHART ================= */
function AttendanceChart() {
  const [view, setView] = React.useState("weekly");

  const data = {
    weekly: [
      { label: "Mon", present: 22, late: 3, absent: 1 },
      { label: "Tue", present: 23, late: 2, absent: 1 },
      { label: "Wed", present: 21, late: 4, absent: 1 },
      { label: "Thu", present: 24, late: 1, absent: 1 },
      { label: "Fri", present: 25, late: 1, absent: 0 },
    ],
    monthly: [
      { label: "W1", present: 105, late: 14, absent: 6 },
      { label: "W2", present: 110, late: 10, absent: 5 },
      { label: "W3", present: 108, late: 12, absent: 6 },
      { label: "W4", present: 112, late: 8, absent: 5 },
    ],
    yearly: [
      { label: "Jan", present: 420, late: 48, absent: 22 },
      { label: "Feb", present: 410, late: 55, absent: 25 },
      { label: "Mar", present: 430, late: 40, absent: 18 },
      { label: "Apr", present: 440, late: 36, absent: 15 },
    ],
  };

  return (
    <>
      <div className="flex gap-2 mb-4">
        {["weekly", "monthly", "yearly"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
              view === v
                ? "bg-red-700 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data[view]}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#22c55e" />
            <Bar dataKey="late" fill="#eab308" />
            <Bar dataKey="absent" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* ================= DASHBOARD ================= */
export default function DepartmentHeadDashboard() {
  const [view, setView] = React.useState("department");

  const employees = [
    { name: "Ali Raza", status: "Present", kpi: 82 },
    { name: "Sara Khan", status: "Late", kpi: 75 },
    { name: "Usman Ali", status: "Present", kpi: 88 },
    { name: "Ayesha Noor", status: "Absent", kpi: 69 },
  ];

  const myData = {
    kpi: 86,
    attendance: { present: 18, late: 2, absent: 0 },
    notices: [
      "Your KPI review is scheduled next week.",
      "One policy update requires your acknowledgment.",
    ],
    trainingCount: 3,
  };

  const statusColor = {
    Present: "text-green-600",
    Late: "text-yellow-600",
    Absent: "text-red-600",
  };

  return (
    <div className="min-h-screen page-bg px-8 py-10 text-gray-900">
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">
          Department Dashboard –{" "}
          <span className="text-red-700">IT</span>
        </h1>
        <p className="text-sm text-gray-500">
          Department Head View • {new Date().toDateString()}
        </p>
      </header>

      {/* VIEW SWITCH */}
      <div className="flex gap-2 mb-10">
        {["department", "my"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-5 py-2 rounded-xl text-sm font-medium ${
              view === v
                ? "bg-red-700 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {v === "department" ? "Department View" : "My View"}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {view === "department" ? (
           <div className="min-h-screen px-2 text-gray-900">
       
             {/* Widgets */}
             <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
               <Widget
                 title="Total Employees"
                 value="26"
                 sub="In department"
                 icon={Users}
                 color="border-blue-300 bg-blue-50 text-blue-700"
               />
               <Widget
                 title="Present Today"
                 value="22"
                 sub="On time"
                 icon={CheckCircle2}
                 color="border-green-300 bg-green-50 text-green-700"
               />
               <Widget
                 title="Late / Absent"
                 value="4"
                 sub="Attention required"
                 icon={AlertTriangle}
                 color="border-yellow-300 bg-yellow-50 text-yellow-700"
               />
               <Widget
                 title="Avg KPI"
                 value="81%"
                 sub="Department KPI"
                 icon={FileText}
                 color="border-purple-300 bg-purple-50 text-purple-700"
               />
             </section>
       
             {/* Main Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
               {/* LEFT */}
               <div className="lg:col-span-2 space-y-8">
                 <Card title="Attendance Overview">
                   <AttendanceChart />
                 </Card>
       
                 <Card title="Department Employees">
                   <table className="w-full text-sm border-collapse">
                     <thead>
                       <tr className="text-left text-gray-500 border-b">
                         <th className="py-2">Employee</th>
                         <th className="py-2 text-center">Status</th>
                         <th className="py-2 text-right">KPI</th>
                       </tr>
                     </thead>
                     <tbody>
                       {employees.map((e, i) => (
                         <tr
                           key={i}
                           className="border-b last:border-0 hover:bg-gray-50"
                         >
                           <td className="py-3 font-medium">{e.name}</td>
                           <td
                             className={`py-3 text-center font-medium ${statusColor[e.status]}`}
                           >
                             {e.status}
                           </td>
                           <td className="py-3 text-right">{e.kpi}%</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </Card>
               </div>
       
               {/* RIGHT */}
               <div className="lg:col-span-2 space-y-6">
                 <Card title="Department Notices">
                   <ul className="space-y-3 text-sm">
                     <li className="flex gap-3 items-start">
                       <IconBadge
                         icon={Megaphone}
                         color="border-blue-300 bg-blue-50 text-blue-700"
                       />
                       KPI review cycle in progress for this department.
                     </li>
                     <li className="flex gap-3 items-start">
                       <IconBadge
                         icon={Clock}
                         color="border-yellow-300 bg-yellow-50 text-yellow-700"
                       />
                       Attendance compliance being monitored this week.
                     </li>
                     <li className="flex gap-3 items-start">
                       <IconBadge
                         icon={FileText}
                         color="border-purple-300 bg-purple-50 text-purple-700"
                       />
                       Training completion deadline approaching.
                     </li>
                   </ul>
                 </Card>
       
                 <Card title="Pending Actions">
                   <ul className="space-y-2 text-sm">
                     <li>• 3 leave requests awaiting approval</li>
                     <li>• 5 KPI submissions pending review</li>
                   </ul>
                 </Card>
               </div>
             </div>
           </div>
      ) : (

  <div>
    {/* ================= MY OVERVIEW ================= */}
<div className="space-y-8">

  {/* My Widgets */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <Widget
      title="My KPI Score"
      value={`${myData.kpi}%`}
      sub="Current evaluation"
      icon={FileText}
      color="border-purple-400 bg-purple-50 text-purple-700"
    />
    <Widget
      title="Assigned Tranings"
      value={`${myData.trainingCount}`}
      sub="Current evaluation"
      icon={GraduationCap}
      color="border-purple-400 bg-purple-50 text-purple-700"
    />

    <Widget
      title="Present Days"
      value={myData.attendance.present}
      sub="This period"
      icon={CheckCircle2}
      color="border-green-400 bg-green-50 text-green-700"
    />

    <Widget
      title="Late Days"
      value={myData.attendance.late}
      sub="Needs attention"
      icon={AlertTriangle}
      color="border-yellow-400 bg-yellow-50 text-yellow-700"
    />
  </div>

  {/* My Notices */}
  <Card title="My Notices & Alerts">
    {myData.notices.length > 0 ? (
      <ul className="space-y-4">
        {myData.notices.map((notice, i) => (
          <li
            key={i}
            className="flex gap-4 items-start p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
          >
            <IconBadge
              icon={Megaphone}
              color="border-gray-400 bg-white text-gray-700"
            />
            <div className="text-sm text-gray-700 leading-relaxed">
              {notice}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-400">
        No personal notices at the moment.
      </p>
    )}
  </Card>

</div>
  </div>
      )}
    </div>
  );
}