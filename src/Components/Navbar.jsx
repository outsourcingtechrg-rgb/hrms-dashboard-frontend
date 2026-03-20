import { LogOut } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
export default function Navbar({ setIsOpen, onLogout }) {
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(false);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: manual redirect and reload
      navigate("/login", { replace: true });
      setTimeout(() => window.location.reload(), 100);
    }
  };

  return (
    <div className="relative flex items-center justify-between bg-white px-4 md:px-6 py-4 shadow">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile only) */}
        <button className="md:hidden text-2xl" onClick={() => setIsOpen(true)}>
          ☰
        </button>

        <h1 className="text-lg md:text-xl font-semibold">HRMS Dashboard</h1>
      </div>

      {/* Right */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 focus:outline-none cursor-pointer"
        >
          <span className="text-sm text-gray-600 hidden sm:block">Admin</span>
          <img
            src="https://i.pravatar.cc/40"
            alt="Admin profile"
            className="h-9 w-9 rounded-full border"
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white shadow-lg border z-50">
            {/* Profile Info */}
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">Admin</p>
              <p className="text-xs text-gray-500 truncate">
                admin@company.com
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded NavButtonColors transition bg-gray-800 text-white font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
