import React, { useState } from "react";
import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import { Outlet } from "react-router-dom";

export default function PageRender({ sidebarItems, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        sidebarItems={sidebarItems}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:ml-20" : "md:ml-60"
        }`}
      >
        <Navbar setIsOpen={setIsOpen} onLogout={onLogout} />

        <Outlet />
      </div>
    </div>
  );
}
