import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BookOpen, FileText, CalendarCheck, BarChart2 } from "lucide-react";

export default function LeadDashboard() {
  /* ---------------- Training Item ---------------- */
  function TrainingItem({ title, time, assignedTo, progress }) {
    return (
      <div className="flex flex-col border-b last:border-0 pb-3">
        <div className="flex justify-between items-center mb-1">
          <div>
            <p className="font-medium">{title}</p>
            {/* <p className="text-xs text-gray-400">{time}</p> */}
          </div>
          <span className="text-xs text-blue-500">{progress}% Complete</span>
        </div>
        <p className="text-xs text-gray-500">Assigned to: {assignedTo}</p>
      </div>
    );
  }

  function PolicyItem({ name }) {
  const [read, setRead] = React.useState(false);

  return (
    <li
      className="flex items-center justify-between gap-2 p-3 rounded hover:bg-gray-100 cursor-pointer"
      onClick={() => setRead(true)}
    >
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-500" />
        <span className={`${read ? "text-gray-400 line-through" : ""}`}>
          {name}
        </span>
      </div>
      <span
        className={`text-xs font-medium px-2 py-1 rounded-full ${
          read ? "bg-gray-200 text-gray-500" : "bg-red-100 text-red-600"
        }`}
      >
        {read ? "Read" : "Unread"}
      </span>
    </li>
  );
}
  /* ---------------- Notice ---------------- */
  function Notice({ role, message }) {
    const [acknowledged, setAcknowledged] = React.useState(false);
    const roleColors = {
      CEO: "bg-purple-100 text-purple-600",
      HR: "bg-green-100 text-green-600",
      Management: "bg-blue-100 text-blue-600",
    };
    return (
      <div className="flex justify-between items-start p-3 rounded-lg bg-gray-50">
        <div className="flex gap-4 items-start">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${roleColors[role]}`}
          >
            {role}
          </span>
          <p
            className={`text-sm leading-relaxed ${
              acknowledged ? "line-through text-gray-400" : "text-gray-600"
            }`}
          >
            {message}
          </p>
        </div>
        {!acknowledged && (
          <button
            onClick={() => setAcknowledged(true)}
            className="text-xs text-blue-500 font-medium hover:underline"
          >
            Acknowledge
          </button>
        )}
        {acknowledged && (
          <span className="text-xs text-green-600 font-medium">
            Acknowledged
          </span>
        )}
      </div>
    );
  }

  /* ---------------- Widget ---------------- */
  function Widget({ title, value, sub }) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-semibold">{value}</h3>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
  const attendanceData = [
    { day: "Mon", present: 1 },
    { day: "Tue", present: 1 },
    { day: "Wed", present: 0 },
    { day: "Thu", present: 1 },
    { day: "Fri", present: 1 },
  ];

 function AttendanceChart() {
  const [view, setView] = React.useState("daily"); // daily or monthly

  // Dummy data
  const dailyData = [
    { day: "Mon", present: 1 },
    { day: "Tue", present: 1 },
    { day: "Wed", present: 0 },
    { day: "Thu", present: 1 },
    { day: "Fri", present: 1 },
  ];

  const monthlyData = [
    { day: "Week 1", present: 5 },
    { day: "Week 2", present: 4 },
    { day: "Week 3", present: 5 },
    { day: "Week 4", present: 5 },
  ];

  const data = view === "daily" ? dailyData : monthlyData;

  return (
    <div>
      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("daily")}
          className={`px-4 py-1 rounded-lg font-medium cursor-pointer ${
            view === "daily" ? "bg-red-700 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setView("monthly")}
          className={`px-4 py-1 rounded-lg font-medium cursor-pointer ${
            view === "monthly" ? "bg-red-700 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, view === "daily" ? 1 : 5]} />
            <Tooltip
              formatter={(v) =>
                view === "daily" ? (v === 1 ? "Present" : "Absent") : `${v} days present`
              }
              contentStyle={{ borderRadius: "12px", border: "none", fontSize: "12px" }}
            />
            <Line
              type="monotone"
              dataKey="present"
              stroke="#16a34a"
              strokeWidth={2.5}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

  /* ---------------- Dummy Data ---------------- */
  const trainings = [
    {
      title: "React Advanced",
      time: "10:00 AM – 11:30 AM",
      assignedTo: "Ehsan",
      progress: 70,
    },
    {
      title: "Effective Communication",
      time: "2:00 PM – 3:00 PM",
      assignedTo: "Ehsan",
      progress: 30,
    },
  ];

  const courses = [
    "Python Basics",
    "Git & GitHub Workflow",
    "Data Security Training",
    "Workplace Ethics",
  ];

  const notices = [
    { role: "CEO", message: "Quarterly town hall meeting on Friday." },
    { role: "HR", message: "Updated leave policy available in portal." },
    { role: "Management", message: "Performance review starts next week." },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb] px-8 py-10 text-gray-900">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome <span className="text-blue-500">Ehsan</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lead HRMS • {new Date().toDateString()}
        </p>
      </header>

      {/* Top Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Widget
          title="Today's Status"
          value="Present"
          sub="Checked in at 9:02 AM"
        />
        <Widget title="Attendance" value="92%" sub="Monthly Attendance" />
        <Widget title="Assigned Courses" value="1" sub="You are Teacher" />
        <Widget
          title="KPI Score"
          value="82%"
          sub="Current Month KPI Score "
        />
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT SECTION */}
        <div className="lg:col-span-2 space-y-8">
          {/* Attendance Chart */}
          <Card title="Weekly Attendance">
            <AttendanceChart />
          </Card>

          {/* Trainings */}
          <Card title="Assigned Trainings">
            {trainings.map((t, idx) => (
              <TrainingItem key={idx} {...t} />
            ))}
          </Card>

          {/* Courses */}
          <Card title="Courses / Learning">
            <ul className="space-y-2">
              {courses.map((course, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 p-3 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <BookOpen className="w-5 h-5 text-yellow-500" />
                  <span>{course}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* RIGHT SECTION */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notice Board */}
          <Card title="Notice Board">
            <div className="space-y-4">
              {notices.map((n, idx) => (
                <Notice key={idx} {...n} />
              ))}
            </div>
          </Card>

          {/* Policies Quick Access */}
          <Card title="Policies">
            <ul className="space-y-2">
              {[
                { name: "Leave Policy", id: 1 },
                { name: "Attendance Policy", id: 2 },
                { name: "Training & Learning Policy", id: 3 },
              ].map((policy) => (
                <PolicyItem key={policy.id} name={policy.name} />
              ))}
            </ul>
          </Card>

          {/* KPI Overview */}
          <Card title="KPI Overview">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Project Completion</span>
                <span>80%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: "80%" }}
                />
              </div>

              <div className="flex justify-between text-sm mt-2">
                <span>Task Efficiency</span>
                <span>65%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-yellow-500 rounded-full"
                  style={{ width: "65%" }}
                />
              </div>

              <div className="flex justify-between text-sm mt-2">
                <span>Training Completion</span>
                <span>50%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: "50%" }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
