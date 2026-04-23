import {
  BadgeCheck,
  LogOut,
  Mail,
  Shield,
  Bell,
  Clock,
  Zap,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { API } from "./Apis";
import RetroClock from "./RetroClock";

const ROLE_LABELS = {
  1: "Super Admin",
  2: "CEO",
  3: "HR Admin",
  4: "HR Officer",
  5: "Finance Head",
  6: "Department Head",
  7: "Lead",
  8: "Employee",
  9: "Intern",
};

function LiveClock() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "12px",
        background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)",
        color: "#ffffff",
        fontFamily: "'DM Mono', monospace",
        fontSize: "13px",
        fontWeight: "600",
        boxShadow: "0 4px 12px rgba(211, 47, 47, 0.3)",
        letterSpacing: "0.05em",
      }}
    >
      <Clock size={14} style={{ opacity: 0.9 }} />
      <span>
        {hours}:{minutes}:{seconds}
      </span>
    </div>
  );
}

function decodeAuthToken() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function buildFallbackUser(auth) {
  const fullName =
    auth?.name ||
    auth?.full_name ||
    [auth?.f_name, auth?.l_name].filter(Boolean).join(" ") ||
    auth?.username ||
    "Current User";
  const email = auth?.email || auth?.user_email || "No email available";
  const level = Number(auth?.level ?? auth?.role_level ?? 0);
  const role = ROLE_LABELS[level] || (level ? `Level ${level}` : "Active User");
  const employeeCode = auth?.employee_id || auth?.id || auth?.sub || "N/A";
  const employeeDbId =
    auth?.EPI ?? auth?.employee_id ?? auth?.id ?? auth?.sub ?? null;
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CU";

  return {
    fullName,
    email,
    role,
    employeeCode,
    employeeDbId,
    image: "",
    initials,
  };
}

