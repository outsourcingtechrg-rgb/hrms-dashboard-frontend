import React, { useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
// import StatCard from "../Components/StatCard";
import { UserCheck, BookOpen, LineChart, Calendar } from "lucide-react";
import { Outlet } from "react-router-dom";

export default function PageRender({ sidebarItems, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const metricsData = [
    { label: "Attendance", value: "98%", change: 5.2, icon: UserCheck },
    { label: "Trainings Completed", value: 5, change: 5.2, icon: BookOpen },
    { label: "Performance", value: "82%", change: 5.2, icon: LineChart },
    { label: "Days Remaining", value: 45, change: 5.2, icon: Calendar },
  ];
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        sidebarItems={sidebarItems}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <Navbar setIsOpen={setIsOpen} onLogout={onLogout} />

        <Outlet />
      </div>
    </div>
  );
}
