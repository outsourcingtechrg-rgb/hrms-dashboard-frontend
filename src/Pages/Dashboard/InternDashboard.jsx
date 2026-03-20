import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function InternDashboard() {
  /* ---------------- Training Item ---------------- */
  function TrainingItem({ title, time, assignedTo, progress }) {
    return (
      <div className="flex flex-col border-b last:border-0 pb-3">
        <div className="flex justify-between items-center mb-1">
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-xs text-gray-400">{time}</p>
          </div>
          <span className="text-xs text-blue-500">{progress}% Complete</span>
        </div>
        <p className="text-xs text-gray-500">Assigned to: {assignedTo}</p>
      </div>
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
            className={`text-sm leading-relaxed ${acknowledged ? "line-through text-gray-400" : "text-gray-600"}`}
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
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
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
    return (
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={attendanceData}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, 1]} />
            <Tooltip
              formatter={(v) => (v === 1 ? "Present" : "Absent")}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                fontSize: "12px",
              }}
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
    );
  }

  /* ---------------- Render Dashboard ---------------- */
  return (
    <div className="min-h-screen bg-[#f9fafb] px-8 py-10 text-gray-900">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome  <span className="text-blue-500">Ehsan</span> </h1>
        <p className="text-sm text-gray-500 mt-1">
          Intern HRMS • {new Date().toDateString()}
        </p>
      </header>

      {/* Top Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Today's Status Widget */}
        <Widget
          title="Today's Status"
          value="Present"
          sub="You checked in at 9:02 AM, all set for today!"
        />

        {/* Attendance Widget */}
        <Widget
          title="Attendance"
          value="92%"
          sub="Your attendance this month is 92%, keep it up!"
        />

        {/* Trainings Assigned Widget */}
        <Widget
          title="Trainings Assigned"
          value="2"
          sub="You have 2 trainings scheduled for today."
        />
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT SECTION */}
        <div className="lg:col-span-2 space-y-8">
          {/* Attendance Chart */}
          <Card title="Daily Attendance (This Week)">
            <AttendanceChart />
          </Card>

          {/* Training */}
          <Card title="Assigned Training (Today)">
            <TrainingItem
              title="React Fundamentals"
              time="11:00 AM – 12:30 PM"
              assignedTo="Ehsan"
              progress={50}
            />
            <TrainingItem
              title="Git & GitHub Workflow"
              time="3:00 PM – 4:00 PM"
              assignedTo="Ehsan"
              progress={20}
            />
          </Card>
        </div>

        {/* NOTICE BOARD */}
        <div className="lg:col-span-2">
          <Card title="Notice Board">
            <div className="space-y-5">
              <Notice
                role="CEO"
                message="Company town hall on Friday at 4 PM."
              />
              <Notice
                role="HR"
                message="Updated attendance policy effective next week."
              />
              <Notice
                role="Management"
                message="Intern evaluations start Monday."
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