export default function Navbar({ setIsOpen, onLogout }) {
  const navigate = useNavigate();
  const auth = React.useMemo(() => decodeAuthToken(), []);
  const fallbackUser = React.useMemo(() => buildFallbackUser(auth), [auth]);
  const [open, setOpen] = React.useState(false);
  const [user, setUser] = React.useState(fallbackUser);
  const [imageError, setImageError] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    const employeeDbId =
      auth?.EPI ?? auth?.employee_id ?? auth?.id ?? auth?.sub;
    if (!token || !employeeDbId) return;

    let ignore = false;

    async function loadCurrentUser() {
      try {
        const res = await fetch(API.employeeDetails(employeeDbId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const employee = await res.json();
        if (ignore) return;

        const fullName =
          [employee?.f_name, employee?.l_name].filter(Boolean).join(" ") ||
          employee?.name ||
          fallbackUser.fullName;

        let imageUrl = employee?.image || employee?.profile_image || "";

        // Handle relative vs absolute URLs
        if (imageUrl) {
          // If it's a relative path, prepend the API base URL
          if (
            !imageUrl.startsWith("http://") &&
            !imageUrl.startsWith("https://") &&
            !imageUrl.startsWith("data:")
          ) {
            const apiBase = "http://127.0.0.1:8000";
            imageUrl = imageUrl.startsWith("/")
              ? apiBase + imageUrl
              : apiBase + "/" + imageUrl;
          }
        }

        // Only set image error if there's truly no image
        setImageError(!imageUrl);

        setUser((prev) => ({
          ...prev,
          fullName,
          email: employee?.email || prev.email,
          image: imageUrl,
          employeeCode:
            employee?.employee_id || employee?.id || prev.employeeCode,
          employeeDbId: employee?.id || prev.employeeDbId,
          initials:
            fullName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("") || prev.initials,
        }));
      } catch {
        // Keep token-based fallback values
        setImageError(true);
      }
    }

    loadCurrentUser();
    return () => {
      ignore = true;
    };
  }, [
    auth?.EPI,
    auth?.employee_id,
    auth?.id,
    auth?.sub,
    fallbackUser.fullName,
  ]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    if (onLogout) {
      onLogout();
      return;
    }
    navigate("/login", { replace: true });
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .hrms-navbar {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          height: 72px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fb 100%);
          border-bottom: 1px solid #e8ecf1;
          position: relative;
          z-index: 50;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .hrms-navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hrms-menu-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50px;
          color: #d32f2f;
          transition: all 0.2s;
        }

        .hrms-menu-btn:hover {
          background: rgba(211, 47, 47, 0.1);
        }

        @media (max-width: 768px) {
          .hrms-menu-btn { display: flex; }
          .hrms-title-sub { display: none; }
          .hrms-navbar-center { display: none; }
        }

        .hrms-title-block h1 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          background: linear-gradient(135deg, #1a1a1a 0%, #d32f2f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .hrms-title-block p {
          margin: 0;
          font-size: 11px;
          color: #d32f2f;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hrms-navbar-center {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .hrms-navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .hrms-icon-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }

        .hrms-icon-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #d32f2f;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .hrms-profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px 6px 6px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: 4px;
        }

        .hrms-profile-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .hrms-avatar {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1a1a1a 0%, #d32f2f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: white;
          letter-spacing: 0.02em;
          flex-shrink: 0;
          overflow: hidden;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(211, 47, 47, 0.3);
          position: relative;
        }

        .hrms-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
        }

        .hrms-profile-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 0;
        }

        @media (max-width: 640px) {
          .hrms-profile-text { display: none; }
        }

        .hrms-profile-name {
          font-size: 13px;
          font-weight: 700;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .hrms-profile-role {
          font-size: 10px;
          color: #d32f2f;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Dropdown */
        .hrms-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 300px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafb 100%);
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          animation: dropIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(10px);
        }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }

        .hrms-dropdown-header {
          padding: 18px;
          background: linear-gradient(135deg, #1a1a1a 0%, #d32f2f 100%);
          border-bottom: none;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }

        .hrms-dropdown-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(10px);
        }

        .hrms-dropdown-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
        }

        .hrms-dropdown-name {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hrms-role-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          color: white;
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .hrms-dropdown-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .hrms-info-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
        }

        .hrms-info-row:hover {
          background: #eef2ff;
          border-color: #cffafe;
        }

        .hrms-info-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1a1a1a 0%, #d32f2f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #fff;
        }

        .hrms-info-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #d32f2f;
          margin: 0 0 2px;
        }

        .hrms-info-value {
          font-size: 13px;
          color: #1f2937;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 600;
        }

        .hrms-dropdown-footer {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .hrms-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #1a1a1a 0%, #d32f2f 100%);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          letter-spacing: 0.01em;
          text-transform: uppercase;
        }

        .hrms-logout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(211, 47, 47, 0.4);
        }

        .hrms-logout-btn:active {
          transform: translateY(0);
        }
      `}</style>

      <nav className="hrms-navbar">
        {/* Left */}
        <div className="hrms-navbar-left">
          <button className="hrms-menu-btn" onClick={() => setIsOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect
                y="3"
                width="18"
                height="1.5"
                rx="0.75"
                fill="currentColor"
              />
              <rect
                y="8.25"
                width="12"
                height="1.5"
                rx="0.75"
                fill="currentColor"
              />
              <rect
                y="13.5"
                width="18"
                height="1.5"
                rx="0.75"
                fill="currentColor"
              />
            </svg>
          </button>

          <div className="hrms-title-block">
            <h1>HRMS Dashboard</h1>
            <p className="hrms-title-sub">Signed in as {user.role}</p>
          </div>
        </div>

        {/* Center - Clock */}
        <div className="hrms-navbar-center">
          {/* <LiveClock /> */}
          <RetroClock />
        </div>

        {/* Right */}
        <div className="hrms-navbar-right" ref={dropdownRef}>
          <button
            className="hrms-profile-btn"
            onClick={() => setOpen((prev) => !prev)}
          >
            <div className="hrms-avatar">
              {!imageError && user.image ? (
                <img
                  src={user.image}
                  alt={user.fullName}
                  onError={() => {
                    console.error("Image failed to load:", user.image);
                    setImageError(true);
                  }}
                  onLoad={() => {
                    setImageError(false);
                  }}
                />
              ) : (
                user.initials
              )}
            </div>
            <div className="hrms-profile-text">
              <span className="hrms-profile-name">{user.fullName}</span>
              <span className="hrms-profile-role">{user.role}</span>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ color: "#e8502a", flexShrink: 0 }}
            >
              <path
                d="M3 5l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {open && (
            <div className="hrms-dropdown">
              <div className="hrms-dropdown-header">
                <div className="hrms-dropdown-avatar">
                  {!imageError && user.image ? (
                    <img
                      src={user.image}
                      alt={user.fullName}
                      onError={() => {
                        console.error(
                          "Dropdown image failed to load:",
                          user.image,
                        );
                        setImageError(true);
                      }}
                      onLoad={() => {
                        setImageError(false);
                      }}
                    />
                  ) : (
                    user.initials
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p className="hrms-dropdown-name">{user.fullName}</p>
                  <span className="hrms-role-badge">{user.role}</span>
                </div>
              </div>

              <div className="hrms-dropdown-body">
                <div className="hrms-info-row">
                  <div className="hrms-info-icon">
                    <Mail size={13} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="hrms-info-label">Email</p>
                    <p className="hrms-info-value">{user.email}</p>
                  </div>
                </div>

                <div className="hrms-info-row">
                  <div className="hrms-info-icon">
                    <Shield size={13} />
                  </div>
                  <div>
                    <p className="hrms-info-label">Role</p>
                    <p className="hrms-info-value">{user.role}</p>
                  </div>
                </div>

                <div className="hrms-info-row">
                  <div className="hrms-info-icon">
                    <BadgeCheck size={13} />
                  </div>
                  <div>
                    <p className="hrms-info-label">Employee Code</p>
                    <p className="hrms-info-value">{user.employeeCode}</p>
                  </div>
                </div>
              </div>

              <div className="hrms-dropdown-footer">
                <button className="hrms-logout-btn" onClick={handleLogout}>
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
