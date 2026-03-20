import React from "react";
import {
  Bar,
  Line,
  Pie
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function CEODashboard() {
  // Sample data
  const attendanceData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        label: "Present",
        data: [40, 42, 38, 45, 41],
        backgroundColor: "rgba(34,197,94,0.7)"
      },
      {
        label: "Late",
        data: [5, 3, 6, 4, 2],
        backgroundColor: "rgba(234,179,8,0.7)"
      },
      {
        label: "Absent",
        data: [2, 1, 3, 2, 4],
        backgroundColor: "rgba(239,68,68,0.7)"
      }
    ]
  };

  const performanceData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Avg Performance %",
        data: [75, 78, 80, 82, 79, 85],
        borderColor: "rgba(59,130,246,1)",
        backgroundColor: "rgba(59,130,246,0.3)",
        fill: true
      }
    ]
  };

  const departmentData = {
    labels: ["Engineering", "HR", "Sales", "Marketing"],
    datasets: [
      {
        data: [45, 10, 20, 25],
        backgroundColor: [
          "rgba(34,197,94,0.7)",
          "rgba(59,130,246,0.7)",
          "rgba(234,179,8,0.7)",
          "rgba(239,68,68,0.7)"
        ]
      }
    ]
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">CEO Dashboard</h1>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Attendance */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Weekly Attendance</h2>
          <Bar data={attendanceData} />
        </div>

        {/* Performance */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Performance Trend</h2>
          <Line data={performanceData} />
        </div>

        {/* Department Distribution */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Department Distribution</h2>
          <Pie data={departmentData} />
        </div>

        {/* Recent Activities */}
        <div className="bg-white p-4 rounded shadow col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold mb-2">Recent Activities</h2>
          <ul className="space-y-2 text-sm">
            <li>John Doe submitted leave request (10 mins ago)</li>
            <li>Jane Smith completed training module (1 hour ago)</li>
            <li>Mike Johnson checked in late (2 hours ago)</li>
            <li>Sarah Williams updated KPI progress (3 hours ago)</li>
          </ul>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Upcoming Events</h2>
          <ul className="space-y-2 text-sm">
            <li>Team Meeting: Today, 2:00 PM</li>
            <li>Performance Review Deadline: Tomorrow</li>
            <li>Company Town Hall: Feb 20, 10:00 AM</li>
            <li>Training Session: Feb 22, 9:00 AM</li>
          </ul>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Pending Approvals</h2>
          <ul className="space-y-2 text-sm">
            <li>Leave Requests: 8 awaiting approval</li>
            <li>Document Reviews: 4 pending signature</li>
            <li>KPI Updates: 12 ready to review</li>
          </ul>
        </div>

       
      </div>
    </div>
  );
}
