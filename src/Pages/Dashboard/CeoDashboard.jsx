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
  AlertCircle,
  TrendingUp,
  GraduationCap,
  Shield,
  Ticket,
} from "lucide-react";

/* ---------------- Widget ---------------- */
function Widget({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h3 className="text-2xl font-semibold mt-1">{value}</h3>
      </div>
      <Icon className={`w-8 h-8 ${color}`} />
    </div>
  );
}

/* ---------------- Card ---------------- */
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-sm font-medium text-gray-500 mb-4">{title}</h2>
      {children}
    </div>
  );
}


/* ---------------- Attendance Chart ---------------- */
function AttendanceBarChart() {
  const [view, setView] = React.useState("weekly");

  const weeklyData = [
    { label: "Mon", present: 110, late: 12, absent: 6 },
    { label: "Tue", present: 115, late: 9, absent: 4 },
    { label: "Wed", present: 108, late: 14, absent: 6 },
    { label: "Thu", present: 112, late: 10, absent: 6 },
    { label: "Fri", present: 118, late: 7, absent: 3 },
  ];

  const monthlyData = [
    { label: "Week 1", present: 520, late: 48, absent: 20 },
    { label: "Week 2", present: 540, late: 36, absent: 16 },
    { label: "Week 3", present: 510, late: 52, absent: 26 },
    { label: "Week 4", present: 560, late: 30, absent: 12 },
  ];

  const yearlyData = [
    { label: "Jan", present: 2100, late: 180, absent: 90 },
    { label: "Feb", present: 2050, late: 200, absent: 110 },
    { label: "Mar", present: 2200, late: 150, absent: 80 },
    { label: "Apr", present: 2150, late: 160, absent: 95 },
    { label: "May", present: 2300, late: 140, absent: 70 },
  ];

  const data =
    view === "weekly"
      ? weeklyData
      : view === "monthly"
      ? monthlyData
      : yearlyData;

  return (
    <>
      {/* Switcher */}
      <div className="flex gap-2 mb-4">
        {["weekly", "monthly", "yearly"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              view === v
                ? "bg-red-700 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="late" fill="#eab308" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* ---------------- CEO Dashboard ---------------- */
export default function CEODashboard() {
  return (
    <div className="min-h-screen bg-[#f9fafb] px-8 py-10 text-gray-900">
      
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-semibold">CEO Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Company Overview • {new Date().toDateString()}
        </p>
      </header>

      {/* Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Widget
          title="Total Employees"
          value="128"
          icon={Users}
          color="text-blue-600"
        />
        <Widget
          title="Present (On Time)"
          value="112"
          icon={Clock}
          color="text-green-600"
        />
        <Widget
          title="Late Employees"
          value="10"
          icon={AlertCircle}
          color="text-yellow-500"
        />
        <Widget
          title="Overall KPI"
          value="86%"
          icon={TrendingUp}
          color="text-purple-600"
        />
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left */}
        <div className="lg:col-span-2 space-y-8">
          <Card title="Weekly Attendance Overview">
            <AttendanceBarChart />
          </Card>

          <Card title="Training & Courses Overview">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  Active Trainings
                </span>
                <span>12</span>
              </div>
              <div className="flex justify-between">
                <span>Employees Enrolled</span>
                <span>89</span>
              </div>
              <div className="flex justify-between">
                <span>Completion Rate</span>
                <span>78%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Recent Notices">
            <ul className="space-y-3 text-sm">
              <li>📢 Attendance policy updated</li>
              <li>📢 Quarterly town hall scheduled</li>
              <li>📢 KPI review cycle started</li>
            </ul>
          </Card>

          <Card title="Policies Status">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Attendance Policy
                </span>
                <span className="text-green-600">Reviewed</span>
              </li>
              <li className="flex justify-between">
                <span>Leave Policy</span>
                <span className="text-green-600">Reviewed</span>
              </li>
              <li className="flex justify-between">
                <span>Training Policy</span>
                <span className="text-yellow-600">Pending</span>
              </li>
            </ul>
          </Card>

          <Card title="Quick Insights">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> New Hires
                </span>
                <span>+5 this month</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Leaves This Month
                </span>
                <span>42</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}