import { BadgeCheck, LogOut, Mail, Shield } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { API } from "./Apis";

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
  const employeeDbId = auth?.EPI ?? auth?.employee_id ?? auth?.id ?? auth?.sub ?? null;
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

  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    const employeeDbId = auth?.EPI ?? auth?.employee_id ?? auth?.id ?? auth?.sub;
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

        setUser((prev) => ({
          ...prev,
          fullName,
          email: employee?.email || prev.email,
          image: employee?.image || "",
          employeeCode: employee?.employee_id || employee?.id || prev.employeeCode,
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
        // Keep token-based fallback values if profile fetch fails.
      }
    }

    loadCurrentUser();
    return () => {
      ignore = true;
    };
  }, [auth?.EPI, auth?.employee_id, auth?.id, auth?.sub, fallbackUser.fullName]);

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
    <div className="relative flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur md:px-6 z-50">
      <div className="flex items-center gap-3">
        <button className="text-2xl md:hidden" onClick={() => setIsOpen(true)}>
          ☰
        </button>

        <div>
          <h1 className="text-lg font-semibold text-gray-900 md:text-xl">HRMS Dashboard</h1>
          <p className="hidden text-xs text-gray-500 sm:block">Signed in as {user.role}</p>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-red-200 hover:bg-red-50 focus:outline-none"
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.fullName}
              className="h-10 w-10 rounded-full border border-gray-200 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-sm font-semibold text-white shadow-sm">
              {user.initials}
            </div>
          )}

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-gray-900">{user.fullName}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-4">
              <div className="flex items-center gap-3">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.fullName}
                    className="h-12 w-12 rounded-full border border-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-base font-semibold text-white">
                    {user.initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.fullName}</p>
                  <p className="truncate text-xs text-gray-600">{user.role}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-4 py-4">
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Email</p>
                  <p className="truncate text-sm text-gray-700">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Role</p>
                  <p className="text-sm text-gray-700">{user.role}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Employee Code</p>
                  <p className="text-sm text-gray-700">{user.employeeCode}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 p-3">
              <button
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-black"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
