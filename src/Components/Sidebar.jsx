import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/rig.png";
import { ArrowBigRight } from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen, sidebarItems = [] }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  // 🔹 Split sections
  const mainItems = sidebarItems.filter((item) => !item.my);
  const myItems = sidebarItems.filter((item) => item.my);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          w-64 bg-[rgba(255,244,240,0.95)]
          border-r border-gray-200 rounded-r-2xl
          shadow-lg flex flex-col
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[rgba(176,41,0,0.3)]">
          <img src={logo} alt="Rig Logo" className="w-24 mx-auto" />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

          {/* MAIN SECTION */}
          <Section title="Main">
            {mainItems.map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                onClick={handleNavigate}
              />
            ))}
          </Section>

          {/* MY SECTION (only if exists) */}
          {myItems.length > 0 && (
            <Section title="My">
              {myItems.map((item) => (
                <SidebarItem
                  key={item.label}
                  item={item}
                  onClick={handleNavigate}
                />
              ))}
            </Section>
          )}
        </div>
      </aside>
    </>
  );
}

/* ===================== */
/* 🔹 Section Wrapper */
/* ===================== */
function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3 tracking-wider">
        {title}
      </h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

/* ===================== */
/* 🔹 Sidebar Item */
/* ===================== */
function SidebarItem({ item, onClick }) {
  const Icon = item.icon;

  return (
    <li
      onClick={() => onClick(item.path)}
      className="
        group flex items-center gap-3
        px-4 py-3 rounded-lg cursor-pointer
        border border-transparent
        hover:bg-red-500 hover:border-red-700
        transition
      "
    >
      {/* Icon */}
      <div
        className="
          w-9 h-9 flex items-center justify-center
          rounded-lg border border-gray-400
          bg-gray-100 group-hover:bg-white
        "
      >
        <Icon className="w-5 h-5 text-gray-700" />
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-gray-800 flex-1">
        {item.label}
      </span>

      <ArrowBigRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700" />
    </li>
  );
}